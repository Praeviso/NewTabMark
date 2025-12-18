import { calculateRelevance } from './relevance.js';

const USER_BEHAVIOR_KEY = 'userSearchBehavior';
const MAX_BEHAVIOR_ENTRIES = 1000;

const RELEVANCE_CONFIG = {
  timeDecayHalfLife: 60,
  bookmarkRelevanceBoost: 1.2
};

function searchHistory(query, maxResults = 200) {
  return new Promise((resolve) => {
    const startTime = Date.now() - (30 * 24 * 60 * 60 * 1000);
    chrome.history.search(
      {
        text: query,
        startTime,
        maxResults
      },
      (results) => {
        const uniqueResults = Array.from(new Set(results.map(r => r.url)))
          .map(url => results.find(r => r.url === url));
        resolve(uniqueResults);
      }
    );
  });
}

export async function getRecentHistory(limit = 100, maxPerDomain = 5) {
  return new Promise((resolve) => {
    chrome.history.search({ text: '', maxResults: limit * 20 }, (historyItems) => {
      const now = Date.now();
      const domainCounts = {};
      const uniqueItems = new Map();

      const recentHistory = historyItems
        .map(item => {
          const url = new URL(item.url);
          const domain = url.hostname;
          return {
            text: item.title,
            url: item.url,
            domain,
            type: 'history',
            relevance: 1,
            timestamp: item.lastVisitTime
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp)
        .filter(item => {
          const key = `${item.url}|${item.text}`;
          if (uniqueItems.has(key)) return false;

          domainCounts[item.domain] = (domainCounts[item.domain] || 0) + 1;
          if (domainCounts[item.domain] > maxPerDomain) return false;

          uniqueItems.set(key, item);
          return true;
        })
        .map(item => {
          const daysSinceLastVisit = (now - item.timestamp) / (1000 * 60 * 60 * 24);
          item.relevance *= Math.exp(-daysSinceLastVisit / RELEVANCE_CONFIG.timeDecayHalfLife);
          return item;
        })
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit);

      resolve(recentHistory);
    });
  });
}

async function getUserBehavior() {
  return new Promise((resolve) => {
    chrome.storage.local.get(USER_BEHAVIOR_KEY, (result) => {
      const behavior = result[USER_BEHAVIOR_KEY] || {};
      resolve(behavior);
    });
  });
}

export async function saveUserBehavior(key, increment = 1) {
  const behavior = await getUserBehavior();
  const now = Date.now();

  if (!behavior[key]) {
    behavior[key] = { count: 0, lastUsed: now };
  }

  behavior[key].count += increment;
  behavior[key].lastUsed = now;

  if (Object.keys(behavior).length > MAX_BEHAVIOR_ENTRIES) {
    const sortedEntries = Object.entries(behavior)
      .sort(([, a], [, b]) => a.lastUsed - b.lastUsed);
    sortedEntries
      .slice(0, sortedEntries.length - MAX_BEHAVIOR_ENTRIES)
      .forEach(([oldKey]) => {
        delete behavior[oldKey];
      });
  }

  return new Promise((resolve) => {
    chrome.storage.local.set({ [USER_BEHAVIOR_KEY]: behavior }, resolve);
  });
}

async function calculateUserRelevance(suggestions) {
  const behavior = await getUserBehavior();
  const now = Date.now();

  return suggestions.map(suggestion => {
    const key = suggestion.url || suggestion.text;
    const behaviorData = behavior[key];

    if (!behaviorData) return { ...suggestion, userRelevance: suggestion.relevance };

    const daysSinceLastUse = (now - behaviorData.lastUsed) / (1000 * 60 * 60 * 24);
    const recencyFactor = Math.exp(-daysSinceLastUse / 30);
    const behaviorScore = behaviorData.count * recencyFactor;

    return {
      ...suggestion,
      userRelevance: suggestion.relevance * (1 + behaviorScore * 0.1)
    };
  });
}

async function balanceResults(suggestions, maxResults) {
  const currentSuggestion = suggestions.filter(s => s.type === 'search');
  let bookmarks = suggestions.filter(s => s.type === 'bookmark');
  let histories = suggestions.filter(s => s.type === 'history');
  let bingSuggestions = suggestions.filter(s => s.type === 'bing_suggestion');

  const now = Date.now();
  histories = histories.map(h => {
    const daysSinceLastVisit = (now - h.timestamp) / (1000 * 60 * 60 * 24);
    if (daysSinceLastVisit < 7) {
      h.relevance *= 1.5;
    }
    h.relevance *= Math.exp(-daysSinceLastVisit / RELEVANCE_CONFIG.timeDecayHalfLife);
    return h;
  });

  bookmarks = bookmarks.map(b => {
    b.relevance *= RELEVANCE_CONFIG.bookmarkRelevanceBoost;
    return b;
  });

  bookmarks.sort((a, b) => b.relevance - a.relevance);
  histories.sort((a, b) => b.relevance - a.relevance);
  bingSuggestions.sort((a, b) => b.relevance - a.relevance);

  const results = [...currentSuggestion];
  const maxEachType = Math.floor((maxResults - 1) / 4);

  for (let i = 0; i < maxEachType * 4; i++) {
    if (i % 4 === 0 && bookmarks.length > 0) {
      results.push(bookmarks.shift());
    } else if (i % 4 === 1 && histories.length > 0) {
      results.push(histories.shift());
    } else if (i % 4 === 2 && bingSuggestions.length > 0) {
      results.push(bingSuggestions.shift());
    } else if (histories.length > 0) {
      results.push(histories.shift());
    }
  }

  while (
    results.length < maxResults &&
    (bookmarks.length > 0 || histories.length > 0 || bingSuggestions.length > 0)
  ) {
    if (bookmarks.length === 0) {
      if (histories.length === 0) {
        results.push(bingSuggestions.shift());
      } else if (bingSuggestions.length === 0) {
        results.push(histories.shift());
      } else {
        results.push(
          histories[0].relevance > bingSuggestions[0].relevance
            ? histories.shift()
            : bingSuggestions.shift()
        );
      }
    } else if (histories.length === 0) {
      if (bookmarks.length === 0) {
        results.push(bingSuggestions.shift());
      } else if (bingSuggestions.length === 0) {
        results.push(bookmarks.shift());
      } else {
        results.push(
          bookmarks[0].relevance > bingSuggestions[0].relevance
            ? bookmarks.shift()
            : bingSuggestions.shift()
        );
      }
    } else if (bingSuggestions.length === 0) {
      results.push(bookmarks[0].relevance > histories[0].relevance ? bookmarks.shift() : histories.shift());
    } else {
      const maxRelevance = Math.max(bookmarks[0].relevance, histories[0].relevance, bingSuggestions[0].relevance);
      if (maxRelevance === bookmarks[0].relevance) {
        results.push(bookmarks.shift());
      } else if (maxRelevance === histories[0].relevance) {
        results.push(histories.shift());
      } else {
        results.push(bingSuggestions.shift());
      }
    }
  }

  const suggestionsWithUserRelevance = await calculateUserRelevance(results);
  suggestionsWithUserRelevance.sort((a, b) => b.userRelevance - a.userRelevance);
  return suggestionsWithUserRelevance;
}

export async function getSuggestions(query) {
  const maxHistoryResults = 200;
  const maxBookmarkResults = 50;
  const maxTotalSuggestions = 50;

  const suggestions = [{ text: query, type: 'search', relevance: Infinity }];

  const historyItems = await searchHistory(query, maxHistoryResults);
  const historySuggestions = historyItems.map(item => ({
    text: item.title,
    url: item.url,
    type: 'history',
    relevance: calculateRelevance(query, item.title, item.url),
    timestamp: item.lastVisitTime
  }));

  const bookmarkItems = await new Promise(resolve => {
    chrome.bookmarks.search(query, resolve);
  });
  const bookmarkSuggestions = bookmarkItems.slice(0, maxBookmarkResults).map(item => ({
    text: item.title,
    url: item.url,
    type: 'bookmark',
    relevance: calculateRelevance(query, item.title, item.url) * RELEVANCE_CONFIG.bookmarkRelevanceBoost
  }));

  suggestions.push(
    ...historySuggestions,
    ...bookmarkSuggestions
  );

  const uniqueSuggestions = Array.from(new Set(suggestions.map(s => s.url)))
    .map(url => suggestions.find(s => s.url === url))
    .sort((a, b) => b.relevance - a.relevance);

  return balanceResults(uniqueSuggestions, maxTotalSuggestions);
}


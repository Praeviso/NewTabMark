export function calculateRelevance(query, title, url) {
  const weights = {
    exactTitleMatch: 100,
    exactUrlMatch: 80,
    titleStartsWith: 70,
    urlStartsWith: 60,
    titleIncludes: 50,
    urlIncludes: 40,
    wordMatch: 30,
    fuzzyMatch: 20
  };

  const lowerQuery = (query || '').toLowerCase().trim();
  const lowerTitle = (title || '').toLowerCase().trim();
  const lowerUrl = (url || '').toLowerCase().trim();
  const queryWords = lowerQuery.split(/\s+/);

  let score = 0;

  if (lowerTitle === lowerQuery) score += weights.exactTitleMatch;
  if (lowerUrl === lowerQuery) score += weights.exactUrlMatch;

  if (lowerTitle.startsWith(lowerQuery)) score += weights.titleStartsWith;
  if (lowerUrl.startsWith(lowerQuery)) score += weights.urlStartsWith;

  if (lowerTitle.includes(lowerQuery)) score += weights.titleIncludes;
  if (lowerUrl.includes(lowerQuery)) score += weights.urlIncludes;

  queryWords.forEach((word) => {
    if (word.length <= 1) return;
    if (lowerTitle.includes(word)) score += weights.wordMatch;
    if (lowerUrl.includes(word)) score += weights.wordMatch / 2;
  });

  if (title) {
    const fuzzyScore = calculateFuzzyMatch(lowerQuery, lowerTitle);
    if (fuzzyScore > 0.8) score += weights.fuzzyMatch * fuzzyScore;
  }

  const lengthPenalty = Math.max(1, Math.log(lowerTitle.length / lowerQuery.length));
  score = score / lengthPenalty;

  if (title && title.timestamp) {
    const daysOld = (Date.now() - title.timestamp) / (1000 * 60 * 60 * 24);
    const timeDecay = Math.exp(-daysOld / 30);
    score *= timeDecay;
  }

  return Math.round(score * 100) / 100;
}

function calculateFuzzyMatch(query, text) {
  if (query.length === 0 || text.length === 0) return 0;
  if (query === text) return 1;

  const maxLength = Math.max(query.length, text.length);
  const distance = levenshteinDistance(query, text);
  return (maxLength - distance) / maxLength;
}

function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}


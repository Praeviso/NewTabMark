import { debounce } from '../utils/debounce.js';

export function initSearchSuggestionsUI({
  searchInput,
  searchSuggestions,
  searchFormWrapper,
  lineContainer,
  tabsContainer,
  suggestionsWrapper,
  isChangingSearchEngine = () => false,
  getSuggestions,
  getRecentHistory,
  queueSearch,
  performSearch,
  openAllSearchEnginesExceptCurrent,
  saveUserBehavior,
  updateSubmitButtonState
}) {
  if (!searchInput || !searchSuggestions || !searchFormWrapper) {
    return {
      hideSuggestions() {},
      showSuggestions() {},
      showDefaultSuggestions: async () => {},
      dispose() {}
    };
  }

  // Idempotency: if legacy bootstrap runs again, avoid duplicate listeners.
  // Dispose the previous instance bound to this input.
  const existing = searchInput.__ntmSearchSuggestionsUI;
  if (existing && typeof existing.dispose === 'function') {
    existing.dispose();
  }

  const abortController = new AbortController();
  const { signal } = abortController;

  // When the page loses focus (e.g. user clicks the browser address bar), we hide suggestions.
  // Some browsers may restore focus to the textarea briefly when returning to the tab, causing
  // a momentary show/hide flash. Track this so we only show suggestions again on explicit user intent.
  let hiddenDueToPageBlur = false;
  let lastUserFocusIntentAt = 0;

  let allSuggestions = [];
  let displayedSuggestions = 0;
  let isScrollListenerAttached = false;
  const resolvedSuggestionsWrapper =
    suggestionsWrapper || searchSuggestions.closest('.search-suggestions-wrapper') || document.querySelector('.search-suggestions-wrapper');

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function throttle(func, limit) {
    let inThrottle = false;
    return function throttled() {
      if (inThrottle) return;
      inThrottle = true;
      func.apply(this, arguments);
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    };
  }

  function formatUrl(url) {
    try {
      const urlObj = new URL(url);
      let domain = urlObj.hostname;
      domain = domain.replace(/^www\./, '');

      let path = urlObj.pathname;
      if (path && path !== '/') {
        path = path.length > 10 ? `${path.substring(0, 10)}...` : path;
        domain += path;
      }

      return domain;
    } catch (e) {
      return '';
    }
  }

  function getFavicon(url, callback) {
    const faviconURL = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`;
    const img = new Image();
    img.onload = function () {
      callback(faviconURL);
    };
    img.onerror = function () {
      callback('');
    };
    img.src = faviconURL;
  }

  function hideSuggestions() {
    if (isChangingSearchEngine()) {
      return;
    }

    searchFormWrapper.classList.remove('focused-with-suggestions');
    if (resolvedSuggestionsWrapper) resolvedSuggestionsWrapper.style.display = 'none';

    searchSuggestions.style.display = 'none';
    searchSuggestions.innerHTML = '';

    if (lineContainer) lineContainer.style.display = 'none';

    if (isScrollListenerAttached) {
      searchSuggestions.removeEventListener('scroll', throttledHandleScroll);
      isScrollListenerAttached = false;
    }

    allSuggestions = [];
    displayedSuggestions = 0;
    updateSubmitButtonState?.();
  }

  function hideDueToPageBlur() {
    hiddenDueToPageBlur = true;
    hideSuggestions();
  }

  function showSuggestions(suggestions) {
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      hideSuggestions();
      return;
    }

    allSuggestions = suggestions;
    displayedSuggestions = 0;
    searchSuggestions.innerHTML = '';

    searchFormWrapper.classList.add('focused-with-suggestions');

    if (resolvedSuggestionsWrapper) resolvedSuggestionsWrapper.style.display = 'block';
    searchSuggestions.style.display = 'block';

    if (lineContainer) lineContainer.style.display = 'block';

    searchSuggestions.style.maxHeight = '390px';
    searchSuggestions.style.overflowY = 'auto';

    loadMoreSuggestions();

    if (!isScrollListenerAttached) {
      searchSuggestions.addEventListener('scroll', throttledHandleScroll);
      isScrollListenerAttached = true;
    }

    updateSubmitButtonState?.();
  }

  function createSuggestionElement(suggestion) {
    const li = document.createElement('li');
    const displayUrl = suggestion.url ? formatUrl(suggestion.url) : '';

    li.setAttribute('data-type', suggestion.type);
    if (suggestion.url) li.setAttribute('data-url', suggestion.url);

    const searchSvgIcon = `<svg class="suggestion-icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
  <path d="M466.624 890.432a423.296 423.296 0 0 1-423.936-423.04C42.688 233.728 231.936 42.624 466.56 42.624a423.68 423.68 0 0 1 423.936 424.64 437.952 437.952 0 0 1-56.32 213.12 47.872 47.872 0 0 1-64.128 17.28 48 48 0 0 1-17.216-64.256c29.76-50.176 43.84-106.56 43.84-166.144-1.6-183.36-148.608-330.624-330.112-330.624a330.432 330.432 0 0 0-330.112 330.624 329.408 329.408 0 0 0 330.112 330.688c57.92 0 115.776-15.68 165.824-43.904a47.872 47.872 0 0 1 64.128 17.28 48 48 0 0 1-17.152 64.192 443.584 443.584 0 0 1-212.8 54.848z" fill="#334155"></path>
  <path d="M466.624 890.432a423.296 423.296 0 0 1-423.936-423.04c0-75.264 20.288-148.928 56.32-213.12a47.872 47.872 0 0 1 64.128-17.28 48 48 0 0 1 17.216 64.256 342.08 342.08 0 0 0-43.84 166.08c0 181.76 147.072 330.688 330.112 330.688a329.408 329.408 0 0 0 330.112-330.688A330.432 330.432 0 0 0 466.56 136.704c-57.856 0-115.776 15.68-165.824 43.84a47.872 47.872 0 0 1-64.128-17.216 48 48 0 0 1 17.216-64.256A436.032 436.032 0 0 1 466.56 42.688c233.088 0 422.4 189.568 422.4 424.64a422.016 422.016 0 0 1-422.4 423.104z" fill="#334155"></path>
  <path d="M934.4 981.312a44.992 44.992 0 0 1-32.832-14.08l-198.72-199.04c-18.752-18.816-18.752-48.576 0-65.792 18.752-18.816 48.512-18.816 65.728 0l198.656 199.04c18.816 18.752 18.816 48.576 0 65.792a47.68 47.68 0 0 1-32.832 14.08z" fill="#334155"></path>
</svg>`;

    const maxTextLength = 20;
    const safeFullText = escapeHtml(suggestion.text);
    const truncatedTextRaw =
      suggestion.text.length > maxTextLength
        ? `${suggestion.text.substring(0, maxTextLength)}...`
        : suggestion.text;
    const safeTruncatedText = escapeHtml(truncatedTextRaw);

    const safeDisplayUrl = displayUrl ? escapeHtml(displayUrl) : '';
    const safeType = escapeHtml(suggestion.type);

    li.innerHTML = `
    ${suggestion.type === 'search' ? searchSvgIcon : '<span class="material-icons suggestion-icon"></span>'}
    <div class="suggestion-content">
      <span class="suggestion-text" title="${safeFullText}">${safeTruncatedText}</span>
      ${safeDisplayUrl ? `<span class="suggestion-dash">-</span><span class="suggestion-url">${safeDisplayUrl}</span>` : ''}
    </div>
    <span class="suggestion-type">${safeType}</span>
  `;

    if (suggestion.url && suggestion.type !== 'search') {
      getFavicon(suggestion.url, (faviconUrl) => {
        const iconSpan = li.querySelector('.suggestion-icon');
        if (!iconSpan) return;

        iconSpan.innerHTML = '';
        if (!faviconUrl) return;

        const img = document.createElement('img');
        img.src = faviconUrl;
        img.alt = '';
        img.className = 'favicon';
        iconSpan.appendChild(img);
      });
    }

    li.addEventListener('click', async () => {
      if (suggestion.url) {
        window.open(suggestion.url, '_blank');
        await saveUserBehavior?.(suggestion.url);
      } else {
        searchInput.value = suggestion.text;
        searchInput.focus();
        queueSearch?.();
        await saveUserBehavior?.(suggestion.text);
      }
      hideSuggestions();
    });

    return li;
  }

  function loadMoreSuggestions() {
    if (!Array.isArray(allSuggestions) || allSuggestions.length === 0) return;

    const remainingSuggestions = allSuggestions.length - displayedSuggestions;
    const suggestionsToAdd = Math.min(remainingSuggestions, 10);
    if (suggestionsToAdd <= 0) return;

    const fragment = document.createDocumentFragment();
    for (let i = displayedSuggestions; i < displayedSuggestions + suggestionsToAdd; i++) {
      fragment.appendChild(createSuggestionElement(allSuggestions[i]));
    }
    searchSuggestions.appendChild(fragment);
    displayedSuggestions += suggestionsToAdd;
  }

  const throttledHandleScroll = throttle(function () {
    const scrollPosition = searchSuggestions.scrollTop + searchSuggestions.clientHeight;
    const scrollHeight = searchSuggestions.scrollHeight;
    if (scrollPosition >= scrollHeight - 20 && displayedSuggestions < allSuggestions.length) {
      loadMoreSuggestions();
    }
  }, 200);

  function showLoadingIndicator() {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-indicator';
    loadingIndicator.innerHTML = `
    <svg class="loading-spinner" viewBox="0 0 50 50">
      <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
    </svg>
  `;
    searchSuggestions.appendChild(loadingIndicator);
  }

  function hideLoadingIndicator() {
    const loadingIndicator = searchSuggestions.querySelector('.loading-indicator');
    if (loadingIndicator) loadingIndicator.remove();
  }

  async function showDefaultSuggestions() {
    const recentHistory = await getRecentHistory?.(20);
    const suggestions =
      recentHistory?.map((item) => ({
        text: item.text,
        url: item.url,
        type: 'history',
        relevance: item.relevance
      })) || [];
    showSuggestions(suggestions);
  }

  const handleInput = debounce(async () => {
    const query = searchInput.value.trim();
    showLoadingIndicator();
    try {
      if (query) {
        const suggestions = await getSuggestions?.(query);
        hideLoadingIndicator();
        showSuggestions(suggestions);
      } else {
        hideLoadingIndicator();
        await showDefaultSuggestions();
      }
    } finally {
      updateSubmitButtonState?.();
    }
  }, 300);

  searchInput.addEventListener(
    'input',
    () => {
    hiddenDueToPageBlur = false;
    handleInput();
    updateSubmitButtonState?.();
    if (searchInput.value.trim() === '') {
      showDefaultSuggestions();
    }
    },
    { signal }
  );

  // Capture user intent to focus (mouse/touch) so we can re-enable auto-show.
  const markUserFocusIntent = () => {
    lastUserFocusIntentAt = Date.now();
    hiddenDueToPageBlur = false;
  };
  searchInput.addEventListener('pointerdown', markUserFocusIntent, { signal });
  searchInput.addEventListener('mousedown', markUserFocusIntent, { signal });
  searchInput.addEventListener('touchstart', markUserFocusIntent, { signal, passive: true });

  searchInput.addEventListener(
    'focus',
    async () => {
    searchFormWrapper.classList.add('focused');
    // If we previously hid suggestions because the page lost focus, don't auto-show
    // on tab return unless there is explicit user focus intent.
    const userInitiatedFocus = Date.now() - lastUserFocusIntentAt < 500;
    if (hiddenDueToPageBlur && !userInitiatedFocus) {
      return;
    }

    // Defer showing one tick to avoid a show/hide flash when focus is transient.
    setTimeout(async () => {
      if (!document.hasFocus() || document.activeElement !== searchInput) return;

      if (searchInput.value.trim() === '') {
        await showDefaultSuggestions();
      } else {
        const suggestions = await getSuggestions?.(searchInput.value.trim());
        showSuggestions(suggestions);
      }
    }, 0);
    },
    { signal }
  );

  searchInput.addEventListener(
    'blur',
    () => {
    searchFormWrapper.classList.remove('focused');
    setTimeout(() => {
      // If the page lost focus (e.g. user clicked browser UI/address bar),
      // `document.activeElement` may remain unchanged. Treat that as a blur-away.
      if (!document.hasFocus()) {
        hideSuggestions();
        return;
      }

      if (!searchFormWrapper.contains(document.activeElement)) {
        hideSuggestions();
      }
    }, 200);
    },
    { signal }
  );

  searchInput.addEventListener(
    'keydown',
    (e) => {
    const items = searchSuggestions.querySelectorAll('li');
    let index = Array.from(items).findIndex((item) => item.classList.contains('keyboard-selected'));

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        hideSuggestions();
        return;
      case 'ArrowDown':
        e.preventDefault();
        if (index < items.length - 1) index++;
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (index > 0) index--;
        break;
      case 'Enter':
        e.preventDefault();
        if (e.metaKey || e.ctrlKey) {
          const query = searchInput.value.trim();
          if (query) openAllSearchEnginesExceptCurrent?.(query);
        } else if (index !== -1) {
          e.stopPropagation();
          const selectedItem = items[index];
          const suggestionType = selectedItem.getAttribute('data-type');
          if (suggestionType === 'history' || suggestionType === 'bookmark') {
            const url = selectedItem.getAttribute('data-url');
            if (url) {
              window.open(url, '_blank');
              hideSuggestions();
              return;
            }
          }
          selectedItem.click();
        } else {
          performSearch?.(searchInput.value.trim());
        }
        return;
      default:
        return;
    }

    items.forEach((item) => item.classList.remove('keyboard-selected'));
    if (index !== -1) {
      items[index].classList.add('keyboard-selected');
      const selectedItem = items[index];
      const suggestionType = selectedItem.getAttribute('data-type');
      if (suggestionType === 'search') {
        const textEl = selectedItem.querySelector('.suggestion-text');
        if (textEl) searchInput.value = textEl.textContent;
      }
    }
    },
    { signal }
  );

  // Hide suggestions when the page loses focus or is backgrounded.
  // This covers cases like clicking Chrome's address bar where the input blur
  // may not update `document.activeElement` as expected.
  window.addEventListener(
    'blur',
    () => {
      hideDueToPageBlur();
    },
    { signal }
  );

  window.addEventListener(
    'focus',
    () => {
      // On tab return some browsers may momentarily refocus the input.
      // Keep auto-show suppressed until explicit user intent.
      // (If the user clicks the input, markUserFocusIntent will clear this.)
    },
    { signal }
  );

  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.visibilityState === 'hidden') {
        hideDueToPageBlur();
      }
    },
    { signal }
  );

  if (tabsContainer) {
    tabsContainer.addEventListener(
      'mousedown',
      () => {
        updateSubmitButtonState?.();
      },
      { signal }
    );
  }

  function dispose() {
    try {
      handleInput.cancel?.();
      hideSuggestions();
    } finally {
      abortController.abort();
      if (isScrollListenerAttached) {
        searchSuggestions.removeEventListener('scroll', throttledHandleScroll);
        isScrollListenerAttached = false;
      }
    }
  }

  searchInput.__ntmSearchSuggestionsUI = { dispose };

  return { hideSuggestions, showSuggestions, showDefaultSuggestions, dispose };
}


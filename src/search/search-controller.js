import { initSearchSuggestionsUI } from './suggestions-ui.js';

function installPagehideDisposeOnce(searchInput) {
  if (!searchInput) return;
  if (searchInput.__ntmSearchSuggestionsPagehideBound) return;
  searchInput.__ntmSearchSuggestionsPagehideBound = true;

  window.addEventListener(
    'pagehide',
    () => {
      try {
        const ui = searchInput.__ntmSearchSuggestionsUI;
        if (ui?.dispose) ui.dispose();
      } catch {
        // noop
      }
    },
    { once: true }
  );
}

function getSearchDom({ searchForm, searchInput, tabsContainer, searchSuggestions }) {
  const searchFormWrapper =
    searchForm?.closest?.('.search-form') ||
    searchForm?.querySelector?.('.search-form') ||
    document.querySelector('.search-form');

  const resolvedSearchSuggestions =
    searchSuggestions ||
    searchForm?.querySelector?.('#search-suggestions') ||
    searchFormWrapper?.querySelector?.('#search-suggestions') ||
    document.getElementById('search-suggestions');

  const resolvedTabsContainer =
    tabsContainer ||
    searchForm?.querySelector?.('#tabs-container') ||
    searchFormWrapper?.querySelector?.('#tabs-container') ||
    document.getElementById('tabs-container');

  const resolvedSearchInput = searchInput || searchForm?.querySelector?.('.search-input');

  const lineContainer =
    searchForm?.querySelector?.('#line-container') ||
    searchFormWrapper?.querySelector?.('#line-container') ||
    document.getElementById('line-container');

  const suggestionsWrapper =
    searchForm?.querySelector?.('[data-ntm-search-suggestions-root="true"]') ||
    searchForm?.querySelector?.('.search-suggestions-wrapper') ||
    searchFormWrapper?.querySelector?.('[data-ntm-search-suggestions-root="true"]') ||
    searchFormWrapper?.querySelector?.('.search-suggestions-wrapper') ||
    document.querySelector('.search-suggestions-wrapper');

  return {
    searchFormWrapper,
    searchInput: resolvedSearchInput,
    tabsContainer: resolvedTabsContainer,
    searchSuggestions: resolvedSearchSuggestions,
    lineContainer,
    suggestionsWrapper
  };
}

export function initSearchController({
  searchForm,
  searchInput,
  tabsContainer,
  searchSuggestions,
  isChangingSearchEngine,
  getSuggestions,
  getRecentHistory,
  queueSearch,
  performSearch,
  openAllSearchEnginesExceptCurrent,
  saveUserBehavior,
  updateSubmitButtonState
}) {
  const dom = getSearchDom({ searchForm, searchInput, tabsContainer, searchSuggestions });

  if (!dom.searchInput || !dom.searchSuggestions || !dom.tabsContainer) {
    return;
  }

  const updateSubmitButtonStateImpl =
    typeof updateSubmitButtonState === 'function'
      ? updateSubmitButtonState
      : () => {
          if (dom.searchInput.value.trim() === '') {
            dom.tabsContainer.style.display = 'none';
            return;
          }

          dom.tabsContainer.style.display = dom.searchSuggestions.children.length > 0 ? 'flex' : 'none';
        };

  initSearchSuggestionsUI({
    searchInput: dom.searchInput,
    searchSuggestions: dom.searchSuggestions,
    searchFormWrapper: dom.searchFormWrapper,
    lineContainer: dom.lineContainer,
    tabsContainer: dom.tabsContainer,
    suggestionsWrapper: dom.suggestionsWrapper,
    isChangingSearchEngine,
    getSuggestions,
    getRecentHistory,
    queueSearch,
    performSearch,
    openAllSearchEnginesExceptCurrent,
    saveUserBehavior,
    updateSubmitButtonState: updateSubmitButtonStateImpl
  });

  installPagehideDisposeOnce(dom.searchInput);
}

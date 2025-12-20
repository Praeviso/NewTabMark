import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getLocalizedMessageSafe } from '../localization.js';
import { getIconHtml } from '../icons.js';
import {
  SearchEngineManager,
  getEngineDisplayName,
  openSearchEnginesDialog,
  updateSearchEngineIcon
} from '../search-engine-dropdown.js';

if (typeof window !== 'undefined') {
  window.__USE_REACT_SEARCH_ENGINE_DROPDOWN__ = true;
}

function updateTabsState(engineName) {
  if (!engineName) return;
  const defaultEngine = engineName.toLowerCase();
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((tab) => tab.classList.remove('active'));
  const matchingTab = Array.from(tabs).find((tab) => {
    const tabEngine = tab.getAttribute('data-engine')?.toLowerCase();
    return tabEngine === defaultEngine;
  });
  if (matchingTab) matchingTab.classList.add('active');
}

function getSnapshot() {
  return {
    enabledEngines: SearchEngineManager.getEnabledEngines(),
    defaultEngine: SearchEngineManager.getDefaultEngine()
  };
}

function SearchEngineDropdown({ searchForm }) {
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(0);

  const { enabledEngines, defaultEngine } = useMemo(getSnapshot, [version]);

  const addSearchEngineText = useMemo(
    () => getLocalizedMessageSafe('addSearchEngine', 'Add search engine'),
    []
  );
  const addIconHtml = useMemo(() => getIconHtml('add_circle'), []);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const refresh = useCallback(() => setVersion((prev) => prev + 1), []);

  useEffect(() => {
    if (!searchForm) return;

    const iconContainer = searchForm.querySelector('.search-icon-container');
    if (!iconContainer) return;
    if (iconContainer.dataset.reactSearchDropdownBound === 'true') return;
    iconContainer.dataset.reactSearchDropdownBound = 'true';

    const onIconClick = (event) => {
      event.stopPropagation();
      toggle();
    };

    iconContainer.addEventListener('click', onIconClick);
    return () => {
      iconContainer.removeEventListener('click', onIconClick);
      delete iconContainer.dataset.reactSearchDropdownBound;
    };
  }, [searchForm, toggle]);

  useEffect(() => {
    const onDefaultChanged = () => refresh();
    const onEnginesChanged = () => refresh();
    document.addEventListener('defaultSearchEngineChanged', onDefaultChanged);
    document.addEventListener('searchEnginesStateChanged', onEnginesChanged);
    window.addEventListener('storage', onEnginesChanged);
    return () => {
      document.removeEventListener('defaultSearchEngineChanged', onDefaultChanged);
      document.removeEventListener('searchEnginesStateChanged', onEnginesChanged);
      window.removeEventListener('storage', onEnginesChanged);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;

    const onDocumentClick = (event) => {
      const dropdownEl = searchForm?.querySelector('.search-engine-dropdown');
      const iconContainer = searchForm?.querySelector('.search-icon-container');
      const target = event.target;
      if (!dropdownEl || !target) return;
      if (dropdownEl.contains(target)) return;
      if (iconContainer && iconContainer.contains(target)) return;
      close();
    };

    document.addEventListener('click', onDocumentClick);
    return () => document.removeEventListener('click', onDocumentClick);
  }, [close, open, searchForm]);

  const selectEngine = useCallback(
    (engine) => {
      if (!engine?.name) return;

      close();

      if (SearchEngineManager.setDefaultEngine(engine.name)) {
        updateSearchEngineIcon(engine);
        updateTabsState(engine.name);
        searchForm?.setAttribute('data-current-engine', engine.name);
        document.dispatchEvent(
          new CustomEvent('defaultSearchEngineChanged', { detail: { engine } })
        );
        refresh();
      }
    },
    [close, refresh, searchForm]
  );

  const openDialog = useCallback(() => {
    close();
    openSearchEnginesDialog();
  }, [close]);

  return (
    <div
      className="search-engine-dropdown absolute left-0 top-full bg-white rounded-xl shadow-lg p-4 z-[1000] w-[580px] mt-2 [[data-theme=dark]_&]:bg-[#242424] [[data-theme=dark]_&]:border-[#404040] [[data-theme=dark]_&]:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] max-[480px]:w-[calc(100vw-32px)] max-[480px]:left-4 max-[480px]:right-4"
      data-react-managed="true"
      style={{ display: open ? 'block' : 'none' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="search-engine-options-container grid grid-cols-6 gap-3 max-[480px]:grid-cols-3">
        {enabledEngines.map((engine) => {
          const engineName = getEngineDisplayName(engine);
          return (
            <div
              key={engine.name}
              className="search-engine-option cursor-pointer p-2 rounded-lg transition-colors hover:bg-gray-100 [[data-theme=dark]_&]:text-gray-200 [[data-theme=dark]_&]:hover:bg-[#333333]"
              onClick={() => selectEngine(engine)}
            >
              <div className="search-engine-option-content flex flex-col items-center gap-1.5">
                <img
                  src={engine.icon}
                  alt={engineName}
                  className="search-engine-option-icon h-6 mb-1 [[data-theme=dark]_&]:bg-white [[data-theme=dark]_&]:p-0.5 [[data-theme=dark]_&]:rounded"
                />
                <span className="search-engine-option-label text-xs text-gray-800 [[data-theme=dark]_&]:text-gray-200">{engineName}</span>
              </div>
            </div>
          );
        })}

        <div
          className="search-engine-option cursor-pointer p-2 rounded-lg transition-colors hover:bg-gray-100 [[data-theme=dark]_&]:text-gray-200 [[data-theme=dark]_&]:hover:bg-[#333333]"
          onClick={openDialog}
        >
          <div className="search-engine-option-content add-engine flex flex-col items-center gap-1.5 [[data-theme=dark]_&]:text-gray-400 [[data-theme=dark]_&]:hover:text-gray-200">
            <span dangerouslySetInnerHTML={{ __html: addIconHtml }} />
            <span className="search-engine-option-label text-xs text-gray-800 [[data-theme=dark]_&]:text-gray-200">{addSearchEngineText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchEngineDropdownPortal() {
  const [targetForm, setTargetForm] = useState(null);

  useEffect(() => {
    setTargetForm(document.querySelector('.search-form'));
  }, []);

  if (!targetForm) return null;
  return createPortal(<SearchEngineDropdown searchForm={targetForm} />, targetForm);
}

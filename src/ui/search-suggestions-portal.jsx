import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

function SearchSuggestions({ variant }) {
  return (
    <div
      className="search-suggestions-wrapper absolute top-full left-0 right-0 bg-white rounded-b-xl shadow-md z-[1000] overflow-hidden hidden [[data-theme=dark]_&]:bg-[#404040]"
      data-ntm-search-suggestions-root="true"
    >
      <div className="line-container" id="line-container">
        <hr className="custom-hr border-t border-gray-200 [[data-theme=dark]_&]:border-[#373737]" />
      </div>
      {/* Preserve legacy class 'search-suggestions' for dynamic content from suggestions-ui.js */}
      <ul id="search-suggestions" className="search-suggestions" />
      <div
        id="tabs-container"
        className="tabs relative p-2 flex justify-start items-center overflow-x-auto whitespace-nowrap z-[5] pl-[30px] bg-white [[data-theme=dark]_&]:bg-[#404040] scrollbar-none"
      >
        <span data-i18n="searchTips" className="search-tips text-xs mr-2">
          本次使用
        </span>

        {variant === 'sidepanel' ? (
          <>
            <div className="tab flex-shrink-0 cursor-pointer px-1.5 py-0.5 rounded-2xl text-gray-500 text-xs inline-flex items-center mr-1.5 bg-gray-100 border border-transparent transition-colors hover:bg-gray-200 [[data-theme=dark]_&]:text-white [[data-theme=dark]_&]:bg-[#7a7a7a]" data-engine="bing">
              Bing
            </div>
            <div className="tab active flex-shrink-0 cursor-pointer px-1.5 py-0.5 rounded-2xl text-xs inline-flex items-center mr-1.5 border transition-colors bg-blue-50 text-blue-600 border-gray-300 [[data-theme=dark]_&]:text-white [[data-theme=dark]_&]:bg-[#7a7a7a]" data-engine="google">
              Google
            </div>
            <div className="tab flex-shrink-0 cursor-pointer px-1.5 py-0.5 rounded-2xl text-gray-500 text-xs inline-flex items-center mr-1.5 bg-gray-100 border border-transparent transition-colors hover:bg-gray-200 [[data-theme=dark]_&]:text-white [[data-theme=dark]_&]:bg-[#7a7a7a]" data-engine="doubao">
              <span data-i18n="doubaoTab">豆包</span>
            </div>
            <div className="tab flex-shrink-0 cursor-pointer px-1.5 py-0.5 rounded-2xl text-gray-500 text-xs inline-flex items-center mr-1.5 bg-gray-100 border border-transparent transition-colors hover:bg-gray-200 [[data-theme=dark]_&]:text-white [[data-theme=dark]_&]:bg-[#7a7a7a]" data-engine="kimi">
              Kimi
            </div>
            <div className="tab flex-shrink-0 cursor-pointer px-1.5 py-0.5 rounded-2xl text-gray-500 text-xs inline-flex items-center mr-1.5 bg-gray-100 border border-transparent transition-colors hover:bg-gray-200 [[data-theme=dark]_&]:text-white [[data-theme=dark]_&]:bg-[#7a7a7a]" data-engine="metaso">
              <span data-i18n="metasoTab">秘塔</span>
            </div>
            <div className="tab flex-shrink-0 cursor-pointer px-1.5 py-0.5 rounded-2xl text-gray-500 text-xs inline-flex items-center mr-1.5 bg-gray-100 border border-transparent transition-colors hover:bg-gray-200 [[data-theme=dark]_&]:text-white [[data-theme=dark]_&]:bg-[#7a7a7a]" data-engine="felo">
              Felo
            </div>
            <div className="tab flex-shrink-0 cursor-pointer px-1.5 py-0.5 rounded-2xl text-gray-500 text-xs inline-flex items-center mr-1.5 bg-gray-100 border border-transparent transition-colors hover:bg-gray-200 [[data-theme=dark]_&]:text-white [[data-theme=dark]_&]:bg-[#7a7a7a]" data-engine="chatgpt">
              ChatGPT
            </div>
            <div className="tab flex-shrink-0 cursor-pointer px-1.5 py-0.5 rounded-2xl text-gray-500 text-xs inline-flex items-center mr-1.5 bg-gray-100 border border-transparent transition-colors hover:bg-gray-200 [[data-theme=dark]_&]:text-white [[data-theme=dark]_&]:bg-[#7a7a7a]" data-engine="baidu">
              <span data-i18n="baiduTab">百度</span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function SearchSuggestionsPortal({
  placeholderId = 'ntm-search-suggestions-portal',
  variant = 'newtab'
}) {
  const [target, setTarget] = useState(null);

  // Important: legacy bootstrap (`initScript`) expects these nodes to exist.
  // `useLayoutEffect` ensures the portal mounts before LegacyAppShell's `useEffect` runs.
  useLayoutEffect(() => {
    setTarget(document.getElementById(placeholderId));
  }, [placeholderId]);

  if (!target) return null;
  return createPortal(<SearchSuggestions variant={variant} />, target);
}

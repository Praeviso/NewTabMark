import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

function SearchSuggestions({ variant }) {
  return (
    <div className="search-suggestions-wrapper" data-ntm-search-suggestions-root="true">
      <div className="line-container" id="line-container">
        <hr className="custom-hr" />
      </div>
      <ul id="search-suggestions" className="search-suggestions" />
      <div id="tabs-container" className="tabs">
        <span data-i18n="searchTips" className="search-tips">
          本次使用
        </span>

        {variant === 'sidepanel' ? (
          <>
            <div className="tab" data-engine="bing">
              Bing
            </div>
            <div className="tab active" data-engine="google">
              Google
            </div>
            <div className="tab" data-engine="doubao">
              <span data-i18n="doubaoTab">豆包</span>
            </div>
            <div className="tab" data-engine="kimi">
              Kimi
            </div>
            <div className="tab" data-engine="metaso">
              <span data-i18n="metasoTab">秘塔</span>
            </div>
            <div className="tab" data-engine="felo">
              Felo
            </div>
            <div className="tab" data-engine="chatgpt">
              ChatGPT
            </div>
            <div className="tab" data-engine="baidu">
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

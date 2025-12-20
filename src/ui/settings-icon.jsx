import { useMemo } from 'react';
import { getLocalizedMessageSafe } from '../localization.js';
import { openSettingsModal } from './settings-modal-controller.js';

// React portals own the click handling for special links.
// This is used by legacy controllers to avoid binding global listeners.
if (typeof document !== 'undefined') {
  document.documentElement.dataset.ntmReactSpecialLinks = 'true';
}

export function SettingsIcon() {
  const settingsLinkTitle = useMemo(
    () => getLocalizedMessageSafe('settingsLinkTitle', 'Settings'),
    []
  );
  const settingsUpdateTipText = useMemo(
    () =>
      getLocalizedMessageSafe(
        'settingsUpdateTip',
        '你可以在这里设置背景颜色、壁纸、悬浮球功能...'
      ),
    []
  );

  // Container classes: fixed position, white bg (dark: neutral-700), rounded, shadow, flex center
  // Using arbitrary selector for data-theme dark mode compatibility
  const containerClasses = [
    'fixed right-8 top-[calc(25%+210px)] z-[2]',
    'w-10 h-10 flex items-center justify-center',
    'bg-white rounded-xl shadow-md',
    'transition-all duration-300',
    // Dark mode via data-theme attribute
    '[[data-theme=dark]_&]:bg-neutral-700'
  ].join(' ');

  // Link classes: flex center, gray text with hover effects
  const linkClasses = [
    'flex items-center justify-center',
    'w-7 h-7 rounded-lg',
    'text-gray-500 no-underline',
    'transition-all duration-300',
    'hover:text-emerald-500 hover:bg-gray-100',
    'active:scale-95',
    // Dark mode
    '[[data-theme=dark]_&]:text-white',
    '[[data-theme=dark]_&]:hover:text-neutral-900'
  ].join(' ');

  return (
    <div className={containerClasses}>
      <a
        href="#settings"
        id="settings-link"
        className={linkClasses}
        data-i18n-title="settingsLinkTitle"
        title={settingsLinkTitle}
        onClick={(e) => {
          e.preventDefault();
          openSettingsModal(document);
        }}
      >
        <span className="material-icons">settings</span>
      </a>
      <div className="settings-update-tip" style={{ display: 'none' }}>
        <div className="tip-content">
          <span className="material-icons">info</span>
          <div className="tip-text">
            <p data-i18n="settingsUpdateTip">{settingsUpdateTipText}</p>
          </div>
          <button className="tip-close">
            <span className="material-icons">close</span>
          </button>
        </div>
        <div className="tip-arrow"></div>
      </div>
    </div>
  );
}

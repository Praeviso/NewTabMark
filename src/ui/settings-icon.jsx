import { useMemo } from 'react';
import { getLocalizedMessageSafe } from '../localization.js';
import { openSettingsModal } from './SettingsModalController.jsx';

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
    'fixed right-8 top-[calc(30%_+_250px)] z-[2]',
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
          openSettingsModal();
        }}
      >
        <span className="material-icons">settings</span>
      </a>
      {/* Settings Update Tip - Tailwind-ified */}
      <div
        className={[
          'settings-update-tip', // preserve legacy class
          'absolute right-[60px] bottom-0 w-[280px] z-[1000]',
          'bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.15)]',
          'animate-[tipFadeIn_0.3s_ease-out]',
          // Dark mode
          '[[data-theme=dark]_&]:bg-gray-800 [[data-theme=dark]_&]:shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
        ].join(' ')}
        style={{ display: 'none' }}
      >
        <div className="tip-content flex p-3 items-start gap-2">
          <span className="text-xl" style={{ color: '#10b981' }}>
            <span className="material-icons">info</span>
          </span>
          <div className={[
            'tip-text flex-1 text-sm leading-relaxed',
            'text-gray-700 [[data-theme=dark]_&]:text-gray-200'
          ].join(' ')}>
            <p data-i18n="settingsUpdateTip" className="m-0">{settingsUpdateTipText}</p>
          </div>
          <button className={[
            'tip-close p-1 cursor-pointer flex items-center justify-center',
            'bg-transparent border-none',
            'text-gray-400 hover:text-gray-700',
            '[[data-theme=dark]_&]:text-gray-500 [[data-theme=dark]_&]:hover:text-gray-200'
          ].join(' ')}>
            <span className="material-icons text-xl">close</span>
          </button>
        </div>
        <div className={[
          'tip-arrow absolute -right-1.5 bottom-5 w-3 h-3 rotate-45',
          'bg-white shadow-[3px_-3px_3px_rgba(0,0,0,0.05)]',
          '[[data-theme=dark]_&]:bg-gray-800'
        ].join(' ')} />
      </div>
    </div>
  );
}

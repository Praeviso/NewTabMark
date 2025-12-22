import { getWelcomeManager } from '../welcome.js';
import { clearWallpaperState, initWallpaper } from '../wallpaper.js';
import { setQuickLinksVisibility } from '../quick-links.js';
import {
  applyBackgroundClass,
  clearActiveBackgroundOptions,
  persistBackgroundSelection,
  readBackgroundState,
  setActiveBackgroundOption
} from '../background-state.js';

/**
 * @deprecated This file is superseded by React component:
 * - src/ui/SettingsModalController.jsx
 *
 * The openSettingsModal/closeSettingsModal functions are now exported from
 * SettingsModalController.jsx and use custom events for communication.
 * This file is kept for legacy imports but its init function is now a no-op.
 */

let settingsModalControllerInitialized = false;
let settingsModalAbortController = null;

function resolveRootDocument(root) {
  if (root && root.ownerDocument) return root.ownerDocument;
  if (root && root.nodeType === Node.DOCUMENT_NODE) return root;
  return document;
}

function getSettingsModalEl(root = document) {
  const doc = resolveRootDocument(root);
  if (!doc) return null;

  if (root && root.nodeType !== Node.DOCUMENT_NODE) {
    return root.querySelector?.('#settings-modal') ?? null;
  }
  return doc.getElementById('settings-modal');
}

function toElementTarget(target) {
  if (target instanceof Element) return target;
  if (target && typeof target === 'object' && 'nodeType' in target && target.nodeType === Node.TEXT_NODE) {
    return target.parentElement;
  }
  return null;
}

// Tab 切换逻辑已迁移到 React SettingsTabsPortal 组件

function closeModal(modalEl) {
  modalEl.style.display = 'none';
}

function isModalOpen(modalEl) {
  const doc = modalEl?.ownerDocument ?? document;
  const win = doc.defaultView ?? window;
  return win.getComputedStyle(modalEl).display !== 'none';
}

/**
 * @deprecated Use openSettingsModal from SettingsModalController.jsx instead.
 * This function is kept for backward compatibility.
 */
export function openSettingsModal(root = document) {
  // Redirect to React-based event system
  window.dispatchEvent(new CustomEvent('ntm:openSettings'));
  return true;
}

/**
 * @deprecated Use closeSettingsModal from SettingsModalController.jsx instead.
 * This function is kept for backward compatibility.
 */
export function closeSettingsModal(root = document) {
  const modalEl = getSettingsModalEl(root);
  if (!modalEl) return false;

  closeModal(modalEl);
  return true;
}

function clearWallpaper(doc) {
  doc.querySelectorAll('.wallpaper-option').forEach((opt) => {
    opt.classList.remove('active');
  });

  clearWallpaperState();
  localStorage.removeItem('originalWallpaper');

  const welcomeElement = doc.getElementById('welcome-message');
  const welcomeManager = getWelcomeManager?.() || window.WelcomeManager;
  if (welcomeElement && welcomeManager) {
    welcomeManager.adjustTextColor(welcomeElement);
  }
}

function handleBackgroundChange(optionEl, doc) {
  const bgClass = optionEl.getAttribute('data-bg');
  if (!bgClass) return;

  setActiveBackgroundOption(doc, bgClass);
  applyBackgroundClass(doc, bgClass);
  persistBackgroundSelection(localStorage, bgClass);

  clearWallpaper(doc);
}

function loadSavedSettings(doc) {
  // Checkbox 初始化已迁移到 React SettingsSwitchPortal 组件
  // 但仍需初始化 Quick Links 可见性
  chrome.storage.sync.get(['enableQuickLinks'], (result) => {
    setQuickLinksVisibility(result.enableQuickLinks !== false);
  });

  const savedBg = localStorage.getItem('selectedBackground');
  const useDefaultBackground = localStorage.getItem('useDefaultBackground');
  const hasWallpaper = localStorage.getItem('originalWallpaper');

  if (useDefaultBackground === 'true' && savedBg) {
    setActiveBackgroundOption(doc, savedBg);

    const welcomeElement = doc.getElementById('welcome-message');
    const welcomeManager = getWelcomeManager?.() || window.WelcomeManager;
    if (welcomeElement && welcomeManager) {
      welcomeManager.adjustTextColor(welcomeElement);
    }
  } else if (hasWallpaper) {
    clearActiveBackgroundOptions(doc);
  }

  // Keep the page background consistent with persisted state without
  // duplicating logic from `wallpaper.js`.
  const state = readBackgroundState(localStorage);
  if (state.useDefaultBackground === 'true' && state.selectedBackground) {
    applyBackgroundClass(doc, state.selectedBackground);
  }

}

export function initSettingsModalController(root = document) {
  if (settingsModalControllerInitialized) return;

  const modalEl = getSettingsModalEl(root);
  if (!modalEl) return;

  settingsModalControllerInitialized = true;

  const doc = modalEl.ownerDocument ?? document;
  settingsModalAbortController?.abort();
  settingsModalAbortController = new AbortController();
  const { signal } = settingsModalAbortController;

  loadSavedSettings(doc);

  modalEl.addEventListener(
    'click',
    (event) => {
      const target = toElementTarget(event.target);
      if (!target) return;

      if (target.classList.contains('settings-modal-close')) {
        closeSettingsModal(doc);
        return;
      }

      if (target === modalEl) {
        closeSettingsModal(doc);
        return;
      }

      // Tab 按钮和 Background option 事件已迁移到 React 组件
    },
    { signal }
  );

  doc.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape') return;
      if (isModalOpen(modalEl)) closeSettingsModal(doc);
    },
    { signal }
  );
  // Checkbox 事件绑定已迁移到 React SettingsSwitchPortal 组件
}

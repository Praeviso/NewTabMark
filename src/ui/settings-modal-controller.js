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

function switchTab(modalEl, tabName) {
  const tabButtons = modalEl.querySelectorAll('.settings-tab-button');
  const tabContents = modalEl.querySelectorAll('.settings-tab-content');

  tabButtons.forEach((btn) => btn.classList.remove('active'));
  tabContents.forEach((content) => content.classList.remove('active'));

  const selectedButton = modalEl.querySelector(`[data-tab="${tabName}"]`);
  const selectedContent = modalEl.querySelector(`#${tabName}-settings`);

  if (selectedButton) selectedButton.classList.add('active');
  if (selectedContent) selectedContent.classList.add('active');
}

function closeModal(modalEl) {
  modalEl.style.display = 'none';
}

function isModalOpen(modalEl) {
  const doc = modalEl?.ownerDocument ?? document;
  const win = doc.defaultView ?? window;
  return win.getComputedStyle(modalEl).display !== 'none';
}

export function openSettingsModal(root = document) {
  initSettingsModalController(root);

  const modalEl = getSettingsModalEl(root);
  if (!modalEl) return false;

  // Settings modal DOM may be injected lazily; ensure wallpaper logic is ready.
  initWallpaper();

  loadSavedSettings(modalEl.ownerDocument ?? document);
  modalEl.style.display = 'block';
  void modalEl.offsetHeight;
  return true;
}

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

      const tabButton = target.closest('.settings-tab-button');
      if (tabButton) {
        const tabName = tabButton.getAttribute('data-tab');
        if (tabName) switchTab(modalEl, tabName);
        return;
      }

      // Background option 事件已迁移到 React BackgroundOptionsPortal 组件
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

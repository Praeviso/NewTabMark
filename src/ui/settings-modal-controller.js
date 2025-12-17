import { getWelcomeManager } from '../welcome.js';
import { initThemeController, setTheme, syncThemeToggleIcon } from './theme-controller.js';
import { clearWallpaperState } from '../wallpaper.js';

let settingsModalControllerInitialized = false;

function getSettingsModalEl() {
  return document.getElementById('settings-modal');
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

export function openSettingsModal() {
  const modalEl = getSettingsModalEl();
  if (!modalEl) return false;

  modalEl.style.display = 'block';
  void modalEl.offsetHeight;
  return true;
}

export function closeSettingsModal() {
  const modalEl = getSettingsModalEl();
  if (!modalEl) return false;

  closeModal(modalEl);
  return true;
}

function clearWallpaper() {
  document.querySelectorAll('.wallpaper-option').forEach((opt) => {
    opt.classList.remove('active');
  });

  clearWallpaperState();
  localStorage.removeItem('originalWallpaper');

  const welcomeElement = document.getElementById('welcome-message');
  const welcomeManager = getWelcomeManager?.() || window.WelcomeManager;
  if (welcomeElement && welcomeManager) {
    welcomeManager.adjustTextColor(welcomeElement);
  }
}

function handleBackgroundChange(optionEl) {
  const bgClass = optionEl.getAttribute('data-bg');
  if (!bgClass) return;

  document.querySelectorAll('.settings-bg-option').forEach((opt) => {
    opt.classList.remove('active');
  });

  optionEl.classList.add('active');

  document.documentElement.className = bgClass;
  localStorage.setItem('selectedBackground', bgClass);
  localStorage.setItem('useDefaultBackground', 'true');

  clearWallpaper();
}

function toggleQuickLinksVisibility(show) {
  const quickLinksWrapper = document.querySelector('.quick-links-wrapper');
  if (!quickLinksWrapper) return;
  quickLinksWrapper.style.display = show ? 'flex' : 'none';
}

function loadSavedSettings() {
  const enableFloatingBallCheckbox = document.getElementById('enable-floating-ball');
  const enableQuickLinksCheckbox = document.getElementById('enable-quick-links');
  const openInNewTabCheckbox = document.getElementById('open-in-new-tab');

  if (enableFloatingBallCheckbox) {
    chrome.storage.sync.get(['enableFloatingBall'], (result) => {
      enableFloatingBallCheckbox.checked = result.enableFloatingBall !== false;
    });
  }

  if (enableQuickLinksCheckbox) {
    chrome.storage.sync.get(['enableQuickLinks'], (result) => {
      enableQuickLinksCheckbox.checked = result.enableQuickLinks !== false;
      toggleQuickLinksVisibility(enableQuickLinksCheckbox.checked);
    });
  }

  if (openInNewTabCheckbox) {
    chrome.storage.sync.get(['openInNewTab'], (result) => {
      openInNewTabCheckbox.checked = result.openInNewTab !== false;
    });
  }

  const savedBg = localStorage.getItem('selectedBackground');
  if (savedBg) {
    document.documentElement.className = savedBg;
    document.querySelectorAll('.settings-bg-option').forEach((option) => {
      if (option.getAttribute('data-bg') === savedBg) {
        option.classList.add('active');
      }
    });
  }

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) setTheme(savedTheme, { persist: false, reapplyBackground: false });
  syncThemeToggleIcon();
}

export function initSettingsModalController() {
  if (settingsModalControllerInitialized) return;
  settingsModalControllerInitialized = true;

  const modalEl = getSettingsModalEl();
  if (!modalEl) return;

  initThemeController();
  loadSavedSettings();

  modalEl.addEventListener('click', (event) => {
    const target = toElementTarget(event.target);
    if (!target) return;

    if (target.classList.contains('settings-modal-close')) {
      closeSettingsModal();
      return;
    }

    if (target === modalEl) {
      closeSettingsModal();
      return;
    }

    const tabButton = target.closest('.settings-tab-button');
    if (tabButton) {
      const tabName = tabButton.getAttribute('data-tab');
      if (tabName) switchTab(modalEl, tabName);
      return;
    }

    const bgOption = target.closest('.settings-bg-option');
    if (bgOption) {
      handleBackgroundChange(bgOption);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (modalEl.style.display === 'block') closeSettingsModal();
  });

  const enableFloatingBallCheckbox = document.getElementById('enable-floating-ball');
  if (enableFloatingBallCheckbox) {
    enableFloatingBallCheckbox.addEventListener('change', () => {
      const isEnabled = enableFloatingBallCheckbox.checked;
      chrome.runtime.sendMessage({ action: 'updateFloatingBallSetting', enabled: isEnabled }, () => {
        if (!chrome.runtime.lastError) return;
        chrome.storage.sync.set({ enableFloatingBall: isEnabled });
      });
    });
  }

  const enableQuickLinksCheckbox = document.getElementById('enable-quick-links');
  if (enableQuickLinksCheckbox) {
    enableQuickLinksCheckbox.addEventListener('change', () => {
      const isEnabled = enableQuickLinksCheckbox.checked;
      chrome.storage.sync.set({ enableQuickLinks: isEnabled }, () => {
        toggleQuickLinksVisibility(isEnabled);
      });
    });
  }

  const openInNewTabCheckbox = document.getElementById('open-in-new-tab');
  if (openInNewTabCheckbox) {
    openInNewTabCheckbox.addEventListener('change', () => {
      const isEnabled = openInNewTabCheckbox.checked;
      chrome.storage.sync.set({ openInNewTab: isEnabled });
    });
  }
}

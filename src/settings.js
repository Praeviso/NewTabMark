import {
  initSettingsModalController,
  openSettingsModal,
  closeSettingsModal
} from './ui/settings-modal-controller.js';

let initialized = false;
let settingsManager = null;

export function initSettingsManager() {
  if (initialized) return settingsManager;
  initialized = true;

  initSettingsModalController();

  settingsManager = {
    open: openSettingsModal,
    close: closeSettingsModal
  };

  return settingsManager;
}

export function getSettingsManager() {
  return settingsManager;
}


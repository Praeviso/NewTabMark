/**
 * @deprecated This file is superseded by React component:
 * - src/ui/SettingsModalController.jsx
 *
 * The openSettingsModal/closeSettingsModal functions are now exported from
 * SettingsModalController.jsx and use custom events for communication.
 * This file is kept only for backward compatibility with legacy imports.
 * 
 * All initialization logic has been removed - React component handles everything.
 */

/**
 * @deprecated Use openSettingsModal from SettingsModalController.jsx instead.
 * This function redirects to the React-based event system.
 */
export function openSettingsModal(root = document) {
  window.dispatchEvent(new CustomEvent('ntm:openSettings'));
  return true;
}

/**
 * @deprecated Use closeSettingsModal from SettingsModalController.jsx instead.
 * This function is kept for backward compatibility.
 */
export function closeSettingsModal(root = document) {
  const modalEl = root?.getElementById?.('settings-modal') ?? document.getElementById('settings-modal');
  if (!modalEl) return false;
  modalEl.style.display = 'none';
  return true;
}

/**
 * @deprecated No-op function kept for backward compatibility.
 * All initialization is now handled by React SettingsModalController.jsx.
 */
export function initSettingsModalController(root = document) {
  // No-op: React component handles all initialization
}

import { initFeatureTips } from './feature-tips.js';

// 书签清理插件相关常量
const CLEANUP_EXTENSION = {
  ID: 'aeehapalakdoclgmfeondmephgiandef',
  STORE_URL: 'https://chromewebstore.google.com/detail/lazycat-bookmark-cleaner/aeehapalakdoclgmfeondmephgiandef'
};

// 检查插件是否已安装
function checkExtensionInstalled() {
  return new Promise((resolve, reject) => {
    chrome.management.get(CLEANUP_EXTENSION.ID, (extensionInfo) => {
      if (chrome.runtime.lastError) {
        reject(new Error('Extension not installed'));
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * @deprecated Settings button event handling has been migrated to React BookmarkCleanupButtonPortal.
 * This function is kept for backward compatibility but will do nothing.
 */
function initBookmarkCleanupSettings() {
  // Legacy DOM event binding removed - now handled by React BookmarkCleanupButtonPortal
}

let initialized = false;

export function initBookmarkCleanup() {
  if (initialized) return;
  initialized = true;
  initFeatureTips();
  initBookmarkCleanupSettings();
}

import React from 'react';

// 书签清理插件相关常量
const CLEANUP_EXTENSION = {
    ID: 'aeehapalakdoclgmfeondmephgiandef',
    STORE_URL: 'https://chromewebstore.google.com/detail/lazycat-bookmark-cleaner/aeehapalakdoclgmfeondmephgiandef'
};

/**
 * Check if the cleanup extension is installed.
 * @returns {Promise<boolean>}
 */
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
 * React component for the Bookmark Cleanup action button.
 */
export function BookmarkCleanupButton() {
    const handleClick = async () => {
        try {
            await checkExtensionInstalled();
            window.open(`chrome-extension://${CLEANUP_EXTENSION.ID}/index.html`, '_blank');
        } catch (error) {
            const confirmInstall = confirm(chrome.i18n.getMessage('bookmarkCleanupNotInstalled'));
            if (confirmInstall) {
                window.open(CLEANUP_EXTENSION.STORE_URL, '_blank');
            }
        }
    };

    return (
        <button
            className="primary-button"
            onClick={handleClick}
        >
            <span className="material-icons">cleaning_services</span>
            <span data-i18n="openBookmarkCleanup">打开书签清理工具</span>
        </button>
    );
}

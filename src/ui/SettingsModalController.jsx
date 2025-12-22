import { useEffect, useCallback } from 'react';
import { setQuickLinksVisibility } from '../quick-links.js';
import { initWallpaper } from '../wallpaper.js';
import {
    applyBackgroundClass,
    clearActiveBackgroundOptions,
    readBackgroundState,
    setActiveBackgroundOption
} from '../background-state.js';
import { getWelcomeManager } from '../welcome.js';

/**
 * SettingsModalController - React component that handles settings modal
 * open/close logic, keyboard shortcuts, and initialization.
 * 
 * This component migrates the event handling from settings-modal-controller.js
 * to React, providing proper cleanup and lifecycle management.
 */
export function SettingsModalController() {
    // Initialize Quick Links visibility from storage
    const initQuickLinksVisibility = useCallback(() => {
        chrome.storage.sync.get(['enableQuickLinks'], (result) => {
            setQuickLinksVisibility(result.enableQuickLinks !== false);
        });
    }, []);

    // Load saved background/wallpaper settings
    const loadSavedSettings = useCallback(() => {
        const savedBg = localStorage.getItem('selectedBackground');
        const useDefaultBackground = localStorage.getItem('useDefaultBackground');
        const hasWallpaper = localStorage.getItem('originalWallpaper');

        if (useDefaultBackground === 'true' && savedBg) {
            setActiveBackgroundOption(document, savedBg);
            adjustWelcomeTextColor();
        } else if (hasWallpaper) {
            clearActiveBackgroundOptions(document);
        }

        // Apply background class from persisted state
        const state = readBackgroundState(localStorage);
        if (state.useDefaultBackground === 'true' && state.selectedBackground) {
            applyBackgroundClass(document, state.selectedBackground);
        }
    }, []);

    const adjustWelcomeTextColor = useCallback(() => {
        const welcomeElement = document.getElementById('welcome-message');
        const welcomeManager = getWelcomeManager?.() || window.WelcomeManager;
        if (welcomeElement && welcomeManager) {
            welcomeManager.adjustTextColor(welcomeElement);
        }
    }, []);

    // Close modal function
    const closeModal = useCallback(() => {
        const modalEl = document.getElementById('settings-modal');
        if (modalEl) {
            modalEl.style.display = 'none';
        }
    }, []);

    // Check if modal is open
    const isModalOpen = useCallback(() => {
        const modalEl = document.getElementById('settings-modal');
        if (!modalEl) return false;
        return window.getComputedStyle(modalEl).display !== 'none';
    }, []);

    // Handle click events on modal
    const handleModalClick = useCallback((event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;

        const modalEl = document.getElementById('settings-modal');
        if (!modalEl) return;

        // Close on close button click
        if (target.classList.contains('settings-modal-close')) {
            closeModal();
            return;
        }

        // Close on modal backdrop click
        if (target === modalEl) {
            closeModal();
            return;
        }
    }, [closeModal]);

    // Handle Escape key to close modal
    const handleKeyDown = useCallback((event) => {
        if (event.key === 'Escape' && isModalOpen()) {
            closeModal();
        }
    }, [closeModal, isModalOpen]);

    // Handle custom event to open settings modal
    const handleOpenSettings = useCallback(() => {
        const modalEl = document.getElementById('settings-modal');
        if (!modalEl) return;

        // Ensure wallpaper logic is ready
        initWallpaper();

        // Load saved settings before showing
        initQuickLinksVisibility();
        loadSavedSettings();

        modalEl.style.display = 'block';
        // Force reflow for animation
        void modalEl.offsetHeight;
    }, [initQuickLinksVisibility, loadSavedSettings]);

    useEffect(() => {
        // Initialize settings on mount
        initQuickLinksVisibility();
        loadSavedSettings();

        const modalEl = document.getElementById('settings-modal');
        if (!modalEl) return;

        // Add event listeners
        modalEl.addEventListener('click', handleModalClick);
        document.addEventListener('keydown', handleKeyDown);

        // Listen for custom open settings event
        window.addEventListener('ntm:openSettings', handleOpenSettings);

        return () => {
            // Cleanup listeners on unmount
            modalEl.removeEventListener('click', handleModalClick);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('ntm:openSettings', handleOpenSettings);
        };
    }, [handleModalClick, handleKeyDown, handleOpenSettings, initQuickLinksVisibility, loadSavedSettings]);

    // This component doesn't render anything - it just manages events
    return null;
}

/**
 * Open settings modal via custom event.
 * This allows other parts of the app (React or legacy) to trigger the modal.
 */
export function openSettingsModal() {
    window.dispatchEvent(new CustomEvent('ntm:openSettings'));
    return true;
}

/**
 * Close settings modal programmatically.
 */
export function closeSettingsModal() {
    const modalEl = document.getElementById('settings-modal');
    if (!modalEl) return false;
    modalEl.style.display = 'none';
    return true;
}

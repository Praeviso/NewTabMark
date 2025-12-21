/**
 * WallpaperOptionsPortal - React Portal for preset and user wallpaper options
 * Renders wallpaper options into the settings modal via portal
 */
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { WallpaperOption } from './WallpaperOption.jsx';
import { getWallpaperManager } from '../wallpaper.js';
import {
    clearActiveBackgroundOptions,
    readBackgroundState,
    computeBackgroundClassToApply
} from '../background-state.js';

// Preset wallpapers list (matching wallpaper.js)
const PRESET_WALLPAPERS = [
    { url: './../images/wallpapers/wallpaper-1.jpg', title: 'Foggy Forest' },
    { url: './../images/wallpapers/wallpaper-2.jpg', title: 'Mountain Lake' },
    { url: './../images/wallpapers/wallpaper-3.jpg', title: 'Sunset Beach' },
    { url: '../images/wallpapers/wallpaper-4.jpg', title: 'City Night' },
    { url: './../images/wallpapers/wallpaper-5.jpg', title: 'Aurora' },
    { url: './../images/wallpapers/wallpaper-6.jpg', title: 'Desert Dunes' },
    { url: './../images/wallpapers/wallpaper-7.jpg', title: 'Mountain View' },
    { url: './../images/wallpapers/wallpaper-8.jpg', title: 'Forest Lake' },
    { url: './../images/wallpapers/wallpaper-9.jpg', title: 'Sunset Hills' },
    { url: './../images/wallpapers/wallpaper-10.jpg', title: 'Ocean View' }
];

/**
 * Normalize wallpaper key for comparison (strip query/hash from URLs)
 */
function normalizeWallpaperKey(value) {
    if (!value || typeof value !== 'string') return '';
    if (value.startsWith('data:')) return value;
    return value.split('#')[0].split('?')[0];
}

/**
 * Get active wallpaper URL from localStorage
 */
function getActiveWallpaperUrl() {
    const backgroundState = readBackgroundState(localStorage);
    const bgClassToApply = computeBackgroundClassToApply(backgroundState);

    // If a solid background is active, no wallpaper should be selected
    if (bgClassToApply) return null;

    return localStorage.getItem('selectedWallpaper') || localStorage.getItem('originalWallpaper');
}

/**
 * Load user wallpapers from localStorage
 */
function loadUserWallpapers() {
    try {
        const saved = localStorage.getItem('userWallpapers');
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

export function WallpaperOptionsPortal() {
    const [container, setContainer] = useState(null);
    const [activeUrl, setActiveUrl] = useState(() => getActiveWallpaperUrl());
    const [userWallpapers, setUserWallpapers] = useState(() => loadUserWallpapers());
    const [uploadedBadgeText, setUploadedBadgeText] = useState('');

    // Find and observe mount point
    useEffect(() => {
        const findContainer = () => {
            const el = document.getElementById('ntm-wallpaper-options');
            if (el && el !== container) {
                setContainer(el);
            }
        };

        findContainer();

        const observer = new MutationObserver(() => {
            findContainer();
        });
        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, [container]);

    // Get localized badge text
    useEffect(() => {
        try {
            setUploadedBadgeText(chrome.i18n.getMessage('uploadedWallpaperBadge') || '已上传');
        } catch {
            setUploadedBadgeText('已上传');
        }
    }, []);

    // Listen for wallpaper changes (from uploads or other sources)
    useEffect(() => {
        const handleStorageChange = () => {
            setActiveUrl(getActiveWallpaperUrl());
            setUserWallpapers(loadUserWallpapers());
        };

        // Listen for storage events (cross-tab)
        window.addEventListener('storage', handleStorageChange);

        // Listen for custom wallpaper change events
        const handleWallpaperChange = () => handleStorageChange();
        window.addEventListener('ntm-wallpaper-changed', handleWallpaperChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('ntm-wallpaper-changed', handleWallpaperChange);
        };
    }, []);

    // Handle wallpaper option click
    const handleWallpaperClick = useCallback((url) => {
        // Clear background option active states
        clearActiveBackgroundOptions(document);

        // Update local active state immediately
        setActiveUrl(url);

        // Delegate to WallpaperManager for actual wallpaper application
        const manager = getWallpaperManager();
        if (manager) {
            // Clear all active states first
            manager.clearAllActiveStates?.();

            // Apply the wallpaper
            manager.setWallpaper?.(url);

            // Clear solid background flag
            localStorage.removeItem('useDefaultBackground');
            document.documentElement.className = '';
        }

        // Dispatch custom event for synchronization
        window.dispatchEvent(new CustomEvent('ntm-wallpaper-changed'));
    }, []);

    // Check if a URL matches the active wallpaper
    const isActive = useCallback((url) => {
        if (!activeUrl) return false;
        return normalizeWallpaperKey(url) === normalizeWallpaperKey(activeUrl);
    }, [activeUrl]);

    if (!container) return null;

    return createPortal(
        <>
            {/* Preset wallpapers */}
            {PRESET_WALLPAPERS.map((preset) => (
                <WallpaperOption
                    key={preset.url}
                    url={preset.url}
                    title={preset.title}
                    isActive={isActive(preset.url)}
                    onClick={() => handleWallpaperClick(preset.url)}
                />
            ))}
            {/* User uploaded wallpapers */}
            {userWallpapers.map((wallpaper, index) => (
                <WallpaperOption
                    key={`user-${index}-${wallpaper.timestamp || index}`}
                    url={wallpaper.url}
                    title={wallpaper.title || uploadedBadgeText}
                    isActive={isActive(wallpaper.url)}
                    isUploaded={true}
                    uploadedBadgeText={uploadedBadgeText}
                    onClick={() => handleWallpaperClick(wallpaper.url)}
                />
            ))}
        </>,
        container
    );
}

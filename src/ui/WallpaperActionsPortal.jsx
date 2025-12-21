import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { WallpaperAction } from './WallpaperAction.jsx';
import { getWallpaperManager, initWallpaper } from '../wallpaper.js';

/**
 * Get localized message from Chrome i18n API.
 * @param {string} key - Message key
 * @param {string} [fallback] - Fallback text
 */
function getMessage(key, fallback = '') {
    return chrome?.i18n?.getMessage(key) || fallback;
}

/**
 * Portal component that renders wallpaper action buttons in the settings modal.
 */
export function WallpaperActionsPortal() {
    const [container, setContainer] = useState(null);
    const uploadInputRef = useRef(null);

    // Find container on mount
    useEffect(() => {
        const el = document.getElementById('ntm-wallpaper-actions');
        if (el) {
            setContainer(el);
        }
    }, []);

    // Ensure WallpaperManager is initialized when settings modal opens
    useEffect(() => {
        if (!container) return;

        // Observe settings modal visibility to init wallpaper manager
        const settingsModal = document.getElementById('settings-modal');
        if (!settingsModal) return;

        const observer = new MutationObserver(() => {
            const isVisible = window.getComputedStyle(settingsModal).display !== 'none';
            if (isVisible) {
                initWallpaper();
            }
        });

        observer.observe(settingsModal, { attributes: true, attributeFilter: ['style'] });

        return () => observer.disconnect();
    }, [container]);

    const handleResetClick = () => {
        const manager = getWallpaperManager();
        if (manager?.resetWallpaper) {
            manager.resetWallpaper();
        }
    };

    const handleUploadClick = () => {
        // The label's htmlFor will trigger the input click
        // No additional action needed here
    };

    const handleFileChange = (event) => {
        const manager = getWallpaperManager();
        if (manager?.handleFileUpload) {
            manager.handleFileUpload(event);
        }
    };

    if (!container) return null;

    return createPortal(
        <>
            <WallpaperAction
                type="reset"
                icon="refresh"
                label={getMessage('resetWallpaper', '恢复默认背景')}
                onClick={handleResetClick}
            />
            <WallpaperAction
                type="upload"
                icon="upload"
                label={getMessage('uploadWallpaper', '上传壁纸')}
                inputId="upload-wallpaper"
                onClick={handleUploadClick}
            >
                <input
                    ref={uploadInputRef}
                    type="file"
                    id="upload-wallpaper"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
            </WallpaperAction>
        </>,
        container
    );
}

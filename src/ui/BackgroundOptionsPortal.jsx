import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BackgroundOption } from './BackgroundOption.jsx';
import {
    applyBackgroundClass,
    persistBackgroundSelection,
    readBackgroundState,
    setActiveBackgroundOption
} from '../background-state.js';
import { clearWallpaperState } from '../wallpaper.js';

const BACKGROUND_OPTIONS = [
    'gradient-background-1',
    'gradient-background-2',
    'gradient-background-3',
    'gradient-background-4',
    'gradient-background-5',
    'gradient-background-6',
    'gradient-background-7'
];

/**
 * Clears wallpaper state and triggers event for welcome text color update.
 */
function clearWallpaper(doc) {
    doc.querySelectorAll('.wallpaper-option').forEach((opt) => {
        opt.classList.remove('active');
    });

    clearWallpaperState();
    localStorage.removeItem('originalWallpaper');

    // Notify React WelcomeMessage component to recalculate color
    window.dispatchEvent(new CustomEvent('ntm:background-changed'));
}

/**
 * Portal component that renders background color options in the settings modal.
 */
export function BackgroundOptionsPortal() {
    const [activeBackground, setActiveBackground] = useState(null);
    const [container, setContainer] = useState(null);

    // Initialize: find container and load saved state
    useEffect(() => {
        const el = document.getElementById('ntm-background-options');
        if (el) {
            setContainer(el);
        }

        // Load initial state
        const state = readBackgroundState(localStorage);
        if (state.useDefaultBackground === 'true' && state.selectedBackground) {
            setActiveBackground(state.selectedBackground);
        } else if (!state.originalWallpaper) {
            // Default fallback
            setActiveBackground('gradient-background-7');
        }
    }, []);

    // Listen for storage changes (e.g., from wallpaper selection)
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === 'selectedBackground' || e.key === 'useDefaultBackground' || e.key === 'originalWallpaper') {
                const state = readBackgroundState(localStorage);
                if (state.originalWallpaper) {
                    // Wallpaper is set, no background should be active
                    setActiveBackground(null);
                } else if (state.useDefaultBackground === 'true' && state.selectedBackground) {
                    setActiveBackground(state.selectedBackground);
                }
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const handleOptionClick = (bgClass) => {
        const doc = document;

        // Update React state
        setActiveBackground(bgClass);

        // Apply to DOM (for legacy compatibility)
        setActiveBackgroundOption(doc, bgClass);
        applyBackgroundClass(doc, bgClass);
        persistBackgroundSelection(localStorage, bgClass);

        // Clear any existing wallpaper
        clearWallpaper(doc);
    };

    if (!container) return null;

    return createPortal(
        <>
            {BACKGROUND_OPTIONS.map((bgClass) => (
                <BackgroundOption
                    key={bgClass}
                    bgClass={bgClass}
                    isActive={activeBackground === bgClass}
                    onClick={() => handleOptionClick(bgClass)}
                />
            ))}
        </>,
        container
    );
}

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ICONS } from '../icons.js';
import { getLocalizedMessageSafe } from '../localization.js';

/**
 * Feature Tips Component - Displays new feature notifications
 * Migrated from legacy DOM manipulation in feature-tips.js
 */
export function FeatureTips({ featureKey, onClose }) {
    const [isVisible, setIsVisible] = useState(true);
    const [isFadingOut, setIsFadingOut] = useState(false);

    const getMessage = (messageName, fallback = messageName) => {
        return getLocalizedMessageSafe(messageName, fallback);
    };

    const handleClose = () => {
        setIsFadingOut(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose?.();
        }, 300);
    };

    if (!isVisible) return null;

    const messageText = getMessage(featureKey + 'Feature', featureKey + 'Feature').replace(
        /\n/g,
        '<br>'
    );

    return (
        <div
            className="feature-tips"
            style={{ opacity: isFadingOut ? 0 : 1, transition: 'opacity 0.3s' }}
        >
            <div className="feature-tips-content">
                <div className="tip-content">
                    <span
                        dangerouslySetInnerHTML={{ __html: ICONS.info }}
                    />
                    <div className="tip-text">
                        <div className="feature-tips-title">
                            {getMessage('newFeatureTitle', 'New Feature')}
                        </div>
                        <div
                            className="feature-description"
                            dangerouslySetInnerHTML={{ __html: messageText }}
                        />
                    </div>
                    <button
                        className="tip-close"
                        aria-label="关闭提示"
                        onClick={handleClose}
                    >
                        <span
                            dangerouslySetInnerHTML={{ __html: ICONS.close }}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Version features mapping - add new version features here
const VERSION_FEATURES = {
    '1.238': ['bookmarkCleanup'],
    '1.239': ['sidebarFeatures']
};

/**
 * Compare version strings
 * @param {string} current Current version
 * @param {string} last Last known version
 * @returns {boolean} True if current is newer than last
 */
function isNewerVersion(current, last) {
    if (!last) return true;

    const currentParts = current.split('.').map(Number);
    const lastParts = last.split('.').map(Number);

    for (let i = 0; i < currentParts.length; i++) {
        if (currentParts[i] > (lastParts[i] || 0)) return true;
        if (currentParts[i] < (lastParts[i] || 0)) return false;
    }
    return false;
}

/**
 * Get features between two versions
 * @param {string|null} lastVersion Previous version
 * @param {string} currentVersion Current version
 * @returns {string[]} Array of feature keys
 */
function getVersionFeatures(lastVersion, currentVersion) {
    const features = [];

    if (!lastVersion) {
        const currentFeatures = VERSION_FEATURES[currentVersion];
        return currentFeatures ? currentFeatures : [];
    }

    for (const [version, featureList] of Object.entries(VERSION_FEATURES)) {
        if (
            isNewerVersion(version, lastVersion) &&
            !isNewerVersion(version, currentVersion)
        ) {
            features.push(...featureList);
        }
    }

    return features;
}

/**
 * Feature Tips Portal - Mounts feature tips to document.body
 * Manages multiple active tips, version checking, and feature detection.
 * 
 * Migrated from legacy feature-tips.js - now fully React-driven.
 */
export function FeatureTipsPortal() {
    const [tips, setTips] = useState([]);
    const initializedRef = useRef(false);

    // Add a tip to the display
    const addTip = useCallback((featureKey) => {
        setTips(prev => {
            if (prev.some(t => t.featureKey === featureKey)) return prev;
            return [...prev, { id: Date.now(), featureKey }];
        });
    }, []);

    // Check if a specific feature tip should be shown
    const checkShowTips = useCallback((featureKey) => {
        const storageKey = `hasShown${featureKey}Tips`;
        const hasShownTips = localStorage.getItem(storageKey);

        if (!hasShownTips) {
            addTip(featureKey);
            localStorage.setItem(storageKey, 'true');
        }
    }, [addTip]);

    // Show settings update tip via custom event
    const showSettingsUpdateTip = useCallback(() => {
        const settingsTipShown = localStorage.getItem('settingsUpdateTipShown') === 'true';
        if (settingsTipShown) return;

        // Dispatch event for React SettingsIcon component to handle
        window.dispatchEvent(new CustomEvent('ntm:show-settings-update-tip'));
    }, []);

    // Show search engine update tip (if element exists) or fall back to settings tip
    const showSearchEngineUpdateTip = useCallback(() => {
        const searchTipShown = localStorage.getItem('searchEngineUpdateTipShown') === 'true';
        if (searchTipShown) {
            showSettingsUpdateTip();
            return;
        }

        const tipContainer = document.querySelector('.search-engine-update-tip');
        if (!tipContainer) {
            // New Tab does not include the search-engine tip; fall back to settings tip
            showSettingsUpdateTip();
            return;
        }

        tipContainer.style.display = 'block';

        // Bind close handler once
        if (tipContainer.dataset.closeBound !== 'true') {
            tipContainer.dataset.closeBound = 'true';
            const closeButton = tipContainer.querySelector('.tip-close');
            if (closeButton) {
                closeButton.addEventListener('click', () => {
                    tipContainer.classList.add('tip-fade-out');
                    setTimeout(() => {
                        tipContainer.style.display = 'none';
                        localStorage.setItem('searchEngineUpdateTipShown', 'true');
                        showSettingsUpdateTip();
                    }, 300);
                });
            }
        }
    }, [showSettingsUpdateTip]);

    // Initialize all tips
    const initAllTips = useCallback(() => {
        const settingsTip = document.querySelector('.settings-update-tip');
        if (settingsTip) {
            settingsTip.style.display = 'none';
        }
        showSearchEngineUpdateTip();
    }, [showSearchEngineUpdateTip]);

    // Check version update and show relevant tips
    const checkVersionUpdate = useCallback(async () => {
        const manifest = chrome.runtime.getManifest();
        const currentVersion = manifest.version;
        const lastVersion = localStorage.getItem('lastVersion');

        if (!lastVersion || isNewerVersion(currentVersion, lastVersion)) {
            const features = getVersionFeatures(lastVersion, currentVersion);

            for (const feature of features) {
                checkShowTips(feature);
            }

            localStorage.setItem('lastVersion', currentVersion);
        }
    }, [checkShowTips]);

    // Main initialization effect
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        // Run version check and tips initialization
        const init = async () => {
            await checkVersionUpdate();
            initAllTips();
        };
        init();
    }, [checkVersionUpdate, initAllTips]);

    // Listen for external show-tip events
    useEffect(() => {
        const handleShowTip = (event) => {
            const { featureKey } = event.detail;
            if (!featureKey) return;
            addTip(featureKey);
        };

        window.addEventListener('ntm:show-feature-tip', handleShowTip);

        return () => {
            window.removeEventListener('ntm:show-feature-tip', handleShowTip);
        };
    }, [addTip]);

    const handleCloseTip = (id) => {
        setTips(prev => prev.filter(t => t.id !== id));
    };

    if (tips.length === 0) return null;

    return createPortal(
        <>
            {tips.map((tip) => (
                <FeatureTips
                    key={tip.id}
                    featureKey={tip.featureKey}
                    onClose={() => handleCloseTip(tip.id)}
                />
            ))}
        </>,
        document.body
    );
}

export default FeatureTipsPortal;

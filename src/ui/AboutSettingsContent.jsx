import React, { useState, useEffect } from 'react';

/**
 * Gets localized message from Chrome i18n API.
 */
function getLocalizedMessage(key) {
    if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage) {
        return chrome.i18n.getMessage(key) || key;
    }
    return key;
}

/**
 * AboutSettingsContent component displays version info and description
 * in the About tab of the settings modal.
 */
export function AboutSettingsContent() {
    const [version, setVersion] = useState('');

    useEffect(() => {
        // Load version from Chrome manifest
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest) {
            const manifest = chrome.runtime.getManifest();
            const versionText = getLocalizedMessage('version');
            // Format: "Version X.X.X" or localized equivalent
            setVersion(versionText.includes('%s')
                ? versionText.replace('%s', manifest.version)
                : `${versionText} ${manifest.version}`);
        }
    }, []);

    return (
        <div className="about-content">
            <img
                src="../images/logo.svg"
                alt="NewTabMark Logo"
                className="about-logo"
            />
            <p className="about-version">
                {version}
            </p>
            <p className="about-description">
                {getLocalizedMessage('aboutDescription')}
            </p>
        </div>
    );
}

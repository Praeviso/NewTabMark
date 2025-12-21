import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SettingsTabButton } from './SettingsTabButton.jsx';

const TABS_CONFIG = [
    { name: 'appearance', i18nKey: 'appearanceTab', defaultLabel: '外观设置' },
    { name: 'floating-ball', i18nKey: 'floatingBallTab', defaultLabel: '悬浮球设置' },
    { name: 'quick-links', i18nKey: 'quickLinksTab', defaultLabel: '网站推荐' },
    { name: 'link-opening', i18nKey: 'linkOpeningTab', defaultLabel: '链接打开方式' },
    { name: 'bookmark-management', i18nKey: 'bookmarkManagementTab', defaultLabel: '书签管理' },
    { name: 'about', i18nKey: 'aboutTab', defaultLabel: '关于' }
];

/**
 * Updates tab content visibility in the DOM.
 * Shows the selected tab content and hides others.
 */
function switchTabContent(tabName) {
    const tabContents = document.querySelectorAll('.settings-tab-content');
    tabContents.forEach((content) => {
        content.classList.remove('active');
    });

    const selectedContent = document.getElementById(`${tabName}-settings`);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
}

/**
 * Portal component that renders settings tab buttons.
 */
export function SettingsTabsPortal() {
    const [activeTab, setActiveTab] = useState('appearance');
    const [container, setContainer] = useState(null);

    // Find container on mount
    useEffect(() => {
        const el = document.getElementById('ntm-settings-tabs');
        if (el) {
            setContainer(el);
        }
    }, []);

    // Sync tab content visibility when active tab changes
    useEffect(() => {
        switchTabContent(activeTab);
    }, [activeTab]);

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
    };

    if (!container) return null;

    return createPortal(
        <>
            {TABS_CONFIG.map((tab) => (
                <SettingsTabButton
                    key={tab.name}
                    tabName={tab.name}
                    label={tab.defaultLabel}
                    i18nKey={tab.i18nKey}
                    isActive={activeTab === tab.name}
                    onClick={handleTabClick}
                />
            ))}
        </>,
        container
    );
}

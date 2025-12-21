import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SettingsSwitch } from './SettingsSwitch.jsx';
import { setQuickLinksVisibility } from '../quick-links.js';

/**
 * 设置开关 Portal
 * 将 React Switch 组件渲染到 legacy DOM 中的占位元素
 */

const SWITCH_CONFIGS = [
    {
        id: 'enable-floating-ball',
        portalId: 'ntm-settings-switch-floating-ball',
        storageKey: 'enableFloatingBall',
        i18nKey: 'enableFloatingBall',
        defaultLabel: '启用悬浮球',
        defaultValue: true,
        onChangeExtra: (isEnabled) => {
            // 通知 background 更新悬浮球设置
            chrome.runtime.sendMessage({ action: 'updateFloatingBallSetting', enabled: isEnabled }, () => {
                if (!chrome.runtime.lastError) return;
                chrome.storage.sync.set({ enableFloatingBall: isEnabled });
            });
        }
    },
    {
        id: 'enable-quick-links',
        portalId: 'ntm-settings-switch-quick-links',
        storageKey: 'enableQuickLinks',
        i18nKey: 'enableQuickLinks',
        defaultLabel: '启用快捷链接',
        defaultValue: true,
        onChangeExtra: (isEnabled) => {
            setQuickLinksVisibility(isEnabled);
        }
    },
    {
        id: 'open-in-new-tab',
        portalId: 'ntm-settings-switch-open-in-new-tab',
        storageKey: 'openInNewTab',
        i18nKey: 'openInNewTab',
        defaultLabel: '在新标签页中打开',
        defaultValue: true,
        onChangeExtra: null
    }
];

function SingleSwitchPortal({ config }) {
    const [checked, setChecked] = useState(config.defaultValue);
    const [portalTarget, setPortalTarget] = useState(null);

    useEffect(() => {
        // 查找 portal 挂载点
        const target = document.getElementById(config.portalId);
        if (target) {
            setPortalTarget(target);
        }

        // 从 storage 加载初始值
        chrome.storage.sync.get([config.storageKey], (result) => {
            const value = result[config.storageKey];
            setChecked(value !== false); // 默认为 true
        });
    }, [config.portalId, config.storageKey]);

    const handleChange = (newChecked) => {
        setChecked(newChecked);
        chrome.storage.sync.set({ [config.storageKey]: newChecked });
        config.onChangeExtra?.(newChecked);
    };

    if (!portalTarget) return null;

    return createPortal(
        <SettingsSwitch
            id={config.id}
            label={config.defaultLabel}
            checked={checked}
            onChange={handleChange}
            i18nKey={config.i18nKey}
        />,
        portalTarget
    );
}

export function SettingsSwitchPortal() {
    return (
        <>
            {SWITCH_CONFIGS.map((config) => (
                <SingleSwitchPortal key={config.id} config={config} />
            ))}
        </>
    );
}

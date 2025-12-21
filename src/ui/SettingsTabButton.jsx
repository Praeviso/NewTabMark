import React from 'react';

/**
 * 设置弹窗标签页按钮组件
 * 保留 legacy CSS 类 .settings-tab-button 和 .active
 */
export function SettingsTabButton({ tabName, label, isActive, onClick, i18nKey }) {
    const handleClick = () => {
        onClick?.(tabName);
    };

    return (
        <button
            className={`settings-tab-button block w-full py-2.5 px-4 mb-2.5 text-left bg-transparent border-none cursor-pointer text-sm font-medium text-slate-700${isActive ? ' active' : ''}`}
            data-tab={tabName}
            data-i18n={i18nKey}
            onClick={handleClick}
        >
            {label}
        </button>
    );
}

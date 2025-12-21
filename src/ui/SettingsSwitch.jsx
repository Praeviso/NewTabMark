import React from 'react';

/**
 * 设置开关组件
 * 保留 legacy CSS 类 .switch, .slider.round
 */
export function SettingsSwitch({ id, label, checked, onChange, i18nKey }) {
    const handleChange = (e) => {
        onChange?.(e.target.checked);
    };

    return (
        <div className="setting-option flex justify-between items-center mt-4 text-sm">
            <label htmlFor={id} className="switch-label" data-i18n={i18nKey}>
                {label}
            </label>
            <label className="switch">
                <input
                    type="checkbox"
                    id={id}
                    checked={checked}
                    onChange={handleChange}
                />
                <span className="slider round"></span>
            </label>
        </div>
    );
}

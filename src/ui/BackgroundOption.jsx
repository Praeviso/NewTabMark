import React from 'react';

/**
 * Single background color option button.
 * @param {Object} props
 * @param {string} props.bgClass - Background class name (e.g., 'gradient-background-1')
 * @param {boolean} props.isActive - Whether this option is currently selected
 * @param {() => void} props.onClick - Click handler
 */
export function BackgroundOption({ bgClass, isActive, onClick }) {
    return (
        <div
            className={`settings-bg-option ${bgClass}${isActive ? ' active' : ''}`}
            data-bg={bgClass}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
        />
    );
}

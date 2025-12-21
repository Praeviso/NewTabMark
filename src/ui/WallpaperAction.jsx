import React from 'react';

/**
 * Single wallpaper action button (reset or upload).
 * @param {Object} props
 * @param {'reset' | 'upload'} props.type - Button type
 * @param {Function} props.onClick - Click handler
 * @param {string} props.icon - Material icon name
 * @param {string} props.label - Button label text
 * @param {string} [props.inputId] - ID for file input (upload type only)
 * @param {React.ReactNode} [props.children] - Optional children (e.g., hidden input)
 */
export function WallpaperAction({ type, onClick, icon, label, inputId, children }) {
    if (type === 'upload') {
        return (
            <>
                <label
                    htmlFor={inputId}
                    className="upload-wallpaper-label"
                    onClick={onClick}
                >
                    <span className="material-icons">{icon}</span>
                    <span>{label}</span>
                </label>
                {children}
            </>
        );
    }

    // Default: reset button
    return (
        <button
            id="reset-wallpaper"
            className="reset-button"
            onClick={onClick}
        >
            <span className="material-icons">{icon}</span>
            <span>{label}</span>
        </button>
    );
}

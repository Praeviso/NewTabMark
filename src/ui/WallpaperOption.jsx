/**
 * WallpaperOption - Individual wallpaper option component
 * Renders a clickable wallpaper thumbnail with optional "uploaded" badge
 */

/**
 * @param {Object} props
 * @param {string} props.url - Wallpaper URL for background image
 * @param {string} props.title - Tooltip title
 * @param {boolean} [props.isActive] - Whether this option is currently selected
 * @param {boolean} [props.isUploaded] - Whether this is a user-uploaded wallpaper
 * @param {string} [props.uploadedBadgeText] - Text for uploaded badge
 * @param {() => void} [props.onClick] - Click handler
 */
export function WallpaperOption({
    url,
    title,
    isActive = false,
    isUploaded = false,
    uploadedBadgeText = '',
    onClick
}) {
    const className = `wallpaper-option${isActive ? ' active' : ''}`;

    return (
        <div
            className={className}
            data-wallpaper-url={url}
            title={title}
            style={{ backgroundImage: `url('${url}')` }}
            onClick={onClick}
        >
            {isUploaded && uploadedBadgeText && (
                <span className="uploaded-wallpaper-badge">{uploadedBadgeText}</span>
            )}
        </div>
    );
}

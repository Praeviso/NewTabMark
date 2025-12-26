import { useEffect, useRef, useCallback } from 'react';
import { ICONS } from '../icons.js';

/**
 * Get localized message from Chrome i18n API
 */
function getLocalizedMessage(messageName, substitutions = []) {
    try {
        return chrome.i18n.getMessage(messageName, substitutions) || messageName;
    } catch (error) {
        return messageName;
    }
}

/**
 * Bookmark Card Context Menu Component
 * Displays a context menu for bookmark cards
 */
export function BookmarkCardContextMenu({
    isOpen,
    position,
    bookmark,
    onClose,
    onOpenNewTab,
    onOpenNewWindow,
    onOpenIncognito,
    onEdit,
    onDelete,
    onCopyLink,
    onCreateQRCode
}) {
    const menuRef = useRef(null);

    // Adjust menu position to stay within viewport
    useEffect(() => {
        if (isOpen && menuRef.current && position) {
            const menu = menuRef.current;
            const rect = menu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let left = position.x;
            let top = position.y;

            if (position.x + rect.width > viewportWidth) {
                left = viewportWidth - rect.width - 5;
            }

            if (position.y + rect.height > viewportHeight) {
                top = viewportHeight - rect.height - 5;
            }

            menu.style.left = `${left}px`;
            menu.style.top = `${top}px`;
        }
    }, [isOpen, position]);

    // Close menu when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        // Use timeout to avoid immediate close from the same click that opened the menu
        const timeoutId = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    const handleMenuItemClick = useCallback((action) => {
        action();
        onClose();
    }, [onClose]);

    if (!isOpen || !bookmark) {
        return null;
    }

    const menuItems = [
        {
            text: getLocalizedMessage('openInNewTab'),
            icon: 'open_in_new',
            action: onOpenNewTab
        },
        {
            text: getLocalizedMessage('openInNewWindow'),
            icon: 'launch',
            action: onOpenNewWindow
        },
        {
            text: getLocalizedMessage('openInIncognito'),
            icon: 'visibility_off',
            action: onOpenIncognito
        },
        {
            text: getLocalizedMessage('editQuickLink'),
            icon: 'edit',
            action: onEdit
        },
        {
            text: getLocalizedMessage('deleteQuickLink'),
            icon: 'delete',
            action: onDelete
        },
        {
            text: getLocalizedMessage('copyLink'),
            icon: 'content_copy',
            action: onCopyLink
        },
        {
            text: getLocalizedMessage('createQRCode'),
            icon: 'qr_code',
            action: onCreateQRCode
        }
    ];

    return (
        <div
            ref={menuRef}
            className="bookmark-context-menu custom-context-menu"
            style={{
                display: 'block',
                position: 'fixed',
                top: position?.y || 0,
                left: position?.x || 0,
                zIndex: 9999
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {menuItems.map((item, index) => (
                <div
                    key={index}
                    className="custom-context-menu-item"
                    onClick={() => handleMenuItemClick(item.action)}
                >
                    <span
                        className="material-icons"
                        style={{ marginRight: '8px', fontSize: '18px' }}
                        dangerouslySetInnerHTML={{ __html: ICONS[item.icon] }}
                    />
                    <span>{item.text}</span>
                </div>
            ))}
        </div>
    );
}

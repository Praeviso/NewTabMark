import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BookmarkCardContextMenu } from './BookmarkCardContextMenu.jsx';

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
 * Portal component for Bookmark Card Context Menu
 * Listens for custom events and renders the menu
 */
export function BookmarkCardContextMenuPortal() {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [bookmark, setBookmark] = useState(null);
    const [portalContainer, setPortalContainer] = useState(null);

    // Find or create portal container
    useEffect(() => {
        let container = document.getElementById('ntm-bookmark-card-menu');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ntm-bookmark-card-menu';
            document.body.appendChild(container);
        }
        setPortalContainer(container);

        return () => {
            if (container && container.parentNode && container.childNodes.length === 0) {
                container.parentNode.removeChild(container);
            }
        };
    }, []);

    // Listen for show event from legacy code
    useEffect(() => {
        const handleShowMenu = (event) => {
            const { id, url, title, x, y } = event.detail || {};
            console.log('[BookmarkCardContextMenuPortal] Received show event:', { id, url, title, x, y });

            if (id) {
                setBookmark({ id, url, title });
                setPosition({ x, y });
                setIsOpen(true);
            }
        };

        const handleHideMenu = () => {
            setIsOpen(false);
        };

        window.addEventListener('ntm:show-bookmark-card-menu', handleShowMenu);
        window.addEventListener('ntm:hide-context-menus', handleHideMenu);

        return () => {
            window.removeEventListener('ntm:show-bookmark-card-menu', handleShowMenu);
            window.removeEventListener('ntm:hide-context-menus', handleHideMenu);
        };
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setBookmark(null);
    }, []);

    // Menu action handlers
    const handleOpenNewTab = useCallback(() => {
        if (!bookmark?.url) return;
        window.open(bookmark.url, '_blank');
    }, [bookmark]);

    const handleOpenNewWindow = useCallback(() => {
        if (!bookmark?.url) return;
        // Dispatch event to legacy code for openInNewWindow
        window.dispatchEvent(new CustomEvent('ntm:open-in-new-window', {
            detail: { url: bookmark.url }
        }));
    }, [bookmark]);

    const handleOpenIncognito = useCallback(() => {
        if (!bookmark?.url) return;
        // Dispatch event to legacy code for openInIncognito
        window.dispatchEvent(new CustomEvent('ntm:open-in-incognito', {
            detail: { url: bookmark.url }
        }));
    }, [bookmark]);

    const handleEdit = useCallback(() => {
        if (!bookmark) return;
        // Dispatch event to open edit bookmark dialog
        window.dispatchEvent(new CustomEvent('ntm:open-edit-bookmark-dialog', {
            detail: { id: bookmark.id, url: bookmark.url, title: bookmark.title }
        }));
    }, [bookmark]);

    const handleDelete = useCallback(() => {
        if (!bookmark) return;

        const message = getLocalizedMessage('confirmDeleteBookmark', [`<strong>${bookmark.title}</strong>`]);

        // Dispatch event to show confirm dialog
        window.dispatchEvent(new CustomEvent('ntm:show-confirm-dialog', {
            detail: {
                message,
                onConfirm: () => {
                    chrome.bookmarks.remove(bookmark.id, () => {
                        // Dispatch event to notify bookmark deleted
                        window.dispatchEvent(new CustomEvent('ntm:bookmark-deleted', {
                            detail: { bookmarkId: bookmark.id }
                        }));

                        // Show toast via Utilities if available
                        if (window.Utilities?.showToast) {
                            window.Utilities.showToast(getLocalizedMessage('bookmarkDeleted'));
                        }
                    });
                }
            }
        }));
    }, [bookmark]);

    const handleCopyLink = useCallback(() => {
        if (!bookmark) return;
        // Dispatch event to legacy code for copyBookmarkLink
        window.dispatchEvent(new CustomEvent('ntm:copy-bookmark-link', {
            detail: { id: bookmark.id, url: bookmark.url, title: bookmark.title }
        }));
    }, [bookmark]);

    const handleCreateQRCode = useCallback(() => {
        if (!bookmark) return;
        // Dispatch event to legacy code for createQRCode
        window.dispatchEvent(new CustomEvent('ntm:create-qr-code', {
            detail: { url: bookmark.url, title: bookmark.title }
        }));
    }, [bookmark]);

    if (!portalContainer) {
        return null;
    }

    return createPortal(
        <BookmarkCardContextMenu
            isOpen={isOpen}
            position={position}
            bookmark={bookmark}
            onClose={handleClose}
            onOpenNewTab={handleOpenNewTab}
            onOpenNewWindow={handleOpenNewWindow}
            onOpenIncognito={handleOpenIncognito}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCopyLink={handleCopyLink}
            onCreateQRCode={handleCreateQRCode}
        />,
        portalContainer
    );
}

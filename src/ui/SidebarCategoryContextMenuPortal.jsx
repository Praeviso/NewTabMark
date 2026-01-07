import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SidebarCategoryContextMenu } from './SidebarCategoryContextMenu.jsx';

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
 * Portal component for Sidebar Category Context Menu
 * Listens for custom events and renders the menu
 */
export function SidebarCategoryContextMenuPortal() {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [folder, setFolder] = useState(null);
    const [portalContainer, setPortalContainer] = useState(null);

    // Find or create portal container
    useEffect(() => {
        let container = document.getElementById('ntm-sidebar-category-menu');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ntm-sidebar-category-menu';
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
            const { id, title, x, y, element } = event.detail || {};
            console.log('[SidebarCategoryContextMenuPortal] Received show event:', { id, title, x, y });

            if (id) {
                setFolder({ id, title, element });
                setPosition({ x, y });
                setIsOpen(true);
            }
        };

        const handleHideMenu = () => {
            setIsOpen(false);
        };

        window.addEventListener('ntm:show-sidebar-category-menu', handleShowMenu);
        window.addEventListener('ntm:hide-context-menus', handleHideMenu);

        return () => {
            window.removeEventListener('ntm:show-sidebar-category-menu', handleShowMenu);
            window.removeEventListener('ntm:hide-context-menus', handleHideMenu);
        };
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setFolder(null);
    }, []);

    // Menu action handlers - delegate to legacy functions via events or direct calls
    const handleOpenAll = useCallback(() => {
        if (!folder) return;

        chrome.bookmarks.getChildren(folder.id, (bookmarks) => {
            const validUrls = bookmarks
                .filter(bookmark => bookmark.url)
                .map(bookmark => bookmark.url);

            if (validUrls.length > 0) {
                chrome.runtime.sendMessage({
                    action: 'openMultipleTabsAndGroup',
                    urls: validUrls,
                    groupName: folder.title
                }, (response) => {
                    if (response?.success) {
                        console.log('Bookmarks opened in new tab group');
                    } else {
                        console.error('Error opening bookmarks:', response?.error);
                    }
                });
            }
        });
    }, [folder]);

    const handleShareGist = useCallback(() => {
        if (!folder) return;
        // Dispatch event to legacy code which has the shareBookmarkFolderAsGist function
        window.dispatchEvent(new CustomEvent('ntm:share-folder-gist', {
            detail: { folderId: folder.id, folderTitle: folder.title }
        }));
    }, [folder]);

    const handleShareLink = useCallback(() => {
        if (!folder) return;
        // Dispatch event to legacy code which has the shareBookmarkFolder function
        window.dispatchEvent(new CustomEvent('ntm:share-folder-link', {
            detail: { folderId: folder.id, folderTitle: folder.title }
        }));
    }, [folder]);

    const handleRename = useCallback(() => {
        if (!folder) return;
        // Dispatch event to open edit category dialog
        window.dispatchEvent(new CustomEvent('ntm:open-edit-category-dialog', {
            detail: { id: folder.id, title: folder.title }
        }));
    }, [folder]);

    const handleDelete = useCallback(() => {
        if (!folder) return;

        const message = getLocalizedMessage('confirmDeleteFolder', [`<strong>${folder.title}</strong>`]);

        // Dispatch event to show confirm dialog
        window.dispatchEvent(new CustomEvent('ntm:show-confirm-dialog', {
            detail: {
                message,
                onConfirm: () => {
                    chrome.bookmarks.removeTree(folder.id, () => {
                        // Dispatch event to notify folder deleted
                        window.dispatchEvent(new CustomEvent('ntm:folder-deleted', {
                            detail: { folderId: folder.id }
                        }));

                        // Show toast via Utilities if available
                        if (window.Utilities?.showToast) {
                            window.Utilities.showToast(getLocalizedMessage('categoryDeleted'));
                        }
                    });
                }
            }
        }));
    }, [folder]);

    const handleSetAsHomepage = useCallback(() => {
        if (!folder) return;
        // Dispatch event to set default bookmark
        window.dispatchEvent(new CustomEvent('ntm:set-default-bookmark', {
            detail: { folderId: folder.id }
        }));
    }, [folder]);

    if (!portalContainer) {
        return null;
    }

    return createPortal(
        <SidebarCategoryContextMenu
            key={folder ? `${folder.id}-${position.x}-${position.y}` : 'closed'}
            isOpen={isOpen}
            position={position}
            folder={folder}
            onClose={handleClose}
            onOpenAll={handleOpenAll}
            onShareGist={handleShareGist}
            onShareLink={handleShareLink}
            onRename={handleRename}
            onDelete={handleDelete}
            onSetAsHomepage={handleSetAsHomepage}
        />,
        portalContainer
    );
}

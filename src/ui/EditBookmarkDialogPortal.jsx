import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { EditBookmarkDialog } from './EditBookmarkDialog.jsx';

/**
 * Portal component for Edit Bookmark Dialog
 * Listens for custom events and renders the dialog
 */
export function EditBookmarkDialogPortal() {
    const [isOpen, setIsOpen] = useState(false);
    const [bookmark, setBookmark] = useState(null);
    const [portalContainer, setPortalContainer] = useState(null);

    // Find or create portal container
    useEffect(() => {
        let container = document.getElementById('ntm-edit-bookmark-dialog');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ntm-edit-bookmark-dialog';
            document.body.appendChild(container);
        }
        setPortalContainer(container);

        return () => {
            // Cleanup: remove container if we created it and it's empty
            if (container && container.parentNode && container.childNodes.length === 0) {
                container.parentNode.removeChild(container);
            }
        };
    }, []);

    // Listen for open event from legacy code
    useEffect(() => {
        const handleOpenDialog = (event) => {
            const { id, title, url } = event.detail || {};
            console.log('[EditBookmarkDialogPortal] Received open event:', { id, title, url });

            if (id) {
                setBookmark({ id, title, url });
                setIsOpen(true);
            }
        };

        window.addEventListener('ntm:open-edit-bookmark-dialog', handleOpenDialog);
        return () => {
            window.removeEventListener('ntm:open-edit-bookmark-dialog', handleOpenDialog);
        };
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setBookmark(null);
    }, []);

    const handleSave = useCallback((updatedBookmark) => {
        console.log('[EditBookmarkDialogPortal] Bookmark saved:', updatedBookmark);
        // The dialog already dispatches ntm:bookmark-updated event
        // Additional handling can be done here if needed
    }, []);

    if (!portalContainer) {
        return null;
    }

    return createPortal(
        <EditBookmarkDialog
            isOpen={isOpen}
            bookmark={bookmark}
            onClose={handleClose}
            onSave={handleSave}
        />,
        portalContainer
    );
}

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { EditCategoryDialog } from './EditCategoryDialog.jsx';

/**
 * Portal component for Edit Category Dialog
 * Listens for custom events and renders the dialog
 */
export function EditCategoryDialogPortal() {
    const [isOpen, setIsOpen] = useState(false);
    const [folder, setFolder] = useState(null);
    const [portalContainer, setPortalContainer] = useState(null);

    // Find or create portal container
    useEffect(() => {
        let container = document.getElementById('ntm-edit-category-dialog');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ntm-edit-category-dialog';
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
            const { id, title } = event.detail || {};
            console.log('[EditCategoryDialogPortal] Received open event:', { id, title });

            if (id) {
                setFolder({ id, title });
                setIsOpen(true);
            }
        };

        window.addEventListener('ntm:open-edit-category-dialog', handleOpenDialog);
        return () => {
            window.removeEventListener('ntm:open-edit-category-dialog', handleOpenDialog);
        };
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setFolder(null);
    }, []);

    const handleSave = useCallback((updatedFolder) => {
        console.log('[EditCategoryDialogPortal] Folder saved:', updatedFolder);
        // The dialog already dispatches ntm:category-updated event
        // Additional handling can be done here if needed
    }, []);

    if (!portalContainer) {
        return null;
    }

    return createPortal(
        <EditCategoryDialog
            isOpen={isOpen}
            folder={folder}
            onClose={handleClose}
            onSave={handleSave}
        />,
        portalContainer
    );
}

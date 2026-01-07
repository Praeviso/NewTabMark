import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ShareFolderDialog } from './ShareFolderDialog.jsx';

/**
 * Portal component for ShareFolderDialog
 * Listens for 'ntm:open-share-folder-dialog' custom events from legacy code
 */
export function ShareFolderDialogPortal() {
    const [isOpen, setIsOpen] = useState(false);
    const [folderTitle, setFolderTitle] = useState('');
    const [shareUrl, setShareUrl] = useState('');

    // Listen for event to open dialog
    useEffect(() => {
        const handleOpen = (event) => {
            const { folderTitle: title, shareUrl: url } = event.detail || {};
            console.log('[ShareFolderDialogPortal] Opening dialog:', title, url);
            setFolderTitle(title || '');
            setShareUrl(url || '');
            setIsOpen(true);
        };

        window.addEventListener('ntm:open-share-folder-dialog', handleOpen);
        return () => window.removeEventListener('ntm:open-share-folder-dialog', handleOpen);
    }, []);

    const handleClose = useCallback(() => {
        console.log('[ShareFolderDialogPortal] Closing dialog');
        setIsOpen(false);
        setFolderTitle('');
        setShareUrl('');

        // Notify legacy code that dialog closed
        window.dispatchEvent(new CustomEvent('ntm:share-folder-dialog-closed'));
    }, []);

    return createPortal(
        <ShareFolderDialog
            isOpen={isOpen}
            folderTitle={folderTitle}
            shareUrl={shareUrl}
            onClose={handleClose}
        />,
        document.body
    );
}

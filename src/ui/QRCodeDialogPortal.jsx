import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeDialog } from './QRCodeDialog.jsx';

/**
 * Portal component for QR Code Dialog
 * Listens for custom events and renders the dialog
 */
export function QRCodeDialogPortal() {
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState('');
    const [title, setTitle] = useState('');
    const [portalContainer, setPortalContainer] = useState(null);

    // Find or create portal container
    useEffect(() => {
        let container = document.getElementById('ntm-qr-code-dialog');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ntm-qr-code-dialog';
            document.body.appendChild(container);
        }
        setPortalContainer(container);

        return () => {
            if (container && container.parentNode && container.childNodes.length === 0) {
                container.parentNode.removeChild(container);
            }
        };
    }, []);

    // Listen for show event from React context menu
    useEffect(() => {
        const handleShowDialog = (event) => {
            const { url: eventUrl, title: eventTitle } = event.detail || {};
            console.log('[QRCodeDialogPortal] Received show event:', { url: eventUrl, title: eventTitle });

            if (eventUrl) {
                setUrl(eventUrl);
                setTitle(eventTitle || '');
                setIsOpen(true);
            }
        };

        window.addEventListener('ntm:create-qr-code', handleShowDialog);

        return () => {
            window.removeEventListener('ntm:create-qr-code', handleShowDialog);
        };
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setUrl('');
        setTitle('');
        // Dispatch close event for potential legacy cleanup
        window.dispatchEvent(new CustomEvent('ntm:qr-code-dialog-closed'));
    }, []);

    if (!portalContainer) {
        return null;
    }

    return createPortal(
        <QRCodeDialog
            isOpen={isOpen}
            url={url}
            title={title}
            onClose={handleClose}
        />,
        portalContainer
    );
}

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ConfirmDialog } from './ConfirmDialog.jsx';

/**
 * Portal component for Confirm Dialog
 * Listens for custom events and renders the confirmation dialog
 * 
 * Event: ntm:show-confirm-dialog
 * Detail: { message: string, title?: string, onConfirm?: function }
 */
export function ConfirmDialogPortal() {
    const [isOpen, setIsOpen] = useState(false);
    const [dialogData, setDialogData] = useState({ message: '', title: '' });
    const [confirmCallback, setConfirmCallback] = useState(null);
    const [portalContainer, setPortalContainer] = useState(null);

    // Find or create portal container
    useEffect(() => {
        let container = document.getElementById('ntm-confirm-dialog-portal');
        if (!container) {
            container = document.createElement('div');
            container.id = 'ntm-confirm-dialog-portal';
            document.body.appendChild(container);
        }
        setPortalContainer(container);

        return () => {
            if (container && container.parentNode && container.childNodes.length === 0) {
                container.parentNode.removeChild(container);
            }
        };
    }, []);

    // Listen for show confirm dialog event
    useEffect(() => {
        const handleShowDialog = (event) => {
            const { message, title, onConfirm } = event.detail || {};
            console.log('[ConfirmDialogPortal] Received show event:', { message, title });

            if (message) {
                setDialogData({ message, title: title || '' });
                // Store callback in a way that doesn't trigger re-renders
                setConfirmCallback(() => onConfirm);
                setIsOpen(true);
            }
        };

        window.addEventListener('ntm:show-confirm-dialog', handleShowDialog);
        return () => {
            window.removeEventListener('ntm:show-confirm-dialog', handleShowDialog);
        };
    }, []);

    const handleConfirm = useCallback(() => {
        console.log('[ConfirmDialogPortal] Confirm clicked');
        if (typeof confirmCallback === 'function') {
            confirmCallback();
        }
        setIsOpen(false);
        setDialogData({ message: '', title: '' });
        setConfirmCallback(null);

        // Dispatch event for legacy code cleanup
        window.dispatchEvent(new CustomEvent('ntm:confirm-dialog-closed', {
            detail: { confirmed: true }
        }));
    }, [confirmCallback]);

    const handleCancel = useCallback(() => {
        console.log('[ConfirmDialogPortal] Cancel clicked');
        setIsOpen(false);
        setDialogData({ message: '', title: '' });
        setConfirmCallback(null);

        // Dispatch event for legacy code cleanup
        window.dispatchEvent(new CustomEvent('ntm:confirm-dialog-closed', {
            detail: { confirmed: false }
        }));
    }, []);

    if (!portalContainer) {
        return null;
    }

    return createPortal(
        <ConfirmDialog
            isOpen={isOpen}
            message={dialogData.message}
            title={dialogData.title}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
        />,
        portalContainer
    );
}

/**
 * Helper function to show confirm dialog from legacy code
 * This can be used instead of dispatching events manually
 * 
 * @param {string} message - The confirmation message (supports HTML)
 * @param {function} callback - Callback to execute on confirm
 * @param {string} title - Optional dialog title
 */
export function showConfirmDialogReact(message, callback, title) {
    window.dispatchEvent(new CustomEvent('ntm:show-confirm-dialog', {
        detail: { message, title, onConfirm: callback }
    }));
}

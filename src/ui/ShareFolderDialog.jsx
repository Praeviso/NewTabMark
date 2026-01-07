import { useState, useEffect, useCallback, useRef } from 'react';
import { getLocalizedMessageSafe } from '../localization.js';

/**
 * Share Folder Dialog component
 * Displays share link and QR code for sharing bookmark folders
 */
export function ShareFolderDialog({ isOpen, folderTitle, shareUrl, onClose }) {
    const linkTextareaRef = useRef(null);
    const qrContainerRef = useRef(null);

    // Generate QR code when dialog opens
    useEffect(() => {
        if (isOpen && shareUrl && qrContainerRef.current) {
            // Clear previous QR code
            qrContainerRef.current.innerHTML = '';
            // Generate new QR code using the global QRCode library
            if (typeof QRCode !== 'undefined') {
                try {
                    new QRCode(qrContainerRef.current, {
                        text: shareUrl,
                        width: 200,
                        height: 200
                    });
                } catch (error) {
                    console.error('[ShareFolderDialog] QR code generation failed:', error);
                }
            }
        }
    }, [isOpen, shareUrl]);

    // Handle escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleOverlayClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    const handleCopy = useCallback(async () => {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            // Use the global Utilities.showToast function
            if (typeof window !== 'undefined' && window.Utilities?.showToast) {
                window.Utilities.showToast(getLocalizedMessageSafe('shareLinkCopied', 'Link copied!'));
            }
        } catch (error) {
            console.error('[ShareFolderDialog] Copy failed:', error);
            if (typeof window !== 'undefined' && window.Utilities?.showToast) {
                window.Utilities.showToast(getLocalizedMessageSafe('shareLinkCopyFailed', 'Copy failed'));
            }
        }
    }, [shareUrl]);

    const handleOpen = useCallback(() => {
        if (!shareUrl) return;
        window.open(shareUrl, '_blank');
    }, [shareUrl]);

    if (!isOpen) {
        return null;
    }

    const titleText = getLocalizedMessageSafe('shareFolderDialogTitle', 'Share folder');
    const shareLinkLabel = getLocalizedMessageSafe('shareLinkLabel', 'Share link');
    const copyText = getLocalizedMessageSafe('copyShareLink', 'Copy');
    const openText = getLocalizedMessageSafe('openShareLink', 'Open');

    return (
        <div
            id="share-folder-dialog"
            className="modal"
            style={{ display: 'block' }}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-folder-dialog-title"
        >
            <div className="modal-content">
                <span
                    className="close-button"
                    onClick={onClose}
                    role="button"
                    tabIndex={0}
                    aria-label="Close dialog"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onClose();
                        }
                    }}
                >
                    &times;
                </span>
                <h2 id="share-folder-dialog-title" data-i18n="shareFolderDialogTitle">{titleText}</h2>
                <p><strong>{folderTitle}</strong></p>
                <label htmlFor="share-folder-link-react" data-i18n="shareLinkLabel">{shareLinkLabel}</label>
                <textarea
                    id="share-folder-link-react"
                    ref={linkTextareaRef}
                    className="custom-input"
                    rows={3}
                    readOnly
                    value={shareUrl || ''}
                />
                <div className="buttons">
                    <button
                        className="primary-button"
                        onClick={handleCopy}
                        data-i18n="copyShareLink"
                    >
                        {copyText}
                    </button>
                    <button
                        className="cancel-button"
                        onClick={handleOpen}
                        data-i18n="openShareLink"
                    >
                        {openText}
                    </button>
                </div>
                <div
                    ref={qrContainerRef}
                    style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}
                />
            </div>
        </div>
    );
}

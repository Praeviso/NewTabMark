import { useState, useEffect, useCallback, useRef } from 'react';
import { getLocalizedMessageSafe } from '../localization.js';

/**
 * Edit Bookmark Dialog component
 * Allows editing bookmark title and URL
 */
export function EditBookmarkDialog({ isOpen, bookmark, onClose, onSave }) {
    const [editName, setEditName] = useState('');
    const [editUrl, setEditUrl] = useState('');
    const nameInputRef = useRef(null);

    // Sync state with bookmark prop when dialog opens
    useEffect(() => {
        if (isOpen && bookmark) {
            setEditName(bookmark.title || '');
            setEditUrl(bookmark.url || '');
            // Focus the name input after a short delay
            setTimeout(() => {
                nameInputRef.current?.focus();
            }, 50);
        }
    }, [isOpen, bookmark]);

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

    const handleSubmit = useCallback((e) => {
        e.preventDefault();

        if (!bookmark?.id) {
            console.error('[EditBookmarkDialog] No bookmark ID');
            return;
        }

        const newTitle = editName.trim();
        const newUrl = editUrl.trim();

        if (!newTitle || !newUrl) {
            console.warn('[EditBookmarkDialog] Empty title or URL');
            return;
        }

        // Call Chrome bookmarks API
        chrome.bookmarks.update(bookmark.id, { title: newTitle, url: newUrl }, (updatedBookmark) => {
            if (chrome.runtime.lastError) {
                console.error('[EditBookmarkDialog] Update failed:', chrome.runtime.lastError);
                return;
            }

            console.log('[EditBookmarkDialog] Bookmark updated:', updatedBookmark);

            // Notify legacy code about the update
            window.dispatchEvent(new CustomEvent('ntm:bookmark-updated', {
                detail: {
                    id: bookmark.id,
                    title: newTitle,
                    url: newUrl
                }
            }));

            // Call onSave callback if provided
            if (onSave) {
                onSave({ id: bookmark.id, title: newTitle, url: newUrl });
            }

            onClose();
        });
    }, [bookmark, editName, editUrl, onClose, onSave]);

    const handleOverlayClick = useCallback((e) => {
        // Only close if clicking directly on overlay, not on modal content
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    if (!isOpen) {
        return null;
    }

    const titleText = getLocalizedMessageSafe('editDialogTitle', 'Edit Bookmark');
    const nameLabel = getLocalizedMessageSafe('editNameLabel', 'Name');
    const urlLabel = getLocalizedMessageSafe('editUrlLabel', 'URL');
    const cancelText = getLocalizedMessageSafe('cancelButton', 'Cancel');
    const saveText = getLocalizedMessageSafe('saveButton', 'Save');

    return (
        <div
            className="modal"
            style={{ display: 'block' }}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-dialog-title"
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
                <h2 id="edit-dialog-title" data-i18n="editDialogTitle">{titleText}</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="edit-name-react" data-i18n="editNameLabel">{nameLabel}</label>
                    <input
                        type="text"
                        id="edit-name-react"
                        name="name"
                        ref={nameInputRef}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                    />
                    <label htmlFor="edit-url-react" data-i18n="editUrlLabel">{urlLabel}</label>
                    <input
                        type="url"
                        id="edit-url-react"
                        name="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        required
                    />
                    <div className="form-buttons">
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={onClose}
                            data-i18n="cancelButton"
                        >
                            {cancelText}
                        </button>
                        <button type="submit" data-i18n="saveButton">
                            {saveText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

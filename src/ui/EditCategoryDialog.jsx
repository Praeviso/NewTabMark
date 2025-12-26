import { useState, useEffect, useCallback, useRef } from 'react';
import { getLocalizedMessageSafe } from '../localization.js';

/**
 * Edit Category Dialog component
 * Allows editing bookmark folder title
 */
export function EditCategoryDialog({ isOpen, folder, onClose, onSave }) {
    const [editName, setEditName] = useState('');
    const nameInputRef = useRef(null);

    // Sync state with folder prop when dialog opens
    useEffect(() => {
        if (isOpen && folder) {
            setEditName(folder.title || '');
            // Focus the name input after a short delay
            setTimeout(() => {
                nameInputRef.current?.focus();
                nameInputRef.current?.select();
            }, 50);
        }
    }, [isOpen, folder]);

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

        if (!folder?.id) {
            console.error('[EditCategoryDialog] No folder ID');
            return;
        }

        const newTitle = editName.trim();

        if (!newTitle) {
            console.warn('[EditCategoryDialog] Empty title');
            return;
        }

        // Call Chrome bookmarks API
        chrome.bookmarks.update(folder.id, { title: newTitle }, (updatedBookmark) => {
            if (chrome.runtime.lastError) {
                console.error('[EditCategoryDialog] Update failed:', chrome.runtime.lastError);
                return;
            }

            console.log('[EditCategoryDialog] Folder updated:', updatedBookmark);

            // Notify legacy code about the update
            window.dispatchEvent(new CustomEvent('ntm:category-updated', {
                detail: {
                    id: folder.id,
                    title: newTitle
                }
            }));

            // Call onSave callback if provided
            if (onSave) {
                onSave({ id: folder.id, title: newTitle });
            }

            onClose();
        });
    }, [folder, editName, onClose, onSave]);

    const handleOverlayClick = useCallback((e) => {
        // Only close if clicking directly on overlay, not on modal content
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    if (!isOpen) {
        return null;
    }

    const titleText = getLocalizedMessageSafe('renameFolderTitle', 'Rename Folder');
    const nameLabel = getLocalizedMessageSafe('nameLabel', 'Name');
    const cancelText = getLocalizedMessageSafe('cancelButton', 'Cancel');
    const saveText = getLocalizedMessageSafe('saveButton', 'Save');

    return (
        <div
            id="edit-category-dialog"
            className="modal"
            style={{ display: 'block' }}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-category-dialog-title"
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
                <h2 id="edit-category-dialog-title" data-i18n="renameFolderTitle">{titleText}</h2>
                <form onSubmit={handleSubmit}>
                    <label htmlFor="edit-category-name-react" data-i18n="nameLabel">{nameLabel}</label>
                    <input
                        type="text"
                        id="edit-category-name-react"
                        name="name"
                        ref={nameInputRef}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
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

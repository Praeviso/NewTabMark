import { useState, useEffect, useCallback } from 'react';

/**
 * ConfirmDialog - React化的确认对话框组件
 * 替代原有的 showConfirmDialog 函数
 * 
 * @param {boolean} isOpen - 对话框是否打开
 * @param {string} message - 确认消息 (支持HTML)
 * @param {string} title - 对话框标题
 * @param {function} onConfirm - 确认回调
 * @param {function} onCancel - 取消回调
 */
export function ConfirmDialog({ isOpen, message, title, onConfirm, onCancel }) {
    const [localizedStrings, setLocalizedStrings] = useState({
        confirmDeleteTitle: '确认删除',
        cancelButton: '取消',
        confirmDeleteButton: '删除'
    });

    // Load localized strings
    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.i18n) {
            setLocalizedStrings({
                confirmDeleteTitle: chrome.i18n.getMessage('confirmDeleteTitle') || '确认删除',
                cancelButton: chrome.i18n.getMessage('cancelButton') || '取消',
                confirmDeleteButton: chrome.i18n.getMessage('confirmDeleteButton') || '删除'
            });
        }
    }, []);

    // Handle Escape key to close
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onCancel?.();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel]);

    // Handle click outside to close
    const handleOverlayClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            onCancel?.();
        }
    }, [onCancel]);

    const handleConfirm = useCallback(() => {
        onConfirm?.();
    }, [onConfirm]);

    const handleCancel = useCallback(() => {
        onCancel?.();
    }, [onCancel]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            id="confirm-dialog"
            className="modal"
            style={{ display: 'block' }}
            onClick={handleOverlayClick}
        >
            <div className="modal-content">
                <h2 id="confirm-dialog-title">
                    {title || localizedStrings.confirmDeleteTitle}
                </h2>
                <p
                    id="confirm-dialog-message"
                    dangerouslySetInnerHTML={{ __html: message || '' }}
                />
                <div className="buttons">
                    <button
                        id="cancel-delete-button"
                        className="cancel-button"
                        onClick={handleCancel}
                    >
                        {localizedStrings.cancelButton}
                    </button>
                    <button
                        id="confirm-delete-button"
                        className="delete-button"
                        onClick={handleConfirm}
                    >
                        {localizedStrings.confirmDeleteButton}
                    </button>
                </div>
            </div>
        </div>
    );
}

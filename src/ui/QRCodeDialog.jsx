import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Get localized message from Chrome i18n API
 */
function getLocalizedMessage(messageName) {
    try {
        return chrome.i18n.getMessage(messageName) || messageName;
    } catch (error) {
        return messageName;
    }
}

/**
 * QRCodeDialog - React化的二维码对话框组件
 * 替代原有的 createQRCode 函数
 * 
 * @param {boolean} isOpen - 对话框是否打开
 * @param {string} url - 要生成二维码的URL
 * @param {string} title - 书签标题（用于下载文件名）
 * @param {function} onClose - 关闭回调
 */
export function QRCodeDialog({ isOpen, url, title, onClose }) {
    const qrCodeRef = useRef(null);
    const qrInstanceRef = useRef(null);
    const [copyButtonText, setCopyButtonText] = useState('');
    const [localizedStrings, setLocalizedStrings] = useState({
        scanQRCode: '扫描二维码',
        copyLink: '复制链接',
        copied: '已复制',
        download: '下载'
    });

    // Load localized strings
    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.i18n) {
            setLocalizedStrings({
                scanQRCode: chrome.i18n.getMessage('scanQRCode') || '扫描二维码',
                copyLink: chrome.i18n.getMessage('copyLink') || '复制链接',
                copied: chrome.i18n.getMessage('copied') || '已复制',
                download: chrome.i18n.getMessage('download') || '下载'
            });
        }
        setCopyButtonText(getLocalizedMessage('copyLink'));
    }, []);

    // Generate QR code when dialog opens
    useEffect(() => {
        if (!isOpen || !url || !qrCodeRef.current) return;

        // Clear previous QR code
        qrCodeRef.current.innerHTML = '';
        qrInstanceRef.current = null;

        // Generate new QR code using global QRCode library
        if (typeof QRCode !== 'undefined') {
            try {
                qrInstanceRef.current = new QRCode(qrCodeRef.current, {
                    text: url,
                    width: 200,
                    height: 200
                });
            } catch (error) {
                console.error('Error generating QR code:', error);
            }
        }

        return () => {
            if (qrCodeRef.current) {
                qrCodeRef.current.innerHTML = '';
            }
            qrInstanceRef.current = null;
        };
    }, [isOpen, url]);

    // Handle Escape key to close
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose?.();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Handle click outside to close
    const handleOverlayClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            onClose?.();
        }
    }, [onClose]);

    // Handle copy link
    const handleCopyLink = useCallback(() => {
        if (!url) return;
        navigator.clipboard.writeText(url).then(() => {
            setCopyButtonText(localizedStrings.copied);
            setTimeout(() => {
                setCopyButtonText(localizedStrings.copyLink);
            }, 2000);
        });
    }, [url, localizedStrings]);

    // Handle download QR code
    const handleDownload = useCallback(() => {
        if (!qrCodeRef.current) return;

        // Give QRCode some time to render
        setTimeout(() => {
            const canvas = qrCodeRef.current.querySelector('canvas');
            if (canvas) {
                const link = document.createElement('a');
                // Use bookmark title as filename, sanitize for filesystem
                const safeTitle = (title || 'qrcode').replace(/[^a-z0-9]/gi, '_').toLowerCase();
                link.download = `${safeTitle}_qrcode.png`;
                link.href = canvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }, 100);
    }, [title]);

    if (!isOpen) {
        return null;
    }

    return (
        <div
            className="modal"
            style={{ display: 'block' }}
            onClick={handleOverlayClick}
        >
            <div className="modal-content qr-code-dialog-content">
                {/* Close button */}
                <span className="close-button" onClick={onClose}>
                    ×
                </span>

                {/* Title */}
                <h2 className="qr-code-title">
                    {localizedStrings.scanQRCode}
                </h2>

                {/* QR code container */}
                <div ref={qrCodeRef} className="qr-code-element"></div>

                {/* URL display */}
                <div className="qr-code-url">
                    {url}
                </div>

                {/* Button container */}
                <div className="qr-code-buttons">
                    <button
                        className="qr-code-btn"
                        onClick={handleCopyLink}
                    >
                        {copyButtonText || localizedStrings.copyLink}
                    </button>
                    <button
                        className="qr-code-btn"
                        onClick={handleDownload}
                    >
                        {localizedStrings.download}
                    </button>
                </div>
            </div>
        </div>
    );
}


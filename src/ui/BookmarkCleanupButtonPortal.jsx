import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BookmarkCleanupButton } from './BookmarkCleanupButton.jsx';

/**
 * Portal component that renders the bookmark cleanup button in the settings modal.
 * Mounts to the #ntm-bookmark-cleanup-button container when available.
 */
export function BookmarkCleanupButtonPortal() {
    const [container, setContainer] = useState(null);

    useEffect(() => {
        // Find the container element
        const findContainer = () => {
            const el = document.getElementById('ntm-bookmark-cleanup-button');
            if (el) {
                setContainer(el);
            }
        };

        // Try immediately
        findContainer();

        // Also observe for dynamic injection (settings modal may be injected lazily)
        const observer = new MutationObserver(() => {
            if (!container) {
                findContainer();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, [container]);

    if (!container) return null;

    return createPortal(<BookmarkCleanupButton />, container);
}

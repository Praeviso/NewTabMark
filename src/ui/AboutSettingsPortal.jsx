import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AboutSettingsContent } from './AboutSettingsContent.jsx';

/**
 * Portal component that renders AboutSettingsContent into the settings modal.
 * Mounts to #ntm-about-settings-content element.
 */
export function AboutSettingsPortal() {
    const [container, setContainer] = useState(null);

    useEffect(() => {
        const el = document.getElementById('ntm-about-settings-content');
        if (el) {
            setContainer(el);
        }

        // Watch for modal opening which may create the container
        const observer = new MutationObserver(() => {
            const el = document.getElementById('ntm-about-settings-content');
            if (el && !container) {
                setContainer(el);
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, [container]);

    if (!container) return null;

    return createPortal(<AboutSettingsContent />, container);
}

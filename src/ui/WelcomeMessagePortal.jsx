import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { WelcomeMessage } from './WelcomeMessage.jsx';

/**
 * Portal component that mounts WelcomeMessage to the #ntm-welcome-message container.
 * Uses useEffect to wait for the container to be available in the DOM.
 */
export function WelcomeMessagePortal() {
    const [container, setContainer] = useState(null);

    useEffect(() => {
        // Try to find the container immediately
        const el = document.getElementById('ntm-welcome-message');
        if (el) {
            setContainer(el);
            return;
        }

        // Watch for DOM changes that may create the container
        const observer = new MutationObserver(() => {
            const el = document.getElementById('ntm-welcome-message');
            if (el) {
                setContainer(el);
                observer.disconnect();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, []);

    if (!container) return null;

    return createPortal(<WelcomeMessage />, container);
}

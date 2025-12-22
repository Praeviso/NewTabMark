/**
 * @deprecated This file is superseded by React component:
 * - src/ui/WelcomeMessage.jsx
 * - src/ui/WelcomeMessagePortal.jsx
 *
 * The welcome message functionality is now handled by React.
 * This file is kept only for backward compatibility with legacy imports.
 *
 * External modules can trigger color adjustment via:
 *   window.dispatchEvent(new CustomEvent('ntm:background-changed'));
 */

/**
 * @deprecated Use WelcomeMessage React component instead.
 * Returns a compatibility shim that triggers React via custom events.
 */
export function getWelcomeManager() {
    return {
        adjustTextColor(element) {
            // Trigger React component to recalculate color
            window.dispatchEvent(new CustomEvent('ntm:background-changed'));
        },
        updateWelcomeMessage() {
            // No-op: React component handles updates automatically
        },
        initialize() {
            // No-op: React component self-initializes
        }
    };
}

/**
 * @deprecated No-op function kept for backward compatibility.
 * All initialization is now handled by React WelcomeMessagePortal.
 */
export function initWelcome() {
    // No-op: React component handles all initialization
}

// For backward compatibility with window.WelcomeManager references
if (typeof window !== 'undefined') {
    window.WelcomeManager = getWelcomeManager();
}

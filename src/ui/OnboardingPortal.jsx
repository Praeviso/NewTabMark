import { createPortal } from 'react-dom';
import { Onboarding } from './Onboarding.jsx';

/**
 * Portal wrapper to mount Onboarding overlay on document.body
 * Ensures the overlay renders at z-index 2000 above all other content
 */
export function OnboardingPortal() {
    // Render directly to document.body for proper z-index stacking
    return createPortal(
        <Onboarding />,
        document.body
    );
}

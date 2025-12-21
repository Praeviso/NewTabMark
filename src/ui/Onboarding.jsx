import { useState, useEffect, useCallback } from 'react';
import { getLocalizedMessageSafe } from '../localization.js';

/**
 * Step configuration for onboarding
 */
const ONBOARDING_STEPS = [
    {
        step: 1,
        titleKey: 'onboardingStep1Title',
        titleFallback: 'Search',
        descKey: 'onboardingStep1Desc',
        descFallback: 'Type to search with your favorite engine.',
        image: '../images/logo.svg'
    },
    {
        step: 2,
        titleKey: 'onboardingStep2Title',
        titleFallback: 'Quick Links',
        descKey: 'onboardingStep2Desc',
        descFallback: 'Access frequently visited sites faster.',
        image: '../images/logo.svg'
    },
    {
        step: 3,
        titleKey: 'onboardingStep3Title',
        titleFallback: 'Settings',
        descKey: 'onboardingStep3Desc',
        descFallback: 'Customize theme, wallpaper, and more.',
        image: '../images/logo.svg'
    }
];

/**
 * Onboarding step component
 */
function OnboardingStep({ step, isActive }) {
    const title = getLocalizedMessageSafe(step.titleKey, step.titleFallback);
    const description = getLocalizedMessageSafe(step.descKey, step.descFallback);

    return (
        <div
            className={`onboarding-step ${isActive ? 'active' : ''}`}
            data-step={step.step}
        >
            <img src={step.image} alt="" />
            <h3 data-i18n={step.titleKey}>{title}</h3>
            <p data-i18n={step.descKey}>{description}</p>
        </div>
    );
}

/**
 * Navigation dots component
 */
function OnboardingDots({ currentStep, totalSteps, onDotClick }) {
    return (
        <div className="onboarding-dots" aria-label="steps">
            {Array.from({ length: totalSteps }, (_, index) => (
                <span
                    key={index}
                    className={`dot ${currentStep === index + 1 ? 'active' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`step ${index + 1}`}
                    onClick={() => onDotClick(index + 1)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onDotClick(index + 1);
                        }
                    }}
                />
            ))}
        </div>
    );
}

/**
 * Main Onboarding component
 */
export function Onboarding() {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = ONBOARDING_STEPS.length;

    // Check if onboarding should be shown on mount
    useEffect(() => {
        const completed = localStorage.getItem('onboardingCompleted');
        if (!completed) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    const goToStep = useCallback((step) => {
        if (step >= 1 && step <= totalSteps) {
            setCurrentStep(step);
        }
    }, [totalSteps]);

    const handlePrev = useCallback(() => {
        goToStep(currentStep - 1);
    }, [currentStep, goToStep]);

    const handleNext = useCallback(() => {
        if (currentStep === totalSteps) {
            // Complete onboarding
            setIsVisible(false);
            document.body.style.overflow = '';
            localStorage.setItem('onboardingCompleted', 'true');
        } else {
            goToStep(currentStep + 1);
        }
    }, [currentStep, totalSteps, goToStep]);

    if (!isVisible) {
        return null;
    }

    const prevText = getLocalizedMessageSafe('prevButton', 'Prev');
    const nextText = currentStep === totalSteps
        ? getLocalizedMessageSafe('finishButton', 'Finish')
        : getLocalizedMessageSafe('nextButton', 'Next');
    const titleText = getLocalizedMessageSafe('onboardingTitle', 'Welcome');

    return (
        <div
            id="onboarding-overlay"
            className="onboarding-overlay"
            role="dialog"
            aria-modal="true"
        >
            <div className="onboarding-modal">
                <h2 data-i18n="onboardingTitle">{titleText}</h2>
                <div className="onboarding-steps">
                    {ONBOARDING_STEPS.map((step) => (
                        <OnboardingStep
                            key={step.step}
                            step={step}
                            isActive={currentStep === step.step}
                        />
                    ))}
                </div>
                <div className="onboarding-navigation">
                    <button
                        className="onboarding-prev"
                        type="button"
                        disabled={currentStep === 1}
                        onClick={handlePrev}
                        data-i18n="prevButton"
                    >
                        {prevText}
                    </button>
                    <OnboardingDots
                        currentStep={currentStep}
                        totalSteps={totalSteps}
                        onDotClick={goToStep}
                    />
                    <button
                        className="onboarding-next"
                        type="button"
                        onClick={handleNext}
                        data-i18n={currentStep === totalSteps ? 'finishButton' : 'nextButton'}
                    >
                        {nextText}
                    </button>
                </div>
            </div>
        </div>
    );
}

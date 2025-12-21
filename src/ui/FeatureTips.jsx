import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ICONS } from '../icons.js';
import { getLocalizedMessageSafe } from '../localization.js';

/**
 * Feature Tips Component - Displays new feature notifications
 * Migrated from legacy DOM manipulation in feature-tips.js
 */
export function FeatureTips({ featureKey, onClose }) {
    const [isVisible, setIsVisible] = useState(true);
    const [isFadingOut, setIsFadingOut] = useState(false);

    const getMessage = (messageName, fallback = messageName) => {
        return getLocalizedMessageSafe(messageName, fallback);
    };

    const handleClose = () => {
        setIsFadingOut(true);
        setTimeout(() => {
            setIsVisible(false);
            onClose?.();
        }, 300);
    };

    if (!isVisible) return null;

    const messageText = getMessage(featureKey + 'Feature', featureKey + 'Feature').replace(
        /\n/g,
        '<br>'
    );

    return (
        <div
            className="feature-tips"
            style={{ opacity: isFadingOut ? 0 : 1, transition: 'opacity 0.3s' }}
        >
            <div className="feature-tips-content">
                <div className="tip-content">
                    <span
                        dangerouslySetInnerHTML={{ __html: ICONS.info }}
                    />
                    <div className="tip-text">
                        <div className="feature-tips-title">
                            {getMessage('newFeatureTitle', 'New Feature')}
                        </div>
                        <div
                            className="feature-description"
                            dangerouslySetInnerHTML={{ __html: messageText }}
                        />
                    </div>
                    <button
                        className="tip-close"
                        aria-label="关闭提示"
                        onClick={handleClose}
                    >
                        <span
                            dangerouslySetInnerHTML={{ __html: ICONS.close }}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Feature Tips Portal - Mounts feature tips to document.body
 * Manages multiple active tips and listens for events from feature-tips.js
 */
export function FeatureTipsPortal() {
    const [tips, setTips] = useState([]);

    useEffect(() => {
        const handleShowTip = (event) => {
            const { featureKey } = event.detail;
            if (!featureKey) return;

            // Avoid duplicate tips with the same key
            setTips(prev => {
                if (prev.some(t => t.featureKey === featureKey)) return prev;
                return [...prev, { id: Date.now(), featureKey }];
            });
        };

        window.addEventListener('ntm:show-feature-tip', handleShowTip);



        return () => {
            window.removeEventListener('ntm:show-feature-tip', handleShowTip);
        };
    }, []);

    const handleCloseTip = (id) => {
        setTips(prev => prev.filter(t => t.id !== id));
    };

    if (tips.length === 0) return null;

    return createPortal(
        <>
            {tips.map((tip) => (
                <FeatureTips
                    key={tip.id}
                    featureKey={tip.featureKey}
                    onClose={() => handleCloseTip(tip.id)}
                />
            ))}
        </>,
        document.body
    );
}

export default FeatureTipsPortal;

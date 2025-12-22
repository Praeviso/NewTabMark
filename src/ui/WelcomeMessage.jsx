import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'userName';
const DEFAULT_NAME = 'Orion Wang';

/**
 * Computes the text color based on background brightness.
 * Returns a color string suitable for the welcome message.
 */
function computeTextColor(isDarkMode, backgroundImage, backgroundColor) {
    // Dark mode always uses light text
    if (isDarkMode) {
        return 'rgba(255, 255, 255, 0.9)';
    }

    // No background image - calculate from background color
    if (!backgroundImage || backgroundImage === 'none') {
        if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent') {
            const rgb = backgroundColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
                const brightness = parseInt(rgb[0]) * 0.299 + parseInt(rgb[1]) * 0.587 + parseInt(rgb[2]) * 0.114;
                return brightness > 128 ? 'rgba(51, 51, 51, 0.9)' : 'rgba(255, 255, 255, 0.9)';
            }
        }
        return 'rgba(51, 51, 51, 0.9)';
    }

    // Has background image - default to light text (will be adjusted by sampling)
    return 'rgba(255, 255, 255, 0.9)';
}

/**
 * Samples the background image at the element position to determine text color.
 */
function sampleBackgroundForColor(backgroundImage, elementRef, cache, setTextColor) {
    if (!backgroundImage || backgroundImage === 'none' || !elementRef.current) {
        return;
    }

    // Check cache
    if (cache.current.lastBackground === backgroundImage && cache.current.lastTextColor) {
        setTextColor(cache.current.lastTextColor);
        return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = backgroundImage.slice(5, -2); // Extract URL from url("...")

    img.onload = () => {
        if (!elementRef.current) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const sampleSize = 50;

        const elementRect = elementRef.current.getBoundingClientRect();
        const sampleArea = {
            x: Math.max(0, elementRect.x),
            y: Math.max(0, elementRect.y),
            width: Math.min(elementRect.width, window.innerWidth),
            height: Math.min(elementRect.height, window.innerHeight)
        };

        canvas.width = sampleSize;
        canvas.height = sampleSize;

        const scale = {
            x: img.width / window.innerWidth,
            y: img.height / window.innerHeight
        };

        const sourceArea = {
            x: sampleArea.x * scale.x,
            y: sampleArea.y * scale.y,
            width: sampleArea.width * scale.x,
            height: sampleArea.height * scale.y
        };

        ctx.drawImage(
            img,
            sourceArea.x, sourceArea.y, sourceArea.width, sourceArea.height,
            0, 0, sampleSize, sampleSize
        );

        try {
            const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
            const data = imageData.data;
            let r = 0, g = 0, b = 0;
            let count = 0;

            for (let x = 0, len = data.length; x < len; x += 4) {
                r += data[x];
                g += data[x + 1];
                b += data[x + 2];
                count++;
            }

            r = Math.floor(r / count);
            g = Math.floor(g / count);
            b = Math.floor(b / count);

            const brightness = r * 0.299 + g * 0.587 + b * 0.114;
            const color = brightness > 128 ? 'rgba(51, 51, 51, 0.9)' : 'rgba(255, 255, 255, 0.9)';

            cache.current.lastBackground = backgroundImage;
            cache.current.lastTextColor = color;
            setTextColor(color);
        } catch (error) {
            console.error('[WelcomeMessage] Failed to sample background:', error);
        }
    };

    img.onerror = () => {
        console.error('[WelcomeMessage] Failed to load background image');
    };
}

/**
 * Gets the time-based greeting message.
 */
function getGreeting() {
    const hours = new Date().getHours();
    if (hours < 12) {
        return window.getLocalizedMessage?.('morningGreeting') || 'Good morning';
    } else if (hours < 18) {
        return window.getLocalizedMessage?.('afternoonGreeting') || 'Good afternoon';
    } else {
        return window.getLocalizedMessage?.('eveningGreeting') || 'Good evening';
    }
}

/**
 * WelcomeMessage component - React化的欢迎消息
 * 替换原有的 #welcome-message 元素及其 legacy 逻辑
 */
export function WelcomeMessage() {
    const [userName, setUserName] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_NAME);
    const [greeting, setGreeting] = useState(getGreeting);
    const [textColor, setTextColor] = useState('rgba(51, 51, 51, 0.9)');
    const elementRef = useRef(null);
    const colorCache = useRef({ lastBackground: null, lastTextColor: null });

    // Update greeting every minute
    useEffect(() => {
        const intervalId = setInterval(() => {
            setGreeting(getGreeting());
        }, 60000);

        return () => clearInterval(intervalId);
    }, []);

    // Adjust text color function
    const adjustTextColor = useCallback(() => {
        const computedStyle = window.getComputedStyle(document.documentElement);
        const backgroundColor = computedStyle.backgroundColor;
        const backgroundImage = document.body.style.backgroundImage;
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

        // For wallpapers - always sample the background regardless of dark mode
        if (backgroundImage && backgroundImage !== 'none') {
            sampleBackgroundForColor(backgroundImage, elementRef, colorCache, setTextColor);
            return;
        }

        // For solid backgrounds - use dark mode aware color calculation
        const color = computeTextColor(isDarkMode, backgroundImage, backgroundColor);
        setTextColor(color);
        colorCache.current.lastTextColor = color;
    }, []);

    // Listen for background changes
    useEffect(() => {
        // Initial color adjustment
        adjustTextColor();

        // Listen for custom event from wallpaper/background changes
        const handleBackgroundChange = () => adjustTextColor();
        window.addEventListener('ntm:background-changed', handleBackgroundChange);

        // Watch for theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    adjustTextColor();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        return () => {
            window.removeEventListener('ntm:background-changed', handleBackgroundChange);
            observer.disconnect();
        };
    }, [adjustTextColor]);

    // Handle click to edit name
    const handleClick = useCallback(() => {
        const newName = prompt(
            chrome.i18n?.getMessage('namePrompt') || 'Enter your name:',
            userName
        );
        if (newName && newName.trim() !== '') {
            const trimmedName = newName.trim();
            setUserName(trimmedName);
            localStorage.setItem(STORAGE_KEY, trimmedName);
        }
    }, [userName]);

    // Expose adjustTextColor for external callers via custom event
    useEffect(() => {
        const handleAdjustColor = () => adjustTextColor();
        window.addEventListener('ntm:adjust-welcome-color', handleAdjustColor);
        return () => window.removeEventListener('ntm:adjust-welcome-color', handleAdjustColor);
    }, [adjustTextColor]);

    return (
        <div
            ref={elementRef}
            id="welcome-message"
            onClick={handleClick}
            style={{
                color: textColor,
                transition: 'color 0.3s ease',
                cursor: 'pointer'
            }}
        >
            {greeting}, {userName}
        </div>
    );
}

// Mark React component as loaded
if (typeof document !== 'undefined') {
    document.documentElement.dataset.ntmReactWelcomeMessage = 'true';
}

import { useEffect, useRef, useCallback } from 'react';

/**
 * GestureNavigation React component
 * Handles touchpad, wheel, and pointer gestures for folder navigation
 * Replaces legacy gesture-navigation.js
 */
export function GestureNavigation() {
    // Platform detection
    const isWindows = useRef(navigator.platform.includes('Win'));
    const isMac = useRef(navigator.platform.includes('Mac'));

    // Navigation state refs
    const isNavigating = useRef(false);
    const lastNavigationTime = useRef(0);
    const hasNavigated = useRef(false);
    const updateDisplayRef = useRef(null);

    // Touch gesture state
    const isTwoFingerSwipe = useRef(false);
    const touchStartX = useRef(0);
    const touchStartY = useRef(0);
    const swipeStartTime = useRef(0);

    // Pointer state (Windows)
    const isPointerDown = useRef(false);
    const pointerStartX = useRef(0);
    const pointerStartY = useRef(0);

    // Wheel state
    const accumulatedDeltaX = useRef(0);
    const lastWheelTime = useRef(0);

    // Constants
    const NAVIGATION_COOLDOWN = 350;

    // Get current folder ID from DOM
    const getCurrentFolderId = useCallback(() => {
        const bookmarksList = document.getElementById('bookmarks-list');
        return bookmarksList?.dataset?.parentId || null;
    }, []);

    // Reset navigation flags
    const resetNavigationFlags = useCallback(() => {
        isNavigating.current = false;
        hasNavigated.current = false;
    }, []);

    // Navigate to parent folder
    const navigateToParent = useCallback((currentFolderId, updateDisplay) => {
        if (isNavigating.current) {
            console.log('[Navigation] Skipped - navigation in progress');
            return;
        }

        isNavigating.current = true;
        lastNavigationTime.current = Date.now();

        chrome.bookmarks.get(currentFolderId, (nodes) => {
            if (chrome.runtime.lastError) {
                console.error('[Navigation] Error:', chrome.runtime.lastError);
                isNavigating.current = false;
                return;
            }

            if (nodes && nodes[0] && nodes[0].parentId) {
                const parentId = nodes[0].parentId;
                console.log('[Navigation] Navigating to parent folder:', parentId);

                const targetId = parentId === '0' ? '1' : parentId;
                updateDisplay(targetId).finally(() => {
                    setTimeout(() => {
                        resetNavigationFlags();
                    }, NAVIGATION_COOLDOWN);
                });
            } else {
                console.log('[Navigation] Failed to get parent folder info');
                isNavigating.current = false;
            }
        });
    }, [resetNavigationFlags, NAVIGATION_COOLDOWN]);

    // Navigate from current folder
    const navigateToParentFromCurrentFolder = useCallback(() => {
        if (!updateDisplayRef.current) return;
        const currentFolderId = getCurrentFolderId();
        if (!currentFolderId || currentFolderId === '1') return;
        navigateToParent(currentFolderId, updateDisplayRef.current);
    }, [getCurrentFolderId, navigateToParent]);

    // Touch gestures (Mac)
    useEffect(() => {
        const minSwipeDistance = 250;

        const handleTouchStart = (e) => {
            if (e.touches.length === 2) {
                isTwoFingerSwipe.current = true;
                touchStartX.current = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                touchStartY.current = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                swipeStartTime.current = Date.now();
                hasNavigated.current = false;
                document.body.style.transition = 'transform 0.2s';
            }
        };

        const handleTouchMove = (e) => {
            if (!isTwoFingerSwipe.current) return;
            e.preventDefault();

            const currentX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const deltaX = currentX - touchStartX.current;

            if (deltaX > 0) {
                const transform = Math.min(deltaX / 6, 150);
                document.body.style.transform = `translateX(${transform}px)`;
            }
        };

        const handleTouchEnd = (e) => {
            if (!isTwoFingerSwipe.current) return;

            const touchEndX = (e.changedTouches[0].clientX + (e.changedTouches[1]?.clientX || e.changedTouches[0].clientX)) / 2;
            const touchEndY = (e.changedTouches[0].clientY + (e.changedTouches[1]?.clientY || e.changedTouches[0].clientY)) / 2;

            const deltaX = touchEndX - touchStartX.current;
            const deltaY = touchEndY - touchStartY.current;
            const swipeTime = Date.now() - swipeStartTime.current;

            document.body.style.transition = 'transform 0.3s';
            document.body.style.transform = '';

            if (
                Math.abs(deltaX) > Math.abs(deltaY) &&
                deltaX > minSwipeDistance &&
                Math.abs(deltaY) < minSwipeDistance / 4 &&
                swipeTime > 150 &&
                swipeTime < 1000
            ) {
                const currentFolderId = getCurrentFolderId();
                if (currentFolderId && currentFolderId !== '1' && !hasNavigated.current && updateDisplayRef.current) {
                    navigateToParent(currentFolderId, updateDisplayRef.current);
                    hasNavigated.current = true;
                }
            }

            isTwoFingerSwipe.current = false;
        };

        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [getCurrentFolderId, navigateToParent]);

    // Wheel gestures
    useEffect(() => {
        let throttleTimeout = null;

        const handleWheel = (e) => {
            // Throttle implementation
            if (throttleTimeout) return;
            throttleTimeout = setTimeout(() => {
                throttleTimeout = null;
            }, 200);

            let deltaX = e.deltaX;
            let deltaY = e.deltaY;

            // Windows: Shift+wheel for horizontal scroll
            if (e.shiftKey && Math.abs(deltaX) < 1 && Math.abs(deltaY) >= 1) {
                deltaX = -deltaY;
                deltaY = 0;
            }

            const currentTime = Date.now();

            if (currentTime - lastNavigationTime.current < NAVIGATION_COOLDOWN) {
                return;
            }

            const SCROLL_THRESHOLD = isWindows.current ? 30 : 60;
            const MIN_DELTA_Y = isWindows.current ? 20 : 45;
            const HORIZONTAL_RATIO = isWindows.current ? 1.8 : 2.0;

            accumulatedDeltaX.current += deltaX;

            if (currentTime - lastWheelTime.current > 400) {
                accumulatedDeltaX.current = deltaX;
            }
            lastWheelTime.current = currentTime;

            const isBackGesture = e.shiftKey ? true : deltaX < 0;

            if (
                Math.abs(accumulatedDeltaX.current) > SCROLL_THRESHOLD &&
                (e.shiftKey || Math.abs(deltaX) > Math.abs(deltaY) * HORIZONTAL_RATIO) &&
                Math.abs(deltaY) < MIN_DELTA_Y &&
                isBackGesture &&
                e.deltaMode === 0
            ) {
                if (isWindows.current && e.deltaMode !== 0) return;

                navigateToParentFromCurrentFolder();
                accumulatedDeltaX.current = 0;
            }
        };

        document.addEventListener('wheel', handleWheel, { passive: true });

        return () => {
            document.removeEventListener('wheel', handleWheel);
            if (throttleTimeout) clearTimeout(throttleTimeout);
        };
    }, [navigateToParentFromCurrentFolder, NAVIGATION_COOLDOWN]);

    // Windows touchpad support
    useEffect(() => {
        if (!isWindows.current) return;

        const handlePointerDown = (e) => {
            if (e.pointerType === 'touch') {
                isPointerDown.current = true;
                pointerStartX.current = e.clientX;
                pointerStartY.current = e.clientY;
            }
        };

        const handlePointerMove = (e) => {
            if (!isPointerDown.current || e.pointerType !== 'touch') return;

            const deltaX = e.clientX - pointerStartX.current;
            const deltaY = e.clientY - pointerStartY.current;
            const MIN_SWIPE_DISTANCE = 220;

            if (
                Math.abs(deltaX) > MIN_SWIPE_DISTANCE &&
                Math.abs(deltaX) > Math.abs(deltaY) * 2.0 &&
                deltaX < 0
            ) {
                navigateToParentFromCurrentFolder();
                isPointerDown.current = false;
            }
        };

        const handlePointerUp = () => {
            isPointerDown.current = false;
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
        document.addEventListener('pointercancel', handlePointerUp);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
            document.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [navigateToParentFromCurrentFolder]);

    // Listen for updateBookmarksDisplay reference
    useEffect(() => {
        const handleBookmarksUpdated = (e) => {
            if (e.detail?.updateDisplay) {
                updateDisplayRef.current = e.detail.updateDisplay;
            }
        };

        document.addEventListener('ntm:gesture-init', handleBookmarksUpdated);

        return () => {
            document.removeEventListener('ntm:gesture-init', handleBookmarksUpdated);
        };
    }, []);

    // Mark as initialized
    useEffect(() => {
        document.documentElement.dataset.ntmReactGestureNavigation = 'true';
    }, []);

    // This component only manages event listeners, no UI rendering
    return null;
}

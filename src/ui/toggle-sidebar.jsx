import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'sidebarCollapsed';

/**
 * Reads the saved sidebar collapsed state from localStorage.
 * Defaults to true (collapsed) if not set.
 */
function getSavedCollapsedState() {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        return true;
    }
}

/**
 * Applies the sidebar state to the DOM (sidebar container classes and button position).
 */
function applySidebarState(isCollapsed) {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    if (isCollapsed) {
        sidebarContainer.classList.add('collapsed');
    } else {
        sidebarContainer.classList.remove('collapsed');
    }
}

/**
 * ToggleSidebar component - React化的侧边栏切换按钮
 * 替换原有的 #toggle-sidebar 按钮及其 legacy 事件绑定
 */
export function ToggleSidebar() {
    const [isCollapsed, setIsCollapsed] = useState(getSavedCollapsedState);

    // Apply initial state and sync on state change
    useEffect(() => {
        applySidebarState(isCollapsed);
    }, [isCollapsed]);

    // Handle toggle click
    const handleToggle = useCallback(() => {
        setIsCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(STORAGE_KEY, String(next));
            } catch {
                // Ignore storage errors
            }
            return next;
        });
    }, []);

    // Button text and position are controlled by CSS based on sidebar state.
    // We keep the same id and classes for style compatibility.
    // Tailwind classes replicate legacy #toggle-sidebar styles from output.css/styles.css
    return (
        <button
            id="toggle-sidebar"
            className={[
                // positioning & layer
                'fixed bottom-8 z-[1000]',
                // size
                'w-9 h-9',
                // shape & border
                'rounded-full border border-zinc-100',
                // background & text (light)
                'bg-white text-gray-500 font-bold',
                // hover (light)
                'hover:bg-gray-200 hover:text-gray-900',
                // transition
                'transition-[left] duration-300 cursor-pointer',
                // dark mode overrides
                '[[data-theme=dark]_&]:bg-neutral-700 [[data-theme=dark]_&]:border-neutral-700',
                '[[data-theme=dark]_&]:hover:bg-neutral-700 [[data-theme=dark]_&]:hover:text-white',
            ].join(' ')}
            onClick={handleToggle}
            style={{ left: isCollapsed ? '2rem' : '14.75rem' }}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
            {isCollapsed ? '>' : '<'}
        </button>
    );
}

/**
 * Marker attribute so legacy code knows React owns this button.
 */
if (typeof document !== 'undefined') {
    document.documentElement.dataset.ntmReactToggleSidebar = 'true';
}

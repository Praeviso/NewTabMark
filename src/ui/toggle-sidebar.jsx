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
    return (
        <button
            id="toggle-sidebar"
            className="bg-gray-300 p-1 rounded-r-md"
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

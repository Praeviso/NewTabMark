/**
 * @deprecated This file is superseded by React component:
 * - src/ui/GestureNavigation.jsx
 *
 * All gesture navigation functionality (touchpad, wheel, pointer events)
 * is now handled by the React GestureNavigation component.
 * 
 * This file is kept only for backward compatibility with legacy imports.
 * The React component listens for 'ntm:gesture-init' event from script.js.
 */

/**
 * @deprecated Use GestureNavigation React component instead.
 * This function is a no-op kept for backward compatibility.
 * 
 * @param {function} updateDisplay - The function to update bookmark display
 */
export function initGestureNavigation(updateDisplay) {
  // No-op: React component handles all initialization
  // The React GestureNavigation component listens for 'ntm:gesture-init' event
  // which is dispatched by script.js with the updateDisplay callback
}

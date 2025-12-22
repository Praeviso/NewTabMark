/**
 * @deprecated This file is superseded by React component:
 * - src/ui/FeatureTips.jsx (FeatureTipsPortal)
 *
 * All feature tips functionality (version checking, feature detection,
 * tip display) is now handled by React.
 * 
 * This file is kept only for backward compatibility with legacy imports.
 */

/**
 * @deprecated Use FeatureTipsPortal React component instead.
 * Returns a compatibility shim that does nothing.
 */
export function initFeatureTips() {
  // No-op: React component handles all initialization
  return {
    showTips() { },
    checkShowTips() { },
    showSearchEngineUpdateTip() { },
    showSettingsUpdateTip() { },
    initAllTips() { }
  };
}

/**
 * @deprecated No-op function kept for backward compatibility.
 * All initialization is now handled by React FeatureTipsPortal.
 */
export function initFeatureTipsUI() {
  // No-op: React component handles all initialization
}

/**
 * @deprecated Legacy proxy kept for backward compatibility.
 * Use React FeatureTipsPortal instead.
 */
export const featureTips = {
  showTips() { },
  checkShowTips() { },
  showSearchEngineUpdateTip() { },
  showSettingsUpdateTip() { },
  initAllTips() { }
};

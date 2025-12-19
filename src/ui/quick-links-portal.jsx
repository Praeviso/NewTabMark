import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { initQuickLinks, initQuickLinksVisibility } from '../quick-links.js';

function QuickLinks() {
  // Keep visibility in sync even if the feature is hidden.
  useEffect(() => {
    initQuickLinksVisibility();
  }, []);

  // Initialize the full Quick Links feature once the container exists.
  useEffect(() => {
    initQuickLinks();
  }, []);

  return (
    <div className="quick-links-wrapper">
      <div id="quick-links" className="quick-links-container" />
    </div>
  );
}

export function QuickLinksPortal({ placeholderId = 'ntm-quick-links-portal' }) {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    setTarget(document.getElementById(placeholderId));
  }, [placeholderId]);

  if (!target) return null;
  return createPortal(<QuickLinks />, target);
}

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createQuickLinksController } from '../quick-links/quick-links-controller.js';

function QuickLinks() {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const controller = createQuickLinksController({ root: wrapperRef.current });
    return () => controller.dispose();
  }, []);

  return (
    <div ref={wrapperRef} className="quick-links-wrapper">
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

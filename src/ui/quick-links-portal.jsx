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
    <div
      ref={wrapperRef}
      className="quick-links-wrapper flex justify-center w-full"
    >
      <div
        id="quick-links"
        className={[
          // Legacy class for DOM queries
          'quick-links-container',
          // Base styles
          'flex gap-0.5 justify-center min-h-[80px] overflow-x-hidden py-2.5 w-[800px]',
          // Responsive: max-width 840px
          'max-[840px]:flex-wrap max-[840px]:gap-2',
          // Responsive: max-width 480px
          'max-[480px]:gap-1',
          // Responsive: max-width 368px
          'max-[368px]:gap-1',
        ].join(' ')}
      />
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

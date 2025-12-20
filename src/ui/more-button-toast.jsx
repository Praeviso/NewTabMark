import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getLocalizedMessageSafe } from '../localization.js';

function getDefaultToastText() {
  return getLocalizedMessageSafe(
    'moreSearchSupportToast',
    'More search support is under development...'
  );
}

/**
 * Toast container Tailwind classes (applied to HTML element via useEffect):
 * - fixed top-[20%] left-1/2 -translate-x-1/2 -translate-y-1/2: centered position
 * - bg-black/80: semi-transparent black background
 * - text-white text-[13px] text-center: text styling
 * - px-4 py-2.5: padding
 * - rounded-lg: border-radius
 * - z-[10000]: high z-index
 * - max-w-[80%]: max width constraint
 * - shadow-md: box shadow
 * 
 * Note: 'hidden' is NOT included here because legacy CSS uses 'display: none'
 * and '.show' class overrides it with 'display: block'.
 */
const toastTailwindClasses = [
  'fixed', 'top-[20%]', 'left-1/2', '-translate-x-1/2', '-translate-y-1/2',
  'bg-black/80', 'text-white', 'text-[13px]', 'text-center',
  'px-4', 'py-2.5', 'rounded-lg',
  'z-[10000]', 'max-w-[80%]',
  'shadow-md'
];

function MoreButtonToastContent() {
  const defaultText = useMemo(getDefaultToastText, []);
  return (
    <p
      className="m-0 text-[13px] text-inherit"
      data-i18n="moreSearchSupportToast"
    >
      {defaultText}
    </p>
  );
}

export function MoreButtonToastPortal() {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    const el = document.getElementById('more-button-toast');
    if (el) {
      // Apply Tailwind classes to the existing HTML element
      toastTailwindClasses.forEach(cls => el.classList.add(cls));
      setTarget(el);
    }
  }, []);

  if (!target) return null;
  return createPortal(<MoreButtonToastContent />, target);
}

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getLocalizedMessageSafe } from '../localization.js';

function getDefaultToastText() {
  return getLocalizedMessageSafe(
    'moreSearchSupportToast',
    'More search support is under development...'
  );
}

function MoreButtonToastContent() {
  const defaultText = useMemo(getDefaultToastText, []);
  return <p data-i18n="moreSearchSupportToast">{defaultText}</p>;
}

export function MoreButtonToastPortal() {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    setTarget(document.getElementById('more-button-toast'));
  }, []);

  if (!target) return null;
  return createPortal(<MoreButtonToastContent />, target);
}

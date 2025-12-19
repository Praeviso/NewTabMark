import { useEffect, useMemo } from 'react';
import { extractBodyInnerHtml } from './extract-body-inner-html.js';

export function LegacyAppShell({ legacyHtml, bootstrap, stripSelectors = [], replaceSelectors = [] }) {
  const stripKey = useMemo(() => stripSelectors.join('|'), [stripSelectors]);
  const replaceKey = useMemo(
    () => replaceSelectors.map((r) => `${r?.selector || ''}=>${r?.placeholderId || ''}`).join('|'),
    [replaceSelectors]
  );
  const legacyBody = useMemo(
    () => extractBodyInnerHtml(legacyHtml, { stripSelectors, replaceSelectors }),
    [legacyHtml, stripKey, stripSelectors, replaceKey, replaceSelectors]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await bootstrap();
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [bootstrap]);

  return (
    <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: legacyBody }} />
  );
}

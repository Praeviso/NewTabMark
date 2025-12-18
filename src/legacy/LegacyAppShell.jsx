import { useEffect, useMemo } from 'react';
import { extractBodyInnerHtml } from './extract-body-inner-html.js';

export function LegacyAppShell({ legacyHtml, bootstrap, stripSelectors = [] }) {
  const stripKey = useMemo(() => stripSelectors.join('|'), [stripSelectors]);
  const legacyBody = useMemo(
    () => extractBodyInnerHtml(legacyHtml, { stripSelectors }),
    [legacyHtml, stripKey, stripSelectors]
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

export function extractBodyInnerHtml(
  htmlString,
  { stripSelectors = [], replaceSelectors = [] } = {}
) {
  const parser = new DOMParser();
  const documentFromString = parser.parseFromString(htmlString, 'text/html');

  documentFromString.querySelectorAll('script').forEach((script) => script.remove());

  // Replace specific legacy regions with stable placeholders so React can render
  // the same DOM structure at the same layout position.
  replaceSelectors.forEach(({ selector, placeholderId }) => {
    if (!selector || !placeholderId) return;

    const matches = Array.from(documentFromString.querySelectorAll(selector));
    matches.forEach((el, index) => {
      const placeholder = documentFromString.createElement('div');
      placeholder.id = matches.length > 1 ? `${placeholderId}-${index + 1}` : placeholderId;
      // Minimize layout impact while still providing a portal target.
      placeholder.setAttribute('style', 'display: contents;');
      el.replaceWith(placeholder);
    });
  });

  stripSelectors.forEach((selector) => {
    documentFromString.querySelectorAll(selector).forEach((el) => el.remove());
  });

  return documentFromString.body.innerHTML;
}

export function extractBodyInnerHtml(htmlString, { stripSelectors = [] } = {}) {
  const parser = new DOMParser();
  const documentFromString = parser.parseFromString(htmlString, 'text/html');

  documentFromString.querySelectorAll('script').forEach((script) => script.remove());
  stripSelectors.forEach((selector) => {
    documentFromString.querySelectorAll(selector).forEach((el) => el.remove());
  });

  return documentFromString.body.innerHTML;
}

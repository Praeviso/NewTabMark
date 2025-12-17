function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/\n/g, ' ');
}

function formatUnixSeconds(ms) {
  if (!Number.isFinite(ms)) return null;
  return Math.floor(ms / 1000);
}

function nodeToNetscapeHtml(node, indent = '') {
  if (!node) return '';

  if (node.url) {
    const addDate = formatUnixSeconds(node.dateAdded);
    const attrs = [`HREF="${escapeAttr(node.url)}"`];
    if (addDate != null) attrs.push(`ADD_DATE="${addDate}"`);
    return `${indent}<DT><A ${attrs.join(' ')}>${escapeHtml(node.title || node.url)}</A>\n`;
  }

  const addDate = formatUnixSeconds(node.dateAdded);
  const lastModified = formatUnixSeconds(node.dateGroupModified);
  const folderAttrs = [];
  if (addDate != null) folderAttrs.push(`ADD_DATE="${addDate}"`);
  if (lastModified != null) folderAttrs.push(`LAST_MODIFIED="${lastModified}"`);

  let out = `${indent}<DT><H3${folderAttrs.length ? ' ' + folderAttrs.join(' ') : ''}>${escapeHtml(node.title || '')}</H3>\n`;
  out += `${indent}<DL><p>\n`;
  for (const child of node.children || []) {
    out += nodeToNetscapeHtml(child, indent + '  ');
  }
  out += `${indent}</DL><p>\n`;
  return out;
}

export function generateNetscapeBookmarkHtml(folderRootNode, options = {}) {
  const { title = 'Bookmarks' } = options;

  const headerTitle = escapeHtml(title);
  let out = '';
  out += '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n';
  out += '<!-- This is an automatically generated file.\n';
  out += '     It will be read and overwritten.\n';
  out += '     DO NOT EDIT! -->\n';
  out += '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n';
  out += `<TITLE>${headerTitle}</TITLE>\n`;
  out += `<H1>${headerTitle}</H1>\n`;
  out += '<DL><p>\n';
  out += nodeToNetscapeHtml(folderRootNode, '  ');
  out += '</DL><p>\n';
  return out;
}


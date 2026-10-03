const ALLOWED_TAGS = new Set([
  'P',
  'STRONG',
  'B',
  'EM',
  'I',
  'UL',
  'OL',
  'LI',
  'BR'
]);

export function sanitizeRichTextHtml(input = '') {
  if (!input) return '';

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(input, 'text/html');

  const cleanNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return documentNode.createTextNode(node.textContent || '');
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    if (!ALLOWED_TAGS.has(node.tagName)) {
      const fragment = documentNode.createDocumentFragment();

      Array.from(node.childNodes).forEach((child) => {
        const cleanedChild = cleanNode(child);
        if (cleanedChild) fragment.appendChild(cleanedChild);
      });

      return fragment;
    }

    const cleanElement = documentNode.createElement(node.tagName.toLowerCase());

    Array.from(node.childNodes).forEach((child) => {
      const cleanedChild = cleanNode(child);
      if (cleanedChild) cleanElement.appendChild(cleanedChild);
    });

    return cleanElement;
  };

  const cleanRoot = documentNode.createElement('div');

  Array.from(documentNode.body.childNodes).forEach((child) => {
    const cleanedChild = cleanNode(child);
    if (cleanedChild) cleanRoot.appendChild(cleanedChild);
  });

  return cleanRoot.innerHTML.trim();
}

export function richTextToPlainText(input = '') {
  if (!input) return '';

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(input, 'text/html');

  return (documentNode.body.textContent || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

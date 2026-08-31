const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitizes untrusted HTML before it is persisted or exported, stripping any
 * script/XSS injection fragments while preserving normal rich-text markup.
 */
function sanitizeHtml(dirtyHtml) {
  if (!dirtyHtml) return '';
  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3',
      'blockquote', 'code', 'pre', 'span', 'div', 'img',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'rel'],
  });
}

module.exports = { sanitizeHtml };

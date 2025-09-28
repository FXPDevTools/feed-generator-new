// lib/bbcode-preview.js
// Utilities for previewing BBCode templates safely on the client side.
// IMPORTANT: This module only simulates placeholders and IF blocks for PREVIEW.
// Do NOT use this to modify/save content. Saved templates must remain RAW.

// Global placeholders supported system-wide
export const GLOBAL_PLACEHOLDERS = [
  'ArticleTitle',
  'Content',
  'ImageLink',
  'RelevantLinkDesc',
  'RelevantLink',
  'Source',
  'ForumName',
  'ForumID',
  ...Array.from({ length: 5 }, (_, i) => `AdditionalLink${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `AdditionalTitle${i + 1}`),
];

// Global IF blocks supported
export const GLOBAL_IF_BLOCKS = [
  'IMAGELINK',
  'RELEVANTLINK',
  'SOURCE',
  'FORUM',
  'ADDITIONAL_LINKS',
  'FORUM_OR_LINKS',
];

// Extract placeholders used in a template (excluding IF control markers)
export function extractPlaceholders(template) {
  if (!template) return [];
  const set = new Set();
  const re = /%([A-Za-z0-9_]+)%/g;
  let m;
  while ((m = re.exec(template)) !== null) {
    const token = m[1];
    if (token.startsWith('IF_') || token.endsWith('_START') || token.endsWith('_END')) continue;
    set.add(token);
  }
  return Array.from(set);
}

// Extract IF blocks used (by name)
export function extractIfBlocks(template) {
  if (!template) return [];
  const set = new Set();
  const re = /%IF_([A-Z_]+)_START%/g;
  let m;
  while ((m = re.exec(template)) !== null) {
    set.add(m[1]);
  }
  return Array.from(set);
}

// Detect placeholders present in template but not in the global list
export function detectUnknownPlaceholders(template, known = GLOBAL_PLACEHOLDERS) {
  const used = extractPlaceholders(template);
  const knownSet = new Set(known);
  return used.filter((p) => !knownSet.has(p));
}

// Apply IF blocks according to provided data
function applyIfBlocks(template, data = {}) {
  let out = template;

  const hasAnyAdditionalLink = () => {
    for (let i = 1; i <= 5; i++) {
      const v = data[`AdditionalLink${i}`];
      if (typeof v === 'string' ? v.trim() : v) return true;
    }
    return false;
  };

  const conditions = {
    IMAGELINK: () => !!(data.ImageLink && String(data.ImageLink).trim()),
    RELEVANTLINK: () => !!(data.RelevantLink && String(data.RelevantLink).trim()),
    SOURCE: () => !!(data.Source && String(data.Source).trim()),
    FORUM: () => !!(data.ForumName && String(data.ForumName).trim()),
    ADDITIONAL_LINKS: () => hasAnyAdditionalLink(),
    FORUM_OR_LINKS: () => !!(conditions.FORUM() || conditions.ADDITIONAL_LINKS()),
  };

  GLOBAL_IF_BLOCKS.forEach((block) => {
    const re = new RegExp(`%IF_${block}_START%([\\s\\S]*?)%IF_${block}_END%`, 'g');
    out = out.replace(re, (_full, inner) => (conditions[block]() ? inner : ''));
  });

  return out;
}

// Replace placeholders with provided preview data; unknown placeholders left intact or cleared
function applyPlaceholders(template, data = {}, { removeUnknown = true } = {}) {
  let out = template;

  // Replace known placeholders
  GLOBAL_PLACEHOLDERS.forEach((name) => {
    const val = data[name];
    if (val !== undefined && val !== null) {
      const re = new RegExp(`%${name}%`, 'g');
      out = out.replace(re, String(val));
    }
  });

  if (removeUnknown) {
    // Remove any remaining %TOKEN% (that aren't IF markers)
    out = out.replace(/%IF_[A-Z_]+_(?:START|END)%/g, '');
    out = out.replace(/%[A-Za-z0-9_]+%/g, '');
  }

  return out;
}

// Main function: simulate a template for preview
// Returns a BBCode string ready to be rendered by a BBCode renderer (client)
export function simulateTemplateForPreview(template, data = {}, options = {}) {
  if (!template) return '';
  const withIf = applyIfBlocks(template, data);
  const withVars = applyPlaceholders(withIf, data, options);
  return withVars;
}

// Optional: provide basic sample data for quick preview UIs
export function defaultSampleData() {
  return {
    ArticleTitle: 'כותרת לדוגמה',
    Content: 'זהו תוכן לדוגמה של כתבה. כאן יופיע הטקסט שהוזן בפועל.',
    ImageLink: '[IMG]https://via.placeholder.com/600x300[/IMG]',
    RelevantLinkDesc: 'קישור רלוונטי לדוגמה',
    RelevantLink: 'https://example.com',
    Source: 'https://source.example.com',
    ForumName: 'פורום לדוגמה',
    ForumID: '123',
    AdditionalLink1: 'https://example.com/a1',
    AdditionalTitle1: 'כותרת קישור 1',
    AdditionalLink2: 'https://example.com/a2',
    AdditionalTitle2: 'כותרת קישור 2',
    AdditionalLink3: 'https://example.com/a3',
    AdditionalTitle3: 'כותרת קישור 3',
    AdditionalLink4: 'https://example.com/a4',
    AdditionalTitle4: 'כותרת קישור 4',
    AdditionalLink5: 'https://example.com/a5',
    AdditionalTitle5: 'כותרת קישור 5',
  };
}

// Convert a BBCode subset to simple HTML for preview (client-only)
// Note: This is intentionally minimal and for preview UI only.
export function bbcodeToHtml(bb) {
  if (!bb) return '';
  // Trim leading/trailing whitespace to avoid trailing <br/>
  let html = String(bb).replace(/^[\s\u200B\uFEFF]+|[\s\u200B\uFEFF]+$/g, '');

  // Pre-clean: unwrap empty URL blocks and remove empty tags leftovers
  // [URL=]...[/URL] -> inner content only; if also empty, it's removed later.
  html = html.replace(/\[URL=\s*\]\s*([\s\S]*?)\[\/URL\]/gi, '$1');
  // Plain [URL]...[/URL] without href -> unwrap
  html = html.replace(/\[URL\]\s*([\s\S]*?)\[\/URL\]/gi, '$1');
  // Remove lone empty markers that might remain
  html = html.replace(/\[URL=\s*\]/gi, '');
  html = html.replace(/\[IMG\]\s*\[\/IMG\]/gi, '');

  // Basic tags
  html = html.replace(/\[CENTER\]/gi, '<div style="text-align:center;">');
  html = html.replace(/\[\/CENTER\]/gi, '</div>');
  html = html.replace(/\[B\]/gi, '<strong>');
  html = html.replace(/\[\/B\]/gi, '</strong>');
  html = html.replace(/\[U\]/gi, '<u>');
  html = html.replace(/\[\/U\]/gi, '</u>');
  html = html.replace(/\[I\]/gi, '<i>');
  html = html.replace(/\[\/I\]/gi, '</i>');

  // Size, Color, Font
  const sizeToPx = (n) => {
    const num = Number(n);
    const map = { 1: 12, 2: 14, 3: 16, 4: 20, 5: 24, 6: 32, 7: 48 };
    return map[num] || 16;
  };
  html = html.replace(/\[SIZE=(\d+)\]/gi, (_m, n) => `<span style="font-size:${sizeToPx(n)}px;">`);
  html = html.replace(/\[\/SIZE\]/gi, '</span>');
  html = html.replace(/\[COLOR=([^\]]+)\]/gi, (_m, c) => `<span style="color:${String(c)};">`);
  html = html.replace(/\[\/COLOR\]/gi, '</span>');
  html = html.replace(/\[FONT=([^\]]+)\]/gi, (_m, f) => `<span style="font-family:${String(f)};">`);
  html = html.replace(/\[\/FONT\]/gi, '</span>');

  // Links & Images
  html = html.replace(/\[URL=\"([^\"]+)\"\]/gi, (_m, u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">`);
  html = html.replace(/\[URL=([^\]]+)\]/gi, (_m, u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">`);
  html = html.replace(/\[\/URL\]/gi, '</a>');
  html = html.replace(/\[IMG\]\s*([^\[]+?)\s*\[\/IMG\]/gi, (_m, src) =>
    `<img src="${src.trim()}" style="display:block;margin:12px auto;max-width:100%;height:auto;" />`
  );

  // Tables (very basic)
  html = html.replace(/\[TABLE[^\]]*\]/gi, '<table style="margin:0 auto;text-align:center;border-collapse:collapse;">');
  html = html.replace(/\[\/TABLE\]/gi, '</table>');
  html = html.replace(/\[TR\]/gi, '<tr>');
  html = html.replace(/\[\/TR\]/gi, '</tr>');
  html = html.replace(/\[TD\]/gi, '<td style="padding:10px;">');
  html = html.replace(/\[\/TD\]/gi, '</td>');

  // New lines
  html = html.replace(/\r?\n/g, '<br/>');

  // Collapse excessive breaks: any 3+ consecutive <br> -> 2
  html = html.replace(/(?:<br\s*\/>\s*){3,}/gi, '<br/><br/>');

  // Remove breaks that sit directly next to images (we already add margins on imgs)
  html = html.replace(/<br\s*\/>\s*(<img\b[^>]*>)/gi, '$1');
  html = html.replace(/(<img\b[^>]*>)\s*<br\s*\/>/gi, '$1');

  // Remove breaks that are directly before closing block tags
  html = html.replace(/(?:<br\s*\/>\s*)+(<\/(?:div|table|tbody|tr|td|p)>)/gi, '$1');
  // Remove breaks directly after opening block tags
  html = html.replace(/(<(?:div|table|tbody|tr|td|p)[^>]*>)\s*(?:<br\s*\/>\s*)+/gi, '$1');
  // Remove empty table rows generated from BBCode
  html = html.replace(/<tr>\s*<\/tr>/gi, '');
  // Remove extra breaks around <table> boundaries
  html = html.replace(/<br\s*\/>\s*(<table\b[^>]*>)/gi, '$1');
  html = html.replace(/(<\/table>)\s*<br\s*\/>/gi, '$1');
  // Strip trailing breaks at end of document
  html = html.replace(/(?:<br\s*\/>\s*)+$/i, '');

  return html;
}

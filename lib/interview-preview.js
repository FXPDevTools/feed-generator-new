// lib/interview-preview.js
// Utilities for previewing Interview templates safely on the client side.
// IMPORTANT: This module only simulates placeholders for PREVIEW.
// Do NOT use this to modify/save content. Saved templates must remain RAW.

// Global placeholders supported for interviews
export const INTERVIEW_PLACEHOLDERS = [
  'GuestName', // שם המתארח
  'GuestTopic', // עיסוק/תחום עניין  
  'Biography', // ביוגרפיה
  'QNA_BLOCK', // בלוק השאלות והתשובות המלא
];

// Q&A template placeholders
export const QA_PLACEHOLDERS = [
  'Question', // שאלה בודדת
  'Answer', // תשובה בודדת
];

// IF blocks supported for interviews (if needed later)
export const INTERVIEW_IF_BLOCKS = [
  'GUEST_TOPIC', // אם יש תחום עיסוק
  'BIOGRAPHY', // אם יש ביוגרפיה
  'QNA_BLOCK', // אם יש שאלות ותשובות
];

// Extract placeholders used in a template (excluding IF control markers)
export function extractPlaceholders(template) {
  if (!template) return [];
  const set = new Set();
  
  // Search for both {placeholder} and %placeholder% formats
  const curlyRe = /\{([^}]+)\}/g;
  const percentRe = /%([A-Za-z0-9_]+)%/g;
  
  let m;
  while ((m = curlyRe.exec(template)) !== null) {
    const token = m[1];
    if (!token.startsWith('IF_') && !token.endsWith('_START') && !token.endsWith('_END')) {
      set.add(token);
    }
  }
  
  while ((m = percentRe.exec(template)) !== null) {
    const token = m[1];
    if (!token.startsWith('IF_') && !token.endsWith('_START') && !token.endsWith('_END')) {
      set.add(token);
    }
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
export function detectUnknownPlaceholders(template, known = [...INTERVIEW_PLACEHOLDERS, ...QA_PLACEHOLDERS]) {
  const used = extractPlaceholders(template);
  const knownSet = new Set(known);
  return used.filter((p) => !knownSet.has(p));
}

// Apply IF blocks according to provided data
function applyIfBlocks(template, data = {}) {
  let out = template;

  const conditions = {
    GUEST_TOPIC: () => !!(data.GuestTopic && String(data.GuestTopic).trim()),
    BIOGRAPHY: () => !!(data.Biography && String(data.Biography).trim()),
    QNA_BLOCK: () => !!(data.QNA_BLOCK && String(data.QNA_BLOCK).trim()),
  };

  INTERVIEW_IF_BLOCKS.forEach((block) => {
    const re = new RegExp(`%IF_${block}_START%([\\s\\S]*?)%IF_${block}_END%`, 'g');
    out = out.replace(re, (_full, inner) => (conditions[block]() ? inner : ''));
  });

  return out;
}

// Replace placeholders with provided preview data
function applyPlaceholders(template, data = {}, { removeUnknown = true } = {}) {
  let out = template;

  // Replace known placeholders - both {placeholder} and %placeholder% formats
  [...INTERVIEW_PLACEHOLDERS, ...QA_PLACEHOLDERS].forEach((name) => {
    const val = data[name];
    if (val !== undefined && val !== null) {
      const strVal = String(val);
      // Replace both formats
      out = out.replace(new RegExp(`\\{${name}\\}`, 'g'), strVal);
      out = out.replace(new RegExp(`%${name}%`, 'g'), strVal);
    }
  });

  // Handle unknown placeholders
  if (removeUnknown) {
    // Remove unknown {placeholder} and %placeholder%
    out = out.replace(/\{[^}]+\}/g, '');
    out = out.replace(/%[A-Za-z0-9_]+%/g, '');
  }

  return out;
}

// Process Q&A block - replace QNA_BLOCK with multiple Q&A pairs
function processQnaBlock(template, qaTemplate, qaData = []) {
  if (!qaData || qaData.length === 0) {
    // No Q&A data, remove the QNA_BLOCK placeholder
    return template.replace(/\{QNA_BLOCK\}/g, '');
  }

  // Generate Q&A HTML using the qa template
  const qaHtml = qaData.map(qa => {
    let qaHtml = qaTemplate;
    qaHtml = qaHtml.replace(/%Question%/g, qa.question || '');
    qaHtml = qaHtml.replace(/%Answer%/g, qa.answer || '');
    return qaHtml;
  }).join('\n\n');

  // Replace QNA_BLOCK with the generated HTML
  return template.replace(/\{QNA_BLOCK\}/g, qaHtml);
}

// Main simulation function for interview templates
export function simulateInterviewTemplate(mainTemplate, qaTemplate, data = {}, options = {}) {
  if (!mainTemplate) return '';

  // First, process the QNA_BLOCK if we have Q&A data
  let processedTemplate = mainTemplate;
  if (data.qaData && qaTemplate) {
    processedTemplate = processQnaBlock(processedTemplate, qaTemplate, data.qaData);
  }

  // Apply IF blocks
  const withIf = applyIfBlocks(processedTemplate, data);
  
  // Apply placeholders
  const withVars = applyPlaceholders(withIf, data, options);
  
  return withVars;
}

// Optional: provide basic sample data for quick preview UIs
export function defaultInterviewSampleData() {
  return {
    GuestName: 'דוד כהן',
    GuestTopic: 'מפתח תוכנה בכיר',
    Biography: 'דוד כהן הוא מפתח תוכנה עם יותר מ-10 שנות ניסיון בתחום הטכנולוגיה. עבד בחברות הייטק מובילות ומתמחה בפיתוח אפליקציות ווב מתקדמות.',
    qaData: [
      {
        question: 'איך התחלת את הקריירה שלך בתחום הטכנולוגיה?',
        answer: 'התחלתי ללמוד תכנות בתיכון ומאז הייתי מאוהב בתחום. אחרי השירות הצבאי למדתי מדעי המחשב והתחלתי לעבוד בסטארט-אפ קטן.'
      },
      {
        question: 'מה העצה הכי חשובה שתיתן למפתחים צעירים?',
        answer: 'הכי חשוב זה ללמוד כל הזמן ולא לפחד מאתגרים חדשים. הטכנולוגיה משתנה מהר ומי שלא מתעדכן נשאר מאחור.'
      }
    ]
  };
}

// BBCode to HTML conversion (simplified version for interviews)
export function bbcodeToHtml(bbcode) {
  if (!bbcode) return '';
  
  let html = bbcode;
  
  // Basic BBCode tags
  html = html.replace(/\[B\](.*?)\[\/B\]/gi, '<strong>$1</strong>');
  html = html.replace(/\[I\](.*?)\[\/I\]/gi, '<em>$1</em>');
  html = html.replace(/\[U\](.*?)\[\/U\]/gi, '<u>$1</u>');
  html = html.replace(/\[S\](.*?)\[\/S\]/gi, '<del>$1</del>');
  
  // Size tags
  html = html.replace(/\[SIZE=(\d+)\](.*?)\[\/SIZE\]/gi, '<span style="font-size: $1em;">$2</span>');
  
  // Color tags
  html = html.replace(/\[COLOR=([^\]]+)\](.*?)\[\/COLOR\]/gi, '<span style="color: $1;">$2</span>');
  
  // Font tags
  html = html.replace(/\[FONT=([^\]]+)\](.*?)\[\/FONT\]/gi, '<span style="font-family: $1;">$2</span>');
  
  // Center tags
  html = html.replace(/\[CENTER\](.*?)\[\/CENTER\]/gi, '<div style="text-align: center;">$1</div>');
  
  // Image tags
  html = html.replace(/\[IMG\](.*?)\[\/IMG\]/gi, '<img src="$1" style="max-width: 100%;" />');
  
  // URL tags
  html = html.replace(/\[URL=([^\]]+)\](.*?)\[\/URL\]/gi, '<a href="$1" target="_blank">$2</a>');
  html = html.replace(/\[URL\](.*?)\[\/URL\]/gi, '<a href="$1" target="_blank">$1</a>');
  
  // Table tags (simplified)
  html = html.replace(/\[TABLE[^\]]*\](.*?)\[\/TABLE\]/gi, '<table style="border-collapse: collapse; margin: 10px auto;">$1</table>');
  html = html.replace(/\[TR[^\]]*\](.*?)\[\/TR\]/gi, '<tr>$1</tr>');
  html = html.replace(/\[TD[^\]]*\](.*?)\[\/TD\]/gi, '<td style="border: 1px solid #ccc; padding: 8px;">$1</td>');
  
  // Line breaks
  html = html.replace(/\n/g, '<br>');
  
  return html;
}
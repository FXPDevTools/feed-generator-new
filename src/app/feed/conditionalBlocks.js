// מערכת לטיפול בבלוקים מותנים בתבניות BBCode
// פונקציה שמקבלת טקסט ותוכן משתנים, ומחזירה טקסט מעובד

/**
 * מחליף בלוקים מותנים לפי הגדרות:
 * אם יש ערך, משאיר את התוכן ומסיר את המסגרת
 * אם אין ערך, מוחק את כל הבלוק
 * @param {string} template - טקסט התבנית
 * @param {Object} values - אובייקט עם ערכים לכל בלוק
 * @returns {string} - טקסט מעובד
 */
function processConditionalBlocks(template, values) {
  // מחליף בלוקים מותנים ומוחק כל שורה שמכילה בלוק שנמחק
  // מוחק גם שורה ריקה לפני בלוק מותנה שנמחק
  let result = template.replace(/^[ \t]*\r?\n?[ \t]*%IF_([A-Z_]+)_START%([\s\S]*?)%IF_\1_END%.*(?:\r?\n)?/gm, (match, blockName, blockContent) => {
    const value = values[blockName];
    if (value) {
      // יש ערך: משאירים את התוכן בדיוק כפי שהוא, כולל רווחים ושורות ריקות
      return blockContent;
    } else {
      // אין ערך: מוחקים את כל השורה של הבלוק
      return '';
    }
  });
  // ניקוי שורות שמכילות רק רווחים
  result = result.replace(/^[ \t]*$/gm, '');
  // ניקוי שורות ריקות מרובות (יותר משורה ריקה אחת ברצף)
  result = result.replace(/(\r?\n){2,}/g, '\n');
  // ניקוי רווחים בתחילת וסוף
  return result.trim();
}

module.exports = { processConditionalBlocks };
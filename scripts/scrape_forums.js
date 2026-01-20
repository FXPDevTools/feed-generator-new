// סקריפט Node.js לאיסוף פורומים לפי קטגוריות (סקרייפינג FXP)
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// קובץ קטגוריות (שם + איידי)
const categoriesFile = path.join(__dirname, '../public/forum-categories.json');
// קובץ הפורומים שיתעדכן
const forumsFile = path.join(__dirname, '../public/forums.json');

async function scrapeForumsForCategory(categoryId) {
  const url = `https://www.fxp.co.il/forumdisplay.php?f=${categoryId}`;
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const forums = [];
  // כל פורום מוצג כ-threadbit או כ-link בפורום הראשי
  $("a.forumtitle").each((i, el) => {
    const name = $(el).text().trim();
    const href = $(el).attr('href');
    // דוגמה: forumdisplay.php?f=123
    const match = href && href.match(/f=(\d+)/);
    if (match) {
      forums.push({
        id: match[1],
        name,
        url: `https://www.fxp.co.il/${href}`
      });
    }
  });
  return forums;
}

async function main() {
  const categories = JSON.parse(fs.readFileSync(categoriesFile, 'utf8'));
  const allForums = [];
  for (const cat of categories) {
    try {
      const forums = await scrapeForumsForCategory(cat.id);
      allForums.push({
        category: cat.name,
        categoryId: cat.id,
        forums
      });
      console.log(`✓ קטגוריה ${cat.name} – נמצא ${forums.length} פורומים`);
    } catch (e) {
      console.error(`✗ שגיאה בקטגוריה ${cat.name}:`, e.message);
    }
  }
  fs.writeFileSync(forumsFile, JSON.stringify(allForums, null, 2), 'utf8');
  console.log('הסתיים. כל הפורומים נשמרו ל-forums.json');
}

if (require.main === module) {
  main();
}

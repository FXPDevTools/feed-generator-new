// סקריפט Node.js לאיסוף קטגוריות ראשיות מ-FXP
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const categoriesFile = path.join(__dirname, '../public/forum-categories.json');

async function scrapeCategories() {
  const url = 'https://www.fxp.co.il/';
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const categories = [];
  // חפש קישורים לקטגוריות ראשיות (forumdisplay.php?f=...)
  $("a.forumtitle").each((i, el) => {
    const name = $(el).text().trim();
    const href = $(el).attr('href');
    const match = href && href.match(/forumdisplay\\.php\\?f=(\\d+)/);
    if (match) {
      categories.push({
        id: Number(match[1]),
        name
      });
    }
  });
  // הסר כפילויות לפי id
  const unique = Object.values(categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {}));
  fs.writeFileSync(categoriesFile, JSON.stringify(unique, null, 2), 'utf8');
  console.log('נמצאו', unique.length, 'קטגוריות. נשמר ל-forum-categories.json');
}

if (require.main === module) {
  scrapeCategories();
}

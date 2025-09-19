import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';
import cheerio from 'cheerio';

// --- CONFIGURATION ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error("Gemini API key is not configured.");
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
};

// --- SCRAPER LOGIC (Ported to Node.js) ---
const fetchPageContent = async (url) => {
    try {
        const { data } = await axios.get(url, { headers: HEADERS });
        return data;
    } catch (error) {
        console.error(`Scraping Error: ${error.message}`);
        return null;
    }
};

// --- API HANDLER ---
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { task, context } = req.body;
    if (!task) {
        return res.status(400).json({ error: "Missing task" });
    }

    try {
        let prompt = "";
        let result = "";

        // Define prompts based on task
        switch (task) {
            case 'suggest_guests':
                prompt = `צור רשימה ממוספרת של 5 אישים אמיתיים שיכולים להיות אורחים מעניינים לראיון בפורום אינטרנטי בנושא '${context.topic}'. עבור כל אישיות, ציין את שמה והסבר בן משפט אחד על הרלוונטיות שלה.`;
                break;
            // Add other cases for different tasks here...
            default:
                return res.status(400).json({ error: "Unknown task" });
        }
        
        const generationResult = await model.generateContent(prompt);
        const response = await generationResult.response;
        result = await response.text();

        return res.status(200).json({ result });

    } catch (error) {
        console.error(`Gemini API Error: ${error}`);
        if (error.message && error.message.includes('API key not valid')) {
             return res.status(500).json({ error: "Gemini API key is not valid." });
        }
        return res.status(500).json({ error: `An error occurred with the Gemini API: ${error.message}` });
    }
}
```

### איך להשתמש בקבצים החדשים?

1.  **הגדר את הפרויקט:** ודא שיש לך פרויקט Next.js.
2.  **מקם את הקבצים:**
    * שים את הקובץ `index.js` בתוך תיקיית `pages`.
    * שים את הקובץ `generator.js` בתוך תיקיית `pages/api`.
3.  **התקן תלויות:** הרץ בטרמינל את הפקודות:
    ```bash
    npm install axios cheerio @google/generative-ai
    ```
4.  **הגדר מפתח API:** צור קובץ `.env.local` בתיקייה הראשית של הפרויקט והוסף בו את השורה:
    ```
    GEMINI_API_KEY=your_api_key_here
    

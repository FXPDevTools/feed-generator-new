"use client";
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import depts from "public/dept-config.json";

// Helper function to process the media link
// פונקציה לעיבוד בלוקים מותנים בתבנית BBCODE
function processConditionalBlocks(template, values) {
    return template.replace(/%IF_([A-Z_]+)_START%([\s\S]*?)%IF_\1_END%/g, (match, blockName, blockContent) => {
        const value = values[blockName];
        if (value) {
            return blockContent;
        } else {
            return '';
        }
    });
}
const processMediaLink = (url) => {
    if (!url) {
        return { html: '', bbcode: '' };
    }

    // YouTube URL patterns
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);

    if (match && match[1]) {
        const videoId = match[1];
        return {
            html: `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="max-width:100%"></iframe>`,
            bbcode: `[URL]${url}[/URL]` // Standard URL tag for videos
        };
    }

    // Assume it's an image if it's not a YouTube link
    return {
        html: `<img src="${url}" style="max-width:100%">`,
        bbcode: `[IMG]${url}[/IMG]`
    };
};


// The main generator component
function ArticleGeneratorComponent() {
    // --- States for 5 אשכולות רלוונטיים ---
    const [threads, setThreads] = useState([
        { title: '', link: '' },
        { title: '', link: '' },
        { title: '', link: '' },
        { title: '', link: '' },
        { title: '', link: '' }
    ]);

    // עדכון ערך של אשכול מסוים
    const handleThreadChange = (idx, field, value) => {
        setThreads(prev => prev.map((thread, i) => i === idx ? { ...thread, [field]: value } : thread));
    };
    const router = useRouter();
    const searchParams = useSearchParams();

    // --- State for the selected department ---
    const [dept, setDept] = useState('feed');

    // --- State variables for the form fields ---
    const [title, setTitle] = useState(''); // %ArticleTitle%
    const [imageLink, setImageLink] = useState(''); // %ImageLink%
    const [content, setContent] = useState(''); // %Content%
    const [relevantLinkDesc, setRelevantLinkDesc] = useState(''); // %RelevantLinkDesc%
    const [relevantLink, setRelevantLink] = useState(''); // %RelevantLink%
    const [source, setSource] = useState(''); // %Source%
    const [forumName, setForumName] = useState('פורום 1'); // %ForumName%
    // --- States for generated outputs, preview, and editor ---
    const [generatedHtml, setGeneratedHtml] = useState('');
    const [generatedBBcode, setBBcode] = useState(''); // Your new state for BBCode
    const [previewContent, setPreviewContent] = useState('');
    const contentRef = useRef(null);
    // ...existing code...
    const [editorColor, setEditorColor] = useState('#000000');
    const [editorSize, setEditorSize] = useState(3);

    // Effect to sync department state with URL parameter
    useEffect(() => {
        const deptFromUrl = searchParams.get('dept');
        if (deptFromUrl && depts[deptFromUrl]) {
            setDept(deptFromUrl);
        } else {
            setDept('feed');
        }
    }, [searchParams]);

    // Function to handle department change
    const handleDeptChange = (newDept) => {
        setDept(newDept);
        router.push(`?dept=${newDept}`, { scroll: false });
    };

    // --- BBCode editor functions (unchanged) ---
    const applyBbCode = (tag, value, customText = null) => {
        const textarea = contentRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = customText !== null ? customText : content.substring(start, end);
        let newText;
        switch (tag) {
            case 'B': case 'U': case 'I': case 'S': newText = `[${tag}]${selectedText}[/${tag}]`; break;
            case 'COLOR': newText = `[COLOR="${value}"]${selectedText}[/COLOR]`; break;
            case 'SIZE': newText = `[SIZE=${value}]${selectedText}[/SIZE]`; break;
            case 'URL': newText = `[URL="${value}"]${selectedText}[/URL]`; break;
            default: newText = selectedText;
        }
        const fullNewText = `${content.substring(0, start)}${newText}${content.substring(end)}`;
        setContent(fullNewText);
        textarea.focus();
        textarea.setSelectionRange(start, start + newText.length);
    };
    const removeBbCode = (tag) => {
        const textarea = contentRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);
        const regex = new RegExp(`\\[${tag}(?:=.*?)?\\](.*?)\\[\\/${tag}\\]`, 'gi');
        const strippedText = selectedText.replace(regex, '$1');
        const newText = `${content.substring(0, start)}${strippedText}${content.substring(end)}`;
        setContent(newText);
        textarea.focus();
        textarea.setSelectionRange(start, start + strippedText.length);
    };
    const handleColorChange = () => applyBbCode('COLOR', editorColor);
    const handleSizeChange = () => applyBbCode('SIZE', editorSize);
    const handleResetSize = () => removeBbCode('SIZE');
    const handleSubtitle = () => applyBbCode('SIZE', 5, `[B]${content.substring(contentRef.current.selectionStart, contentRef.current.selectionEnd)}[/B]`);
    const handleSubtitleIn = () => applyBbCode('SIZE', 4, `[B]${content.substring(contentRef.current.selectionStart, contentRef.current.selectionEnd)}[/B]`);
    const handleMediaDesc = () => applyBbCode('SIZE', 1, `[I]${content.substring(contentRef.current.selectionStart, contentRef.current.selectionEnd)}[/I]`);
    const handleAddHyperlink = () => { const url = prompt("הכנס קישור:"); if (url) applyBbCode('URL', url); };
    const handleRemoveHyperlink = () => removeBbCode('URL');

    // --- Main Generation Logic for both HTML and BBCode ---
    useEffect(() => {
        const generateOutputs = async () => {
            const deptConfig = depts[dept];
            if (!deptConfig) return;

            const media = processMediaLink(imageLink);

            // --- Generate HTML for Preview ---
            try {
                const htmlTemplatePath = deptConfig.templateFile ?? '/template.txt';
                const response = await fetch(htmlTemplatePath);
                if (!response.ok) throw new Error(`לא נמצא קובץ תבנית HTML בנתיב ${htmlTemplatePath}`);

                let htmlTemplate = await response.text();
                htmlTemplate = htmlTemplate.replace(/%deptColor%/g, deptConfig.deptColor);
                if (title) htmlTemplate = htmlTemplate.replace(/%ArticleTitle%/g, title);
                if (imageLink) htmlTemplate = htmlTemplate.replace(/%ImageLink%/g, media.html);

                let finalContentHtml = content.replace(/\n/g, '<br />')
                    .replace(/\[B\](.*?)\[\/B\]/gi, '<strong>$1</strong>')
                    .replace(/\[I\](.*?)\[\/I\]/gi, '<em>$1</em>')
                    .replace(/\[U\](.*?)\[\/U\]/gi, '<u>$1</u>')
                    .replace(/\[COLOR=(.*?)\](.*?)\[\/COLOR\]/gi, '<span style="color:$1;">$2</span>');

                if (finalContentHtml) htmlTemplate = htmlTemplate.replace(/%Content%/g, finalContentHtml);
                if (relevantLink) {
                    htmlTemplate = htmlTemplate.replace(/%RelevantLinkDesc%/g, relevantLinkDesc);
                    htmlTemplate = htmlTemplate.replace(/%RelevantLink%/g, relevantLink);
                }
                if (source) htmlTemplate = htmlTemplate.replace(/%Source%/g, source);
                htmlTemplate = htmlTemplate.replace(/%ForumName%/g, forumName);

                setGeneratedHtml(htmlTemplate);
                setPreviewContent(htmlTemplate);
            } catch (error) {
                console.error('Error generating HTML:', error);
                setPreviewContent(`<p style="color:red; font-weight:bold;">שגיאה ביצירת HTML: ${error.message}</p>`);
            }

            // --- Generate BBCode ---
            try {
                const bbcodeTemplatePath = deptConfig.bbcodeTemplateFile ?? '/feed/bbcode.bb';
                const response = await fetch(bbcodeTemplatePath);
                if (!response.ok) throw new Error(`לא נמצא קובץ תבנית BBCODE בנתיב ${bbcodeTemplatePath}`);

                let bbcodeTemplate = await response.text();

                // עיבוד בלוקים מותנים
                const blockValues = {
                  IMAGELINK: imageLink,
                  RELEVANTLINK: relevantLink,
                  SOURCE: source,
                  ADDITIONAL_LINKS: '', // אפשר להוסיף שדות נוספים לפי הצורך
                };
                bbcodeTemplate = processConditionalBlocks(bbcodeTemplate, blockValues);

                bbcodeTemplate = bbcodeTemplate.replace(/%deptColor%/g, deptConfig.deptColor);
                bbcodeTemplate = bbcodeTemplate.replace(/%ArticleTitle%/g, title);
                bbcodeTemplate = bbcodeTemplate.replace(/%ImageLink%/g, media.bbcode);
                bbcodeTemplate = bbcodeTemplate.replace(/%Content%/g, content);
                bbcodeTemplate = bbcodeTemplate.replace(/%RelevantLinkDesc%/g, relevantLinkDesc);
                bbcodeTemplate = bbcodeTemplate.replace(/%RelevantLink%/g, relevantLink);
                bbcodeTemplate = bbcodeTemplate.replace(/%Source%/g, source);
                bbcodeTemplate = bbcodeTemplate.replace(/%ForumName%/g, forumName);

                setBBcode(bbcodeTemplate);
            } catch (error) {
                console.error('Error generating BBCode:', error);
                setBBcode(`שגיאה ביצירת BBCode: ${error.message}`);
            }
        };

        generateOutputs();
    }, [dept, title, imageLink, content, relevantLinkDesc, relevantLink, source, forumName]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text.trim()).then(() => {
            alert('הקוד הועתק!');
        });
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-8 bg-gray-900 text-white">
            <div className="z-10 w-full max-w-7xl items-center justify-between font-mono text-sm lg:flex flex-col">
                <h1 className="text-4xl font-bold mb-4">מחולל כתבות</h1>
                <div className="mb-8 flex justify-center gap-4">
                    <button onClick={() => handleDeptChange('feed')} className={`px-6 py-2 rounded-lg ${dept === 'feed' ? 'bg-blue-600' : 'bg-gray-700'}`}>פיד</button>
                    <button onClick={() => handleDeptChange('eruhim')} className={`px-6 py-2 rounded-lg ${dept === 'eruhim' ? 'bg-blue-600' : 'bg-gray-700'}`}>אירוחים</button>
                </div>
                <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="bg-gray-800 p-6 rounded-lg space-y-4 w-full max-w-6xl mx-auto overflow-x-auto">
                        <h2 className="text-2xl font-semibold mb-4">מחולל הכתבות ({dept})</h2>
                        <div><label className="block mb-2">כותרת הכתבה</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 bg-gray-700 rounded" /></div>
                        {/* --- UPDATED MEDIA LINK FIELD --- */}
                        <div>
                            <label className="block mb-2">קישור למדיה (תמונה או סרטון YouTube)</label>
                            <input type="text" value={imageLink} onChange={(e) => setImageLink(e.target.value)} placeholder="https://example.com/image.png או https://www.youtube.com/watch?v=..." className="w-full p-2 bg-gray-700 rounded" />
                        </div>
                        <div className="mb-4"><label className="block mb-2">תוכן הכתבה</label><div className="flex flex-wrap items-center gap-2 mb-2 p-2 bg-gray-700 rounded"><button onClick={() => applyBbCode('B')} className="font-bold w-8 h-8 bg-gray-600 rounded">B</button><button onClick={() => applyBbCode('U')} className="underline w-8 h-8 bg-gray-600 rounded">U</button><button onClick={() => applyBbCode('I')} className="italic w-8 h-8 bg-gray-600 rounded">I</button><span className="text-gray-500">|</span><input type="color" value={editorColor} onChange={(e) => setEditorColor(e.target.value)} className="bg-gray-700 rounded w-10 h-8 cursor-pointer" /><button onClick={handleColorChange} className="bg-gray-600 px-3 py-1 rounded text-xs">שנה צבע</button><span className="text-gray-500">|</span><button onClick={handleResetSize} className="bg-gray-600 px-3 py-1 rounded text-xs">אפס גודל</button><input type="number" min="1" max="7" value={editorSize} onChange={(e) => setEditorSize(e.target.value)} className="w-16 p-1 bg-gray-600 rounded text-center" /><button onClick={handleSizeChange} className="bg-gray-600 px-3 py-1 rounded text-xs">שנה גודל</button><span className="text-gray-500">|</span><button onClick={handleSubtitle} className="bg-gray-600 px-3 py-1 rounded text-xs">כותרת ראשית</button><button onClick={handleSubtitleIn} className="bg-gray-600 px-3 py-1 rounded text-xs">כותרת פנימית</button><button onClick={handleMediaDesc} className="bg-gray-600 px-3 py-1 rounded text-xs">תיאור מדיה</button><span className="text-gray-500">|</span><button onClick={handleAddHyperlink} className="bg-gray-600 px-3 py-1 rounded text-xs">היפר-קישור</button><button onClick={handleRemoveHyperlink} className="bg-gray-600 px-3 py-1 rounded text-xs">אפס קישור</button></div><textarea ref={contentRef} value={content} onChange={(e) => setContent(e.target.value)} className="w-full p-2 bg-gray-700 rounded h-48" /></div>
                        <div><label className="block mb-2">תיאור קישור רלוונטי + קישור</label><div className="flex gap-4"><input type="text" value={relevantLinkDesc} onChange={(e) => setRelevantLinkDesc(e.target.value)} placeholder="תיאור הקישור" className="w-1/2 p-2 bg-gray-700 rounded" /><input type="text" value={relevantLink} onChange={(e) => setRelevantLink(e.target.value)} placeholder="https://example.com" className="w-1/2 p-2 bg-gray-700 rounded" /></div></div>
                        <div><label className="block mb-2">קישור למקור הכתבה</label><input type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="https://source-example.com" className="w-full p-2 bg-gray-700 rounded" /></div>
                        <div><label className="block mb-2">פורום רלוונטי</label><select value={forumName} onChange={(e) => setForumName(e.target.value)} className="w-full p-2 bg-gray-700 rounded"><option>פורום 1</option><option>פורום 2</option><option>פורום 3</option></select></div>
                        {/* אשכולות רלוונטיים */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-lg font-semibold">אשכולות רלוונטיים</label>
                                <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded" style={{minWidth:'180px'}}>חפש אשכולות בפורום הרלוונטי</button>
                            </div>
                            {threads.map((thread, idx) => (
                                <div key={idx} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={thread.title}
                                        onChange={e => handleThreadChange(idx, 'title', e.target.value)}
                                        placeholder={`כותרת אשכול ${idx+1}`}
                                        className="w-1/2 p-2 bg-gray-700 rounded"
                                    />
                                    <input
                                        type="text"
                                        value={thread.link}
                                        onChange={e => handleThreadChange(idx, 'link', e.target.value)}
                                        placeholder={`קישור אשכול ${idx+1}`}
                                        className="w-1/2 p-2 bg-gray-700 rounded"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Preview and Output Section */}
                    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
                        <div>
                            <h2 className="text-2xl font-semibold mb-2">תצוגה מקדימה (HTML)</h2>
                            <div className="w-full bg-white text-black p-4 rounded-lg overflow-y-auto" style={{boxSizing: 'border-box', width: '100%', height: 'auto'}} dangerouslySetInnerHTML={{ __html: previewContent }}></div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold mb-2">Generated BBCODE</h2>
                            <textarea readOnly value={generatedBBcode} className="w-full p-2 bg-gray-700 rounded h-32 mb-2" />
                            <button onClick={() => copyToClipboard(generatedBBcode)} className="w-full bg-purple-600 px-4 py-2 rounded">העתק קוד BBCODE</button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

// Wrapper for Suspense
export default function Home() {
    return (
        <Suspense fallback={<div>טוען...</div>}>
            <ArticleGeneratorComponent />
        </Suspense>
    );
}
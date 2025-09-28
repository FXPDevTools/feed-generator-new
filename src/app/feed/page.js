"use client";
import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import depts from 'public/dept-config.json';
import BackButtons from "../BackButtons";
import { 
  simulateTemplateForPreview, 
  GLOBAL_PLACEHOLDERS, 
  GLOBAL_IF_BLOCKS 
} from '../../../lib/bbcode-preview.js';

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

// Normalize BBCode whitespace: collapse large gaps and trim edges
function normalizeBBCodeSpacing(text) {
    if (!text) return '';
    let t = String(text);
    // Normalize line endings
    t = t.replace(/\r\n/g, '\n');
    // Trim trailing spaces on each line
    t = t.split('\n').map(line => line.replace(/[ \t]+$/g, '')).join('\n');
    // Collapse 3+ consecutive blank lines into a single blank line
    t = t.replace(/\n(?:[ \t]*\n){2,}/g, '\n\n');
    // Trim leading/trailing blank lines
    t = t.replace(/^\s*\n+/, '').replace(/\n+\s*$/, '');
    return t;
}


// The main generator component
function ArticleGeneratorComponent() {
    const searchParams = useSearchParams();
    const templateId = searchParams?.get('template'); // Get ?template=ID from URL

    // Template state
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [templateError, setTemplateError] = useState('');

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
    const contentRef = useRef(null);
    // --- State variables for the form fields ---
    const [title, setTitle] = useState(''); // %ArticleTitle%
    const [imageLink, setImageLink] = useState(''); // %ImageLink%
    const [content, setContent] = useState(''); // %Content%
    const [relevantLinkDesc, setRelevantLinkDesc] = useState(''); // %RelevantLinkDesc%
    const [relevantLink, setRelevantLink] = useState(''); // %RelevantLink%
    const [source, setSource] = useState(''); // %Source%
    const [forumName, setForumName] = useState('בחירת פורום'); // default option
    // --- States for generated outputs, preview, and editor ---
    const [generatedHtml, setGeneratedHtml] = useState('');
    const [generatedBBcode, setBBcode] = useState(''); // Your new state for BBCode
    const [previewContent, setPreviewContent] = useState('');
    const [editorColor, setEditorColor] = useState('#000000');
    const [editorSize, setEditorSize] = useState(3);

    // --- Template Loading Logic ---
    const loadTemplate = useCallback(async () => {
        try {
            let templateData = null;
            
            if (templateId) {
                // Try to load specific template by ID
                const response = await fetch(`/api/bbcode/templates/${templateId}`);
                if (response.ok) {
                    templateData = await response.json();
                } else {
                    setTemplateError(`תבנית עם ID ${templateId} לא נמצאה`);
                    return;
                }
            } else {
                // Try to load active template
                const response = await fetch('/api/bbcode/templates/active');
                if (response.ok) {
                    templateData = await response.json();
                }
            }
            
            if (templateData && templateData.content) {
                setCurrentTemplate(templateData);
                setTemplateError('');
            } else {
                // Fallback to old system
                setCurrentTemplate(null);
                setTemplateError('');
                console.log('No template found, using legacy system');
            }
        } catch (error) {
            console.error('Error loading template:', error);
            setCurrentTemplate(null);
            setTemplateError('');
        }
    }, [templateId]);

    // Load template on component mount and when templateId changes
    useEffect(() => {
        loadTemplate();
    }, [loadTemplate]);

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
        const deptConfig = depts.feed;
        if (!deptConfig) return;

        const generateOutputs = async () => {
            const media = processMediaLink(imageLink);

            // --- Additional Links Logic ---
            // Block appears only if ALL 5 links AND ALL 5 titles are filled
            const additionalLinksFilled = threads.every(thread => thread.title.trim() && thread.link.trim());
            const forumFilled = forumName !== 'בחירת פורום';
            const forumOrLinksFilled = forumFilled || additionalLinksFilled;

            // Prepare data object for template processing
            // Fetch dynamic ErrorUserID setting
            let errorUserId = '';
            try {
                const r = await fetch('/api/panel/leader/settings/error-user', { cache: 'no-store' });
                if (r.ok) {
                    const d = await r.json();
                    errorUserId = d?.id || '';
                }
            } catch {}

            const templateData = {
                ArticleTitle: title || 'כותרת',
                Content: content || 'תוכן',
                ImageLink: imageLink ? media.bbcode : '',
                RelevantLinkDesc: relevantLinkDesc || '',
                RelevantLink: relevantLink || '',
                Source: source || '',
                ForumName: forumFilled ? forumName : '',
                ForumID: forumFilled ? '123' : '', // Default forum ID
                ErrorUserID: errorUserId,
                AdditionalLink1: threads[0]?.link || '',
                AdditionalTitle1: threads[0]?.title || '',
                AdditionalLink2: threads[1]?.link || '',
                AdditionalTitle2: threads[1]?.title || '',
                AdditionalLink3: threads[2]?.link || '',
                AdditionalTitle3: threads[2]?.title || '',
                AdditionalLink4: threads[3]?.link || '',
                AdditionalTitle4: threads[3]?.title || '',
                AdditionalLink5: threads[4]?.link || '',
                AdditionalTitle5: threads[4]?.title || '',
            };

            // --- Generate BBCode ---
            if (currentTemplate && currentTemplate.content) {
                // Use new template system
                try {
                    const processedBBCode = simulateTemplateForPreview(currentTemplate.content, templateData, {
                        removeUnknown: false // Keep unknown placeholders for manual editing
                    });
                    setBBcode(normalizeBBCodeSpacing(processedBBCode));
                } catch (error) {
                    console.error('Error processing new template:', error);
                    setBBcode(`שגיאה בעיבוד התבנית החדשה: ${error.message}`);
                }
            } else {
                // Fallback to legacy system
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
                        ADDITIONAL_LINKS: additionalLinksFilled ? '1' : '',
                        FORUM: forumFilled ? '1' : '',
                        FORUM_OR_LINKS: forumOrLinksFilled ? '1' : '',
                    };
                    bbcodeTemplate = processConditionalBlocks(bbcodeTemplate, blockValues);

                    bbcodeTemplate = bbcodeTemplate.replace(/%deptColor%/g, deptConfig.deptColor);
                    bbcodeTemplate = bbcodeTemplate.replace(/%ArticleTitle%/g, title);
                    bbcodeTemplate = bbcodeTemplate.replace(/%ImageLink%/g, media.bbcode);
                    bbcodeTemplate = bbcodeTemplate.replace(/%Content%/g, content);
                    bbcodeTemplate = bbcodeTemplate.replace(/%RelevantLinkDesc%/g, relevantLinkDesc);
                    bbcodeTemplate = bbcodeTemplate.replace(/%RelevantLink%/g, relevantLink);
                    bbcodeTemplate = bbcodeTemplate.replace(/%Source%/g, source);
                    // Dynamic error user id placeholder for legacy BBCode fallback
                    bbcodeTemplate = bbcodeTemplate.replace(/%ErrorUserID%/g, errorUserId || '');
                    bbcodeTemplate = bbcodeTemplate.replace(/%ForumName%/g, forumName);
                    bbcodeTemplate = bbcodeTemplate.replace(/%AdditionalLink1%/g, threads[0].link);
                    bbcodeTemplate = bbcodeTemplate.replace(/%AdditionalTitle1%/g, threads[0].title);
                    bbcodeTemplate = bbcodeTemplate.replace(/%AdditionalLink2%/g, threads[1].link);
                    bbcodeTemplate = bbcodeTemplate.replace(/%AdditionalTitle2%/g, threads[1].title);
                    bbcodeTemplate = bbcodeTemplate.replace(/%AdditionalLink3%/g, threads[2].link);
                    bbcodeTemplate = bbcodeTemplate.replace(/%AdditionalTitle3%/g, threads[2].title);
                    bbcodeTemplate = bbcodeTemplate.replace(/%AdditionalLink4%/g, threads[3].link);
                    bbcodeTemplate = bbcodeTemplate.replace(/%AdditionalTitle4%/g, threads[3].title);
                    bbcodeTemplate = bbcodeTemplate.replace(/%AdditionalLink5%/g, threads[4].link);
                    bbcodeTemplate = bbcodeTemplate.replace(/%AdditionalTitle5%/g, threads[4].title);

                    setBBcode(normalizeBBCodeSpacing(bbcodeTemplate));
                } catch (error) {
                    console.error('Error generating BBCode:', error);
                    setBBcode(`שגיאה ביצירת BBCode: ${error.message}`);
                }
            }

            // --- Generate HTML for Preview ---
            // Always use legacy HTML preview system for now
            try {
                const htmlTemplatePath = deptConfig.templateFile ?? '/template.txt';
                const response = await fetch(htmlTemplatePath);
                if (!response.ok) throw new Error(`לא נמצא קובץ תבנית HTML בנתיב ${htmlTemplatePath}`);

                let htmlTemplate = await response.text();
                htmlTemplate = htmlTemplate.replace(/%deptColor%/g, deptConfig.deptColor);
                // Default title/content if empty
                htmlTemplate = htmlTemplate.replace(/%ArticleTitle%/g, title || 'כותרת');
                htmlTemplate = htmlTemplate.replace(/%Content%/g, content ? content.replace(/\n/g, '<br />') : 'תוכן');
                // Hide other tags if empty
                htmlTemplate = htmlTemplate.replace(/%ImageLink%/g, imageLink ? media.html : '');
                htmlTemplate = htmlTemplate.replace(/%RelevantLinkDesc%/g, relevantLinkDesc ? relevantLinkDesc : '');
                htmlTemplate = htmlTemplate.replace(/%RelevantLink%/g, relevantLink ? relevantLink : '');
                htmlTemplate = htmlTemplate.replace(/%Source%/g, source ? source : '');
                // Dynamic error user id placeholder for legacy HTML preview
                htmlTemplate = htmlTemplate.replace(/%ErrorUserID%/g, errorUserId || '');
                htmlTemplate = htmlTemplate.replace(/%ForumName%/g, forumFilled ? forumName : '');
                // אשכולות רלוונטיים
                htmlTemplate = htmlTemplate.replace(/%AdditionalLink1%/g, threads[0]?.link ? threads[0].link : '');
                htmlTemplate = htmlTemplate.replace(/%AdditionalTitle1%/g, threads[0]?.title ? threads[0].title : '');
                htmlTemplate = htmlTemplate.replace(/%AdditionalLink2%/g, threads[1]?.link ? threads[1].link : '');
                htmlTemplate = htmlTemplate.replace(/%AdditionalTitle2%/g, threads[1]?.title ? threads[1].title : '');
                htmlTemplate = htmlTemplate.replace(/%AdditionalLink3%/g, threads[2]?.link ? threads[2].link : '');
                htmlTemplate = htmlTemplate.replace(/%AdditionalTitle3%/g, threads[2]?.title ? threads[2].title : '');
                htmlTemplate = htmlTemplate.replace(/%AdditionalLink4%/g, threads[3]?.link ? threads[3].link : '');
                htmlTemplate = htmlTemplate.replace(/%AdditionalTitle4%/g, threads[3]?.title ? threads[3].title : '');
                htmlTemplate = htmlTemplate.replace(/%AdditionalLink5%/g, threads[4]?.link ? threads[4].link : '');
                htmlTemplate = htmlTemplate.replace(/%AdditionalTitle5%/g, threads[4]?.title ? threads[4].title : '');

                // Remove conditional blocks if not filled
                htmlTemplate = htmlTemplate.replace(/%IF_FORUM_OR_LINKS_START%([\s\S]*?)%IF_FORUM_OR_LINKS_END%/g, forumOrLinksFilled ? '$1' : '');
                htmlTemplate = htmlTemplate.replace(/%IF_FORUM_START%([\s\S]*?)%IF_FORUM_END%/g, forumFilled ? '$1' : '');
                htmlTemplate = htmlTemplate.replace(/%IF_ADDITIONAL_LINKS_START%([\s\S]*?)%IF_ADDITIONAL_LINKS_END%/g, additionalLinksFilled ? '$1' : '');

                setGeneratedHtml(htmlTemplate);
                setPreviewContent(htmlTemplate);
            } catch (error) {
                console.error('Error generating HTML:', error);
                setPreviewContent(`<p style="color:red; font-weight:bold;">שגיאה ביצירת HTML: ${error.message}</p>`);
            }
        };

        generateOutputs();
    }, [title, imageLink, content, relevantLinkDesc, relevantLink, source, forumName, threads, currentTemplate]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text.trim()).then(() => {
            alert('הקוד הועתק!');
        });
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-8 bg-gray-900 text-white">
            <div className="z-10 w-full max-w-7xl items-center justify-between font-mono text-sm lg:flex flex-col">
                <BackButtons />
                <h1 className="text-4xl font-bold mb-4">מחולל כתבות</h1>
                
                {/* Template Status */}
                {currentTemplate ? (
                    <div className="mb-4 p-3 bg-blue-900 rounded-lg">
                        <p className="text-sm text-blue-200">
                            🎯 משתמש בתבנית: <strong>{currentTemplate.name}</strong>
                            {templateId ? ` (ID: ${templateId})` : ' (פעילה)'}
                        </p>
                    </div>
                ) : templateError ? (
                    <div className="mb-4 p-3 bg-red-900 rounded-lg">
                        <p className="text-sm text-red-200">❌ {templateError} - חזר למערכת הישנה</p>
                    </div>
                ) : (
                    <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-300">📁 משתמש במערכת התבניות הישנה</p>
                    </div>
                )}
                
                <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="bg-gray-800 p-6 rounded-lg space-y-4 w-full max-w-6xl mx-auto overflow-x-auto">
                        <h2 className="text-2xl font-semibold mb-4">מחולל הכתבות</h2>
                        <div><label className="block mb-2">כותרת הכתבה</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 bg-gray-700 rounded" /></div>
                        {/* --- UPDATED MEDIA LINK FIELD --- */}
                        <div>
                            <label className="block mb-2">קישור למדיה (תמונה או סרטון YouTube)</label>
                            <input type="text" value={imageLink} onChange={(e) => setImageLink(e.target.value)} placeholder="https://example.com/image.png או https://www.youtube.com/watch?v=..." className="w-full p-2 bg-gray-700 rounded" />
                        </div>
                        <div className="mb-4"><label className="block mb-2">תוכן הכתבה</label><div className="flex flex-wrap items-center gap-2 mb-2 p-2 bg-gray-700 rounded"><button onClick={() => applyBbCode('B')} className="font-bold w-8 h-8 bg-gray-600 rounded">B</button><button onClick={() => applyBbCode('U')} className="underline w-8 h-8 bg-gray-600 rounded">U</button><button onClick={() => applyBbCode('I')} className="italic w-8 h-8 bg-gray-600 rounded">I</button><span className="text-gray-500">|</span><input type="color" value={editorColor} onChange={(e) => setEditorColor(e.target.value)} className="bg-gray-700 rounded w-10 h-8 cursor-pointer" /><button onClick={handleColorChange} className="bg-gray-600 px-3 py-1 rounded text-xs">שנה צבע</button><span className="text-gray-500">|</span><button onClick={handleResetSize} className="bg-gray-600 px-3 py-1 rounded text-xs">אפס גודל</button><input type="number" min="1" max="7" value={editorSize} onChange={(e) => setEditorSize(e.target.value)} className="w-16 p-1 bg-gray-600 rounded text-center" /><button onClick={handleSizeChange} className="bg-gray-600 px-3 py-1 rounded text-xs">שנה גודל</button><span className="text-gray-500">|</span><button onClick={handleSubtitle} className="bg-gray-600 px-3 py-1 rounded text-xs">כותרת ראשית</button><button onClick={handleSubtitleIn} className="bg-gray-600 px-3 py-1 rounded text-xs">כותרת פנימית</button><button onClick={handleMediaDesc} className="bg-gray-600 px-3 py-1 rounded text-xs">תיאור מדיה</button><span className="text-gray-500">|</span><button onClick={handleAddHyperlink} className="bg-gray-600 px-3 py-1 rounded text-xs">היפר-קישור</button><button onClick={handleRemoveHyperlink} className="bg-gray-600 px-3 py-1 rounded text-xs">אפס קישור</button></div><textarea ref={contentRef} value={content} onChange={(e) => setContent(e.target.value)} className="w-full p-2 bg-gray-700 rounded h-48" /></div>
                        <div><label className="block mb-2">תיאור קישור רלוונטי + קישור</label><div className="flex gap-4"><input type="text" value={relevantLinkDesc} onChange={(e) => setRelevantLinkDesc(e.target.value)} placeholder="תיאור הקישור" className="w-1/2 p-2 bg-gray-700 rounded" /><input type="text" value={relevantLink} onChange={(e) => setRelevantLink(e.target.value)} placeholder="https://example.com" className="w-1/2 p-2 bg-gray-700 rounded" /></div></div>
                        <div><label className="block mb-2">קישור למקור הכתבה</label><input type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="https://source-example.com" className="w-full p-2 bg-gray-700 rounded" /></div>
                        <div><label className="block mb-2">פורום רלוונטי</label>
                            <select value={forumName} onChange={(e) => setForumName(e.target.value)} className="w-full p-2 bg-gray-700 rounded">
                                <option>בחירת פורום</option>
                                <option>פורום 1</option>
                                <option>פורום 2</option>
                                <option>פורום 3</option>
                            </select>
                        </div>
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
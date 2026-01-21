"use client";
import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import depts from 'public/dept-config.json';
import BackButtons from "../components/BackButtons";
import { simulateTemplateForPreview, bbcodeToHtml } from '../../../lib/bbcode-preview';

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
            html: `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="max-width:100%; border-radius: 8px;"></iframe>`,
            bbcode: `[URL]${url}[/URL]` // Standard URL tag for videos
        };
    }

    // Assume it's an image if it's not a YouTube link
    return {
        html: `<img src="${url}" style="max-width:100%; border-radius: 8px;">`,
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
                const r = await fetch('/api/feed/pubsettings', { cache: 'no-store' });
                if (r.ok) {
                    const d = await r.json();
                    errorUserId = d?.id || '';
                }
            } catch { }

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
                
                // FIXED: Use bbcodeToHtml instead of simple replace
                htmlTemplate = htmlTemplate.replace(/%Content%/g, content ? bbcodeToHtml(content) : 'תוכן');
                
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
        <main className="flex min-h-screen flex-col items-center p-6 bg-slate-950 text-slate-100 font-sans">
            <div className="z-10 w-full max-w-7xl items-center justify-between font-mono text-sm lg:flex flex-col gap-6">
                <BackButtons />
                <h1 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">מחולל כתבות</h1>

                {/* Template Status */}
                {currentTemplate ? (
                    <div className="w-full mb-4 p-4 bg-indigo-900/40 border border-indigo-700/50 rounded-xl flex items-center gap-3 shadow-lg backdrop-blur-sm">
                         <div className="p-2 bg-indigo-600/20 rounded-lg">🎯</div>
                         <div>
                            <p className="font-semibold text-indigo-200">תבנית פעילה: {currentTemplate.name}</p>
                            <p className="text-xs text-indigo-300 opacity-80">{templateId ? `ID: ${templateId}` : 'מוגדרת כברירת מחדל'}</p>
                        </div>
                    </div>
                ) : templateError ? (
                    <div className="w-full mb-4 p-4 bg-red-900/40 border border-red-700/50 rounded-xl flex items-center gap-3 shadow-lg">
                        <div className="p-2 bg-red-600/20 rounded-lg">❌</div>
                        <p className="text-red-200 font-medium">{templateError} - משתמש במערכת הישנה</p>
                    </div>
                ) : (
                    <div className="w-full mb-4 p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl flex items-center gap-3 shadow-lg">
                        <div className="p-2 bg-slate-600/20 rounded-lg">📁</div>
                        <p className="text-slate-300">מערכת תבניות ישנה</p>
                    </div>
                )}

                <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                    {/* Input Section */}
                    <div className="bg-slate-900/60 p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
                             <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                             <h2 className="text-2xl font-bold text-slate-100">עריכת תוכן</h2>
                        </div>
                    
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">כותרת הכתבה</label>
                                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg transition-all outline-none" placeholder="הכנס כותרת ראשית..." />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">קישור למדיה (תמונה או סרטון YouTube)</label>
                                <div className="relative">
                                    <input type="text" value={imageLink} onChange={(e) => setImageLink(e.target.value)} placeholder="https://example.com/image.png" className="w-full p-3 bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg transition-all outline-none pl-10" />
                                     <div className="absolute left-3 top-3.5 text-slate-500">🖼️</div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">תוכן הכתבה</label>
                                {/* Toolbar */}
                                <div className="flex flex-wrap items-center gap-2 mb-3 p-2 bg-slate-800 rounded-lg border border-slate-700">
                                    <button onClick={() => applyBbCode('B')} className="w-9 h-9 flex items-center justify-center font-bold bg-slate-700 hover:bg-slate-600 rounded-md transition-colors text-slate-200" title="מודגש">B</button>
                                    <button onClick={() => applyBbCode('U')} className="w-9 h-9 flex items-center justify-center underline bg-slate-700 hover:bg-slate-600 rounded-md transition-colors text-slate-200" title="קו תחתון">U</button>
                                    <button onClick={() => applyBbCode('I')} className="w-9 h-9 flex items-center justify-center italic bg-slate-700 hover:bg-slate-600 rounded-md transition-colors text-slate-200" title="נטוי">I</button>
                                    
                                    <div className="w-px h-6 bg-slate-600 mx-1"></div>
                                    
                                    <div className="flex items-center gap-1 bg-slate-700 p-1 rounded-md">
                                        <input type="color" value={editorColor} onChange={(e) => setEditorColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-none bg-transparent" />
                                        <button onClick={handleColorChange} className="text-xs font-medium px-2 py-1 hover:text-white transition-colors">צבע</button>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 bg-slate-700 p-1 rounded-md">
                                        <input type="number" min="1" max="7" value={editorSize} onChange={(e) => setEditorSize(e.target.value)} className="w-8 bg-transparent text-center text-sm outline-none" />
                                        <button onClick={handleSizeChange} className="text-xs font-medium px-2 py-1 hover:text-white transition-colors">גודל</button>
                                        <button onClick={handleResetSize} className="text-xs opacity-50 hover:opacity-100 px-1">✕</button>
                                    </div>

                                    <div className="w-px h-6 bg-slate-600 mx-1"></div>

                                    <button onClick={handleSubtitle} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-xs font-medium transition-colors">כותרת</button>
                                    <button onClick={handleSubtitleIn} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-xs font-medium transition-colors">תת-כותרת</button>
                                    
                                    <div className="w-px h-6 bg-slate-600 mx-1"></div>
                                    
                                    <button onClick={handleAddHyperlink} className="w-9 h-9 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-md text-lg transition-colors" title="הוסף קישור">🔗</button>
                                </div>
                                
                                <textarea 
                                    ref={contentRef} 
                                    value={content} 
                                    onChange={(e) => setContent(e.target.value)} 
                                    className="w-full p-4 bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg min-h-[300px] font-sans text-base leading-relaxed resize-y outline-none transition-all"
                                    placeholder="כתוב את תוכן הכתבה כאן..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">תיאור קישור רלוונטי</label>
                                    <input type="text" value={relevantLinkDesc} onChange={(e) => setRelevantLinkDesc(e.target.value)} placeholder="לדוגמה: למעבר לכתבה" className="w-full p-3 bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg outline-none" />
                                </div>
                                <div>
                                     <label className="block text-sm font-medium text-slate-400 mb-1.5">כתובת הקישור</label>
                                    <input type="text" value={relevantLink} onChange={(e) => setRelevantLink(e.target.value)} placeholder="https://..." className="w-full p-3 bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg outline-none" />
                                </div>
                            </div>
                            
                             <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">מקור הכתבה</label>
                                <div className="relative">
                                    <input type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="https://source-example.com" className="w-full p-3 bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg outline-none pl-10" />
                                    <div className="absolute left-3 top-3.5 text-slate-500">🌐</div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">פורום רלוונטי</label>
                                <div className="relative">
                                    <select value={forumName} onChange={(e) => setForumName(e.target.value)} className="w-full p-3 bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg outline-none appearance-none cursor-pointer">
                                        <option>בחירת פורום</option>
                                        <option>פורום 1</option>
                                        <option>פורום 2</option>
                                        <option>פורום 3</option>
                                    </select>
                                    <div className="absolute left-3 top-4 text-slate-500 pointer-events-none">▼</div>
                                </div>
                            </div>
                        </div>

                        {/* אשכולות רלוונטיים */}
                        <div className="pt-6 border-t border-slate-800">
                            <div className="flex items-center justify-between mb-4">
                                <label className="block text-lg font-bold text-slate-200">אשכולות רלוונטיים</label>
                                <button type="button" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-900/20">
                                    🔍 חפש אשכולות
                                </button>
                            </div>
                            <div className="space-y-3">
                                {threads.map((thread, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <div className="flex items-center justify-center w-8 h-10 bg-slate-800 rounded text-slate-500 font-mono text-xs">{idx + 1}</div>
                                        <input
                                            type="text"
                                            value={thread.title}
                                            onChange={e => handleThreadChange(idx, 'title', e.target.value)}
                                            placeholder="כותרת האשכול"
                                            className="w-1/2 p-2.5 bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg outline-none text-sm"
                                        />
                                        <input
                                            type="text"
                                            value={thread.link}
                                            onChange={e => handleThreadChange(idx, 'link', e.target.value)}
                                            placeholder="קישור לאשכול"
                                            className="w-1/2 p-2.5 bg-slate-800/50 border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg outline-none text-sm text-left dir-ltr"
                                            dir="ltr"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preview and Output Section */}
                    <div className="space-y-8 sticky top-6">
                        {/* HTML Preview */}
                        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                             <div className="bg-slate-800/80 p-4 border-b border-slate-700 flex justify-between items-center backdrop-blur">
                                <h2 className="text-lg font-bold text-slate-200">תצוגה מקדימה (Live)</h2>
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                                </div>
                            </div>
                            <div className="p-6 bg-[#f3f4f6]" style={{ minHeight: '400px' }}>
                                {/* The actual preview container simulating the forum style */}
                                <div className="text-black overflow-y-auto max-h-[600px] custom-scrollbar" style={{ direction: 'rtl' }} dangerouslySetInnerHTML={{ __html: previewContent }}></div>
                            </div>
                        </div>

                        {/* BBCode Output */}
                         <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                            <div className="bg-slate-800/80 p-4 border-b border-slate-700 backdrop-blur">
                                <h2 className="text-lg font-bold text-slate-200">קוד סופי (BBCODE)</h2>
                            </div>
                            <div className="p-6">
                                <div className="relative">
                                    <textarea 
                                        readOnly 
                                        value={generatedBBcode} 
                                        className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl h-40 font-mono text-xs text-slate-400 focus:text-slate-200 focus:border-indigo-500 transition-colors outline-none resize-none mb-4" 
                                    />
                                    <button 
                                        onClick={() => copyToClipboard(generatedBBcode)} 
                                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-emerald-900/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        📋 העתק קוד לפרסום
                                    </button>
                                </div>
                            </div>
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
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center text-slate-400">טוען נתונים...</div>}>
            <ArticleGeneratorComponent />
        </Suspense>
    );
}
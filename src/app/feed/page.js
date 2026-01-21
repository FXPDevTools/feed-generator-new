"use client";
import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import depts from 'public/dept-config.json';
import forumCategories from 'public/forum-categories.json';
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
    const [forumName, setForumName] = useState(''); // format: "id|name" or empty
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

    // --- Search Threads Handler ---
    const handleSearchThreads = () => {
        if (!forumName) {
            alert('יש לבחור פורום קודם!');
            return;
        }
        // Parse forum ID from the value (format: "id|name")
        const [forumId] = forumName.split('|');
        // Open FXP forum search in new tab
        const searchQuery = encodeURIComponent(title || 'חדשות');
        const forumSearchUrl = `https://www.fxp.co.il/search.php?do=process&query=${searchQuery}&titleonly=1&searchuser=&starteronly=0&exactname=1&replyless=0&replylimit=0&searchdate=0&beforeafter=after&sortby=lastpost&order=descending&showposts=0&saveprefs=1&prefixchoice%5B%5D=0&forumchoice[]=${forumId}&childforums=1&quicksearch=1`;
        window.open(forumSearchUrl, '_blank');
        alert('נפתח חלון חיפוש באתר FXP.\nהעתק את הקישורים והכותרות של האשכולות הרלוונטיים.');
    };

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
        <main className="min-h-screen p-4 md:p-8 noise-overlay">
            {/* Decorative background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl float-animation"></div>
                <div className="absolute bottom-40 left-20 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" style={{ animationDelay: '2s' }}></div>
                <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl float-animation" style={{ animationDelay: '4s' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto">
                <BackButtons />

                {/* Hero Header */}
                <div className="text-center mb-10 mt-4">
                    <div className="inline-block mb-4">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="w-12 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent rounded-full"></div>
                            <span className="text-sm font-medium text-indigo-400 tracking-widest uppercase">Feed Generator</span>
                            <div className="w-12 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent rounded-full"></div>
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-gradient mb-3">מחולל כתבות</h1>
                    <p className="text-slate-400 text-lg">צור תוכן מעוצב בקלות ומהירות</p>
                </div>

                {/* Template Status - Glassmorphism */}
                {currentTemplate ? (
                    <div className="glass-card glow-indigo rounded-2xl p-5 mb-8 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
                            🎯
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-lg text-white">תבנית פעילה: {currentTemplate.name}</p>
                            <p className="text-sm text-indigo-300/80">{templateId ? `מזהה: ${templateId}` : 'מוגדרת כברירת מחדל'}</p>
                        </div>
                        <div className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-xs text-indigo-300 font-medium">
                            מופעל
                        </div>
                    </div>
                ) : templateError ? (
                    <div className="glass-card rounded-2xl p-5 mb-8 flex items-center gap-4 border-red-500/30">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-2xl shadow-lg">
                            ⚠️
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-lg text-white">{templateError}</p>
                            <p className="text-sm text-red-300/80">נעשה שימוש במערכת הישנה</p>
                        </div>
                    </div>
                ) : (
                    <div className="glass-card rounded-2xl p-5 mb-8 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-2xl shadow-lg">
                            📁
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-lg text-white">מערכת תבניות קלאסית</p>
                            <p className="text-sm text-slate-400">ללא תבנית מותאמת אישית</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                    {/* Input Section - Left Card */}
                    <div className="gradient-border">
                        <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
                            {/* Card Header */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                                    <span className="text-xl">✏️</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">עריכת תוכן</h2>
                                    <p className="text-sm text-slate-400">הזן את פרטי הכתבה</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Title Input */}
                                <div className="group">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                        כותרת הכתבה
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full p-4 bg-slate-900/50 border-2 border-slate-700/50 focus:border-indigo-500 rounded-xl transition-all outline-none input-glow text-lg placeholder:text-slate-600"
                                        placeholder="הכנס כותרת ראשית..."
                                    />
                                </div>

                                {/* Media Link Input */}
                                <div className="group">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                        קישור למדיה
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={imageLink}
                                            onChange={(e) => setImageLink(e.target.value)}
                                            placeholder="תמונה או סרטון YouTube"
                                            className="w-full p-4 bg-slate-900/50 border-2 border-slate-700/50 focus:border-indigo-500 rounded-xl transition-all outline-none input-glow pl-14 placeholder:text-slate-600"
                                        />
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-50">🖼️</div>
                                    </div>
                                </div>

                                {/* Content Editor */}
                                <div className="group">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                                        תוכן הכתבה
                                    </label>

                                    {/* Premium Toolbar */}
                                    <div className="flex flex-wrap items-center gap-1.5 mb-3 p-3 bg-slate-900/80 rounded-xl border border-slate-700/50">
                                        <div className="flex gap-1">
                                            <button onClick={() => applyBbCode('B')} className="w-10 h-10 flex items-center justify-center font-black text-lg bg-slate-800 hover:bg-indigo-600 rounded-lg transition-all btn-lift" title="מודגש">B</button>
                                            <button onClick={() => applyBbCode('U')} className="w-10 h-10 flex items-center justify-center underline bg-slate-800 hover:bg-indigo-600 rounded-lg transition-all btn-lift" title="קו תחתון">U</button>
                                            <button onClick={() => applyBbCode('I')} className="w-10 h-10 flex items-center justify-center italic bg-slate-800 hover:bg-indigo-600 rounded-lg transition-all btn-lift" title="נטוי">I</button>
                                        </div>

                                        <div className="w-px h-8 bg-slate-700 mx-2"></div>

                                        <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg">
                                            <input type="color" value={editorColor} onChange={(e) => setEditorColor(e.target.value)} className="w-7 h-7 rounded-md cursor-pointer border-2 border-slate-600" />
                                            <button onClick={handleColorChange} className="text-sm font-medium hover:text-indigo-400 transition-colors">צבע</button>
                                        </div>

                                        <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg">
                                            <input type="number" min="1" max="7" value={editorSize} onChange={(e) => setEditorSize(e.target.value)} className="w-10 bg-slate-700 text-center text-sm rounded-md p-1 outline-none" />
                                            <button onClick={handleSizeChange} className="text-sm font-medium hover:text-indigo-400 transition-colors">גודל</button>
                                            <button onClick={handleResetSize} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-white hover:bg-red-500/20 rounded transition-colors">✕</button>
                                        </div>

                                        <div className="w-px h-8 bg-slate-700 mx-2"></div>

                                        <button onClick={handleSubtitle} className="px-4 py-2 bg-gradient-to-r from-indigo-600/50 to-purple-600/50 hover:from-indigo-500 hover:to-purple-500 rounded-lg text-sm font-medium transition-all btn-lift">כותרת</button>
                                        <button onClick={handleSubtitleIn} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">תת-כותרת</button>

                                        <div className="w-px h-8 bg-slate-700 mx-2"></div>

                                        <button onClick={handleAddHyperlink} className="w-10 h-10 flex items-center justify-center bg-slate-800 hover:bg-cyan-600 rounded-lg text-xl transition-all btn-lift" title="הוסף קישור">🔗</button>
                                    </div>

                                    <textarea
                                        ref={contentRef}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="w-full p-5 bg-slate-900/50 border-2 border-slate-700/50 focus:border-indigo-500 rounded-xl min-h-[280px] text-base leading-relaxed resize-y outline-none transition-all input-glow placeholder:text-slate-600"
                                        placeholder="כתוב את תוכן הכתבה כאן... ניתן להשתמש בכפתורי העריכה למעלה לעיצוב הטקסט"
                                    />
                                </div>

                                {/* Links Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            תיאור קישור
                                        </label>
                                        <input type="text" value={relevantLinkDesc} onChange={(e) => setRelevantLinkDesc(e.target.value)} placeholder="לדוגמה: למעבר לכתבה" className="w-full p-3.5 bg-slate-900/50 border-2 border-slate-700/50 focus:border-indigo-500 rounded-xl outline-none input-glow placeholder:text-slate-600" />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            כתובת הקישור
                                        </label>
                                        <input type="text" value={relevantLink} onChange={(e) => setRelevantLink(e.target.value)} placeholder="https://..." className="w-full p-3.5 bg-slate-900/50 border-2 border-slate-700/50 focus:border-indigo-500 rounded-xl outline-none input-glow placeholder:text-slate-600" />
                                    </div>
                                </div>

                                {/* Source Input */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                        מקור הכתבה
                                    </label>
                                    <div className="relative">
                                        <input type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="https://source-example.com" className="w-full p-3.5 bg-slate-900/50 border-2 border-slate-700/50 focus:border-indigo-500 rounded-xl outline-none input-glow pl-14 placeholder:text-slate-600" />
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-50">🌐</div>
                                    </div>
                                </div>

                                {/* Forum Select */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                                        פורום רלוונטי
                                    </label>
                                    <div className="relative">
                                        <select value={forumName} onChange={(e) => setForumName(e.target.value)} className="w-full p-3.5 bg-slate-900/50 border-2 border-slate-700/50 focus:border-indigo-500 rounded-xl outline-none appearance-none cursor-pointer input-glow">
                                            <option value="">בחירת פורום</option>
                                            {forumCategories.map((category) => (
                                                <optgroup key={category.category} label={`── ${category.category} ──`}>
                                                    {category.forums.map((forum) => (
                                                        <option key={forum.id} value={`${forum.id}|${forum.name}`}>
                                                            {forum.name}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">▼</div>
                                    </div>
                                </div>
                            </div>

                            {/* Related Threads Section */}
                            <div className="mt-8 pt-8 border-t border-slate-700/50">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                                            <span className="text-lg">📌</span>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">אשכולות רלוונטיים</h3>
                                            <p className="text-xs text-slate-400">5 קישורים לאשכולות קשורים</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={handleSearchThreads} className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-all btn-lift glow-indigo">
                                        🔍 חפש אשכולות
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {threads.map((thread, idx) => (
                                        <div key={idx} className="flex gap-3 items-center group">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-400 font-bold text-sm group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:text-white transition-all">
                                                {idx + 1}
                                            </div>
                                            <input
                                                type="text"
                                                value={thread.title}
                                                onChange={e => handleThreadChange(idx, 'title', e.target.value)}
                                                placeholder="כותרת האשכול"
                                                className="flex-1 p-3 bg-slate-900/50 border-2 border-slate-700/50 focus:border-indigo-500 rounded-xl outline-none text-sm input-glow placeholder:text-slate-600"
                                            />
                                            <input
                                                type="text"
                                                value={thread.link}
                                                onChange={e => handleThreadChange(idx, 'link', e.target.value)}
                                                placeholder="https://..."
                                                className="flex-1 p-3 bg-slate-900/50 border-2 border-slate-700/50 focus:border-indigo-500 rounded-xl outline-none text-sm input-glow placeholder:text-slate-600"
                                                dir="ltr"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview and Output Section - Right Column */}
                    <div className="space-y-8 xl:sticky xl:top-8">
                        {/* Live Preview Card */}
                        <div className="glass-card rounded-2xl overflow-hidden glow-purple">
                            <div className="bg-gradient-to-r from-slate-800/90 to-slate-900/90 p-5 border-b border-slate-700/50 flex justify-between items-center backdrop-blur-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                                        <span className="text-lg">👁️</span>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">תצוגה מקדימה</h2>
                                        <p className="text-xs text-slate-400">עדכון בזמן אמת</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
                                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50"></div>
                                    <div className="w-3.5 h-3.5 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                                </div>
                            </div>
                            <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200" style={{ minHeight: '450px' }}>
                                <div className="text-black overflow-y-auto max-h-[550px] rounded-lg" style={{ direction: 'rtl' }} dangerouslySetInnerHTML={{ __html: previewContent }}></div>
                            </div>
                        </div>

                        {/* BBCode Output Card */}
                        <div className="glass-card rounded-2xl overflow-hidden glow-emerald">
                            <div className="bg-gradient-to-r from-slate-800/90 to-slate-900/90 p-5 border-b border-slate-700/50 backdrop-blur-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                        <span className="text-lg">📋</span>
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">קוד סופי</h2>
                                        <p className="text-xs text-slate-400">מוכן להעתקה ופרסום</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <textarea
                                    readOnly
                                    value={generatedBBcode}
                                    className="w-full p-4 bg-slate-950/80 border-2 border-slate-800 rounded-xl h-44 font-mono text-xs text-slate-400 focus:text-slate-200 focus:border-emerald-500 transition-all outline-none resize-none mb-5"
                                />
                                <button
                                    onClick={() => copyToClipboard(generatedBBcode)}
                                    className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-white font-black text-lg py-4 px-6 rounded-xl shadow-xl transition-all btn-lift glow-emerald"
                                >
                                    📋 העתק קוד לפרסום
                                </button>
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
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-lg">טוען...</p>
                </div>
            </div>
        }>
            <ArticleGeneratorComponent />
        </Suspense>
    );
}
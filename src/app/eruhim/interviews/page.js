"use client";
import { useState, useRef, useEffect } from 'react';
import depts from "public/dept-config.json";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- קומפוננטת עורך BBCode (ללא שינוי) ---
const BbCodeEditor = ({ content, setContent }) => {
    const contentRef = useRef(null);
    const [editorColor, setEditorColor] = useState('#000000');
    const [editorSize, setEditorSize] = useState(3);

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

    return (
        <div>
            <div className="flex flex-wrap items-center gap-2 mb-2 p-2 bg-gray-700 rounded">
                <button onClick={() => applyBbCode('B')} className="font-bold w-8 h-8 bg-gray-600 rounded">B</button>
                <button onClick={() => applyBbCode('U')} className="underline w-8 h-8 bg-gray-600 rounded">U</button>
                <button onClick={() => applyBbCode('I')} className="italic w-8 h-8 bg-gray-600 rounded">I</button>
                <span className="text-gray-500">|</span>
                <input type="color" value={editorColor} onChange={(e) => setEditorColor(e.target.value)} className="bg-gray-700 rounded w-10 h-8 cursor-pointer" />
                <button onClick={handleColorChange} className="bg-gray-600 px-3 py-1 rounded text-xs">שנה צבע</button>
                <span className="text-gray-500">|</span>
                <button onClick={handleResetSize} className="bg-gray-600 px-3 py-1 rounded text-xs">אפס גודל</button>
                <input type="number" min="1" max="7" value={editorSize} onChange={(e) => setEditorSize(e.target.value)} className="w-16 p-1 bg-gray-600 rounded text-center" />
                <button onClick={handleSizeChange} className="bg-gray-600 px-3 py-1 rounded text-xs">שנה גודל</button>
                <span className="text-gray-500">|</span>
                <button onClick={handleSubtitle} className="bg-gray-600 px-3 py-1 rounded text-xs">כותרת ראשית</button>
                <button onClick={handleSubtitleIn} className="bg-gray-600 px-3 py-1 rounded text-xs">כותרת פנימית</button>
                <button onClick={handleMediaDesc} className="bg-gray-600 px-3 py-1 rounded text-xs">תיאור מדיה</button>
                <span className="text-gray-500">|</span>
                <button onClick={handleAddHyperlink} className="bg-gray-600 px-3 py-1 rounded text-xs">היפר-קישור</button>
                <button onClick={handleRemoveHyperlink} className="bg-gray-600 px-3 py-1 rounded text-xs">אפס קישור</button>
            </div>
            <textarea ref={contentRef} value={content} onChange={(e) => setContent(e.target.value)} className="w-full p-2 bg-gray-700 rounded h-48" />
        </div>
    );
};


// --- קומפוננטה לפריט שניתן לגרירה ---
const SortableItem = ({ item, children }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
};

// --- קומפוננטה ראשית למחולל ---
export default function EruhimGenerator() {
    const [guestName, setGuestName] = useState('');
    const [guestTopic, setGuestTopic] = useState('');
    const [biography, setBiography] = useState('');
    const [blocks, setBlocks] = useState([{ id: 1, type: 'qna', question: '', answer: '' }]);
    const [generatedHtml, setGeneratedHtml] = useState('');
    const [generatedBBcode, setBBcode] = useState('');
    const [previewContent, setPreviewContent] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        const generateOutputs = async () => {
        const deptConfig = depts["eruhim"]?.interviews;
            if (!deptConfig) return;

            // --- Generate Content Blocks ---
            let qnaHtmlBlock = '';
            let qnaBbcodeBlock = '';
            let questionCounter = 0;

            // --- THIS IS THE RESTORED/FIXED LOGIC FOR HTML Q&A ---
            if (deptConfig.qatemplate) {
                try {
                    const qaTemplateResponse = await fetch(deptConfig.qatemplate);
                    if (!qaTemplateResponse.ok) throw new Error('קובץ תבנית QA ל-HTML לא נמצא');
                    const qaTemplateText = await qaTemplateResponse.text();
                    
                    qnaHtmlBlock = blocks.map(block => {
                        if (block.type === 'qna') {
                            questionCounter++;
                            return qaTemplateText
                                .replace(/%Question%/g, `שאלה ${questionCounter}: ${block.question}`)
                                .replace(/%Answer%/g, block.answer.replace(/\n/g, '<br />'));
                        }
                        if (block.type === 'image') {
                            return `<img src="${block.url}" style="max-width: 100%; margin: 15px auto; display: block;" />`;
                        }
                        return '';
                    }).join('');
                } catch (e) {
                    qnaHtmlBlock = `<p style="color:red;">שגיאה: ${e.message}</p>`;
                }
            }
            
            // --- THIS IS THE RESTORED/FIXED LOGIC FOR BBCODE Q&A ---
            questionCounter = 0;
            if (deptConfig.qabbcodeTemp) {
                 try {
                    const qaBbcodeTemplateResponse = await fetch(deptConfig.qaBbcodeTemplate);
                    if (!qaBbcodeTemplateResponse.ok) throw new Error('קובץ תבנית QA ל-BBCODE לא נמצא');
                    const qaBbcodeTemplateText = await qaBbcodeTemplateResponse.text();

                    qnaBbcodeBlock = blocks.map(block => {
                        if (block.type === 'qna') {
                            questionCounter++;
                            return qaBbcodeTemplateText
                                .replace(/%Question%/g, `שאלה ${questionCounter}: ${block.question}`)
                                .replace(/%Answer%/g, block.answer);
                        }
                        if (block.type === 'image') {
                            return `[IMG]${block.url}[/IMG]`;
                        }
                        return '';
                    }).join('\n\n');
                } catch (e) {
                    qnaBbcodeBlock = `שגיאה: ${e.message}`;
                }
            }

            // --- Generate Final HTML ---
            if (deptConfig.templateFile) {
                try {
                    const htmlResponse = await fetch(deptConfig.templateFile);
                    if (!htmlResponse.ok) throw new Error(`לא נמצא קובץ תבנית HTML`);
                    let htmlTemplate = await htmlResponse.text();
                    htmlTemplate = htmlTemplate.replace(/{שם המתארח}/g, guestName).replace(/{עיסוק\/תחום עניין}/g, guestTopic).replace(/{ביוגרפיה}/g, biography.replace(/\n/g, '<br />')).replace(/{QNA_BLOCK}/g, qnaHtmlBlock);
                    setGeneratedHtml(htmlTemplate);
                    setPreviewContent(htmlTemplate);
                } catch (error) {
                    setGeneratedHtml(`שגיאה ביצירת HTML: ${error.message}`);
                    setPreviewContent(`<p style="color:red;">${error.message}</p>`);
                }
            } else { setGeneratedHtml('לא הוגדרה תבנית HTML בקונפיג'); setPreviewContent('<p>לא הוגדרה תבנית HTML בקונפיג</p>'); }

            // --- Generate Final BBCode ---
            if (deptConfig.bbcodeTemplateFile) {
                try {
                    const bbcodeResponse = await fetch(deptConfig.bbcodeTemplateFile);
                    if (!bbcodeResponse.ok) throw new Error(`לא נמצא קובץ תבנית BBCODE`);
                    let bbcodeTemplate = await bbcodeResponse.text();
                    bbcodeTemplate = bbcodeTemplate.replace(/{שם המתארח}/g, guestName).replace(/{עיסוק\/תחום עניין}/g, guestTopic).replace(/{ביוגרפיה}/g, biography).replace(/{QNA_BLOCK}/g, qnaBbcodeBlock);
                    setBBcode(bbcodeTemplate);
                } catch (error) {
                    setBBcode(`שגיאה ביצירת BBCODE: ${error.message}`);
                }
            } else { setBBcode('לא הוגדרה תבנית BBCODE בקונפיג'); }
        };

        generateOutputs();
    }, [guestName, guestTopic, biography, blocks]);
    
    const handleBlockChange = (id, field, value) => {
        setBlocks(blocks.map(block => block.id === id ? { ...block, [field]: value } : block));
    };
    const addBlock = (type) => {
        const newId = blocks.length > 0 ? Math.max(...blocks.map(b => b.id)) + 1 : 1;
        if (type === 'qna') setBlocks([...blocks, { id: newId, type: 'qna', question: '', answer: '' }]);
        if (type === 'image') setBlocks([...blocks, { id: newId, type: 'image', url: '' }]);
    };
    const removeBlock = (id) => {
        setBlocks(blocks.filter(block => block.id !== id));
    };
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (event.activatorEvent.target.tagName === "TEXTAREA" || event.activatorEvent.target.tagName === "INPUT" || event.activatorEvent.target.tagName === "BUTTON") {
            return;
        }
        if (active.id !== over.id) {
            setBlocks((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text.trim()).then(() => alert('הקוד הועתק!'));
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-8 bg-gray-900 text-white">
            <div className="z-10 w-full max-w-7xl items-center justify-between font-mono text-sm lg:flex flex-col">
                <h1 className="text-4xl font-bold mb-8">מחולל אירוחים</h1>
                <div className="mb-6">
                </div>
                <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
                        <h2 className="text-2xl font-semibold mb-4">פרטי האירוח</h2>
                        <div><label className="block mb-2">שם המתארח</label><input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full p-2 bg-gray-700 rounded" /></div>
                        <div><label className="block mb-2">תחום האירוח</label><input type="text" value={guestTopic} onChange={(e) => setGuestTopic(e.target.value)} className="w-full p-2 bg-gray-700 rounded" /></div>
                        <div><label className="block mb-2">ביוגרפיה</label><BbCodeEditor content={biography} setContent={setBiography} /></div>
                        <hr className="border-gray-600 my-4" />
                        <h3 className="text-xl font-semibold">תוכן הריאיון</h3>
                        {isClient && (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={blocks} strategy={verticalListSortingStrategy}>
                                    {blocks.map((block, index) => {
                                        const questionNumber = blocks.slice(0, index + 1).filter(b => b.type === 'qna').length;
                                        return (
                                            <SortableItem key={block.id} item={block}>
                                                <div className="bg-gray-700 p-4 rounded-lg space-y-2 relative mb-4 cursor-grab">
                                                    <button onClick={() => removeBlock(block.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-400 font-bold p-1 leading-none">&#x2715;</button>
                                                    {block.type === 'qna' && (
                                                        <>
                                                            <label className="block text-sm font-bold">שאלה {questionNumber}</label>
                                                            <textarea value={block.question} onChange={(e) => handleBlockChange(block.id, 'question', e.target.value)} placeholder="כתוב כאן את השאלה" className="w-full p-2 bg-gray-600 rounded h-20" />
                                                            <label className="block text-sm">תשובה</label>
                                                            <textarea value={block.answer} onChange={(e) => handleBlockChange(block.id, 'answer', e.target.value)} placeholder="כתוב כאן את התשובה" className="w-full p-2 bg-gray-600 rounded h-24" />
                                                        </>
                                                    )}
                                                    {block.type === 'image' && (
                                                        <>
                                                            <label className="block text-sm font-bold">תמונה</label>
                                                            <input type="text" value={block.url} onChange={(e) => handleBlockChange(block.id, 'url', e.target.value)} placeholder="הדבק קישור לתמונה" className="w-full p-2 bg-gray-600 rounded" />
                                                        </>
                                                    )}
                                                </div>
                                            </SortableItem>
                                        );
                                    })}
                                </SortableContext>
                            </DndContext>
                        )}
                        <div className="flex gap-4">
                            <button onClick={() => addBlock('qna')} className="w-full bg-blue-600 px-4 py-2 rounded">הוסף שאלה</button>
                            <button onClick={() => addBlock('image')} className="w-full bg-teal-600 px-4 py-2 rounded">הוסף תמונה</button>
                        </div>
                    </div>
                    {/* Preview and Output Section */}
                    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
                        <div><h2 className="text-2xl font-semibold mb-2">תצוגה מקדימה (HTML)</h2><div className="w-full bg-white text-black p-4 rounded-lg h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: previewContent }}></div></div>
                        <div><h2 className="text-2xl font-semibold mb-2">Generated BBCODE</h2>
                          <textarea readOnly value={generatedBBcode} className="w-full p-2 bg-gray-700 rounded h-32 mb-2" />
                          <div className="flex gap-4">
                            <button onClick={() => copyToClipboard(generatedBBcode)} className="w-full bg-purple-600 px-4 py-2 rounded">העתק קוד BBCODE</button>
                            <button
                              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold px-4 py-2 rounded"
                              onClick={() => window.open('https://www.fxp.co.il/forumdisplay.php?f=10577', '_blank')}
                            >
                              פתח חדר עבודה
                            </button>
                          </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
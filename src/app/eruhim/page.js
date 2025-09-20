"use client";
import { useState, useRef, useEffect } from 'react';
import depts from "public/dept-config.json";

// --- קומפוננטת עורך BBCode לשימוש חוזר ---
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


export default function EruhimGenerator() {
    const [guestName, setGuestName] = useState('');
    const [guestTopic, setGuestTopic] = useState('');
    const [biography, setBiography] = useState('');
    const [qnaList, setQnaList] = useState([{ id: 1, question: '', answer: '' }]);
    const [generatedHtml, setGeneratedHtml] = useState('');
    const [generatedBBcode, setBBcode] = useState('');
    const [previewContent, setPreviewContent] = useState('');

    useEffect(() => {
        const generateOutputs = async () => {
            const deptConfig = depts["eruhim"];
            if (!deptConfig) return;

            // --- THIS IS THE MODIFIED PART ---
            const qnaHtmlBlock = qnaList.map(async item => {
                const qatemp = await fetch(deptConfig.qatemplate);
                if (!qatemp.ok) throw new Error(`לא נמצא קובץ תבנית HTML`);

                let qaHtmlTemp = await qatemp.text();

                qaHtmlTemp.replace("%Question%", item.question);
                qaHtmlTemp.replace("%Answer%", item.answer);
            }).join('');

            const qnaBbcodeBlock = qnaList.map(item =>
                `[TABLE="width: 900, align: center"]
[TR="bgcolor: #999900"]
[TD="align: center"][B][COLOR=white]${item.question}[/COLOR][/B][/TD]
[/TR]
[TR]
[TD="align: right"]${item.answer}[/TD]
[/TR]
[/TABLE]`
            ).join('\n\n');
            // --- END OF MODIFIED PART ---

            try {
                const response = await fetch(deptConfig.templateFile);
                if (!response.ok) throw new Error(`לא נמצא קובץ תבנית HTML`);

                let htmlTemplate = await response.text();
                htmlTemplate = htmlTemplate.replace(/{שם המתארח}/g, guestName);
                htmlTemplate = htmlTemplate.replace(/{עיסוק\/תחום עניין}/g, guestTopic);
                htmlTemplate = htmlTemplate.replace(/{ביוגרפיה}/g, biography.replace(/\n/g, '<br />'));
                htmlTemplate = htmlTemplate.replace(/{QNA_BLOCK}/g, qnaHtmlBlock);

                setGeneratedHtml(htmlTemplate);
                setPreviewContent(htmlTemplate);
            } catch (error) {
                setPreviewContent(`<p style="color:red;">${error.message}</p>`);
            }

            try {
                const response = await fetch(deptConfig.bbcodeTemplateFile);
                if (!response.ok) throw new Error(`לא נמצא קובץ תבנית BBCODE`);

                let bbcodeTemplate = await response.text();
                bbcodeTemplate = bbcodeTemplate.replace(/{שם המתארח}/g, guestName);
                bbcodeTemplate = bbcodeTemplate.replace(/{עיסוק\/תחום עניין}/g, guestTopic);
                bbcodeTemplate = bbcodeTemplate.replace(/{ביוגרפיה}/g, biography);
                bbcodeTemplate = bbcodeTemplate.replace(/{QNA_BLOCK}/g, qnaBbcodeBlock);

                setBBcode(bbcodeTemplate);
            } catch (error) {
                setBBcode(error.message);
            }
        };

        generateOutputs();
    }, [guestName, guestTopic, biography, qnaList]);

    const handleQnaChange = (id, field, value) => {
        setQnaList(qnaList.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    const addQuestion = () => {
        const newId = qnaList.length > 0 ? Math.max(...qnaList.map(i => i.id)) + 1 : 1;
        setQnaList([...qnaList, { id: newId, question: '', answer: '' }]);
    };
    const removeQuestion = (id) => {
        setQnaList(qnaList.filter(item => item.id !== id));
    };
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text.trim()).then(() => alert('הקוד הועתק!'));
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-8 bg-gray-900 text-white">
            <div className="z-10 w-full max-w-7xl items-center justify-between font-mono text-sm lg:flex flex-col">
                <h1 className="text-4xl font-bold mb-8">מחולל אירוחים</h1>
                <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
                        <h2 className="text-2xl font-semibold mb-4">פרטי האירוח</h2>
                        <div><label className="block mb-2">שם המתארח</label><input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full p-2 bg-gray-700 rounded" /></div>
                        <div><label className="block mb-2">תחום האירוח</label><input type="text" value={guestTopic} onChange={(e) => setGuestTopic(e.target.value)} className="w-full p-2 bg-gray-700 rounded" /></div>
                        <div><label className="block mb-2">ביוגרפיה</label><BbCodeEditor content={biography} setContent={setBiography} /></div>
                        <hr className="border-gray-600 my-4" />
                        <h3 className="text-xl font-semibold">שאלות ותשובות</h3>
                        {qnaList.map((item, index) => (
                            <div key={item.id} className="bg-gray-700 p-4 rounded-lg space-y-2 relative">
                                <label className="block text-sm">שאלה {index + 1}</label>
                                <textarea value={item.question} onChange={(e) => handleQnaChange(item.id, 'question', e.target.value)} className="w-full p-2 bg-gray-600 rounded h-20" />
                                <label className="block text-sm">תשובה {index + 1}</label>
                                <textarea value={item.answer} onChange={(e) => handleQnaChange(item.id, 'answer', e.target.value)} className="w-full p-2 bg-gray-600 rounded h-24" />
                                {qnaList.length > 1 && (<button onClick={() => removeQuestion(item.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-400 font-bold p-1 leading-none">&#x2715;</button>)}
                            </div>
                        ))}
                        <button onClick={addQuestion} className="w-full bg-blue-600 px-4 py-2 rounded">הוסף שאלה ותשובה</button>
                    </div>
                    {/* Preview and Output Section */}
                    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
                        <div>
                            <h2 className="text-2xl font-semibold mb-2">תצוגה מקדימה (HTML)</h2>
                            <div className="w-full bg-white text-black p-4 rounded-lg h-80 overflow-y-auto" dangerouslySetInnerHTML={{ __html: previewContent }}></div>
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
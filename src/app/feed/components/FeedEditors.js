"use client";
import { useState, useRef, useEffect } from "react";

// Shared Component: Editor Toolbar
function EditorToolbar({ onFormat, onColor, onSize, onResetSize, onLink, onHeading, onSubHeading }) {
    return (
        <div className="flex flex-wrap items-center gap-1.5 mb-2 p-2 bg-slate-900/80 rounded-lg border border-slate-700/50 scale-90 origin-right w-full justify-start">
            <div className="flex gap-1">
                <button onClick={() => onFormat('B')} className="w-8 h-8 flex items-center justify-center font-black text-sm bg-slate-800 hover:bg-indigo-600 rounded-md transition-all btn-lift" title="מודגש">B</button>
                <button onClick={() => onFormat('U')} className="w-8 h-8 flex items-center justify-center underline text-sm bg-slate-800 hover:bg-indigo-600 rounded-md transition-all btn-lift" title="קו תחתון">U</button>
                <button onClick={() => onFormat('I')} className="w-7 h-8 flex items-center justify-center italic text-sm bg-slate-800 hover:bg-indigo-600 rounded-md transition-all btn-lift" title="נטוי">I</button>
            </div>

            <div className="w-px h-6 bg-slate-700 mx-1"></div>

            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-md">
                <input type="color" onChange={(e) => onColor(e.target.value)} className="w-5 h-5 rounded cursor-pointer border border-slate-600" title="צבע טקסט" />
            </div>

            <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-md">
                <input type="number" min="1" max="7" defaultValue="3" onChange={(e) => onSize(e.target.value)} className="w-8 bg-slate-700 text-center text-xs rounded p-1 outline-none" title="גודל טקסט" />
                <button onClick={onResetSize} className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-white hover:bg-red-500/20 rounded-full transition-colors text-xs">✕</button>
            </div>

            <div className="w-px h-6 bg-slate-700 mx-1"></div>

            {(onHeading || onSubHeading) && (
                <>
                    {onHeading && <button onClick={onHeading} className="px-3 py-1 bg-gradient-to-r from-indigo-600/50 to-purple-600/50 hover:from-indigo-500 hover:to-purple-500 rounded-md text-xs font-medium transition-all btn-lift">כותרת</button>}
                    {onSubHeading && <button onClick={onSubHeading} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-md text-xs font-medium transition-colors">תת-כותרת</button>}
                    <div className="w-px h-6 bg-slate-700 mx-1"></div>
                </>
            )}

            <button onClick={onLink} className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-cyan-600 rounded-md text-base transition-all btn-lift" title="הוסף קישור">🔗</button>
        </div>
    );
}

/**
 * Classic Editor - The original BBCode Textarea
 */
export function ClassicEditor({ content, setContent, applyBbCode, handleSubtitle, handleSubtitleIn, handleAddHyperlink, contentRef, onBlur }) {
    return (
        <div className="group">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                תוכן הכתבה (קלאסי)
            </label>

            {/* Premium Toolbar using Shared Component */}
            <EditorToolbar
                onFormat={(tag) => applyBbCode(tag)}
                onColor={(val) => applyBbCode('COLOR', val)}
                onSize={(val) => applyBbCode('SIZE', val)}
                onResetSize={() => applyBbCode('RESET_SIZE')}
                onLink={handleAddHyperlink}
                onHeading={handleSubtitle}
                onSubHeading={handleSubtitleIn}
            />

            <textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-5 bg-slate-900/50 border-2 border-slate-700/50 focus:border-indigo-500 rounded-xl min-h-[280px] text-base leading-relaxed resize-y outline-none transition-all input-glow placeholder:text-slate-600"
                placeholder="כתוב את תוכן הכתבה כאן... ניתן להשתמש בכפתורי העריכה למעלה לעיצוב הטקסט"
                onBlur={onBlur}
            />
        </div>
    );
}

/**
 * Modern Editor - Structured paragraphs with subtitles
 */
export function ModernEditor({ content, setContent, deptColor = '3366cc', onBlur }) {
    const [paragraphs, setParagraphs] = useState([
        { id: 'initial', subtitle: '', text: '' }
    ]);
    const [category, setCategory] = useState('general');

    // Refs for textareas to handle BBCode insertion
    const textareaRefs = useRef({});

    const categoryColors = {
        gaming: '#daa520',
        technology: '#008b8b',
        cinema: '#4b0082',
        general: `#${deptColor.replace('#', '')}`
    };

    // Update parent content whenever paragraphs or category change
    useEffect(() => {
        const color = categoryColors[category];
        const builtContent = paragraphs.map(p => {
            let block = '';
            if (p.subtitle.trim()) {
                block += `[COLOR="${color}"][B][U]${p.subtitle.trim()}[/U][/B][/COLOR]\n`;
            }
            block += p.text;
            return block;
        }).join('\n\n');

        if (builtContent !== content) {
            setContent(builtContent);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paragraphs, category, content, setContent, deptColor]);

    const addParagraph = () => {
        setParagraphs([...paragraphs, { id: Date.now(), subtitle: '', text: '' }]);
    };

    const updateParagraph = (id, field, value) => {
        setParagraphs(prev => prev.map(p => {
            if (p.id === id) {
                if (field === 'text' && value.length > 400) return p;
                return { ...p, [field]: value };
            }
            return p;
        }));
    };

    const removeParagraph = (id) => {
        if (paragraphs.length === 1) return;
        setParagraphs(prev => prev.filter(p => p.id !== id));
        // Cleanup ref
        delete textareaRefs.current[id];
    };

    // --- BBCode Logic for Modern Paragraphs ---
    const applyBbCode = (id, tag, value = null) => {
        const textarea = textareaRefs.current[id];
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value;
        const selectedText = currentText.substring(start, end);

        let newBlock;
        switch (tag) {
            case 'B': case 'U': case 'I': newBlock = `[${tag}]${selectedText}[/${tag}]`; break;
            case 'COLOR': newBlock = `[COLOR="${value}"]${selectedText}[/COLOR]`; break;
            case 'SIZE': newBlock = `[SIZE=${value}]${selectedText}[/SIZE]`; break;
            case 'URL': newBlock = `[URL="${value}"]${selectedText}[/URL]`; break;
            case 'RESET_SIZE':
                // Remove SIZE tags from selection
                const regex = /\[SIZE=.*?\](.*?)\[\/SIZE\]/gi;
                newBlock = selectedText.replace(regex, '$1');
                break;
            default: newBlock = selectedText;
        }

        const newText = `${currentText.substring(0, start)}${newBlock}${currentText.substring(end)}`;

        // Enforce limit logic if needed, but for formatting we generally allow it temporarily or handle it in updateParagraph
        // Check length:
        if (newText.length <= 400) {
            updateParagraph(id, 'text', newText);

            // Restore focus and selection
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start, start + newBlock.length);
            }, 0);
        } else {
            alert('הוספת העיצוב חורגת ממגבלת התווים!');
        }
    };

    const handleAddHyperlink = (id) => {
        const url = prompt("הכנס קישור:");
        if (url) applyBbCode(id, 'URL', url);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                    תוכן הכתבה (מודרני)
                </div>

                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg text-sm text-white p-2 outline-none focus:border-indigo-500 transition-all"
                >
                    <option value="general">כללי</option>
                    <option value="gaming">גיימינג (זהב)</option>
                    <option value="technology">טכנולוגיה (טורקיז)</option>
                    <option value="cinema">קולנוע (אינדיגו)</option>
                </select>
            </div>

            <div className="space-y-4">
                {paragraphs.map((p) => (
                    <div key={p.id} className="bg-slate-900/40 p-4 rounded-xl border border-slate-700/50 relative group transition-all hover:bg-slate-900/60">
                        {paragraphs.length > 1 && (
                            <button
                                onClick={() => removeParagraph(p.id)}
                                className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
                                title="מחק פסקה"
                            >
                                ✕
                            </button>
                        )}

                        <div className="mb-3">
                            <input
                                type="text"
                                value={p.subtitle}
                                onChange={(e) => updateParagraph(p.id, 'subtitle', e.target.value)}
                                onBlur={onBlur}
                                placeholder="תת כותרת (אופציונלי)"
                                className="w-full bg-transparent border-b border-indigo-500/30 focus:border-indigo-500 px-1 py-1 text-sm font-semibold placeholder:text-slate-600 outline-none transition-colors"
                                style={{ color: categoryColors[category] }}
                            />
                        </div>

                        <div className="relative">
                            {/* Toolbar for this paragraph */}
                            <EditorToolbar
                                onFormat={(tag) => applyBbCode(p.id, tag)}
                                onColor={(val) => applyBbCode(p.id, 'COLOR', val)}
                                onSize={(val) => applyBbCode(p.id, 'SIZE', val)}
                                onResetSize={() => applyBbCode(p.id, 'RESET_SIZE')}
                                onLink={() => handleAddHyperlink(p.id)}
                            />

                            <textarea
                                ref={el => textareaRefs.current[p.id] = el}
                                value={p.text}
                                onChange={(e) => updateParagraph(p.id, 'text', e.target.value)}
                                onBlur={onBlur}
                                placeholder="תוכן הפסקה..."
                                className="w-full bg-slate-950/30 rounded-lg p-3 text-sm text-slate-200 min-h-[100px] border border-transparent focus:border-slate-600 outline-none resize-y"
                            />
                            <div className={`absolute bottom-2 left-2 text-xs font-mono font-medium ${p.text.length >= 400 ? 'text-red-500' : 'text-slate-500'}`}>
                                {p.text.length}/400
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={addParagraph}
                className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/50 text-slate-400 hover:text-indigo-300 rounded-xl transition-all flex items-center justify-center gap-2 font-semibold"
            >
                <span className="text-xl">+</span> הוסף פסקה חדשה
            </button>
        </div>
    );
}

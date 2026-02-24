"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import BackButtons from '../components/BackButtons';

const OVERLAYS = [
    { label: 'דיבורים', value: '/feed/discussion.png' },
    { label: 'גיימינג', value: '/feed/gaming.png' },
    { label: 'חדשות', value: '/feed/news.png' },
    { label: 'פוליטיקה', value: '/feed/politics.png' },
    { label: 'ספורט', value: '/feed/sports.png' },
    { label: 'טכנולוגיה', value: '/feed/technology.png' }
];

const SITES = [
    { name: 'Unsplash', icon: 'https://unsplash.com/favicon.ico', searchUrl: (q) => `https://unsplash.com/s/photos/${encodeURIComponent(q)}` },
    { name: 'Pexels', icon: 'https://www.pexels.com/favicon.ico', searchUrl: (q) => `https://www.pexels.com/search/${encodeURIComponent(q)}/` },
    { name: 'Pixabay', icon: 'https://pixabay.com/favicon.ico', searchUrl: (q) => `https://pixabay.com/images/search/${encodeURIComponent(q)}/` },
    { name: 'Openverse', icon: 'https://openverse.org/favicon.ico', searchUrl: (q) => `https://openverse.org/search/image?q=${encodeURIComponent(q)}` },
    { name: 'Flickr', icon: 'https://www.flickr.com/favicon.ico', searchUrl: (q) => `https://www.flickr.com/search/?text=${encodeURIComponent(q)}` },
    { name: 'Wikimedia', icon: 'https://commons.wikimedia.org/favicon.ico', searchUrl: (q) => `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(q)}&title=Special:MediaSearch&go=Go&type=image` },
    { name: 'WordPress Photos', icon: 'https://wordpress.org/favicon.ico', searchUrl: (q) => `https://wordpress.org/photos/?s=${encodeURIComponent(q)}` }
];

const CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 144;

export default function GeneratorPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showSites, setShowSites] = useState(false);
    const [selectedOverlay, setSelectedOverlay] = useState(OVERLAYS[0].value);
    const [hasImage, setHasImage] = useState(false);

    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const overlayImageRef = useRef(null);

    // Initialize the canvas and pre-load the default overlay
    useEffect(() => {
        preloadOverlay(selectedOverlay);

        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let item of items) {
                if (item.type.startsWith('image')) {
                    const blob = item.getAsFile();
                    const reader = new FileReader();
                    reader.onload = (event) => processImageSource(event.target.result);
                    reader.readAsDataURL(blob);
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);

    // Update canvas when overlay changes
    useEffect(() => {
        preloadOverlay(selectedOverlay);
    }, [selectedOverlay]);

    const preloadOverlay = (path) => {
        const img = new window.Image();
        img.onload = () => {
            overlayImageRef.current = img;
            if (hasImage) {
                drawCanvas();
            }
        };
        img.src = path;
    };

    const processImageSource = (src) => {
        const img = new window.Image();
        img.onload = () => {
            imageRef.current = img;
            setHasImage(true);
            drawCanvas();
        };
        img.src = src;
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => processImageSource(event.target.result);
            reader.readAsDataURL(file);
        }
    };

    const drawCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas || !imageRef.current) return;
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw the user image, stretching/cropping to fill 256x144 exactly.
        // For simplicity, we draw the full image squeezed into the bounds to ensure it occupies the whole canvas
        ctx.drawImage(imageRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw overlay if exists
        if (overlayImageRef.current) {
            const overlay = overlayImageRef.current;
            const aspectRatio = overlay.width / overlay.height;
            const overlayHeight = CANVAS_WIDTH / aspectRatio;
            const yOffset = CANVAS_HEIGHT - overlayHeight;
            ctx.drawImage(overlay, 0, yOffset, CANVAS_WIDTH, overlayHeight);
        }
    };

    const handleSearchSite = (site) => {
        if (!searchQuery.trim()) {
            alert("אנא הזן מילות חיפוש קודם!");
            return;
        }
        window.open(site.searchUrl(searchQuery.trim()), '_blank');
    };

    const handleDownload = () => {
        if (!hasImage) {
            alert("אנא העלה או הדבק תמונה קודם!");
            return;
        }
        const canvas = canvasRef.current;
        if (canvas) {
            const link = document.createElement("a");
            link.download = "processed_image.jpg";
            link.href = canvas.toDataURL("image/jpeg");
            link.click();
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-transparent text-white font-sans" dir="rtl">
            <main className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col gap-8">
                <BackButtons backTo="/" />

                <div className="bg-gray-800 rounded-lg shadow-xl p-6 md:p-8">
                    <h1 className="text-4xl font-bold text-center mb-6 text-white border-b border-gray-700 pb-4">מחולל תמונות</h1>

                    <div className="space-y-4 text-center text-gray-300 text-lg mb-8 bg-gray-900 p-4 rounded-md">
                        <p>בחרו תמונה ממאגר המקורות המותרים לשימוש.</p>
                        <p>העלו תמונה מהמחשב שלכם, הדביקו תמונה (Ctrl+V), או חפשו תמונה חופשית במנועי החיפוש.</p>
                        <p>בצעו שינויים כמו הוספת שכבה ושמרו את התמונה (מגודל אוטומטית ל-256x144).</p>
                    </div>

                    <div className="space-y-8">
                        {/* Search Section */}
                        <div className="bg-gray-700 p-6 rounded-lg text-center flex flex-col items-center">
                            <label className="block text-xl font-semibold mb-4">חיפוש תמונות חופשיות:</label>
                            <div className="flex w-full max-w-md gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="הזן מילת חיפוש (באנגלית מומלץ)..."
                                    className="flex-1 p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    onClick={() => setShowSites(!showSites)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
                                >
                                    {showSites ? 'הסתר אתרים' : 'הצג אתרים'}
                                </button>
                            </div>

                            {showSites && (
                                <div className="mt-6 pt-4 border-t border-gray-600 w-full animate-fade-in">
                                    <p className="font-semibold mb-4 text-gray-300">לחץ על אתר כדי לחפש את המילה אוטומטית:</p>
                                    <div className="flex flex-wrap justify-center gap-4">
                                        {SITES.map(site => (
                                            <button
                                                key={site.name}
                                                onClick={() => handleSearchSite(site)}
                                                className="bg-gray-800 hover:bg-gray-600 border border-gray-600 p-2 rounded-lg transition transform hover:scale-105 flex flex-col items-center gap-2"
                                                title={`חפש ב-${site.name}`}
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={site.icon} alt={site.name} className="w-8 h-8 rounded" />
                                                <span className="text-xs text-gray-400">{site.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Upload and Overlay settings */}
                            <div className="space-y-6 flex flex-col">
                                <div className="bg-gray-700 p-6 rounded-lg">
                                    <label className="block text-lg font-semibold mb-3">בחירת שכבה (Overlay):</label>
                                    <select
                                        value={selectedOverlay}
                                        onChange={(e) => setSelectedOverlay(e.target.value)}
                                        className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                                    >
                                        {OVERLAYS.map(ov => (
                                            <option key={ov.value} value={ov.value}>{ov.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="bg-gray-700 p-6 rounded-lg flex-1">
                                    <label className="block text-lg font-semibold mb-3">העלאת תמונה ידנית:</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                    />
                                    <p className="mt-4 text-sm text-gray-400">
                                        * ניתן גם פשוט ללחוץ <kbd className="bg-gray-800 px-2 py-1 rounded">Ctrl</kbd> + <kbd className="bg-gray-800 px-2 py-1 rounded">V</kbd> בכל מקום בעמוד אם העתקתם תמונה.
                                    </p>
                                </div>
                            </div>

                            {/* Right Column: Canvas Preview Output */}
                            <div className="bg-gray-700 p-6 rounded-lg flex flex-col items-center justify-center">
                                <h2 className="text-xl font-bold mb-4">תצוגה מקדימה (256x144)</h2>

                                <div className={`border-2 ${hasImage ? 'border-green-500 rounded-lg' : 'border-dashed border-gray-500'} p-2 relative bg-black flex items-center justify-center`} style={{ width: CANVAS_WIDTH + 4, height: CANVAS_HEIGHT + 4 }}>
                                    {!hasImage && <span className="text-gray-500 absolute select-none">הדבק או העלה תמונה</span>}
                                    <canvas
                                        ref={canvasRef}
                                        width={CANVAS_WIDTH}
                                        height={CANVAS_HEIGHT}
                                        className={hasImage ? "block" : "hidden"}
                                    />
                                </div>

                                <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                                    <button
                                        onClick={handleDownload}
                                        className={`font-bold py-3 px-4 rounded-lg transition ${hasImage ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        הורד תמונה
                                    </button>
                                    {/* Using same download handler for both, to fulfill Save/Download buttons from original layout */}
                                    <button
                                        onClick={handleDownload}
                                        className={`font-bold py-3 px-4 rounded-lg transition ${hasImage ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        שמור תמונה
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

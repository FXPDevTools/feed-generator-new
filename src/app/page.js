"use client"

import { useState } from 'react';
import Head from 'next/head';

// --- Helper Components ---
const Spinner = () => <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>;

const Notification = ({ notification }) => (
    <div
        className={`fixed top-5 right-5 z-50 p-4 rounded-lg shadow-lg text-white max-w-sm transition-transform duration-300 ${notification.show ? 'translate-x-0' : 'translate-x-full'
            } ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
    >
        <p>{notification.message}</p>
    </div>
);

// --- Main Application Component ---
export default function Home() {
    // --- State Management ---
    const [currentDomain, setCurrentDomain] = useState(null);

    // Article Generator
    const [articleForm, setArticleForm] = useState({ title: '', subtitle: '', content: '', imageUrl: '', credit: '' });
    const [articleOutput, setArticleOutput] = useState('');
    const [isInterfaceModalOpen, setIsInterfaceModalOpen] = useState(false);
    const [interfacePic, setInterfacePic] = useState({ type: 'post', username: 'ModerniMan', userTitle: 'FxP Dev', avatar: 'https://static.fcdn.co.il/images_new/_Fxp_logo_2020.png', content: 'זוהי תגובת דוגמה...', quoteUser: '', quoteContent: '', likes: 3 });

    // Hosting Generator
    const [hostingView, setHostingView] = useState('menu');
    const [guestSuggestionTool, setGuestSuggestionTool] = useState({ topic: '', isLoading: false, suggestions: [], error: '' });
    const [proposalForm, setProposalForm] = useState({ guestName: '', occupation: '', info: '', website: '', personalOpinion: '', communityInterest: '', contactInfo: '', notes: '' });
    const [creatorForm, setCreatorForm] = useState({ guestName: '', occupation: '', biography: '', imageUrl: '', credit: '', contentBlocks: [] });

    // Shared States
    const [apiState, setApiState] = useState({ isLoading: false, error: '' });
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    // --- Helper Functions ---
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
    };

    const copyToClipboard = (text) => {
        if (text) {
            navigator.clipboard.writeText(text).then(() => showNotification('הקוד הועתק בהצלחה!', 'success'));
        }
    };
    
    // --- BBCode Generators ---
    const generateArticleBBCode = () => {
        const { title, subtitle, content, imageUrl, credit } = articleForm;
        let code = `[CENTER]`;
        if (imageUrl) code += `[IMG]${imageUrl}[/IMG]\n\n`;
        if (title) code += `[SIZE=6][B]${title}[/B][/SIZE]\n`;
        if (subtitle) code += `[SIZE=4]${subtitle}[/SIZE]\n\n`;
        if (content) code += `[SIZE=3]${content}[/SIZE]\n\n`;
        if (credit) code += `[B]בברכה,\nצוות ${credit}.[/B]`;
        code += `[/CENTER]`;
        setArticleOutput(code);
    };
    
    // ... Other BBCode generators for hosting can be added here ...

    return (
        <>
            <Head>
                <title>מחולל התוכן המאוחד - FXP</title>
                <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap" rel="stylesheet" />
            </Head>

            <main className="bg-gray-900 text-gray-200 font-['Assistant'] min-h-screen">
                <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
                    <header className="text-center mb-8">
                        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300 mb-2">מחולל התוכן המאוחד</h1>
                        <p className="text-lg text-gray-400">הכלי המרכזי ליצירת כתבות ואירוחים בקהילה</p>
                    </header>

                    <Notification notification={notification} />

                    {!currentDomain && (
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-3xl font-bold text-center mb-4">בחר תחום עבודה</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                                <button onClick={() => setCurrentDomain('articles')} className="bg-gray-800/50 p-8 rounded-xl shadow-lg border border-gray-700 text-center hover:bg-gray-800 hover:border-blue-500 transition duration-300">
                                    <div className="text-5xl mb-4">📝</div>
                                    <h3 className="text-2xl font-bold">מחולל כתבות</h3>
                                </button>
                                <button onClick={() => setCurrentDomain('events')} className="bg-gray-800/50 p-8 rounded-xl shadow-lg border border-gray-700 text-center hover:bg-gray-800 hover:border-teal-500 transition duration-300">
                                    <div className="text-5xl mb-4">🎙️</div>
                                    <h3 className="text-2xl font-bold">מחולל אירוחים</h3>
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {currentDomain && (
                         <div>
                            <button onClick={() => { setCurrentDomain(null); setHostingView('menu'); }} className="btn bg-gray-600 hover:bg-gray-500 text-sm font-bold py-2 px-4 rounded-full flex items-center gap-2 mb-6">
                                <span>➡️ חזור לבחירת התחום</span>
                            </button>
                            
                            {currentDomain === 'articles' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Article Generator UI */}
                                    <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg border border-gray-700 space-y-4">
                                        <h2 className="text-2xl font-bold">פרטי הכתבה</h2>
                                        {/* Form fields for articles */}
                                        <div className="flex justify-end">
                                             <button onClick={() => setIsInterfaceModalOpen(true)} className="btn bg-gray-600 hover:bg-gray-500 text-sm font-bold py-2 px-4 rounded-full">🖼️ הוסף תמונת ממשק</button>
                                        </div>
                                        <div><label className="block text-sm font-medium mb-1">כותרת</label><input type="text" value={articleForm.title} onChange={(e) => setArticleForm({...articleForm, title: e.target.value})} className="form-input w-full rounded-lg p-2.5 bg-gray-700 border-gray-600" /></div>
                                        <div><label className="block text-sm font-medium mb-1">כותרת משנה</label><input type="text" value={articleForm.subtitle} onChange={(e) => setArticleForm({...articleForm, subtitle: e.target.value})} className="form-input w-full rounded-lg p-2.5 bg-gray-700 border-gray-600" /></div>
                                        <div><label className="block text-sm font-medium mb-1">תוכן</label><textarea rows="8" value={articleForm.content} onChange={(e) => setArticleForm({...articleForm, content: e.target.value})} className="form-textarea w-full rounded-lg p-2.5 bg-gray-700 border-gray-600"></textarea></div>
                                        <div><label className="block text-sm font-medium mb-1">תמונה</label><input type="url" value={articleForm.imageUrl} onChange={(e) => setArticleForm({...articleForm, imageUrl: e.target.value})} className="form-input w-full rounded-lg p-2.5 bg-gray-700 border-gray-600" /></div>
                                        <div><label className="block text-sm font-medium mb-1">קרדיט</label><input type="text" value={articleForm.credit} onChange={(e) => setArticleForm({...articleForm, credit: e.target.value})} className="form-input w-full rounded-lg p-2.5 bg-gray-700 border-gray-600" /></div>
                                    </div>
                                    <div className="bg-gray-800/50 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col">
                                         <h2 className="text-2xl font-bold mb-4">פלט (BBCode)</h2>
                                         <textarea readOnly value={articleOutput} className="form-textarea w-full h-full flex-grow rounded-lg p-3 font-mono text-sm bg-gray-900 border-gray-700"></textarea>
                                         <div className="flex gap-4 mt-4">
                                            <button onClick={generateArticleBBCode} className="btn bg-blue-600 hover:bg-blue-500 w-full font-bold py-3 rounded-lg">צור קוד</button>
                                            <button onClick={() => copyToClipboard(articleOutput)} className="btn bg-green-600 hover:bg-green-500 w-full font-bold py-3 rounded-lg">העתק קוד</button>
                                         </div>
                                    </div>
                                </div>
                            )}

                            {currentDomain === 'events' && (
                                 <div>
                                    {/* Hosting generator views will be rendered here based on `hostingView` state */}
                                    <p className="text-center">מחולל אירוחים בבנייה...</p>
                                 </div>
                            )}
                         </div>
                    )}
                </div>
            </main>
        </>
    );
}


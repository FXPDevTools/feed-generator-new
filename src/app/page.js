"use client"

import { useState, useEffect } from 'react';
import Head from 'next/head';

// Helper component for loading spinners
const Spinner = () => (
    <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
);

// Main Application Component
export default function Home() {
    // --- STATE MANAGEMENT ---
    const [currentDomain, setCurrentDomain] = useState(null); // 'articles' or 'events'

    // Article Generator State
    const [articleForm, setArticleForm] = useState({ title: '', subtitle: '', content: '', imageUrl: '', credit: '' });
    const [interfacePic, setInterfacePic] = useState({ type: 'post', username: 'ModerniMan', userTitle: 'FxP Dev', avatar: 'https://static.fcdn.co.il/images_new/_Fxp_logo_2020.png', content: 'זוהי תגובת דוגמה...', quoteUser: '', quoteContent: '', likes: 3 });
    
    // Hosting Generator State
    const [hostingView, setHostingView] = useState('menu'); // menu, suggester, proposal, creator
    const [guestSuggestionTool, setGuestSuggestionTool] = useState({ topic: '', isLoading: false, suggestions: [], error: '' });
    const [proposalForm, setProposalForm] = useState({ guestName: '', occupation: '', info: '', website: '', personalOpinion: '', communityInterest: '', contactInfo: '', notes: '' });
    const [creatorForm, setCreatorForm] = useState({ guestName: '', occupation: '', biography: '', imageUrl: '', credit: '', contentBlocks: [] });
    
    // Shared States
    const [apiState, setApiState] = useState({ isLoading: false, error: '' });
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    
    // --- UI MODALS ---
    const [isInterfaceModalOpen, setIsInterfaceModalOpen] = useState(false);

    // --- NOTIFICATION SYSTEM ---
    const showNotification = (message, type = 'success', duration = 3000) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), duration);
    };

    // --- API HELPER ---
    const callApi = async (task, context) => {
        setApiState({ isLoading: true, error: '' });
        try {
            const response = await fetch('/api/generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task, context })
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Unknown API error');
            }
            return await response.json();
        } catch (error) {
            let errorMessage = `שגיאת AI: ${error.message}`;
            if (error.message.includes('429')) errorMessage = 'שגיאת API: עברת את מכסת הבקשות לדקה.';
            setApiState({ isLoading: false, error: errorMessage });
            showNotification(errorMessage, 'error');
            return null;
        } finally {
            setApiState({ isLoading: false, error: '' });
        }
    };
    
    // --- DRAG & DROP FOR INTERVIEW BLOCKS ---
    const [draggedItem, setDraggedItem] = useState(null);

    const handleDragStart = (e, index) => {
        setDraggedItem(creatorForm.contentBlocks[index]);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.parentNode);
    };

    const handleDragOver = (index) => {
        const draggedOverItem = creatorForm.contentBlocks[index];
        if (draggedItem === draggedOverItem) {
            return;
        }
        let items = creatorForm.contentBlocks.filter(item => item !== draggedItem);
        items.splice(index, 0, draggedItem);
        setCreatorForm(prev => ({ ...prev, contentBlocks: items }));
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
    };

    // --- BBCODE GENERATORS ---
    const generateArticleBBCode = () => {
        let { title, subtitle, content, imageUrl, credit } = articleForm;
        let code = `[CENTER]`;
        if (imageUrl) code += `[IMG]${imageUrl}[/IMG]\n\n`;
        if (title) code += `[SIZE=6][B]${title}[/B][/SIZE]\n`;
        if (subtitle) code += `[SIZE=4]${subtitle}[/SIZE]\n\n`;
        if (content) code += `[SIZE=3]${content}[/SIZE]\n\n`;
        if (credit) code += `[B]בברכה,\nצוות ${credit}.[/B]`;
        code += `[/CENTER]`;
        return code;
    };

    const generateProposalOutput = () => {
        let { guestName, occupation, info, website, personalOpinion, communityInterest, contactInfo, notes } = proposalForm;
        return `[B]שם המתארח:[/B] ${guestName}\n[B]מקצוע / עיסוק:[/B] ${occupation}\n\n[B]מידע על המתארח:[/B]\n${info}\n\n[B]מדוע יעניין את הקהילה?:[/B]\n${communityInterest}\n\n[B]אתר אינטרנט:[/B] ${website}\n[B]דרכי יצירת קשר:[/B] ${contactInfo}\n\n[B]דעה אישית:[/B]\n${personalOpinion}\n\n[B]הערות:[/B]\n${notes}`;
    };
    
    const generateCreatorOutput = () => {
        let { guestName, occupation, biography, imageUrl, credit, contentBlocks } = creatorForm;
        let code = `[CENTER]`;
        if (imageUrl) code += `[IMG]${imageUrl}[/IMG]\n\n`;
        if(guestName) code += `[SIZE=6][B]אירוח ב־FxP: ${guestName}![/B][/SIZE]\n\n`;
        code += `[SIZE=4]גולשים יקרים,\nאנו שמחים להכריז על אירוח מיוחד!\n`;
        if(guestName && occupation) code += `אנו נארח את [B]${guestName}[/B], ${occupation}.\n\n`;
        if(biography) code += `${biography}\n\n`;

        contentBlocks.forEach(block => {
            if (block.type === 'paragraph' && block.title && block.content) code += `[U]${block.title}[/U]\n${block.content}\n\n`;
            else if (block.type === 'qa' && block.q && block.a) code += `[B]${block.q}[/B]\n${block.a}\n\n`;
        });
        
        code += `אתם מוזמנים לשאול כל מה שתרצו![/SIZE]\n\n`;
        if (credit) code += `[B]בברכה,\nצוות ${credit}.[/B]`;
        code += `[/CENTER]`;
        return code;
    };
    
    // --- HANDLER FUNCTIONS ---
    const handleSuggestGuests = async () => {
        if (!guestSuggestionTool.topic.trim()) {
            showNotification('יש להזין נושא.', 'error');
            return;
        }
        const data = await callApi('suggest_guests', { topic: guestSuggestionTool.topic });
        if (data) {
            setGuestSuggestionTool(prev => ({
                ...prev,
                suggestions: data.result.split('\n').map(s => s.replace(/^\d+\.\s*/, '').trim()).filter(Boolean)
            }));
        }
    };
    
    const goToProposal = (suggestion = null) => {
        if (suggestion) {
            const parts = suggestion.split(/,|-/);
            setProposalForm(prev => ({
                ...prev,
                guestName: parts[0].replace(/\*\*/g, '').trim(),
                occupation: guestSuggestionTool.topic
            }));
        }
        setHostingView('proposal');
    };
    
    const goToCreator = () => {
        setCreatorForm(prev => ({
            ...prev,
            guestName: proposalForm.guestName,
            occupation: proposalForm.occupation
        }));
        setHostingView('creator');
    };
    
    const addBlock = (type) => {
        setCreatorForm(prev => ({
            ...prev,
            contentBlocks: [...prev.contentBlocks, { id: Date.now(), type, title: '', content: '', q: '', a: '' }]
        }));
    };

    const removeBlock = (index) => {
        setCreatorForm(prev => ({
            ...prev,
            contentBlocks: prev.contentBlocks.filter((_, i) => i !== index)
        }));
    };

    // --- RENDER LOGIC ---
    return (
        <>
            <Head>
                <title>מחולל התוכן המאוחד - FXP</title>
                <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap" rel="stylesheet"/>
            </Head>

            <main className="bg-gray-900 text-gray-200 font-['Assistant'] min-h-screen">
                <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-7xl">
                    <header className="text-center mb-8">
                        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300 mb-2">מחולל התוכן המאוחד</h1>
                        <p className="text-lg text-gray-400">הכלי המרכזי ליצירת כתבות ואירוחים בקהילה</p>
                    </header>
                    
                    {/* ... (The rest of the JSX for UI will be here) ... */}
                    {/* This part is omitted for brevity but would contain the full UI converted to JSX */}
                    
                </div>
            </main>
        </>
    );
}

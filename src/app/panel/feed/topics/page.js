"use client";
import { useState, useEffect } from 'react';
import PanelFrame from '../../PanelFrame';
import usePanelCodeInfo from '../../hooks/usePanelCodeInfo';

export default function TopicsManagement() {
    const info = usePanelCodeInfo();
    const role = info?.role || '';
    const [topics, setTopics] = useState([]);
    const [newTopicName, setNewTopicName] = useState('');
    const [newTopicColor, setNewTopicColor] = useState('#000000');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        try {
            const res = await fetch('/api/feed/topics');
            if (res.ok) {
                const data = await res.json();
                setTopics(data);
            }
        } catch (error) {
            console.error('Failed to load topics', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTopic = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/feed/topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic_name: newTopicName, topic_color: newTopicColor })
            });

            if (res.ok) {
                setNewTopicName('');
                setNewTopicColor('#000000');
                fetchTopics();
            } else {
                alert('שגיאה בהוספת נושא');
            }
        } catch (error) {
            console.error('Error adding topic:', error);
        }
    };

    const handleDeleteTopic = async (id) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק נושא זה?')) return;

        try {
            const res = await fetch(`/api/feed/topics?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchTopics();
            } else {
                alert('שגיאה במחיקת נושא');
            }
        } catch (error) {
            console.error('Error deleting topic:', error);
        }
    };

    return (
        <PanelFrame title="ניהול נושאי כתבות" role={role}>
            <div className="p-6">
                <div className="bg-slate-800 rounded-lg shadow-lg p-6 mb-6 border border-slate-700">
                    <h2 className="text-xl font-bold mb-4 text-white">הוספת נושא חדש</h2>
                    <form onSubmit={handleAddTopic} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-300 mb-1">שם הנושא</label>
                            <input
                                type="text"
                                value={newTopicName}
                                onChange={(e) => setNewTopicName(e.target.value)}
                                className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white focus:border-indigo-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">צבע</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={newTopicColor}
                                    onChange={(e) => setNewTopicColor(e.target.value)}
                                    className="h-10 w-10 p-1 rounded border border-slate-600 bg-slate-700 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={newTopicColor}
                                    onChange={(e) => setNewTopicColor(e.target.value)}
                                    className="w-24 p-2 bg-slate-700 border border-slate-600 rounded text-white focus:border-indigo-500 outline-none font-mono"
                                    placeholder="#000000"
                                    pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition-colors h-10 font-medium"
                        >
                            הוסף נושא
                        </button>
                    </form>
                </div>

                <div className="bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-700">
                    <table className="min-w-full divide-y divide-slate-700">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">שם הנושא</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">צבע</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">תצוגה מקדימה</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">פעולות</th>
                            </tr>
                        </thead>
                        <tbody className="bg-slate-800 divide-y divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-slate-400">טוען...</td>
                                </tr>
                            ) : topics.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-slate-400">אין נושאים קיימים</td>
                                </tr>
                            ) : (
                                topics.map((topic) => (
                                    <tr key={topic.id} className="hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{topic.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{topic.topic_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-300 font-mono">{topic.topic_color}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className="px-3 py-1 rounded-full text-sm font-bold text-white shadow-sm"
                                                style={{ backgroundColor: topic.topic_color }}
                                            >
                                                {topic.topic_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => handleDeleteTopic(topic.id)}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-full transition-colors"
                                                title="מחק נושא"
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </PanelFrame>
    );
}

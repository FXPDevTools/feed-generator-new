"use client";
import { useEffect, useState } from "react";

const CREDITS_PATH = "/api/panel/admin/credits/get";

export default function CreditsAdmin() {
  const [credits, setCredits] = useState([]);
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState({ nick: "", profile: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(CREDITS_PATH)
      .then((res) => res.json())
      .then((data) => {
        setCredits(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleEdit = (idx) => {
    setEditIdx(idx);
    setForm(credits[idx]);
  };

  const handleDelete = (idx) => {
    if (!window.confirm("למחוק את המשתמש?")) return;
    const newCredits = credits.filter((_, i) => i !== idx);
    setCredits(newCredits);
    saveCredits(newCredits);
  };

  const handleSave = () => {
    if (!form.nick.trim() || !form.profile.trim()) {
      setError("יש למלא ניק וקישור");
      return;
    }
    let newCredits = [...credits];
    if (editIdx !== null) {
      newCredits[editIdx] = { ...form };
    } else {
      newCredits.push({ ...form });
    }
    setCredits(newCredits);
    setEditIdx(null);
    setForm({ nick: "", profile: "" });
    setError("");
    saveCredits(newCredits);
  };

  const handleAdd = () => {
    setEditIdx(null);
    setForm({ nick: "", profile: "" });
  };

  const saveCredits = async (data) => {
  await fetch("/api/panel/admin/credits/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  if (loading) return <div className="text-white">טוען...</div>;

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8 bg-transparent text-white">
      <div className="max-w-xl w-full bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col gap-8 items-center">
        <h1 className="text-3xl mb-4 font-bold">ניהול קרדיטים בפוטר</h1>
        <button className="mb-4 px-4 py-2 bg-blue-700 rounded" onClick={handleAdd}>הוסף משתמש</button>
        <ul className="w-full flex flex-col gap-2">
          {credits.map((c, i) => (
            <li key={i} className="flex items-center gap-2 bg-gray-700 rounded p-2">
              <span className="flex-1">{c.nick} (<a href={c.profile} className="underline text-blue-300" target="_blank">פרופיל</a>)</span>
              <button className="px-2 py-1 bg-yellow-600 rounded" onClick={() => handleEdit(i)}>ערוך</button>
              <button className="px-2 py-1 bg-red-700 rounded" onClick={() => handleDelete(i)}>מחק</button>
            </li>
          ))}
        </ul>
        {(editIdx !== null || form.nick || form.profile) && (
          <div className="w-full bg-gray-900 p-4 rounded flex flex-col gap-2 mt-4">
            <input
              className="p-2 rounded bg-gray-800 text-white"
              placeholder="ניק"
              value={form.nick}
              onChange={e => setForm(f => ({ ...f, nick: e.target.value }))}
            />
            <input
              className="p-2 rounded bg-gray-800 text-white"
              placeholder="קישור לפרופיל"
              value={form.profile}
              onChange={e => setForm(f => ({ ...f, profile: e.target.value }))}
            />
            {error && <div className="text-red-400">{error}</div>}
            <button className="mt-2 px-4 py-2 bg-green-700 rounded" onClick={handleSave}>שמור</button>
          </div>
        )}
      </div>
    </main>
  );
}

"use client";
import { useEffect, useState } from "react";
import { authenticatedFetch } from "../../../../../lib/api-client.js";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const CREDITS_PATH = "/api/panel/admin/credits/get";

// רכיב קרדיט בר-גרירה
function SortableCredit({ credit, index, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `credit-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center gap-2 bg-gray-700 rounded p-2"
    >
      <div 
        className="flex-1 cursor-move p-2 -m-2" 
        {...attributes} 
        {...listeners}
      >
        {credit.nick} (<a href={credit.profile} className="underline text-blue-300" target="_blank" rel="noopener noreferrer">פרופיל</a>)
      </div>
      <button 
        className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded cursor-pointer" 
        onClick={(e) => {
          e.stopPropagation();
          onEdit(index);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        ערוך
      </button>
      <button 
        className="px-2 py-1 bg-red-700 hover:bg-red-800 rounded cursor-pointer" 
        onClick={(e) => {
          e.stopPropagation();
          onDelete(index);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        מחק
      </button>
    </li>
  );
}

export default function CreditsAdmin() {
  const [credits, setCredits] = useState([]);
  const [editIdx, setEditIdx] = useState(null);
  const [form, setForm] = useState({ nick: "", profile: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    authenticatedFetch(CREDITS_PATH)
      .then((res) => res.json())
      .then((data) => {
        setCredits(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setCredits((items) => {
        const oldIndex = items.findIndex((_, i) => `credit-${i}` === active.id);
        const newIndex = items.findIndex((_, i) => `credit-${i}` === over.id);
        
        const newCredits = arrayMove(items, oldIndex, newIndex);
        saveCredits(newCredits); // שמור את הסדר החדש
        return newCredits;
      });
    }
  };

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
    if (editIdx >= 0) {
      // עריכה של קרדיט קיים
      newCredits[editIdx] = { ...form };
    } else {
      // הוספת קרדיט חדש
      newCredits.push({ ...form });
    }
    setCredits(newCredits);
    setEditIdx(null);
    setForm({ nick: "", profile: "" });
    setError("");
    saveCredits(newCredits);
  };

  const handleAdd = () => {
    setEditIdx(-1); // -1 מציין הוספה חדשה
    setForm({ nick: "", profile: "" });
    setError("");
  };

  const saveCredits = async (data) => {
  await authenticatedFetch("/api/panel/admin/credits/save", {
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
        <div className="w-full">
          <p className="text-sm text-gray-400 mb-2">ניתן לגרור כדי לשנות סדר</p>
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={credits.map((_, i) => `credit-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col gap-2">
                {credits.map((credit, i) => (
                  <SortableCredit
                    key={`credit-${i}`}
                    credit={credit}
                    index={i}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
        {(editIdx !== null || form.nick || form.profile) && (
          <div className="w-full bg-gray-900 p-4 rounded flex flex-col gap-2 mt-4">
            <h3 className="text-lg font-semibold">
              {editIdx >= 0 ? 'עריכת קרדיט' : 'הוספת קרדיט חדש'}
            </h3>
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
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-green-700 rounded" onClick={handleSave}>
                {editIdx >= 0 ? 'עדכן' : 'הוסף'}
              </button>
              <button 
                className="px-4 py-2 bg-gray-600 rounded" 
                onClick={() => {
                  setEditIdx(null);
                  setForm({ nick: "", profile: "" });
                  setError("");
                }}
              >
                ביטול
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

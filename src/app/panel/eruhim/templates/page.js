"use client";

import { useEffect, useMemo, useState } from "react";
import PanelFrame from "../../PanelFrame";
import usePanelCodeInfo from "../../hooks/usePanelCodeInfo";
import PanelButton from "../../hooks/PanelButton";
import { authenticatedFetch } from "../../../../../lib/api-client.js";

import {
  INTERVIEW_PLACEHOLDERS,
  QA_PLACEHOLDERS,
  INTERVIEW_IF_BLOCKS,
  extractPlaceholders,
  extractIfBlocks,
  detectUnknownPlaceholders,
  simulateInterviewTemplate,
  defaultInterviewSampleData,
  bbcodeToHtml,
} from "../../../../../lib/interview-preview.js";

export default function InterviewTemplatesManagerPage() {
  const info = usePanelCodeInfo();
  const role = info?.role || "";

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState({ 
    id: null, 
    name: "", 
    content: "", 
    qa_content: "" 
  });
  const [mode, setMode] = useState("idle"); // idle | add | edit
  const [saving, setSaving] = useState(false);

  // Sidebar insights (dynamic per current editing content)
  const usedPlaceholdersMain = useMemo(
    () => extractPlaceholders(editing?.content || ""),
    [editing?.content]
  );
  const usedPlaceholdersQA = useMemo(
    () => extractPlaceholders(editing?.qa_content || ""),
    [editing?.qa_content]
  );
  const usedIfsMain = useMemo(
    () => extractIfBlocks(editing?.content || ""),
    [editing?.content]
  );
  const unknownPlaceholdersMain = useMemo(
    () => detectUnknownPlaceholders(editing?.content || ""),
    [editing?.content]
  );
  const unknownPlaceholdersQA = useMemo(
    () => detectUnknownPlaceholders(editing?.qa_content || ""),
    [editing?.qa_content]
  );

  const sampleData = useMemo(() => defaultInterviewSampleData(), []);

  const previewHtml = useMemo(() => {
    if (!editing?.content) return "";
    const processed = simulateInterviewTemplate(
      editing.content, 
      editing.qa_content, 
      sampleData, 
      { removeUnknown: true }
    );
    return bbcodeToHtml(processed);
  }, [editing?.content, editing?.qa_content, sampleData]);

  // Load list
  useEffect(() => {
    (async () => {
      try {
        const res = await authenticatedFetch("/api/eruhim/templates", { cache: "no-store" });
        const data = await res.json();
        setList(Array.isArray(data) ? data : []);
      } catch (e) {
        setList([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSelect = async (id) => {
    setSelectedId(id);
    setMode("edit");
    try {
  const res = await authenticatedFetch(`/api/eruhim/templates/${id}`);
      const data = await res.json();
      if (!data || data.error) throw new Error("not found");
      setEditing({ 
        id: data.id, 
        name: data.name || "", 
        content: data.content || "",
        qa_content: data.qa_content || ""
      });
    } catch (e) {
      alert("שגיאה בטעינת התבנית");
      setEditing({ id: null, name: "", content: "", qa_content: "" });
    }
  };

  const onAddNew = () => {
    setMode("add");
    setSelectedId(null);
    setEditing({ id: null, name: "", content: "", qa_content: "" });
  };

  const onCancel = () => {
    setMode("idle");
    setSelectedId(null);
    setEditing({ id: null, name: "", content: "", qa_content: "" });
  };

  const onSave = async () => {
    if (!editing.name.trim() || !editing.content.trim()) return;
    setSaving(true);
    try {
      const method = editing.id ? "PUT" : "POST";
      const url = editing.id
        ? `/api/eruhim/templates/${editing.id}`
        : "/api/eruhim/templates";
      
      const requestBody = {
        name: editing.name.trim(),
        content: {
          content: editing.content,
          qa_content: editing.qa_content
        }
      };
      
      const res = await authenticatedFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || "שגיאה בשמירה";
        alert(msg);
        return;
      }
      // refresh list
  const resList = await authenticatedFetch("/api/eruhim/templates", { cache: "no-store" });
      const nextList = await resList.json();
      setList(Array.isArray(nextList) ? nextList : []);
      alert("נשמר בהצלחה");
      if (method === "POST") {
        setMode("idle");
        setEditing({ id: null, name: "", content: "", qa_content: "" });
      }
    } catch (e) {
      alert("שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id) => {
    if (!id) return;
    if (!confirm("בטוח למחוק את התבנית?")) return;
    try {
  const res = await authenticatedFetch(`/api/eruhim/templates/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || "שגיאה במחיקה";
        alert(msg);
        return;
      }
      // refresh
  const resList = await authenticatedFetch("/api/eruhim/templates", { cache: "no-store" });
      const nextList = await resList.json();
      setList(Array.isArray(nextList) ? nextList : []);
      if (selectedId === id) onCancel();
      alert("התבנית נמחקה");
    } catch (e) {
      alert("שגיאה במחיקה");
    }
  };

  const onSetActive = async (id) => {
    try {
  const res = await authenticatedFetch("/api/eruhim/templates/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || "שגיאה בהגדרת פעיל";
        alert(msg);
        return;
      }
      // refresh
  const resList = await authenticatedFetch("/api/eruhim/templates", { cache: "no-store" });
      const nextList = await resList.json();
      setList(Array.isArray(nextList) ? nextList : []);
      alert("עודכן כתבנית פעילה");
    } catch (e) {
      alert("שגיאה בעדכון פעיל");
    }
  };

  return (
    <PanelFrame title="ניהול תבניות ריאיונות" role={role}>
      {/* רשימת תבניות */}
      <div className="w-full space-y-4">
        <div className="flex gap-2">
          <PanelButton className="bg-green-600 hover:bg-green-700 w-auto" onClick={onAddNew}>+ תבנית חדשה</PanelButton>
          <PanelButton
            className="bg-blue-600 hover:bg-blue-700 w-auto"
            onClick={() => {
              if (selectedId) onSelect(selectedId);
            }}
            disabled={!selectedId}
          >
            רענן תבנית
          </PanelButton>
        </div>

        <div className="bg-gray-900 p-3 rounded-lg">
          <h3 className="text-lg font-bold mb-2">תבניות קיימות</h3>
          {loading ? (
            <div>טוען...</div>
          ) : list.length === 0 ? (
            <div className="text-gray-400">אין תבניות עדיין</div>
          ) : (
            <div className="space-y-2">
              {list.map((t) => (
                <div key={t.id} className={`p-2 rounded border ${selectedId === t.id ? "border-blue-500" : "border-transparent"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <button className="text-left flex-1" onClick={() => onSelect(t.id)}>
                      <div className="font-semibold text-lg md:text-xl">{t.name}</div>
                      <div className="text-xs text-gray-400">{t.is_active ? "🟢 פעילה" : "⚪ לא פעילה"}</div>
                    </button>
                    <PanelButton 
                      className="bg-blue-600 hover:bg-blue-700 w-auto" 
                      onClick={() => window.open(`/eruhim/interviews?template=${t.id}`, '_blank')}
                      title="פתח מחולל ריאיונות עם התבנית הזו"
                    >
                      📝 מחולל
                    </PanelButton>
                    {!t.is_active && (
                      <PanelButton className="bg-yellow-600 hover:bg-yellow-700 w-auto" onClick={() => onSetActive(t.id)}>
                        הגדר פעילה
                      </PanelButton>
                    )}
                    {!t.is_active ? (
                      <PanelButton className="bg-red-600 hover:bg-red-700 w-[200px]" onClick={() => onDelete(t.id)}>
                        מחק
                      </PanelButton>
                    ) : (
                      <PanelButton className="bg-gray-500 cursor-not-allowed w-[200px]" disabled title="לא ניתן למחוק את התבנית הפעילה!">
                        לא ניתן למחוק
                      </PanelButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* עורך */}
        <div className="bg-gray-900 p-3 rounded-lg">
          <h3 className="text-lg font-bold mb-3">{mode === "add" ? "תבנית חדשה" : selectedId ? "עריכת תבנית" : "בחר תבנית לעריכה או צור חדשה"}</h3>

          {(mode === "add" || selectedId) && (
            <div className="space-y-3">
              <div>
                <label className="block mb-1">שם התבנית</label>
                <input
                  type="text"
                  className="w-full rounded bg-gray-800 p-2"
                  value={editing.name}
                  onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                  placeholder="שם קריא לתבנית"
                />
              </div>

              <div>
                <label className="block mb-1">תבנית ראשית (BBCode RAW)</label>
                <textarea
                  className="w-full h-60 rounded bg-gray-800 p-2 font-mono text-sm"
                  value={editing.content}
                  onChange={(e) => setEditing((p) => ({ ...p, content: e.target.value }))}
                  placeholder="התבנית הראשית עם פלייסהולדרים כמו {שם המתארח}, {ביוגרפיה}, {QNA_BLOCK}"
                />
              </div>

              <div>
                <label className="block mb-1">תבנית שאלות ותשובות (BBCode RAW)</label>
                <textarea
                  className="w-full h-32 rounded bg-gray-800 p-2 font-mono text-sm"
                  value={editing.qa_content}
                  onChange={(e) => setEditing((p) => ({ ...p, qa_content: e.target.value }))}
                  placeholder="תבנית לשאלה ותשובה בודדת עם %Question% ו־%Answer%"
                />
              </div>

              <div className="flex gap-2">
                <PanelButton className="bg-green-600 hover:bg-green-700" onClick={onSave} disabled={saving || !editing.name.trim() || !editing.content.trim()}>
                  {saving ? "שומר..." : "שמור"}
                </PanelButton>
                <PanelButton className="bg-gray-600 hover:bg-gray-700" onClick={onCancel}>
                  ביטול
                </PanelButton>
              </div>

              {/* אזהרות */}
              {(unknownPlaceholdersMain.length > 0 || unknownPlaceholdersQA.length > 0) && (
                <div className="p-2 rounded bg-yellow-900 text-yellow-200">
                  אזהרה: נמצאו פלייסהולדרים לא מוכרים:
                  {unknownPlaceholdersMain.length > 0 && (
                    <div>תבנית ראשית: {unknownPlaceholdersMain.map((x) => `{${x}}`).join(", ")}</div>
                  )}
                  {unknownPlaceholdersQA.length > 0 && (
                    <div>תבנית שאלות: {unknownPlaceholdersQA.map((x) => `%${x}%`).join(", ")}</div>
                  )}
                </div>
              )}

              {/* תצוגה מקדימה */}
              {editing.content?.trim() && (
                <div className="mt-4">
                  <h4 className="text-md font-bold mb-2">תצוגה מקדימה</h4>
                  <div
                    className="bg-white text-black rounded p-3 max-w-none interview-preview"
                    dangerouslySetInnerHTML={{ __html: previewHtml || '<div class="text-gray-500">לא ניתן להציג תצוגה מקדימה</div>' }}
                  />
                  <div className="text-xs text-gray-400 mt-1">התצוגה המקדימה משתמשת בנתוני דוגמה בלבד. שמירה תמיד RAW.</div>
                </div>
              )}

              {/* מקרא */}
              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="bg-gray-800 p-3 rounded">
                  <h4 className="font-semibold mb-2">מה מופיע בתבניות הנוכחיות</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <div className="text-sm text-gray-300">פלייסהולדרים בתבנית ראשית:</div>
                      <div className="text-xs text-gray-400 break-words">{usedPlaceholdersMain.length ? usedPlaceholdersMain.map((p) => `{${p}}`).join(", ") : "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-300">פלייסהולדרים בתבנית שאלות:</div>
                      <div className="text-xs text-gray-400 break-words">{usedPlaceholdersQA.length ? usedPlaceholdersQA.map((p) => `%${p}%`).join(", ") : "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-300">IF blocks:</div>
                      <div className="text-xs text-gray-400 break-words">{usedIfsMain.length ? usedIfsMain.map((b) => `%IF_${b}_START%…%IF_${b}_END%`).join(" | ") : "—"}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <h4 className="font-semibold mb-2">נתמכים כללית</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <div className="text-sm text-gray-300">פלייסהולדרים לתבנית ראשית:</div>
                      <div className="text-xs text-gray-400 break-words">{INTERVIEW_PLACEHOLDERS.map((p) => `{${p}}`).join(", ")}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-300">פלייסהולדרים לתבנית שאלות:</div>
                      <div className="text-xs text-gray-400 break-words">{QA_PLACEHOLDERS.map((p) => `%${p}%`).join(", ")}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-300">IF blocks:</div>
                      <div className="text-xs text-gray-400 break-words">{INTERVIEW_IF_BLOCKS.map((b) => `%IF_${b}_START%…%IF_${b}_END%`).join(" | ")}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">התבניות נשמרות RAW. העיבוד נעשה רק בתצוגה מקדימה ובמחולל הריאיונות.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PanelFrame>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import PanelFrame from "../../PanelFrame";
import usePanelCodeInfo from "../../hooks/usePanelCodeInfo";
import PanelButton from "../../hooks/PanelButton";

import {
  GLOBAL_PLACEHOLDERS,
  GLOBAL_IF_BLOCKS,
  extractPlaceholders,
  extractIfBlocks,
  detectUnknownPlaceholders,
  simulateTemplateForPreview,
  defaultSampleData,
} from "../../../../../lib/bbcode-preview.js";

// We avoid @bbob/react for now due to <size> tag warning in React 19; use simple HTML conversion for preview
import { bbcodeToHtml } from "../../../../../lib/bbcode-preview.js";

export default function TemplatesManagerPage() {
  const info = usePanelCodeInfo();
  const role = info?.role || "";

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState({ id: null, name: "", content: "" });
  const [mode, setMode] = useState("idle"); // idle | add | edit
  const [saving, setSaving] = useState(false);

  // Sidebar insights (dynamic per current editing content)
  const usedPlaceholders = useMemo(
    () => extractPlaceholders(editing?.content || ""),
    [editing?.content]
  );
  const usedIfs = useMemo(
    () => extractIfBlocks(editing?.content || ""),
    [editing?.content]
  );
  const unknownPlaceholders = useMemo(
    () => detectUnknownPlaceholders(editing?.content || ""),
    [editing?.content]
  );

  const sampleData = useMemo(() => defaultSampleData(), []);

  const previewBBCode = useMemo(() => {
    if (!editing?.content) return "";
    return simulateTemplateForPreview(editing.content, sampleData, {
      removeUnknown: true,
    });
  }, [editing?.content, sampleData]);

  // Load list
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/bbcode/templates", { cache: "no-store" });
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
      const res = await fetch(`/api/bbcode/templates/${id}`);
      const data = await res.json();
      if (!data || data.error) throw new Error("not found");
      setEditing({ id: data.id, name: data.name || "", content: data.content || "" });
    } catch (e) {
      alert("שגיאה בטעינת התבנית");
      setEditing({ id: null, name: "", content: "" });
    }
  };

  const onAddNew = () => {
    setMode("add");
    setSelectedId(null);
    setEditing({ id: null, name: "", content: "" });
  };

  const onCancel = () => {
    setMode("idle");
    setSelectedId(null);
    setEditing({ id: null, name: "", content: "" });
  };

  const onSave = async () => {
    if (!editing.name.trim() || !editing.content.trim()) return;
    setSaving(true);
    try {
      const method = editing.id ? "PUT" : "POST";
      const url = editing.id
        ? `/api/bbcode/templates/${editing.id}`
        : "/api/bbcode/templates";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editing.name.trim(), content: editing.content }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || "שגיאה בשמירה";
        alert(msg);
        return;
      }
      // refresh list
      const resList = await fetch("/api/bbcode/templates", { cache: "no-store" });
      const nextList = await resList.json();
      setList(Array.isArray(nextList) ? nextList : []);
      alert("נשמר בהצלחה");
      if (method === "POST") {
        setMode("idle");
        setEditing({ id: null, name: "", content: "" });
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
      const res = await fetch(`/api/bbcode/templates/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || "שגיאה במחיקה";
        alert(msg);
        return;
      }
      // refresh
      const resList = await fetch("/api/bbcode/templates", { cache: "no-store" });
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
      const res = await fetch("/api/bbcode/templates/active", {
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
      const resList = await fetch("/api/bbcode/templates", { cache: "no-store" });
      const nextList = await resList.json();
      setList(Array.isArray(nextList) ? nextList : []);
      alert("עודכן כתבנית פעילה");
    } catch (e) {
      alert("שגיאה בעדכון פעיל");
    }
  };

  // Render preview using @bbob/react
  const previewHtml = useMemo(() => {
    if (!previewBBCode) return "";
    return bbcodeToHtml(previewBBCode);
  }, [previewBBCode]);

  return (
    <PanelFrame title="ניהול תבניות פיד (BBCode)" role={role}>
      {/* רשימת תבניות */}
      <div className="w-full space-y-4">
        <div className="flex gap-2">
          <PanelButton className="bg-green-600 hover:bg-green-700" onClick={onAddNew}>+ תבנית חדשה</PanelButton>
          <PanelButton
            className="bg-blue-600 hover:bg-blue-700"
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
                    {!t.is_active && (
                      <PanelButton size="xs" className="bg-yellow-600 hover:bg-yellow-700 w-auto" onClick={() => onSetActive(t.id)}>
                        הגדר פעילה
                      </PanelButton>
                    )}
                    <PanelButton size="xs" className="bg-red-600 hover:bg-red-700 w-auto" onClick={() => onDelete(t.id)}>
                      מחק
                    </PanelButton>
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
                <label className="block mb-1">תוכן התבנית (BBCode RAW)</label>
                <textarea
                  className="w-full h-60 rounded bg-gray-800 p-2 font-mono text-sm"
                  value={editing.content}
                  onChange={(e) => setEditing((p) => ({ ...p, content: e.target.value }))}
                  placeholder="הדבק/כתוב כאן BBCode עם %Placeholders% ו־%IF_*_START% ... %IF_*_END%"
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
              {unknownPlaceholders.length > 0 && (
                <div className="p-2 rounded bg-yellow-900 text-yellow-200">
                  אזהרה: נמצאו פלייסהולדרים לא מוכרים: {unknownPlaceholders.map((x) => `%${x}%`).join(", ")}
                </div>
              )}

              {/* תצוגה מקדימה */}
              {editing.content?.trim() && (
                <div className="mt-4">
                  <h4 className="text-md font-bold mb-2">תצוגה מקדימה</h4>
                  <div
                    className="bg-white text-black rounded p-3 max-w-none bbcode-preview"
                    dangerouslySetInnerHTML={{ __html: previewHtml || '<div class="text-gray-500">לא ניתן להציג תצוגה מקדימה</div>' }}
                  />
                  <div className="text-xs text-gray-400 mt-1">התצוגה המקדימה משתמשת בנתוני דוגמה בלבד. שמירה תמיד RAW.</div>
                </div>
              )}

              {/* מקרא */}
              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="bg-gray-800 p-3 rounded">
                  <h4 className="font-semibold mb-2">מה מופיע בתבנית הנוכחית</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <div className="text-sm text-gray-300">פלייסהולדרים:</div>
                      <div className="text-xs text-gray-400 break-words">{usedPlaceholders.length ? usedPlaceholders.map((p) => `%${p}%`).join(", ") : "—"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-300">IF blocks:</div>
                      <div className="text-xs text-gray-400 break-words">{usedIfs.length ? usedIfs.map((b) => `%IF_${b}_START%…%IF_${b}_END%`).join(" | ") : "—"}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <h4 className="font-semibold mb-2">נתמכים כללית</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <div className="text-sm text-gray-300">פלייסהולדרים:</div>
                      <div className="text-xs text-gray-400 break-words">{GLOBAL_PLACEHOLDERS.map((p) => `%${p}%`).join(", ")}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-300">IF blocks:</div>
                      <div className="text-xs text-gray-400 break-words">{GLOBAL_IF_BLOCKS.map((b) => `%IF_${b}_START%…%IF_${b}_END%`).join(" | ")}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">התבניות נשמרות RAW. העיבוד נעשה רק בתצוגה מקדימה ובמחולל הפיד.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PanelFrame>
  );
}

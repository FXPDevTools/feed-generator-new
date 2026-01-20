"use client";

import PanelFrame from "../../PanelFrame";
import PanelButton from "../../hooks/PanelButton";
import usePanelCodeInfo from "../../hooks/usePanelCodeInfo";
import { useEffect, useState } from "react";
import { authenticatedFetch } from "../../../../../lib/api-client.js";

export default function LeaderSettingsPage() {
  const info = usePanelCodeInfo();
  const role = info?.role || '';
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await authenticatedFetch('/api/panel/leader/settings/error-user', { cache: 'no-store' });
        const data = await res.json();
        if (res.ok) setValue(data?.id || '');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSave = async () => {
    setSaving(true);
    try {
      const res = await authenticatedFetch('/api/panel/leader/settings/error-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || 'שמירה נכשלה');
        return;
      }
      setValue(data.id || '');
      alert('נשמר');
    } catch (e) {
      alert('שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PanelFrame title="הגדרות פיד" role={role}>
      <div className="w-full space-y-4">
        <div className="bg-gray-900 p-4 rounded">
          <h3 className="text-lg font-bold mb-2">משתמש לפנייה (&quot;מצאתם טעות?&quot;)</h3>
          <p className="text-sm text-gray-400 mb-2">ניתן להזין ID בלבד או קישור מלא לפרופיל; אנחנו נשמור רק את ה־ID.</p>
          {loading ? (
            <div>טוען…</div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                className="w-full rounded bg-gray-800 p-2"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="לדוגמה: 12345 או https://forum.example.com/member.php?u=12345"
              />
              <div className="flex gap-2">
                <PanelButton className="bg-green-600 hover:bg-green-700" onClick={onSave} disabled={saving || !String(value).trim()}>
                  {saving ? 'שומר…' : 'שמור'}
                </PanelButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </PanelFrame>
  );
}

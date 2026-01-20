"use client";

import { useEffect, useState } from 'react';
import PanelFrame from '../PanelFrame';
import usePanelCodeInfo from '../hooks/usePanelCodeInfo';
import { authenticatedFetch } from '../../../../lib/api-client.js';

const panelKeys = [
  { key: 'feed', label: 'פאנל פיד' },
  { key: 'eruhim', label: 'פאנל אירוחים' },
  { key: 'leader', label: 'פאנל ראש צוות' },
  { key: 'admin', label: 'פאנל אדמין' },
];

export default function ManageCodes() {
  const info = usePanelCodeInfo();
  const role = info?.role || '';
  const [codes, setCodes] = useState([]);
  const [originalCodes, setOriginalCodes] = useState([]);
  const [newCode, setNewCode] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newPanels, setNewPanels] = useState([]);

  useEffect(() => {
    authenticatedFetch('/api/panel/access/get')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched access codes:', data);
        setCodes(data);
        setOriginalCodes(data);
      })
      .catch((e) => {
        console.log('Failed to fetch access codes', e);
        setCodes([]);
      });
  }, []);

  const handlePanelChange = (panel) => {
    setNewPanels(prev => prev.includes(panel) ? prev.filter(p => p !== panel) : [...prev, panel]);
  };

  const handleAddCode = async () => {
    if (!newCode || !newRole || newPanels.length === 0) return;
    const updatedCodes = [...codes, { code: newCode, role: newRole, panels: newPanels }];
    setCodes(updatedCodes);

    // Auto-save immediately to prevent confusion
    const res = await authenticatedFetch('/api/panel/access/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCodes)
    });

    if (res.ok) {
      setOriginalCodes(updatedCodes);
      setNewCode('');
      setNewRole('');
      setNewPanels([]);
      alert('משתמש נוסף בהצלחה!');
    } else {
      alert('שגיאה בשמירה: ' + (await res.text()));
    }
  };

  const handleDeleteCode = (code) => {
    setCodes(codes.filter(c => c.code !== code));
  };


  const handlePanelToggle = (code, panel) => {
    setCodes(codes.map(c => c.code === code ? { ...c, panels: c.panels.includes(panel) ? c.panels.filter(p => p !== panel) : [...c.panels, panel] } : c));
  };

  // Detect unsaved changes (always up to date)
  const isChanged = JSON.stringify(codes) !== JSON.stringify(originalCodes);

  return (
    <PanelFrame title="ניהול קודי גישה" role={role}>
      {role === 'אדמין' && (
        <div className="w-full mb-8 bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h2 className="text-xl mb-4">הוספת קוד חדש</h2>
          <div className="space-y-3">
            <input
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              placeholder="קוד חדש (למשל: סיסמה123)"
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
            />

            <select
              value={newRole}
              onChange={e => {
                const r = e.target.value;
                setNewRole(r);
                // Auto-select panels based on role
                let p = [];
                switch (r) {
                  case 'עורך': p = ['feed']; break;
                  case 'אחראי אירוחים': p = ['eruhim']; break;
                  case 'ראש צוות': p = ['feed', 'eruhim', 'leader']; break;
                  case 'אדמין': p = ['feed', 'eruhim', 'leader', 'admin']; break;
                }
                if (p.length) setNewPanels(p);
              }}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="">בחר דרגה...</option>
              <option value="עורך">עורך (גישה למחולל הפיד)</option>
              <option value="אחראי אירוחים">אחראי אירוחים (גישה למחולל האירוחים)</option>
              <option value="ראש צוות">ראש צוות (גישה להכל + פאנל ניהול צוות)</option>
              <option value="אדמין">אדמין (גישה מלאה להכל)</option>
            </select>

            <div className="space-y-2">
              <label className="text-gray-400 text-sm">גישות (מתעדכן אוטומטית, ניתן לשינוי ידני):</label>
              <div className="grid grid-cols-2 gap-2">
                {panelKeys.map(panel => (
                  <label key={panel.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newPanels.includes(panel.key)}
                      onChange={() => handlePanelChange(panel.key)}
                      className="scale-125 accent-blue-500"
                    />
                    <span>{panel.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <button
              onClick={handleAddCode}
              className="w-full bg-blue-600 px-4 py-3 rounded font-semibold hover:bg-blue-700 transition"
            >
              הוסף משתמש חדש
            </button>
          </div>
        </div>
      )}
      <div className="w-full">
        <h2 className="text-xl mb-2">קודים קיימים</h2>

        {/* Mobile view - Cards */}
        <div className="block md:hidden space-y-4">
          {codes && codes
            .filter(code => role === 'אדמין' || (role === 'ראש צוות' && code.editableByLeader))
            .map((code, idx) => {
              const handleCodeChange = (e) => {
                const newVal = e.target.value;
                setCodes(prev => prev.map((c, i) => i === idx ? { ...c, code: newVal } : c));
              };
              const handleCodeKeyDown = async (e) => {
                if (e.key === 'Enter') {
                  const res = await authenticatedFetch('/api/panel/access/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(codes)
                  });
                  if (res.ok) {
                    alert('השינויים נשמרו בהצלחה!');
                    setOriginalCodes(codes);
                  } else {
                    alert('שגיאה בשמירה: ' + (await res.text()));
                  }
                }
              };
              const handleEditableChange = (e) => {
                const checked = e.target.checked;
                setCodes(prev => prev.map((c, i) => i === idx ? { ...c, editableByLeader: checked } : c));
              };

              return (
                <div key={idx} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  {role === 'ראש צוות' ? (
                    // Team leader view - simpler layout for mobile
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">קוד:</span>
                        <input
                          type="text"
                          value={code.code}
                          onChange={handleCodeChange}
                          className="w-20 p-2 rounded bg-gray-700 text-white text-center border border-gray-600"
                          onKeyDown={handleCodeKeyDown}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">דרגה:</span>
                        <span className="text-white">{code.role}</span>
                      </div>
                    </div>
                  ) : (
                    // Admin view - full layout for mobile
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">קוד:</span>
                          <input
                            type="text"
                            value={code.code}
                            onChange={handleCodeChange}
                            className="w-20 p-2 rounded bg-gray-700 text-white text-center border border-gray-600"
                            onKeyDown={handleCodeKeyDown}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">דרגה:</span>
                          <span className="text-white">{code.role}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">עריכת ראש צוות:</span>
                          <input
                            type="checkbox"
                            checked={!!code.editableByLeader}
                            onChange={handleEditableChange}
                            className="w-4 h-4"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-gray-400 text-sm">פאנלים:</span>
                        <div className="grid grid-cols-2 gap-2">
                          {panelKeys.map(panel => (
                            <label key={panel.key} className="flex items-center gap-2 text-sm bg-gray-700 p-2 rounded">
                              <input
                                type="checkbox"
                                checked={code.panels.includes(panel.key)}
                                onChange={() => handlePanelToggle(code.code, panel.key)}
                                className="w-4 h-4"
                              />
                              <span className="text-xs">{panel.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {code.role !== 'אדמין' && (
                        <div className="flex justify-center pt-2 border-t border-gray-700">
                          <button
                            onClick={() => handleDeleteCode(code.code)}
                            className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded transition text-sm font-medium"
                          >
                            מחק קוד
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Desktop view - Cards like mobile but wider */}
        <div className="hidden md:block space-y-4">
          {codes && codes
            .filter(code => role === 'אדמין' || (role === 'ראש צוות' && code.editableByLeader))
            .map((code, idx) => {
              const handleCodeChange = (e) => {
                const newVal = e.target.value;
                setCodes(prev => prev.map((c, i) => i === idx ? { ...c, code: newVal } : c));
              };
              const handleCodeKeyDown = async (e) => {
                if (e.key === 'Enter') {
                  const res = await authenticatedFetch('/api/panel/access/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(codes)
                  });
                  if (res.ok) {
                    alert('השינויים נשמרו בהצלחה!');
                    setOriginalCodes(codes);
                  } else {
                    alert('שגיאה בשמירה: ' + (await res.text()));
                  }
                }
              };
              const handleEditableChange = (e) => {
                const checked = e.target.checked;
                setCodes(prev => prev.map((c, i) => i === idx ? { ...c, editableByLeader: checked } : c));
              };

              return (
                <div key={idx} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                  {role === 'ראש צוות' ? (
                    // Team leader view - simpler layout
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400 text-sm">קוד:</span>
                        <input
                          type="text"
                          value={code.code}
                          onChange={handleCodeChange}
                          className="w-24 p-2 rounded bg-gray-700 text-white text-center border border-gray-600"
                          onKeyDown={handleCodeKeyDown}
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400 text-sm">דרגה:</span>
                        <span className="text-white">{code.role}</span>
                      </div>
                    </div>
                  ) : (
                    // Admin view - full layout
                    <div className="space-y-4">
                      <div className="flex items-center gap-8">
                        <div className="flex items-center gap-4">
                          <span className="text-gray-400 text-sm">קוד:</span>
                          <input
                            type="text"
                            value={code.code}
                            onChange={handleCodeChange}
                            className="w-24 p-2 rounded bg-gray-700 text-white text-center border border-gray-600"
                            onKeyDown={handleCodeKeyDown}
                          />
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-400 text-sm">דרגה:</span>
                          <span className="text-white">{code.role}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-400 text-sm">עריכת ראש צוות:</span>
                          <input
                            type="checkbox"
                            checked={!!code.editableByLeader}
                            onChange={handleEditableChange}
                            className="w-4 h-4"
                          />
                        </div>
                        {code.role !== 'אדמין' && (
                          <button
                            onClick={() => handleDeleteCode(code.code)}
                            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition text-sm font-medium"
                          >
                            מחק
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-gray-400 text-sm">פאנלים:</span>
                        <div className="grid grid-cols-4 gap-3">
                          {panelKeys.map(panel => (
                            <label key={panel.key} className="flex items-center gap-2 text-sm bg-gray-700 p-3 rounded">
                              <input
                                type="checkbox"
                                checked={code.panels.includes(panel.key)}
                                onChange={() => handlePanelToggle(code.code, panel.key)}
                                className="w-4 h-4"
                              />
                              <span>{panel.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
        <button
          onClick={async () => {
            if (!isChanged) return;
            const res = await authenticatedFetch('/api/panel/access/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(codes)
            });
            if (res.ok) {
              alert('השינויים נשמרו בהצלחה!');
              setOriginalCodes(codes);
            } else {
              alert('שגיאה בשמירה: ' + (await res.text()));
            }
          }}
          disabled={!isChanged}
          className={`w-full font-semibold py-2 rounded mt-8 transition border ${isChanged ? 'bg-green-600 text-white border-green-700 hover:bg-green-700' : 'bg-gray-700 text-gray-400 border-gray-500 cursor-not-allowed'}`}
          style={{ boxShadow: 'none' }}
        >
          שמור שינויים
        </button>
      </div>
    </PanelFrame >
  );
}

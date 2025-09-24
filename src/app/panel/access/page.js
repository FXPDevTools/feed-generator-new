"use client";
import { useEffect, useState, useRef } from 'react';

const panelKeys = [
  { key: 'feed', label: 'פאנל פיד' },
  { key: 'eruhim', label: 'פאנל אירוחים' },
  { key: 'leader', label: 'פאנל ראש צוות' },
  { key: 'admin', label: 'פאנל אדמין' },
];

export default function ManageCodes() {
  const [codes, setCodes] = useState([]);
  const [originalCodes, setOriginalCodes] = useState([]);
  const [newCode, setNewCode] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newPanels, setNewPanels] = useState([]);
  const [role, setRole] = useState('');
  useEffect(() => {
    const code = sessionStorage.getItem('panelCode');
    if (!code) return;
  fetch('/api/panel/admin/access/get')
      .then(res => res.json())
      .then(data => {
  setCodes(data);
  setOriginalCodes(data);
        const found = data.find(item => item.code === code);
        setRole(found ? found.role : '');
      })
      .catch(() => setCodes([]));
  }, []);

  const handlePanelChange = (panel) => {
    setNewPanels(prev => prev.includes(panel) ? prev.filter(p => p !== panel) : [...prev, panel]);
  };

  const handleAddCode = () => {
    if (!newCode || !newRole || newPanels.length === 0) return;
  setCodes([...codes, { code: newCode, role: newRole, panels: newPanels }]);
    setNewCode('');
    setNewRole('');
    setNewPanels([]);
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
    <main className="flex flex-1 flex-col items-center justify-center p-8 bg-transparent text-white">
      <div className="max-w-2xl w-full bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col gap-8 items-center">
        <h1 className="text-3xl mb-4 font-bold">ניהול קודי גישה</h1>
        {role === 'אדמין' && (
          <div className="w-full mb-8">
            <h2 className="text-xl mb-2">הוספת קוד חדש</h2>
            <input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="קוד חדש" className="w-full p-2 mb-2 rounded bg-gray-700 text-white" />
            <input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="שם דרגה" className="w-full p-2 mb-2 rounded bg-gray-700 text-white" />
            <div className="flex gap-2 mb-2">
              {panelKeys.map(panel => (
                <label key={panel.key} className="flex items-center gap-1">
                  <input type="checkbox" checked={newPanels.includes(panel.key)} onChange={() => handlePanelChange(panel.key)} />
                  {panel.label}
                </label>
              ))}
            </div>
            <button onClick={handleAddCode} className="bg-blue-600 px-4 py-2 rounded">הוסף קוד</button>
          </div>
        )}
        <div className="w-full">
          <h2 className="text-xl mb-2">קודים קיימים</h2>
          <table className="w-full text-right">
            <thead>
              <tr>
                <th>קוד</th>
                <th>דרגה</th>
                {role === 'אדמין' && <th>פאנלים</th>}
                {role === 'אדמין' && <th>אישור עריכת ראש</th>}
                {role === 'אדמין' && <th>מחיקה</th>}
              </tr>
            </thead>
            <tbody>
              {codes
                .filter(code => role === 'אדמין' || (role === 'ראש צוות' && code.editableByLeader))
                .map((code, idx) => {
                  const handleCodeChange = (e) => {
                    const newVal = e.target.value;
                    setCodes(prev => prev.map((c, i) => i === idx ? { ...c, code: newVal } : c));
                  };
                  const handleCodeKeyDown = async (e) => {
                    if (e.key === 'Enter') {
                      // מפעיל את שמירת השינויים
                      const res = await fetch('/api/panel/admin/access/save', {
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
                  if (role === 'ראש צוות') {
                    return (
                      <tr key={idx} className="border-b border-gray-700">
                        <td>
                          <input
                            type="text"
                            value={code.code}
                             onChange={handleCodeChange}
                             className="w-24 p-1 rounded bg-gray-700 text-white text-center text-sm border border-gray-600"
                            onKeyDown={handleCodeKeyDown}
                          />
                        </td>
                        <td>{code.role}</td>
                      </tr>
                    );
                  }
                  // אדמין רואה הכל
                  const handleEditableChange = (e) => {
                    const checked = e.target.checked;
                    setCodes(prev => prev.map((c, i) => i === idx ? { ...c, editableByLeader: checked } : c));
                  };
                  return (
                    <tr key={idx} className="border-b border-gray-700">
                      <td>
                        <input
                          type="text"
                          value={code.code}
                          onChange={handleCodeChange}
                          className="w-24 p-1 rounded bg-gray-700 text-white text-center text-sm border border-gray-600"
                          onKeyDown={handleCodeKeyDown}
                        />
                      </td>
                      <td>{code.role}</td>
                      <td>
                        {panelKeys.map(panel => (
                          <label key={panel.key} className="flex items-center gap-1">
                            <input type="checkbox" checked={code.panels.includes(panel.key)} onChange={() => handlePanelToggle(code.code, panel.key)} />
                            {panel.label}
                          </label>
                        ))}
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!code.editableByLeader}
                          onChange={handleEditableChange}
                        />
                      </td>
                      <td>
                        {code.role !== 'אדמין' && (
                          <button onClick={() => handleDeleteCode(code.code)} className="bg-red-600 px-2 py-1 rounded">מחק</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          <button
            onClick={async () => {
              if (!isChanged) return;
              const res = await fetch('/api/panel/admin/access/save', {
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
      </div>
    </main>
  );
}

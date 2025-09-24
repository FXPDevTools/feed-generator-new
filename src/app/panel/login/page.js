"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PanelLogin() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
  const res = await fetch('/api/panel/admin/access/get');
      const data = await res.json();
      const found = data.find(item => item.code === code);
      const panels = found ? found.panels : [];
      if (panels && panels.length > 0) {
        sessionStorage.setItem('panelCode', code);
        router.push('/panel');
      } else {
        setError('קוד לא תקין');
      }
    } catch (err) {
      setError('שגיאה בשרת');
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8 bg-transparent text-white">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col gap-8 items-center">
        <h1 className="text-3xl mb-4 font-bold">כניסה לפאנל</h1>
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <input
            type="password"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="הכנס קוד גישה"
            className="w-full p-3 rounded bg-gray-700 text-white text-xl"
          />
          {error && <div className="text-red-400 text-center">{error}</div>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded text-xl transition">כניסה</button>
        </form>
      </div>
    </main>
  );
}

"use client";
import { useEffect, useState } from 'react';
import { getPanelsForCode, getRoleForCode } from './access';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const panelButtons = [
  { key: 'feed', label: 'פאנל פיד', color: '#3366cc' },
  { key: 'eruhim', label: 'פאנל אירוחים', color: '#808000' },
  { key: 'leader', label: 'פאנל ראש צוות', color: '#006699' },
  { key: 'admin', label: 'פאנל אדמין', color: '#00897b' },
];

export default function PanelHome() {
  const [allowedPanels, setAllowedPanels] = useState([]);
  const [role, setRole] = useState('');
  const router = useRouter();

  useEffect(() => {
    const code = sessionStorage.getItem('panelCode');
    if (!code) {
      router.push('/panel/login');
      return;
    }
    setAllowedPanels(getPanelsForCode(code));
    setRole(getRoleForCode(code));
  }, [router]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8 bg-transparent text-white">
      <div className="max-w-xl w-full bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col gap-8 items-center">
        <h1 className="text-4xl mb-4 font-bold">מרכז הפאנלים</h1>
        <p className="text-xl text-gray-400 mb-8">דרגתך: {role || '---'}</p>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          {panelButtons.filter(btn => allowedPanels.includes(btn.key)).map(btn => (
            <div key={btn.key}>
              <Link href={`/panel/${btn.key}`} className="block w-full text-white font-bold py-4 rounded text-center text-xl transition" style={{ backgroundColor: btn.color }}>
                {btn.label}
              </Link>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem('panelCode');
            router.push('/panel/login');
          }}
          className="w-full border border-gray-500 text-gray-300 font-semibold py-2 rounded mt-12 hover:bg-gray-700 transition"
          style={{ boxShadow: 'none', background: 'transparent' }}
        >
          ניתוק
        </button>
      </div>
    </main>
  );
}

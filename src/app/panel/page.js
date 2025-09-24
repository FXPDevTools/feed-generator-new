"use client";

import { useEffect, useState } from 'react';
import PanelButton from './PanelButton';
import { useRouter } from 'next/navigation';
import PanelLayout from './PanelLayout';

const panelButtons = [
  { key: 'feed', label: 'פאנל פיד', color: '#3366cc' },
  { key: 'eruhim', label: 'פאנל אירוחים', color: '#808000' },
  { key: 'leader', label: 'פאנל ראש צוות', color: '#006699' },
  { key: 'admin', label: 'פאנל אדמין', color: '#00897b' },
];

export default function PanelHome() {
  const [allowedPanels, setAllowedPanels] = useState([]);
  const [role, setRole] = useState('');
  const [checked, setChecked] = useState(false);
  const router = useRouter();


  useEffect(() => {
    const code = sessionStorage.getItem('panelCode');
    if (!code) {
      router.push('/panel/login');
      setTimeout(() => setChecked(true), 0); // ensure rerender after navigation
      return;
    }
    (async () => {
      try {
  const res = await fetch('/api/panel/admin/access/get');
        const data = await res.json();
        const found = data.find(item => item.code === code);
        setAllowedPanels(found && found.panels ? found.panels : []);
        setRole(found && found.role ? found.role : '');
      } catch (err) {
        setAllowedPanels([]);
        setRole('');
      } finally {
        setChecked(true);
      }
    })();
  }, [router]);

  if (!checked) return (
    <div className="flex items-center justify-center min-h-[200px] text-lg text-gray-400">טוען...</div>
  );

  return (
    <PanelLayout title="מרכז הפאנלים" role={role}>
      <div className="w-full grid grid-cols-2 gap-4 px-0" dir="rtl">
        {(() => {
          const filtered = panelButtons.filter(btn => allowedPanels.includes(btn.key));
          const rows = [];
          for (let i = 0; i < filtered.length; i += 2) {
            const row = filtered.slice(i, i + 2);
            row.forEach((btn, j) => {
              rows.push(
                <PanelButton
                  as="a"
                  href={`/panel/${btn.key}`}
                  key={btn.key}
                  className={
                    "text-xl text-center font-bold text-white rounded-lg shadow-md" +
                    (row.length === 1 ? " col-span-2" : "")
                  }
                  style={{ backgroundColor: btn.color }}
                >
                  {btn.label}
                </PanelButton>
              );
            });
          }
          return rows;
        })()}
      </div>
      <PanelButton
        onClick={() => {
          sessionStorage.removeItem('panelCode');
          router.push('/panel/login');
        }}
        className="w-full mt-12 text-xl text-center bg-gray-700 hover:bg-gray-800 text-gray-200"
      >
        ניתוק
      </PanelButton>
    </PanelLayout>
  );
}

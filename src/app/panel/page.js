"use client";

import PanelButton from './hooks/PanelButton';
import { useRouter } from 'next/navigation';
import PanelFrame from './PanelFrame';
import { useEffect, useState } from 'react';

const panelButtons = [
  { key: 'feed', label: 'פאנל פיד', color: '#3366cc' },
  { key: 'eruhim', label: 'פאנל אירוחים', color: '#808000' },
  { key: 'leader', label: 'פאנל ראש צוות', color: '#006699' },
  { key: 'admin', label: 'פאנל אדמין', color: '#00897b' },
];

export default function PanelHome({ role }) {
  const [allowedPanels, setAllowedPanels] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const code = typeof window !== 'undefined' ? sessionStorage.getItem('panelCode') : null;
    (async () => {
      try {
        if (!code) return;
        const res = await fetch('/api/panel/admin/access/get');
        const data = await res.json();
        const found = data.find(item => item.code === code);
        setAllowedPanels(found && found.panels ? found.panels : []);
      } catch (err) {
        setAllowedPanels([]);
      }
    })();
  }, []);

  const actions = panelButtons
    .filter(btn => allowedPanels.includes(btn.key))
    .map(btn => (
      <PanelButton
        as="a"
        href={`/panel/${btn.key}`}
        key={btn.key}
        className="text-xl text-center font-bold text-white rounded-lg shadow-md"
        style={{ backgroundColor: btn.color }}
      >
        {btn.label}
      </PanelButton>
    ));

  return (
    <PanelFrame title="מרכז הפאנלים" role={role} actions={actions}>
      <PanelButton
        onClick={() => {
          sessionStorage.removeItem('panelCode');
          router.push('/panel/login');
        }}
        className="w-full mt-12 text-xl text-center bg-gray-700 hover:bg-gray-800 text-gray-200"
      >
        ניתוק
      </PanelButton>
    </PanelFrame>
  );
}

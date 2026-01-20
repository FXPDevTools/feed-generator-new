"use client";

import PanelButton from './hooks/PanelButton';
import { useRouter } from 'next/navigation';
import PanelFrame from './PanelFrame';
import usePanelCodeInfo from './hooks/usePanelCodeInfo';

const panelButtons = [
  { key: 'feed', label: 'פאנל פיד', color: '#3366cc' },
  { key: 'eruhim', label: 'פאנל אירוחים', color: '#808000' },
  { key: 'leader', label: 'פאנל ראש צוות', color: '#006699' },
  { key: 'admin', label: 'פאנל אדמין', color: '#00897b' },
];

export default function PanelHome() {
  const info = usePanelCodeInfo();
  const allowedPanels = info?.panels || [];
  const foundRole = info?.role || '';
  const router = useRouter();

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
    <PanelFrame title="מרכז הפאנלים" role={foundRole} actions={actions}>
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

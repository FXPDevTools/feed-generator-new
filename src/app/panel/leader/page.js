"use client";

import PanelButton from '../hooks/PanelButton';
import PanelFrame from '../PanelFrame';
import usePanelCodeInfo from '../hooks/usePanelCodeInfo';

export default function LeaderPanel() {
  const info = usePanelCodeInfo();
  const role = info?.role || '';
  const actions = [
    <PanelButton as="a" href="/panel/access" key="access" className="text-xl text-center rounded-lg shadow-md font-bold bg-gray-700 hover:bg-gray-800 text-gray-200">ניהול גישות</PanelButton>
  ];
  return (
    <PanelFrame title="פאנל ראש צוות" role={role} actions={actions} />
  );
}

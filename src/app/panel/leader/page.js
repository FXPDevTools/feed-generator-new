"use client";

import PanelButton from '../hooks/PanelButton';
import PanelFrame from '../PanelFrame';
import usePanelCodeInfo from '../hooks/usePanelCodeInfo';

export default function LeaderPanel() {
  const info = usePanelCodeInfo();
  const role = info?.role || '';
  const actions = [
    <PanelButton as="a" href="/panel/access" key="access" className="text-xl text-center rounded-lg shadow-md font-bold bg-gray-700 hover:bg-gray-800 text-gray-200">ניהול גישות</PanelButton>,
    <PanelButton as="a" href="/panel/leader/settings" key="settings" className="text-xl text-center rounded-lg shadow-md font-bold bg-blue-700 hover:bg-blue-800 text-white">הגדרות פיד</PanelButton>
  ];
  return (
    <PanelFrame title="פאנל ראש צוות" role={role} actions={actions} />
  );
}

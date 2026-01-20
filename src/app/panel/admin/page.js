"use client";

import PanelButton from '../hooks/PanelButton';
import PanelFrame from '../PanelFrame';
import usePanelCodeInfo from '../hooks/usePanelCodeInfo';

export default function AdminPanel() {
  const info = usePanelCodeInfo();
  const role = info?.role || '';
  const actions = [
    <PanelButton as="a" href="/panel/access" key="access" className="text-xl text-center rounded-lg shadow-md font-bold bg-gray-700 hover:bg-gray-800 text-gray-200">ניהול גישות</PanelButton>,
    <PanelButton as="a" href="/panel/admin/credits" key="credits" className="text-xl text-center rounded-lg shadow-md font-bold bg-blue-700 hover:bg-blue-800 text-blue-200">ניהול קרדיטים בפוטר</PanelButton>
  ];
  return (
    <PanelFrame title="פאנל אדמין" role={role} actions={actions} />
  );
}

"use client";

import PanelButton from '../hooks/PanelButton';
import PanelFrame from '../PanelFrame';
import usePanelCodeInfo from '../hooks/usePanelCodeInfo';

export default function FeedPanel() {
  const info = usePanelCodeInfo();
  const role = info?.role || '';
  const actions = [
    <PanelButton key="example" className="text-xl text-center rounded-lg shadow-md font-bold bg-blue-700 hover:bg-blue-800 text-white">פעולה לדוגמה</PanelButton>
  ];
  return (
    <PanelFrame title="פאנל עורך פיד" role={role} actions={actions} />
  );
}

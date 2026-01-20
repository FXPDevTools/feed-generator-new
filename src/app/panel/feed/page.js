"use client";

import PanelButton from '../hooks/PanelButton';
import PanelFrame from '../PanelFrame';
import usePanelCodeInfo from '../hooks/usePanelCodeInfo';

export default function FeedPanel() {
  const info = usePanelCodeInfo();
  const role = info?.role || '';
  const actions = [
    <PanelButton key="templates" as="a" href="/panel/feed/templates" className="text-xl text-center rounded-lg shadow-md font-bold bg-green-700 hover:bg-green-800 text-white">ניהול תבניות BBCode</PanelButton>,

  ];
  return (
    <PanelFrame title="פאנל עורך פיד" role={role} actions={actions} />
  );
}

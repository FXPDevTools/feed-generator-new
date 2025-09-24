"use client";


import PanelLayout from '../PanelLayout';

export default function EruhimPanel() {
  return (
      <div className="w-full grid grid-cols-2 gap-4">
        {(() => {
          const buttons = [
            { label: "פעולה לדוגמה", className: "bg-blue-700 hover:bg-blue-800 text-white" },
          ];
          const rows = [];
          for (let i = 0; i < buttons.length; i += 2) {
            const row = buttons.slice(i, i + 2);
            row.forEach((btn, j) => {
              rows.push(
                <PanelButton
                  key={btn.label}
                  className={
                    `text-xl text-center rounded-lg shadow-md font-bold ${btn.className}` +
                    (row.length === 1 ? " col-span-2" : "")
                  }
                >
                  {btn.label}
                </PanelButton>
              );
            });
          }
          return rows;
        })()}
      </div>
  );
}

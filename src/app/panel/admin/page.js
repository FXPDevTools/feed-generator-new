"use client";

import PanelButton from '../hooks/PanelButton';

export default function AdminPanel() {
  return (
      <div className="w-full grid grid-cols-2 gap-4">
        {(() => {
          const buttons = [
            { href: "/panel/access", label: "ניהול גישות", className: "bg-gray-700 hover:bg-gray-800 text-gray-200" },
            { href: "/panel/admin/credits", label: "ניהול קרדיטים בפוטר", className: "bg-blue-700 hover:bg-blue-800 text-blue-200" },
          ];
          const rows = [];
          for (let i = 0; i < buttons.length; i += 2) {
            const row = buttons.slice(i, i + 2);
            row.forEach((btn, j) => {
              rows.push(
                <PanelButton
                  as="a"
                  href={btn.href}
                  key={btn.href}
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

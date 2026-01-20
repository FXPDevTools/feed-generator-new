// תבנית עיצובית אחידה לכל הפאנלים

import React from 'react';

export default function PanelFrame({ title, role, actions, children }) {
  // If actions is an array, render as grid of 2 columns, last button full width if odd
  let actionsGrid = null;
  if (Array.isArray(actions) && actions.length > 0) {
    const rows = [];
    for (let i = 0; i < actions.length; i += 2) {
      const row = actions.slice(i, i + 2);
      // Base clones to ensure full width inside the slot
      let first = React.isValidElement(row[0]) ? React.cloneElement(row[0], { className: `${row[0].props.className || ''} w-full`.trim() }) : row[0];
      let second = row[1] && React.isValidElement(row[1]) ? React.cloneElement(row[1], { className: `${row[1].props.className || ''} w-full`.trim() }) : row[1];
      if (row.length === 2) {
        // For pairs, make inner corners square so the center gap looks clean and centered
        if (React.isValidElement(first)) {
          first = React.cloneElement(first, { className: `${first.props.className}`.trim() });
        }
        if (React.isValidElement(second)) {
          second = React.cloneElement(second, { className: `${second.props.className}`.trim() });
        }
        rows.push(
          <div key={i} className="grid grid-cols-2 gap-x-4 w-full mb-3">
            <div className="w-full">{first}</div>
            <div className="w-full">{second}</div>
          </div>
        );
      } else {
        rows.push(
          <div key={i} className="grid grid-cols-2 gap-x-4 w-full mb-3">
            <div className="col-span-2 w-full">{first}</div>
          </div>
        );
      }
    }
    actionsGrid = <div className="w-full mb-4">{rows}</div>;
  } else if (actions) {
    actionsGrid = <div className="flex gap-2 flex-wrap mb-4">{actions}</div>;
  }
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8 bg-transparent text-white">
      <div className="max-w-xl w-full bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col gap-8 items-center">
        <h1 className="text-4xl mb-4 font-bold">{title}</h1>
        {(
          <p className="text-xl text-gray-400 mb-4">דרגתך: {role || '---'}</p>
        )}
        {actionsGrid}
        {children}
      </div>
    </main>
  );
}

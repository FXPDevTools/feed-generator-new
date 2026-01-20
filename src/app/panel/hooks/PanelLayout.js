"use client";

export default function PanelLayout({ title, role, children, actions }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8 bg-transparent text-white">
      <div className="max-w-xl w-full bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col gap-8 items-center">
        <h1 className="text-4xl mb-4 font-bold">{title}</h1>
        {role !== undefined && (
          <p className="text-xl text-gray-400 mb-4">דרגתך: {role || '---'}</p>
        )}
        {actions && <div className="flex gap-2 flex-wrap mb-4">{actions}</div>}
        {children}
      </div>
    </main>
  );
}

"use client";
import { useEffect, useState } from 'react';

export default function Footer() {
  const [credits, setCredits] = useState([]);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await fetch('/api/footer/credits');
        const data = await res.json();
        setCredits(data);
      } catch (err) {
        setCredits([]);
      }
    };

    fetchCredits();
  }, []);

  return (
    <footer className="w-full text-center py-6 bg-gray-800 text-gray-300 text-lg mt-auto">
      קרדיט:
      {credits && credits.length > 0 && credits.map((c, i) => (
        <span key={i}>
          <a
            href={c.profile}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline mx-2"
          >
            {c.nick}
          </a>
          {i < credits.length - 1 && <span>&amp;</span>}
        </span>
      ))}
    </footer>
  );
}
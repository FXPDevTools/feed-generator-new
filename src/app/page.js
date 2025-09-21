"use client";
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900 text-white">
      <div className="max-w-xl w-full bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col gap-8 items-center">
        <h1 className="text-5xl font-bold mb-4">מחולל התוכן</h1>
        <p className="text-xl text-gray-400 mb-12">בחר את סוג התוכן שברצונך ליצור</p>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* כפתור למחולל פיד */}
          <div>
            <Link href="/feed?dept=feed" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded text-center text-xl transition">
              מחולל כתבות פיד
            </Link>
          </div>
          {/* כפתור למחולל אירוחים */}
          <div>
            <Link href="/eruhim" className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded text-center text-xl transition">
              מחולל אירוחים
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
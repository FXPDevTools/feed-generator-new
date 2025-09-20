"use client";
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">מחולל התוכן</h1>
        <p className="text-xl text-gray-400 mb-12">בחר את סוג התוכן שברצונך ליצור</p>
        
        <div className="flex justify-center gap-8">
          {/* כפתור למחולל פיד */}
          <Link href="/feed?dept=feed">
            <span className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-transform transform hover:scale-105">
              מחולל כתבות פיד
            </span>
          </Link>
          
          {/* כפתור למחולל אירוחים */}
          <Link href="/eruhim">
            <span className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-transform transform hover:scale-105">
              מחולל אירוחים
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
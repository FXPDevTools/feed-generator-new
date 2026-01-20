"use client";
import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8 bg-transparent text-white">
      <div className="max-w-xl w-full bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col gap-8 items-center">
        <h1 className="text-5xl mb-4" style={{ fontWeight: 'bold' }}>מחולל התוכן</h1>
        <p className="text-xl text-gray-400 mb-12">בחר את סוג התוכן שברצונך ליצור</p>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* כפתור למחולל פיד */}
          <div>
            <Link href="/feed" className="block w-full text-white font-bold py-4 rounded text-center text-xl transition" style={{ backgroundColor: '#3366cc' }}>
              מחולל כתבות פיד
            </Link>
          </div>
          {/* כפתור למחולל אירוחים */}
          <div>
            <Link href="/eruhim" className="block w-full text-white font-bold py-4 rounded text-center text-xl transition" style={{ backgroundColor: '#808000' }}>
              מחולל אירוחים
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
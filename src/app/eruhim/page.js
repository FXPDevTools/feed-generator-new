import Link from 'next/link';
import BackButtons from '../BackButtons';

export default function EruhimHome() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8 bg-transparent text-white">
      <div className="max-w-xl w-full bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col gap-8 items-center">
        <BackButtons />
        <h1 className="text-5xl mb-4" style={{ color: '#808000', fontWeight: 'bold' }}>מרכז האירוחים</h1>
        <p className="text-xl text-gray-400 mb-12">בחר את סוג האירוח שברצונך ליצור</p>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Link href="/eruhim/suggest" className="block w-full text-white font-bold py-4 rounded text-center text-xl transition" style={{ backgroundColor: '#6b8e23' }}>
              הצעת אירוח
            </Link>
          </div>
          <div>
            <Link href="/eruhim/interviews" className="block w-full text-white font-bold py-4 rounded text-center text-xl transition" style={{ backgroundColor: '#8a9a5b' }}>
              בניית ריאיון
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

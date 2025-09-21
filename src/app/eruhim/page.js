import Link from 'next/link';

export default function EruhimHome() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900 text-white">
      <div className="max-w-xl w-full bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col gap-8 items-center">
        <h1 className="text-4xl font-bold mb-4">מרכז האירוחים</h1>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Link href="/eruhim/suggest" className="block w-full bg-yellow-600 hover:bg-yellow-700 text-black font-semibold py-4 rounded text-center text-xl transition">הצעת אירוח</Link>
          </div>
          <div>
            <Link href="/eruhim/interviews" className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded text-center text-xl transition">בניית ריאיון</Link>
          </div>
        </div>
      </div>
    </main>
  );
}

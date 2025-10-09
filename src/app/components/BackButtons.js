"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BackButtons() {
  const pathname = usePathname();
  // דף הבית
  if (pathname === "/") return null;
  // דף אירוחים ראשי
  if (pathname === "/eruhim") return (
    <div className="w-full flex justify-end mb-4">
      <Link href="/" className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-6 rounded shadow">חזרה לדף הראשי</Link>
    </div>
  );
  // דפי אירוחים פנימיים
  if (pathname.startsWith("/eruhim/") && pathname !== "/eruhim") {
    return (
      <div className="w-full flex justify-end mb-4 gap-4">
        <Link href="/eruhim" className="bg-purple-700 hover:bg-purple-800 text-white font-bold py-2 px-6 rounded shadow">חזרה לדף אירוחים הראשי</Link>
        <Link href="/" className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-6 rounded shadow">חזרה לדף הראשי</Link>
      </div>
    );
  }
  // כל שאר הדפים
  return (
    <div className="w-full flex justify-end mb-4">
      <Link href="/" className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 px-6 rounded shadow">חזרה לדף הראשי</Link>
    </div>
  );
}

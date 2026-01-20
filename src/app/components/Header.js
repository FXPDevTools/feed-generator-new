"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
export default function Header() {
  const pathname = usePathname();
  const isPanel = pathname.startsWith("/panel");
  return (
    <header className="w-full bg-gray-900 border-b border-gray-700 py-3 shadow-md z-20 relative min-h-[120px] flex items-center justify-center">
      {/* כפתור לפאנל בפינה הימנית העליונה */}
      {!isPanel && (
        <Link
          href="/panel"
          className="text-white font-bold text-lg bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition"
          style={{position:'absolute', top:36, right:24, zIndex:10}}
        >
          לפאנל
        </Link>
      )}
      {/* לוגו ממורכז בדיוק כמו התוכן */}
      <div className="max-w-xl mx-auto w-full flex justify-center items-center">
        <Link href="/">
          <Image
            src="https://i.imagesup.co/images2/975accc8c23cb6943f3c828996d66e2a5fb0e09c.png"
            alt="Logo"
            width={300}
            height={112}
            className="h-28 w-auto mx-auto"
            style={{maxHeight:112}}
            priority
            unoptimized
          />
        </Link>
      </div>
    </header>
  );
}

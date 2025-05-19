// components/Navbar.tsx
import UserMenu from "./partials/user-menu/user-menu";
import Image from 'next/image';

export default function Navbar() {
  return (
    <header className="flex justify-between items-center p-4 bg-white border-b border-[#e9ecef] shadow-sm">
      <div className="flex items-center">
        <div className="bg-[#0c4b9e] p-2 rounded-md">
          <Image 
            src="/media/brand-logos/logo.webp" 
            alt="App Logo" 
            width={120} 
            height={40} 
            className="object-contain"
          />
        </div>
      </div>
      <UserMenu />
    </header>
  );
}
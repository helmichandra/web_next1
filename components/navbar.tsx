// components/Navbar.tsx
import UserMenu from "./partials/user-menu/user-menu";

export default function Navbar() {
  return (
    <header className="flex justify-between items-center p-4 bg-white border-b">
      <h1 className="text-xl font-semibold">App Name</h1>
      <UserMenu />
    </header>
  );
}

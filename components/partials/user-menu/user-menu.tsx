// components/UserMenu.tsx
"use client";

import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { LogOut, User } from "lucide-react";
import Image from "next/image";
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface DecodedToken {
  id: string;
  username: string;
  email: string;
  role: string;
  exp: number;
}

export default function UserMenu() {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [id, setId] = useState<string>("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem("token");
      
      if (storedToken) {
        try {
          const decoded = jwtDecode<DecodedToken>(storedToken);
          if (decoded.username) {
            setUsername(decoded.username);
          }
          if (decoded.email) {
            setEmail(decoded.email);
          }
          if (decoded.id) {
            setId(decoded.id);
          }
        } catch (error) {
          console.error("Error decoding token:", error);
          setUsername("Unknown User");
        }
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    Cookies.remove("token");
    router.push("/auth/sign-in");
  };
  const handleProfile = () => {
    router.push(`/dashboard/edit-user/${id}`);
  };
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="flex items-center space-x-2 rounded-full focus:outline-none">
          <Image
            src="/media/avatars/300-2.png" 
            alt="User Avatar"
            width={32}
            height={32}
            className="rounded-full border"
          />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="p-4 border-b">
            <p className="font-medium text-sm">{username}</p>
            <p className="text-sm text-gray-500">{email}</p>
          </div>

          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <a
                  className={`${
                    active ? "bg-gray-100" : ""
                  } flex items-center px-4 py-2 text-sm text-gray-700`}
                  onClick={handleProfile}
                >
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </a>
              )}
            </Menu.Item>



            <Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  className={`${
                    active ? "bg-gray-100" : ""
                  } flex items-center px-4 py-2 text-sm text-gray-700`}
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </a>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
// components/UserMenu.tsx
"use client";

import { useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { ChevronDown, LogOut, User, Settings } from "lucide-react";
import Image from "next/image";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);

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
            <p className="font-medium text-sm">Cody Fisher</p>
            <p className="text-sm text-gray-500">c.fisher@gmail.com</p>
          </div>

          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <a
                  href="#"
                  className={`${
                    active ? "bg-gray-100" : ""
                  } flex items-center px-4 py-2 text-sm text-gray-700`}
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
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
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

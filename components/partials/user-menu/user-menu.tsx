// components/UserMenu.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from 'jwt-decode';
import Cookies from "js-cookie";
import { LogOut, User, Loader2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    // Simulate logout process with animation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Fade out animation
    const fadeOut = () => {
      document.body.style.transition = 'opacity 0.3s ease-out';
      document.body.style.opacity = '0';
    };
    
    fadeOut();
    
    // Wait for fade out animation to complete
    setTimeout(() => {
      localStorage.removeItem("token");
      Cookies.remove("token");
      router.push("/auth/sign-in");
    }, 300);
  };

  const handleProfile = () => {
    router.push(`/dashboard/edit-user/${id}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-10 rounded-full hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="/media/avatars/boy.png" alt={username} />
            <AvatarFallback className="bg-blue-500 text-white text-xs font-medium">
              {getInitials(username || "U")}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-64 p-0" 
        align="end" 
        sideOffset={5}
      >
        <DropdownMenuLabel className="p-4 pb-2">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/media/avatars/boy.png" alt={username} />
              <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                {getInitials(username || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{username}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <div className="p-1">
          <DropdownMenuItem 
            onClick={handleProfile}
            className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 rounded-md"
          >
            <User className="w-4 h-4 mr-3 text-gray-500" />
            My Profile
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 mr-3 animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </>
            )}
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
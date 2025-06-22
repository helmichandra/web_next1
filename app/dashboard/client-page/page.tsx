import { Suspense } from "react";
import ClientList from "./client-list";
import { useEffect } from "react";
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import { useRouter } from "next/navigation";

interface DecodedToken {
  id: string;
  username: string;
  email: string;
  role: string;
  exp: number;
}
export default function SendMessagePage(): React.ReactElement {
  const router = useRouter();
  
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    
    if (!storedToken) {
        router.push('/auth/sign-in');
        return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(storedToken);
      
      // Cek apakah token sudah expired
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        console.warn('Token has expired');
        localStorage.removeItem('token');
        router.push('/auth/sign-in');
        return;
      }
      const timeout = setTimeout(() => {
        toast.warning("Sesi Anda telah habis. Silakan login kembali.");
        localStorage.removeItem('token');
        setTimeout(() => {
          router.push('/auth/sign-in');
        }, 2000); // beri waktu 2 detik untuk tampilkan toast
      }, 1 * 60 * 1000); // 30 menit
  
      return () => clearTimeout(timeout); 

    } catch (error) {
      console.error('Failed to decode token:', error);
      localStorage.removeItem('token');
      router.push('/auth/sign-in');
    }
  }, [router]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientList />
    </Suspense>
  );
}
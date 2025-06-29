"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useParams, useSearchParams } from "next/navigation";
import { PhoneCallIcon, MailIcon, MapIcon } from "lucide-react";
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
interface Client {
  id: string;
  whatsapp_number: string;
  email: string;
}

export default function SendMessageClient(): React.ReactElement {
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params?.id as string || "";

  // Initialize with default values
  const [client, setClient] = useState<Client>({
    id: clientId,
    whatsapp_number: "",
    email: ""
  });
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
      }, 60 * 60 * 1000); // 30 menit
  
      return () => clearTimeout(timeout); 

    } catch (error) {
      console.error('Failed to decode token:', error);
      localStorage.removeItem('token');
      router.push('/auth/sign-in');
    }
  }, [router]);

  // Use useEffect to safely handle searchParams after component mounts
  useEffect(() => {
    if (searchParams) {
      setClient(prevClient => ({
        ...prevClient,
        whatsapp_number: searchParams.get("whatsapp") || "",
        email: searchParams.get("email") || ""
      }));
    }
  }, [searchParams]);

  const [method, setMethod] = useState<"whatsapp" | "email">("whatsapp");
  const [whatsappMessage, setWhatsappMessage] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailBody, setEmailBody] = useState<string>("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (method === "whatsapp") {
      console.log("Send WhatsApp to:", client.whatsapp_number, "Message:", whatsappMessage);
    } else {
      console.log("Send Email to:", client.email, "Subject:", emailSubject, "Body:", emailBody);
    }
  };

  return (
    <>
    <h1 className="text-3xl font-bold mb-6">Send Message</h1>
    <div className="grid gap-6 md:grid-cols-2">
        <Card className="w-full max-w-2xl">
            <CardHeader>
            <CardTitle>Kirim Pesan Lewat WhatsApp atau Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="mb-4">
                <Label className="mr-4">
                <input
                    type="radio"
                    name="method"
                    value="whatsapp"
                    checked={method === "whatsapp"}
                    onChange={() => setMethod("whatsapp")}
                    className="mr-2 mb-2"
                />
                WhatsApp
                </Label>
                <Label>
                <input
                    type="radio"
                    name="method"
                    value="email"
                    checked={method === "email"}
                    onChange={() => setMethod("email")}
                    className="mr-2 mb-2"
                />
                Email
                </Label>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {method === "whatsapp" && (
                <>
                    <div>
                    <Label className="mb-2">Nomor WhatsApp</Label>
                    <Input
                        type="text"
                        placeholder="Contoh: 081234567890"
                        value={client.whatsapp_number}
                        className="mb-2"
                        onChange={(e) => setClient({ ...client, whatsapp_number: e.target.value })}
                    />
                    </div>
                    <div>
                    <Label className="mb-2">Pesan</Label>
                    <Textarea
                        placeholder="Tulis pesan WhatsApp..."
                        value={whatsappMessage}
                        className="mb-2"
                        onChange={(e) => setWhatsappMessage(e.target.value)}
                    />
                    </div>
                </>
                )}

                {method === "email" && (
                <>
                    <div>
                    <Label className="mb-2">Alamat Email</Label>
                    <Input
                        type="email"
                        placeholder="Contoh: user@example.com"
                        value={client.email}
                        className="mb-2"
                        onChange={(e) => setClient({ ...client, email: e.target.value })}
                    />
                    </div>
                    <div>
                    <Label className="mb-2">Subjek</Label>
                    <Input
                        type="text"
                        placeholder="Judul email..."
                        value={emailSubject}
                        className="mb-2"
                        onChange={(e) => setEmailSubject(e.target.value)}
                    />
                    </div>
                    <div>
                    <Label>Isi Email</Label>
                    <Textarea
                        placeholder="Tulis isi email..."
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                    />
                    </div>
                </>
                )}
                <Button type="submit">Kirim</Button>
            </form>
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Informasi</CardTitle>
            <CardDescription>Detail kontak Pengirim</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <PhoneCallIcon />
                <span>+62 123 4567 890</span>
              </div>
              <div className="flex items-center gap-2">
                <MailIcon />
                <span>info@dappa.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapIcon />
                <span>Jl. Cukimai No. 182, Jakarta</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">Lihat di Peta</Button>
          </CardFooter>
        </Card>
    </div>
    </>
  );
}
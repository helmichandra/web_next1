"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define client type interface
interface Client {
  name: string;
  client_type: string;
  address: string;
  whatsapp_number: string;
  email: string;
  status: string;
}

export default function AddClientPage() {
  const router = useRouter();
  
  const [client, setClient] = useState<Client>({
    name: "",
    client_type: "",
    address: "",
    whatsapp_number: "",
    email: "",
    status: "Aktif" // Default status
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setClient(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string, field: keyof Client): void => {
    setClient(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    console.log("Saving new client:", client);
    // Implementasi untuk menyimpan client baru
    // Setelah berhasil disimpan, kembali ke halaman client list
    router.push("/clients");
  };

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-10">
        <Card>
          <CardHeader>
            <CardTitle>Tambah Client Baru</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Client</Label>
                  <Input
                    id="name"
                    name="name"
                    value={client.name}
                    onChange={handleChange}
                    placeholder="Masukkan nama client"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="client_type">Tipe Client</Label>
                  <Select 
                    value={client.client_type} 
                    onValueChange={(value) => handleSelectChange(value, "client_type")}
                  >
                    <SelectTrigger id="client_type">
                      <SelectValue placeholder="Pilih tipe client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Perusahaan">Perusahaan</SelectItem>
                      <SelectItem value="Individu">Individu</SelectItem>
                      <SelectItem value="Lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Input
                    id="address"
                    name="address"
                    value={client.address}
                    onChange={handleChange}
                    placeholder="Masukkan alamat"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number">Nomor WhatsApp</Label>
                  <Input
                    id="whatsapp_number"
                    name="whatsapp_number"
                    value={client.whatsapp_number}
                    onChange={handleChange}
                    placeholder="Masukkan nomor WhatsApp"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={client.email}
                    onChange={handleChange}
                    placeholder="Masukkan email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={client.status} 
                    onValueChange={(value) => handleSelectChange(value, "status")}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aktif">Aktif</SelectItem>
                      <SelectItem value="Tidak Aktif">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Batal
              </Button>
              <Button type="submit">Simpan Client</Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
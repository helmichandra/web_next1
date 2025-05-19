"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Define client type interface
interface Client {
  id: string;
  name: string;
  client_type: string;
  address: string;
  whatsapp_number: string;
  email: string;
  status: string;
}

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const clientId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [client, setClient] = useState<Client>({
    id: clientId,
    name: "",
    client_type: "",
    address: "",
    whatsapp_number: "",
    email: "",
    status: ""
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setClient({
        id: clientId,
        name: searchParams.get("name") || "",
        client_type: searchParams.get("type") || "",
        address: searchParams.get("address") || "",
        whatsapp_number: searchParams.get("whatsapp") || "",
        email: searchParams.get("email") || "",
        status: searchParams.get("status") || ""
      });
      setIsLoading(false);
    }, 500); // Simulasi loading selama 500ms

    return () => clearTimeout(timeout);
  }, [clientId, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setClient(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string, field: keyof Client): void => {
    setClient(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    console.log("Saving updated client:", client);
    router.push("/clients");
  };

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-10">
        <Card>
          <CardHeader>
            <CardTitle>
              {isLoading ? <Skeleton className="h-6 w-40" /> : `Edit Client ${client.name}`}
            </CardTitle>
          </CardHeader>
          {isLoading ? (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div className="space-y-2" key={i}>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          ) : (
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
                <Button type="submit">Simpan Perubahan</Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </main>
    </div>
  );
}

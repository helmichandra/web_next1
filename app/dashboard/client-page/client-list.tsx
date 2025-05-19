"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash, MessageSquare, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton"; 

const dummyClients = [
  { id: 1, name: "Piala Super Spanyol", client_type: "Perusahaan", address: "Madrid", whatsapp_number: "082123847392", email: "piala@rfef.com", status: "Aktif" },
  { id: 2, name: "Copa del Rey", client_type: "Perusahaan", address: "Valencia", whatsapp_number: "082123847392", email: "cdr@rfef.com", status: "Aktif" },
  { id: 3, name: "La Liga", client_type: "Perusahaan", address: "Sevilla", whatsapp_number:"082123847392", email: "laliga@rfef.com", status: "Aktif" },
];

type Client = typeof dummyClients[number];

export default function ClienList() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simulasi delay fetch data
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredClients = useMemo(() => {
    return dummyClients.filter((client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.client_type.toLowerCase().includes(search.toLowerCase()) ||
      client.address.toLowerCase().includes(search.toLowerCase()) ||
      client.whatsapp_number.toLowerCase().includes(search.toLowerCase()) ||
      client.email.toLowerCase().includes(search.toLowerCase()) ||
      client.status.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const handleEdit = (client: Client) => {
    router.push(`/dashboard/edit-client/${client.id}?name=${encodeURIComponent(client.name)}` +
      `&type=${encodeURIComponent(client.client_type)}` +
      `&address=${encodeURIComponent(client.address)}` +
      `&whatsapp=${encodeURIComponent(client.whatsapp_number)}` +
      `&email=${encodeURIComponent(client.email)}` +
      `&status=${encodeURIComponent(client.status)}`
    );
  };

  const handleDelete = (client: Client) => {
    console.log("Delete client with ID:", client.id);
  };

  const handleMessage = (client: Client) => {
    router.push(`/dashboard/send-mail?whatsapp=${encodeURIComponent(client.whatsapp_number)}` +
      `&email=${encodeURIComponent(client.email)}`
    );
  };

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-10">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Client</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <input
                type="text"
                placeholder="Cari klien..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="p-2 border border-gray-300 rounded text-sm w-1/4"
              />
              <Button
                onClick={() => router.push("/dashboard/add-client")}
                className="ml-4 hover:bg-gray-400 rounded text-white font-bold py-2 px-4 focus:outline-none focus:shadow-outline flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Klien
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Client Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Whatsapp Number</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  // Skeleton rows (3 baris dummy)
                  [...Array(3)].map((_, idx) => (
                    <TableRow key={idx}>
                      {Array(8).fill(null).map((_, i) => (
                        <TableCell key={i}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredClients.length > 0 ? (
                  filteredClients.map((client, index) => (
                    <TableRow key={index}>
                      <TableCell>{client.id}</TableCell>
                      <TableCell>{client.name}</TableCell>
                      <TableCell>{client.client_type}</TableCell>
                      <TableCell>{client.address}</TableCell>
                      <TableCell>{client.whatsapp_number}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.status}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Buka menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(client)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(client)}>
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMessage(client)}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              <span>Kirim Pesan</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-gray-500">
                      Tidak ada data ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
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
import { useRouter } from "next/navigation"; // Untuk navigasi di App Router Next.js 13+
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash, MessageSquare,Plus } from "lucide-react";


const dummyClients = [
  { id: 1, name: "Piala Super Spanyol", client_type: "Perusahaan", address: "Madrid", whatsapp_number: "082123847392", email: "piala@rfef.com", status: "Aktif" },
  { id: 2, name: "Copa del Rey", client_type: "Perusahaan", address: "Valencia", whatsapp_number: "082123847392", email: "cdr@rfef.com", status: "Aktif" },
  { id: 3, name: "La Liga", client_type: "Perusahaan", address: "Sevilla", whatsapp_number:"082123847392", email: "laliga@rfef.com", status: "Aktif" },
];
type Client = {
    id: number;
    name: string;
    client_type: string;
    address: string;
    whatsapp_number: string;
    email: string;
    status: string;
  };
export default function ClientPage() {
  const [search, setSearch] = useState("");
  const router = useRouter();

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
    router.push(`/edit-client/${client.id}?name=${encodeURIComponent(client.name)}` +
      `&type=${encodeURIComponent(client.client_type)}` +
      `&address=${encodeURIComponent(client.address)}` +
      `&whatsapp=${encodeURIComponent(client.whatsapp_number)}` +
      `&email=${encodeURIComponent(client.email)}` +
      `&status=${encodeURIComponent(client.status)}`
    );
  };

  const handleDelete = (client: Client) => {
    console.log("Delete client with ID:", client.id);
    // Fungsi untuk menangani hapus client
  };

  const handleMessage = (client: Client) => {
    router.push(`/send-mail?whatsapp=${encodeURIComponent(client.whatsapp_number)}` +
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
            {/* Search Input */}
            <input
              type="text"
              placeholder="Cari klien..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-4 p-2 border border-gray-300 rounded w-50 text-sm"
            />
            <Button onClick={() => router.push("/add-client")} className="ml-195 hover:bg-gray-400 rounded text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" >
                <Plus className="mr- h-4 w-4" />
                Tambah Klien
            </Button>

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
                {filteredClients.map((client, index) => (
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
                ))}

                {filteredClients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-gray-500">
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

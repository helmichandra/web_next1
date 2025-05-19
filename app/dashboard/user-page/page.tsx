"use client";

import { useState, useMemo } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const dummyClients = [
  { name: "Szczęsny", contact: "garpit@barca.com", status: "Dalam Proses" },
  { name: "Iñigo Martínez", contact: "offside@barca.com", status: "Selesai" },
  { name: "Pau Cubarsi", contact: "bocil@barca.com", status: "Menunggu Konfirmasi" },
  { name: "Kounde", contact: "rapper@barca.com", status: "Menunggu Konfirmasi" },
  { name: "Alejandro Balde", contact: "rxking@barca.com", status: "Menunggu Konfirmasi" },
  { name: "Frenkie de Jong", contact: "jantung@barca.com", status: "Menunggu Konfirmasi" },
  { name: "Pedri", contact: "atiampela@barca.com", status: "Menunggu Konfirmasi" },
  { name: "Dani Olmo", contact: "paru@barca.com", status: "Menunggu Konfirmasi" },
  { name: "Kipli", contact: "starboy@barca.com", status: "Menunggu Konfirmasi" },
  { name: "Phiranha", contact: "ballondor@barca.com", status: "Menunggu Konfirmasi" },
  { name: "Lewandowski", contact: "abah@barca.com", status: "Menunggu Konfirmasi" },

];

export default function UserPage() {
  const [search, setSearch] = useState("");

  const filteredClients = useMemo(() => {
    return dummyClients.filter((client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.contact.toLowerCase().includes(search.toLowerCase()) ||
      client.status.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="flex min-h-screen">

      <main className="flex-1 p-10">

        <Card>
          <CardHeader>
            <CardTitle>Informasi User</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search Input */}
            <input
              type="text"
              placeholder="Cari user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-4 p-2 border border-gray-300 rounded w-50 text-sm"
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Pengguna</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client, index) => (
                  <TableRow key={index}>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.contact}</TableCell>
                    <TableCell>{client.status}</TableCell>
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

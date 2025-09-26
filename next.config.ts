import type { NextConfig } from "next";

const base = process.env.NEXT_PUBLIC_API_BASE;
if (!base) throw new Error("NEXT_PUBLIC_API_BASE is missing");


const nextConfig: NextConfig = {
  reactStrictMode: true,
  // HAPUS rule ini, karena source == destination bikin loop:
  // async redirects() { return [{ source:'/auth/sign-in', destination:'/auth/sign-in', permanent:false }]; },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/auth/sign-in',
        permanent: false, // gunakan true jika redirect permanen
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/api/login",                 destination: `${base}/api/auth/login` },
      { source: "/api/roles",                 destination: `${base}/api/roles` },
      { source: "/api/users",                 destination: `${base}/api/users` },
      { source: "/api/users/id/:id",          destination: `${base}/api/users/id/:id` },
      { source: "/api/clients",               destination: `${base}/api/clients` },
      { source: "/api/clients/all",           destination: `${base}/api/clients/all` },
      { source: "/api/clients/id/:client_id", destination: `${base}/api/clients/id/:client_id` },
      { source: "/api/client_types",          destination: `${base}/api/client_types` },
      { source: "/api/client_types/all",      destination: `${base}/api/client_types/all` },
      { source: "/api/client_types/id/:client_type_id", destination: `${base}/api/client_types/id/:client_type_id` },
      { source: "/api/client_statuses",       destination: `${base}/api/client_statuses` },
      { source: "/api/client_statuses/id/:client_status_id", destination: `${base}/api/client_statuses/id/:client_status_id` },
      { source: "/api/service_types",         destination: `${base}/api/service_types` },
      { source: "/api/service_types/all",     destination: `${base}/api/service_types/all` },
      { source: "/api/service_types/id/:service_type_id", destination: `${base}/api/service_types/id/:service_type_id` },
      { source: "/api/services",              destination: `${base}/api/services` },
      { source: "/api/services/all",          destination: `${base}/api/services/all` },
      { source: "/api/services/id/:service_id", destination: `${base}/api/services/id/:service_id` },
      { source: "/api/vendors",               destination: `${base}/api/vendors` },
      { source: "/api/vendors/all",           destination: `${base}/api/vendors/all` },
      { source: "/api/vendors/id/:vendor_id", destination: `${base}/api/vendors/id/:vendor_id` },
      { source: "/api/reminder/wa",           destination: `${base}/api/reminder/wa` },
      { source: "/api/services/reports/preview",          destination: `${base}/api/services/reports/preview` },
      { source: "/api/services/reports/download/excel",   destination: `${base}/api/services/reports/download/excel` },
      { source: "/api/service_categories",    destination: `${base}/api/service_categories` },
      { source: "/api/service_categories/all",destination: `${base}/api/service_categories/all` },
      { source: "/api/service_categories/id/:service_category_id", destination: `${base}/api/service_categories/id/:service_category_id` },
      { source: "/api/log/wa",                destination: `${base}/api/log/wa` },
    ];
  },
};

export default nextConfig;

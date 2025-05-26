import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/login',
        destination: 'http://202.74.74.4:3000/api/auth/login',
      },
      {
        source: '/api/roles',
        destination: 'http://202.74.74.4:3000/api/roles',
      },
      {
        source: '/api/users',
        destination: 'http://202.74.74.4:3000/api/users',
      },
      {
        source: '/api/users/id/:id',
        destination: 'http://202.74.74.4:3000/api/users/id/:id',
      },
      {
        source: '/api/clients',
        destination: 'http://202.74.74.4:3000/api/clients',
      },
      {
        source: '/api/clients/id/:client_id',
        destination: 'http://202.74.74.4:3000/api/clients/id/:client_id',
      },
      {
        source: '/api/client_types',
        destination: 'http://202.74.74.4:3000/api/client_types',
      },
    ]
  },
};

export default nextConfig;

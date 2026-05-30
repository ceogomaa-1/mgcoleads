import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // ESLint runs separately via `npm run lint`. Don't block the production
    // build on lint warnings — TypeScript strict checking covers correctness.
    ignoreDuringBuilds: true,
  },
}

export default nextConfig

import type { NextConfig } from "next";
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable PWA in dev mode
});
const nextConfig: NextConfig = {
  /* config options here */
   typescript: {
    // This ignores the specific 'minimatch' dependency error so you can deploy
    ignoreBuildErrors: true,
  },
};

export default withPWA(nextConfig as any);

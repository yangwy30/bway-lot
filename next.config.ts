import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'playwright-extra', 
    'puppeteer-extra-plugin-stealth', 
    'playwright-core', 
    'playwright',
    'puppeteer-extra'
  ]
};

export default nextConfig;

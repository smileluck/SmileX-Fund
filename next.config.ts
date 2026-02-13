import type { NextConfig } from "next";
const path = require('path')

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['localhost', "192.168.0.82", "http://fund.zsmile.top"],

  turbopack: {
    root: path.join(__dirname, '..'),
  },
};

export default nextConfig;

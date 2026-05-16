import type { NextConfig } from "next";
const path = require('path')

const nextConfig: NextConfig = {
  allowedDevOrigins: ['localhost', "192.168.0.82", "http://fund.zsmile.top"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
module.exports = {
  // without this the dev server 403s every script chunk loaded from a phone
  // or tablet, so React never hydrates and no animation runs
  allowedDevOrigins: ['192.168.1.*'],
  devIndicators: false,
};

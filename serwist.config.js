const { serwist } = require("@serwist/next/config");

module.exports = serwist.withNextConfig(() => ({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  precachePrerendered: true,
}));

const CspHtmlWebpackPlugin = require("csp-html-webpack-plugin");
const { SubresourceIntegrityPlugin } = require("webpack-subresource-integrity");

const CDN_ORIGIN = process.env.CDN_ADDRESS
  ? new URL(process.env.CDN_ADDRESS).origin
  : "http://localhost:3001";
const CDN_ADDRESS = process.env.CDN_ADDRESS ?? `${CDN_ORIGIN}/`;

const cspConfigPolicy = {
  "default-src": "'none'",
  "object-src": "'none'",
  "base-uri": ["'self'", CDN_ORIGIN],
  "connect-src": "*", // it is blocked by cors anyway
  "worker-src": ["'self'", CDN_ORIGIN],
  "img-src": ["'self' blob: data: content:", CDN_ORIGIN],
  "font-src": ["'self'", CDN_ORIGIN],
  "frame-src": ["'self'", CDN_ORIGIN],
  "manifest-src": "'self'",
  "style-src": ["'self'", "'unsafe-inline'", CDN_ORIGIN],
  "script-src": [
    ...(CDN_ORIGIN.startsWith("https://") ? ["'strict-dynamic'"] : []),
    "'wasm-eval'",
    "'wasm-unsafe-eval'",
    CDN_ORIGIN,
  ],
  "require-trusted-types-for": ["'script'"],
};

module.exports = function override(config, env) {
  if (process.env.NODE_ENV === "production") {
    config.output.crossOriginLoading = "anonymous";
    config.output.publicPath = CDN_ADDRESS;
  }

  const loaders = config.resolve;
  loaders.fallback = {
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    vm: require.resolve("vm-browserify"),
  };

  config.plugins.push(
    new CspHtmlWebpackPlugin(cspConfigPolicy, {
      // DO NOT ENABLE NONCE, THIS IS A STATIC WEBSITE
      nonceEnabled: {
        "script-src": false,
        "style-src": false,
      },
      hashEnabled: {
        "script-src": true,
        "style-src": true,
      },
      hashingMethod: "sha384",
    })
  );

  config.plugins.push(new SubresourceIntegrityPlugin());

  return config;
};

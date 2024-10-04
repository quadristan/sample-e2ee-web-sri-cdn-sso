const CspHtmlWebpackPlugin = require("csp-html-webpack-plugin");

const cspConfigPolicy = {
  "default-src": "'none'",
  "object-src": "'none'",
  "base-uri": "'self'",
  "connect-src": "*", // it is blocked by cors anyway
  "worker-src": "'self'",
  "img-src": "'self' blob: data: content:",
  "font-src": "'self'",
  "frame-src": "'self'",
  "manifest-src": "'self'",
  "style-src": ["'self'", "'unsafe-inline'"],
  "script-src": ["'strict-dynamic'", "'wasm-eval'", "'wasm-unsafe-eval'"],
  "require-trusted-types-for": ["'script'"],
};

module.exports = function override(config, env) {
  const loaders = config.resolve;
  loaders.fallback = {
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    vm: require.resolve("vm-browserify"),
  };

  if (process.env.NODE_ENV === "production") {
    config.plugins.push(
      new CspHtmlWebpackPlugin(cspConfigPolicy, {
        nonceEnabled: {
          "script-src": true,
          "style-src": false,
        },
      })
    );
    config.output.crossOriginLoading = "anonymous";
  }

  return config;
};

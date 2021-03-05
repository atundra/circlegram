// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
module.exports = {
  mount: {
    'public': {url: '/', static: true},
    'src': {url: '/'},
    'tdweb': {url: '/', static: true},
  },
  plugins: [
    '@snowpack/plugin-typescript'
  ],
  packageOptions: {
    /* ... */
  },
  devOptions: {
    /* ... */
  },
  buildOptions: {
    /* ... */
  },
};

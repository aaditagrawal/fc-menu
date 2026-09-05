const babelConfig = require("./babel.config");

module.exports = {
  plugins: {
    "@stylexjs/postcss-plugin": {
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      babelConfig: {
        babelrc: false,
        parserOpts: { plugins: ["typescript", "jsx"] },
        plugins: babelConfig.plugins,
      },
      // `resets` (vendored preflight) and `prose` (vendored typography) must
      // sort below StyleX's own priority layers, mirroring the old cascade
      // where Tailwind's base/utilities layers lost to unlayered globals.
      useCSSLayers: { before: ["resets", "prose"] },
    },
    autoprefixer: {},
  },
};

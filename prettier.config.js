module.exports = {
  plugins: [require("prettier-plugin-astro")],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
}

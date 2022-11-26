module.exports = {
  plugins: [require("prettier-plugin-astro"), require("prettier-plugin-tailwindcss")],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
}

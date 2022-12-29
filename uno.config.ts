import {
  defineConfig,
  presetUno,
  presetTypography,
  transformerVariantGroup,
  transformerDirectives,
} from "unocss";

export default defineConfig({
  presets: [
    presetUno(),
    presetTypography({
      cssExtend: {
        "h1,h2,h3,h4,h5,h6": {
          "font-weight": 900,
        },
      },
    }),
  ],
  transformers: [transformerVariantGroup(), transformerDirectives()],
});

import { defineConfig } from 'astro/config';
import solid from "@astrojs/solid-js";
import tailwind from "@astrojs/tailwind";

import image from "@astrojs/image";

// https://astro.build/config
export default defineConfig({
  integrations: [solid(), tailwind(), image()]
});
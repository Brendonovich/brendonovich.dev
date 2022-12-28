import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import image from "@astrojs/image";
import prefetch from "@astrojs/prefetch";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

import { remarkReadingTime } from "./src/utils/reading-time.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://www.brendonovich.dev",
  integrations: [tailwind(), image(), prefetch()],
  markdown: {
    extendDefaultPlugins: true,
    rehypePlugins: [rehypeAutolinkHeadings],
    remarkPlugins: [remarkReadingTime],
  },
  experimental: {
    contentCollections: true
  }
});

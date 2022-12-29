import { defineConfig } from 'astro/config';
import image from "@astrojs/image";
import prefetch from "@astrojs/prefetch";
import unocss from "unocss/astro"

import rehypeAutolinkHeadings from "rehype-autolink-headings";

import remarkExternalLinks from "remark-external-links"
import { remarkReadingTime } from "./src/utils/reading-time.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://www.brendonovich.dev",
  integrations: [unocss(), image(), prefetch()],
  markdown: {
    extendDefaultPlugins: true,
    rehypePlugins: [rehypeAutolinkHeadings],
    remarkPlugins: [remarkReadingTime, remarkExternalLinks],
  },
  experimental: {
    contentCollections: true
  }
});

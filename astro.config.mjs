import { defineConfig } from 'astro/config';
import image from "@astrojs/image";
import prefetch from "@astrojs/prefetch";
import unocss from "unocss/astro";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import { remarkReadingTime } from "./src/utils/reading-time.mjs";

// https://astro.build/config
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
import compress from "astro-compress";

// https://astro.build/config
export default defineConfig({
  site: "https://www.brendonovich.dev",
  integrations: [unocss(), image(), prefetch(), sitemap(), compress()],
  markdown: {
    extendDefaultPlugins: true,
    rehypePlugins: [rehypeAutolinkHeadings, [rehypeExternalLinks, {
      rel: "noopener noreferrer",
      target: "_blank"
    }]],
    remarkPlugins: [remarkReadingTime]
  },
  experimental: {
    contentCollections: true
  }
});
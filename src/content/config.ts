import { z, defineCollection } from "astro:content";

const blog = defineCollection({
  schema: {
    draft: z.boolean(),
    title: z.string(),
    byline: z.string(),
    date: z.string(),
  },
});

export const collections = {
  blog,
};

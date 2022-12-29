import { getCollection } from "astro:content";

export const visiblePosts = async () =>
  (await getCollection("blog")).filter(
    (p) => p.data.draft || import.meta.env.MODE === "development"
  );

import rss from "@astrojs/rss";
import { visiblePosts } from "./blog/utils";

const posts = await visiblePosts();

export const get = () =>
  rss({
    title: "Brendonovich's Blog",
    description: "Posts about technology",
    site: import.meta.env.SITE,
    stylesheet: "/rss/styles.xsl",
    items: posts.map((post) => ({
      link: `blog/${post.slug}`,
      title: post.data.title,
      pubDate: new Date(post.data.date),
    })),
  });

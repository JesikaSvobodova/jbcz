import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    category: z.enum(["bezpecnost", "snemovna", "jihocesky-kraj", "osobni", "media"]),
    tags: z.array(z.string()).optional(),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };

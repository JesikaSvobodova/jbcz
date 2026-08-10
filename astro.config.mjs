import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://www.janbartosek.cz",
  integrations: [tailwind(), sitemap()],
  output: "static",
  markdown: {
    shikiConfig: {
      theme: "github-light",
    },
  },
});

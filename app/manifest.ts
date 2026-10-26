import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "MoryaBilling",
    short_name: "MoryaBilling",
    description: "Fast billing and sales reports for Morya Misal.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#111315",
    theme_color: "#111315",
    categories: ["business", "food"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ]
  };
}

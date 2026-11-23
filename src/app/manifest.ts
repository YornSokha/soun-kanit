import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "គន្លឹះគណិត — Konleuh Kanit",
    short_name: "គន្លឹះគណិត",
    description:
      "កម្មវិធីរៀនគណិតវិទ្យាអន្តរកម្មជាភាសាខ្មែរសម្រាប់កុមារអាយុ ៦ ដល់ ១២ ឆ្នាំ",
    start_url: "/learn",
    display: "standalone",
    background_color: "#fcfaf5",
    theme_color: "#fcfaf5",
    lang: "km",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}

export default {
  name: "Broden Suffern",
  // Set SITE_URL in the build environment once the Cloudflare domain is decided.
  url: process.env.SITE_URL || "http://localhost:8080",
  description: "Projects, writing, and the things that inspire me.",
  links: [
    { label: "GitHub", href: "https://github.com/bsuffern" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/bsuffern" },
  ],
  nav: [
    { label: "Projects", href: "/projects/" },
    { label: "Writing", href: "/writing/" },
    { label: "Inspiration", href: "/inspiration/" },
  ],
};

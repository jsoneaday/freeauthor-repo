import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import daisyui from "daisyui";
import tailwindtypo from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit Variable", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [daisyui, tailwindtypo],
  daisyui: {
    themes: ["light", "dark"],
  },
};
export default config;

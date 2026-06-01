// @ts-check
import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';
import rehypeMathjax from 'rehype-mathjax';
import remarkMath from 'remark-math';

// https://astro.build/config
export default defineConfig({
  site: 'https://nnnawi.github.io/A-Deep-Dive-Into-Vectorfield-Pathfinding/',
  base: '/A-Deep-Dive-Into-Vectorfield-Pathfinding/',
  output: 'static',
  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeMathjax],
    }),
  ],
});

// @ts-check
import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';
import rehypeMathjax from 'rehype-mathjax';
import remarkMath from 'remark-math';

// https://astro.build/config
export default defineConfig({
  site: 'https://nnnawi.github.io/VectorField-Pathfinding-Blog/',
  base: '/VectorField-Pathfinding-Blog/',
  output: 'static',
  integrations: [
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeMathjax],
    }),
  ],
});

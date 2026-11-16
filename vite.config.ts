import { defineConfig } from 'vite';

// GitHub Pages serves the site from https://<user>.github.io/falling-shapes/,
// so built asset URLs need that prefix. `vite preview` serves that same build,
// so it needs the prefix too. Only the dev server keeps serving from "/".
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/falling-shapes/' : '/',
}));

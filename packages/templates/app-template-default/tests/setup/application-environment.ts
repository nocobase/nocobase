import { builtinEnvironments, type Environment } from 'vitest/runtime';

// Render in jsdom while loading the in-process application's Node workers as server modules.
export default {
  ...builtinEnvironments.jsdom,
  name: 'application',
  viteEnvironment: 'ssr',
} satisfies Environment;

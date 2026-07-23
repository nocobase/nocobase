import { defineConfig as defineNocoBaseConfig } from '@nocobase/test/vitest.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const probe = process.env.RUNJS_PERF_PROBE;
const probes = fileURLToPath(new URL('./probes/', import.meta.url)).replaceAll('\\', '/');
const include = probe
  ? [`${probes}${probe}.perf.test.{ts,tsx}`]
  : [`${probes}{client-bundle,code-editor,runtime-resolve,runtime-cache-retention,source-refresh}.perf.test.{ts,tsx}`];

const config = defineNocoBaseConfig();
config.test ||= {};
config.test.include = include;
config.test.exclude = [];
config.test.sequence = { concurrent: false };
config.test.setupFiles = path.join(process.cwd(), 'packages/core/test/setup/client.ts');
config.server ||= {};
config.server.fs = { allow: [process.cwd(), fileURLToPath(new URL('../..', import.meta.url))] };

export default config;

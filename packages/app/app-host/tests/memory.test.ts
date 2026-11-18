import { readFileSync } from 'node:fs';
import { freemem } from 'node:os';
import { afterEach, expect, it, vi } from 'vitest';
import { sampleHostMemory } from '../src/memory.js';

vi.mock('node:fs', async (original) => {
  const actual = await original<typeof import('node:fs')>();
  return { ...actual, readFileSync: vi.fn(actual.readFileSync) };
});
vi.mock('node:os', async (original) => {
  const actual = await original<typeof import('node:os')>();
  return { ...actual, freemem: vi.fn(actual.freemem) };
});
afterEach(() => {
  vi.restoreAllMocks();
});

it('uses the tighter native process/cgroup and host available-memory budgets', () => {
  vi.spyOn(process, 'availableMemory').mockReturnValue(200 * 1024);
  vi.mocked(readFileSync).mockReturnValue('MemAvailable: 500 kB\n');
  expect(sampleHostMemory().available).toBe(200 * 1024);
  vi.mocked(readFileSync).mockReturnValue('MemAvailable: 100 kB\n');
  expect(sampleHostMemory().available).toBe(100 * 1024);
});

it('falls back conservatively when Linux memory information is unavailable', () => {
  vi.spyOn(process, 'availableMemory').mockReturnValue(200 * 1024);
  vi.mocked(freemem).mockReturnValue(100 * 1024);
  vi.mocked(readFileSync).mockImplementation(() => {
    throw new Error('not Linux');
  });
  expect(sampleHostMemory().available).toBe(100 * 1024);
});

it('keeps heap and RSS as independent measurements', () => {
  vi.spyOn(process, 'memoryUsage').mockReturnValue({
    heapUsed: 100,
    heapTotal: 200,
    rss: 400,
    external: 20,
    arrayBuffers: 10,
  });
  expect(sampleHostMemory()).toMatchObject({ heapUsed: 100, rss: 400 });
});

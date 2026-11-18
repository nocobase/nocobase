import { readFileSync } from 'node:fs';
import { freemem } from 'node:os';
import { getHeapStatistics } from 'node:v8';

export interface HostMemoryUsage {
  heapUsed: number;
  heapLimit: number;
  rss: number;
  available: number;
}

/** Native availableMemory accounts for OS/cgroup limits; MemAvailable also protects the whole machine. */
export function sampleHostMemory(): HostMemoryUsage {
  const memory = process.memoryUsage();
  let available = process.availableMemory();
  try {
    const match = /^MemAvailable:\s+(\d+) kB$/m.exec(
      readFileSync('/proc/meminfo', 'utf8'),
    );
    available = Math.min(
      available,
      match ? Number(match[1]) * 1024 : freemem(),
    );
  } catch {
    available = Math.min(available, freemem());
  }
  return {
    heapUsed: memory.heapUsed,
    heapLimit: getHeapStatistics().heap_size_limit,
    rss: memory.rss,
    available,
  };
}

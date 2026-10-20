import { InMemoryFs } from 'just-bash';
import { describe, expect, it } from 'vitest';
import { createSandboxFilesystem } from '../server/online/sandbox/filesystem.js';
import {
  responseText,
  sandboxLimits,
  clip,
} from '../server/online/sandbox/limits.js';

describe('Slice-01 closed Sandbox filesystem and output budgets', () => {
  const filesystem = (budget = 32) => {
    const mounted = createSandboxFilesystem(
      { '/skills/guide/SKILL.md': 'immutable' },
      budget,
    );
    mounted.lock();
    return mounted;
  };

  it('guards Skills and normalized paths while delegating all storage operations to InMemoryFs', async () => {
    const { fs, dispose } = filesystem();
    if (!(fs instanceof InMemoryFs))
      throw new Error('Expected just-bash InMemoryFs.');
    await fs.writeFile('/tmp/input', 'owned');
    const mutations = [
      () => fs.writeFileSync('/skills/guide/SKILL.md', 'changed'),
      () => fs.writeFileLazy('/skills/guide/SKILL.md', () => 'changed'),
      () => fs.mkdirSync('/skills/new'),
      () => fs.writeFile('/skills/guide/SKILL.md', 'changed'),
      () => fs.appendFile('/tmp/../skills/guide/SKILL.md', 'changed'),
      () => fs.mkdir('/skills/added'),
      () => fs.rm('/skills', { recursive: true }),
      () => fs.rm('/', { recursive: true }),
      () => fs.cp('/tmp/input', '/skills/guide/SKILL.md'),
      () => fs.mv('/skills/guide/SKILL.md', '/tmp/stolen'),
      () => fs.mv('/tmp/input', '/tmp/../../skills/stolen'),
      () => fs.chmod('/skills/guide/SKILL.md', 0o777),
      () => fs.utimes('/skills/guide/SKILL.md', new Date(), new Date()),
      () => fs.createExclusive!('/skills/new', { mode: 0o600 }),
      () => fs.symlink('/skills', '/tmp/link'),
      () => fs.link('/skills/guide/SKILL.md', '/tmp/link'),
    ];
    for (const mutation of mutations)
      await expect(Promise.resolve().then(mutation)).rejects.toThrow();
    expect(await fs.readFile('/skills/guide/SKILL.md')).toBe('immutable');
    expect(await fs.readFile('/tmp/input')).toBe('owned');
    expect(await fs.exists('/etc/hosts')).toBe(false);
    await dispose();
    expect(fs.getAllPaths()).toEqual([]);
  });

  it('uses the aggregate InMemoryFs byte budget and renames at full capacity without copying', async () => {
    const { fs, dispose } = filesystem(16);
    await fs.writeFile('/tmp/input', '1234567');
    await expect(fs.appendFile('/tmp/input', 'x')).rejects.toThrow();
    await expect(fs.cp('/tmp/input', '/tmp/copy')).rejects.toThrow();
    expect(await fs.readFile('/tmp/input')).toBe('1234567');
    await fs.mv('/tmp/input', '/tmp/renamed');
    expect(await fs.exists('/tmp/input')).toBe(false);
    expect(await fs.readFile('/tmp/renamed')).toBe('1234567');
    await fs.rm('/tmp/renamed');
    await fs.writeFile('/tmp/reused', '1234567');
    await dispose();
  });

  it('does not impose a separate 1 MiB scratch or 256-entry quota', async () => {
    const { fs, dispose } = filesystem(sandboxLimits.filesystemBytes);
    await fs.writeFile('/tmp/large', new Uint8Array(2 * 1024 * 1024));
    for (let i = 0; i < 300; i++) await fs.mkdir('/tmp/d' + i);
    expect((await fs.stat('/tmp/large')).size).toBe(2 * 1024 * 1024);
    expect((await fs.readdir('/tmp')).length).toBeGreaterThan(256);
    await dispose();
  });

  it('clips model-visible text but does not impose a separate CLI response byte quota', async () => {
    expect(clip('x'.repeat(sandboxLimits.modelOutput + 1))).toHaveLength(
      sandboxLimits.modelOutput + '\n[Output truncated]'.length,
    );
    const expected = 'x'.repeat(2 * 1024 * 1024 + 1) + '尾部';
    const encoded = new TextEncoder().encode(expected);
    const response = new Response(
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoded.subarray(0, 1024 * 1024));
          controller.enqueue(encoded.subarray(1024 * 1024));
          controller.close();
        },
      }),
    );
    expect(await responseText(response)).toBe(expected);
  });
  it('cancels a pending response reader on abort and awaits its real cancellation', async () => {
    let canceled = false;
    let release!: () => void;
    const done = new Promise<void>((resolve) => {
      release = resolve;
    });
    const response = new Response(
      new ReadableStream<Uint8Array>({
        async cancel() {
          await done;
          canceled = true;
        },
      }),
    );
    const controller = new AbortController();
    const reading = responseText(response, controller.signal);
    controller.abort();
    let settled = false;
    const observed = reading.catch((error) => {
      expect(error).toMatchObject({ name: 'AbortError' });
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(canceled).toBe(false);
    release();
    await observed;
    expect(canceled).toBe(true);
  });
});

describe('Unreadable support content is absent across filesystem access paths', () => {
  it('cannot read or copy binary/over-budget files through text, bytes or buffer access', async () => {
    const path = '/skills/guide/assets/private.bin';
    const mounted = createSandboxFilesystem(
      { '/skills/guide/SKILL.md': 'guide' },
      1024,
      new Map([[path, 'Binary skill file is not readable.']]),
    );
    mounted.lock();
    try {
      expect(await mounted.fs.exists(path)).toBe(false);
      for (const read of [
        () => mounted.fs.readFile(path),
        () => mounted.fs.readFileBuffer(path),
        () => mounted.fs.cp(path, '/tmp/copy'),
      ])
        await expect(Promise.resolve().then(read)).rejects.toThrow(
          'not readable',
        );
      expect(await mounted.fs.exists('/tmp/copy')).toBe(false);
      await mounted.fs.cp('/skills/guide', '/tmp/guide', { recursive: true });
      expect(await mounted.fs.exists('/tmp/guide/assets/private.bin')).toBe(
        false,
      );
      expect(await mounted.fs.readFile('/tmp/guide/SKILL.md')).toBe('guide');
    } finally {
      await mounted.dispose();
    }
  });
});

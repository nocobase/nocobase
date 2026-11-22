import { parse } from 'yaml';

/** A top-level section `config.example.yml` documents, active or commented out, with the comment above it. */
export interface ExampleSection {
  readonly key: string;
  readonly comment?: string;
}

const ACTIVE = /^([A-Za-z_][\w-]*):(\s|$)/u;
const COMMENTED = /^#\s?([A-Za-z_][\w-]*):\s*$/u;
const COMMENTED_SETTING = /^#\s+[\w.-]+:(\s|$)/u;

/**
 * The sections of an example file in order. A commented-out section such as `# app:` counts too, and one without a
 * comment above it takes the first line of prose inside its block.
 */
export function exampleSections(text: string): ExampleSection[] {
  const sections = new Map<string, ExampleSection>();
  let prose: string[] = [];
  let block: { key: string; comment?: string } | undefined;
  const close = (): void => {
    if (block && !sections.has(block.key)) sections.set(block.key, block);
    block = undefined;
  };
  for (const line of text.split(/\r?\n/u)) {
    if (line.trim() === '') {
      close();
      prose = [];
      continue;
    }
    const key = ACTIVE.exec(line)?.[1] ?? COMMENTED.exec(line)?.[1];
    if (key) {
      close();
      const comment = prose.join(' ').trim();
      block = { key, ...(comment ? { comment } : {}) };
      prose = [];
      continue;
    }
    if (line.startsWith('#') && !block) {
      prose.push(line.replace(/^#+\s?/u, ''));
      continue;
    }
    if (block && !block.comment && line.startsWith('#')) {
      const inner = line.replace(/^#+\s*/u, '');
      if (inner && !COMMENTED_SETTING.test(line))
        block = { ...block, comment: inner };
    }
  }
  close();
  return [...sections.values()];
}

/** The example's active values, or nothing when it does not parse. */
export function exampleValues(
  text: string,
): Record<string, unknown> | undefined {
  try {
    const value: unknown = parse(text);
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

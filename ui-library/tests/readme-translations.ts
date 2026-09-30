import { readFileSync } from 'node:fs';
import path from 'node:path';

type Locale = 'en-US' | 'zh-CN';

/**
 * The translations the README of a registry group, such as `components`, lists for its items, as one flat resource per
 * locale.
 *
 * A component ships no locale file: the Translations table in its group's README is where its keys and their wording
 * are recorded, for consumers to copy into their own locale resources. Rendering against these resources in a strict
 * test runtime fails a test when a component looks up a key the table does not list, so the table cannot fall behind
 * the components it documents.
 */
export function readmeTranslations(
  group: string,
): Record<Locale, Record<string, string>> {
  // A path rather than a URL: jsdom replaces the global `URL`, and `readFileSync` does not accept its instances.
  const readme = path.join(
    import.meta.dirname,
    '../registry',
    group,
    'README.md',
  );
  const text = readFileSync(readme, 'utf8');
  const start = text.indexOf('\n## Translations\n');
  if (start === -1) throw new Error(`${readme} has no Translations section`);
  const next = text.indexOf('\n## ', start + 1);
  const section = text.slice(start, next === -1 ? undefined : next);

  const resources: Record<Locale, Record<string, string>> = {
    'en-US': {},
    'zh-CN': {},
  };
  for (const line of section.split('\n')) {
    // | `key` | English | Chinese |
    const row = /^\|\s*`([^`]+)`\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|$/.exec(line);
    if (!row) continue;
    const [, key, english, chinese] = row;
    resources['en-US'][key!] = english!;
    resources['zh-CN'][key!] = chinese!;
  }
  return resources;
}

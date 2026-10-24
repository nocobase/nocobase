import { getCollection } from 'astro:content';

/** Every entry of the `docs` collection. Typed by `collection.d.ts`; see there for why this file is JavaScript. */
export function getDocEntries() {
  return getCollection('docs');
}

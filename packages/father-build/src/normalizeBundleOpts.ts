import { cloneDeep, merge } from 'lodash';
import { IBundleOptions } from './types';

function stripDotSlashPrefix(path) {
  return path.replace(/^\.\//, '');
}

export default function(entry: string, opts: IBundleOptions): IBundleOptions {
  let clone = cloneDeep(opts);
  const stripedEntry = stripDotSlashPrefix(entry);
  if (clone.overridesByEntry) {
    Object.keys(clone.overridesByEntry).forEach(key => {
      const stripedKey = stripDotSlashPrefix(key);
      if (stripedKey !== key) {
        clone.overridesByEntry[stripedKey] = clone.overridesByEntry[key];
      }
    });
    if (clone.overridesByEntry[stripedEntry]) {
      clone = merge(clone, clone.overridesByEntry[stripedEntry]);
    }
    delete clone.overridesByEntry;
  }
  return clone;
}

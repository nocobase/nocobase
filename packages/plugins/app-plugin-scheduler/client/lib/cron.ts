import { useEffect, useState } from 'react';

import type { CronDescriber } from './format.js';

let loading: Promise<CronDescriber> | undefined;
let loaded: CronDescriber | undefined;

/**
 * cronstrue with its translations, loaded the first time a rule the page does not word itself is shown. Most rules are
 * one of the common shapes, so most visits never load it.
 */
export function useCronDescriber(needed: boolean): CronDescriber | undefined {
  const [describer, setDescriber] = useState(loaded);
  useEffect(() => {
    if (!needed || describer) return;
    let active = true;
    // A plain object, not cronstrue's class: React would call a function handed to setState as an updater.
    loading ??= import('cronstrue/i18n.js').then((module) => {
      // The CommonJS exports object, whose `toString` describes a rule; its declarations type it otherwise.
      const cronstrue = module.default as unknown as CronDescriber;
      loaded = {
        toString: (expression, options) =>
          cronstrue.toString(expression, options),
      };
      return loaded;
    });
    void loading.then(
      (value) => {
        if (active) setDescriber(value);
      },
      () => {
        // Without cronstrue the expression is shown alone; let a later rule try again.
        loading = undefined;
      },
    );
    return () => {
      active = false;
    };
  }, [needed, describer]);
  return describer;
}

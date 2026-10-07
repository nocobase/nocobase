import { bundleJustBash } from '../scripts/bundle-just-bash.mjs';
import { JUST_BASH_BUNDLE_DIR } from '../vitest.config.js';

/** Bundles just-bash for the tests' alias (`vitest.config.ts`). */
export default async function setup(): Promise<void> {
  await bundleJustBash({ outdir: JUST_BASH_BUNDLE_DIR });
}

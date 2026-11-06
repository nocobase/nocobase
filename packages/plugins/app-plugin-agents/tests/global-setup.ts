import { bundleJustBash } from '../scripts/bundle-just-bash.mjs';
import { JUST_BASH_BUNDLE_DIR } from '../vitest.config.js';

/** Compile the published shell runtime once before any test imports it. */
export default async function setup(): Promise<void> {
  await bundleJustBash({ outdir: JUST_BASH_BUNDLE_DIR });
}

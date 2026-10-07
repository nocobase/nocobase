// Where the runner itself is installed, when it came from an application's install script: the layout of
// `@nocobase/app-cli-client/install`, for the package of the command the runner runs under (`host.ts`).
import {
  detectInstallation as detectAt,
  launcherOf as launcherAt,
  type Installation,
} from '@nocobase/app-cli-client/install';

import { runnerHost } from '../host.ts';

export {
  activateVersion,
  ChecksumError,
  currentVersion,
  pruneVersions,
  sha256Of,
  unpackTarball,
  type Installation,
} from '@nocobase/app-cli-client/install';

/** The installation of the host's package; undefined when it was not installed by the install script. */
export function detectInstallation(
  root: string = runnerHost().packageRoot,
): Installation | undefined {
  return detectAt(root);
}

/** The command that starts whichever version is current. */
export function launcherOf(installation: Installation): string {
  return launcherAt(installation, runnerHost().bin);
}

// How to start the runner again (`nocobase-runner …`). In an installation (lib/install.ts), the
// launcher of whichever version is current, so a service keeps working across updates; otherwise the same Node, its
// flags, and the same entry script. The background daemon and the service definitions add the subcommand
// (`start --foreground`).
import { detectInstallation, launcherOf } from './install.ts';

export function selfCommand(): string[] {
  const installation = detectInstallation();
  if (installation !== undefined) return [launcherOf(installation)];
  const entry = process.argv[1];
  if (entry === undefined)
    throw new Error('Cannot tell which script started this process.');
  return [process.execPath, ...process.execArgv, entry];
}

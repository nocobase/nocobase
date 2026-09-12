import { spawnSync } from 'node:child_process';
import pc from 'picocolors';
import { detectEarlyCliLocale, translateEarlyCli } from './early-locale.js';

const windowsAdministratorCheckScript = [
  '$identity = [Security.Principal.WindowsIdentity]::GetCurrent();',
  '$principal = New-Object Security.Principal.WindowsPrincipal($identity);',
  'if ($principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { exit 0 }',
  'exit 1',
].join(' ');

export function formatWindowsAdministratorRequiredMessage() {
  const locale = detectEarlyCliLocale();
  const message = translateEarlyCli(
    'entry.windowsAdministratorRequired.message',
    'NocoBase CLI must be run as Administrator on Windows.',
    locale,
  );
  const hint = translateEarlyCli(
    'entry.windowsAdministratorRequired.hint',
    'Open your terminal as Administrator, then run the command again.',
    locale,
  );

  return [message, hint].join('\n');
}

function isWindowsAdministrator() {
  for (const command of ['pwsh.exe', 'powershell.exe']) {
    const result = spawnSync(
      command,
      ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', windowsAdministratorCheckScript],
      {
        stdio: 'ignore',
        windowsHide: true,
      },
    );

    if (result.error?.code === 'ENOENT') {
      continue;
    }

    return result.status === 0;
  }

  return false;
}

export function ensureWindowsAdministrator() {
  if (process.platform !== 'win32' || process.env.NB_CLI_WINDOWS_ADMIN_CHECKED === '1') {
    return;
  }

  if (!isWindowsAdministrator()) {
    console.error(pc.red(formatWindowsAdministratorRequiredMessage()));
    process.exit(1);
  }

  process.env.NB_CLI_WINDOWS_ADMIN_CHECKED = '1';
}

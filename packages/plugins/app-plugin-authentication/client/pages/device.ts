/** What a session's user agent says about the device, for the list of signed-in devices. */
export interface DeviceDescription {
  readonly kind: 'browser' | 'commandLine' | 'unknown';
  /** A browser, or the command-line tool's name, such as `nocobase-cli`. */
  readonly client?: string;
  readonly os?: string;
  readonly mobile: boolean;
}

const BROWSERS: readonly [RegExp, string][] = [
  [/\bEdg(?:e|A|iOS)?\//u, 'Edge'],
  [/\bOPR\//u, 'Opera'],
  [/\bFirefox\/|\bFxiOS\//u, 'Firefox'],
  [/Chrome\/|\bCriOS\//u, 'Chrome'],
  [/\bSafari\//u, 'Safari'],
];

const SYSTEMS: readonly [RegExp, string][] = [
  [/\biPhone|\biPad|\biPod/u, 'iOS'],
  [/\bAndroid/u, 'Android'],
  [/\bWindows/u, 'Windows'],
  [/\bMac OS X|\bMacintosh|\bdarwin\b/u, 'macOS'],
  [/\bCrOS/u, 'ChromeOS'],
  [/\bLinux|\blinux\b/u, 'Linux'],
];

/**
 * Reads a user agent: a browser's, or the command-line client's `<bin>/<version> (<host>; <platform> <arch>)
 * node/<version>`, which signs in through `/device`.
 */
export function describeDevice(
  userAgent: string | null | undefined,
): DeviceDescription {
  const agent = userAgent?.trim() ?? '';
  if (!agent) return { kind: 'unknown', mobile: false };
  const os = SYSTEMS.find(([pattern]) => pattern.test(agent))?.[1];
  if (/\bnode\/\d/u.test(agent) && !/Mozilla\//u.test(agent))
    return {
      kind: 'commandLine',
      client: agent.split('/')[0] || undefined,
      ...(os ? { os } : {}),
      mobile: false,
    };
  const browser = BROWSERS.find(([pattern]) => pattern.test(agent))?.[1];
  if (!browser)
    return { kind: 'unknown', ...(os ? { os } : {}), mobile: false };
  return {
    kind: 'browser',
    client: browser,
    ...(os ? { os } : {}),
    mobile: /\bMobile\b|\biPhone|\bAndroid/u.test(agent),
  };
}

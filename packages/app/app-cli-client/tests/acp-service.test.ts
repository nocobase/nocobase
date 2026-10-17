// `acp service install`: the service each system runs `acp start --service` from, at login and again after it fails.
import { describe, expect, it } from 'vitest';

import { acpServicePlan, capture } from '../src/acp-service.ts';

const base = {
  bin: 'demo',
  command: ['/usr/bin/node', '/opt/demo/current/bin/run.js'],
  args: ['--profile', 'work', '--root', '/home/me/code'],
  log: '/home/me/.demo/acp/service.log',
  env: { PATH: '/usr/bin:/bin', HTTPS_PROXY: 'http://u:p%40w@proxy:8080' },
  home: '/home/me',
  uid: 501,
};

describe('acpServicePlan', () => {
  it('is a launchd agent on macOS that starts again only after a failure', () => {
    const plan = acpServicePlan({ ...base, platform: 'darwin' });
    expect(plan).toMatchObject({
      platform: 'launchd',
      label: 'com.nocobase.demo-acp',
      file: '/home/me/Library/LaunchAgents/com.nocobase.demo-acp.plist',
      install: [
        ['launchctl', 'bootout', 'gui/501/com.nocobase.demo-acp'],
        [
          'launchctl',
          'bootstrap',
          'gui/501',
          '/home/me/Library/LaunchAgents/com.nocobase.demo-acp.plist',
        ],
      ],
      status: ['launchctl', 'print', 'gui/501/com.nocobase.demo-acp'],
    });
    expect(plan.content).toContain(
      [
        '    <string>/opt/demo/current/bin/run.js</string>',
        '    <string>acp</string>',
        '    <string>start</string>',
        '    <string>--service</string>',
        '    <string>--profile</string>',
      ].join('\n'),
    );
    expect(plan.content).toMatch(
      /<key>KeepAlive<\/key>\s*<dict>\s*<key>SuccessfulExit<\/key>\s*<false\/>/u,
    );
    expect(plan.content).toContain(
      '<key>StandardOutPath</key>\n  <string>/home/me/.demo/acp/service.log</string>',
    );
  });

  it('escapes what it writes into a plist', () => {
    const plan = acpServicePlan({
      ...base,
      platform: 'darwin',
      env: { NOTE: 'a<b & c>d' },
    });
    expect(plan.content).toContain('<string>a&lt;b &amp; c&gt;d</string>');
  });

  it('is a systemd user unit on Linux, one per profile', () => {
    const plan = acpServicePlan({
      ...base,
      platform: 'linux',
      profile: 'work/2',
    });
    expect(plan).toMatchObject({
      platform: 'systemd',
      label: 'demo-acp-work_2.service',
      file: '/home/me/.config/systemd/user/demo-acp-work_2.service',
      install: [
        ['systemctl', '--user', 'daemon-reload'],
        ['systemctl', '--user', 'enable', 'demo-acp-work_2.service'],
        ['systemctl', '--user', 'restart', 'demo-acp-work_2.service'],
      ],
    });
    expect(plan.content).toContain(
      'ExecStart=/usr/bin/node /opt/demo/current/bin/run.js acp start --service --profile work --root /home/me/code\n',
    );
    // `%` is doubled, so systemd expands no specifier in a value.
    expect(plan.content).toContain(
      'Environment=HTTPS_PROXY=http://u:p%%40w@proxy:8080',
    );
    expect(plan.content).toContain('Restart=on-failure\n');
  });

  it('quotes an argument with spaces in a unit', () => {
    const plan = acpServicePlan({
      ...base,
      platform: 'linux',
      args: ['--name', 'Work "laptop"'],
    });
    expect(plan.content).toContain('--name "Work \\"laptop\\""');
  });

  it('is a script in the Startup folder on Windows, run without a window until it exits 0 or is removed', () => {
    const plan = acpServicePlan({
      ...base,
      platform: 'win32',
      command: ['C:\\Program Files\\nodejs\\node.exe', 'C:\\demo\\run.js'],
      args: ['--name', 'My "PC"'],
      log: 'C:\\Users\\me\\.demo\\acp\\service.log',
      env: { PATH: 'C:\\bin', NOTE: 'say "hi"' },
      home: 'C:\\Users\\me',
    });
    expect(plan.platform).toBe('startup');
    expect(plan.file).toMatch(
      /\\Microsoft\\Windows\\Start Menu\\Programs\\Startup\\demo-acp\.vbs$/u,
    );
    expect(plan.install).toEqual([
      ['wscript.exe', '//B', '//Nologo', plan.file],
    ]);
    const lines = plan.content.split('\r\n');
    expect(lines).toContain('env("NOTE") = "say ""hi"""');
    expect(lines).toContain(
      '  code = shell.Run("cmd.exe /d /s /c """"C:\\Program Files\\nodejs\\node.exe"" C:\\demo\\run.js acp start --service --name ""My """"PC"""""" >> C:\\Users\\me\\.demo\\acp\\service.log 2>&1""", 0, True)',
    );
    expect(lines).toContain(
      '  If code = 0 Or Not files.FileExists(WScript.ScriptFullName) Then Exit Do',
    );
  });

  it('refuses a system it cannot run a service on', () => {
    expect(() => acpServicePlan({ ...base, platform: 'aix' })).toThrow(
      /not supported on aix/u,
    );
  });
});

describe('capture', () => {
  it('takes the variables set, and refuses a value a service cannot hold', () => {
    expect(
      capture({ A: '1', B: '', C: undefined }, ['A', 'B', 'C', 'D']),
    ).toEqual({ A: '1' });
    expect(() => capture({ A: 'x\0y' }, ['A'])).toThrow(/NUL/u);
  });
});

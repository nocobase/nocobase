/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';
import {
  findApiCommandCompatViolation,
  formatApiCommandCompatViolation,
  getApiCommandCompatRules,
} from '../lib/api-command-compat.js';

const packageJsonWithRules = {
  nocobase: {
    apiCommandCompat: {
      rules: [
        {
          code: 'DATA_MODELING_APP_TOO_OLD',
          target: {
            commandPrefix: 'data-modeling',
          },
          when: {
            cli: {
              gte: '2.1.0-beta.40',
            },
            app: {
              lt: '2.1.0-beta.20',
            },
          },
        },
        {
          code: 'FIELDS_APPLY_APP_TOO_OLD',
          target: {
            commandPrefix: 'data-modeling data-sources-collections fields',
          },
          when: {
            cli: {
              gte: '2.1.0-beta.40',
            },
            app: {
              lt: '2.1.0-beta.24',
            },
          },
        },
        {
          code: 'COLLECTIONS_APPLY_APP_TOO_OLD',
          target: {
            command: 'data-modeling collections apply',
          },
          when: {
            cli: {
              gte: '2.1.0-beta.41',
            },
            app: {
              lt: '2.1.0-beta.26',
            },
          },
        },
      ],
    },
  },
};

const packageJsonWithSkillsRule = {
  nocobase: {
    apiCommandCompat: {
      rules: [
        {
          code: 'FIELDS_APPLY_SKILLS_TOO_OLD',
          target: {
            command: 'data-modeling fields apply',
          },
          when: {
            cli: {
              gte: '2.1.0-beta.40',
            },
            app: {
              lt: '2.1.0-beta.24',
            },
            skills: {
              lt: '1.0.5',
            },
          },
        },
      ],
    },
  },
};

const packageJsonWithAppByChannelRule = {
  nocobase: {
    apiCommandCompat: {
      rules: [
        {
          code: 'FLOW_SURFACES_OLD_APP_NEW_SKILLS_UNSUPPORTED',
          target: {
            commandPrefix: 'flow-surfaces',
          },
          when: {
            appByChannel: {
              stable: {
                lt: '2.1.0',
              },
              beta: {
                lt: '2.1.0-beta.36',
              },
              alpha: {
                lt: '2.1.0-alpha.40',
              },
              rc: {
                lt: '2.1.0',
              },
              unknownPrerelease: 'block',
            },
            skills: {
              gt: '1.0.20',
            },
          },
        },
      ],
    },
  },
};

const packageJsonWithRcByChannelRule = {
  nocobase: {
    apiCommandCompat: {
      rules: [
        {
          code: 'FLOW_SURFACES_RC_TOO_OLD',
          target: {
            commandPrefix: 'flow-surfaces',
          },
          when: {
            appByChannel: {
              rc: {
                lt: '2.1.0-rc.1',
              },
            },
            skills: {
              gt: '1.0.20',
            },
          },
        },
      ],
    },
  },
};

test('getApiCommandCompatRules reads command and commandPrefix rules from package.json', () => {
  expect(getApiCommandCompatRules(packageJsonWithRules)).toEqual([
    {
      code: 'DATA_MODELING_APP_TOO_OLD',
      target: {
        commandPrefix: 'data-modeling',
      },
      when: {
        cli: {
          gte: '2.1.0-beta.40',
        },
        app: {
          lt: '2.1.0-beta.20',
        },
      },
    },
    {
      code: 'FIELDS_APPLY_APP_TOO_OLD',
      target: {
        commandPrefix: 'data-modeling data-sources-collections fields',
      },
      when: {
        cli: {
          gte: '2.1.0-beta.40',
        },
        app: {
          lt: '2.1.0-beta.24',
        },
      },
    },
    {
      code: 'COLLECTIONS_APPLY_APP_TOO_OLD',
      target: {
        command: 'data-modeling collections apply',
      },
      when: {
        cli: {
          gte: '2.1.0-beta.41',
        },
        app: {
          lt: '2.1.0-beta.26',
        },
      },
    },
  ]);
});

test('getApiCommandCompatRules reads appByChannel rules from package.json', () => {
  expect(getApiCommandCompatRules(packageJsonWithAppByChannelRule)).toEqual([
    {
      code: 'FLOW_SURFACES_OLD_APP_NEW_SKILLS_UNSUPPORTED',
      target: {
        commandPrefix: 'flow-surfaces',
      },
      when: {
        appByChannel: {
          stable: {
            lt: '2.1.0',
          },
          beta: {
            lt: '2.1.0-beta.36',
          },
          alpha: {
            lt: '2.1.0-alpha.40',
          },
          rc: {
            lt: '2.1.0',
          },
          unknownPrerelease: 'block',
        },
        skills: {
          gt: '1.0.20',
        },
      },
    },
  ]);
});

test('findApiCommandCompatViolation prefers exact command rules over prefix rules', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithRules,
    commandId: 'data-modeling collections apply',
    cliVersion: '2.1.0-beta.41',
    appVersion: '2.1.0-beta.25',
  });

  expect(violation?.rule.code).toBe('COLLECTIONS_APPLY_APP_TOO_OLD');
});

test('findApiCommandCompatViolation prefers the longest matching commandPrefix', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithRules,
    commandId: 'data-modeling data-sources-collections fields apply',
    cliVersion: '2.1.0-beta.40',
    appVersion: '2.1.0-beta.23',
  });

  expect(violation?.rule.code).toBe('FIELDS_APPLY_APP_TOO_OLD');
});

test('findApiCommandCompatViolation skips checks when the target app version is unavailable', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithRules,
    commandId: 'data-modeling collections apply',
    cliVersion: '2.1.0-beta.41',
  });

  expect(violation).toBeUndefined();
});

test('findApiCommandCompatViolation does not block the boundary skills version when the rule uses gt', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithAppByChannelRule,
    commandId: 'flow-surfaces apply',
    cliVersion: '2.1.0-beta.41',
    appVersion: '2.1.0-beta.35',
    skillsVersion: '1.0.20',
  });

  expect(violation).toBeUndefined();
});

test('findApiCommandCompatViolation matches combined appByChannel and skills rules for beta releases above the skills boundary', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithAppByChannelRule,
    commandId: 'flow-surfaces apply',
    cliVersion: '2.1.0-beta.41',
    appVersion: '2.1.0-beta.35',
    skillsVersion: '1.0.21',
  });

  expect(violation?.rule.code).toBe('FLOW_SURFACES_OLD_APP_NEW_SKILLS_UNSUPPORTED');
  expect(violation?.appChannel).toBe('beta');
});

test('findApiCommandCompatViolation ignores trailing prerelease segments when evaluating beta floors', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithAppByChannelRule,
    commandId: 'flow-surfaces apply',
    cliVersion: '2.1.0-beta.41',
    appVersion: '2.1.0-beta.36.snapshot.20260611064603847',
    skillsVersion: '1.0.21',
  });

  expect(violation).toBeUndefined();
});

test('findApiCommandCompatViolation ignores custom trailing prerelease segments when evaluating beta floors', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithAppByChannelRule,
    commandId: 'flow-surfaces apply',
    cliVersion: '2.1.0-beta.41',
    appVersion: '2.1.0-beta.36.foo.20260611064603847',
    skillsVersion: '1.0.21',
  });

  expect(violation).toBeUndefined();
});

test('findApiCommandCompatViolation ignores trailing prerelease segments when evaluating alpha floors', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithAppByChannelRule,
    commandId: 'flow-surfaces apply',
    cliVersion: '2.1.0-beta.41',
    appVersion: '2.1.0-alpha.40.foo.20260611064603847',
    skillsVersion: '1.0.21',
  });

  expect(violation).toBeUndefined();
});

test('findApiCommandCompatViolation does not block old app versions when skills stay below the incompatibility floor', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithAppByChannelRule,
    commandId: 'flow-surfaces apply',
    cliVersion: '2.1.0-beta.41',
    appVersion: '2.0.99',
    skillsVersion: '1.0.19',
  });

  expect(violation).toBeUndefined();
});

test('findApiCommandCompatViolation matches combined appByChannel and skills rules for stable releases', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithAppByChannelRule,
    commandId: 'flow-surfaces apply',
    cliVersion: '2.1.0-beta.41',
    appVersion: '2.0.99',
    skillsVersion: '1.0.21',
  });

  expect(violation?.rule.code).toBe('FLOW_SURFACES_OLD_APP_NEW_SKILLS_UNSUPPORTED');
  expect(violation?.appChannel).toBe('stable');
});

test('findApiCommandCompatViolation does not block rc releases that match the stable app boundary prefix', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithAppByChannelRule,
    commandId: 'flow-surfaces apply',
    cliVersion: '2.1.0-beta.41',
    appVersion: '2.1.0-rc.1',
    skillsVersion: '1.0.21',
  });

  expect(violation).toBeUndefined();
});

test('findApiCommandCompatViolation treats timestamped rc builds as matching the stable app boundary prefix', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithAppByChannelRule,
    commandId: 'flow-surfaces apply',
    cliVersion: '2.1.0-beta.41',
    appVersion: '2.1.0-rc.20260611064603847',
    skillsVersion: '1.0.21',
  });

  expect(violation).toBeUndefined();
});

test('findApiCommandCompatViolation ignores trailing prerelease segments when evaluating rc floors', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithRcByChannelRule,
    commandId: 'flow-surfaces apply',
    cliVersion: '2.1.0-beta.41',
    appVersion: '2.1.0-rc.1.7',
    skillsVersion: '1.0.21',
  });

  expect(violation).toBeUndefined();
});

test('findApiCommandCompatViolation treats webuild app versions as stable channel builds', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithAppByChannelRule,
    commandId: 'flow-surfaces apply',
    cliVersion: '2.1.0-beta.41',
    appVersion: '2.1.1-webuild.20260611064603847',
    skillsVersion: '1.0.21',
  });

  expect(violation).toBeUndefined();
});

test('findApiCommandCompatViolation treats custom prerelease app versions as stable channel builds', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithAppByChannelRule,
    commandId: 'flow-surfaces apply',
    cliVersion: '2.1.0-beta.41',
    appVersion: '2.1.1-foo.20260611064603847',
    skillsVersion: '1.0.21',
  });

  expect(violation).toBeUndefined();
});

test('findApiCommandCompatViolation blocks unparseable app versions when appByChannel requests it', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithAppByChannelRule,
    commandId: 'flow-surfaces apply',
    cliVersion: '2.1.0-beta.41',
    appVersion: 'not-a-version',
    skillsVersion: '1.0.21',
  });

  expect(violation?.rule.code).toBe('FLOW_SURFACES_OLD_APP_NEW_SKILLS_UNSUPPORTED');
  expect(violation?.blockedByUnknownAppChannel).toBe(true);
});

test('formatApiCommandCompatViolation includes a concrete upgrade target when app lt is configured', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithRules,
    commandId: 'data-modeling collections apply',
    cliVersion: '2.1.0-beta.41',
    appVersion: '2.1.0-beta.19',
  });

  expect(violation).toBeDefined();
  if (!violation) {
    throw new Error('Expected a compatibility violation.');
  }

  expect(formatApiCommandCompatViolation(violation)).toContain('upgrade the app to >= 2.1.0-beta.26');
  expect(formatApiCommandCompatViolation(violation)).toContain('use a CLI version < 2.1.0-beta.41');
});

test('formatApiCommandCompatViolation includes combined app and skills guidance for appByChannel rules', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithAppByChannelRule,
    commandId: 'flow-surfaces apply',
    cliVersion: '2.1.0-beta.41',
    appVersion: '2.1.0-beta.35',
    skillsVersion: '1.0.21',
  });

  expect(violation).toBeDefined();
  if (!violation) {
    throw new Error('Expected a compatibility violation.');
  }

  expect(formatApiCommandCompatViolation(violation)).toContain('beta app version < 2.1.0-beta.36');
  expect(formatApiCommandCompatViolation(violation)).toContain('NocoBase AI skills version > 1.0.20');
  expect(formatApiCommandCompatViolation(violation)).toContain('upgrade the app to >= 2.1.0-beta.36');
  expect(formatApiCommandCompatViolation(violation)).toContain('use a NocoBase AI skills version <= 1.0.20');
});

test('findApiCommandCompatViolation matches skills version conditions for generated API commands', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithSkillsRule,
    commandId: 'data-modeling fields apply',
    cliVersion: '2.1.0-beta.40',
    appVersion: '2.1.0-beta.20',
    skillsVersion: '1.0.4',
  });

  expect(violation?.rule.code).toBe('FIELDS_APPLY_SKILLS_TOO_OLD');
});

test('findApiCommandCompatViolation hard-blocks when a skills rule applies but the installed skills version is unavailable', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithSkillsRule,
    commandId: 'data-modeling fields apply',
    cliVersion: '2.1.0-beta.40',
    appVersion: '2.1.0-beta.20',
  });

  expect(violation?.missingVersions).toEqual(['skills']);
});

test('formatApiCommandCompatViolation includes concrete skills guidance when skills are too old', () => {
  const violation = findApiCommandCompatViolation({
    packageJson: packageJsonWithSkillsRule,
    commandId: 'data-modeling fields apply',
    cliVersion: '2.1.0-beta.40',
    appVersion: '2.1.0-beta.20',
    skillsVersion: '1.0.4',
  });

  expect(violation).toBeDefined();
  if (!violation) {
    throw new Error('Expected a compatibility violation.');
  }

  expect(formatApiCommandCompatViolation(violation)).toContain('NocoBase AI skills version < 1.0.5');
  expect(formatApiCommandCompatViolation(violation)).toContain('update the NocoBase AI coding skills to >= 1.0.5');
});

test('published CLI package blocks all light-extension command groups on old apps when new skills are installed', () => {
  const packageJson = JSON.parse(readFileSync(resolve('packages/core/cli/package.json'), 'utf8')) as unknown;
  const commandIds = [
    'light-extension-repos list',
    'light-extension-entries get',
    'light-extension-references read-references',
    'light-extension-files save-source',
    'light-extensions compile-workspace-preview',
  ];

  for (const commandId of commandIds) {
    const violation = findApiCommandCompatViolation({
      packageJson,
      commandId,
      cliVersion: '2.2.0-beta.16',
      appVersion: '2.2.0-beta.15',
      skillsVersion: '1.0.21',
    });

    expect(violation?.rule.code).toBe('LIGHT_EXTENSION_OLD_APP_NEW_SKILLS_UNSUPPORTED');
    if (!violation) {
      throw new Error(`Expected a light-extension compatibility violation for ${commandId}.`);
    }
    expect(formatApiCommandCompatViolation(violation)).toContain('upgrade the app to >= 2.2.0-beta.16');
  }
});

test('published CLI package allows light-extension commands at the app floor and with legacy skills', () => {
  const packageJson = JSON.parse(readFileSync(resolve('packages/core/cli/package.json'), 'utf8')) as unknown;

  expect(
    findApiCommandCompatViolation({
      packageJson,
      commandId: 'light-extension-files save-source',
      cliVersion: '2.2.0-beta.16',
      appVersion: '2.2.0-beta.16',
      skillsVersion: '1.0.21',
    }),
  ).toBeUndefined();
  expect(
    findApiCommandCompatViolation({
      packageJson,
      commandId: 'light-extensions compile-workspace-preview',
      cliVersion: '2.2.0-beta.16',
      appVersion: '2.2.0-beta.15',
      skillsVersion: '1.0.20',
    }),
  ).toBeUndefined();
});

test('published CLI package guards RunJS source authoring on old apps with new skills', () => {
  const packageJson = JSON.parse(readFileSync(resolve('packages/core/cli/package.json'), 'utf8')) as unknown;

  const violation = findApiCommandCompatViolation({
    packageJson,
    commandId: 'run-js-sources save',
    cliVersion: '2.2.0-beta.16',
    appVersion: '2.2.0-beta.15',
    skillsVersion: '1.0.21',
  });

  expect(violation?.rule.code).toBe('RUN_JS_SOURCES_OLD_APP_NEW_SKILLS_UNSUPPORTED');
  if (!violation) {
    throw new Error('Expected a RunJS source compatibility violation.');
  }
  expect(formatApiCommandCompatViolation(violation)).toContain('upgrade the app to >= 2.2.0-beta.16');
});

test('published CLI package allows RunJS source authoring at the app floor and with legacy skills', () => {
  const packageJson = JSON.parse(readFileSync(resolve('packages/core/cli/package.json'), 'utf8')) as unknown;

  expect(
    findApiCommandCompatViolation({
      packageJson,
      commandId: 'run-js-sources save',
      cliVersion: '2.2.0-beta.16',
      appVersion: '2.2.0-beta.16',
      skillsVersion: '1.0.21',
    }),
  ).toBeUndefined();
  expect(
    findApiCommandCompatViolation({
      packageJson,
      commandId: 'run-js-sources compile-preview',
      cliVersion: '2.2.0-beta.16',
      appVersion: '2.2.0-beta.15',
      skillsVersion: '1.0.20',
    }),
  ).toBeUndefined();
});

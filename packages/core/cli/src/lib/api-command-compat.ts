/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { translateCli } from './cli-locale.js';
import { compareVersions } from './self-manager.js';

export interface ApiCommandCompatVersionCondition {
  eq?: string;
  gt?: string;
  gte?: string;
  lt?: string;
  lte?: string;
}

export interface ApiCommandCompatAppByChannelCondition {
  stable?: ApiCommandCompatVersionCondition;
  beta?: ApiCommandCompatVersionCondition;
  alpha?: ApiCommandCompatVersionCondition;
  rc?: ApiCommandCompatVersionCondition;
  unknownPrerelease?: 'block' | 'skip';
}

export interface ApiCommandCompatRule {
  code: string;
  target: {
    command?: string;
    commandPrefix?: string;
  };
  when?: {
    cli?: ApiCommandCompatVersionCondition;
    app?: ApiCommandCompatVersionCondition;
    appByChannel?: ApiCommandCompatAppByChannelCondition;
    skills?: ApiCommandCompatVersionCondition;
  };
}

export type ApiCommandCompatVersionKey = 'cli' | 'app' | 'skills';
export type ApiCommandCompatAppChannel = 'stable' | 'beta' | 'alpha' | 'rc' | 'unknownPrerelease';

export interface ApiCommandCompatViolation {
  rule: ApiCommandCompatRule;
  commandId: string;
  cliVersion?: string;
  appVersion?: string;
  skillsVersion?: string;
  missingVersions: ApiCommandCompatVersionKey[];
  appChannel?: ApiCommandCompatAppChannel;
  matchedAppByChannelCondition?: ApiCommandCompatVersionCondition;
  blockedByUnknownAppChannel?: boolean;
}

type ParsedApiCommandCompatRule = ApiCommandCompatRule & {
  order: number;
};

type VersionMatchResult = 'match' | 'mismatch' | 'skip' | 'missing';

type AppByChannelEvaluation = {
  result: VersionMatchResult;
  channel?: ApiCommandCompatAppChannel;
  condition?: ApiCommandCompatVersionCondition;
  blockedByUnknownChannel?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeText(value: unknown): string | undefined {
  const normalized = String(value ?? '').trim();
  return normalized || undefined;
}

function parseVersionCondition(value: unknown): ApiCommandCompatVersionCondition | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const condition: ApiCommandCompatVersionCondition = {};

  for (const operator of ['eq', 'gt', 'gte', 'lt', 'lte'] as const) {
    const normalized = normalizeText(value[operator]);
    if (normalized) {
      condition[operator] = normalized;
    }
  }

  return Object.keys(condition).length > 0 ? condition : undefined;
}

function parseAppByChannelCondition(value: unknown): ApiCommandCompatAppByChannelCondition | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const stable = parseVersionCondition(value.stable);
  const beta = parseVersionCondition(value.beta);
  const alpha = parseVersionCondition(value.alpha);
  const rc = parseVersionCondition(value.rc);
  const unknownPrerelease =
    value.unknownPrerelease === 'block' || value.unknownPrerelease === 'skip' ? value.unknownPrerelease : undefined;

  if (!stable && !beta && !alpha && !rc && !unknownPrerelease) {
    return undefined;
  }

  return {
    ...(stable ? { stable } : {}),
    ...(beta ? { beta } : {}),
    ...(alpha ? { alpha } : {}),
    ...(rc ? { rc } : {}),
    ...(unknownPrerelease ? { unknownPrerelease } : {}),
  };
}

function parseCompatRule(value: unknown, order: number): ParsedApiCommandCompatRule | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const code = normalizeText(value.code);
  const target = isRecord(value.target) ? value.target : undefined;
  const command = normalizeText(target?.command);
  const commandPrefix = normalizeText(target?.commandPrefix);

  if (!code || (!command && !commandPrefix)) {
    return undefined;
  }

  const when = isRecord(value.when) ? value.when : undefined;
  const cli = parseVersionCondition(when?.cli);
  const app = parseVersionCondition(when?.app);
  const appByChannel = parseAppByChannelCondition(when?.appByChannel);
  const skills = parseVersionCondition(when?.skills);

  return {
    code,
    order,
    target: {
      ...(command ? { command } : {}),
      ...(commandPrefix ? { commandPrefix } : {}),
    },
    ...(cli || app || appByChannel || skills
      ? {
          when: {
            ...(cli ? { cli } : {}),
            ...(app ? { app } : {}),
            ...(appByChannel ? { appByChannel } : {}),
            ...(skills ? { skills } : {}),
          },
        }
      : {}),
  };
}

export function getApiCommandCompatRules(packageJson: unknown): ApiCommandCompatRule[] {
  if (!isRecord(packageJson)) {
    return [];
  }

  const nocobase = isRecord(packageJson.nocobase) ? packageJson.nocobase : undefined;
  const compat = isRecord(nocobase?.apiCommandCompat) ? nocobase.apiCommandCompat : undefined;
  const rawRules = Array.isArray(compat?.rules) ? compat.rules : [];

  return rawRules
    .map((rule, order) => parseCompatRule(rule, order))
    .filter((rule): rule is ParsedApiCommandCompatRule => Boolean(rule))
    .map(({ order: _order, ...rule }) => rule);
}

function compareWithOperator(version: string, operator: keyof ApiCommandCompatVersionCondition, expected: string): boolean {
  const compared = compareVersions(version, expected);

  switch (operator) {
    case 'eq':
      return compared === 0;
    case 'gt':
      return compared > 0;
    case 'gte':
      return compared >= 0;
    case 'lt':
      return compared < 0;
    case 'lte':
      return compared <= 0;
    default:
      return false;
  }
}

function normalizeAppByChannelComparableVersion(version: string): string {
  const normalized = String(version ?? '').trim();
  const match = normalized.match(/^(\d+\.\d+\.\d+)-(alpha|beta|rc)(?:\.(\d+))?(?:\..+)?$/);

  if (!match) {
    return normalized;
  }

  const [, base, channel, sequence] = match;
  return sequence ? `${base}-${channel}.${sequence}` : `${base}-${channel}`;
}

function normalizeAppByChannelCondition(
  condition: ApiCommandCompatVersionCondition | undefined,
): ApiCommandCompatVersionCondition | undefined {
  if (!condition) {
    return undefined;
  }

  const normalized: ApiCommandCompatVersionCondition = {};

  for (const operator of ['eq', 'gt', 'gte', 'lt', 'lte'] as const) {
    const version = condition[operator];
    if (version) {
      normalized[operator] = normalizeAppByChannelComparableVersion(version);
    }
  }

  return normalized;
}

function matchesVersionCondition(version: string, condition?: ApiCommandCompatVersionCondition): boolean {
  if (!condition) {
    return true;
  }

  return (['eq', 'gt', 'gte', 'lt', 'lte'] as const).every((operator) => {
    const expected = condition[operator];
    return expected ? compareWithOperator(version, operator, expected) : true;
  });
}

function evaluateVersionCondition(
  version: string | undefined,
  condition: ApiCommandCompatVersionCondition | undefined,
  options: {
    blockOnMissing: boolean;
  },
): VersionMatchResult {
  if (!condition) {
    return 'match';
  }

  if (!version) {
    return options.blockOnMissing ? 'missing' : 'skip';
  }

  return matchesVersionCondition(version, condition) ? 'match' : 'mismatch';
}

function resolveAppChannel(version: string): ApiCommandCompatAppChannel {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-.]+))?$/);
  if (!match) {
    return 'unknownPrerelease';
  }

  const prerelease = match[4];
  if (!prerelease) {
    return 'stable';
  }

  const channel = prerelease.split('.').find(Boolean);
  if (channel === 'alpha') {
    return 'alpha';
  }
  if (channel === 'beta') {
    return 'beta';
  }
  if (channel === 'rc') {
    return 'rc';
  }

  return 'unknownPrerelease';
}

function evaluateAppByChannelCondition(
  version: string | undefined,
  condition: ApiCommandCompatAppByChannelCondition | undefined,
): AppByChannelEvaluation {
  if (!condition) {
    return {
      result: 'match',
    };
  }

  if (!version) {
    return {
      result: 'missing',
    };
  }

  const channel = resolveAppChannel(version);
  if (channel === 'unknownPrerelease') {
    if (condition.unknownPrerelease === 'block') {
      return {
        result: 'match',
        channel,
        blockedByUnknownChannel: true,
      };
    }

    return {
      result: 'skip',
      channel,
    };
  }

  const channelCondition = condition[channel];
  if (!channelCondition) {
    return {
      result: 'skip',
      channel,
    };
  }

  const comparableVersion = normalizeAppByChannelComparableVersion(version);
  const comparableCondition = normalizeAppByChannelCondition(channelCondition);

  return {
    result: matchesVersionCondition(comparableVersion, comparableCondition) ? 'match' : 'mismatch',
    channel,
    condition: channelCondition,
  };
}

function matchesCommandPrefix(commandId: string, commandPrefix?: string): boolean {
  if (!commandPrefix) {
    return false;
  }

  return commandId === commandPrefix || commandId.startsWith(`${commandPrefix} `);
}

function formatVersionCondition(condition?: ApiCommandCompatVersionCondition): string | undefined {
  if (!condition) {
    return undefined;
  }

  const clauses: string[] = [];

  if (condition.eq) {
    clauses.push(`= ${condition.eq}`);
  }
  if (condition.gt) {
    clauses.push(`> ${condition.gt}`);
  }
  if (condition.gte) {
    clauses.push(`>= ${condition.gte}`);
  }
  if (condition.lt) {
    clauses.push(`< ${condition.lt}`);
  }
  if (condition.lte) {
    clauses.push(`<= ${condition.lte}`);
  }

  return clauses.length > 0 ? clauses.join(' and ') : undefined;
}

function getSuggestedUpgradeTarget(condition?: ApiCommandCompatVersionCondition): string | undefined {
  if (condition?.lt) {
    return `>= ${condition.lt}`;
  }
  if (condition?.lte) {
    return `> ${condition.lte}`;
  }

  return undefined;
}

function getSuggestedCompatibleTarget(condition?: ApiCommandCompatVersionCondition): string | undefined {
  if (condition?.gt) {
    return `<= ${condition.gt}`;
  }
  if (condition?.gte) {
    return `< ${condition.gte}`;
  }

  return undefined;
}

function getSuggestedTarget(condition?: ApiCommandCompatVersionCondition): string | undefined {
  return getSuggestedUpgradeTarget(condition) ?? getSuggestedCompatibleTarget(condition);
}

function getPrioritizedRules(commandId: string, rules: ApiCommandCompatRule[]): ParsedApiCommandCompatRule[] {
  const exactMatches: ParsedApiCommandCompatRule[] = [];
  const prefixMatches: ParsedApiCommandCompatRule[] = [];

  rules.forEach((rule, order) => {
    const parsedRule: ParsedApiCommandCompatRule = { ...rule, order };
    if (rule.target.command === commandId) {
      exactMatches.push(parsedRule);
      return;
    }
    if (matchesCommandPrefix(commandId, rule.target.commandPrefix)) {
      prefixMatches.push(parsedRule);
    }
  });

  prefixMatches.sort((left, right) => {
    const leftLength = left.target.commandPrefix?.length ?? 0;
    const rightLength = right.target.commandPrefix?.length ?? 0;
    return rightLength - leftLength || left.order - right.order;
  });

  return [...exactMatches, ...prefixMatches];
}

function pushIfPresent(values: string[], value: string | undefined) {
  if (value) {
    values.push(value);
  }
}

function formatJoinedList(values: string[]): string {
  if (values.length <= 1) {
    return values[0] ?? '';
  }

  if (values.length === 2) {
    return translateCli(
      'apiCommandCompat.join.two',
      {
        left: values[0],
        right: values[1],
      },
      {
        fallback: '{{left}} and {{right}}',
      },
    );
  }

  return translateCli(
    'apiCommandCompat.join.many',
    {
      head: values.slice(0, -1).join(', '),
      tail: values[values.length - 1],
    },
    {
      fallback: '{{head}}, and {{tail}}',
    },
  );
}

function getAppChannelLabel(channel: ApiCommandCompatAppChannel): string {
  return translateCli(
    `apiCommandCompat.channel.${channel}`,
    undefined,
    {
      fallback:
        channel === 'stable'
          ? 'stable'
          : channel === 'beta'
            ? 'beta'
            : channel === 'alpha'
              ? 'alpha'
              : channel === 'rc'
                ? 'rc'
              : 'unsupported prerelease',
    },
  );
}

function buildAppChannelRequirement(channel: ApiCommandCompatAppChannel, condition: ApiCommandCompatVersionCondition): string {
  return translateCli(
    'apiCommandCompat.requirement.appChannel',
    {
      channelLabel: getAppChannelLabel(channel),
      condition: formatVersionCondition(condition),
    },
    {
      fallback: '{{channelLabel}} app version {{condition}}',
    },
  );
}

function buildAppUnknownPrereleaseRequirement(): string {
  return translateCli(
    'apiCommandCompat.requirement.appUnknownPrereleaseBlocked',
    {
      channelLabel: getAppChannelLabel('unknownPrerelease'),
    },
    {
      fallback: '{{channelLabel}} app versions are blocked',
    },
  );
}

function buildAppByChannelRequirementSummary(condition: ApiCommandCompatAppByChannelCondition): string | undefined {
  const parts: string[] = [];

  pushIfPresent(parts, condition.stable ? buildAppChannelRequirement('stable', condition.stable) : undefined);
  pushIfPresent(parts, condition.beta ? buildAppChannelRequirement('beta', condition.beta) : undefined);
  pushIfPresent(parts, condition.alpha ? buildAppChannelRequirement('alpha', condition.alpha) : undefined);
  pushIfPresent(parts, condition.rc ? buildAppChannelRequirement('rc', condition.rc) : undefined);
  pushIfPresent(parts, condition.unknownPrerelease === 'block' ? buildAppUnknownPrereleaseRequirement() : undefined);

  return parts.length > 0 ? formatJoinedList(parts) : undefined;
}

function buildRequirementText(rule: ApiCommandCompatRule, violation: ApiCommandCompatViolation): string | undefined {
  const parts: string[] = [];
  const cliVersionCondition = formatVersionCondition(rule.when?.cli);
  const appVersionCondition = formatVersionCondition(rule.when?.app);
  const skillsVersionCondition = formatVersionCondition(rule.when?.skills);

  pushIfPresent(
    parts,
    cliVersionCondition
      ? translateCli(
          'apiCommandCompat.requirement.cli',
          {
            condition: cliVersionCondition,
          },
          {
            fallback: 'CLI version {{condition}}',
          },
        )
      : undefined,
  );

  if (violation.matchedAppByChannelCondition && violation.appChannel && violation.appChannel !== 'unknownPrerelease') {
    pushIfPresent(parts, buildAppChannelRequirement(violation.appChannel, violation.matchedAppByChannelCondition));
  } else if (violation.blockedByUnknownAppChannel) {
    pushIfPresent(parts, buildAppUnknownPrereleaseRequirement());
  } else {
    pushIfPresent(
      parts,
      rule.when?.appByChannel ? buildAppByChannelRequirementSummary(rule.when.appByChannel) : undefined,
    );
  }

  pushIfPresent(
    parts,
    appVersionCondition
      ? translateCli(
          'apiCommandCompat.requirement.app',
          {
            condition: appVersionCondition,
          },
          {
            fallback: 'app version {{condition}}',
          },
        )
      : undefined,
  );
  pushIfPresent(
    parts,
    skillsVersionCondition
      ? translateCli(
          'apiCommandCompat.requirement.skills',
          {
            condition: skillsVersionCondition,
          },
          {
            fallback: 'NocoBase AI skills version {{condition}}',
          },
        )
      : undefined,
  );

  return parts.length > 0 ? formatJoinedList(parts) : undefined;
}

function buildCurrentVersionsText(violation: ApiCommandCompatViolation): string {
  const parts: string[] = [];

  pushIfPresent(
    parts,
    violation.cliVersion
      ? translateCli(
          'apiCommandCompat.currentVersion.cli',
          {
            version: violation.cliVersion,
          },
          {
            fallback: 'CLI {{version}}',
          },
        )
      : undefined,
  );
  pushIfPresent(
    parts,
    violation.appVersion
      ? translateCli(
          'apiCommandCompat.currentVersion.app',
          {
            version: violation.appVersion,
          },
          {
            fallback: 'app {{version}}',
          },
        )
      : violation.rule.when?.app || violation.rule.when?.appByChannel
        ? translateCli('apiCommandCompat.currentVersion.appUnavailable', undefined, {
            fallback: 'app unavailable',
          })
        : undefined,
  );
  pushIfPresent(
    parts,
    violation.skillsVersion
      ? translateCli(
          'apiCommandCompat.currentVersion.skills',
          {
            version: violation.skillsVersion,
          },
          {
            fallback: 'NocoBase AI skills {{version}}',
          },
        )
      : violation.rule.when?.skills
        ? translateCli('apiCommandCompat.currentVersion.skillsUnavailable', undefined, {
            fallback: 'NocoBase AI skills unavailable',
          })
        : undefined,
  );

  return translateCli(
    'apiCommandCompat.currentVersionsLine',
    {
      versions: formatJoinedList(parts),
    },
    {
      fallback: 'Current versions: {{versions}}.',
    },
  );
}

function buildMissingVersionLabel(missingVersions: ApiCommandCompatVersionKey[]): string {
  const labels = missingVersions.map((versionKey) =>
    translateCli(
      `apiCommandCompat.versionLabel.${versionKey}`,
      undefined,
      {
        fallback:
          versionKey === 'cli'
            ? 'CLI version'
            : versionKey === 'app'
              ? 'target app version'
              : 'installed NocoBase AI skills version',
      },
    ),
  );

  return formatJoinedList(labels);
}

function getSuggestedAppByChannelTarget(
  condition: ApiCommandCompatAppByChannelCondition | undefined,
  violation: ApiCommandCompatViolation,
): string | undefined {
  if (!condition || !violation.appChannel || violation.appChannel === 'unknownPrerelease') {
    return undefined;
  }

  return getSuggestedTarget(violation.matchedAppByChannelCondition ?? condition[violation.appChannel]);
}

function getSupportedAppVersionSummary(condition: ApiCommandCompatAppByChannelCondition | undefined): string | undefined {
  if (!condition) {
    return undefined;
  }

  const parts: string[] = [];

  pushIfPresent(
    parts,
    condition.stable
      ? translateCli(
          'apiCommandCompat.supportedAppTarget',
          {
            channelLabel: getAppChannelLabel('stable'),
            target: getSuggestedTarget(condition.stable),
          },
          {
            fallback: '{{channelLabel}} {{target}}',
          },
        )
      : undefined,
  );
  pushIfPresent(
    parts,
    condition.beta
      ? translateCli(
          'apiCommandCompat.supportedAppTarget',
          {
            channelLabel: getAppChannelLabel('beta'),
            target: getSuggestedTarget(condition.beta),
          },
          {
            fallback: '{{channelLabel}} {{target}}',
          },
        )
      : undefined,
  );
  pushIfPresent(
    parts,
    condition.alpha
      ? translateCli(
          'apiCommandCompat.supportedAppTarget',
          {
            channelLabel: getAppChannelLabel('alpha'),
            target: getSuggestedTarget(condition.alpha),
          },
          {
            fallback: '{{channelLabel}} {{target}}',
          },
        )
      : undefined,
  );
  pushIfPresent(
    parts,
    condition.rc
      ? translateCli(
          'apiCommandCompat.supportedAppTarget',
          {
            channelLabel: getAppChannelLabel('rc'),
            target: getSuggestedTarget(condition.rc),
          },
          {
            fallback: '{{channelLabel}} {{target}}',
          },
        )
      : undefined,
  );

  return parts.length > 0 ? formatJoinedList(parts) : undefined;
}

export function findApiCommandCompatViolation(options: {
  packageJson: unknown;
  commandId: string;
  cliVersion?: string;
  appVersion?: string;
  skillsVersion?: string;
}): ApiCommandCompatViolation | undefined {
  const commandId = normalizeText(options.commandId);
  const cliVersion = normalizeText(options.cliVersion);
  const appVersion = normalizeText(options.appVersion);
  const skillsVersion = normalizeText(options.skillsVersion);

  if (!commandId) {
    return undefined;
  }

  const rules = getApiCommandCompatRules(options.packageJson);

  for (const rule of getPrioritizedRules(commandId, rules)) {
    const missingVersions = new Set<ApiCommandCompatVersionKey>();
    const cliResult = evaluateVersionCondition(cliVersion, rule.when?.cli, {
      blockOnMissing: true,
    });
    const appResult = evaluateVersionCondition(appVersion, rule.when?.app, {
      blockOnMissing: false,
    });
    const appByChannelResult = evaluateAppByChannelCondition(appVersion, rule.when?.appByChannel);
    const skillsResult = evaluateVersionCondition(skillsVersion, rule.when?.skills, {
      blockOnMissing: true,
    });

    if ([cliResult, appResult, appByChannelResult.result, skillsResult].includes('mismatch')) {
      continue;
    }
    if ([cliResult, appResult, appByChannelResult.result, skillsResult].includes('skip')) {
      continue;
    }

    if (cliResult === 'missing') {
      missingVersions.add('cli');
    }
    if (appResult === 'missing' || appByChannelResult.result === 'missing') {
      missingVersions.add('app');
    }
    if (skillsResult === 'missing') {
      missingVersions.add('skills');
    }

    return {
      rule,
      commandId,
      cliVersion,
      appVersion,
      skillsVersion,
      missingVersions: Array.from(missingVersions),
      appChannel: appByChannelResult.channel,
      matchedAppByChannelCondition: appByChannelResult.condition,
      blockedByUnknownAppChannel: appByChannelResult.blockedByUnknownChannel,
    };
  }

  return undefined;
}

export function formatApiCommandCompatViolation(violation: ApiCommandCompatViolation): string {
  const requirementText = buildRequirementText(violation.rule, violation);
  const appUpgradeTarget =
    getSuggestedAppByChannelTarget(violation.rule.when?.appByChannel, violation) ??
    getSuggestedUpgradeTarget(violation.rule.when?.app);
  const supportedAppVersionSummary = getSupportedAppVersionSummary(violation.rule.when?.appByChannel);
  const cliTarget = getSuggestedCompatibleTarget(violation.rule.when?.cli);
  const skillsUpgradeTarget = getSuggestedUpgradeTarget(violation.rule.when?.skills);
  const skillsCompatibleTarget = getSuggestedCompatibleTarget(violation.rule.when?.skills);
  const lines: string[] = [];

  if (violation.missingVersions.length > 0) {
    lines.push(
      translateCli(
        'apiCommandCompat.refusalTitleMissingVersion',
        {
          commandId: violation.commandId,
          versionLabel: buildMissingVersionLabel(violation.missingVersions),
        },
        {
          fallback: 'Refusing to run `nb api {{commandId}}` because the {{versionLabel}} is unavailable.',
        },
      ),
    );
  } else if (violation.appVersion) {
    lines.push(
      translateCli(
        'apiCommandCompat.refusalTitle',
        {
          commandId: violation.commandId,
          cliVersion: violation.cliVersion,
          appVersion: violation.appVersion,
        },
        {
          fallback:
            'Refusing to run `nb api {{commandId}}` because the current CLI version is {{cliVersion}} while the target app version is {{appVersion}}.',
        },
      ),
    );
  } else {
    lines.push(
      translateCli(
        'apiCommandCompat.refusalTitleGeneric',
        {
          commandId: violation.commandId,
        },
        {
          fallback: 'Refusing to run `nb api {{commandId}}` because the current version combination is not compatible.',
        },
      ),
    );
  }

  lines.push('');
  lines.push(buildCurrentVersionsText(violation));
  lines.push('');
  lines.push(
    requirementText
      ? translateCli(
          'apiCommandCompat.refusalBodyWithRequirements',
          {
            requirements: requirementText,
          },
          {
            fallback: 'This API command is blocked when used with {{requirements}}.',
          },
        )
      : translateCli('apiCommandCompat.refusalBody', undefined, {
          fallback: 'This API command may not be compatible with the current CLI and app version combination.',
        }),
  );
  lines.push('');
  lines.push(
    translateCli('apiCommandCompat.continueTitle', undefined, {
      fallback: 'To continue:',
    }),
  );

  if (violation.missingVersions.includes('app')) {
    lines.push(
      translateCli('apiCommandCompat.continueRefreshAppVersion', undefined, {
        fallback: '- refresh the target env runtime so the current app version can be detected, then retry',
      }),
    );
  } else if (appUpgradeTarget) {
    lines.push(
      translateCli(
        'apiCommandCompat.continueUpgradeAppToVersion',
        {
          suggestedUpgradeTarget: appUpgradeTarget,
        },
        {
          fallback: '- upgrade the app to {{suggestedUpgradeTarget}}',
        },
      ),
    );
  } else if (supportedAppVersionSummary) {
    lines.push(
      translateCli(
        'apiCommandCompat.continueUseSupportedAppVersion',
        {
          supportedTargets: supportedAppVersionSummary,
        },
        {
          fallback: '- use a supported app version: {{supportedTargets}}',
        },
      ),
    );
  } else if (violation.rule.when?.app) {
    lines.push(
      translateCli('apiCommandCompat.continueUpgradeApp', undefined, {
        fallback: '- upgrade the app to a compatible version',
      }),
    );
  }

  if (violation.rule.when?.skills) {
    if (violation.missingVersions.includes('skills')) {
      if (skillsUpgradeTarget) {
        lines.push(
          translateCli(
            'apiCommandCompat.continueInstallOrUpdateSkillsToVersion',
            {
              suggestedSkillsUpgradeTarget: skillsUpgradeTarget,
            },
            {
              fallback:
                '- run `nb skills install --yes` or `nb skills update --yes`, and make sure the managed skills version is {{suggestedSkillsUpgradeTarget}} before retrying',
            },
          ),
        );
      } else {
        lines.push(
          translateCli('apiCommandCompat.continueInstallOrUpdateSkills', undefined, {
            fallback:
              '- run `nb skills install --yes` or `nb skills update --yes`, then retry once the managed skills version is available',
          }),
        );
      }
    } else if (skillsUpgradeTarget) {
      lines.push(
        translateCli(
          'apiCommandCompat.continueUpdateSkillsToVersion',
          {
            suggestedSkillsUpgradeTarget: skillsUpgradeTarget,
          },
          {
            fallback:
              '- install or update the NocoBase AI coding skills to {{suggestedSkillsUpgradeTarget}}. Run `nb skills update --yes` to refresh the managed skills.',
          },
        ),
      );
    } else if (skillsCompatibleTarget) {
      lines.push(
        translateCli(
          'apiCommandCompat.continueUseCompatibleSkillsVersion',
          {
            suggestedSkillsTarget: skillsCompatibleTarget,
          },
          {
            fallback: '- or use a NocoBase AI skills version {{suggestedSkillsTarget}}',
          },
        ),
      );
    }
  }

  if (cliTarget) {
    lines.push(
      translateCli(
        'apiCommandCompat.continueUseCompatibleCliVersion',
        {
          suggestedCliTarget: cliTarget,
        },
        {
          fallback: '- or use a CLI version {{suggestedCliTarget}}',
        },
      ),
    );
  } else if (violation.rule.when?.cli) {
    lines.push(
      translateCli('apiCommandCompat.continueUseCompatibleCli', undefined, {
        fallback: '- or use a compatible CLI version',
      }),
    );
  }

  return lines.join('\n');
}

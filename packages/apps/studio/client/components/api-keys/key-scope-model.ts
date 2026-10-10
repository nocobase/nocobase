/**
 * The key editor's model: what a draft holds, what it sends, and how a key's scope reads in a list. The server checks
 * everything again (`@nocobase/app-plugin-api-keys`); these only keep the form from offering what it would refuse.
 */
import type {
  CreateApiKeyRequest,
  KeyScopeGroupView,
  KeyScopeInput,
  KeyScopeLevel,
  KeyScopeOptions,
  KeyScopePresetView,
  LocalizedText,
} from '@nocobase/app-plugin-api-keys/shared/scopes';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** A title as the server sends it, in the viewer's language. */
export function localized(
  t: Translate,
  text: LocalizedText | null | undefined,
): string {
  if (!text) return '';
  return typeof text === 'string'
    ? text
    : t(text.key, { ns: text.ns, defaultValue: text.key });
}

export type ExpiryChoice = '7' | '30' | '90' | '365' | 'never';

const EXPIRY_DAYS: readonly ExpiryChoice[] = ['7', '30', '90', '365'];

/** The expiries offered: a key with a scope may be capped (`maxScopedKeyDays`), which also takes "never" away. */
export function expiryChoices(
  options: Pick<KeyScopeOptions, 'maxScopedKeyDays'> | undefined,
  scoped: boolean,
): ExpiryChoice[] {
  const max = scoped ? (options?.maxScopedKeyDays ?? null) : null;
  return [
    ...EXPIRY_DAYS.filter((days) => max === null || Number(days) <= max),
    ...(max === null ? (['never'] as const) : []),
  ];
}

/** The proposed expiry: 90 days, or the cap when it is shorter. */
export function defaultExpiry(
  options: Pick<KeyScopeOptions, 'maxScopedKeyDays'> | undefined,
  scoped: boolean,
): ExpiryChoice {
  const choices = expiryChoices(options, scoped);
  return choices.includes('90') ? '90' : (choices.at(-1) ?? '7');
}

export interface GroupDraft {
  readonly level: KeyScopeLevel | 'none';
  /** `all`, or the ids picked. */
  readonly objects: 'all' | readonly string[];
}

export interface KeyDraft {
  readonly name: string;
  readonly description: string;
  readonly expiry: ExpiryChoice;
  /** `full`: the key is its owner; `scoped`: only the groups below. */
  readonly mode: 'full' | 'scoped';
  readonly groups: Readonly<Record<string, GroupDraft>>;
}

export function emptyDraft(
  options: KeyScopeOptions | undefined,
  mode: KeyDraft['mode'],
): KeyDraft {
  return {
    name: '',
    description: '',
    expiry: defaultExpiry(options, mode === 'scoped'),
    mode,
    groups: {},
  };
}

/** A draft set to a preset: its groups and levels, its expiry when it suggests one. */
export function applyPreset(
  draft: KeyDraft,
  preset: KeyScopePresetView,
  options: KeyScopeOptions,
): KeyDraft {
  const groups: Record<string, GroupDraft> = {};
  for (const [id, grant] of Object.entries(preset.groups))
    if (options.groups.some((group) => group.id === id))
      groups[id] = {
        level: grant.level,
        objects: grant.objects === 'pick' ? [] : 'all',
      };
  const days = preset.expiresInDays;
  const choices = expiryChoices(options, true);
  const expiry =
    days === null
      ? choices.includes('never')
        ? 'never'
        : draft.expiry
      : (choices.find((choice) => choice === String(days)) ?? draft.expiry);
  return { ...draft, mode: 'scoped', groups, expiry };
}

/** The groups set above none. */
export function chosenGroups(
  draft: KeyDraft,
): [string, GroupDraft & { level: KeyScopeLevel }][] {
  return Object.entries(draft.groups).filter(
    (entry): entry is [string, GroupDraft & { level: KeyScopeLevel }] =>
      entry[1].level !== 'none',
  );
}

/** Why the draft cannot be sent yet, as a locale key; null when it can. */
export function draftProblem(draft: KeyDraft): string | null {
  if (!draft.name.trim()) return 'keys.problems.name';
  if (draft.mode === 'full') return null;
  const chosen = chosenGroups(draft);
  if (chosen.length === 0) return 'keys.problems.empty';
  if (
    chosen.some(
      ([, group]) => group.objects !== 'all' && group.objects.length === 0,
    )
  )
    return 'keys.problems.objects';
  return null;
}

export function requestOf(draft: KeyDraft): CreateApiKeyRequest {
  const scope: KeyScopeInput | null =
    draft.mode === 'full'
      ? null
      : {
          groups: Object.fromEntries(
            chosenGroups(draft).map(([id, group]) => [
              id,
              group.objects === 'all'
                ? { level: group.level }
                : { level: group.level, objects: group.objects },
            ]),
          ),
        };
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    expiresInDays: draft.expiry === 'never' ? null : Number(draft.expiry),
    scope,
  };
}

/** A key's scope in one line per group: "Apps and deployments: Read and write (2)". */
export function scopeLines(
  t: Translate,
  scope: KeyScopeInput | null,
  groups: readonly KeyScopeGroupView[],
): string[] {
  if (!scope) return [t('keys.scope.full')];
  return Object.entries(scope.groups).map(([id, grant]) => {
    const group = groups.find((item) => item.id === id);
    const title = group ? localized(t, group.title) : id;
    const objects =
      grant.objects === undefined || grant.objects === 'all'
        ? ''
        : ` (${t('keys.scope.objectCount', { count: grant.objects.length })})`;
    return `${title}: ${t(`keys.levels.${grant.level}`)}${objects}`;
  });
}

/** A date and time in the viewer's language, or null for none. */
export function formatDate(
  value: string | null,
  locale: string,
): string | null {
  if (!value) return null;
  return new Date(value).toLocaleString(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

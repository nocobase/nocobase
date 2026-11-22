/**
 * The three kinds of data rule the Data rules tab edits. Each one is a rule plugin's `/api/authorization/<path>`
 * surface, gated by its own settings item; this plugin only renders them.
 */
export interface DataRuleKind {
  /** The rule tab's key and the `?rule=` value, such as `sharing-rules`. */
  readonly key: string;
  /** The route prefix under `/api/authorization`, such as `sharingRules`. */
  readonly path: string;
  /** The settings item whose `read`, `create`, `update` and `delete` gate the rules. */
  readonly settings: string;
  /** The locale block under `settings.` holding this kind's own texts. */
  readonly texts: 'defaultAccess' | 'sharingRules' | 'restrictionRules';
  /** The rule names the people it applies to, with a title and a reason. */
  readonly subjects: boolean;
  /** At most one rule per resource. */
  readonly onePerResource: boolean;
  /** The rule may select every record; a sharing rule never does. */
  readonly allowAll: boolean;
}

export const DEFAULT_ACCESS_RULES: DataRuleKind = {
  key: 'default-access',
  path: 'defaultAccess',
  settings: 'authorization.default-access',
  texts: 'defaultAccess',
  subjects: false,
  onePerResource: true,
  allowAll: true,
};

export const SHARING_RULES: DataRuleKind = {
  key: 'sharing-rules',
  path: 'sharingRules',
  settings: 'authorization.sharing-rules',
  texts: 'sharingRules',
  subjects: true,
  onePerResource: false,
  allowAll: false,
};

export const RESTRICTION_RULES: DataRuleKind = {
  key: 'restriction-rules',
  path: 'restrictionRules',
  settings: 'authorization.restriction-rules',
  texts: 'restrictionRules',
  subjects: true,
  onePerResource: false,
  allowAll: true,
};

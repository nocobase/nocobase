/**
 * The values the server publishes, by section, as the browser reads them through `config.public`.
 *
 * Each section's owner augments it with the fields it lists in `public` on the server, so that a mistyped path or a
 * wrong value type fails `typecheck` rather than reading `undefined` at runtime:
 *
 * ```ts
 * declare module '@nocobase/app-client' {
 *   interface PublicAppConfig {
 *     billing: { currency?: string; trialDays?: number };
 *   }
 * }
 * ```
 *
 * Every field is optional: a field the server has no value for is not sent.
 */
export interface PublicAppConfig {
  i18n: { defaultLocale?: string };
  /** The application's own `package.json`, published by the runtime rather than baked into the build. */
  app: { displayName?: string; version?: string };
}

type PublicLeaf =
  | string
  | number
  | boolean
  | null
  | readonly (string | number | boolean | null)[];

/** Every leaf path of {@link PublicAppConfig}, such as `i18n.defaultLocale`. */
export type PublicConfigPath<T = PublicAppConfig> = {
  [K in keyof T & string]: NonNullable<T[K]> extends PublicLeaf
    ? K
    : NonNullable<T[K]> extends object
      ? `${K}.${PublicConfigPath<NonNullable<T[K]>>}`
      : never;
}[keyof T & string];

/** The value type at a {@link PublicConfigPath}. */
export type PublicConfigValue<
  P extends string,
  T = PublicAppConfig,
> = P extends `${infer Head}.${infer Rest}`
  ? Head extends keyof T
    ? PublicConfigValue<Rest, NonNullable<T[Head]>>
    : never
  : P extends keyof T
    ? NonNullable<T[P]>
    : never;

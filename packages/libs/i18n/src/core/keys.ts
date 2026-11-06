import type { TranslationOverrides } from './types.js';

/**
 * Translation values are leaves; anything else is a nested group of keys.
 */
type TranslationLeaf = string | number | boolean;

/**
 * The shape of a locale, derived from the source locale rather than written out by hand.
 *
 * A locale file states its structure once, in `en-US`, and every other locale is annotated with this so a key that
 * does not exist in the source is a compile error:
 *
 * ```ts
 * // en-US.ts
 * const enUS = { language: { label: 'Language' } };
 * export type AppResource = LocaleResource<typeof enUS>;
 * export default enUS;
 *
 * // zh-CN.ts
 * const zhCN: AppResource = { language: { label: '语言' } };
 * ```
 *
 * Leaves widen to `string`, so a translation is not forced to repeat the English wording as a literal type, and each
 * level is readonly, which keeps a resource from being mutated after it is registered.
 *
 * The top level also accepts `overrides`, the block an application uses to reword a plugin's copy. It is not part of
 * the source resource — the application never declares it in `en-US` — so deriving the shape strictly would reject the
 * one key a locale file is allowed to add.
 */
export type LocaleResource<TSource> = LocaleResourceShape<TSource> & {
  readonly overrides?: TranslationOverrides;
};

type LocaleResourceShape<TSource> = TSource extends TranslationLeaf
  ? string
  : {
      readonly [Key in keyof TSource]: LocaleResourceShape<TSource[Key]>;
    } & LocalePluralForms<TSource>;

/** Additional CLDR forms, such as French `many`, are valid only for a source plural group. */
type LocalePluralForms<TSource> = {
  readonly [
    Key in keyof TSource & string as Key extends `${infer Base}_other`
      ? `${Base}_${'zero' | 'one' | 'two' | 'few' | 'many' | 'other'}`
      : never
  ]?: string;
};

/**
 * The same shape with every key optional, for a locale that is only partly translated.
 *
 * A missing key falls back rather than breaking, so a package may ship a translation before it is complete. Prefer
 * `LocaleResource` where a locale is meant to be exhaustive: it reports the omission instead of silently falling back.
 */
export type PartialLocaleResource<TSource> =
  PartialLocaleResourceShape<TSource> & {
    readonly overrides?: TranslationOverrides;
  };

type PartialLocaleResourceShape<TSource> = TSource extends TranslationLeaf
  ? string
  : {
      readonly [Key in keyof TSource]?: PartialLocaleResourceShape<
        TSource[Key]
      >;
    };

/**
 * Every addressable path in a resource object, as the dot-separated strings `t()` accepts.
 *
 * `{ trigger: { title: 'Trigger' } }` flattens to `'trigger' | 'trigger.title'`. The group itself stays in the union
 * because i18next resolves a group to its own `defaultValue` when one is present.
 */
export type FlattenKeys<TResource> = TResource extends TranslationLeaf
  ? never
  : {
      [Key in keyof TResource & string]: TResource[Key] extends TranslationLeaf
        ? Key
        : Key | `${Key}.${FlattenKeys<TResource[Key]>}`;
    }[keyof TResource & string];

/**
 * A translation key that suggests the namespace's own keys without rejecting anything else.
 *
 * Writing a key that belongs to the application or to the base package is legitimate — the fallback chain exists for
 * exactly that — so the union stays open through `string & {}`, which preserves completion for the known keys while
 * still accepting an arbitrary string.
 */
export type TranslationKey<TResource = never> = [TResource] extends [never]
  ? string
  : FlattenKeys<TResource> | (string & {});

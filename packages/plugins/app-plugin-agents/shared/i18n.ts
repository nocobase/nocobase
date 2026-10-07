/**
 * Text that is translated where it is shown: an i18n key in a namespace (a package name, or the application's). The
 * agents plugin shows text the application contributes (a subject's name, a scope's title, a business action's label)
 * without knowing its wording; the contributor names its own key and namespace.
 */
export interface I18nText {
  readonly key: string;
  readonly ns: string;
}

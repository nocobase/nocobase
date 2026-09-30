import { BASE_LOCALE } from '../core/registry.js';
import { I18nRuntime } from '../core/runtime.js';
import type {
  Locale,
  LocaleModuleExport,
  LocalesModule,
  Namespace,
} from '../core/types.js';

/**
 * What a test supplies for one namespace: either the package's own `locales/index.ts` loader map, or a single resource
 * — typically the default export of its `en-US.ts` — which is registered for the locale the test renders in.
 *
 * Pass the package's real files rather than a copy of their wording, so a test follows the copy when it changes and
 * fails when a component asks for a key the files do not have.
 */
export type TestNamespaceResources = LocalesModule | LocaleModuleExport;

export interface TestApplicationResources {
  /** The application's package name, which anchors the fallback chain and stands behind `APP_NS`. */
  readonly namespace: Namespace;
  readonly resources: TestNamespaceResources;
}

export interface CreateTestI18nRuntimeOptions {
  /** The locale the test renders in. Defaults to `en-US`. */
  readonly locale?: Locale;
  /** The application's default locale, and the first fallback language. Defaults to `en-US`. */
  readonly defaultLocale?: Locale;
  /**
   * The application namespace, when the component under test reads application wording or runs in its scope.
   *
   * When given, its locales decide which languages are on offer, as in a real application. Without it, every locale any
   * namespace declares is on offer, so a test can switch to one without also declaring an application.
   */
  readonly application?: TestApplicationResources;
  /** Every other namespace the component reads, keyed by package name. */
  readonly namespaces?: Readonly<Record<Namespace, TestNamespaceResources>>;
  /**
   * Throws on any key the whole fallback chain lacks, instead of rendering its `defaultValue` or the key itself.
   *
   * On by default, because the rendered text alone cannot tell a missing key from a present one: `t('a.b', 'Save')`
   * reads "Save" either way. Turn it off only for a test that renders keys it deliberately does not own, such as labels
   * that arrive from a server with a `defaultValue` beside them.
   */
  readonly strict?: boolean;
}

/**
 * Thrown by a strict test runtime when a translation lookup finds nothing, so the test fails at the call that asked for
 * the key rather than at an assertion on text that merely looks wrong.
 */
export class MissingTranslationError extends Error {
  public readonly key: string;
  public readonly namespace: Namespace;
  public readonly locales: readonly Locale[];

  public constructor(
    key: string,
    namespace: Namespace,
    locales: readonly Locale[],
  ) {
    super(
      `Missing translation "${key}" in namespace "${namespace}" (${locales.join(', ')}). ` +
        'Add it to the locale file, fix the key, or bind the component to the namespace that owns it.',
    );
    this.name = 'MissingTranslationError';
    this.key = key;
    this.namespace = namespace;
    this.locales = locales;
  }
}

function unwrapDefault(value: object): object {
  const inner = (value as { readonly default?: unknown }).default;
  return typeof inner === 'object' && inner !== null ? inner : value;
}

/**
 * Tells a loader map from a resource. Both are open records, but a resource's leaves are strings and nested records,
 * never functions, while every entry of a loader map is one.
 */
function isLocalesModule(
  value: TestNamespaceResources,
): value is LocalesModule {
  const entries = Object.values(unwrapDefault(value));
  return (
    entries.length > 0 && entries.every((entry) => typeof entry === 'function')
  );
}

function toLocalesModule(
  value: TestNamespaceResources,
  locale: Locale,
): LocalesModule {
  if (isLocalesModule(value)) return value;
  // Wrapped under `default` so a resource that happens to own a `default` key is not mistaken for a module.
  const resource = { default: unwrapDefault(value) };
  return { [locale]: () => Promise.resolve(resource) };
}

function declaredLocales(module: LocalesModule): readonly Locale[] {
  return Object.keys(unwrapDefault(module));
}

/**
 * Builds a real `I18nRuntime` from in-memory resources and loads the test's locale, so the first render is already
 * translated.
 *
 * It exercises the same lookup a running application does — nested keys, interpolation, plurals, the namespace and
 * language fallback chains — which a hand-written `vi.mock` of `useTranslation` does not. Mount the result with
 * `TestI18nProvider`.
 */
export async function createTestI18nRuntime(
  options: CreateTestI18nRuntimeOptions = {},
): Promise<I18nRuntime> {
  const locale = options.locale ?? BASE_LOCALE;
  const defaultLocale = options.defaultLocale ?? BASE_LOCALE;
  const application = options.application
    ? {
        namespace: options.application.namespace,
        module: toLocalesModule(options.application.resources, locale),
      }
    : undefined;
  const namespaces = Object.entries(options.namespaces ?? {}).map(
    ([namespace, resources]) => ({
      namespace,
      module: toLocalesModule(resources, locale),
    }),
  );

  const runtime = new I18nRuntime({
    defaultLocale,
    locales: application
      ? undefined
      : [
          ...new Set([
            locale,
            ...namespaces.flatMap((entry) => declaredLocales(entry.module)),
          ]),
        ],
    applicationNamespace: application?.namespace,
    initOptions:
      options.strict === false
        ? undefined
        : {
            saveMissing: true,
            missingKeyHandler: (locales, namespace, key) => {
              throw new MissingTranslationError(key, namespace, locales);
            },
          },
  });

  if (application) {
    runtime.registerApplicationNamespace(
      application.namespace,
      application.module,
    );
  }
  for (const entry of namespaces) {
    runtime.registerNamespace(entry.namespace, entry.module);
  }

  await runtime.init(locale);
  return runtime;
}

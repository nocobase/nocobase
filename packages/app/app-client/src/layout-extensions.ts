import {
  createElement,
  Fragment,
  useContext,
  type ComponentType,
  type PropsWithChildren,
  type ReactElement,
} from 'react';

import { ClientApplicationContext } from './application-context.js';
import type { AppClientContributionSource } from './plugins.js';

const LAYOUT_EXTENSION_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/i;

/**
 * What a plugin adds to the signed-in layout, which the application renders inside its router:
 *
 * - `provider` wraps the whole signed-in layout (header, menu and content), so what it provides reaches the header's
 *   actions, the pages and the aside alike, and keeps its state across pages. It may use the router.
 * - `aside` renders in the content row, right of the page: the layout puts `AppAsideOutlet` beside `<main>`, and the
 *   aside takes the width it needs (the content narrows) or renders nothing. On a phone an aside covers the screen
 *   itself. At most one is meant to show at a time.
 *
 * The application renders them through `AppLayoutProviders` and `AppAsideOutlet`; an application whose layout renders
 * neither simply shows no aside.
 */
export interface AppClientLayoutExtensionDefinition {
  /** Unique across the application and its plugins, like a header action's name. */
  readonly name: string;
  readonly provider?: ComponentType<PropsWithChildren>;
  readonly aside?: ComponentType;
}

export interface AppClientRegisteredLayoutExtension extends AppClientLayoutExtensionDefinition {
  readonly packageName: string;
  readonly source: AppClientContributionSource;
}

export type AppClientLayoutExtensions<TOptions = void> =
  | readonly AppClientLayoutExtensionDefinition[]
  | ((options: TOptions) => readonly AppClientLayoutExtensionDefinition[]);

function isComponent(value: unknown): boolean {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null && '$$typeof' in value)
  );
}

/** Checks and freezes layout extensions, for a plugin's `layoutExtensions`. */
export function defineLayoutExtensions(
  extensions: readonly AppClientLayoutExtensionDefinition[],
): readonly AppClientLayoutExtensionDefinition[] {
  return Object.freeze(
    extensions.map((extension) => {
      const name =
        typeof extension.name === 'string' ? extension.name.trim() : '';
      if (!name || !LAYOUT_EXTENSION_NAME_PATTERN.test(name))
        throw new Error(
          `Layout extension name "${String(extension.name)}" must be letters, digits, dots, dashes or underscores.`,
        );
      if (!extension.provider && !extension.aside)
        throw new Error(
          `Layout extension "${name}" must define a provider, an aside or both.`,
        );
      if (extension.provider && !isComponent(extension.provider))
        throw new Error(
          `Layout extension "${name}" provider must be a component.`,
        );
      if (extension.aside && !isComponent(extension.aside))
        throw new Error(
          `Layout extension "${name}" aside must be a component.`,
        );
      return Object.freeze({ ...extension, name });
    }),
  );
}

/** The layout extensions of the plugins, in registration order; a name may be registered once. */
export function resolveLayoutExtensions(
  contributions: readonly {
    readonly packageName: string;
    readonly source: AppClientContributionSource;
    readonly layoutExtensions?: readonly AppClientLayoutExtensionDefinition[];
  }[],
): readonly AppClientRegisteredLayoutExtension[] {
  const byName = new Map<string, AppClientRegisteredLayoutExtension>();
  for (const contribution of contributions)
    for (const extension of defineLayoutExtensions(
      contribution.layoutExtensions ?? [],
    )) {
      const previous = byName.get(extension.name);
      if (previous)
        throw new Error(
          `Layout extension "${extension.name}" from "${contribution.packageName}" is already registered by "${previous.packageName}".`,
        );
      byName.set(
        extension.name,
        Object.freeze({
          ...extension,
          packageName: contribution.packageName,
          source: contribution.source,
        }),
      );
    }
  return Object.freeze([...byName.values()]);
}

const NO_EXTENSIONS: readonly AppClientRegisteredLayoutExtension[] =
  Object.freeze([]);

/** The layout extensions the application's plugins registered; none outside an application. */
export function useLayoutExtensions(): readonly AppClientRegisteredLayoutExtension[] {
  return (
    useContext(ClientApplicationContext)?.runtime.layoutExtensions ??
    NO_EXTENSIONS
  );
}

/**
 * Wraps the signed-in layout in every layout extension's provider, the first registered outermost. Render it inside the
 * router, around the header, the menu and the content.
 */
export function AppLayoutProviders({
  children,
}: PropsWithChildren): ReactElement {
  const extensions = useLayoutExtensions();
  return extensions.reduceRight<ReactElement>(
    (inner, extension) =>
      extension.provider
        ? createElement(extension.provider, { key: extension.name }, inner)
        : inner,
    createElement(Fragment, null, children),
  );
}

/**
 * Renders every layout extension's aside, in registration order. Put it beside `<main>` in the content row (a
 * `flex` row), inside `AppLayoutProviders`.
 */
export function AppAsideOutlet(): ReactElement | null {
  const extensions = useLayoutExtensions().filter(
    (extension) => extension.aside,
  );
  if (!extensions.length) return null;
  return createElement(
    Fragment,
    null,
    ...extensions.map((extension) =>
      createElement(extension.aside as ComponentType, { key: extension.name }),
    ),
  );
}

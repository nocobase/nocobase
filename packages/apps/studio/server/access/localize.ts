import type { Translator } from '@nocobase/i18n';
import type {
  KeyScopeOptions,
  LocalizedText,
} from '@nocobase/app-plugin-api-keys/shared/scopes';

import type { AccessCatalog, CatalogText, Role } from '../../shared/access.js';

type LocalizedRole = Omit<Role, 'title'> & { title: string };

function translateText(
  t: Translator,
  text: CatalogText | LocalizedText,
  fallback?: string,
): string {
  if (typeof text === 'string') return text;
  return t(text.key, { ns: text.ns, defaultValue: fallback ?? text.key });
}

export function translateKeyScopeOptions(
  t: Translator,
  options: KeyScopeOptions,
): KeyScopeOptions {
  return {
    ...options,
    groups: options.groups.map((group) => ({
      ...group,
      title: translateText(t, group.title),
      description: group.description
        ? translateText(t, group.description)
        : null,
      objects: group.objects
        ? { ...group.objects, title: translateText(t, group.objects.title) }
        : null,
    })),
    presets: options.presets.map((preset) => ({
      ...preset,
      title: translateText(t, preset.title),
      description: preset.description
        ? translateText(t, preset.description)
        : null,
    })),
  };
}

export function translateRole(t: Translator, role: Role): LocalizedRole {
  return {
    ...role,
    title: role.title ? translateText(t, role.title, role.key) : role.key,
  };
}

export function translateCatalog(t: Translator, catalog: AccessCatalog) {
  const section = (
    value: NonNullable<AccessCatalog['businesses'][number]['section']>,
  ) => ({
    ...value,
    title: translateText(t, value.title),
  });
  return {
    businesses: catalog.businesses.map((business) => ({
      ...business,
      title: translateText(t, business.title),
      ...(business.description
        ? { description: translateText(t, business.description) }
        : {}),
      ...(business.section ? { section: section(business.section) } : {}),
      actions: business.actions.map((action) => ({
        ...action,
        ...(action.title ? { title: translateText(t, action.title) } : {}),
        ...(action.description
          ? { description: translateText(t, action.description) }
          : {}),
        levels: action.levels.map((level) => ({
          ...level,
          ...(level.title ? { title: translateText(t, level.title) } : {}),
          ...(level.label ? { label: translateText(t, level.label) } : {}),
          ...(level.description
            ? { description: translateText(t, level.description) }
            : {}),
        })),
      })),
    })),
    settings: catalog.settings.map((item) => ({
      ...item,
      title: translateText(t, item.title),
      ...(item.description
        ? { description: translateText(t, item.description) }
        : {}),
      ...(item.section ? { section: section(item.section) } : {}),
      actions: item.actions.map((action) => ({
        ...action,
        ...(action.title ? { title: translateText(t, action.title) } : {}),
      })),
    })),
  };
}

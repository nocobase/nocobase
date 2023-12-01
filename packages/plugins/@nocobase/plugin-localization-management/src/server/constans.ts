export const CACHE_KEY = 'localization:texts';

export const NAMESPACE_PREFIX = 'lm-';
export const NAMESPACE_MENUS = `${NAMESPACE_PREFIX}menus`;
export const NAMESPACE_COLLECTIONS = `${NAMESPACE_PREFIX}collections`;
export const EXTEND_MODULES = [
  {
    value: NAMESPACE_MENUS,
    label: 'Menu',
  },
  {
    value: NAMESPACE_COLLECTIONS,
    label: 'Collections & Fields',
  },
];

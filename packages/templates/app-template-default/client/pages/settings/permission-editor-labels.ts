import { useTranslation } from '@nocobase/i18n/client';
import { useMemo } from 'react';
import type { PermissionEditorLabels } from '#components/permission-editor';

/** Every visible string of the permission editor, in the application's language. */
export function usePermissionEditorLabels(): PermissionEditorLabels {
  const { t, i18n } = useTranslation();
  return useMemo(() => {
    const format = new Intl.ListFormat(i18n.language, { type: 'conjunction' });
    const list = (items: readonly string[]): string => format.format(items);
    const k = (key: string, values?: Record<string, unknown>): string =>
      t(`settings.permissionEditor.${key}`, values);
    return {
      menusTab: k('menusTab'),
      objectsTab: k('objectsTab'),
      settingsTab: k('settingsTab'),
      settingsIntro: k('settingsIntro'),
      tabCount: (count, total) => k('tabCount', { count, total }),
      menusIntro: k('menusIntro'),
      menuColumn: k('menuColumn'),
      usesColumn: k('usesColumn'),
      public: k('public'),
      noMenus: k('noMenus'),
      emptyPage: (menu, object) => k('emptyPage', { menu, object }),
      openView: (action) => k('openView', { action }),
      opensWith: (action) => k('opensWith', { action }),
      attention: (count) => k('attention', { count }),
      objects: k('objects'),
      search: k('search'),
      clearSearch: k('clearSearch'),
      noResults: k('noResults'),
      empty: k('empty'),
      objectEnabled: (enabled, total) => k('objectEnabled', { enabled, total }),
      objectOff: k('objectOff'),
      noScope: k('noScope'),
      usedBy: k('usedBy'),
      usedByNote: k('usedByNote'),
      enableAll: k('enableAll'),
      viewOnly: k('viewOnly'),
      disableAll: k('disableAll'),
      sameAsView: (scope) => k('sameAsView', { scope }),
      sameAsObjectView: (object, scope) =>
        k('sameAsObjectView', { object, scope }),
      scopeFor: (action, scope) =>
        scope
          ? k('scopeForSlot', { action, scope })
          : k('scopeFor', { action }),
      followHint: k('followHint'),
      managed: k('managed'),
      appliesEverywhere: k('appliesEverywhere'),
      unsaved: t('settings.unsaved'),
      readOnly: t('settings.permissionReadOnlyHint'),
      unrestrictedTitle: k('unrestrictedTitle'),
      unrestrictedDescription: k('unrestrictedDescription'),
      confirmDisable: (actions, dependents) =>
        k('confirmDisable', {
          actions: list(actions),
          dependents: list(dependents),
          count: dependents.length,
        }),
      confirm: k('confirm'),
      cancel: t('settings.cancel'),
      dismiss: k('dismiss'),
      notice: (notice) => {
        switch (notice.kind) {
          case 'scope-reset':
            return k('noticeScopeReset', {
              actions: list(notice.actions),
              view: notice.view,
              count: notice.actions.length,
            });
          case 'auto-enabled':
            return k('noticeAutoEnabled', { actions: list(notice.actions) });
          case 'missing-requirement':
            return [
              k('noticeStaysOff', { action: notice.action }),
              notice.actions.length
                ? k('noticeTurnOnFirst', {
                    actions: list(notice.actions),
                    count: notice.actions.length,
                  })
                : '',
              notice.managed.length
                ? k('noticeManagedRequirement', {
                    actions: list(notice.managed),
                    count: notice.managed.length,
                  })
                : '',
            ]
              .filter(Boolean)
              .join(' ');
          case 'managed-dependent':
            return k('noticeManagedDependent', {
              actions: list(notice.actions),
              count: notice.actions.length,
            });
        }
      },
    };
  }, [t, i18n.language]);
}

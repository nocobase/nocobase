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
      menus: k('menus'),
      search: k('search'),
      clearSearch: k('clearSearch'),
      noResults: k('noResults'),
      empty: k('empty'),
      administration: k('administration'),
      public: k('public'),
      publicNote: k('publicNote'),
      visibleInMenu: k('visibleInMenu'),
      hiddenFromMenu: k('hiddenFromMenu'),
      enabledCount: (enabled, total) => k('enabledCount', { enabled, total }),
      enableAll: k('enableAll'),
      viewOnly: k('viewOnly'),
      disableAll: k('disableAll'),
      next: (menu) => k('next', { menu }),
      sameAsView: (scope) => k('sameAsView', { scope }),
      scopeFor: (action, scope) =>
        scope
          ? k('scopeForSlot', { action, scope })
          : k('scopeFor', { action }),
      followHint: k('followHint'),
      riskHint: k('riskHint'),
      risk: (risk) => k(risk === 'high' ? 'riskHigh' : 'riskSensitive'),
      managed: k('managed'),
      visibleMenus: (visible, total) => k('visibleMenus', { visible, total }),
      unsaved: t('settings.unsaved'),
      readOnly: t('settings.permissionReadOnlyHint'),
      unrestrictedTitle: k('unrestrictedTitle'),
      unrestrictedDescription: k('unrestrictedDescription'),
      expand: (module) => k('expand', { module }),
      collapse: (module) => k('collapse', { module }),
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

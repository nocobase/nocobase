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
      tabCount: (count, total) => k('tabCount', { count, total }),
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
      objectColumn: k('objectColumn'),
      viewColumn: k('viewColumn'),
      operationsColumn: k('operationsColumn'),
      selectObject: (object) => k('selectObject', { object }),
      selectGroup: (group) => k('selectGroup', { group }),
      selectAll: k('selectAll'),
      quickAllHint: k('quickAllHint'),
      sameAsViewShort: k('sameAsViewShort'),
      groupEnabled: (enabled, total) => k('groupEnabled', { enabled, total }),
      objectsHint: k('objectsHint'),
      onlyEnabled: k('onlyEnabled'),
      sameAsView: (scope) => k('sameAsView', { scope }),
      sameAsObjectView: (object, scope) =>
        k('sameAsObjectView', { object, scope }),
      needsView: (object) => k('needsView', { object }),
      scopeFor: (action, scope) =>
        scope
          ? k('scopeForSlot', { action, scope })
          : k('scopeFor', { action }),
      managed: k('managed'),
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
      confirmDisableTitle: k('confirmDisableTitle'),
      confirmRisky: (action) => k('confirmRisky', { action }),
      confirmRiskyTitle: k('confirmRiskyTitle'),
      confirmRiskyAction: k('confirmRiskyAction'),
      cancel: t('settings.cancel'),
      dismiss: k('dismiss'),
      operationCount: (enabled, total) =>
        k('operationCount', { enabled, total }),
      opensEmpty: k('opensEmpty'),
      defaultsAdded: (actions) =>
        k('defaultsAdded', {
          actions: list(actions.map((text) => k('quoted', { text }))),
        }),
      adjustOperations: k('adjustOperations'),
      usedOn: (pages) => k('usedOn', { pages: list(pages) }),
      notOnPage: k('notOnPage'),
      missingPage: (pages) =>
        k('missingPage', {
          pages: list(pages.map((text) => k('quoted', { text }))),
        }),
      sensitive: k('sensitive'),
      highRisk: k('highRisk'),
      settingsPageColumn: k('settingsPageColumn'),
      settingsEntryColumn: k('settingsEntryColumn'),
      settingsActionsColumn: k('settingsActionsColumn'),
      searchSettings: k('searchSettings'),
      settingsGroupEnabled: (enabled, total) =>
        k('settingsGroupEnabled', { enabled, total }),
      settingsVisible: (pages) => k('settingsVisible', { pages: list(pages) }),
      settingsNoneVisible: k('settingsNoneVisible'),
      publicPage: k('publicPage'),
      searchPages: k('searchPages'),
      onlyChecked: k('onlyChecked'),
      noMatchingPages: k('noMatchingPages'),
      groupChecked: (checked, total) => k('groupChecked', { checked, total }),
      toggleGroup: (group) => k('toggleGroup', { group }),
      usedOnLabel: k('usedOnLabel'),
      pageOpens: k('pageOpens'),
      pageClosed: k('pageClosed'),
      tabChanges: (count) => k('tabChanges', { count }),
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

import { AvailableActionOptions } from '@nocobase/acl';

const availableActions: {
  [key: string]: AvailableActionOptions;
} = {
  create: {
    displayName: '{{t("Add new")}}',
    type: 'new-data',
    onNewRecord: true,
    aliases: ['create', 'firstOrCreate', 'updateOrCreate'],
    allowConfigureFields: true,
  },
  // import: {
  //   displayName: '{{t("Import")}}',
  //   type: 'new-data',
  //   scope: false,
  // },
  // export: {
  //   displayName: '{{t("Export")}}',
  //   type: 'old-data',
  //   allowConfigureFields: true,
  // },
  view: {
    displayName: '{{t("View")}}',
    type: 'old-data',
    aliases: ['get', 'list'],
    allowConfigureFields: true,
  },
  update: {
    displayName: '{{t("Edit")}}',
    type: 'old-data',
    aliases: ['update', 'move', 'add', 'set', 'remove', 'toggle'],
    allowConfigureFields: true,
  },
  destroy: {
    displayName: '{{t("Delete")}}',
    aliases: ['destroy'],
    type: 'old-data',
  },
};

export { availableActions };

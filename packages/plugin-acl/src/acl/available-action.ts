import { AvailableActionOptions } from '@nocobase/acl';

const availableActions: {
  [key: string]: AvailableActionOptions;
} = {
  create: {
    displayName: 't("create")',
    type: 'new-data',
  },
  import: {
    displayName: 't("import")',
    type: 'new-data',
  },
  view: {
    displayName: 't("view")',
    type: 'old-data',
    aliases: ['get', 'list'],
  },
  update: {
    displayName: 't("edit")',
    type: 'old-data',
  },
  destroy: {
    displayName: 't("destroy")',
    type: 'old-data',
  },
};

export { availableActions };

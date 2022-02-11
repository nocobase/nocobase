import { AvailableActionOptions } from '@nocobase/acl';

const availableActions: {
  [key: string]: AvailableActionOptions;
} = {
  create: {
    displayName: 't("Create")',
    type: 'new-data',
  },
  import: {
    displayName: 't("Import")',
    type: 'new-data',
  },
  export: {
    displayName: 't("Import")',
    type: 'new-data',
  },
  view: {
    displayName: 't("View")',
    type: 'old-data',
    aliases: ['get', 'list'],
  },
  update: {
    displayName: 't("Edit")',
    type: 'old-data',
  },
  destroy: {
    displayName: 't("Delete")',
    type: 'old-data',
  },
};

export { availableActions };

import { proxyToRepository } from './proxy-to-repository';

export const update = proxyToRepository(
  [
    'filterByTk',
    'values',
    'whitelist',
    'blacklist',
    'filter',
    'updateAssociationValues',
    'forceUpdate',
    'targetCollection',
  ],
  'update',
);

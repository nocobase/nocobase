import { proxyToRepository } from './proxy-to-repository';

export const get = proxyToRepository(
  ['filterByTk', 'fields', 'appends', 'except', 'filter', 'targetCollection'],
  'findOne',
);

import { proxyToRepository } from './proxy-to-repository';

export const updateOrCreate = proxyToRepository(['values', 'filterKeys'], 'updateOrCreate');

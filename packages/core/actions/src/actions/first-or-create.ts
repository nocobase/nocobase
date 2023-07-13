import { proxyToRepository } from './proxy-to-repository';

export const firstOrCreate = proxyToRepository(['values', 'filterKeys'], 'firstOrCreate');

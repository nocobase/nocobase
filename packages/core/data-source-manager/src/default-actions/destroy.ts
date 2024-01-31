import { proxyToRepository } from './proxy-to-repository';

export const destroy = proxyToRepository(['filterByTk', 'filter'], 'destroy');

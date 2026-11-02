import type { AppPluginProviderConstructor } from '@nocobase/app-server/plugins';
import { ConcurrencyServiceProvider } from './concurrency.js';

const serviceProviders: readonly AppPluginProviderConstructor[] = [
  ConcurrencyServiceProvider,
];
export default serviceProviders;

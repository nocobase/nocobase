import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';

import EquipmentProvider from './equipment/index.js';

const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  EquipmentProvider,
];

export default serviceProviders;

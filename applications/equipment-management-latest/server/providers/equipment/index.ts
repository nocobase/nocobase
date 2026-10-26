import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import {
  createServiceToken,
  ServiceProvider,
} from '@nocobase/service-provider';
import {
  createRepositoryLifecycleStore,
  LifecycleRuntime,
} from '@nocobase/lifecycle';
import { assets, requests, maintenance, stocktakes } from './definitions.js';
import { registerEquipmentAuthorization } from './resources.js';
import { registerEquipmentSample } from './sample.js';
import { EquipmentService } from './service.js';
export const equipmentToken =
  createServiceToken<EquipmentService>('equipment/service');
export default class EquipmentProvider extends ServiceProvider<Application> {
  readonly name = 'equipment-management/equipment';
  override register(): void {
    this.app.container.singleton(equipmentToken, () => {
      const db = this.app.container.resolve(databaseManagerToken);
      // These definitions have no effects, triggers or external calls. No workers or sweeps are needed.
      // A future effect must first install the official lifecycle jobs dispatcher.
      const runtime = new LifecycleRuntime({
        store: createRepositoryLifecycleStore(db, {
          collections: {
            transitions: 'equipmentTransitions',
            effectRuns: 'equipmentEffectRuns',
          },
        }),
      });
      runtime.register(assets);
      runtime.register(requests);
      runtime.register(maintenance);
      runtime.register(stocktakes);
      return new EquipmentService(db, runtime);
    });
  }
  override async boot(): Promise<void> {
    if (this.app.config.get<boolean>('app.sampleData') === true) {
      const password = this.app.config.get<unknown>('equipment.samplePassword');
      if (typeof password !== 'string' || password.length < 16)
        throw new Error(
          'Synthetic equipment initialization requires a private EQUIPMENT_SAMPLE_PASSWORD of at least 16 characters. Set it through the native App variable before first deployment.',
        );
    }
    registerEquipmentSample(
      this.app,
      this.app.container.resolve(equipmentToken),
    );
    registerEquipmentAuthorization(
      this.app.container.resolve(authorizationToken),
    );
  }
}

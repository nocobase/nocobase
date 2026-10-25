import type { Application } from '@nocobase/app-server/application';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { sampleDataToken } from '@nocobase/app-server/sample-data';
import { userManagementServiceToken } from '@nocobase/app-plugin-users/server/tokens';
import { SYSTEM_ACTOR } from '@nocobase/lifecycle';
import { text } from './service.js';
import type { EquipmentService } from './service.js';
/** Optional synthetic installation data. No repeat reset, outbound message or default business assignment. */
export function registerEquipmentSample(
  app: Application,
  service: EquipmentService,
): void {
  app.container.resolve(sampleDataToken).register({
    name: 'equipment-management/synthetic-v1',
    packageName: 'equipment-management',
    async run() {
      const password = app.config.get<string>('equipment.samplePassword');
      if (!password || password.length < 16)
        throw new Error(
          'Set EQUIPMENT_SAMPLE_PASSWORD privately before requesting synthetic sample data.',
        );
      const users = app.container.resolve(userManagementServiceToken);
      const ensureUser = async (input: Parameters<typeof users.create>[0]) => {
        const existing = await service.db
          .repository('user')
          .findOne({ filter: { username: input.username! } });
        return existing ? users.get(text(existing.id)) : users.create(input);
      };
      const manager = await ensureUser({
        name: 'Morgan Reed',
        username: 'equipment.manager',
        email: 'morgan@example.test',
        password,
        roleScopes: { app: ['equipment-manager'] },
      });
      const member = await ensureUser({
        name: 'Alex Chen',
        username: 'equipment.member',
        email: 'alex@example.test',
        password,
        roleScopes: { app: ['member', 'equipment-staff'] },
      });
      const other = await ensureUser({
        name: 'Sam Rivera',
        username: 'equipment.viewer',
        email: 'sam@example.test',
        password,
        roleScopes: { app: ['equipment-staff'] },
      });
      const db = service.db;
      const categories = [
        'Laptops',
        'Monitors',
        'Network equipment',
        'Lab instruments',
        'Office equipment',
        'Tools',
      ];
      const departments = [
        'Engineering',
        'Operations',
        'Research',
        'Administration',
      ];
      const locations = [
        'Central warehouse',
        'Engineering floor',
        'Operations office',
        'Research lab',
        'Meeting rooms',
        'Field store',
        'Repair workshop',
        'West branch',
      ];
      // Stable business codes make sample content identifiable without treating user data as a resettable fixture.
      for (const [name, values, prefix] of [
        ['equipmentCategories', categories, 'cat'],
        ['equipmentDepartments', departments, 'dep'],
        ['equipmentLocations', locations, 'loc'],
      ] as const) {
        for (let i = 0; i < values.length; i++)
          if (
            !(await db
              .repository(name)
              .findOne({ filter: { id: prefix + '-' + i } }))
          )
            await db.repository(name).createOne({
              values: {
                id: prefix + '-' + i,
                code: prefix.toUpperCase() + '-' + (i + 1),
                name: values[i],
              },
            });
      }
      const date = (days: number) =>
        new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
      const models = [
        'ThinkPad T14',
        'UltraSharp 27',
        'Edge Router 500',
        'Precision Scale',
        'Laser Printer',
        'Cordless Kit',
      ];
      for (let i = 0; i < 100; i++) {
        const category = i % 6;
        const id = 'asset-' + String(i + 1).padStart(3, '0');
        const person = i % 2 ? member : other;
        if (await db.repository('equipmentAssets').findOne({ filter: { id } }))
          continue;
        await service.runtime.transaction(async (tx) => {
          await tx.create(
            'equipmentAssets',
            {
              id,
              assetNumber: 'EQ-' + String(i + 1).padStart(4, '0'),
              name: models[category] + ' · ' + String(i + 1).padStart(3, '0'),
              serialNumber: 'SYN-2026-' + String(10000 + i),
              model: models[category],
              manufacturer:
                category % 2 ? 'Northstar Instruments' : 'Summit Systems',
              categoryId: 'cat-' + category,
              departmentId: 'dep-' + (i % 4),
              locationId: 'loc-' + (i % 8),
              purchaseDate: date(-400 + i * 2),
              purchaseCost: 150 + category * 230 + i * 17,
              vendor: 'Synthetic Supply Co.',
              warrantyUntil: date(
                i % 5 === 0 ? 12 : i % 5 === 1 ? -40 : 180 + i,
              ),
              nextMaintenanceAt: date(i % 7 === 0 ? -7 : 30 + i),
              notes:
                'Synthetic equipment for the isolated PM-697 preview. Purchase and movement records are fictional.',
              createdAt: new Date().toISOString(),
            },
            { actor: SYSTEM_ACTOR },
          );
          if (i % 10 <= 3)
            await tx.fire('equipmentAssets', id, 'issue', {
              actor: SYSTEM_ACTOR,
              input: { custodianId: person.id },
            });
          if (i % 10 === 4 || i % 10 === 5)
            await tx.fire('equipmentAssets', id, 'borrow', {
              actor: SYSTEM_ACTOR,
              input: {
                custodianId: person.id,
                dueDate: date(i % 10 === 4 ? -5 : 14),
              },
            });
          if (i % 10 === 6) {
            await tx.create(
              'equipmentMaintenance',
              {
                id: 'maintenance-' + i,
                deviceId: id,
                kind: i % 2 ? 'repair' : 'maintenance',
                description: 'Scheduled inspection and functional calibration',
                createdById: manager.id,
                cost: 0,
                createdAt: new Date().toISOString(),
              },
              { actor: SYSTEM_ACTOR },
            );
            await tx.fire('equipmentAssets', id, 'maintainIdle', {
              actor: SYSTEM_ACTOR,
            });
          }
          if (i % 10 === 7)
            await tx.fire('equipmentAssets', id, 'scrap', {
              actor: SYSTEM_ACTOR,
              input: {
                reason: 'End of service life; synthetic disposal record.',
              },
            });
          if (i % 10 === 8)
            await tx.create(
              'equipmentRequests',
              {
                id: 'request-' + i,
                deviceId: id,
                kind: 'issue',
                requesterId: member.id,
                reason: 'New starter workstation request',
                createdAt: new Date().toISOString(),
              },
              { actor: SYSTEM_ACTOR },
            );
        });
      }
      const authz = app.container
        .resolve(authorizationToken)
        .for({ principal: { type: 'user', id: manager.id } });
      const decision = await authz.authorize({
        resource: { type: 'composite', id: 'equipment.stocktakes' },
        action: 'manage',
      });
      const policies = decision.conditions?.database;
      if (!policies)
        throw new Error(
          'Synthetic stocktake needs the equipment-manager role.',
        );
      if (
        !(await db
          .repository('equipmentStocktakes')
          .findOne({ filter: { name: 'Central warehouse cycle count' } }))
      ) {
        const batch = await service.createStocktake(
          { name: 'Central warehouse cycle count', locationId: 'loc-0' },
          manager.id,
          policies,
        );
        const items = await db
          .repository('equipmentStocktakeItems')
          .findMany({ filter: { stocktakeId: text(batch.id) } });
        let version = Number(batch.lifecycleVersion);
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          await service.observe(
            text(batch.id),
            text(item.id),
            {
              actualLocationId: item.expectedLocationId,
              condition: i === 0 ? 'damaged' : 'good',
              resolved: i !== 0,
              note:
                i === 0
                  ? 'Cracked housing. Investigate and arrange repair.'
                  : 'Assignment and location checked.',
              expectVersion: version++,
            },
            manager.id,
            policies,
          );
        }
      }
    },
  });
}

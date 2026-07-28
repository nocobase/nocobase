/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Collection, Database, Model, Transaction } from '@nocobase/database';
import { Migration } from '@nocobase/server';

const LEGACY_DEFAULT_PORTAL_UID = '__default_portal__';

type CanonicalPortal = {
  uid: string;
  title: string;
  icon: string;
  portalName: string;
  routePath: string;
};

const CANONICAL_ADMIN_PORTAL: CanonicalPortal = {
  uid: 'admin-layout-model',
  title: 'Desktop layout',
  icon: 'DesktopOutlined',
  portalName: 'admin',
  routePath: '/admin',
};

const CANONICAL_MOBILE_PORTAL: CanonicalPortal = {
  uid: 'mobile-layout-model',
  title: 'Mobile layout',
  icon: 'MobileOutlined',
  portalName: 'mobile',
  routePath: '/mobile',
};

const CANONICAL_PORTALS = [CANONICAL_ADMIN_PORTAL, CANONICAL_MOBILE_PORTAL] as const;

const LEGACY_PORTAL_RELATION_COLLECTIONS = [
  'rolesMultiPortals',
  'rolesMultiPortalDesktopRoutes',
  'rolesMultiPortalRoutePolicies',
  'desktopRoutesMultiPortals',
] as const;

function readString(record: Model, field: string) {
  const value = record.get(field);
  return typeof value === 'string' ? value : '';
}

function isCanonicalIdentity(record: Model, portal: CanonicalPortal) {
  return (
    readString(record, 'uid') === portal.uid &&
    readString(record, 'portalName') === portal.portalName &&
    readString(record, 'uiLayoutUid') === portal.uid
  );
}

function isLegacyNoCodeSeed(record: Model | undefined) {
  return (
    !!record && readString(record, 'uid') === LEGACY_DEFAULT_PORTAL_UID && readString(record, 'portalType') !== 'ai'
  );
}

function listCanonicalOccupants(records: Model[], portal: CanonicalPortal) {
  return records.filter(
    (record) =>
      readString(record, 'uid') === portal.uid ||
      readString(record, 'portalName') === portal.portalName ||
      readString(record, 'uiLayoutUid') === portal.uid,
  );
}

function assertCanonicalTargetsAvailable(records: Model[], legacySeed: Model | undefined) {
  for (const portal of CANONICAL_PORTALS) {
    const occupants = listCanonicalOccupants(records, portal);
    const invalidOccupants = occupants.filter((record) => {
      if (isCanonicalIdentity(record, portal)) {
        return false;
      }
      return portal === CANONICAL_ADMIN_PORTAL && record === legacySeed && isLegacyNoCodeSeed(legacySeed)
        ? false
        : true;
    });
    const canonicalRecord = occupants.find((record) => isCanonicalIdentity(record, portal));
    if (invalidOccupants.length || (portal === CANONICAL_ADMIN_PORTAL && legacySeed && canonicalRecord !== undefined)) {
      const occupiedBy = occupants
        .map(
          (record) =>
            `uid=${readString(record, 'uid')}, portalName=${readString(record, 'portalName')}, uiLayoutUid=${
              readString(record, 'uiLayoutUid') || '<empty>'
            }`,
        )
        .join('; ');
      throw new Error(
        `Cannot migrate canonical portal '${portal.portalName}': target identity is occupied by ${occupiedBy}.`,
      );
    }
  }
}

async function countPortalRelations(db: Database, portalUid: string, transaction: Transaction) {
  const counts: Record<(typeof LEGACY_PORTAL_RELATION_COLLECTIONS)[number], number> = {
    rolesMultiPortals: 0,
    rolesMultiPortalDesktopRoutes: 0,
    rolesMultiPortalRoutePolicies: 0,
    desktopRoutesMultiPortals: 0,
  };
  for (const collectionName of LEGACY_PORTAL_RELATION_COLLECTIONS) {
    const collection = db.getCollection(collectionName);
    if (!collection) {
      continue;
    }
    counts[collectionName] = await collection.model.count({
      where: {
        multiPortalUid: portalUid,
      },
      transaction,
    });
  }
  return counts;
}

async function assertLegacySeedCanBeRekeyed(db: Database, transaction: Transaction) {
  const counts = await countPortalRelations(db, LEGACY_DEFAULT_PORTAL_UID, transaction);
  const occupiedRelations = LEGACY_PORTAL_RELATION_COLLECTIONS.filter((collectionName) => counts[collectionName] > 0);
  if (!occupiedRelations.length) {
    return;
  }
  throw new Error(
    `Cannot re-key legacy Portal '${LEGACY_DEFAULT_PORTAL_UID}' because Portal ACL or route relations exist: ${LEGACY_PORTAL_RELATION_COLLECTIONS.map(
      (collectionName) => `${collectionName}=${counts[collectionName]}`,
    ).join(', ')}. No permissions were copied or removed.`,
  );
}

async function assertCanonicalPortalHasNoRelations(db: Database, portalUid: string, transaction: Transaction) {
  const counts = await countPortalRelations(db, portalUid, transaction);
  const occupiedRelations = LEGACY_PORTAL_RELATION_COLLECTIONS.filter((collectionName) => counts[collectionName] > 0);
  if (!occupiedRelations.length) {
    return;
  }
  throw new Error(
    `Cannot migrate canonical Portal '${portalUid}' to layout mode because Portal ACL or route relations exist: ${LEGACY_PORTAL_RELATION_COLLECTIONS.map(
      (collectionName) => `${collectionName}=${counts[collectionName]}`,
    ).join(', ')}. No permissions were copied or removed.`,
  );
}

async function updatePortal(
  collection: Collection,
  uid: string,
  values: Record<string, unknown>,
  transaction: Transaction,
) {
  await collection.model.update(values, {
    where: { uid },
    transaction,
    hooks: false,
  });
}

function getCanonicalProtectedValues(portal: CanonicalPortal) {
  return {
    uid: portal.uid,
    portalType: 'no-code',
    portalName: portal.portalName,
    routePath: portal.routePath,
    authCheck: true,
    uiLayoutUid: portal.uid,
    routePermissionMode: 'layout',
  };
}

function hasCanonicalProtectedValues(record: Model, portal: CanonicalPortal) {
  return Object.entries(getCanonicalProtectedValues(portal)).every(([field, value]) => record.get(field) === value);
}

async function createCanonicalPortal(collection: Collection, portal: CanonicalPortal, transaction: Transaction) {
  await collection.model.create(
    {
      ...getCanonicalProtectedValues(portal),
      title: portal.title,
      icon: portal.icon,
      enabled: true,
      options: {},
    },
    {
      transaction,
      hooks: false,
    },
  );
}

async function replaceLegacySeedWithCanonicalPortal(
  collection: Collection,
  legacySeed: Model,
  portal: CanonicalPortal,
  transaction: Transaction,
) {
  const temporaryPortalName = `${LEGACY_DEFAULT_PORTAL_UID}-migrating-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
  await updatePortal(collection, LEGACY_DEFAULT_PORTAL_UID, { portalName: temporaryPortalName }, transaction);
  await collection.model.create(
    {
      ...getCanonicalProtectedValues(portal),
      title: legacySeed.get('title'),
      icon: legacySeed.get('icon'),
      enabled: legacySeed.get('enabled'),
      options: legacySeed.get('options'),
    },
    {
      transaction,
      hooks: false,
    },
  );
  await collection.model.destroy({
    where: {
      uid: LEGACY_DEFAULT_PORTAL_UID,
    },
    transaction,
    hooks: false,
  });
}

async function ensureAiPortalRoleAccess(db: Database, portalUid: string, transaction: Transaction) {
  const rolesCollection = db.getCollection('roles');
  const relationsCollection = db.getCollection('rolesMultiPortals');
  if (!rolesCollection || !relationsCollection) {
    return;
  }

  const roles = await rolesCollection.model.findAll({
    attributes: ['name'],
    transaction,
  });
  const existingRelations = await relationsCollection.model.findAll({
    attributes: ['roleName'],
    where: {
      multiPortalUid: portalUid,
    },
    transaction,
  });
  const existingRoleNames = new Set(existingRelations.map((relation) => readString(relation, 'roleName')));

  for (const role of roles) {
    const roleName = readString(role, 'name');
    if (!roleName || roleName === 'root' || existingRoleNames.has(roleName)) {
      continue;
    }
    await db.getRepository('rolesMultiPortals').create({
      values: {
        roleName,
        multiPortalUid: portalUid,
      },
      transaction,
    });
  }
}

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<2.2.0-alpha.12';

  async up() {
    const collection = this.db.getCollection('multiPortals');
    if (!collection) {
      return;
    }

    await this.db.sequelize.transaction(async (transaction) => {
      const records = await collection.model.findAll({ transaction });
      const legacySeed = records.find((record) => readString(record, 'uid') === LEGACY_DEFAULT_PORTAL_UID);

      if (legacySeed && readString(legacySeed, 'portalType') === 'ai') {
        for (const record of records) {
          if (readString(record, 'routePermissionMode') !== 'portal') {
            await updatePortal(collection, readString(record, 'uid'), { routePermissionMode: 'portal' }, transaction);
          }
        }
        await ensureAiPortalRoleAccess(this.db, readString(legacySeed, 'uid'), transaction);
        return;
      }

      if (!legacySeed) {
        this.app.logger.warn(
          `Legacy initial Portal '${LEGACY_DEFAULT_PORTAL_UID}' was not found; treating this historical application as No-code.`,
          {
            module: 'multi-portal',
            migration: 'route-permission-mode',
          },
        );
      }

      assertCanonicalTargetsAvailable(records, legacySeed);
      if (legacySeed) {
        await assertLegacySeedCanBeRekeyed(this.db, transaction);
      }
      for (const portal of CANONICAL_PORTALS) {
        if (records.some((record) => isCanonicalIdentity(record, portal))) {
          await assertCanonicalPortalHasNoRelations(this.db, portal.uid, transaction);
        }
      }

      for (const record of records) {
        if (record === legacySeed || CANONICAL_PORTALS.some((portal) => isCanonicalIdentity(record, portal))) {
          continue;
        }
        if (readString(record, 'routePermissionMode') !== 'portal') {
          await updatePortal(collection, readString(record, 'uid'), { routePermissionMode: 'portal' }, transaction);
        }
      }

      for (const portal of CANONICAL_PORTALS) {
        const canonicalRecord = records.find((record) => isCanonicalIdentity(record, portal));
        if (canonicalRecord) {
          if (!hasCanonicalProtectedValues(canonicalRecord, portal)) {
            await updatePortal(collection, portal.uid, getCanonicalProtectedValues(portal), transaction);
          }
          continue;
        }
        if (portal === CANONICAL_ADMIN_PORTAL && legacySeed) {
          await replaceLegacySeedWithCanonicalPortal(collection, legacySeed, portal, transaction);
          continue;
        }
        await createCanonicalPortal(collection, portal, transaction);
      }
    });
  }
}

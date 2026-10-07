/**
 * Workspace settings: the issue prefix now, the defaults of later features as they arrive. Reading and changing them
 * are the settings item `pm.general`'s `read` and `update`.
 */
import type { DatabaseConnection } from '@nocobase/db';

import {
  ISSUE_PREFIX_PATTERN,
  type UpdateSettingsRequest,
  type WorkspaceSettings,
} from '../../../shared/settings.js';
import type { Viewer } from '../../access/viewer.js';
import { requireSetting } from '../../access/viewer.js';
import { invalid } from '../../kernel/errors.js';
import type { Tx, TxRunner } from '../../kernel/tx.js';
import {
  DEFAULT_PREFIX,
  nextIssueNumber,
  readSettings,
  writeSettings,
} from './settings.store.js';

export interface AllocatedNumber {
  readonly number: number;
  readonly identifier: string;
}

export interface SettingsService {
  read(conn: DatabaseConnection): Promise<WorkspaceSettings>;
  get(viewer: Viewer): Promise<WorkspaceSettings>;
  update(
    viewer: Viewer,
    patch: UpdateSettingsRequest,
  ): Promise<WorkspaceSettings>;
  /** Allocates the next issue number inside `tx` (see `nextIssueNumber`). */
  allocateIssueNumber(tx: Tx): Promise<AllocatedNumber>;
}

function validPrefix(value: unknown): string {
  if (typeof value !== 'string' || !ISSUE_PREFIX_PATTERN.test(value))
    throw invalid(
      'INVALID_PREFIX',
      'issuePrefix must be 1 to 10 upper-case letters and digits, starting with a letter.',
    );
  return value;
}

export function createSettingsService(deps: {
  readonly tx: TxRunner;
}): SettingsService {
  async function read(conn: DatabaseConnection): Promise<WorkspaceSettings> {
    const row = await readSettings(conn);
    return { issuePrefix: row?.issuePrefix ?? DEFAULT_PREFIX };
  }

  return {
    read,

    async get(viewer) {
      requireSetting(
        viewer,
        'pm.general',
        'read',
        'You may not read the settings.',
      );
      return read(deps.tx.read());
    },

    async update(viewer, patch) {
      requireSetting(
        viewer,
        'pm.general',
        'update',
        'You may not change the settings.',
      );
      const issuePrefix =
        patch.issuePrefix === undefined
          ? undefined
          : validPrefix(patch.issuePrefix);
      return deps.tx.run(async (tx) => {
        if (issuePrefix !== undefined)
          await writeSettings(tx.conn, { issuePrefix });
        return read(tx.conn);
      });
    },

    async allocateIssueNumber(tx) {
      const { number, prefix } = await nextIssueNumber(tx.conn);
      return { number, identifier: `${prefix}-${number}` };
    },
  };
}

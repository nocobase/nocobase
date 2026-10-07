/**
 * Labels: one workspace-wide list with a color each. Every member reads it; creating, changing and deleting labels
 * is the settings item `pm.labels`'s `update`.
 */
import type { DatabaseConnection } from '@nocobase/db';

import { COLORS, type Color } from '../../../shared/common.js';
import {
  LABEL_NAME_MAX,
  type CreateLabelRequest,
  type Label,
  type UpdateLabelRequest,
} from '../../../shared/labels.js';
import { requireSetting, type Viewer } from '../../access/viewer.js';
import { isUniqueViolation } from '../../kernel/db.js';
import { conflict, invalid, notFound } from '../../kernel/errors.js';
import type { IdSource } from '../../kernel/ids.js';
import type { TxRunner } from '../../kernel/tx.js';
import { requiredText, validChoice } from '../../kernel/validate.js';
import './label.events.js';
import {
  deleteLabel,
  existingLabelIds,
  findLabel,
  insertLabel,
  listLabels,
  updateLabel,
} from './label.store.js';

export interface LabelService {
  list(): Promise<Label[]>;
  create(viewer: Viewer, input: CreateLabelRequest): Promise<Label>;
  update(viewer: Viewer, id: string, patch: UpdateLabelRequest): Promise<Label>;
  remove(viewer: Viewer, id: string): Promise<void>;
  /** `ids` deduplicated; 400 `INVALID_LABEL` when one names no label. */
  requireExisting(
    conn: DatabaseConnection,
    ids: readonly string[],
  ): Promise<string[]>;
}

const name = (value: unknown) =>
  requiredText(value, 'name', LABEL_NAME_MAX, 'INVALID_NAME');
const color = (value: unknown): Color =>
  validChoice(value, COLORS, 'color', 'INVALID_COLOR');

function requireManager(viewer: Viewer): void {
  requireSetting(viewer, 'pm.labels', 'update', 'You may not manage labels.');
}

/** Runs a write whose unique name may already be taken. */
async function uniquely<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (isUniqueViolation(error))
      throw conflict('LABEL_EXISTS', 'A label with this name already exists.');
    throw error;
  }
}

export function createLabelService(deps: {
  readonly tx: TxRunner;
  readonly ids: IdSource;
}): LabelService {
  return {
    list: () => listLabels(deps.tx.read()),

    async create(viewer, input) {
      requireManager(viewer);
      const label: Label = {
        id: deps.ids.next(),
        name: name(input.name),
        color: input.color === undefined ? 'gray' : color(input.color),
      };
      await uniquely(() => deps.tx.run((tx) => insertLabel(tx.conn, label)));
      return label;
    },

    async update(viewer, id, patch) {
      requireManager(viewer);
      const values = {
        ...(patch.name === undefined ? {} : { name: name(patch.name) }),
        ...(patch.color === undefined ? {} : { color: color(patch.color) }),
      };
      return uniquely(() =>
        deps.tx.run(async (tx) => {
          if (!(await findLabel(tx.conn, id))) throw notFound('Label');
          await updateLabel(tx.conn, id, values);
          tx.emit({ type: 'label.changed', labelId: id });
          return (await findLabel(tx.conn, id)) as Label;
        }),
      );
    },

    async remove(viewer, id) {
      requireManager(viewer);
      await deps.tx.run(async (tx) => {
        if (!(await findLabel(tx.conn, id))) throw notFound('Label');
        await deleteLabel(tx.conn, id);
        tx.emit({ type: 'label.changed', labelId: id });
      });
    },

    async requireExisting(conn, ids) {
      const existing = await existingLabelIds(conn, ids);
      const missing = ids.filter((id) => !existing.has(id));
      if (missing.length > 0)
        throw invalid('INVALID_LABEL', `Unknown label: ${missing.join(', ')}.`);
      return [...existing];
    },
  };
}

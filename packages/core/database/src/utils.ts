import crypto from 'crypto';
import { Model } from './model';
import { IdentifierError } from './errors/identifier-error';

type HandleAppendsQueryOptions = {
  templateModel: any;
  queryPromises: Array<any>;
};

export async function handleAppendsQuery(options: HandleAppendsQueryOptions) {
  const { templateModel, queryPromises } = options;

  const primaryKey = templateModel.constructor.primaryKeyAttribute;

  const results = await Promise.all(queryPromises);

  let rows: Array<Model>;

  for (const appendedResult of results) {
    if (!rows) {
      rows = appendedResult.rows;

      if (rows.length == 0) {
        return [];
      }

      const modelOptions = templateModel['_options'];
      for (const row of rows) {
        row['_options'] = {
          ...row['_options'],
          include: modelOptions['include'],
          includeNames: modelOptions['includeNames'],
          includeMap: modelOptions['includeMap'],
        };
      }
      continue;
    }

    for (let i = 0; i < appendedResult.rows.length; i++) {
      const appendingRow = appendedResult.rows[i];
      const key = appendedResult.include.association;
      const val = appendingRow.get(key);

      const rowKey = appendingRow.get(primaryKey);

      const targetIndex = rows.findIndex((row) => row.get(primaryKey) === rowKey);

      if (targetIndex === -1) {
        throw new Error('target row not found');
      }

      rows[targetIndex].set(key, val, {
        raw: true,
      });
    }
  }

  return rows;
}

export function md5(value: string) {
  return crypto.createHash('md5').update(value).digest('hex');
}

const MAX_IDENTIFIER_LENGTH = 63;

export function checkIdentifier(value: string) {
  if (value.length > MAX_IDENTIFIER_LENGTH) {
    throw new IdentifierError(`Identifier ${value} is too long`);
  }
}

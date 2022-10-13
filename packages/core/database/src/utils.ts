import crypto from 'crypto';
import { Model } from './model';

type HandleAppendsQueryOptions = {
  templateModel?: any;
  queryPromises: Array<any>;
};

export async function handleAppendsQuery(options: HandleAppendsQueryOptions) {
  const { queryPromises } = options;

  const appendedResults = await Promise.all(queryPromises);

  const rows: Array<Model> = appendedResults[0].rows;

  // only one appends query
  if (appendedResults.length == 1) {
    return rows;
  }

  for (let i = 1; i < appendedResults.length; i++) {
    const appendedResult = appendedResults[i];

    for (let j = 0; j < appendedResult.rows.length; j++) {
      if (j == 0) {
        // merge sequelize model include options
        rows[j]['_options'].include = [...rows[j]['_options'].include, ...appendedResult.rows[j]['_options'].include];

        rows[j]['_options'].includeNames = [
          ...rows[j]['_options'].includeNames,
          ...appendedResult.rows[j]['_options'].includeNames,
        ];

        rows[j]['_options'].includeMap = {
          ...rows[j]['_options'].includeMap,
          ...appendedResult.rows[j]['_options'].includeMap,
        };
      }

      const key = appendedResult.include.association;
      const val = appendedResult.rows[j].get(key);

      rows[j].set(key, val, {
        raw: true,
      });
    }
  }

  return rows;
}

export function md5(value: string) {
  return crypto.createHash('md5').update(value).digest('hex');
}

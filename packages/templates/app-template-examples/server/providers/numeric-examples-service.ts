import type { DatabaseManager, DatabaseDialect } from '@nocobase/db';

export const numericFields = [
  'id',
  'integerValue',
  'bigintValue',
  'decimalValue',
  'floatValue',
  'doubleValue',
] as const;
export type NumericExampleSource = 'query' | 'repository';
export type NumericExampleSample = 'all' | 'null' | 'empty';
export type NumericExampleSortField = (typeof numericFields)[number];
export type NumericExampleSortDirection = 'asc' | 'desc';
/** One sort key, in the order `orderBy` lists them. */
export interface NumericExampleOrder {
  readonly field: NumericExampleSortField;
  readonly direction: NumericExampleSortDirection;
}

export interface NumericExamplesResult {
  dialect: DatabaseDialect;
  source: NumericExampleSource;
  sample: NumericExampleSample;
  rows: Record<string, unknown>[];
  aggregates: {
    field: (typeof numericFields)[number];
    [key: string]: unknown;
  }[];
}

export class NumericExamplesService {
  constructor(private readonly database: DatabaseManager) {}

  async read(
    source: NumericExampleSource,
    sample: NumericExampleSample,
    orderBy: readonly NumericExampleOrder[] = [
      { field: 'id', direction: 'asc' },
    ],
  ): Promise<NumericExamplesResult> {
    const query = this.database.query();
    const repository = this.database.repository('numericExamples');
    // The reserved value is never seeded, so this demonstrates empty aggregates.
    const selected = sample === 'empty' ? '__empty__' : sample;
    const filter = sample === 'all' ? undefined : { sample: selected };
    let selection = query
      .selectFrom('numericExamples')
      .select(['sample', ...numericFields])
      .limit(100);
    for (const { field, direction } of orderBy)
      selection = selection.orderBy(field, direction);
    if (filter) selection = selection.where('sample', '=', selected);
    const rows =
      source === 'query'
        ? await selection.execute()
        : await repository.findMany({
            select: (s) => s.fields('sample', ...numericFields),
            filter,
            sort: (s) =>
              orderBy.map(({ field, direction }) =>
                s.field(field)[direction](),
              ),
            limit: 100,
          });
    const aggregates = [];
    for (const field of numericFields) {
      let aggregateQuery = query
        .selectFrom('numericExamples')
        .select((eb) => [
          eb.fn.count(field).as('count'),
          eb.fn.sum(field).as('sum'),
          eb.fn.avg(field).as('avg'),
          eb.fn.min(field).as('min'),
          eb.fn.max(field).as('max'),
        ]);
      if (filter)
        aggregateQuery = aggregateQuery.where('sample', '=', selected);
      const values =
        source === 'query'
          ? await aggregateQuery.executeTakeFirstOrThrow()
          : await repository.aggregate({
              filter,
              aggregate: (a) => ({
                count: a.count(field),
                sum: a.sum(field),
                avg: a.avg(field),
                min: a.min(field),
                max: a.max(field),
              }),
            });
      aggregates.push({ field, ...values });
    }
    return {
      dialect: this.database.connection().dialect,
      source,
      sample,
      rows,
      aggregates,
    };
  }
}

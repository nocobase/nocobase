import { Migration } from '@nocobase/server';

const calculatorsMap = {
  equal: '==',
  '===': '==',
  notEqual: '!=',
  '!==': '!=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  includes(a, b) {
    return `SEARCH('${b}', '${a}') >= 0`;
  },
  notIncludes(a, b) {
    return `SEARCH('${b}', '${a}') < 0`;
  },
  startsWith(a, b) {
    return `SEARCH('${b}', '${a}') == 0`;
  },
  endsWith(a, b) {
    return `RIGHT('${a}', LEN('${b}')) == '${b}'`;
  },
  notStartsWith(a, b) {
    return `SEARCH('${b}', '${a}') != 0`;
  },
  notEndsWith(a, b) {
    return `RIGHT('${a}', LEN('${b}')) != '${b}'`;
  },
};

function migrateConfig({ group: { type = 'and', calculations = [] } }) {
  return {
    group: {
      type,
      calculations: calculations.map(({ calculator = '===', operands = [] }: any) => {
        return `(${operands
          .map((operand) => (operand?.group ? migrateConfig(operand) : operand))
          .join(` ${calculatorsMap[calculator]} `)})`;
      }),
    },
  };
}

export default class extends Migration {
  appVersion = '<0.9.0-alpha.3';
  async up() {
    const match = await this.app.version.satisfies('<0.9.0-alpha.3');
    if (!match) {
      return;
    }

    const NodeRepo = this.context.db.getRepository('flow_nodes');
    await this.context.db.sequelize.transaction(async (transaction) => {
      const nodes = await NodeRepo.find({
        filter: {
          type: 'condition',
        },
        transaction,
      });
      console.log('%d nodes need to be migrated.', nodes.length);

      await nodes.reduce(
        (promise, node) =>
          promise.then(() => {
            return node.update(
              {
                config: {
                  ...node.config,
                  engine: 'basic',
                  // calculation: migrateConfig(node.config.calculation)
                },
              },
              {
                transaction,
              },
            );
          }),
        Promise.resolve(),
      );
    });
  }
}

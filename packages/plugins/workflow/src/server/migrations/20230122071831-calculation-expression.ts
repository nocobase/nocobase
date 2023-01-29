import { Migration } from '@nocobase/server';



const calculatorsMap = {
  'equal': '==',
  '===': '==',
  'notEqual': '!=',
  '!==': '!=',
  'gt': '>',
  'gte': '>=',
  'lt': '<',
  'lte': '<=',
  'add': '+',
  'minus': '-',
  'multiple': '*',
  'divide': '/',
  'mod': '%',
  includes(a, b) {
    return `SEARCH('${b}', '${a}') >= 0`;
  },
  notIncludes(a, b) {
    return `SEARCH('${b}', '${a}') < 0`;
  },
  startsWith(a, b) {
    return `SEARCH('${b}', '${a}') == 0`
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
  concat(a, b) {
    return `CONCATENATE('${a}', '${b}')`;
  }
}

function migrateConfig({ calculation }) {
  if (!calculation?.calculator || !calculation?.operands) {
    return {};
  }

  const calculator = calculatorsMap[calculation.calculator];

  return {
    engine: 'formula.js',
    expression: typeof calculator === 'function'
      ? calculator(...calculation.operands)
      : calculation.operands.join(` ${calculator ?? calculation.calculator} `)
  }
}

export default class extends Migration {
  async up() {
    const match = await this.app.version.satisfies('<=0.9.0-alpha.2');
    if (!match) {
      return;
    }

    const NodeRepo = this.context.db.getRepository('flow_nodes');
    await this.context.db.sequelize.transaction(async (transaction) => {
      const nodes = await NodeRepo.find({
        filter: {
          type: 'calculation'
        },
        transaction
      });
      console.log('%d nodes need to be migrated.', nodes.length);

      await nodes.reduce((promise, node) => promise.then(() => {
        return node.update({
          config: migrateConfig(node.config)
        }, {
          transaction
        });
      }), Promise.resolve());
    });
  }
}

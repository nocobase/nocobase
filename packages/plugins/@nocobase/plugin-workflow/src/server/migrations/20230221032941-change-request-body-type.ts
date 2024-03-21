import { Migration } from '@nocobase/server';

const EJS_RE = /"?<%=\s*(ctx|node)([\w\.\[\]-]+)\s*.*%>"?/;

function migrateData(input) {
  if (typeof input !== 'string') {
    return input;
  }
  if (!input) {
    return null;
  }
  const typeMap = {
    ctx: '$context',
    node: '$jobsMapByNodeId',
  };
  return input.replace(EJS_RE, (_, type, path) => {
    if (type === 'ctx') {
      return `"{{$context${path}}}"`;
    }
    if (type === 'node') {
      return `"{{$jobsMapByNodeId${path.replace('[', '.').replace(']', '.').replace(/\.$/, '')}}}"`;
    }
    return _;
  });
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
          type: 'request',
        },
        transaction,
      });
      console.log('%d nodes need to be migrated.', nodes.length);

      await nodes.reduce(
        (promise, node) =>
          promise.then(async () => {
            if (typeof node.config.data !== 'string') {
              return;
            }
            let data = migrateData(node.config.data);
            try {
              data = JSON.parse(node.config.data);
              return node.update(
                {
                  config: {
                    ...node.config,
                    data,
                  },
                },
                {
                  transaction,
                },
              );
            } catch (error) {
              console.error(
                `flow_node #${node.id} config migrating failed! you should migrate its format from ejs to json-templates manually in your db.`,
              );
            }
          }),
        Promise.resolve(),
      );
    });
  }
  async down() {}
}

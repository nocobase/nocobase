import { Migration } from '@nocobase/server';

const VTypes = {
  constant(operand) {
    return operand.value;
  },
  $jobsMapByNodeId({ options }) {
    const paths = [options.nodeId, options.path].filter(Boolean);
    return paths ? `{{$jobsMapByNodeId.${paths.join('.')}}}` : null;
  },
  $context({ options }) {
    return `{{$context.${options.path}}}`;
  },
};

function migrateConfig(config) {
  if (Array.isArray(config)) {
    return config.map((item) => migrateConfig(item));
  }
  if (typeof config !== 'object') {
    return config;
  }
  if (!config) {
    return config;
  }
  if (config.type && VTypes[config.type] && (config.options || config.value)) {
    return VTypes[config.type](config);
  }
  return Object.keys(config).reduce((memo, key) => ({ ...memo, [key]: migrateConfig(config[key]) }), {});
}

export default class extends Migration {
  appVersion = '<=0.8.0-alpha.13';
  async up() {
    const match = await this.app.version.satisfies('<=0.8.0-alpha.13');
    if (!match) {
      return;
    }
    const NodeRepo = this.context.db.getRepository('flow_nodes');
    await this.context.db.sequelize.transaction(async (transaction) => {
      const nodes = await NodeRepo.find({
        filter: {
          type: {
            $or: ['calculation', 'condition'],
          },
        },
        transaction,
      });
      console.log('%d nodes need to be migrated.', nodes.length);

      await nodes.reduce((promise, node) => {
        return node.update(
          {
            config: migrateConfig(node.config),
          },
          {
            transaction,
          },
        );
      }, Promise.resolve());
    });
  }

  async down() {}
}

import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { Model } from 'sequelize';

export class CommentPlugin extends Plugin {
  afterAdd() {}

  async beforeLoad() {
    this.app.db.on('collections.afterDestroy', async (model: Model, { transaction }) => {
      await this.app.db.getRepository('comments').destroy({
        filter: {
          collectionName: model.get('name') as string,
        },
        transaction,
      });
    });

    this.app.db.on('commentsUsers.afterBulkCreate', (models: Model[], options) => {
      this.app.db.emit('afterMentions', models, options);
    });
  }

  async load() {
    // 导入 collection
    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default CommentPlugin;

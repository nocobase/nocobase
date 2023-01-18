import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { Model } from 'sequelize';

export class CommentPlugin extends Plugin {
  afterAdd() {}

  async beforeLoad() {
    const collectionHandler = async (model: Model, { transaction }) => {
      const collectionDoc = model.toJSON();
      const comments: Model[] = await this.app.db.getRepository('comments').find({
        filter: {
          collectionName: collectionDoc.name,
        },
      });
      for (let comment of comments) {
        await comment.destroy({ transaction });
      }
    };

    this.app.db.on('collections.afterDestroy', collectionHandler);

    this.app.db.on('commentsUsers.afterBulkCreate', (models: Model[]) => {
      const users = models.map((i) => i.toJSON()).map((i) => i.userId);
      this.app.db.emit('afterMention', { users });
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

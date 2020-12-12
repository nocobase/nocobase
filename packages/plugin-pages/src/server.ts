import path from 'path';
import Database from '@nocobase/database';
import Resourcer from '@nocobase/resourcer';
import getCollection from './actions/getCollection';
import getView from './actions/getView';
import getRoutes from './actions/getRoutes';
import getPageInfo from './actions/getPageInfo';

export default async function (options = {}) {
  const database: Database = this.database;
  const resourcer: Resourcer = this.resourcer;

  database.import({
    directory: path.resolve(__dirname, 'collections'),
  });

  resourcer.registerActionHandler('getCollection', getCollection);
  resourcer.registerActionHandler('getView', getView);
  resourcer.registerActionHandler('getPageInfo', getPageInfo);
  resourcer.registerActionHandler('pages:getRoutes', getRoutes);

  const [Collection, Page] = database.getModels(['collections', 'pages']);

  async function createCollectionPage(model, options) {
    // const { 
    //   transaction = await database.sequelize.transaction(),
    // } = options;
    if (model.get('internal')) {
      return;
    }
    const transaction = await database.sequelize.transaction();
    const parent = await Page.findOne({
      transaction,
      where: {
        path: '/collections',
      }
    });
    let page = await Page.findOne({
      transaction,
      where: {
        collection: model.get('name'),
        path: `/collections/${model.get('name')}`,
      },
    });
    if (!page) {
      page = await Page.create({
        type: 'collection',
        collection: model.get('name'),
        path: `/collections/${model.get('name')}`,
        sort: 100,
        parent_id: parent.id,
      }, {
        transaction,
      });
    }
    page.set({
      title: model.get('title'),
      icon: model.get('icon'),
      showInMenu: !!model.get('showInDataMenu'),
    });
    await page.save({
      transaction,
    });
    await transaction.commit();
  }

  Collection.addHook('afterCreate', createCollectionPage);
  Collection.addHook('afterUpdate', createCollectionPage);
  Collection.addHook('afterDestroy', async (model, options) => {
    const { transaction } = options;
    console.log('afterDestroy', model);
    await Page.destroy({
      transaction,
      where: {
        path: `/collections/${model.get('name')}`,
      },
    });
  });
}

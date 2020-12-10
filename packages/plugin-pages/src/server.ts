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

  async function createCollectionPage(model) {
    // if (!model.get('showInDataMenu')) {
    //   return;
    // }
    const parent = await Page.findOne({
      where: {
        path: '/collections',
      }
    });
    let page = await Page.findOne({
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
      });
    }
    page.set({
      title: model.get('title'),
      icon: model.get('icon'),
      showInMenu: !!model.get('showInDataMenu'),
    });
    page.save();
  }

  Collection.addHook('afterCreate', createCollectionPage);
  Collection.addHook('afterUpdate', createCollectionPage);
}

import { Plugin } from '@nocobase/server';
import { ViewCollection } from './view-collection';
import viewResourcer from './resourcers/views';

export class PluginCollectionView extends Plugin {
  async beforeLoad() {
    this.app.db.collectionFactory.registerCollectionType(ViewCollection, {
      condition: (options) => {
        return options.viewName || options.view;
      },

      async onSync() {
        // not sync view collection into database
        return;
      },

      async onRemoveFromDb() {
        // not remove view collection from database
        return;
      },
    });

    this.app.resource(viewResourcer);
  }

  async load() {
    const collectionACLSnippet = this.app.acl.getSnippet('collection-manager');
    collectionACLSnippet.actions.push('dbViews:*');
  }
}

export default PluginCollectionView;

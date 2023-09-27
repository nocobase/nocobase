import { Plugin } from '@nocobase/client';
import { GraphCollectionProvider } from './GraphCollectionProvider';
import { GraphCollectionPane } from './GraphCollectionShortcut';
import { NAMESPACE } from './locale';

export class GraphCollectionPlugin extends Plugin {
  async load() {
    this.app.use(GraphCollectionProvider);

    // TODO: 检查
    this.app.settingsCenter.add('collection-manager.graph', {
      title: `{{t("Graphical interface", { ns: "${NAMESPACE}" })}}`,
      icon: 'FileOutlined',
      Component: GraphCollectionPane,
      aclSnippet: 'pm.collection-manager.graph',
    });
  }
}

export default GraphCollectionPlugin;

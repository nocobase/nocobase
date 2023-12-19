import { Plugin } from '@nocobase/client';
import { GraphCollectionPane } from './GraphCollectionShortcut';
import { NAMESPACE } from './locale';
export class GraphCollectionPlugin extends Plugin {
  async load() {
    this.app.pluginSettingsManager.add('collection-manager.graph', {
      title: `{{t("Graphical interface", { ns: "${NAMESPACE}" })}}`,
      Component: GraphCollectionPane,
      aclSnippet: 'pm.collection-manager.graph',
    });
  }
}

export default GraphCollectionPlugin;

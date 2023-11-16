import { Plugin, useCollection } from '@nocobase/client';
import { DuplicatePluginProvider } from './DuplicatePluginProvider';
import { duplicateActionSettings } from './DuplicateAction.Settings';

export class DuplicatePlugin extends Plugin {
  async load() {
    this.app.use(DuplicatePluginProvider);
    this.app.schemaSettingsManager.add(duplicateActionSettings);

    const initializerData = {
      title: '{{t("Duplicate")}}',
      Component: 'DuplicateActionInitializer',
      schema: {
        'x-component': 'Action',
        'x-action': 'duplicate',
        'x-decorator': 'ACLActionProvider',
        'x-component-props': {
          type: 'primary',
        },
      },
      useVisible() {
        const collection = useCollection();
        return (
          (collection.template !== 'view' || collection?.writableView) &&
          collection.template !== 'file' &&
          collection.template !== 'sql'
        );
      },
    };

    const initializerTableData = {
      title: '{{t("Duplicate")}}',
      Component: 'DuplicateActionInitializer',
      schema: {
        'x-component': 'Action.Link',
        'x-action': 'duplicate',
        'x-designer': 'Action.Designer',
        'x-settings': 'ActionSettings:duplicate',
        'x-decorator': 'ACLActionProvider',
        'x-component-props': {
          type: 'primary',
        },
      },
      useVisible() {
        const collection = useCollection();
        return (
          (collection.template !== 'view' || collection?.writableView) &&
          collection.template !== 'file' &&
          collection.template !== 'sql'
        );
      },
    };

    const tableActionColumnInitializers = this.app.schemaInitializerManager.get('TableActionColumnInitializers');
    tableActionColumnInitializers?.add('actions.duplicate', initializerTableData);
    const detailsActionInitializers = this.app.schemaInitializerManager.get('DetailsActionInitializers');
    detailsActionInitializers?.add('enableActions.duplicate', initializerData);
    const ReadPrettyFormActionInitializers = this.app.schemaInitializerManager.get('ReadPrettyFormActionInitializers');
    ReadPrettyFormActionInitializers?.add('enableActions.duplicate', initializerData);
  }
}

export default DuplicatePlugin;
export * from './DuplicateAction';

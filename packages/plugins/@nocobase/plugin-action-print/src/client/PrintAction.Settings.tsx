import {
  SchemaSetting,
  SchemaSettings,
  ActionDesigner,
  useSchemaDesigner,
  useLinkageAction,
  useCollection,
} from '@nocobase/client';

const printActionSettings = new SchemaSetting({
  name: 'ActionSettings:print',
  items: [
    {
      name: 'Customize',
      type: 'itemGroup',
      Component: (props) => {
        return props.children;
      },
      children: [
        {
          name: 'editButton',
          Component: ActionDesigner.ButtonEditor,
          useComponentProps() {
            const { buttonEditorProps } = useSchemaDesigner();
            return buttonEditorProps;
          },
        },
        {
          name: 'linkageRules',
          Component: SchemaSettings.LinkageRules,
          useVisible() {
            const isAction = useLinkageAction();
            const { linkageAction } = useSchemaDesigner();
            return linkageAction || isAction;
          },
          useComponentProps() {
            const { name } = useCollection();
            const { linkageRulesProps } = useSchemaDesigner();
            return {
              ...linkageRulesProps,
              collectionName: name,
            };
          },
        },

        {
          name: 'remove',
          sort: 100,
          Component: ActionDesigner.RemoveButton as any,
          useComponentProps() {
            const { removeButtonProps } = useSchemaDesigner();
            return removeButtonProps;
          },
        },
      ],
    },
  ],
});

export { printActionSettings };

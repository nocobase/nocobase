import { ButtonEditor, SchemaSettings, useSchemaToolbar } from '@nocobase/client';

export const stepsFormNextActionSettings = new SchemaSettings({
  name: `actionSettings:stepsFormNext`,
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        const { buttonEditorProps } = useSchemaToolbar();
        return buttonEditorProps;
      },
    },
    {
      name: 'remove',
      type: 'remove',
    },
  ],
});

import { ButtonEditor, SchemaSettings, useSchemaToolbar } from '@nocobase/client';

export const stepsFormCustomActionSettings = new SchemaSettings({
  name: `actionSettings:stepsFormSubmit`,
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

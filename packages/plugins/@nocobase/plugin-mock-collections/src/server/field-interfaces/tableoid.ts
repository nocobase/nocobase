export const tableoid = () => ({
  name: '__collection',
  type: 'virtual',
  uiSchema: {
    type: 'string',
    title: '{{t("Table OID")}}',
    'x-component': 'CollectionSelect',
    'x-component-props': {
      isTableOid: true,
    },
    'x-read-pretty': true,
  },
});

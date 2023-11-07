export default {
  calendar: (options) => {
    return {
      fields: [
        { name: 'exclude', type: 'json' },
        {
          name: 'cron',
          type: 'string',
          uiSchema: {
            type: 'string',
            title: '{{t("Repeats")}}',
            'x-component': 'CronSet',
            'x-component-props': 'allowClear',
            enum: [
              { label: '{{t("Daily")}}', value: '0 0 0 * * ?' },
              { label: '{{t("Weekly")}}', value: 'every_week' },
              { label: '{{t("Monthly")}}', value: 'every_month' },
              { label: '{{t("Yearly")}}', value: 'every_year' },
            ],
          },
          interface: 'select',
        },
      ],
    };
  },
  tree: (options) => {
    return {
      tree: 'adjacencyList',
      fields: [
        {
          interface: 'integer',
          name: 'parentId',
          type: 'bigInt',
          isForeignKey: true,
          uiSchema: {
            type: 'number',
            title: '{{t("Parent ID")}}',
            'x-component': 'InputNumber',
            'x-read-pretty': true,
          },
        },
        {
          interface: 'm2o',
          type: 'belongsTo',
          name: 'parent',
          foreignKey: 'parentId',
          treeParent: true,
          onDelete: 'CASCADE',
          target: options.name,
          uiSchema: {
            title: '{{t("Parent")}}',
            'x-component': 'AssociationField',
            'x-component-props': { multiple: false, fieldNames: { label: 'id', value: 'id' } },
          },
        },
        {
          interface: 'o2m',
          type: 'hasMany',
          name: 'children',
          foreignKey: 'parentId',
          treeChildren: true,
          onDelete: 'CASCADE',
          target: options.name,
          uiSchema: {
            title: '{{t("Children")}}',
            'x-component': 'AssociationField',
            'x-component-props': { multiple: true, fieldNames: { label: 'id', value: 'id' } },
          },
        },
      ],
    };
  },
  general: () => ({}),
};

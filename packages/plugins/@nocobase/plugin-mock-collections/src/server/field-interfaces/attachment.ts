import { uid } from '@nocobase/utils';

export const attachment = {
  options: (options) => ({
    type: 'belongsToMany',
    target: 'attachments',
    through: options.through || `t_${uid()}`,
    foreignKey: options.foreignKey || `f_${uid()}`,
    otherKey: options.otherKey || `f_${uid()}`,
    targetKey: options.targetKey || 'id',
    sourceKey: options.sourceKey || 'id',
    // name,
    uiSchema: {
      type: 'array',
      // title,
      'x-component': 'Upload.Attachment',
    },
  }),
};

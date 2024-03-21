import { faker } from '@faker-js/faker';
import { uid } from '@nocobase/utils';
import _ from 'lodash';

export function mockAttachment() {
  return {
    title: faker.word.words(),
    filename: `${faker.word.words()}.png`,
    extname: '.png',
    path: '',
    size: 3938,
    url: faker.image.url(),
    mimetype: 'image/png',
    meta: {},
    storageId: 1,
  };
}

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
  mock: (options) =>
    options?.uiSchema?.['x-component-props']?.multiple
      ? _.range(faker.number.int({ min: 1, max: 5 })).map(() => mockAttachment())
      : mockAttachment(),
};

import { defaultProps, defaultSystemFields, defaultCollectionOptions } from './properties';
import { IField } from './types';

export const listCollection: IField = {
  name: 'listCollection',
  type: 'object',
  title: '{{t("List collection")}}',
  isAssociation: true,
  order: 1,
  color: 'blue',
  presetFields: [...defaultSystemFields],
  properties: {
    ...defaultProps,
    ...defaultCollectionOptions,
  },
  include:[],
  exclude:[]
};

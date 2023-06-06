import { uid } from '@formily/shared';

export const createRendererSchema = (collection: string, props: any) => {
  return {
    type: 'void',
    'x-decorator': 'ACLCollectionProvider',
    'x-acl-action': `${collection}:list`,
    'x-designer': 'ChartRenderer.Designer',
    'x-component': 'CardItem',
    'x-initializer': 'ChartInitializers',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'ChartRenderer',
        'x-component-props': props,
      },
    },
  };
};

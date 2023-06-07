import { uid } from '@formily/shared';

export const createRendererSchema = (collection: string, props: any) => {
  return {
    type: 'void',
    'x-decorator': 'ChartRendererProvider',
    'x-decorator-props': props,
    'x-acl-action': `${collection}:list`,
    'x-designer': 'ChartRenderer.Designer',
    'x-component': 'CardItem',
    'x-initializer': 'ChartInitializers',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'ChartRenderer',
      },
    },
  };
};

import { ISchema, Schema } from '@formily/react';

export const isCollectionFieldComponent = (schema: ISchema) => {
  return schema['x-component'] === 'CollectionField';
};

export const isColumnComponent = (schema: Schema) => {
  return schema['x-component']?.endsWith('.Column') > -1;
};

export function extractIndex(str) {
  const numbers = [];
  str?.split('.').forEach(function (element) {
    if (!isNaN(element)) {
      numbers.push(String(Number(element) + 1));
    }
  });
  return numbers.join('.');
}

/**
 * 判断一个 DOM 对象是否是由 createPortal 挂在到了 body 上
 * @param domNode DOM 对象
 */
export const isPortalInBody = (dom: HTMLElement) => {
  while (dom) {
    if (dom.id === 'root') {
      return false;
    }
    dom = dom.parentNode as HTMLElement;
  }
  return true;
};

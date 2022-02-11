import { get } from 'lodash';
import { i18n } from '../../../i18n';

export const fieldsToFilterColumns = (fields: any[], options: any = {}) => {
  //   const { fieldNames = [] } = options;
  //   const properties = {};
  //   fields.forEach((field, index) => {
  //     if (fieldNames?.length && !fieldNames.includes(field.name)) {
  //       return;
  //     }
  //     const fieldOption = interfaces.get(field.interface);
  //     if (!fieldOption?.operations) {
  //       return;
  //     }
  //     properties[`column${index}`] = {
  //       type: 'void',
  //       title: field?.uiSchema?.title,
  //       'x-component': 'Filter.Column',
  //       'x-component-props': {
  //         operations: fieldOption.operations,
  //       },
  //       properties: {
  //         [field.name]: {
  //           ...field.uiSchema,
  //           'x-decorator': 'FormilyFormItem',
  //           title: null,
  //         },
  //       },
  //     };
  //   });
  //   return properties;
};

export const toEvents = (data: any[], fieldNames: any) => {
  return data?.map((item) => {
    return {
      id: get(item, fieldNames.id || 'id'),
      title: get(item, fieldNames.title) || i18n.t('Untitle'),
      start: new Date(get(item, fieldNames.start)),
      end: new Date(get(item, fieldNames.end || fieldNames.start)),
    };
  });
};

import { useTranslation } from 'react-i18next';
import { useCollection, useCollectionManager } from '../../collection-manager';
import { ActionType } from './type';

export const useLinkageCollectionFieldOptions = (collectionName: string, type: string) => {
  const { getCollectionFields, getInterface } = useCollectionManager();
  const fields = getCollectionFields(collectionName).filter((v) => {
    return !['id', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'].includes(v.name);
  });
  const { t } = useTranslation();
  const fieldOperators = [
    { label: t('Visible'), value: ActionType.Visible, selected: true, schema: {} },
    { label: t('Editable'), value: ActionType.Editable, selected: false, schema: {} },
    { label: t('Read only'), value: ActionType.ReadOnly, selected: false, schema: {} },
    { label: t('Easy reading'), value: ActionType.ReadPretty, selected: false, schema: {} },
    { label: t('Hidden'), value: ActionType.None, selected: false, schema: {} },
    { label: t('Hidden(reserved value)'), value: ActionType.Hidden, selected: false, schema: {} },
    { label: t('Required'), value: ActionType.Required, selected: false, schema: {} },
    { label: t('Not required'), value: ActionType.InRequired, selected: false, schema: {} },
    { label: t('Value'), value: ActionType.Value, selected: false, schema: {} },
  ];
  const buttonOperators = [
    { label: t('Visible'), value: ActionType.Visible, schema: {} },
    { label: t('Disabled'), value: ActionType.Disabled, schema: {} },
    { label: t('Hidden'), value: ActionType.Hidden, schema: {} },
  ];
  const operators = type === 'button' ? buttonOperators : fieldOperators;
  const field2option = (field, depth) => {
    const fieldInterface = getInterface(field.interface);
    const { nested, children } = fieldInterface?.filterable || {};
    const option = {
      name: field.name,
      title: field?.uiSchema?.title || field.name,
      schema: field?.uiSchema,
      operators:
        operators?.filter?.((operator) => {
          if (nested || children) {
            return operator?.value !== ActionType.Value;
          }
          return true;
        }) || [],
    };
    if (field.target && depth > 2) {
      return;
    }
    if (depth > 2) {
      return option;
    }
    return option;
  };
  const getOptions = (fields, depth) => {
    const options = [];
    fields.forEach((field) => {
      const option = field2option(field, depth);
      if (option) {
        options.push(option);
      }
    });
    return options;
  };
  return getOptions(fields, 1);
};

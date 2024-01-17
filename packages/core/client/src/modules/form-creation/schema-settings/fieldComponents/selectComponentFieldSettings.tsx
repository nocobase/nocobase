import { SchemaSettings } from '../../../../application/schema-settings/SchemaSettings';
import {
  useFieldMode,
  useIsAssociationField,
  useIsFieldReadPretty,
  useIsSelectFieldMode,
} from '../../../../schema-component/antd/form-item/FormItem.Settings';
import { useIsShowMultipleSwitch } from '../../../../schema-settings/hooks/useIsShowMultipleSwitch';
import {
  allowMultiple,
  enableLink,
  fieldComponent,
  quickCreate,
  setDefaultSortingRules,
  setTheDataScope,
  titleField,
} from './utils';

export const selectComponentFieldSettings = new SchemaSettings({
  name: 'fieldSettings:component:Select',
  items: [
    {
      ...fieldComponent,
      useVisible: useIsAssociationField,
    },
    {
      ...setTheDataScope,
      useVisible() {
        const isSelectFieldMode = useIsSelectFieldMode();
        const isFieldReadPretty = useIsFieldReadPretty();
        return isSelectFieldMode && !isFieldReadPretty;
      },
    },
    {
      ...setDefaultSortingRules,
      useVisible() {
        const isSelectFieldMode = useIsSelectFieldMode();
        const isFieldReadPretty = useIsFieldReadPretty();
        return isSelectFieldMode && !isFieldReadPretty;
      },
    },
    {
      ...quickCreate,
      useVisible() {
        const readPretty = useIsFieldReadPretty();
        const isAssociationField = useIsAssociationField();
        const fieldMode = useFieldMode();
        return !readPretty && isAssociationField && ['Select'].includes(fieldMode);
      },
    },
    {
      ...allowMultiple,
      useVisible() {
        const isAssociationField = useIsAssociationField();
        const IsShowMultipleSwitch = useIsShowMultipleSwitch();
        return isAssociationField && IsShowMultipleSwitch();
      },
    },
    {
      ...titleField,
      useVisible: useIsAssociationField,
    },
    {
      ...enableLink,
      useVisible() {
        const readPretty = useIsFieldReadPretty();
        return useIsAssociationField() && readPretty;
      },
    },
  ],
});

import { useSubFormValue } from '../../../schema-component/antd/association-field/hooks';

export const useCurrentObjectVariables = () => {
  const { formValue: subFormValue } = useSubFormValue();
  return {
    shouldDisplayCurrentObject: !!subFormValue,
    /**
     * 不仅指子表单的值，还指子表格每一行的值
     */
    subFormValue,
  };
};

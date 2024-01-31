import { useSubFormValue } from '../../../schema-component/antd/association-field/hooks';

export const useCurrentObjectVariables = () => {
  const { formValue: currentObjectCtx } = useSubFormValue();
  return {
    shouldDisplayCurrentObject: !!currentObjectCtx,
    currentObjectCtx,
  };
};

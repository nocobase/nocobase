import { useVariable } from '../../../modules/variable/useVariable';
import { useBaseVariable } from './useBaseVariable';

/**
 * 变量：`Current popup record`
 * @param props
 * @returns
 */
export const usePopupVariable = (props: any = {}) => {
  const { value, title, collection } = useVariable('$nPopupRecord');
  const settings = useBaseVariable({
    collectionField: props.collectionField,
    uiSchema: props.schema,
    name: '$nPopupRecord',
    title,
    collectionName: collection?.name,
    noDisabled: props.noDisabled,
    targetFieldSchema: props.targetFieldSchema,
    dataSource: collection?.dataSource,
  });

  return {
    /** 变量配置 */
    settings,
    /** 变量值 */
    popupRecordCtx: value,
    /** 用于判断是否需要显示配置项 */
    shouldDisplayPopupRecord: !!value,
    /** 当前记录对应的 collection name */
    collectionName: collection?.name,
    dataSource: collection?.dataSource,
  };
};

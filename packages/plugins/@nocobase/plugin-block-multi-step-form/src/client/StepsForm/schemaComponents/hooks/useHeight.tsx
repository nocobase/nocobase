// refer to packages/core/client/src/schema-component/antd/form-v2/hook.ts
import { useDataBlockHeight, useBlockHeightProps, useFormDataTemplates, useDesignable } from '@nocobase/client';
import { theme } from 'antd';

export default function useHeight() {
  const height = useDataBlockHeight();
  const { token } = theme.useToken();
  const { designable } = useDesignable();
  const { heightProps } = useBlockHeightProps() || {};
  const { title } = heightProps || {};
  const { display, enabled } = useFormDataTemplates();

  const isFormBlock = true;
  const actionBarHeight = designable ? token.controlHeight + (isFormBlock ? 1 : 2) * token.marginLG : token.marginLG;
  const blockTitleHeaderHeight = title ? token.fontSizeLG * token.lineHeightLG + token.padding * 2 - 1 : 0;
  const paginationHeight = 0;
  const dataTemplateHeight = display && enabled ? token.controlHeight + 2 * token.padding + token.margin : 0;
  const stepHeight = 56;
  return (
    height -
    actionBarHeight -
    token.paddingLG -
    blockTitleHeaderHeight -
    paginationHeight -
    dataTemplateHeight -
    stepHeight
  );
}

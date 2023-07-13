import { css } from '@nocobase/client';
import { useInterfaceContext } from '../../../router/InterfaceProvider';
import { PaginationProps } from 'antd';

const listCss = css`
  padding: 0 var(--nb-spacing);
  & > .nb-action-bar {
    padding: unset !important;
    background: unset !important;
  }
`;
export const useGridCardBlockItemProps = () => {
  return {
    className: listCss,
  };
};

const columnCountConfig = {
  xs: 1,
  sm: 1,
  md: 1,
  lg: 1,
  xl: 1,
  xxl: 1,
};

export const useGridCardBlockProps = () => {
  const isInterface = useInterfaceContext();
  return {
    columnCount: isInterface ? columnCountConfig : null,
    pagination: {
      simple: true,
    } as PaginationProps,
  };
};

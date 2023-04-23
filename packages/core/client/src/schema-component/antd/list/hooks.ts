import { css } from '@emotion/css';

const listItemActionCss = css`
  margin-top: var(--nb-spacing);
  padding-top: var(--nb-spacing);
  border-top: 1px solid #e8e8e8;
`;
export const useListActionBarProps = () => {
  return {
    className: listItemActionCss,
  };
};

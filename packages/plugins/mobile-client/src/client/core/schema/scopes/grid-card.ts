import { css } from '@emotion/css';

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

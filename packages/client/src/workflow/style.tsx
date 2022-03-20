import { css } from '@emotion/css';

export const workflowPageClass = css`
  height: 100%;
  width: 100%;
  overflow: auto;

  .workflow-canvas{
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2em;
  }
`;

export const branchClass = css`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const nodeBlockClass = css`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const nodeClass = css`
  width: 20em;
  background: #fff;
  padding: 1em;
  box-shadow: 0 .25em .5em rgba(0, 0, 0, .1);
`;

export const nodeHeaderClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const nodeTitleClass = css`
  font-weight: normal;

  .workflow-node-id{
    color: #999;
  }
`;

export const addButtonClass = css`
  position: relative;
  padding: 2em 0;
  :before{
    content: "";
    position: absolute;
    top: 0;
    left: calc(50% - .5px);
    height: 100%;
    width: 1px;
    margin: auto;
    background-color: #ddd;
  }
`;


import { css } from '@emotion/css';

export const scrollWrapper =css`
  overflow: auto;
  max-width: 100%;
  /*firefox*/
  scrollbar-width: thin;
  /*iPad*/
  height: 1.2rem;
  &::-webkit-scrollbar {
    width: 1.1rem;
    height: 1.1rem;
  };
  &::-webkit-scrollbar-corner {
    background: transparent;
  };
  &::-webkit-scrollbar-thumb {
    border: 6px solid transparent;
    background: rgba(0, 0, 0, 0.2);
    background: var(--palette-black-alpha-20, rgba(0, 0, 0, 0.2));
    border-radius: 10px;
    background-clip: padding-box;
  };
  &::-webkit-scrollbar-thumb:hover {
    border: 4px solid transparent;
    background: rgba(0, 0, 0, 0.3);
    background: var(--palette-black-alpha-30, rgba(0, 0, 0, 0.3));
    background-clip: padding-box;
  }
`

export const horizontalScroll =css`
  height: 1px;
`

export const tooltipDefaultContainer =css`
  background: #fff;
  padding: 12px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
`

export const tooltipDefaultContainerParagraph =css`
  font-size: 12px;
  margin-bottom: 6px;
  color: #666;
`

export const tooltipDetailsContainer =css`
  position: absolute;
  display: flex;
  flex-shrink: 0;
  pointer-events: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
`

export const tooltipDetailsContainerHidden= css`
  visibility: hidden;
  position: absolute;
  display: flex;
  pointer-events: none;
`


export const  verticalScroll =css`
  overflow: hidden auto;
  width: 1rem;
  flex-shrink: 0;
  /*firefox*/
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    width: 1.1rem;
    height: 1.1rem;
  };
  &::-webkit-scrollbar-corner {
    background: transparent;
  };
  &::-webkit-scrollbar-thumb {
    border: 6px solid transparent;
    background: rgba(0, 0, 0, 0.2);
    background: var(--palette-black-alpha-20, rgba(0, 0, 0, 0.2));
    border-radius: 10px;
    background-clip: padding-box;
  };
  &::-webkit-scrollbar-thumb:hover {
    border: 4px solid transparent;
    background: rgba(0, 0, 0, 0.3);
    background: var(--palette-black-alpha-30, rgba(0, 0, 0, 0.3));
    background-clip: padding-box;
  }

`



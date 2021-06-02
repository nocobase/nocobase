import React, { createContext, useContext } from 'react';

export * from './form';
export * from './descriptions';
export * from './table';

export const BlockContext = createContext({});

export interface BlockProps {
  name: string;
  blocks?: any;
  'x-component'?: any;
  [key: string]: any;
}

export interface CreateBlockOptions {
  components?: any;
}

export function createBlock(options: CreateBlockOptions) {
  const { components } = options;
  function Block(props: BlockProps) {
    const { ['x-component']: component } = props;
    const Component = component ? components[component] : null;
    if (!Component) {
      return null;
    }
    return (
      <BlockContext.Provider value={components}>
        <Component {...props}/>
      </BlockContext.Provider>
    )
  }
  return Block;
}

export function useBlock(props: any) {
  const components = useContext(BlockContext);
  const { 'x-component': component } = props;

  const Component = component ? components[component] : null;

  return {
    Component,
  }
}

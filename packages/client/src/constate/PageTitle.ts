import constate from 'constate';
import { useState } from 'react';

export interface PageTitleProviderProps {
  defaultPageTitle?: string;
}

const [PageTitleProvider, usePageTitleContext] = constate(({ defaultPageTitle }: PageTitleProviderProps) => {
  return useState(defaultPageTitle);
});

export { PageTitleProvider, usePageTitleContext };

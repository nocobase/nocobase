import constate from 'constate';
import { useState } from 'react';
import { useSystemSettings } from '../components/admin-layout/SiteTitle';

export interface PageTitleProviderProps {
  defaultPageTitle?: string;
}

const [PageTitleProvider, usePageTitleContext] = constate(({ defaultPageTitle }: PageTitleProviderProps) => {
  const { title } = useSystemSettings();
  const [pageTitle, setPageTitle] = useState(defaultPageTitle);
  return [title ? `${pageTitle} - ${title}` : pageTitle, setPageTitle];
});

export { PageTitleProvider, usePageTitleContext };

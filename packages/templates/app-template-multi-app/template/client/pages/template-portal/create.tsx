import type { ReactElement } from 'react';
import { CatalogForm } from '@nocobase/app-plugin-multi-app/client/components/catalog-form';
export default function Page(): ReactElement {
  return <CatalogForm kind='instances' action='provision' />;
}

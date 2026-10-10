import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement, ReactNode } from 'react';
import { Outlet } from 'react-router';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Badge } from '#components/ui/badge';
import { Card, CardHeader, CardContent } from '#components/ui/card';

export function GalleryPage({
  view,
  children,
}: {
  readonly view: string;
  readonly children: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <PageContainer className='flex flex-col gap-6'>
      <PageHeader
        title={t(`gallery.${view}`)}
        description={t('gallery.description')}
      />
      <p className='text-sm text-muted-foreground'>{t('gallery.hint')}</p>
      <div className='grid min-w-0 gap-6 lg:grid-cols-2'>{children}</div>
      <Outlet />
    </PageContainer>
  );
}
export function GallerySection({
  title,
  components,
  children,
}: {
  readonly title: string;
  readonly components: string;
  readonly children: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Card className='min-w-0'>
      <CardHeader className='gap-3'>
        <h2 className='text-base font-medium'>{t(`gallery.${title}`)}</h2>
        <div className='flex flex-wrap gap-2'>
          {components.split(',').map((name) => (
            <Badge key={name} variant='outline'>
              {name.trim()}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>{children}</CardContent>
    </Card>
  );
}

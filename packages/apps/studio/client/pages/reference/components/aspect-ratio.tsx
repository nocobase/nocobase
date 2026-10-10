import { useTranslation } from '@nocobase/i18n/client';
import { MapPinIcon, PlayIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { ExamplePage, ExampleSection } from '../shared';

const unsplash = (id: string): string =>
  `https://images.unsplash.com/${id}?w=900&auto=format&fit=crop&q=80`;

const products = [
  {
    id: 'workspace',
    name: 'Workspace',
    src: unsplash('photo-1497366754035-f200968a6e72'),
  },
  {
    id: 'desk',
    name: 'Desk',
    src: unsplash('photo-1497215728101-856f4ea42174'),
  },
  {
    id: 'office',
    name: 'Office',
    src: unsplash('photo-1497366811353-6870744d04b2'),
  },
];

export default function AspectRatioExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <ExamplePage
      title={t('components.aspectRatio.title')}
      description={t('components.aspectRatio.description')}
      docs='https://ui.shadcn.com/docs/components/aspect-ratio'
    >
      <ExampleSection
        title={t('components.aspectRatio.video')}
        description={t('components.aspectRatio.videoDescription')}
        contentClassName='block'
      >
        <AspectRatio
          ratio={16 / 9}
          className='w-full max-w-sm overflow-hidden rounded-lg bg-muted'
        >
          <img
            src={unsplash('photo-1497366754035-f200968a6e72')}
            alt={t('components.aspectRatio.videoAlt')}
            loading='lazy'
            className='size-full object-cover'
          />
          <div className='absolute inset-0 flex items-center justify-center'>
            <Button
              size='icon-lg'
              variant='secondary'
              className='rounded-full'
              aria-label={t('components.aspectRatio.play')}
            >
              <PlayIcon />
            </Button>
          </div>
        </AspectRatio>
      </ExampleSection>

      <ExampleSection
        title={t('components.aspectRatio.square')}
        description={t('components.aspectRatio.squareDescription')}
        contentClassName='block'
      >
        <div className='grid w-full max-w-sm grid-cols-3 gap-3'>
          {products.map((product) => (
            <AspectRatio
              key={product.id}
              ratio={1}
              className='overflow-hidden rounded-lg bg-muted'
            >
              <img
                src={product.src}
                alt={product.name}
                loading='lazy'
                className='size-full object-cover'
              />
            </AspectRatio>
          ))}
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.aspectRatio.portrait')}
        description={t('components.aspectRatio.portraitDescription')}
      >
        <AspectRatio
          ratio={3 / 4}
          className='w-40 overflow-hidden rounded-lg bg-muted'
        >
          <img
            src={unsplash('photo-1497215728101-856f4ea42174')}
            alt={t('components.aspectRatio.portraitAlt')}
            loading='lazy'
            className='size-full object-cover'
          />
        </AspectRatio>
        <AspectRatio
          ratio={9 / 16}
          className='w-32 overflow-hidden rounded-lg bg-muted'
        >
          <img
            src={unsplash('photo-1497366811353-6870744d04b2')}
            alt={t('components.aspectRatio.portraitAlt')}
            loading='lazy'
            className='size-full object-cover'
          />
        </AspectRatio>
      </ExampleSection>

      <ExampleSection
        title={t('components.aspectRatio.placeholder')}
        description={t('components.aspectRatio.placeholderDescription')}
        contentClassName='block'
      >
        <AspectRatio
          ratio={4 / 3}
          className='flex w-full max-w-sm flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/50 text-muted-foreground'
        >
          <MapPinIcon className='size-6' aria-hidden='true' />
          <span className='text-sm'>
            {t('components.aspectRatio.mapPlaceholder')}
          </span>
        </AspectRatio>
      </ExampleSection>

      <ExampleSection
        title={t('components.aspectRatio.inCard')}
        description={t('components.aspectRatio.inCardDescription')}
        contentClassName='block'
      >
        <Card className='w-full max-w-sm'>
          <CardContent>
            <AspectRatio
              ratio={16 / 9}
              className='overflow-hidden rounded-lg bg-muted'
            >
              <img
                src={unsplash('photo-1497366811353-6870744d04b2')}
                alt={t('components.aspectRatio.cardAlt')}
                loading='lazy'
                className='size-full object-cover'
              />
              <Badge className='absolute top-2 left-2'>
                {t('components.aspectRatio.recorded')}
              </Badge>
            </AspectRatio>
          </CardContent>
          <CardHeader>
            <CardTitle>{t('components.aspectRatio.cardTitle')}</CardTitle>
            <CardDescription>
              {t('components.aspectRatio.cardDescription', {
                date: 'Sep 12, 2026',
                duration: '4:32',
              })}
            </CardDescription>
          </CardHeader>
        </Card>
      </ExampleSection>
    </ExamplePage>
  );
}

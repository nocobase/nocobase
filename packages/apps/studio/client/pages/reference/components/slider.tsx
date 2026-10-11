import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

import { ExamplePage, ExampleSection } from '../shared';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/** Base UI reports a single thumb as a number and several thumbs as an array. */
function toValues(value: number | readonly number[]): number[] {
  return typeof value === 'number' ? [value] : [...value];
}

export default function SliderExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [budget, setBudget] = useState<number[]>([2500]);
  const [priceRange, setPriceRange] = useState<number[]>([200, 800]);

  return (
    <ExamplePage
      title={t('components.slider.title')}
      description={t('components.slider.description')}
      docs='https://ui.shadcn.com/docs/components/slider'
    >
      <ExampleSection
        title={t('components.slider.basic')}
        description={t('components.slider.basicDescription')}
        contentClassName='block'
      >
        <div className='grid w-full max-w-xs gap-3'>
          <Label htmlFor='slider-discount'>
            {t('components.slider.discount')}
          </Label>
          <Slider id='slider-discount' defaultValue={[15]} max={50} step={5} />
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.slider.controlled')}
        description={t('components.slider.controlledDescription')}
        contentClassName='block'
      >
        <div className='grid w-full max-w-xs gap-3'>
          <div className='flex items-center justify-between gap-2'>
            <Label htmlFor='slider-budget'>
              {t('components.slider.monthlyBudget')}
            </Label>
            <span className='text-sm text-muted-foreground tabular-nums'>
              {currency.format(budget[0])}
            </span>
          </div>
          <Slider
            id='slider-budget'
            value={budget}
            onValueChange={(value) => setBudget(toValues(value))}
            min={0}
            max={10000}
            step={100}
          />
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.slider.range')}
        description={t('components.slider.rangeDescription')}
        contentClassName='block'
      >
        <div className='grid w-full max-w-xs gap-3'>
          <div className='flex items-center justify-between gap-2'>
            <Label htmlFor='slider-price-range'>
              {t('components.slider.priceRange')}
            </Label>
            <span className='text-sm text-muted-foreground tabular-nums'>
              {currency.format(priceRange[0])} –{' '}
              {currency.format(priceRange[1])}
            </span>
          </div>
          <Slider
            id='slider-price-range'
            value={priceRange}
            onValueChange={(value) => setPriceRange(toValues(value))}
            min={0}
            max={1000}
            step={50}
            minStepsBetweenValues={1}
          />
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.slider.vertical')}
        description={t('components.slider.verticalDescription')}
      >
        <div className='flex items-end gap-10'>
          <div className='flex flex-col items-center gap-3'>
            <Slider
              defaultValue={[20]}
              max={100}
              step={5}
              orientation='vertical'
              className='h-40'
            />
            <span className='text-xs text-muted-foreground'>
              {t('components.slider.lowStockAlert')}
            </span>
          </div>
          <div className='flex flex-col items-center gap-3'>
            <Slider
              defaultValue={[60]}
              max={100}
              step={5}
              orientation='vertical'
              className='h-40'
            />
            <span className='text-xs text-muted-foreground'>
              {t('components.slider.reorderLevel')}
            </span>
          </div>
        </div>
      </ExampleSection>

      <ExampleSection
        title={t('components.slider.disabled')}
        description={t('components.slider.disabledDescription')}
        contentClassName='block'
      >
        <div className='grid w-full max-w-xs gap-3'>
          <div className='flex items-center justify-between gap-2'>
            <Label htmlFor='slider-locked'>
              {t('components.slider.approvedDiscount')}
            </Label>
            <span className='text-sm text-muted-foreground tabular-nums'>
              25%
            </span>
          </div>
          <Slider id='slider-locked' defaultValue={[25]} max={50} disabled />
        </div>
      </ExampleSection>
    </ExamplePage>
  );
}

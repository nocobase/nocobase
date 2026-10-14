import { useTranslation } from '@nocobase/i18n/client';
import {
  CircleCheckIcon,
  CircleDashedIcon,
  ClockIcon,
  TruckIcon,
} from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';

import { ExamplePage, ExampleSection } from '../shared';

const PRODUCT_KEYS = ['orders', 'inventory', 'invoicing', 'analytics'] as const;
const SOLUTION_KEYS = ['retail', 'wholesale', 'logistics'] as const;

function MenuListItem({
  title,
  children,
}: {
  readonly title: string;
  readonly children?: ReactNode;
}): ReactElement {
  return (
    <li>
      <NavigationMenuLink render={<a href='#' />}>
        <div className='flex flex-col gap-1 text-sm'>
          <div className='leading-none font-medium'>{title}</div>
          {children ? (
            <div className='line-clamp-2 text-muted-foreground'>{children}</div>
          ) : null}
        </div>
      </NavigationMenuLink>
    </li>
  );
}

export default function NavigationMenuExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <ExamplePage
      title={t('components.navigationMenu.title')}
      description={t('components.navigationMenu.description')}
      docs='https://ui.shadcn.com/docs/components/navigation-menu'
    >
      <ExampleSection
        title={t('components.navigationMenu.product')}
        description={t('components.navigationMenu.productDescription')}
      >
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                {t('components.navigationMenu.products')}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className='grid w-80 gap-1 sm:w-[32rem] sm:grid-cols-2'>
                  {PRODUCT_KEYS.map((key) => (
                    <MenuListItem
                      key={key}
                      title={t(`components.navigationMenu.item.${key}.title`)}
                    >
                      {t(`components.navigationMenu.item.${key}.description`)}
                    </MenuListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                {t('components.navigationMenu.solutions')}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className='grid w-64 gap-1'>
                  {SOLUTION_KEYS.map((key) => (
                    <MenuListItem
                      key={key}
                      title={t(
                        `components.navigationMenu.solution.${key}.title`,
                      )}
                    >
                      {t(
                        `components.navigationMenu.solution.${key}.description`,
                      )}
                    </MenuListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<a href='#' />}
                className={navigationMenuTriggerStyle()}
              >
                {t('components.navigationMenu.pricing')}
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </ExampleSection>

      <ExampleSection
        title={t('components.navigationMenu.icons')}
        description={t('components.navigationMenu.iconsDescription')}
      >
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                {t('components.navigationMenu.pipeline')}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className='grid w-56'>
                  <li>
                    <NavigationMenuLink
                      render={<a href='#' className='flex-row items-center' />}
                    >
                      <CircleDashedIcon />
                      {t('reference.statusDraft')}
                    </NavigationMenuLink>
                    <NavigationMenuLink
                      render={<a href='#' className='flex-row items-center' />}
                    >
                      <ClockIcon />
                      {t('reference.statusProcessing')}
                    </NavigationMenuLink>
                    <NavigationMenuLink
                      render={<a href='#' className='flex-row items-center' />}
                    >
                      <TruckIcon />
                      {t('reference.statusShipped')}
                    </NavigationMenuLink>
                    <NavigationMenuLink
                      render={<a href='#' className='flex-row items-center' />}
                    >
                      <CircleCheckIcon />
                      {t('reference.statusCompleted')}
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </ExampleSection>

      <ExampleSection
        title={t('components.navigationMenu.alignment')}
        description={t('components.navigationMenu.alignmentDescription')}
      >
        <NavigationMenu align='center'>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                {t('components.navigationMenu.supportMenu')}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className='grid w-64 gap-1'>
                  <MenuListItem
                    title={t('components.navigationMenu.support.help')}
                  />
                  <MenuListItem
                    title={t('components.navigationMenu.support.status')}
                  />
                  <MenuListItem
                    title={t('components.navigationMenu.support.contact')}
                  />
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </ExampleSection>

      <ExampleSection
        title={t('components.navigationMenu.linksOnly')}
        description={t('components.navigationMenu.linksOnlyDescription')}
      >
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<a href='#' />}
                className={navigationMenuTriggerStyle()}
                active
              >
                {t('components.navigationMenu.ordersLink')}
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<a href='#' />}
                className={navigationMenuTriggerStyle()}
              >
                {t('components.navigationMenu.customersLink')}
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<a href='#' />}
                className={navigationMenuTriggerStyle()}
              >
                {t('components.navigationMenu.reportsLink')}
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </ExampleSection>
    </ExamplePage>
  );
}

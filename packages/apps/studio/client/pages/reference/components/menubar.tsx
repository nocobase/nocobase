import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useState } from 'react';

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar';

import { ExamplePage, ExampleSection } from '../shared';

type Density = 'compact' | 'comfortable';

const densityLabelKey: Record<Density, string> = {
  compact: 'components.menubar.densityCompact',
  comfortable: 'components.menubar.densityComfortable',
};

export default function MenubarExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [showTax, setShowTax] = useState(true);
  const [showDiscount, setShowDiscount] = useState(false);
  const [density, setDensity] = useState<Density>('comfortable');

  return (
    <ExamplePage
      title={t('components.menubar.title')}
      description={t('components.menubar.description')}
      docs='https://ui.shadcn.com/docs/components/menubar'
    >
      <ExampleSection
        title={t('components.menubar.basic')}
        description={t('components.menubar.basicDescription')}
      >
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>{t('components.menubar.invoice')}</MenubarTrigger>
            <MenubarContent>
              <MenubarGroup>
                <MenubarItem>
                  {t('components.menubar.newInvoice')}
                  <MenubarShortcut>⌘N</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>{t('components.menubar.duplicate')}</MenubarItem>
                <MenubarItem disabled>
                  {t('components.menubar.archive')}
                </MenubarItem>
              </MenubarGroup>
              <MenubarSeparator />
              <MenubarGroup>
                <MenubarItem>
                  {t('components.menubar.print')}
                  <MenubarShortcut>⌘P</MenubarShortcut>
                </MenubarItem>
              </MenubarGroup>
              <MenubarSeparator />
              <MenubarGroup>
                <MenubarItem variant='destructive'>
                  {t('components.menubar.deleteInvoice')}
                </MenubarItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>{t('reference.edit')}</MenubarTrigger>
            <MenubarContent>
              <MenubarGroup>
                <MenubarItem>
                  {t('components.menubar.undo')}
                  <MenubarShortcut>⌘Z</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  {t('components.menubar.redo')}
                  <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                </MenubarItem>
              </MenubarGroup>
              <MenubarSeparator />
              <MenubarGroup>
                <MenubarItem>{t('components.menubar.cut')}</MenubarItem>
                <MenubarItem>{t('reference.copy')}</MenubarItem>
                <MenubarItem>{t('components.menubar.paste')}</MenubarItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>{t('components.menubar.help')}</MenubarTrigger>
            <MenubarContent>
              <MenubarGroup>
                <MenubarItem>
                  {t('components.menubar.documentation')}
                </MenubarItem>
                <MenubarItem>
                  {t('components.menubar.keyboardShortcuts')}
                  <MenubarShortcut>?</MenubarShortcut>
                </MenubarItem>
                <MenubarItem>
                  {t('components.menubar.contactSupport')}
                </MenubarItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </ExampleSection>

      <ExampleSection
        title={t('components.menubar.submenu')}
        description={t('components.menubar.submenuDescription')}
      >
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>{t('components.menubar.invoice')}</MenubarTrigger>
            <MenubarContent>
              <MenubarGroup>
                <MenubarItem>
                  {t('components.menubar.sendToCustomer')}
                </MenubarItem>
                <MenubarSub>
                  <MenubarSubTrigger>{t('reference.export')}</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarGroup>
                      <MenubarItem>PDF</MenubarItem>
                      <MenubarItem>CSV</MenubarItem>
                      <MenubarItem>Excel</MenubarItem>
                    </MenubarGroup>
                  </MenubarSubContent>
                </MenubarSub>
                <MenubarSub>
                  <MenubarSubTrigger>{t('reference.share')}</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarGroup>
                      <MenubarItem>
                        {t('components.menubar.copyLink')}
                      </MenubarItem>
                      <MenubarItem>
                        {t('components.menubar.emailLink')}
                      </MenubarItem>
                    </MenubarGroup>
                  </MenubarSubContent>
                </MenubarSub>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </ExampleSection>

      <ExampleSection
        title={t('components.menubar.checkbox')}
        description={t('components.menubar.checkboxDescription')}
        contentClassName='flex-col items-start gap-3'
      >
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>{t('components.menubar.view')}</MenubarTrigger>
            <MenubarContent className='w-56'>
              <MenubarGroup>
                <MenubarLabel inset>
                  {t('components.menubar.columns')}
                </MenubarLabel>
                <MenubarCheckboxItem checked disabled>
                  {t('reference.amount')}
                </MenubarCheckboxItem>
                <MenubarCheckboxItem
                  checked={showTax}
                  onCheckedChange={(checked: boolean) => setShowTax(checked)}
                >
                  {t('components.menubar.tax')}
                </MenubarCheckboxItem>
                <MenubarCheckboxItem
                  checked={showDiscount}
                  onCheckedChange={(checked: boolean) =>
                    setShowDiscount(checked)
                  }
                >
                  {t('components.menubar.discount')}
                </MenubarCheckboxItem>
              </MenubarGroup>
              <MenubarSeparator />
              <MenubarGroup>
                <MenubarItem inset>
                  {t('reference.refresh')}
                  <MenubarShortcut>⌘R</MenubarShortcut>
                </MenubarItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        <p className='text-sm text-muted-foreground'>
          {t('components.menubar.visibleColumns', {
            columns: [
              t('reference.amount'),
              showTax ? t('components.menubar.tax') : null,
              showDiscount ? t('components.menubar.discount') : null,
            ]
              .filter((column) => column !== null)
              .join(', '),
          })}
        </p>
      </ExampleSection>

      <ExampleSection
        title={t('components.menubar.radio')}
        description={t('components.menubar.radioDescription')}
        contentClassName='flex-col items-start gap-3'
      >
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>{t('components.menubar.view')}</MenubarTrigger>
            <MenubarContent className='w-48'>
              <MenubarGroup>
                <MenubarLabel inset>
                  {t('components.menubar.density')}
                </MenubarLabel>
                <MenubarRadioGroup
                  value={density}
                  onValueChange={(value: Density) => setDensity(value)}
                >
                  <MenubarRadioItem value='compact'>
                    {t(densityLabelKey.compact)}
                  </MenubarRadioItem>
                  <MenubarRadioItem value='comfortable'>
                    {t(densityLabelKey.comfortable)}
                  </MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        <p className='text-sm text-muted-foreground'>
          {t('components.menubar.currentDensity', {
            density: t(densityLabelKey[density]),
          })}
        </p>
      </ExampleSection>
    </ExamplePage>
  );
}

import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { ExamplePage, ExampleSection } from '../shared';

type Permission = 'read' | 'create' | 'update' | 'delete';

const permissions: readonly Permission[] = [
  'read',
  'create',
  'update',
  'delete',
];

const permissionLabelKey: Record<Permission, string> = {
  read: 'components.checkbox.permissionRead',
  create: 'reference.create',
  update: 'reference.edit',
  delete: 'reference.delete',
};

const addOns = [
  {
    id: 'support',
    titleKey: 'components.checkbox.addOnSupport',
    descriptionKey: 'components.checkbox.addOnSupportDescription',
    price: '+$20/mo',
  },
  {
    id: 'storage',
    titleKey: 'components.checkbox.addOnStorage',
    descriptionKey: 'components.checkbox.addOnStorageDescription',
    price: '+$8/mo',
  },
  {
    id: 'sso',
    titleKey: 'components.checkbox.addOnSso',
    descriptionKey: 'components.checkbox.addOnSsoDescription',
    price: '+$40/mo',
  },
];

const teamMembers = [
  {
    id: 'olivia',
    name: 'Olivia Martin',
    email: 'olivia.martin@acme.com',
    roleKey: 'reference.owner',
  },
  {
    id: 'jackson',
    name: 'Jackson Lee',
    email: 'jackson.lee@acme.com',
    roleKey: 'components.checkbox.roleEditor',
  },
  {
    id: 'isabella',
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@acme.com',
    roleKey: 'components.checkbox.roleEditor',
  },
  {
    id: 'william',
    name: 'William Kim',
    email: 'william.kim@acme.com',
    roleKey: 'components.checkbox.roleViewer',
  },
];

export default function CheckboxExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [sendCopy, setSendCopy] = useState(true);
  const [granted, setGranted] = useState<Record<Permission, boolean>>({
    read: true,
    create: true,
    update: false,
    delete: false,
  });
  const [selected, setSelected] = useState<string[]>(['jackson']);

  const grantedCount = permissions.filter(
    (permission) => granted[permission],
  ).length;
  const allGranted = grantedCount === permissions.length;
  const someGranted = grantedCount > 0 && !allGranted;

  const allSelected = selected.length === teamMembers.length;
  const someSelected = selected.length > 0 && !allSelected;

  return (
    <ExamplePage
      title={t('components.checkbox.title')}
      description={t('components.checkbox.description')}
      docs='https://ui.shadcn.com/docs/components/checkbox'
    >
      <ExampleSection
        title={t('components.checkbox.basic')}
        description={t('components.checkbox.basicDescription')}
        contentClassName='block'
      >
        <FieldGroup className='max-w-sm'>
          <Field orientation='horizontal'>
            <Checkbox id='checkbox-terms' name='terms' />
            <FieldLabel htmlFor='checkbox-terms'>
              {t('components.checkbox.acceptTerms')}
            </FieldLabel>
          </Field>
          <Field orientation='horizontal'>
            <Checkbox
              id='checkbox-newsletter'
              name='newsletter'
              defaultChecked
            />
            <FieldContent>
              <FieldLabel htmlFor='checkbox-newsletter'>
                {t('components.checkbox.newsletter')}
              </FieldLabel>
              <FieldDescription>
                {t('components.checkbox.newsletterDescription')}
              </FieldDescription>
            </FieldContent>
          </Field>
          <Field orientation='horizontal' data-disabled>
            <Checkbox id='checkbox-disabled' name='disabled' disabled />
            <FieldLabel htmlFor='checkbox-disabled'>
              {t('components.checkbox.disabledOption')}
            </FieldLabel>
          </Field>
          <Field orientation='horizontal' data-invalid>
            <Checkbox id='checkbox-invalid' name='invalid' aria-invalid />
            <FieldLabel htmlFor='checkbox-invalid'>
              {t('components.checkbox.invalidOption')}
            </FieldLabel>
          </Field>
        </FieldGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.checkbox.controlled')}
        description={t('components.checkbox.controlledDescription')}
        contentClassName='block'
      >
        <Field orientation='horizontal' className='max-w-sm'>
          <Checkbox
            id='checkbox-send-copy'
            name='sendCopy'
            checked={sendCopy}
            onCheckedChange={setSendCopy}
          />
          <FieldContent>
            <FieldLabel htmlFor='checkbox-send-copy'>
              {t('components.checkbox.sendCopy')}
            </FieldLabel>
            <FieldDescription>
              {sendCopy
                ? t('components.checkbox.sendCopyOn', {
                    email: 'billing@acme.com',
                  })
                : t('components.checkbox.sendCopyOff')}
            </FieldDescription>
          </FieldContent>
        </Field>
      </ExampleSection>

      <ExampleSection
        title={t('components.checkbox.group')}
        description={t('components.checkbox.groupDescription')}
        contentClassName='block'
      >
        <FieldSet className='max-w-sm'>
          <FieldLegend variant='label'>
            {t('components.checkbox.notifyMe')}
          </FieldLegend>
          <FieldDescription>
            {t('components.checkbox.notifyMeDescription')}
          </FieldDescription>
          <FieldGroup className='gap-3'>
            <Field orientation='horizontal'>
              <Checkbox id='notify-orders' name='notifyOrders' defaultChecked />
              <FieldLabel htmlFor='notify-orders' className='font-normal'>
                {t('components.checkbox.notifyOrders')}
              </FieldLabel>
            </Field>
            <Field orientation='horizontal'>
              <Checkbox
                id='notify-payments'
                name='notifyPayments'
                defaultChecked
              />
              <FieldLabel htmlFor='notify-payments' className='font-normal'>
                {t('components.checkbox.notifyPayments')}
              </FieldLabel>
            </Field>
            <Field orientation='horizontal'>
              <Checkbox id='notify-mentions' name='notifyMentions' />
              <FieldLabel htmlFor='notify-mentions' className='font-normal'>
                {t('components.checkbox.notifyMentions')}
              </FieldLabel>
            </Field>
            <Field orientation='horizontal'>
              <Checkbox id='notify-digest' name='notifyDigest' />
              <FieldLabel htmlFor='notify-digest' className='font-normal'>
                {t('components.checkbox.notifyDigest')}
              </FieldLabel>
            </Field>
          </FieldGroup>
        </FieldSet>
      </ExampleSection>

      <ExampleSection
        title={t('components.checkbox.indeterminate')}
        description={t('components.checkbox.indeterminateDescription')}
        contentClassName='block'
      >
        <FieldGroup className='max-w-sm gap-3'>
          <Field orientation='horizontal'>
            <Checkbox
              id='permission-all'
              name='permissionAll'
              checked={allGranted}
              indeterminate={someGranted}
              onCheckedChange={(checked) =>
                setGranted({
                  read: checked,
                  create: checked,
                  update: checked,
                  delete: checked,
                })
              }
            />
            <FieldLabel htmlFor='permission-all'>
              {t('components.checkbox.allPermissions', {
                resource: 'Orders',
              })}
            </FieldLabel>
          </Field>
          <FieldGroup className='gap-3 pl-6'>
            {permissions.map((permission) => (
              <Field key={permission} orientation='horizontal'>
                <Checkbox
                  id={`permission-${permission}`}
                  name={`permission-${permission}`}
                  checked={granted[permission]}
                  onCheckedChange={(checked) =>
                    setGranted((previous) => ({
                      ...previous,
                      [permission]: checked,
                    }))
                  }
                />
                <FieldLabel
                  htmlFor={`permission-${permission}`}
                  className='font-normal'
                >
                  {t(permissionLabelKey[permission])}
                </FieldLabel>
              </Field>
            ))}
          </FieldGroup>
        </FieldGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.checkbox.cards')}
        description={t('components.checkbox.cardsDescription')}
        contentClassName='block'
      >
        <FieldGroup className='max-w-sm gap-3'>
          {addOns.map((addOn) => (
            <FieldLabel key={addOn.id}>
              <Field orientation='horizontal'>
                <Checkbox
                  id={`add-on-${addOn.id}`}
                  name={`add-on-${addOn.id}`}
                  defaultChecked={addOn.id === 'support'}
                />
                <FieldContent>
                  <FieldTitle>
                    {t(addOn.titleKey)}
                    <Badge variant='outline' className='ml-auto tabular-nums'>
                      {addOn.price}
                    </Badge>
                  </FieldTitle>
                  <FieldDescription>{t(addOn.descriptionKey)}</FieldDescription>
                </FieldContent>
              </Field>
            </FieldLabel>
          ))}
        </FieldGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.checkbox.table')}
        description={t('components.checkbox.tableDescription')}
        contentClassName='block space-y-3'
      >
        <p className='text-sm text-muted-foreground'>
          {t('components.checkbox.selectedCount', {
            selected: selected.length,
            total: teamMembers.length,
          })}
        </p>
        <div className='w-full max-w-lg overflow-hidden rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-10'>
                  <Checkbox
                    aria-label={t('components.checkbox.selectAll')}
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={(checked) =>
                      setSelected(
                        checked ? teamMembers.map((member) => member.id) : [],
                      )
                    }
                  />
                </TableHead>
                <TableHead>{t('reference.name')}</TableHead>
                <TableHead>{t('reference.email')}</TableHead>
                <TableHead>{t('reference.role')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => {
                const isSelected = selected.includes(member.id);
                return (
                  <TableRow
                    key={member.id}
                    data-state={isSelected ? 'selected' : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        aria-label={t('components.checkbox.selectRow', {
                          name: member.name,
                        })}
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          setSelected((previous) =>
                            checked
                              ? [...previous, member.id]
                              : previous.filter((id) => id !== member.id),
                          )
                        }
                      />
                    </TableCell>
                    <TableCell className='font-medium'>{member.name}</TableCell>
                    <TableCell className='text-muted-foreground'>
                      {member.email}
                    </TableCell>
                    <TableCell>{t(member.roleKey)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ExampleSection>
    </ExamplePage>
  );
}

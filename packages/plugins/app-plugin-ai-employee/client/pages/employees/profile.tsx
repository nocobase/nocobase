import { useId, type ReactElement } from 'react';
import { Field, FieldGroup, FieldLabel } from '../../components/ui/field.js';
import { Input } from '../../components/ui/input.js';
import { Textarea } from '../../components/ui/textarea.js';
import { useT } from '../../locales/index.js';
import { useEmployeeEditor } from './employee-context.js';

function ReadonlyField({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string | undefined;
  multiline?: boolean;
}): ReactElement {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {multiline ? (
        <Textarea
          id={id}
          className='min-h-24 text-muted-foreground'
          value={value ?? ''}
          disabled
          readOnly
        />
      ) : (
        <Input
          id={id}
          className='text-muted-foreground'
          value={value ?? ''}
          disabled
          readOnly
        />
      )}
    </Field>
  );
}

export default function EmployeeProfilePage(): ReactElement {
  const { selected } = useEmployeeEditor();
  const t = useT();
  return (
    <FieldGroup className='gap-4'>
      <ReadonlyField label={t('Username')} value={selected.username} />
      <ReadonlyField label={t('Nickname')} value={selected.nickname} />
      <ReadonlyField label={t('Position')} value={selected.position} />
      <ReadonlyField label={t('Bio')} value={selected.bio} multiline />
      <ReadonlyField
        label={t('Greeting')}
        value={selected.greeting}
        multiline
      />
    </FieldGroup>
  );
}

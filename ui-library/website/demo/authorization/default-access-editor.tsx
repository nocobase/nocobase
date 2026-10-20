import { useState, type ReactElement } from 'react';
import { DefaultAccessEditor } from '#components/default-access-editor';

export function DefaultAccessEditorDemo(): ReactElement {
  const [key, setKey] = useState('projects-baseline');
  const [resource, setResource] = useState('projects');
  const [view, setView] = useState('own');
  const [edit, setEdit] = useState('');
  const options = [
    { value: '', label: 'No default scope' },
    { value: 'own', label: 'Records I own' },
    { value: 'all', label: 'All records' },
  ];
  return (
    <div className='flex min-h-svh flex-col gap-6 bg-background p-6 text-foreground'>
      <p className='text-sm text-muted-foreground'>
        Applies only to users who already have the operation permission. Default
        data scopes combine with role-granted scopes, allowing records from
        either scope. Restriction rules still constrain the final access.
      </p>
      <DefaultAccessEditor
        ruleKey={key}
        resource={resource}
        resources={[{ value: 'projects', label: 'Projects' }]}
        scopes={[
          {
            id: 'view',
            action: 'View',
            scope: 'Projects',
            value: view,
            options,
          },
          {
            id: 'edit',
            action: 'Edit',
            scope: 'Projects',
            value: edit,
            options,
          },
        ]}
        labels={{
          key: 'Key',
          resource: 'Business object',
          chooseResource: 'Choose a business object',
          action: 'Operation',
          scope: 'Data scope',
          noScopes: 'Choose a business object',
        }}
        onKeyChange={setKey}
        onResourceChange={setResource}
        onScopeChange={(id, value) => {
          if (id === 'view') setView(value);
          else setEdit(value);
        }}
      />
    </div>
  );
}

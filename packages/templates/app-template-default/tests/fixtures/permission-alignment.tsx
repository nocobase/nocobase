import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PermissionEditor } from '../../client/components/permission-editor';
import { Button } from '../../client/components/ui/button';
import { AppThemeProvider } from '../../client/theme';
import '../../client/styles.css';

// A browser fixture for real editor geometry; no server permissions are changed.
const fields = [
  'Alerts',
  'Monitoring rules',
  'Business processes',
  'Rule calculations with a deliberately long English label',
  'Process nodes',
];
const levels = [
  { value: '', label: 'No additional record access' },
  { value: 'all', label: 'All records' },
  { value: 'custom', label: 'Custom conditions' },
];

export default function Fixture() {
  const params = new URLSearchParams(location.search);
  const readOnly = params.has('readonly');
  const chinese = params.has('chinese');
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [condition, setCondition] = useState(false);
  return (
    <AppThemeProvider>
      <main className='mx-auto grid max-w-6xl gap-4 p-4'>
        <h1 className='text-xl'>
          Roles and permissions · Alignment verification
        </h1>
        <PermissionEditor
          readOnly={readOnly}
          sections={[
            {
              id: 'business',
              title: 'Business operations',
              groups: [
                ...['Alerts', 'Monitoring rules', 'Responsible units'].map(
                  (group) => ({
                    id: group,
                    title: group,
                    rows: (group === 'Monitoring rules'
                      ? ['View', 'Configure', 'Run']
                      : ['Manage']
                    ).map((action) => {
                      const id = `${action} ${group.toLowerCase()}`;
                      return {
                        id,
                        label: id,
                        levels: [],
                        hint: 'Existing permission descriptions remain visible.',
                        enabled: enabled[id] ?? true,
                        scopes: (group === 'Responsible units'
                          ? ['Responsible units']
                          : group === 'Alerts'
                            ? fields.slice(0, 2)
                            : fields
                        ).map((label, index) => {
                          const scopeId = `${id}:${index}`;
                          return {
                            id: scopeId,
                            label:
                              chinese && index === 3
                                ? '需要完整显示名称的跨部门监控规则计算数据范围长标签'
                                : label,
                            levels,
                            level:
                              values[scopeId] ?? (index === 0 ? 'custom' : ''),
                            hint:
                              index % 2 === 0
                                ? 'Other roles and default rules still apply.'
                                : undefined,
                            configuration:
                              index === 0 ? (
                                <Button
                                  size='sm'
                                  variant='outline'
                                  disabled={readOnly}
                                  onClick={() =>
                                    setCondition((value) => !value)
                                  }
                                >
                                  Conditions
                                </Button>
                              ) : undefined,
                          };
                        }),
                      };
                    }),
                  }),
                ),
                {
                  id: 'without-ranges',
                  title: 'Other operations',
                  rows: [
                    { id: 'create', label: 'Create alert', enabled: true },
                    { id: 'delete', label: 'Delete alert', enabled: false },
                  ],
                },
              ],
            },
          ]}
          onEnabledChange={(id, value) =>
            setEnabled((current) => ({ ...current, [id]: value }))
          }
          onLevelChange={(id, value) =>
            setValues((current) => ({ ...current, [id]: value }))
          }
        />
        <p role='status'>
          {condition
            ? 'Condition editor requested'
            : 'No condition editor requested'}
        </p>
      </main>
    </AppThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(<Fixture />);

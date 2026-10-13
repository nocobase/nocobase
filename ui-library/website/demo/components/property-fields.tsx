import { useState, type ReactElement } from 'react';

import {
  AgentIcon,
  PeopleAvatars,
  PersonValue,
  PropertyCard,
  PropertyDate,
  PropertyLink,
  PropertyLongText,
  PropertyMultiSelect,
  PropertyNumber,
  PropertyRow,
  PropertySelect,
  PropertyText,
  type PropertyCardVariant,
} from '#components/property-fields';

const PEOPLE = [
  { id: 'u1', name: 'Ada Lovelace', detail: 'Lead' },
  { id: 'u2', name: 'Grace Hopper' },
  { id: 'u3', name: 'Alan Turing' },
  { id: 'u4', name: 'Edsger Dijkstra' },
  { id: 'u5', name: 'Barbara Liskov' },
  { id: 'u6', name: 'Ken Thompson' },
];

const INTRODUCTION = `Founded in 1998 as a family sauce workshop, Northwind grew into one of the region's larger condiment groups. Its brands cover soy sauce, oyster sauce and compound seasonings, sold through supermarkets, restaurant supply and an expanding online channel.`;

interface DemoValues {
  readonly status: string | null;
  readonly owner: string | null;
  readonly tags: readonly string[];
  readonly due: string | null;
  readonly stage: number | null;
  readonly email: string | null;
  readonly website: string | null;
  readonly introduction: string | null;
}

/** The same card in both variants, over shared values: a change in one shows in the other. */
export function PropertyFieldsDemo(): ReactElement {
  const [values, setValues] = useState<DemoValues>({
    status: 'active',
    owner: 'u1',
    tags: ['t1'],
    due: '2026-10-31',
    stage: 2,
    email: 'ada@northwind.example',
    website: 'https://www.northwind.example/about',
    introduction: INTRODUCTION,
  });
  const [tagOptions, setTagOptions] = useState([
    { value: 't1', label: 'Frontend' },
    { value: 't2', label: 'Backend' },
  ]);
  const [busy, setBusy] = useState(false);
  const change = (next: Partial<DemoValues>): void => {
    setBusy(true);
    setValues((current) => ({ ...current, ...next }));
    setTimeout(() => setBusy(false), 400);
  };
  const card = (variant: PropertyCardVariant): ReactElement => {
    const id = (name: string): string => `demo-${variant}-${name}`;
    return (
      <div className='w-80 space-y-2'>
        <p className='font-mono text-xs text-muted-foreground'>
          variant=&apos;{variant}&apos;
        </p>
        <PropertyCard title='Properties' busy={busy} variant={variant}>
          <PropertyRow label='Status' htmlFor={id('status')}>
            <PropertySelect
              id={id('status')}
              aria-label='Status'
              options={[
                { value: 'planned', label: 'Planned' },
                { value: 'active', label: 'Active' },
                { value: 'done', label: 'Done', note: 'Locked' },
              ]}
              value={values.status}
              onChange={(status) => change({ status })}
            />
          </PropertyRow>
          <PropertyRow label='Owner' htmlFor={id('owner')}>
            <PropertySelect
              id={id('owner')}
              aria-label='Owner'
              noneLabel='Nobody'
              options={[
                ...PEOPLE.map((person) => ({
                  value: person.id,
                  label: person.name,
                })),
                { value: 'agent', label: 'Reviewer', icon: <AgentIcon /> },
              ]}
              value={values.owner}
              renderValue={(value) => (
                <PersonValue
                  name={
                    PEOPLE.find((person) => person.id === value)?.name ??
                    'Reviewer'
                  }
                  agent={value === 'agent'}
                />
              )}
              onChange={(owner) => change({ owner })}
            />
          </PropertyRow>
          <PropertyRow label='Tags'>
            <PropertyMultiSelect
              id={id('tags')}
              aria-label='Tags'
              options={tagOptions}
              value={values.tags}
              placeholder='Add a tag'
              onCreate={async (name) => {
                const value = `t${tagOptions.length + 1}`;
                setTagOptions((current) => [
                  ...current,
                  { value, label: name },
                ]);
                return value;
              }}
              onChange={(tags) => change({ tags })}
            />
          </PropertyRow>
          <PropertyRow label='Due' htmlFor={id('due')}>
            <PropertyDate
              id={id('due')}
              aria-label='Due'
              value={values.due}
              clearLabel='Clear the due date'
              onChange={(due) => change({ due })}
            />
          </PropertyRow>
          <PropertyRow label='Stage' htmlFor={id('stage')}>
            <PropertyNumber
              id={id('stage')}
              aria-label='Stage'
              value={values.stage}
              max={99}
              placeholder='—'
              invalidText='A whole number up to 99'
              onChange={(stage) => change({ stage })}
            />
          </PropertyRow>
          <PropertyRow label='Email' htmlFor={id('email')} copyable>
            <PropertyText
              id={id('email')}
              aria-label='Email'
              value={values.email}
              placeholder='Add an email'
              onChange={(email) => change({ email })}
            />
          </PropertyRow>
          <PropertyRow label='Website' htmlFor={id('website')} copyable>
            <PropertyLink
              id={id('website')}
              label='Website'
              value={values.website}
              placeholder='Add a website'
              onChange={(website) => change({ website })}
            />
          </PropertyRow>
          <PropertyRow label='Introduction' htmlFor={id('introduction')}>
            <PropertyLongText
              id={id('introduction')}
              label='Introduction'
              value={values.introduction}
              placeholder='Add an introduction'
              onChange={(introduction) => change({ introduction })}
            />
          </PropertyRow>
          <PropertyRow label='Members'>
            <PeopleAvatars people={PEOPLE} label='6 members' max={4} />
          </PropertyRow>
        </PropertyCard>
      </div>
    );
  };
  return (
    <div className='flex flex-wrap items-start gap-6 p-6'>
      {card('form')}
      {card('inline')}
    </div>
  );
}

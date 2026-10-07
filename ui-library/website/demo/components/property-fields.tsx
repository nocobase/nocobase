import { useState, type ReactElement } from 'react';

import {
  AgentIcon,
  PeopleAvatars,
  PersonValue,
  PropertyCard,
  PropertyDate,
  PropertyMultiSelect,
  PropertyNumber,
  PropertyRow,
  PropertySelect,
} from '@/components/property-fields';

const PEOPLE = [
  { id: 'u1', name: 'Ada Lovelace', detail: 'Lead' },
  { id: 'u2', name: 'Grace Hopper' },
  { id: 'u3', name: 'Alan Turing' },
  { id: 'u4', name: 'Edsger Dijkstra' },
  { id: 'u5', name: 'Barbara Liskov' },
  { id: 'u6', name: 'Ken Thompson' },
];

export function PropertyFieldsDemo(): ReactElement {
  const [status, setStatus] = useState<string | null>('active');
  const [owner, setOwner] = useState<string | null>('u1');
  const [tags, setTags] = useState<readonly string[]>(['t1']);
  const [tagOptions, setTagOptions] = useState([
    { value: 't1', label: 'Frontend' },
    { value: 't2', label: 'Backend' },
  ]);
  const [due, setDue] = useState<string | null>('2026-10-31');
  const [stage, setStage] = useState<number | null>(2);
  const [busy, setBusy] = useState(false);
  const change = (apply: () => void): void => {
    setBusy(true);
    apply();
    setTimeout(() => setBusy(false), 400);
  };
  return (
    <div className='max-w-sm space-y-3 p-6'>
      <PropertyCard title='Properties' busy={busy}>
        <PropertyRow label='Status' htmlFor='demo-status'>
          <PropertySelect
            id='demo-status'
            options={[
              { value: 'planned', label: 'Planned' },
              { value: 'active', label: 'Active' },
              { value: 'done', label: 'Done', note: 'Locked' },
            ]}
            value={status}
            onChange={(value) => change(() => setStatus(value))}
          />
        </PropertyRow>
        <PropertyRow label='Owner' htmlFor='demo-owner'>
          <PropertySelect
            id='demo-owner'
            noneLabel='Nobody'
            options={[
              ...PEOPLE.map((person) => ({
                value: person.id,
                label: person.name,
              })),
              { value: 'agent', label: 'Reviewer', icon: <AgentIcon /> },
            ]}
            value={owner}
            renderValue={(value) => (
              <PersonValue
                name={
                  PEOPLE.find((person) => person.id === value)?.name ??
                  'Reviewer'
                }
                agent={value === 'agent'}
              />
            )}
            onChange={(value) => change(() => setOwner(value))}
          />
        </PropertyRow>
        <PropertyRow label='Tags'>
          <PropertyMultiSelect
            id='demo-tags'
            aria-label='Tags'
            options={tagOptions}
            value={tags}
            placeholder='Add a tag'
            onCreate={async (name) => {
              const value = `t${tagOptions.length + 1}`;
              setTagOptions((current) => [...current, { value, label: name }]);
              return value;
            }}
            onChange={setTags}
          />
        </PropertyRow>
        <PropertyRow label='Due' htmlFor='demo-due'>
          <PropertyDate
            id='demo-due'
            value={due}
            clearLabel='Clear the due date'
            onChange={setDue}
          />
        </PropertyRow>
        <PropertyRow label='Stage' htmlFor='demo-stage'>
          <PropertyNumber
            id='demo-stage'
            value={stage}
            max={99}
            placeholder='—'
            invalidText='A whole number up to 99'
            onChange={setStage}
          />
        </PropertyRow>
        <PropertyRow label='Members'>
          <PeopleAvatars people={PEOPLE} label='6 members' max={4} />
        </PropertyRow>
      </PropertyCard>
    </div>
  );
}

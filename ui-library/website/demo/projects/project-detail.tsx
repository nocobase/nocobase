import { useState, type ReactElement } from 'react';
import { MemoryRouter } from 'react-router';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownView } from '@/components/markdown-view';
import {
  PersonValue,
  PropertyCard,
  PropertyDate,
  PropertyRow,
  PropertySelect,
} from '@/components/property-fields';
import {
  ProjectDeleteMenu,
  ProjectDescription,
  ProjectHeader,
  ProjectMembersRow,
  ProjectMetrics,
  ProjectOverviewLayout,
  ProjectStatusDistribution,
} from '@/extensions/nocobase-project-detail/project-detail';
import {
  PreviewList,
  UnreleasedChanges,
} from '@/extensions/nocobase-project-detail/project-releases';
import {
  ProjectMembersEditor,
  ProjectResourceList,
  ResourceDialog,
  type ResourceItem,
} from '@/extensions/nocobase-project-detail/project-settings';

const PEOPLE = [
  { id: 'u1', name: 'Ada Lovelace' },
  { id: 'u2', name: 'Grace Hopper' },
  { id: 'u3', name: 'Alan Turing' },
  { id: 'u4', name: 'Barbara Liskov' },
];
const STATUSES = [
  { value: 'planned', label: 'Planned' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];
const later = () => new Promise<void>((resolve) => setTimeout(resolve, 300));

export function ProjectDetailDemo(): ReactElement {
  const [status, setStatus] = useState<string | null>('in_progress');
  const [lead, setLead] = useState<string | null>('u1');
  const [due, setDue] = useState<string | null>('2026-12-01');
  const [description, setDescription] = useState(
    'Let people **sign in with an email link** instead of a password.',
  );
  const [visibility, setVisibility] = useState<'everyone' | 'members'>(
    'everyone',
  );
  const [members, setMembers] = useState(['u1', 'u2', 'u3']);
  const [resources, setResources] = useState<ResourceItem[]>([
    {
      id: 'r1',
      type: 'gitRepo',
      name: 'nocobase/nocobase',
      detail: 'main',
    },
    {
      id: 'r2',
      type: 'directory',
      name: 'Design files',
      detail: '/Users/ada/design · MacBook',
    },
  ]);
  const [editing, setEditing] = useState<'new' | null>(null);
  const leadName = PEOPLE.find((person) => person.id === lead)?.name;

  return (
    <div className='space-y-6 p-6 md:p-8'>
      <ProjectHeader
        name='Passwordless sign-in'
        status={{ name: 'In progress', color: 'blue' }}
        membersOnly={visibility === 'members'}
        progress={{ percent: 38, label: '3 of 8 issues done' }}
        lead={leadName ? { name: leadName } : null}
        dates='Oct 1, 2026 → Dec 1, 2026'
        workflow='Software delivery'
        trail={<span className='text-sm text-muted-foreground'>Projects</span>}
        actions={
          <>
            <Button variant='outline'>New issue</Button>
            <ProjectDeleteMenu name='Passwordless sign-in' onDelete={later} />
          </>
        }
      />
      <Tabs defaultValue='overview' className='gap-6'>
        <TabsList variant='line' aria-label='Project'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='members'>Members</TabsTrigger>
          <TabsTrigger value='releases'>Releases</TabsTrigger>
          <TabsTrigger value='settings'>Settings</TabsTrigger>
        </TabsList>
        <TabsContent value='overview'>
          <ProjectOverviewLayout
            asideLabel='Project details'
            main={
              <>
                <ProjectMetrics
                  metrics={[
                    { key: 'total', label: 'Issues', value: 8 },
                    { key: 'started', label: 'In progress', value: 3 },
                    { key: 'review', label: 'In review', value: 1 },
                    { key: 'done', label: 'Done', value: 3 },
                  ]}
                />
                <ProjectStatusDistribution
                  rows={[
                    { key: 'todo', name: 'Todo', color: 'gray', count: 1 },
                    {
                      key: 'progress',
                      name: 'In progress',
                      color: 'blue',
                      count: 3,
                    },
                    {
                      key: 'review',
                      name: 'In review',
                      color: 'purple',
                      count: 1,
                    },
                    { key: 'done', name: 'Done', color: 'green', count: 3 },
                  ]}
                />
                <ProjectDescription
                  description={description}
                  renderMarkdown={(markdown) => (
                    <MarkdownView content={markdown} />
                  )}
                  onSave={async (markdown) => {
                    await later();
                    setDescription(markdown);
                  }}
                />
              </>
            }
            aside={
              <>
                <PropertyCard title='Properties'>
                  <PropertyRow label='Status' htmlFor='demo-project-status'>
                    <PropertySelect
                      id='demo-project-status'
                      options={STATUSES}
                      value={status}
                      onChange={setStatus}
                    />
                  </PropertyRow>
                  <PropertyRow label='Lead' htmlFor='demo-project-lead'>
                    <PropertySelect
                      id='demo-project-lead'
                      noneLabel='No lead'
                      options={PEOPLE.map((person) => ({
                        value: person.id,
                        label: person.name,
                      }))}
                      value={lead}
                      renderValue={(value) => (
                        <PersonValue
                          name={
                            PEOPLE.find((person) => person.id === value)
                              ?.name ?? value
                          }
                        />
                      )}
                      onChange={setLead}
                    />
                  </PropertyRow>
                  <PropertyRow label='Due' htmlFor='demo-project-due'>
                    <PropertyDate
                      id='demo-project-due'
                      value={due}
                      clearLabel='Clear the due date'
                      onChange={setDue}
                    />
                  </PropertyRow>
                </PropertyCard>
                <ProjectMembersRow
                  members={PEOPLE.filter((person) =>
                    members.includes(person.id),
                  )}
                  manageHref='#settings'
                />
              </>
            }
          />
        </TabsContent>
        <TabsContent value='members' className='max-w-3xl'>
          <ProjectMembersEditor
            visibility={visibility}
            members={PEOPLE.filter((person) => members.includes(person.id)).map(
              (person) => ({ ...person, lead: person.id === lead }),
            )}
            candidates={PEOPLE.filter(
              (person) => !members.includes(person.id),
            ).map((person) => ({ value: person.id, label: person.name }))}
            onVisibilityChange={setVisibility}
            onAdd={async (userId) => {
              await later();
              setMembers((current) => [...current, userId]);
            }}
            onSetLead={async (userId) => {
              await later();
              setLead(userId);
            }}
            onRemove={async (userId) => {
              await later();
              setMembers((current) => current.filter((id) => id !== userId));
            }}
          />
        </TabsContent>
        <TabsContent value='releases' className='space-y-3'>
          <UnreleasedChanges
            list={{
              state: 'ready',
              items: [
                {
                  id: 'i1',
                  identifier: 'PM-12',
                  title: 'Send the sign-in link by email',
                  href: '#PM-12',
                  staging: true,
                },
                {
                  id: 'i2',
                  identifier: 'PM-14',
                  title: 'Expire links after 15 minutes',
                  href: '#PM-14',
                  staging: false,
                },
              ],
            }}
          />
          <PreviewList
            list={{
              state: 'ready',
              items: [
                {
                  id: 'p1',
                  identifier: 'PM-15',
                  title: 'Remember the device for 30 days',
                  href: '#PM-15',
                  status: { name: 'Ready', color: 'green' },
                  runtime: 'Stopped (starts on visit)',
                  branch: 'agent/pm-15',
                  url: 'https://example.com',
                },
                {
                  id: 'p2',
                  identifier: 'PM-16',
                  title: 'Rate-limit link requests',
                  href: '#PM-16',
                  status: { name: 'Building', color: 'blue' },
                  branch: 'agent/pm-16',
                },
              ],
            }}
          />
        </TabsContent>
        <TabsContent value='settings' className='max-w-3xl space-y-3'>
          <MemoryRouter>
            <ProjectResourceList
              resources={resources}
              hrefOf={(id) => `/settings/working-directories/${id}`}
              onAdd={() => setEditing('new')}
              onMove={(from, to) =>
                setResources((current) => {
                  const next = [...current];
                  const [item] = next.splice(from, 1);
                  if (item) next.splice(to, 0, item);
                  return next;
                })
              }
              onRemove={(id) =>
                setResources((current) =>
                  current.filter((item) => item.id !== id),
                )
              }
            />
          </MemoryRouter>
          <ResourceDialog
            resource={editing}
            runners={{
              loading: false,
              options: [
                {
                  value: 'm1',
                  label: 'MacBook',
                  description: 'ada-mbp · darwin/arm64 · online',
                },
              ],
            }}
            validate={(values) =>
              values.type === 'gitRepo' && !values.url.trim()
                ? { url: 'Enter the repository URL.' }
                : {}
            }
            onSubmit={async (values) => {
              await later();
              setResources((current) => [
                ...current,
                {
                  id: `r${current.length + 1}`,
                  type: values.type,
                  // A repository is named after itself; a directory by its display name.
                  name:
                    values.type === 'gitRepo'
                      ? values.url
                      : values.label || values.path,
                  detail: values.defaultRef || 'default branch',
                },
              ]);
            }}
            onSaved={() => setEditing(null)}
            onRequestClose={() => setEditing(null)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

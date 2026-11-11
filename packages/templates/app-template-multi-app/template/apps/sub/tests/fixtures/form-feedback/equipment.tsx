import { RouteChildPage } from '#components/route-child-page';
// Test-only business customization. Install in an isolated generated application's client/pages/.
import { FormFeedback, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { FeedbackForm } from '#components/feedback-form';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { RouteDialog } from '#components/route-dialog';
import { RouteDrawer } from '#components/route-drawer';
import { useLocation, useNavigate } from 'react-router';
import { PageContainer } from '#components/page-container';

interface Row {
  key: string;
  name: string;
}

export default function EquipmentFixture(): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation();
  const [name, setName] = useState('Equipment draft');
  const [department, setDepartment] = useState('Operations');
  const [rows, setRows] = useState<Row[]>([
    { key: 'camera', name: 'Camera' },
    { key: 'tripod', name: 'Tripod' },
  ]);
  const [tab, setTab] = useState('details');
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [mode, setMode] = useState('structured');
  const location = useLocation();
  const navigate = useNavigate();
  const container = location.pathname.endsWith('/drawer')
    ? 'drawer'
    : location.pathname.endsWith('/dialog')
      ? 'dialog'
      : location.pathname.endsWith('/edit')
        ? 'detail-edit'
        : 'page';
  const [request, setRequest] = useState<
    { id: string; workflow: string } | undefined
  >();
  const [saved, setSaved] = useState(false);
  const [record, setRecord] = useState<unknown>();
  const [feedback] = useState(
    () =>
      new FormFeedback({
        messages: {
          invalid: 'Check the fields.',
          failed: 'Unable to save.',
          denied: 'Access denied.',
          network: 'Check your connection.',
        },
      }),
  );
  const liveRef = useRef({ rows, hidden, disabled });
  const revealWaitersRef = useRef<(() => void)[]>([]);
  useLayoutEffect(() => {
    liveRef.current = { rows, hidden, disabled };
    if (tab === 'items' && expanded) {
      for (const resolve of revealWaitersRef.current.splice(0)) resolve();
    }
  }, [rows, hidden, disabled, tab, expanded]);
  const anchorsRef = useRef(new Map<string, HTMLDivElement>());
  const inputsRef = useRef(new Map<string, HTMLInputElement>());
  useEffect(() => {
    const remove = ['camera', 'tripod'].map((key) =>
      feedback.register({
        id: key,
        path: () =>
          `items.${liveRef.current.rows.findIndex((row) => row.key === key)}.name`,
        value: () => liveRef.current.rows.find((row) => row.key === key)?.name,
        label: () => (key === 'camera' ? 'Camera item' : 'Tripod item'),
        anchor: () => anchorsRef.current.get(key) ?? null,
        control: () => inputsRef.current.get(key) ?? null,
        accessible: () =>
          !liveRef.current.hidden &&
          liveRef.current.rows.some((row) => row.key === key),
        editable: () => !liveRef.current.disabled,
        reveal: () => {
          if (inputsRef.current.has(key)) return Promise.resolve();
          return new Promise<void>((resolve) => {
            revealWaitersRef.current.push(resolve);
            setTab('items');
            setExpanded(true);
          });
        },
      }),
    );
    return () => remove.forEach((dispose) => dispose());
  }, [feedback]);
  useEffect(() => {
    void api
      .request<{ data: unknown }>({ path: 'equipmentFixture' })
      .then((result) => setRecord(result.data));
  }, [api]);
  const content = (
    <FeedbackForm
      feedback={feedback}
      fieldMessage={({ reason }) =>
        reason === 'DEPARTMENT'
          ? t('equipment.departmentError')
          : t('equipment.itemError')
      }
      className='flex flex-col gap-4'
      onSubmit={async (event) => {
        event.preventDefault();
        setSaved(false);
        if (mode === 'network')
          throw new TypeError('Test connection interruption');
        const result = await api.request<{
          data: { id: string; workflow: string };
        }>({
          path: 'equipmentFixture',
          method: 'POST',
          json: {
            mode,
            name,
            department,
            items: rows,
            attachment: 'safety-check.pdf',
          },
        });
        setRequest(result.data);
        setSaved(true);
      }}
    >
      <div>
        <label htmlFor='equipment-name'>{t('equipment.name')}</label>
        <Input
          id='equipment-name'
          name='name'
          required
          value={name}
          aria-describedby='name-help'
          onChange={(event) => setName(event.target.value)}
        />
        <p id='name-help'>{t('equipment.help')}</p>
      </div>
      <div>
        <label htmlFor='department'>{t('equipment.department')}</label>
        <Input
          id='department'
          name='department'
          required
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
        />
      </div>
      <div>
        <label htmlFor='attachment'>{t('equipment.attachment')}</label>
        <Input id='attachment' name='attachment' type='file' />
        <p>{t('equipment.retainedAttachment')}: safety-check.pdf</p>
      </div>
      <div
        className='flex gap-2'
        role='tablist'
        aria-label='Equipment sections'
      >
        <Button
          type='button'
          role='tab'
          aria-selected={tab === 'details'}
          onClick={() => setTab('details')}
        >
          Details
        </Button>
        <Button
          type='button'
          role='tab'
          aria-selected={tab === 'items'}
          onClick={() => setTab('items')}
        >
          Items
        </Button>
      </div>
      <div
        className='h-48 overflow-y-auto rounded-lg border p-4'
        aria-label='Scrollable equipment fields'
      >
        <div className='min-h-96'>
          <p>{t('equipment.longForm')}</p>
        </div>
        <Button
          type='button'
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          Borrowed items
        </Button>
        {rows.map((row, index) => (
          <div
            key={row.key}
            ref={(node) => {
              if (node) anchorsRef.current.set(row.key, node);
              else anchorsRef.current.delete(row.key);
            }}
          >
            {tab === 'items' && expanded && !hidden && (
              <div>
                <label htmlFor={`row-${row.key}`}>
                  {row.key === 'camera' ? 'Camera item' : 'Tripod item'}
                </label>
                <Input
                  id={`row-${row.key}`}
                  name={`items.${index}.name`}
                  value={row.name}
                  disabled={disabled}
                  ref={(node) => {
                    if (node) inputsRef.current.set(row.key, node);
                    else inputsRef.current.delete(row.key);
                  }}
                  onChange={(event) => {
                    feedback.clear(row.key);
                    setRows(
                      rows.map((entry) =>
                        entry.key === row.key
                          ? { ...entry, name: event.target.value }
                          : entry,
                      ),
                    );
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className='flex flex-wrap gap-2'>
        <Button
          type='button'
          variant='outline'
          onClick={() => setRows([...rows].reverse())}
        >
          Reorder rows
        </Button>
        <Button
          type='button'
          variant='outline'
          onClick={() => setRows(rows.filter((row) => row.key !== 'camera'))}
        >
          Delete camera row
        </Button>
        <Button
          type='button'
          variant='outline'
          onClick={() => setHidden(!hidden)}
        >
          Toggle field access
        </Button>
        <Button
          type='button'
          variant='outline'
          onClick={() => setDisabled(!disabled)}
        >
          Toggle disabled
        </Button>
      </div>
      <label>
        {t('equipment.response')}
        <select
          aria-label='Response'
          value={mode}
          onChange={(event) => setMode(event.target.value)}
        >
          {[
            'structured',
            'business',
            'unknown',
            'denied',
            'network',
            'success',
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <Button type='submit'>{t('equipment.save')}</Button>
      {saved && <p role='status'>{t('equipment.saved')}</p>}
      {request && (
        <div>
          <p data-testid='workflow-status'>
            {request.id}: {request.workflow}
          </p>
          {request.workflow === 'submitted' && (
            <Button
              type='button'
              onClick={async () => {
                const result = await api.request<{
                  data: { id: string; workflow: string };
                }>({
                  path: 'equipmentFixture',
                  method: 'POST',
                  json: {
                    mode: 'approve',
                    recordId: request.id,
                    name,
                    department,
                    items: rows,
                    attachment: 'safety-check.pdf',
                  },
                });
                setRequest(result.data);
              }}
            >
              Approve request
            </Button>
          )}
        </div>
      )}
    </FeedbackForm>
  );
  return (
    <PageContainer>
      <h1 className='text-xl font-semibold'>{t('equipment.title')}</h1>
      <p data-testid='custom-style' className='font-serif'>
        {t('equipment.customCopy')}
      </p>
      <pre data-testid='retained-record'>{JSON.stringify(record)}</pre>
      <label>
        Container
        <select
          aria-label='Container'
          value={container}
          onChange={(event) =>
            void navigate(
              event.target.value === 'page'
                ? '/equipment'
                : `/equipment/${event.target.value === 'detail-edit' ? 'retained/edit' : event.target.value}`,
            )
          }
        >
          {['page', 'dialog', 'drawer', 'detail-edit'].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      {container === 'dialog' ? (
        <RouteDialog
          title='Equipment borrowing'
          description='Customized equipment request'
          closeTo='/equipment'
        >
          {content}
        </RouteDialog>
      ) : container === 'drawer' ? (
        <RouteDrawer
          title='Equipment borrowing'
          description='Customized equipment request'
          closeTo='/equipment'
        >
          {content}
        </RouteDrawer>
      ) : container === 'detail-edit' ? (
        <RouteChildPage>{content}</RouteChildPage>
      ) : (
        <section aria-label='Equipment form'>{content}</section>
      )}
    </PageContainer>
  );
}

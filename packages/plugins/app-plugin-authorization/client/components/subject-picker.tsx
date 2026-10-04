import { useEffect, useState, type ReactElement } from 'react';
import type {
  AuthorizationSubject,
  SubjectOption,
  SubjectTypeOption,
} from '../authorization-client.js';
import { useAuthorizationClient } from '../use-authorization-client.js';
import { titleText, useAuthorizationTranslation } from '../i18n.js';
import { SearchField } from './filters.js';
import { SelectField } from './select-field.js';
import { Button } from './ui/button.js';
import { ErrorBox, errorMessage } from './feedback.js';

export function SubjectPicker({
  settings = 'permissionSets',
  types,
  selectedType,
  value,
  onChange,
}: {
  settings?: string;
  types: readonly SubjectTypeOption[];
  selectedType?: string;
  value: AuthorizationSubject | undefined;
  onChange: (value: AuthorizationSubject | undefined, type: string) => void;
}): ReactElement {
  const authz = useAuthorizationClient();
  const t = useAuthorizationTranslation();
  const available = types.filter((item) => item.selection);
  const [activeType, setActiveType] = useState('');
  const type =
    available.find(
      (item) => item.value === (value?.type ?? selectedType ?? activeType),
    ) ?? available[0];
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{
    key: string;
    items: readonly SubjectOption[];
    total: number;
  }>();
  const [selected, setSelected] = useState<{
    key: string;
    item?: SubjectOption;
  }>();
  const [error, setError] = useState<{ key: string; message: string }>();
  const queryKey = JSON.stringify([type?.value, search, page]);
  const selectedKey = JSON.stringify(value ?? null);
  useEffect(() => {
    if (!type || type.selection?.type !== 'collection') return;
    let current = true;
    const timer = setTimeout(() => {
      void authz
        .listSubjects(settings, type.value, {
          search,
          page,
          pageSize: 30,
        })
        .then(
          (data) => {
            if (current) {
              setResult({ ...data, key: queryKey });
              setError(undefined);
            }
          },
          (cause: unknown) => {
            if (current)
              setError({ key: queryKey, message: errorMessage(t, cause) });
          },
        );
    }, 200);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [authz, settings, type, search, page, queryKey, t]);
  useEffect(() => {
    if (!value || type?.selection?.type !== 'collection') return;
    let current = true;
    void authz.resolveSubjects(settings, value.type, [value.id]).then(
      (items) => {
        if (current) setSelected({ key: selectedKey, item: items[0] });
      },
      (cause: unknown) => {
        if (current)
          setError({ key: selectedKey, message: errorMessage(t, cause) });
      },
    );
    return () => {
      current = false;
    };
  }, [authz, settings, value, type, selectedKey, t]);
  const data = result?.key === queryKey ? result : undefined;
  const selectedItem =
    selected?.key === selectedKey ? selected?.item : undefined;
  const items = [
    ...new Map(
      [...(data?.items ?? []), ...(selectedItem ? [selectedItem] : [])].map(
        (item) => [item.id, item],
      ),
    ).values(),
  ];
  return (
    <div className='flex min-w-0 flex-1 flex-wrap items-center gap-2'>
      <SelectField
        aria-label={t('inspector.subjectType')}
        className='w-40'
        value={type?.value ?? ''}
        options={available.map((item) => ({
          value: item.value,
          label: item.label,
        }))}
        onValueChange={(next) => {
          setActiveType(next);
          setSearch('');
          setPage(1);
          const selection = available.find(
            (item) => item.value === next,
          )?.selection;
          onChange(
            selection?.type === 'fixed'
              ? { type: next, id: selection.id }
              : undefined,
            next,
          );
        }}
      />
      {type?.selection?.type === 'collection' ? (
        <>
          <SearchField
            label={t('inspector.searchSubjects')}
            placeholder={t('inspector.searchSubjects')}
            value={search}
            onChange={(next) => {
              setSearch(next);
              setPage(1);
            }}
          />
          <SelectField
            aria-label={t('inspector.subject')}
            className='w-56'
            value={value?.type === type.value ? value.id : ''}
            options={[
              { value: '', label: t('inspector.selectSubject') },
              ...items.map((item) => ({
                value: item.id,
                label: titleText(item.title, t),
              })),
            ]}
            onValueChange={(id) =>
              onChange(id ? { type: type.value, id } : undefined, type.value)
            }
          />
          <Button
            variant='ghost'
            disabled={page === 1}
            onClick={() => setPage((old) => old - 1)}
          >
            {t('subjects.previous')}
          </Button>
          <Button
            variant='ghost'
            disabled={!data || page * 30 >= data.total}
            onClick={() => setPage((old) => old + 1)}
          >
            {t('subjects.next')}
          </Button>
        </>
      ) : type?.selection?.type === 'fixed' && !value ? (
        <Button
          variant='outline'
          onClick={() => {
            if (type.selection?.type === 'fixed')
              onChange({ type: type.value, id: type.selection.id }, type.value);
          }}
        >
          {t('inspector.inspect')}
        </Button>
      ) : null}
      {error && (error.key === queryKey || error.key === selectedKey) ? (
        <ErrorBox value={error.message} />
      ) : null}
    </div>
  );
}

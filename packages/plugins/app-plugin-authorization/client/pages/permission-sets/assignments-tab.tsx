import { Checkbox } from '../../components/ui/checkbox.js';
import { SelectField } from '../../components/select-field.js';
import {
  useSubjectNames,
  subjectKey,
} from '../../components/use-subject-names.js';
import { SubjectsEditor } from '../../components/subjects-editor.js';
import { useState, type ReactElement } from 'react';

import type {
  AuthorizationSubject,
  SubjectTypeOption,
  PermissionSetAssignment,
} from '../../authorization-client.js';
import { ConfirmDialog } from '../../components/confirm-dialog.js';
import {
  ClearFilterButton,
  FilterBar,
  FilterBarSpacer,
  SearchField,
} from '../../components/filters.js';
import {
  EmptyTableRow,
  ManagementTable,
  SidePanel,
  TablePager,
} from '../../components/management-ui.js';
import { pageSlice } from '../../components/pagination.js';
import { useAuthorizationTranslation } from '../../i18n.js';
import { Button } from '../../components/ui/button.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';

export function Assignments({
  assignments,
  canAssign,
  subjectTypes = [],
  assignableTypes,
  canRevoke,
  busy,
  onAssign,
  onRevoke,
}: {
  assignments: readonly PermissionSetAssignment[];
  /** A protected set may still accept new assignments; adding a superuser is the recovery path. */
  canAssign: boolean;
  /** The set's protection may name the subject types it accepts. */
  subjectTypes?: readonly SubjectTypeOption[];
  assignableTypes?: readonly SubjectTypeOption[];
  canRevoke: boolean;
  busy: boolean;
  onAssign: (subjects: readonly AuthorizationSubject[]) => Promise<void>;
  onRevoke: (ids: readonly string[]) => Promise<void>;
}): ReactElement {
  const t = useAuthorizationTranslation();
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  // The assignments a confirmed revoke would remove, with what to call them.
  const [pendingRevoke, setPendingRevoke] = useState<{
    readonly ids: readonly string[];
    readonly label: string;
  }>();
  const names = useSubjectNames(
    'permissionSets',
    subjectTypes,
    assignments.map((item) => item.subject),
  );
  const subjectLabel = (subject: AuthorizationSubject): string =>
    names[subjectKey(subject)] ?? `${subject.type}: ${subject.id}`;
  const query = search.trim().toLowerCase();
  const visible = assignments.filter((item) => {
    const label = subjectLabel(item.subject).toLowerCase();
    const itemKind = item.subject.type;
    return (
      (kind === 'all' || kind === itemKind) && (!query || label.includes(query))
    );
  });
  const paged = pageSlice(visible, page);
  // Narrowing a filter can leave the current page past the end of the list.
  function changeSearch(value: string): void {
    setSearch(value);
    setPage(1);
  }
  function changeKind(value: string): void {
    setKind(value);
    setPage(1);
  }
  function toggle(id: string, checked: boolean): void {
    setSelected((items) =>
      checked ? [...items, id] : items.filter((item) => item !== id),
    );
  }
  return (
    <div className='space-y-4'>
      <FilterBar>
        <SearchField
          className='sm:max-w-72'
          label={t('permissionSets.assignments.search')}
          placeholder={t('permissionSets.assignments.searchPlaceholder')}
          value={search}
          onChange={changeSearch}
        />
        <SelectField
          aria-label={t('permissionSets.assignments.kindLabel')}
          className='h-9 min-w-44 rounded-lg border bg-transparent px-3 text-sm'
          value={kind}
          onValueChange={(selectedValue) => changeKind(selectedValue)}
          options={[
            { value: 'all', label: t('permissionSets.assignments.kindAll') },
            ...subjectTypes.map((type) => ({
              value: type.value,
              label: type.label,
            })),
          ]}
        />
        {query || kind !== 'all' ? (
          <ClearFilterButton
            onClear={() => {
              changeSearch('');
              setKind('all');
            }}
          />
        ) : null}
        <FilterBarSpacer />
        {selected.length > 0 ? (
          <Button
            variant='outline'
            disabled={busy || !canRevoke}
            onClick={() =>
              setPendingRevoke({
                ids: selected,
                label: t(
                  `permissionSets.assignmentCount.${selected.length === 1 ? 'one' : 'other'}`,
                  { count: selected.length },
                ),
              })
            }
          >
            {t('permissionSets.assignments.revokeSelected', {
              count: selected.length,
            })}
          </Button>
        ) : null}
        <Button disabled={!canAssign} onClick={() => setAddOpen(true)}>
          {t('permissionSets.assignments.add')}
        </Button>
      </FilterBar>
      <ManagementTable>
        <Table>
          <TableHeader className='bg-muted/30 uppercase'>
            <TableRow>
              <TableHead className='w-12 px-5 py-3'>
                <Checkbox
                  aria-label={t('permissionSets.assignments.selectAllVisible')}
                  checked={
                    visible.length > 0 &&
                    visible.every((item) => selected.includes(item.id))
                  }
                  onCheckedChange={(checked) =>
                    setSelected(
                      checked
                        ? [
                            ...new Set([
                              ...selected,
                              ...visible.map((item) => item.id),
                            ]),
                          ]
                        : selected.filter(
                            (id) => !visible.some((item) => item.id === id),
                          ),
                    )
                  }
                />
              </TableHead>
              <TableHead className='px-5 py-3 font-medium'>
                {t('permissionSets.assignments.assignedTo')}
              </TableHead>
              <TableHead className='px-5 py-3 font-medium'>
                {t('permissionSets.assignments.subjectType')}
              </TableHead>
              <TableHead className='w-24 px-5 py-3' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.map((item) => (
              <TableRow key={item.id}>
                <TableCell className='px-5 py-4'>
                  <Checkbox
                    aria-label={t('common.selectNamed', {
                      label: subjectLabel(item.subject),
                    })}
                    checked={selected.includes(item.id)}
                    onCheckedChange={(checked) => toggle(item.id, checked)}
                  />
                </TableCell>
                <TableCell className='px-5 py-4 font-medium'>
                  {subjectLabel(item.subject)}
                </TableCell>
                <TableCell className='px-5 py-4 text-muted-foreground'>
                  {subjectTypes.find((type) => type.value === item.subject.type)
                    ?.label ?? item.subject.type}
                </TableCell>
                <TableCell className='px-5 py-4 text-right'>
                  <Button
                    size='sm'
                    variant='ghost'
                    disabled={!canRevoke}
                    onClick={() =>
                      setPendingRevoke({
                        ids: [item.id],
                        label: subjectLabel(item.subject),
                      })
                    }
                  >
                    {t('permissionSets.assignments.revoke')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {visible.length === 0 ? (
              <EmptyTableRow colSpan={4}>
                {assignments.length === 0
                  ? t('permissionSets.assignments.emptyNone')
                  : t('permissionSets.assignments.emptyFiltered')}
              </EmptyTableRow>
            ) : null}
          </TableBody>
        </Table>
        <TablePager
          label={t('permissionSets.assignments.pagerLabel')}
          page={page}
          total={visible.length}
          onPage={setPage}
        />
      </ManagementTable>
      <ConfirmDialog
        busy={busy}
        confirmLabel={t('permissionSets.assignments.confirmRevoke')}
        open={pendingRevoke !== undefined}
        title={t(
          (pendingRevoke?.ids.length ?? 0) > 1
            ? 'permissionSets.assignments.confirmRevokeTitleMany'
            : 'permissionSets.assignments.confirmRevokeTitleOne',
        )}
        onCancel={() => setPendingRevoke(undefined)}
        onConfirm={() => {
          const ids = pendingRevoke?.ids ?? [];
          setPendingRevoke(undefined);
          void onRevoke(ids).then(() =>
            setSelected((items) => items.filter((id) => !ids.includes(id))),
          );
        }}
      >
        {t('permissionSets.assignments.confirmRevokeBody', {
          label: pendingRevoke?.label ?? '',
        })}
      </ConfirmDialog>
      {addOpen ? (
        <AssignmentPicker
          assignments={assignments}
          types={assignableTypes ?? subjectTypes}
          busy={busy}
          onClose={() => setAddOpen(false)}
          onAdd={(subjects) =>
            void onAssign(subjects).then(() => setAddOpen(false))
          }
        />
      ) : null}
    </div>
  );
}

function AssignmentPicker({
  types,
  assignments,
  busy,
  onClose,
  onAdd,
}: {
  types: readonly SubjectTypeOption[];
  assignments: readonly PermissionSetAssignment[];
  busy: boolean;
  onClose: () => void;
  onAdd: (subjects: readonly AuthorizationSubject[]) => void;
}): ReactElement {
  const t = useAuthorizationTranslation();
  const [subjects, setSubjects] = useState<readonly AuthorizationSubject[]>([]);
  return (
    <SidePanel
      title={t('permissionSets.assignments.add')}
      description={t('permissionSets.assignments.pickerDescription')}
      onClose={onClose}
    >
      <fieldset disabled={busy} className='min-w-0 space-y-5'>
        <SubjectsEditor
          settings='permissionSets'
          types={types}
          excluded={assignments.map((item) => item.subject)}
          value={subjects}
          onChange={setSubjects}
        />
        <div className='sticky bottom-0 flex justify-end gap-2 border-t bg-popover py-4'>
          <Button variant='outline' onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={busy || !subjects.length}
            onClick={() => onAdd(subjects)}
          >
            {t('permissionSets.assignments.add')}
          </Button>
        </div>
      </fieldset>
    </SidePanel>
  );
}

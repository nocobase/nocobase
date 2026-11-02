import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

export function actionInput(action, input) {
  const result = structuredClone(input);
  if (action === 'concurrent') {
    const first = randomUUID();
    result.operationKeys = [
      first,
      input.sameOperationKey === true ? first : randomUUID(),
    ];
  }
  return result;
}

export function createdRecords(before, after) {
  assert(
    before && after,
    'Concurrent create needs persisted before/after snapshots',
  );
  for (const snapshot of [before, after]) {
    for (const row of [...snapshot.parents, ...snapshot.children])
      assert(
        ['string', 'number'].includes(typeof row.id) &&
          String(row.id).length > 0,
        'Persisted IDs required',
      );
  }
  const previousParents = new Set(before.parents.map(({ id }) => id));
  const previousChildren = new Set(before.children.map(({ id }) => id));
  const parents = after.parents.filter(({ id }) => !previousParents.has(id));
  const parentIds = new Set(parents.map(({ id }) => id));
  const children = after.children.filter(({ id }) => !previousChildren.has(id));
  assert.equal(parentIds.size, parents.length, 'Duplicate parent observations');
  assert.equal(
    new Set(children.map(({ id }) => id)).size,
    children.length,
    'Duplicate child observations',
  );
  assert(
    children.every(({ parentId }) => parentIds.has(parentId)),
    'New children without a newly created parent',
  );
  return { createdParents: parents.length, createdChildren: children.length };
}

export const uiStages = {
  'search-filter': [
    'open-list',
    'search-alpha',
    'clear-list-search',
    'filter-list-status',
    'open-reference-picker',
    'search-reference-alpha',
    'filter-reference-active',
    'select-allowed-reference',
  ],
  'edit-children': [
    'open-new-form',
    'add-third-child',
    'edit-first-child',
    'remove-third-child',
    'save',
    'reload-and-reopen',
  ],
  'decision-cycle': [
    'save-draft',
    'submit',
    'reviewer-reject',
    'owner-edit-rejected',
    'resubmit',
    'reviewer-approve',
    'reload-final-history',
  ],
  'completion-cycle': [
    'save-draft',
    'activate',
    'first-assignee-complete',
    'check-partial-progress',
    'second-assignee-complete',
    'reload-final-progress',
  ],
};

export function buttonMatrix(scenario) {
  const money = scenario === 'procurement' || scenario === 'expenses';
  assert(
    money || scenario === 'onboarding',
    'No state-button matrix for this scenario',
  );
  const states = money
    ? ['draft', 'submitted', 'rejected', 'approved']
    : ['draft', 'active', 'completed'];
  const actions = money
    ? ['save', 'submit', 'approve', 'reject']
    : ['save', 'activate', 'complete'];
  return [
    'owner',
    'otherOwner',
    'reviewer',
    'otherReviewer',
    'outsider',
    'anonymous',
  ].flatMap((actor) =>
    states.map((state) => ({
      actor,
      state,
      actions: Object.fromEntries(
        actions.map((action) => [
          action,
          (actor === 'owner' &&
            ((action === 'save' &&
              (state === 'draft' || (money && state === 'rejected'))) ||
              (action === 'submit' && ['draft', 'rejected'].includes(state)) ||
              (action === 'activate' && state === 'draft'))) ||
            (actor === 'reviewer' &&
              ((money &&
                state === 'submitted' &&
                ['approve', 'reject'].includes(action)) ||
                (!money && state === 'active' && action === 'complete'))),
        ]),
      ),
    })),
  );
}

export function checkUI(flow, scenario, ui) {
  assert(ui && Array.isArray(ui.stages), 'Raw UI stage observations required');
  assert.deepEqual(
    ui.stages.map(({ id }) => id),
    uiStages[flow],
    'Missing or reordered UI interaction',
  );
  for (const stage of ui.stages) {
    assert(
      stage.url &&
        stage.selector &&
        stage.observed !== undefined &&
        stage.evidence?.length,
      `Incomplete UI stage: ${stage.id}`,
    );
  }
  if (flow === 'edit-children') {
    const stages = ui.stages.filter(({ children }) => children !== undefined);
    assert.deepEqual(
      stages.map(({ children }) => children.length),
      [3, 3, 2, 2],
      'Child add/edit/delete/reopen observations required',
    );
    assert(
      ui.thirdChildId &&
        ui.editedChildId &&
        ui.thirdChildId !== ui.editedChildId,
    );
    assert(stages[0].children.some(({ id }) => id === ui.thirdChildId));
    assert(
      stages[1].children.some(
        ({ id, label }) =>
          id === ui.editedChildId && label === 'Baseline edited child',
      ),
    );
    for (const stage of stages.slice(2)) {
      assert(
        !stage.children.some(({ id }) => id === ui.thirdChildId),
        'Removed child is still present',
      );
      assert(
        stage.children.some(
          ({ id, label }) =>
            id === ui.editedChildId && label === 'Baseline edited child',
        ),
        'Edited child did not persist',
      );
    }
    return { childCount: 2, editedChildVisible: true, reopened: true };
  }
  if (flow === 'decision-cycle' || flow === 'completion-cycle') {
    const expected = buttonMatrix(scenario);
    assert.equal(
      ui.roleStates?.length,
      expected.length,
      'Incomplete role/state button observations',
    );
    for (const row of expected) {
      const matches = ui.roleStates.filter(
        ({ actor, state }) => actor === row.actor && state === row.state,
      );
      assert.equal(
        matches.length,
        1,
        'Missing or duplicate role/state observation',
      );
      const actual = matches[0];
      assert(
        actual.evidence?.length && actual.url,
        'Role/state screenshot or denial evidence required',
      );
      for (const [action, allowed] of Object.entries(row.actions)) {
        const button = actual.buttons?.[action];
        assert.equal(typeof button?.visible, 'boolean');
        assert.equal(typeof button?.enabled, 'boolean');
        assert.equal(
          button.visible && button.enabled,
          allowed,
          `${row.actor}/${row.state}/${action}`,
        );
      }
    }
    return { buttonsCorrect: true };
  }
  return {};
}

import { describeLifecycle, type TransitionEntry } from '@nocobase/lifecycle';
import { describe, expect, it } from 'vitest';

import { lifecycleDiagramGraph } from '../client/components/lifecycle-diagram-model.js';
import {
  currentRoundTransitions,
  visitedStates,
} from '../client/lib/diagram.js';
import { ticketLifecycle } from '../server/lifecycles/ticket.js';
import { orderLifecycle } from '../server/lifecycles/order.js';

const description = describeLifecycle(orderLifecycle);

describe('execution highlights', () => {
  it('adds distinct end markers only to explicit final states and colors reached endings', () => {
    const graph = lifecycleDiagramGraph(description, {
      endLabel: '结束',
      currentState: 'fulfilled',
    });
    const endings = graph.nodes.filter((node) => node.decorative);
    expect(endings).toHaveLength(2);
    const links = graph.edges.filter((edge) => edge.decorative);
    expect(links.map((edge) => edge.source).sort()).toEqual([
      'fulfilled',
      'refunded',
    ]);
    expect(new Set(links.map((edge) => edge.target)).size).toBe(2);
    for (const edge of links) {
      expect(endings.find((node) => node.id === edge.target)).toMatchObject({
        label: '◎ 结束',
        visited: edge.source === 'fulfilled',
      });
      expect(edge.visited).toBe(edge.source === 'fulfilled');
    }
    const waiting = { ...description, transitions: [] };
    expect(
      lifecycleDiagramGraph(waiting, { endLabel: 'End' }).nodes.filter(
        (node) => node.decorative,
      ),
    ).toHaveLength(2);
  });

  it('uses the exact transition, source and destination from history, including retries', () => {
    const history = [
      { transition: '$create', from: null, to: 'draft' },
      { transition: 'checkout', from: 'draft', to: 'creatingCheckout' },
      {
        transition: 'checkoutFailed',
        from: 'creatingCheckout',
        to: 'paymentFailed',
      },
      { transition: 'checkout', from: 'paymentFailed', to: 'creatingCheckout' },
      {
        transition: 'checkoutCreated',
        from: 'creatingCheckout',
        to: 'awaitingPayment',
      },
      { transition: 'paymentSucceeded', from: 'awaitingPayment', to: 'paid' },
    ];
    const graph = lifecycleDiagramGraph(description, {
      currentState: 'paid',
      history,
      availableTransitions: ['ship'],
    });
    expect(
      graph.edges
        .filter((edge) => edge.visited)
        .map((edge) => edge.id)
        .sort(),
    ).toEqual(
      history
        .filter((entry) => entry.from !== null)
        .map((entry) =>
          JSON.stringify([entry.transition, entry.from, entry.to]),
        )
        .sort(),
    );
    // Both endpoints were visited, but this webhook shortcut and parallel rejection never fired.
    expect(
      graph.edges.find(
        (edge) =>
          edge.id ===
          JSON.stringify(['paymentSucceeded', 'creatingCheckout', 'paid']),
      )?.visited,
    ).toBe(false);
    expect(
      graph.edges.find(
        (edge) =>
          edge.id ===
          JSON.stringify([
            'paymentDeclined',
            'creatingCheckout',
            'paymentFailed',
          ]),
      )?.visited,
    ).toBe(false);
    expect(graph.nodes.find((node) => node.id === 'draft')?.visited).toBe(true);
    expect(graph.nodes.find((node) => node.id === 'paid')).toMatchObject({
      highlighted: true,
      visited: true,
    });
    expect(graph.nodes.find((node) => node.id === 'refunded')).toMatchObject({
      highlighted: false,
      visited: false,
    });
    expect(
      graph.edges.find(
        (edge) => edge.id === JSON.stringify(['ship', 'paid', 'fulfilled']),
      ),
    ).toMatchObject({ highlighted: true, visited: false });
  });

  it('does not infer an executed edge from visited states or available actions', () => {
    const graph = lifecycleDiagramGraph(description, {
      currentState: 'draft',
      visitedStates: ['draft', 'creatingCheckout'],
      availableTransitions: ['checkout'],
    });
    expect(graph.edges.some((edge) => edge.visited)).toBe(false);
    expect(graph.edges.some((edge) => edge.highlighted)).toBe(true);
    expect(
      lifecycleDiagramGraph(description).nodes.some(
        (node) => node.visited || node.highlighted,
      ),
    ).toBe(false);
  });
  it('draws only current-round ticket progress and leaves the previous conversation in the retained log', () => {
    function reply(id: number, version: number, from: string): TransitionEntry {
      return {
        id: String(id),
        lifecycle: 'tickets',
        recordId: '1',
        transition: 'reply',
        from,
        to: 'awaitingCustomer',
        actorId: 'agent-zhou',
        input: { message: 'Reply to the customer' },
        at: '2026-11-19T00:00:00Z',
        version,
        requestId: null,
      };
    }
    const previous = reply(1, 2, 'new');
    const audit = { transitions: [previous], effectRuns: [] };
    const reset = currentRoundTransitions({
      history: audit,
      roundStartedVersion: 3,
    });
    const graph = lifecycleDiagramGraph(describeLifecycle(ticketLifecycle), {
      currentState: 'new',
      history: reset,
      visitedStates: visitedStates(reset),
    });
    expect(graph.nodes.find(({ id }) => id === 'new')).toMatchObject({
      highlighted: true,
    });
    expect(
      graph.nodes.find(({ id }) => id === 'awaitingCustomer'),
    ).toMatchObject({ visited: false, highlighted: false });
    expect(graph.edges.every(({ visited }) => !visited)).toBe(true);
    expect(audit.transitions).toEqual([previous]);

    const fresh = reply(2, 4, 'open');
    const current = currentRoundTransitions({
      history: { ...audit, transitions: [previous, fresh] },
      roundStartedVersion: 3,
    });
    expect(current).toEqual([fresh]);
  });
});

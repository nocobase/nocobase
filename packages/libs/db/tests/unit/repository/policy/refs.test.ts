import { describe, expect, it } from 'vitest';
import { normalizeRepositoryPolicy } from '../../../../src/repository/policy/normalize.js';
import {
  expandPolicyRefs,
  ref,
} from '../../../../src/repository/policy/refs.js';
import type { RepositoryPolicy } from '../../../../src/repository/policy/types.js';

const open = { scope: true } as const;

function normalize(
  map: Record<string, RepositoryPolicy>,
): Record<string, ReturnType<typeof normalizeRepositoryPolicy>> {
  return Object.fromEntries(
    Object.entries(map).map(([name, policy]) => [
      name,
      normalizeRepositoryPolicy(policy),
    ]),
  );
}

describe('expandPolicyRefs', () => {
  it('expands a reference to another collection in the same binding', () => {
    const expanded = expandPolicyRefs(
      normalize({
        projects: {
          read: {
            scope: true,
            fields: ['id'],
            relations: { tasks: ref('tasks') },
          },
          create: open,
          update: open,
          delete: open,
        },
        tasks: {
          read: { scope: { tenantId: 'T1' }, fields: ['id', 'title'] },
          create: open,
          update: open,
          delete: open,
        },
      }),
    );
    const read = expanded.projects.read as {
      relations: Record<string, { fields: readonly string[]; scope: unknown }>;
    };

    expect(read.relations.tasks.fields).toEqual(['id', 'title']);
    expect(read.relations.tasks.scope).toMatchObject({
      root: { items: [{ path: ['tenantId'] }] },
    });
  });

  it('detects a cycle at binding time instead of at query time', () => {
    expect(() =>
      expandPolicyRefs(
        normalize({
          projects: {
            read: {
              scope: true,
              fields: ['id'],
              relations: { tasks: ref('tasks') },
            },
            create: open,
            update: open,
            delete: open,
          },
          tasks: {
            read: {
              scope: true,
              fields: ['id'],
              relations: { project: ref('projects') },
            },
            create: open,
            update: open,
            delete: open,
          },
        }),
      ),
    ).toThrowError(/forms a cycle/);
  });

  it.each(['tasks', 'toString', 'constructor', '__proto__'])(
    'refuses a reference to the unlisted collection %s',
    (target) => {
      expect(() =>
        expandPolicyRefs(
          normalize({
            projects: {
              read: {
                scope: true,
                fields: ['id'],
                relations: { tasks: ref(target) },
              },
              create: open,
              update: open,
              delete: open,
            },
          }),
        ),
      ).toThrowError(/names no Collection in this binding/);
    },
  );

  it('preserves an explicit __proto__ collection as a map entry', () => {
    const expanded = expandPolicyRefs(
      normalize({
        ['__proto__']: {
          read: { scope: true, fields: ['id'] },
          create: false,
          update: false,
          delete: false,
        },
        projects: {
          read: {
            scope: true,
            fields: ['id'],
            relations: { tasks: ref('__proto__') },
          },
          create: false,
          update: false,
          delete: false,
        },
      }),
    );
    expect(Object.hasOwn(expanded, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(expanded)).toBe(Object.prototype);
    expect(expanded.projects.read).toMatchObject({
      relations: { tasks: { fields: ['id'] } },
    });
  });

  it('refuses a reference to a collection whose read is not a set of rules', () => {
    expect(() =>
      expandPolicyRefs(
        normalize({
          projects: {
            read: {
              scope: true,
              fields: ['id'],
              relations: { tasks: ref('tasks') },
            },
            create: open,
            update: open,
            delete: open,
          },
          tasks: { read: true, create: open, update: open, delete: open },
        }),
      ),
    ).toThrowError(/cannot expand/);
  });

  it('leaves a binding without references untouched', () => {
    const normalized = normalize({
      projects: {
        read: { scope: true, fields: ['id'] },
        create: open,
        update: open,
        delete: open,
      },
    });
    expect(expandPolicyRefs(normalized).projects.read).toMatchObject({
      fields: ['id'],
      relations: {},
    });
  });
});

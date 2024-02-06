import { ACL, ACLRole } from '@nocobase/acl';
import { Context, Next } from '@nocobase/actions';
import { assign, mergeStrategies } from '@nocobase/utils';
import lodash from 'lodash';

const map2obj = (map: Map<string, string>) => {
  const obj = {};
  for (const [key, value] of map) {
    obj[key] = value;
  }
  return obj;
};

const mergeResources = (roles: ACLRole[]) => {
  return Array.from(
    new Set(
      roles.reduce((resources, role) => {
        return [...resources, ...role.resources.keys()];
      }, []),
    ),
  );
};

const mergeAllowMenuItemIds = (roleModels: any[]) => {
  return Array.from(
    new Set(
      roleModels.reduce((allowMenuItemIds: string[], role: any) => {
        return [...allowMenuItemIds, ...role.get('menuUiSchemas').map((uiSchema: any) => uiSchema.get('x-uid'))];
      }, []),
    ),
  );
};

const mergeStrategyActions = (roles: ACLRole[]) => {
  const actionsMap = new Map<string, boolean>();
  const setActionsMap = (action: string) => {
    const allowOwn = action.includes(':');
    if (allowOwn) {
      action = action.split(':')[0];
    }
    if (allowOwn && !actionsMap.has(action)) {
      // only allow own
      actionsMap.set(action, false);
    } else {
      // allow all
      actionsMap.set(action, true);
    }
  };
  roles.forEach((role) => {
    if (typeof role.strategy === 'string') {
      return;
    }
    if (!role.strategy.actions) {
      return;
    }
    if (typeof role.strategy.actions === 'boolean') {
      return;
    }
    if (typeof role.strategy.actions === 'string') {
      setActionsMap(role.strategy.actions);
      return;
    }
    role.strategy.actions.forEach((action: string) => setActionsMap(action));
  });
  return Array.from(actionsMap).map(([name, allowAll]) => {
    if (allowAll) {
      return name;
    }
    return `${name}:own`;
  });
};

const mergeSnippets = (roles: ACLRole[]) => {
  const merge = (a: string[], b: string[]) => {
    const set = new Set();
    new Set([...a, ...b]).forEach((snippet) => {
      if (snippet.startsWith('!')) {
        if (a.includes(snippet) && b.includes(snippet)) {
          set.add(snippet);
        }
      } else {
        set.add(snippet);
      }
    });
    return Array.from(set);
  };
  return roles.reduce((snippets, role) => {
    return merge(snippets, Array.from(role.snippets));
  }, []);
};

const mergeActions = (acl: ACL, roles: ACLRole[], globalActions: string[], resources: string[]) => {
  const actionAlias = acl.actionAlias;
  const actionsSet = new Set();
  resources.forEach((resource) => {
    globalActions.forEach((action) => {
      const alias = actionAlias.get(action);
      action = alias || action;
      actionsSet.add(`${resource}:${action}`);
    });
  });
  roles.forEach((role) => {
    const roleActions = role.toJSON().actions;
    Object.keys(roleActions).forEach((action) => actionsSet.add(action));
  });
  const actions = {};
  actionsSet.forEach((key: string) => {
    const [resource, action] = key.split(':');
    let canResult = null;
    roles.forEach((role) => {
      const can = acl.can({ role: role.name, resource, action });
      if (!can) {
        return;
      }
      if (can && !canResult) {
        canResult = {};
      }
      if (!can.params) {
        return;
      }
      canResult = assign(canResult, can.params, {
        filter: 'orMerge',
        fields: (x, y) => {
          if (lodash.isEmpty(x)) {
            return x;
          }
          if (lodash.isEmpty(y)) {
            return y;
          }
          return mergeStrategies.get('union')(x, y);
        },
        appends: 'union',
        except: 'intersect',
        whitelist: 'union',
        blacklist: 'intersect',
        own: (x, y) => (x === false ? x : y),
      });
    });
    if (canResult) {
      actions[key] = canResult;
    }
  });
  return actions;
};

export async function checkAction(ctx: Context, next: Next) {
  const currentRole = ctx.state.currentRole;
  const attachRoles = ctx.state.attachRoles || [];

  const roleModels = await ctx.db.getRepository('roles').find({
    filter: {
      name: {
        $in: [currentRole, ...attachRoles],
      },
    },
    appends: ['menuUiSchemas'],
  });

  if (!roleModels.length) {
    ctx.log.error('User roles not found', { module: 'acl', method: 'checkAction', currentRole, attachRoles });
    throw new Error('User roles not found');
  }

  const anonymous = await ctx.db.getRepository('roles').findOne({
    filter: {
      name: 'anonymous',
    },
  });

  const getRole = async (roleModel: any): Promise<ACLRole> => {
    let role = ctx.app.acl.getRole(roleModel.name);
    if (!role) {
      await ctx.app.emitAsync('acl:writeRoleToACL', roleModel);
      role = ctx.app.acl.getRole(roleModel.name);
    }
    return role;
  };

  const roles = await Promise.all(roleModels.map(getRole));
  const role = roles.find((role) => role.name === currentRole);
  const roleObj = role.toJSON();
  const availableActions = ctx.app.acl.getAvailableActions();
  const strategyActions = mergeStrategyActions(roles);
  const resources = mergeResources(roles);

  ctx.body = {
    ...roleObj,
    snippets: mergeSnippets(roles),
    actions: mergeActions(ctx.app.acl, roles, strategyActions, resources),
    strategy: {
      ...roleObj.strategy,
      actions: strategyActions,
    },
    roles: roles.map((role) => role.toJSON()),
    availableActions: [...availableActions.keys()],
    resources,
    actionAlias: map2obj(ctx.app.acl.actionAlias),
    allowAll: currentRole === 'root',
    allowConfigure: roleModels.some((role: any) => role.get('allowConfigure')),
    allowMenuItemIds: mergeAllowMenuItemIds(roleModels),
    allowAnonymous: !!anonymous,
  };

  await next();
}

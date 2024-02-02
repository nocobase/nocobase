import { ACLRole } from '@nocobase/acl';
import { Context, Next } from '@nocobase/actions';
import { assign } from '@nocobase/utils';
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
    a.forEach((snippet) => {
      if (snippet.startsWith('!')) {
        if (b.includes(snippet)) {
          set.add(snippet);
        }
      } else {
        set.add(snippet);
      }
    });
    b.forEach((snippet) => {
      if (snippet.startsWith('!')) {
        if (a.includes(snippet)) {
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

const mergeActions = (roles: ACLRole[]) => {
  const all = roles.some((role) => lodash.isEmpty(role.toJSON().actions));
  if (all) {
    return {};
  }
  const actions = {};
  roles.forEach((role) => {
    Object.entries(role.toJSON().actions).forEach(([key, value]) => {
      if (!actions[key]) {
        actions[key] = value;
      }
      actions[key] = assign(actions[key], value, {
        filter: 'orMerge',
        fields: 'union',
        append: 'union',
        except: 'union',
        whitelist: 'union',
        blacklist: 'union',
        own: (x, y) => (x === false ? x : y),
      });
    });
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

  ctx.body = {
    ...roleObj,
    snippets: mergeSnippets(roles),
    actions: mergeActions(roles),
    stategy: {
      ...roleObj.strategy,
      actions: mergeStrategyActions(roles),
    },
    roles: roles.map((role) => role.toJSON()),
    availableActions: [...availableActions.keys()],
    resources: mergeResources(roles),
    actionAlias: map2obj(ctx.app.acl.actionAlias),
    allowAll: currentRole === 'root',
    allowConfigure: roleModels.some((role: any) => role.get('allowConfigure')),
    allowMenuItemIds: mergeAllowMenuItemIds(roleModels),
    allowAnonymous: !!anonymous,
  };

  await next();
}

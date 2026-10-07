/**
 * The titles this plugin registers with the authorization plugin (`{ key, ns }` descriptors under `access.*`). The
 * server and the client locales both spread them.
 */
export interface AccessLocale {
  readonly access: {
    readonly section: string;
    readonly settings: {
      readonly agents: {
        readonly agents: string;
        readonly runners: string;
        readonly prices: string;
        readonly services: string;
      };
    };
    readonly actions: { readonly read: string; readonly manage: string };
    readonly businessSection: string;
    readonly businesses: {
      readonly agents: {
        readonly title: string;
        readonly description: string;
        readonly actions: {
          readonly edit: {
            readonly title: string;
            readonly description: string;
            readonly related: string;
            readonly relatedLabel: string;
            readonly relatedHint: string;
            readonly all: string;
          };
        };
      };
    };
    readonly keyScopes: {
      readonly [K in 'agents' | 'runners' | 'prices' | 'services']: {
        readonly title: string;
        readonly description: string;
      };
    };
  };
}

const accessEnUS: AccessLocale = {
  access: {
    section: 'Agent team',
    businessSection: 'Agent team',
    businesses: {
      agents: {
        title: 'Agents and skills',
        description: 'The agents of the team and the skills they use.',
        actions: {
          edit: {
            title: 'Change agents and skills',
            description:
              "Change an agent's settings, skills and variables, archive, restore and delete it, and edit skills. An agent is given no capability beyond the editor's own",
            related:
              'Change agents and skills (agents they own and skills they created)',
            relatedLabel: 'Agents I own and skills I created',
            relatedHint: 'Agents I am the owner of, and skills I created',
            all: 'Change agents and skills (all)',
          },
        },
      },
    },
    settings: {
      agents: {
        agents: 'Agents',
        runners: 'Runtimes',
        prices: 'Model prices',
        services: 'Model services',
      },
    },
    actions: { read: 'View', manage: 'Manage' },
    keyScopes: {
      agents: {
        title: 'Agents',
        description:
          'See agents, skills and runs; change agents and skills, cancel and retry runs.',
      },
      runners: {
        title: 'Runtimes',
        description: 'See runners and registration tokens; manage runners.',
      },
      prices: {
        title: 'Model prices',
        description:
          'See the model prices costs are estimated from; change them.',
      },
      services: {
        title: 'Model services',
        description:
          'See the model services and the models they offer, never their keys.',
      },
    },
  },
};

export default accessEnUS;

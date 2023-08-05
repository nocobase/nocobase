import Application from '../application';
import { createMachine, interpret, assign, actions, raise } from 'xstate';
import { ApplicationNotInstall } from '../errors/application-not-install';

const onError = {
  target: 'error',
  actions: assign({
    error: (context, event: any) => event.data,
  }),
};

const workings = {
  install: {
    ing: 'installing',
  },
  upgrade: {
    ing: 'upgrading',
  },
  'pm-enable': {
    ing: 'pm-enabling',
  },
  'pm-disable': {
    ing: 'pm-disabling',
  },
};
export class ApplicationFsm {
  static buildFsm(application: Application) {
    return createMachine<{
      error: Error | null;
      tryStart: boolean;
      workingType: 'install' | 'upgrade' | 'pm-enable' | 'pm-disable' | null;
      workingName: string;
    }>(
      {
        predictableActionArguments: true,
        id: 'application',
        initial: 'idle',
        context: {
          error: null,
          tryStart: false,
          workingType: null,
          workingName: null,
        },
        states: {
          idle: {
            on: {
              start: 'starting',
              work: 'working',
            },
          },
          starting: {
            invoke: {
              src: 'start',
              onDone: 'started',
              onError,
            },
            entry: assign({ tryStart: true }),
          },
          working: {
            entry: [
              (context, event) => {
                console.log({ event });
                context.workingType = event.workingType;
                context.workingName = workings[event.workingType].ing;
              },
            ],
            invoke: {
              src: 'working',
              onDone: {
                target: 'idle',
                actions: [
                  raise((context) => {
                    if (context.tryStart) {
                      return { type: 'start' };
                    }

                    return { type: 'idle' };
                  }),
                ],
              },
              onError,
            },
          },
          started: {
            on: {
              work: 'working',
            },
          },
          error: {
            on: {
              work: {
                target: 'working',
              },
            },
            entry: actions.log((context) => `${context.error}`),
          },
        },
      },
      {
        guards: {
          isError(context, event, { cond }) {
            // @ts-ignore
            return context.error && context.error instanceof cond.errorType;
          },
        },

        services: {
          async working(context, event) {
            switch (context.workingType) {
              case 'install':
                await application.install(event.options);
                break;
              case 'upgrade':
                await application.upgrade(event.options);
                break;
              case 'pm-enable':
                await application.pm.enable(event.options);
                break;
              case 'pm-disable':
                await application.pm.disable(event.options);
                break;
            }
          },

          async start(context, options) {
            await application._start(options as any);
          },
        },
      },
    );
  }

  static getInterpreter(application: Application) {
    const machine = application.getStateMachine();
    const interpreter = interpret(machine);
    interpreter.onTransition((state) => {
      application.logger.debug(`Application FSM transition: ${state.value}`);
    });
    interpreter.start();
    return interpreter;
  }
}

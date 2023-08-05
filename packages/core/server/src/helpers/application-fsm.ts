import Application from '../application';
import { createMachine, interpret, assign, actions, send } from 'xstate';
import { ApplicationNotInstall } from '../errors/application-not-install';
import { sendTo } from 'xstate/lib/actions';

const onError = {
  target: 'error',
  actions: assign({
    error: (context, event: any) => event.data,
  }),
};

export class ApplicationFsm {
  static buildFsm(application: Application) {
    return createMachine(
      {
        predictableActionArguments: true,
        id: 'application',
        initial: 'idle',
        context: {
          error: null,
          tryStart: false,
        },
        states: {
          idle: {
            on: {
              start: 'starting',
              install: 'installing',
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
          installing: {
            invoke: {
              src: 'install',
              onDone: {
                target: 'idle',
                actions: [
                  send((context) => {
                    if (context.tryStart) {
                      return { type: 'start' };
                    }
                  }),
                ],
              },
              onError,
            },
          },
          started: {
            on: {
              install: 'installing',
            },
          },
          error: {
            on: {
              install: {
                target: 'installing',
                cond: {
                  type: 'isError',
                  errorType: ApplicationNotInstall,
                },
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
          async start(context, options) {
            await application.start(options as any);
          },

          async install(context, options) {
            await application.install(options as any);
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

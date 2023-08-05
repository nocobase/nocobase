import Application from '../application';
import { createMachine, interpret, assign, actions, raise } from 'xstate';
import { ApplicationNotInstall } from '../errors/application-not-install';

const onError = {
  target: 'error',
  actions: assign({
    error: (context, event: any) => event.data,
  }),
};

export class ApplicationFsm {
  static buildFsm(application: Application) {
    return createMachine<{
      error: Error | null;
      tryStart: boolean;
      workingType: 'install' | 'upgrade' | 'pm-enable' | 'pm-disable' | null;
    }>(
      {
        predictableActionArguments: true,
        id: 'application',
        initial: 'idle',
        context: {
          error: null,
          tryStart: false,
          workingType: null,
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
            }
          },

          async start(context, options) {
            await application.start(options as any);
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

import Application from '../application';
import { createMachine, interpret } from 'xstate';

export class ApplicationFsm {
  static buildFsm(application: Application) {
    return createMachine(
      {
        predictableActionArguments: true,
        id: 'application',
        initial: 'idle',
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
              onError: 'error',
            },
          },
          installing: {
            invoke: {
              src: 'install',
              onDone: 'idle',
              onError: 'error',
            },
          },
          started: {
            on: {
              install: 'installing',
            },
          },
          error: {},
        },
      },
      {
        services: {
          async start(context, options) {
            await application.start(options as any);
          },

          async install() {
            await application.install();
          },
        },
      },
    );
  }

  static getInterpreter(application: Application) {
    const machine = application.getStateMachine();
    const interpreter = interpret(machine);
    interpreter.start();
    return interpreter;
  }
}

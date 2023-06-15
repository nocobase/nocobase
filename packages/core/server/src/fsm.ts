import { createMachine, interpret, StateMachine } from 'xstate';
import Application from './application';
import { Interpreter } from 'xstate/lib/interpreter';

export class ApplicationFsm {
  interpret: Interpreter<any, any, any, any, any>;
  private readonly stateMachine: StateMachine<any, any, any>;

  constructor(private app: Application) {
    this.stateMachine = createMachine({
      id: app.name,
      initial: 'idle',
      predictableActionArguments: true,
      states: {
        idle: {
          on: { START: 'starting' },
        },
        starting: {
          on: { STARTED: 'started' },
        },
        started: {},
      },
    });

    this.interpret = interpret(this.stateMachine);
    this.interpret.start();
  }

  currentState() {
    return this.interpret.getSnapshot().value;
  }
}

import Application from '../application';

describe('application fsm', () => {
  let app: Application;
  beforeEach(() => {
    app = new Application({
      database: {
        dialect: 'sqlite',
        storage: ':memory:',
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should get fsm', () => {
    const fsmInterpreter = app.getFsmInterpreter();
    expect(fsmInterpreter.state.value).toBe('idle');
  });

  it('should call start on state transform', async () => {
    const jestFn = jest.fn();

    app.on('beforeStart', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      jestFn();
    });

    const started = new Promise((resolve) => {
      app.getFsmInterpreter().onTransition((state) => {
        if (state.matches('started')) {
          resolve(true);
        }
      });
    });

    app.getFsmInterpreter().send('start');

    await started;

    expect(jestFn).toBeCalledTimes(1);
  });
});

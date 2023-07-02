import { AppSupervisor } from '@nocobase/server';

const sendAction = async (ctx, next) => {
  const { appName, action } = ctx.action.params;

  const app = await AppSupervisor.getInstance().getApp(appName);

  if (!app) {
    throw new Error(`App ${appName} not found`);
  }

  await app.fsm.interpret.send(action);

  await next();
};

export { sendAction };

export async function getApp(ctx, subAppName) {
  let app = ctx.app;

  if (subAppName) {
    const subApp = await app.appManager.getApplication(subAppName);
    if (!subApp) {
      throw new Error(`app ${subAppName} not found`);
    }

    app = subApp;
  }

  return app;
}

export default async ({ app, cliArgs }) => {
  const [opts] = cliArgs;
  console.log('db sync...');
  await app.db.sync(
    opts.force
      ? {
          force: true,
          alter: {
            drop: true,
          },
        }
      : {},
  );
  await app.stop({
    cliArgs,
  });
};

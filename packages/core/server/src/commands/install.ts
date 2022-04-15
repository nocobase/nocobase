export default async ({ app, cliArgs }) => {
  const [opts] = cliArgs;
  await app.install({
    cliArgs,
    clean: opts.clean,
    sync: {
      force: opts.force,
    },
  });
  await app.stop({
    cliArgs,
  });
};

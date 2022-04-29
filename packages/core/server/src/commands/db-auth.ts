export default async ({ app, cliArgs }) => {
  const [opts] = cliArgs;
  await app.db.auth({ repeat: opts.repeat || 10 });
};

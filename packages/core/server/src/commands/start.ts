export default async ({ app, cliArgs }) => {
  const [opts] = cliArgs;
  const port = opts.port || process.env.SERVER_PORT || 3000;
  const host = opts.host || process.env.SERVER_HOST || '0.0.0.0';

  await app.start({
    cliArgs,
    listen: {
      port,
      host,
    },
  });

  if (!opts.silent) {
    console.log(`🚀 NocoBase server running at: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/`);
  }
};

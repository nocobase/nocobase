import chalk from 'chalk';

export default async ({ app, cliArgs }) => {
  const [opts] = cliArgs;

  if (!opts?.clean && !opts?.force) {
    const tables = await app.db.sequelize.getQueryInterface().showAllTables();
    if (tables.includes('collections')) {
      if (!opts.silent) {
        console.log();
        console.log();
        console.log(chalk.yellow('NocoBase is already installed. To reinstall, please execute:'));
        console.log();
        let command = 'yarn nocobase install -f';
        console.log(chalk.yellow(command));
        console.log();
        console.log();
      }
      return;
    }
  }

  if (!opts.silent) {
    console.log(`NocoBase installing`);
  }

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

  if (!opts.silent) {
    console.log(`NocoBase installed`);
  }
};

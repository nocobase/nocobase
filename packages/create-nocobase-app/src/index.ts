import { yargs } from '@umijs/utils';
import AppGenerator from './AppGenerator/AppGenerator';

export default async ({
  cwd,
  args,
  tplContext
}: {
  cwd: string;
  args: yargs.Arguments;
  tplContext: object
}) => {
  const generator = new AppGenerator({
    cwd,
    args,
  });

  generator.setTplContext(tplContext);
  await generator.run();
};

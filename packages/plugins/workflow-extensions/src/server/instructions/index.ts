import sql from './sql';

export default function({ app }) {
  const host = app.getPlugin('workflow');
  host.instructions.register('sql', sql);
}

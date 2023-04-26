import { ExpressionField } from './expression-field';

export default function (plugin) {
  plugin.db.registerFieldTypes({
    expression: ExpressionField,
  });
}

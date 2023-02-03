import Plugin from "..";
import mathjs from "./mathjs";
import formulajs from "./formulajs";


export type Evaluator = (expression: string) => any;

export default function(plugin: Plugin) {
  plugin.calculators.register('math.js', mathjs);
  plugin.calculators.register('formula.js', formulajs);
};

import CalculationInstruction from "..";
import mathjs from "./mathjs";
import formulajs from "./formulajs";



export default function(instruction: CalculationInstruction) {
  instruction.engines.register('math.js', mathjs);
  instruction.engines.register('formula.js', formulajs);
};

import { lineTemplate } from "./Line";
import { pieTemplate } from "./PieTemplate";

export const templates = new Map();

templates.set('Pie', pieTemplate);
templates.set('Line', lineTemplate);

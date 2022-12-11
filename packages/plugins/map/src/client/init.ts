import { registerField, registerGroup } from "@nocobase/client";
import { point, polygon, lineString } from "./fields";
import { generateNTemplate } from "./locales";
import './locales'

registerGroup(point.group, {
  label: generateNTemplate('Map-based geometry'),
  order: 51,
});
registerField(point.group, point.title, point);
registerField(polygon.group, polygon.title, polygon);
registerField(lineString.group, lineString.title, lineString);

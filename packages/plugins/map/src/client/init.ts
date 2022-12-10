import { registerField, registerGroup } from "@nocobase/client";
import { generateNTemplate } from "./locales";
import './locales'
import { fields } from "./fields";

registerGroup(fields[0].group, {
  label: generateNTemplate('Map-based geometry'),
  order: 51,
});

fields.forEach((field) => {
  registerField(field.group, field.title, field);
})

import React from "react";
import { useRecord } from "../../record-provider";
import { SchemaComponent } from "../../schema-component";
import * as model from './model';

const triggerTypes = {
  model
};

export const TriggerConfig = () => {
  const { type, config } = useRecord();
  const { properties, scope } = triggerTypes[type];
  return (
    <SchemaComponent
      schema={{
        type: 'object',
        properties,
        default: config
      }}
      scope={scope}
    />
  );
}

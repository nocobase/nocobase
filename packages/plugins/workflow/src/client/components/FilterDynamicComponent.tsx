import React from "react";

import { useWorkflowVariableOptions } from "../variable";
import { VariableInput } from "./VariableInput";



export function FilterDynamicComponent({ value, onChange, renderSchemaComponent }) {
  const scope = useWorkflowVariableOptions();

  return (
    <VariableInput
      value={value}
      onChange={onChange}
      scope={scope}
    >
      {renderSchemaComponent()}
    </VariableInput>
  );
}

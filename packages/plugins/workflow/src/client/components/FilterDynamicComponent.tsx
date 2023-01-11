import React from "react";

import { Operand, parseValue, VariableTypes, VariableTypesContext } from "../variable";
import { NAMESPACE } from "../locale";



export function FilterDynamicComponent({ value, onChange, renderSchemaComponent }) {
  const VTypes = {
    ...VariableTypes,
    constant: {
      title: `{{t("Constant", { ns: "${NAMESPACE}" })}}`,
      value: 'constant',
    }
  };

  const { type } = parseValue(value, VTypes);

  return (
    <VariableTypesContext.Provider value={VTypes}>
      <Operand value={value} onChange={onChange}>
        {type === 'constant' ? renderSchemaComponent() : null}
      </Operand>
    </VariableTypesContext.Provider>
  );
}

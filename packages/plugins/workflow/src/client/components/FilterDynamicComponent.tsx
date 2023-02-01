import React from "react";

import { Operand, parseValue, VariableTypes } from "../variable";
import { NAMESPACE } from "../locale";
import { VariableInput } from "./VariableInput";



export function FilterDynamicComponent({ value, onChange, renderSchemaComponent }) {
  // const VTypes = {
  //   ...VariableTypes,
  //   constant: {
  //     title: `{{t("Constant", { ns: "${NAMESPACE}" })}}`,
  //     value: 'constant',
  //   }
  // };

  // const { type } = parseValue(value, VTypes);

  return (
    <VariableInput
      value={value}
      onChange={onChange}
      useContantOptions={() => {
        return {
          component: renderSchemaComponent
        }
      }}
    />
  );

  // return (
  //   <Operand scope={VTypes} value={value} onChange={onChange}>
  //     {type[0] === 'constant' ? renderSchemaComponent() : null}
  //   </Operand>
  // );
}

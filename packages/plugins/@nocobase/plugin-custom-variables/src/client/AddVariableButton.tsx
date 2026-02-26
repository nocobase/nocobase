import React, { createContext, FC } from "react";
import { useSchemaInitializerRender, useToken } from "@nocobase/client";

const AddVariableButtonContext = createContext<{ onSuccess: () => void }>({
  onSuccess: () => {},
});

export const AddVariableButton: FC<{ onSuccess?: () => void }> = (props) => {
  const { token } = useToken();
  const { render } = useSchemaInitializerRender('customVariables:addVariable');

  return (
    <AddVariableButtonContext.Provider value={{ onSuccess: props.onSuccess || (() => { }) }}>
      {render({ style: { borderRadius: token.borderRadius } })}
    </AddVariableButtonContext.Provider>
  );
}

export const useAddVariableButtonProps = () => {
  return React.useContext(AddVariableButtonContext);
}

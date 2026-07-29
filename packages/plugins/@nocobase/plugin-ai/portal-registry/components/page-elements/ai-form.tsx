import { useEffect, useRef, type RefCallback } from "react";
import { useAIFormRegistry, type AIFormField } from "../../providers";
import { useAIPageElement } from "./page-element-provider";

export type AIFormDescriptor = {
  id: string;
  title: string;
  fields: AIFormField[];
  getValues: () => unknown | Promise<unknown>;
  setValues: (values: Record<string, unknown>) => void | Promise<void>;
};

export function useAIForm(
  descriptor: AIFormDescriptor
): RefCallback<HTMLElement> {
  const registry = useAIFormRegistry();
  const descriptorRef = useRef(descriptor);
  descriptorRef.current = descriptor;

  useEffect(
    () =>
      registry.register({
        id: descriptor.id,
        title: descriptor.title,
        fields: descriptor.fields,
        getValues: () => descriptorRef.current.getValues(),
        setValues: (values) => descriptorRef.current.setValues(values),
      }),
    [descriptor.fields, descriptor.id, descriptor.title, registry]
  );

  return useAIPageElement({
    id: descriptor.id,
    title: descriptor.title,
    kind: "form",
    getContext: async () => ({
      form: descriptor.id,
      title: descriptor.title,
      fields: descriptorRef.current.fields,
      value: await descriptorRef.current.getValues(),
      instructions: `Use the formFiller tool with form "${descriptor.id}" to fill this form. The tool only changes visible field values and does not submit the form.`,
    }),
  });
}

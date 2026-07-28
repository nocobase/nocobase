import type {
  FieldValues,
  Path,
  PathValue,
  UseFormReturn,
} from "react-hook-form";

export function applyReactHookFormValues<TValues extends FieldValues>(
  form: Pick<UseFormReturn<TValues>, "setValue">,
  values: Record<string, unknown>
) {
  for (const [name, value] of Object.entries(values)) {
    const path = name as Path<TValues>;
    form.setValue(path, value as PathValue<TValues, typeof path>, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }
}

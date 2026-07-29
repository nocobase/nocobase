import type { useTranslate } from "@refinedev/core";
import type { Path, PathValue, UseFormReturn } from "react-hook-form";

import type { UserFormValues } from "./types";

type Translate = ReturnType<typeof useTranslate>;

const AI_EDITABLE_FIELDS = ["nickname", "username", "email", "phone"] as const;

export function getAIUserFormValues(values: UserFormValues) {
  return Object.fromEntries(
    AI_EDITABLE_FIELDS.map((name) => [name, values[name] ?? ""])
  );
}

export function applyAIUserFormValues(
  form: Pick<UseFormReturn<UserFormValues>, "setValue">,
  values: Record<string, unknown>
) {
  const editableValues = Object.entries(values).filter(([name]) =>
    AI_EDITABLE_FIELDS.includes(name as (typeof AI_EDITABLE_FIELDS)[number])
  );
  for (const [name, value] of editableValues) {
    const path = name as Path<UserFormValues>;
    form.setValue(path, value as PathValue<UserFormValues, typeof path>, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }
}

export function getAIUserFormFields(translate: Translate) {
  return [
    {
      name: "nickname",
      title: translate("users.fields.nickname", { ns: "app" }, "Nickname"),
      type: "string",
    },
    {
      name: "username",
      title: translate("users.fields.username", { ns: "app" }, "Username"),
      type: "string",
      required: true,
    },
    {
      name: "email",
      title: translate("users.fields.email", { ns: "app" }, "Email"),
      type: "email",
      required: true,
    },
    {
      name: "phone",
      title: translate("users.fields.phone", { ns: "app" }, "Phone"),
      type: "string",
      required: true,
    },
  ];
}

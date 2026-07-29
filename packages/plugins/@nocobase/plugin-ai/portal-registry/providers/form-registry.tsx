import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import type { AIToolInvoker } from "./types";

export type AIFormField = {
  name: string;
  title?: string;
  type?: string;
  description?: string;
  readonly?: boolean;
  required?: boolean;
  enum?: unknown;
  [key: string]: unknown;
};

export type AIFormTarget = {
  id: string;
  title: string;
  fields: AIFormField[];
  getValues: () => unknown | Promise<unknown>;
  setValues: (values: Record<string, unknown>) => void | Promise<void>;
};

export type AIFormFillSkippedField = {
  name: string;
  reason: "undeclared" | "readonly" | "invalid";
  message: string;
};

export type AIFormFillResult = {
  status: "success" | "error";
  content: string;
  appliedFields: string[];
  skippedFields: AIFormFillSkippedField[];
};

export class AIFormRegistry {
  private readonly targets = new Map<
    string,
    { token: symbol; target: AIFormTarget }
  >();

  register(target: AIFormTarget) {
    if (!target.id.trim()) throw new Error("AI Form id is required");
    if (!target.title.trim()) throw new Error("AI Form title is required");
    if (!Array.isArray(target.fields)) {
      throw new Error("AI Form fields must be an array");
    }
    if (typeof target.getValues !== "function") {
      throw new Error("AI Form getValues must be a function");
    }
    if (typeof target.setValues !== "function") {
      throw new Error("AI Form setValues must be a function");
    }
    const fieldNames = new Set<string>();
    for (const field of target.fields) {
      if (!field.name?.trim()) throw new Error("AI Form field name is required");
      if (fieldNames.has(field.name)) {
        throw new Error(
          `AI Form field "${field.name}" is declared more than once`
        );
      }
      fieldNames.add(field.name);
    }
    if (this.targets.has(target.id)) {
      throw new Error(`AI Form "${target.id}" is already registered`);
    }
    const token = Symbol(target.id);
    this.targets.set(target.id, { token, target });
    return () => {
      if (this.targets.get(target.id)?.token === token) {
        this.targets.delete(target.id);
      }
    };
  }

  get(formId: string) {
    return this.targets.get(formId)?.target;
  }
}

const AIFormRegistryContext = createContext<AIFormRegistry | null>(null);

export function AIFormRegistryProvider({ children }: PropsWithChildren) {
  const registry = useMemo(() => new AIFormRegistry(), []);
  return (
    <AIFormRegistryContext.Provider value={registry}>
      {children}
    </AIFormRegistryContext.Provider>
  );
}

export function useAIFormRegistry() {
  const registry = useContext(AIFormRegistryContext);
  if (!registry) {
    throw new Error(
      "useAIFormRegistry must be used inside AIFormRegistryProvider"
    );
  }
  return registry;
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const getEnumValues = (definition: unknown) => {
  if (!Array.isArray(definition)) return undefined;
  return definition.map((item) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      return (item as { value?: unknown }).value;
    }
    return item;
  });
};

const validateFieldValue = (field: AIFormField, value: unknown) => {
  const enumValues = getEnumValues(field.enum);
  if (enumValues?.length && !enumValues.some((item) => Object.is(item, value))) {
    return "The value is not one of the declared options.";
  }

  switch (field.type?.toLowerCase()) {
    case "string":
    case "text":
    case "textarea":
    case "email":
    case "url":
    case "date":
    case "datetime":
      return typeof value === "string" ? undefined : "Expected a string.";
    case "number":
    case "percent":
      return typeof value === "number" && Number.isFinite(value)
        ? undefined
        : "Expected a finite number.";
    case "integer":
      return typeof value === "number" && Number.isInteger(value)
        ? undefined
        : "Expected an integer.";
    case "boolean":
    case "checkbox":
      return typeof value === "boolean" ? undefined : "Expected a boolean.";
    case "array":
      return Array.isArray(value) ? undefined : "Expected an array.";
    case "object":
      return value && typeof value === "object" && !Array.isArray(value)
        ? undefined
        : "Expected an object.";
    default:
      return undefined;
  }
};

export function createFormFillerInvoker(
  registry: AIFormRegistry
): AIToolInvoker {
  return async (input, context) => {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return {
        status: "error",
        content: "Form filler requires a form identifier and field data.",
        appliedFields: [],
        skippedFields: [],
      };
    }

    const { form, data } = input as { form?: unknown; data?: unknown };
    if (typeof form !== "string" || !form) {
      return {
        status: "error",
        content: "The target form identifier is missing.",
        appliedFields: [],
        skippedFields: [],
      };
    }
    if (context.allowedFormIds?.includes(form) !== true) {
      return {
        status: "error",
        content: `The target form "${form}" is not available in this conversation context.`,
        appliedFields: [],
        skippedFields: [],
      };
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return {
        status: "error",
        content: "Form filler data must be an object.",
        appliedFields: [],
        skippedFields: [],
      };
    }

    const target = registry.get(form);
    if (!target) {
      return {
        status: "error",
        content: `The target form "${form}" is not available on this page.`,
        appliedFields: [],
        skippedFields: [],
      };
    }

    try {
      const fields = new Map(target.fields.map((field) => [field.name, field]));
      const accepted: Record<string, unknown> = {};
      const skippedFields: AIFormFillSkippedField[] = [];
      for (const [name, value] of Object.entries(
        data as Record<string, unknown>
      )) {
        const field = fields.get(name);
        if (!field) {
          skippedFields.push({
            name,
            reason: "undeclared",
            message: "This field is not declared by the target form.",
          });
          continue;
        }
        if (field.readonly) {
          skippedFields.push({
            name,
            reason: "readonly",
            message: "This field is read-only.",
          });
          continue;
        }
        const validationError = validateFieldValue(field, value);
        if (validationError) {
          skippedFields.push({
            name,
            reason: "invalid",
            message: validationError,
          });
          continue;
        }
        accepted[name] = value;
      }

      const appliedFields = Object.keys(accepted);
      if (!appliedFields.length) {
        return {
          status: "error",
          content: `No valid editable fields were provided for "${target.title}".`,
          appliedFields,
          skippedFields,
        } satisfies AIFormFillResult;
      }

      await target.setValues(accepted);
      return {
        status: "success",
        content: skippedFields.length
          ? `Filled ${appliedFields.length} field(s) in "${target.title}" and skipped ${skippedFields.length}. Please review the values and submit the form manually.`
          : `Filled "${target.title}". Please review the values and submit the form manually.`,
        appliedFields,
        skippedFields,
      } satisfies AIFormFillResult;
    } catch (error) {
      return {
        status: "error",
        content: `Unable to fill "${target.title}": ${getErrorMessage(error)}`,
        appliedFields: [],
        skippedFields: [],
      } satisfies AIFormFillResult;
    }
  };
}

import { type HttpError, useTranslate } from "@refinedev/core";
import { useForm } from "@refinedev/react-hook-form";
import { useMemo } from "react";
import { useParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useAIForm, type AIFormField } from "./optional-ai";
import {
  RouteDrawer,
  RouteDrawerFooter,
  useRefineUnsavedChangesGuard,
  useRouteSurfaceClose,
} from "@/extensions/nocobase-route-surfaces";
import {
  applyAIUserFormValues,
  getAIUserFormFields,
  getAIUserFormValues,
} from "./form-context";
import { UserFormFields } from "./form-fields";
import { getUserShowPath, userRoutes } from "./routes";
import type { UserFormValues, UserRecord } from "./types";

export const UserEdit = ({
  returnTo = "list",
}: {
  returnTo?: "list" | "show";
}) => {
  const translate = useTranslate();
  const { id } = useParams<{ id: string }>();
  const closeTo =
    returnTo === "show" && id ? getUserShowPath(id) : userRoutes.list;
  const { beforeClose, confirmation } = useRefineUnsavedChangesGuard();

  return (
    <>
      <RouteDrawer
        title={translate("users.drawer.edit.title", { ns: "app" }, "Edit user")}
        description={translate(
          "users.drawer.edit.description",
          { ns: "app" },
          "Update this user's identity and contact information."
        )}
        closeLabel={translate("buttons.close", "Close")}
        closeTo={closeTo}
        beforeClose={beforeClose}
      >
        <UserEditForm id={id} />
      </RouteDrawer>
      {confirmation}
    </>
  );
};

function UserEditForm({ id }: { id?: string }) {
  const translate = useTranslate();
  const close = useRouteSurfaceClose();
  const {
    refineCore: { onFinish },
    ...form
  } = useForm<UserRecord, HttpError, UserFormValues>({
    refineCoreProps: {
      action: "edit",
      resource: "users",
      id,
      redirect: false,
      onMutationSuccess: () => {
        close({ skipBeforeClose: true });
      },
    },
  });
  const aiFields = useMemo<AIFormField[]>(
    () => getAIUserFormFields(translate),
    [translate]
  );
  const aiFormRef = useAIForm({
    id: `users-edit-form-${id ?? "current"}`,
    title: translate("users.ai.editForm", { ns: "app" }, "Edit user form"),
    fields: aiFields,
    getValues: () => getAIUserFormValues(form.getValues()),
    setValues: (values) => applyAIUserFormValues(form, values),
  });

  return (
    <Form {...form}>
      <form
        ref={aiFormRef}
        onSubmit={form.handleSubmit((values) => onFinish(values))}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="resource-form min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <UserFormFields form={form} translate={translate} />
        </div>
        <RouteDrawerFooter className="flex-row justify-end">
          <Button type="button" variant="outline" onClick={() => close()}>
            {translate("users.form.cancel", { ns: "app" }, "Cancel")}
          </Button>
          <Button
            type="submit"
            {...form.saveButtonProps}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? translate(
                  "users.form.edit.submitting",
                  { ns: "app" },
                  "Saving..."
                )
              : translate(
                  "users.form.edit.submit",
                  { ns: "app" },
                  "Save changes"
                )}
          </Button>
        </RouteDrawerFooter>
      </form>
    </Form>
  );
}

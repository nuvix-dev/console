import { Form, InputSwitchField, SubmitButton } from "@/components/others/forms";
import {
  CardBox,
  CardBoxBody,
  CardBoxDesc,
  CardBoxItem,
  CardBoxTitle,
} from "@/components/others/card";
import * as y from "yup";
import { Text, useToast } from "@nuvix/ui/components";
import { useProjectStore } from "@/lib/store";
import { Models } from "@nuvix/console";
import { useQueryClient } from "@tanstack/react-query";
import { rootKeys } from "@/lib/keys";
import { sdkForConsole } from "@/lib/sdk";
import { formatDate } from "@/lib/utils";

const schema = y.object({
  enabled: y.boolean().required(),
});

export const UpdateStatus = ({ webhook }: { webhook: Models.Webhook }) => {
  const project = useProjectStore.use.project?.();
  const { addToast } = useToast();

  const queryClient = useQueryClient();

  const refresh = async () => {
    await queryClient.invalidateQueries({
      queryKey: rootKeys.webhooks(project?.$id!),
    });
    await queryClient.invalidateQueries({
      queryKey: rootKeys.webhook(project?.$id!, webhook.$id),
    });
  };

  const createdAt = webhook.$createdAt ? formatDate(webhook.$createdAt) : null;
  const updatedAt = webhook.$updatedAt ? formatDate(webhook.$updatedAt) : null;

  return (
    <>
      <Form
        initialValues={{
          enabled: webhook.enabled,
        }}
        enableReinitialize
        validationSchema={schema}
        onSubmit={async (values) => {
          try {
            await sdkForConsole.projects.updateWebhook(
              project?.$id!,
              webhook.$id,
              webhook.name,
              webhook.events,
              webhook.url,
              webhook.security,
              values.enabled,
            );
            addToast({
              variant: "success",
              message: "Webhook status has been updated successfully.",
            });
            await refresh();
          } catch (e: any) {
            addToast({
              variant: "danger",
              message: e.message,
            });
          }
        }}
      >
        <CardBox
          actions={
            <>
              <SubmitButton loadingText={"Updating..."}>Update</SubmitButton>
            </>
          }
        >
          <CardBoxBody>
            <CardBoxItem gap={"4"}>
              <CardBoxTitle>Enabled</CardBoxTitle>
              <CardBoxDesc>Toggle the status of the webhook.</CardBoxDesc>
            </CardBoxItem>
            <CardBoxItem>
              <InputSwitchField label={"Enabled"} name="enabled" />
              {createdAt && (
                <Text variant="body-default-s" onBackground="neutral-medium">
                  <b>Created:</b> {createdAt}
                </Text>
              )}
              {updatedAt && (
                <Text variant="body-default-s" onBackground="neutral-medium">
                  <b>Updated:</b> {updatedAt}
                </Text>
              )}
            </CardBoxItem>
          </CardBoxBody>
        </CardBox>
      </Form>
    </>
  );
};

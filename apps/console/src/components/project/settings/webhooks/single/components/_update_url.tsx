import { Form, InputField, SubmitButton } from "@/components/others/forms";
import {
  CardBox,
  CardBoxBody,
  CardBoxDesc,
  CardBoxItem,
  CardBoxTitle,
} from "@/components/others/card";
import * as y from "yup";
import { useToast } from "@nuvix/ui/components";
import { useProjectStore } from "@/lib/store";
import { Models } from "@nuvix/console";
import { useQueryClient } from "@tanstack/react-query";
import { rootKeys } from "@/lib/keys";
import { sdkForConsole } from "@/lib/sdk";

const schema = y.object({
  url: y.string().url(),
});

export const UpdateUrl = ({ webhook }: { webhook: Models.Webhook }) => {
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

  return (
    <>
      <Form
        initialValues={{
          url: webhook.url,
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
              values.url,
              webhook.security,
            );
            addToast({
              variant: "success",
              message: "Webhook URL has been updated successfully.",
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
              <CardBoxTitle>URL</CardBoxTitle>
              <CardBoxDesc>Enter the URL where the webhook should send requests.</CardBoxDesc>
            </CardBoxItem>
            <CardBoxItem>
              <InputField label={"URL"} name="url" />
            </CardBoxItem>
          </CardBoxBody>
        </CardBox>
      </Form>
    </>
  );
};

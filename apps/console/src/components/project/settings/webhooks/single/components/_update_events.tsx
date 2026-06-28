import { Form, SubmitButton } from "@/components/others/forms";
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
import { EventSelectorWrapper } from "../../components/_create";

const schema = y.object({
  events: y.array().of(y.string()).required().min(1, "At least one event must be selected."),
});

export const UpdateEvents = ({ webhook }: { webhook: Models.Webhook }) => {
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
          events: webhook.events,
        }}
        enableReinitialize
        validationSchema={schema}
        onSubmit={async (values) => {
          try {
            await sdkForConsole.projects.updateWebhook(
              project?.$id!,
              webhook.$id,
              webhook.name,
              values.events,
              webhook.url,
              webhook.security,
              webhook.enabled,
              webhook.httpUser,
              webhook.httpPass,
            );
            addToast({
              variant: "success",
              message: "Webhook events has been updated successfully.",
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
            <CardBoxItem>
              <CardBoxTitle>Events</CardBoxTitle>
              <CardBoxDesc>Choose which events to trigger this webhook.</CardBoxDesc>
            </CardBoxItem>
            <CardBoxItem>
              <EventSelectorWrapper />
            </CardBoxItem>
          </CardBoxBody>
        </CardBox>
      </Form>
    </>
  );
};

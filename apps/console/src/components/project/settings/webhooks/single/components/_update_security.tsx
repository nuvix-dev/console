import { Form, InputField, InputSwitchField, SubmitButton } from "@/components/others/forms";
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
import { formValue } from "@/lib/utils";

const schema = y.object({
  security: y.boolean().optional(),
  httpUser: y.string().optional(),
  httpPass: y.string().optional(),
});

export const UpdateSecurity = ({ webhook }: { webhook: Models.Webhook }) => {
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
          security: webhook.security,
          httpUser: webhook.httpUser || "",
          httpPass: webhook.httpPass || "",
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
              values.security,
              undefined,
              formValue(values.httpUser),
              formValue(values.httpPass),
            );
            addToast({
              variant: "success",
              message: "Webhook security has been updated successfully.",
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
              <CardBoxTitle>Security</CardBoxTitle>
              <CardBoxDesc>Enable security for this webhook.</CardBoxDesc>
            </CardBoxItem>
            <CardBoxItem>
              <InputField
                label={"HTTP User"}
                name="httpUser"
                placeholder="Enter HTTP User"
                layout="vertical"
              />
              <InputField
                label={"HTTP Password"}
                name="httpPass"
                placeholder="Enter HTTP Password"
                layout="vertical"
              />

              <InputSwitchField label={"Enable Security"} name="security" layout="vertical" />
            </CardBoxItem>
          </CardBoxBody>
        </CardBox>
      </Form>
    </>
  );
};

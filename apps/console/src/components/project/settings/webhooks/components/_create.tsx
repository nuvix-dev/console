import ActionBar from "@/components/editor/SidePanelEditor/ActionBar";
import { FieldWrapper, InputField, InputSwitchField } from "@/components/others/forms";
import { SidePanel } from "@/ui/SidePanel";
import { Button, Column, Card, IconButton, Row, Text } from "@nuvix/ui/components";
import { useFormik, useFormikContext } from "formik";
import React, { useState } from "react";
import * as y from "yup";
import { sdkForConsole } from "@/lib/sdk";
import { useProjectStore } from "@/lib/store";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { rootKeys } from "@/lib/keys";
import { EventSelector } from "./_event_selector";
import { ScrollArea } from "@nuvix/sui/components/scroll-area";
import { Models } from "@nuvix/console";
import { ClipboardInput, ClipboardRoot } from "@nuvix/cui/clipboard";

export const EventSelectorWrapper = () => {
  const [current, setCurrent] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const {
    values: { events },
    setFieldValue,
  } = useFormikContext<{ events: string[] }>();

  const handleCreated = (event: string) => {
    if (current) {
      const values = [...events];
      const index = values.indexOf(current);
      if (index !== -1) {
        values[index] = event;
        setFieldValue("events", values);
        setCurrent(event);
        return;
      }
    }
    setFieldValue("events", [...events, event]);
    setCurrent(event);
  };

  return (
    <Column>
      <Card
        title="Events"
        minHeight="160"
        radius="s-4"
        center={events.length === 0}
        fillWidth
        direction="column"
        cursor="default"
        className="hover:!bg-(--surface-background)"
      >
        {events.length > 0 ? (
          <ScrollArea className="max-h-48 py-2 px-4">
            <ul className="divide-y ">
              {events.map((event) => (
                <li
                  key={event}
                  className="flex items-center odd:bg-(--neutral-alpha-weak) justify-between py-1 px-1"
                >
                  {event}
                  <Row gap="8">
                    <IconButton
                      icon="edit"
                      size="s"
                      variant="tertiary"
                      onClick={() => {
                        setCurrent(event);
                        setOpen(true);
                      }}
                      tooltip="Edit"
                    />
                    <IconButton
                      icon="trash"
                      size="s"
                      variant="danger"
                      type="button"
                      onClick={() => {
                        setFieldValue(
                          "events",
                          events.filter((e) => e !== event),
                        );
                      }}
                      tooltip="Remove"
                    />
                  </Row>
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <IconButton icon="plus" variant="secondary" onClick={() => setOpen(true)} />
        )}
        {events.length > 0 && (
          <Button
            type="button"
            prefixIcon="plus"
            size="s"
            variant="secondary"
            className="mx-auto mb-1"
            onClick={() => {
              setCurrent(undefined);
              setOpen(true);
            }}
          >
            Add Event
          </Button>
        )}
      </Card>
      <EventSelector
        initialValue={current}
        onCreated={handleCreated}
        isOpen={open}
        onOpenChange={(o) => setOpen(o)}
      />
    </Column>
  );
};

interface WebhookFormValues {
  name: string;
  url: string;
  events: string[];
  security: boolean;
  enabled: boolean;
}

const schema = y.object({
  name: y.string().required("Name is required"),
  url: y.string().required("URL is required").url("Must be a valid URL"),
  events: y.array().of(y.string()).min(1, "At least one event is required"),
  security: y.boolean().default(true),
  enabled: y.boolean().default(true),
});

interface CreateWebhookButtonProps {
  onCreated?: () => void;
}

const CreateWebhookButton: React.FC<CreateWebhookButtonProps> = ({ onCreated }) => {
  const project = useProjectStore.use.project?.();
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const [created, setCreated] = React.useState<Models.Webhook | null>(null);

  const formik = useFormik<WebhookFormValues>({
    validationSchema: schema,
    initialValues: {
      name: "",
      url: "",
      events: [],
      security: true,
      enabled: true,
    },
    onSubmit: async (values) => {
      if (!project) return;

      try {
        const created = await sdkForConsole.projects.createWebhook(
          project.$id,
          values.name,
          values.events,
          values.url,
          values.security,
          values.enabled,
        );

        await queryClient.invalidateQueries({
          queryKey: rootKeys.webhooks(project.$id),
        });

        toast.success("Webhook created successfully.");
        setCreated(created);
      } catch (e: any) {
        toast.error(e?.message || "Failed to create webhook");
      }
    },
  });

  React.useEffect(() => {
    if (open) {
      formik.resetForm();
    }
  }, [open]);

  return (
    <>
      <SidePanel
        visible={open}
        onOpenChange={setOpen}
        size="medium"
        triggerElement={
          <Button variant="primary" size="s">
            Create Webhook
          </Button>
        }
        header="Create New Webhook"
        form={formik}
        customFooter={
          <ActionBar
            hideApply={!!created}
            closePanel={() => setOpen(false)}
            isInForm
            applyButtonLabel="Create"
          />
        }
      >
        <SidePanel.Content className="space-y-6 py-6">
          {!!created ? (
            <>
              <Column gap="8">
                <Text variant="label-strong-l">Webhook Created</Text>
                <Text variant="body-default-s" onBackground="neutral-medium">
                  This secret is only shown once after webhook creation or secret rotation. Copy it
                  now.
                </Text>
                <ClipboardRoot value={created.signatureKey}>
                  <ClipboardInput />
                </ClipboardRoot>
                <Button
                  variant="primary"
                  size="s"
                  onClick={() => {
                    setOpen(false);
                    onCreated?.();
                  }}
                >
                  Done
                </Button>
              </Column>
            </>
          ) : (
            <>
              <InputField
                name="name"
                label="Name"
                placeholder="My Webhook"
                layout="vertical"
                description="A friendly name to identify this webhook"
              />

              <InputField
                name="url"
                label="URL"
                placeholder="https://your-domain.com/webhook"
                layout="vertical"
                description="The endpoint that will receive webhook POST requests"
              />

              <FieldWrapper
                name="events"
                label="Events"
                description="Choose which events will trigger this webhook"
                layout="vertical"
              >
                <EventSelectorWrapper />
              </FieldWrapper>

              <InputSwitchField
                name="security"
                label="Enable SSL verification"
                description="If enabled, the webhook will verify the SSL certificate of the endpoint"
                layout="vertical"
              />

              <InputSwitchField
                name="enabled"
                label="Enable webhook"
                description="If enabled, the webhook will be active and receive events"
                layout="vertical"
              />
            </>
          )}
        </SidePanel.Content>
      </SidePanel>
    </>
  );
};

export { CreateWebhookButton };

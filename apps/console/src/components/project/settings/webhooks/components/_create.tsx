import ActionBar from "@/components/editor/SidePanelEditor/ActionBar";
import { FieldWrapper, InputField, InputSwitchField } from "@/components/others/forms";
import { SidePanel } from "@/ui/SidePanel";
import { Button, Column, Card, IconButton } from "@nuvix/ui/components";
import { useFormik, useFormikContext } from "formik";
import React, { useState } from "react";
import * as y from "yup";
import { sdkForConsole } from "@/lib/sdk";
import { useProjectStore } from "@/lib/store";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { rootKeys } from "@/lib/keys";
import { EventSelector } from "./_event_selector";

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
      <Card>
        {events.length > 0 ? (
          <ul>
            {events.map((event) => (
              <li key={event}>
                {event}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setCurrent(event);
                    setOpen(true);
                  }}
                >
                  Edit
                </button>{" "}
                <button
                  type="button"
                  onClick={() => {
                    setFieldValue(
                      "events",
                      events.filter((e) => e !== event),
                    );
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
            <Button
              type="button"
              prefixIcon="plus"
              onClick={() => {
                setCurrent(undefined);
                setOpen(true);
              }}
            >
              Add Event
            </Button>
          </ul>
        ) : (
          <IconButton icon="plus" onClick={() => setOpen(true)}>
            Add Event
          </IconButton>
        )}
      </Card>
      <EventSelector
        initialValue={current}
        onCreated={handleCreated}
        isOpen={open}
        onClose={() => setOpen(false)}
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
        await sdkForConsole.projects.createWebhook(
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
        setOpen(false);
        onCreated?.();
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
        size="xlarge"
        triggerElement={
          <Button variant="primary" size="s">
            Create Webhook
          </Button>
        }
        header="Create New Webhook"
        form={formik}
        customFooter={
          <ActionBar closePanel={() => setOpen(false)} isInForm applyButtonLabel="Create" />
        }
      >
        <SidePanel.Content className="space-y-6 py-6">
          <InputField
            name="name"
            label="Name"
            placeholder="My Webhook"
            layout="horizontal"
            description="A friendly name to identify this webhook"
          />

          <InputField
            name="url"
            label="URL"
            placeholder="https://your-domain.com/webhook"
            layout="horizontal"
            description="The endpoint that will receive webhook POST requests"
          />

          <FieldWrapper
            name="events"
            label="Events"
            description="Choose which events will trigger this webhook"
            layout="horizontal"
          >
            <EventSelectorWrapper />
          </FieldWrapper>

          <InputSwitchField
            name="security"
            label="Enable SSL verification"
            description="If enabled, the webhook will verify the SSL certificate of the endpoint"
            layout="horizontal"
          />

          <InputSwitchField
            name="enabled"
            label="Enable webhook"
            description="If enabled, the webhook will be active and receive events"
            layout="horizontal"
          />
        </SidePanel.Content>
      </SidePanel>
    </>
  );
};

export { CreateWebhookButton };

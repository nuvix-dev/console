import { DangerCard } from "@/components/others/danger-card";
import { formatDate } from "@/lib/utils";
import { useConfirm, useToast } from "@nuvix/ui/components";
import { Button, Text, VStack } from "@chakra-ui/react";
import { useRouter } from "@bprogress/next";
import { useState } from "react";
import { useProjectStore } from "@/lib/store";
import { Models } from "@nuvix/console";
import { sdkForConsole } from "@/lib/sdk";
import { useQueryClient } from "@tanstack/react-query";
import { rootKeys } from "@/lib/keys";

interface DeleteWebhookProps {
  webhook: Models.Webhook;
}

export const DeleteWebhook = ({ webhook }: DeleteWebhookProps) => {
  const [loading, setLoading] = useState(false);
  const project = useProjectStore.use.project?.();
  const { addToast } = useToast();
  const { replace } = useRouter();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const refresh = async () => {
    if (!project) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: rootKeys.webhooks(project.$id) }),
      queryClient.invalidateQueries({ queryKey: rootKeys.webhook(project.$id, webhook.$id) }),
    ]);
  };

  const deleteWebhook = async () => {
    if (!project) return;

    const confirmed = await confirm({
      title: "Delete Webhook",
      description:
        "Are you sure you want to permanently delete this webhook? This action cannot be undone.",
      confirm: { text: "Delete", variant: "danger" },
    });

    if (!confirmed) return;

    try {
      setLoading(true);
      await sdkForConsole.projects.deleteWebhook(project.$id, webhook.$id);

      addToast({
        variant: "success",
        message: "Webhook deleted successfully.",
      });

      replace(`/project/${project.$id}/s/webhooks`);
      await refresh();
    } catch (e: any) {
      addToast({
        variant: "danger",
        message: e?.message || "Failed to delete webhook. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatedAt = webhook.$updatedAt ? formatDate(webhook.$updatedAt) : "Never";

  return (
    <DangerCard
      title="Delete Webhook"
      description="Once you delete this webhook, it cannot be recovered. Ensure this webhook is no longer in use before deleting."
      actions={
        <Button
          variant="surface"
          colorPalette="red"
          loading={loading}
          onClick={deleteWebhook}
          loadingText="Deleting..."
        >
          Delete
        </Button>
      }
    >
      <VStack align="flex-start" gap={1}>
        <Text textStyle="md" fontWeight="semibold">
          {webhook.name || "Unnamed Webhook"}
        </Text>
        <Text textStyle={{ base: "sm", mdOnly: "xs" }} color="fg.muted">
          Last Updated: {updatedAt}
        </Text>
      </VStack>
    </DangerCard>
  );
};

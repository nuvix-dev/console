"use client";
import { GenericSkeletonLoader } from "@/components/editor/components/GenericSkeleton";
import ErrorPage from "@/components/others/page-error";
import { rootKeys } from "@/lib/keys";
import { sdkForConsole } from "@/lib/sdk";
import { useProjectStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import {
  DeleteWebhook,
  UpdateName,
  UpdateEvents,
  UpdateStatus,
  UpdateUrl,
  SignatureKey,
} from "./components";
import { UpdateSecurity } from "./components/_update_security";

export const WebhookPage = ({ webhookId }: { webhookId: string }) => {
  const project = useProjectStore.use.project?.();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: rootKeys.webhook(project?.$id!, webhookId),
    queryFn: () => sdkForConsole.projects.getWebhook(project?.$id!, webhookId),
    enabled: !!project,
  });

  if (isError) {
    return <ErrorPage error={error} />;
  }

  return (
    <>
      <GenericSkeletonLoader isLoaded={!isLoading} />

      {data && !isLoading && (
        <>
          <UpdateStatus webhook={data} />
          <UpdateName webhook={data} />
          <SignatureKey webhook={data} />
          <UpdateUrl webhook={data} />
          <UpdateEvents webhook={data} />
          <UpdateSecurity webhook={data} />
          <DeleteWebhook webhook={data} />
        </>
      )}
    </>
  );
};

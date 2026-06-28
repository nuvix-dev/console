import { PageContainer } from "@/components/others";
import { WebhookPage } from "@/components/project/settings/webhooks/single";
import { PropsWithParams } from "@/types";
import React from "react";

const WebhookViewPage: React.FC<PropsWithParams<{ webhookId: string }>> = async ({ params }) => {
  const { webhookId } = await params;
  return (
    <PageContainer>
      <WebhookPage webhookId={webhookId} />
    </PageContainer>
  );
};

export default WebhookViewPage;

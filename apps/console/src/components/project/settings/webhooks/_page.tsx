"use client";
import React from "react";
import { useProjectStore } from "@/lib/store";
import { sdkForConsole } from "@/lib/sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageContainer, PageHeading } from "@/components/others";
import { EmptyState } from "@/components/_empty_state";
import { DataGridProvider, DateTimeColumn, Table } from "@/ui/data-grid";
import { Models } from "@nuvix/console";
import { ColumnDef } from "@tanstack/react-table";
import { Text } from "@nuvix/ui/components";
import { rootKeys } from "@/lib/keys";
import { CreateWebhookButton } from "./components/_create";

const WebhooksPage: React.FC = () => {
  const project = useProjectStore.use.project?.();
  const queryClient = useQueryClient();
  const permissions = useProjectStore.use.permissions()();
  const canCreateWebhooks = permissions.canCreateWebhooks;

  const fetcher = async () => {
    if (!project?.$id) return { data: [], total: 0 } as Models.WebhookList;
    return sdkForConsole.projects.listWebhooks(project.$id);
  };

  const { data, isFetching } = useQuery({
    queryKey: rootKeys.webhooks(project?.$id!),
    queryFn: fetcher,
    enabled: !!project?.$id,
    staleTime: 1000 * 60 * 2,
  });

  const columns: ColumnDef<Models.Webhook>[] = [
    {
      header: "Name",
      accessorKey: "name",
      minSize: 200,
      cell({ getValue }) {
        const name = getValue<string>();
        return <Text weight="strong">{name}</Text>;
      },
      meta: {
        href: (row) => `/project/${project?.$id}/s/webhooks/${row.$id}`,
      },
    },
    {
      header: "URL",
      accessorKey: "url",
      minSize: 250,
      cell({ getValue }) {
        const url = getValue<string>();
        return (
          <Text size="s" truncate onBackground="neutral-medium">
            {url}
          </Text>
        );
      },
    },
    {
      header: "Events",
      accessorKey: "events",
      minSize: 200,
      cell({ getValue }) {
        const events = getValue<string[]>();
        return (
          <Text variant="body-default-m" onBackground="neutral-medium">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </Text>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "enabled",
      minSize: 100,
      cell({ getValue }) {
        const enabled = getValue<boolean>();
        return (
          <Text
            variant="body-default-m"
            className={`text-sm font-medium ${enabled ? "text-green-600" : "text-gray-500"}`}
          >
            {enabled ? "Active" : "Disabled"}
          </Text>
        );
      },
    },
    {
      header: "Last Updated",
      accessorKey: "$updatedAt",
      minSize: 150,
      cell({ getValue }) {
        const value = getValue<string>();
        if (!value) {
          return (
            <Text variant="body-default-m" onBackground="neutral-medium">
              Never
            </Text>
          );
        }
        return <DateTimeColumn getValue={getValue} />;
      },
    },
  ];

  const create = canCreateWebhooks ? (
    <CreateWebhookButton
      onCreated={() => {
        queryClient.invalidateQueries({
          queryKey: rootKeys.webhooks(project?.$id!),
        });
      }}
    />
  ) : null;

  return (
    <PageContainer>
      <PageHeading
        heading="Webhooks"
        description="Manage your webhooks here. Subscribe to events and trigger external services."
        right={create}
      />

      <DataGridProvider<Models.Webhook>
        columns={columns}
        data={data?.data ?? []}
        loading={isFetching}
      >
        <EmptyState
          show={data?.total === 0 && !isFetching}
          title="Add your first webhook"
          description="Create webhooks to receive real-time notifications when events occur in your project."
          primaryComponent={create ?? undefined}
        />
        {data?.total! > 0 && !isFetching && <Table />}
      </DataGridProvider>
    </PageContainer>
  );
};

export { WebhooksPage };

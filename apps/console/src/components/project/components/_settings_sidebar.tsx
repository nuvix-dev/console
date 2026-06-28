import { useProjectStore } from "@/lib/store";
import { Line } from "@nuvix/ui/components";
import { SidebarGroup } from "@/ui/layout/navigation";
import { usePathname } from "next/navigation";

const SettingsSidebar = () => {
  const project = useProjectStore.use.project?.();
  const path = usePathname();

  const resolveHref = (value?: string) => `/project/${project?.$id}/s${value ? `/${value}` : ""}`;
  const resolveIsSelected = (value?: string) => path.includes(resolveHref(value));

  return (
    <>
      <SidebarGroup
        items={[
          {
            label: "General",
            href: resolveHref("general"),
            isSelected: resolveIsSelected("general"),
          },
          {
            label: "Webhooks",
            href: resolveHref("webhooks"),
            isSelected: resolveIsSelected("webhooks"),
          },
          {
            label: "Platforms",
            href: resolveHref("apps"),
            isSelected: resolveIsSelected("apps"),
          },
          {
            label: "Keys",
            href: resolveHref("keys"),
            isSelected: resolveIsSelected("keys"),
          },
        ]}
      />
      <Line />
      <SidebarGroup
        title="Configuration"
        items={[
          // {
          //   label: "Custom Domains",
          //   href: resolveHref("domains"),
          //   isSelected: resolveIsSelected("domains"),
          // },
          {
            label: "Smtp",
            href: resolveHref("smtp"),
            isSelected: resolveIsSelected("smtp"),
          },
        ]}
      />
      {/* <Line />
      <SidebarGroup
        title="OTHER"
        items={[
          {
            label: "Migrations",
            href: resolveHref("migrations"),
            isSelected: resolveIsSelected("migrations"),
          },
          {
            label: "Usage",
            href: resolveHref("usage"),
            isSelected: resolveIsSelected("usage"),
          },
        ]}
      /> */}
    </>
  );
};

export { SettingsSidebar };

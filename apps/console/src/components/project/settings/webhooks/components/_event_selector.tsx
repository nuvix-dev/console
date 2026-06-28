import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Chip, IconButton, Input, Row, Tag, Text } from "@nuvix/ui/components";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@nuvix/sui/components/dialog";

export type EventService = {
  name: string;
  resources: EventResource[];
  actions?: EventAction[];
};

export type EventResource = {
  name: string;
  actions?: EventAction[];
};

export type EventAction = {
  name: string;
  columns?: string[];
};

const eventServices: Array<EventService> = [
  {
    name: "buckets",
    resources: [
      {
        name: "files",
        actions: [{ name: "create" }, { name: "update" }, { name: "delete" }],
      },
    ],
    actions: [{ name: "create" }, { name: "update" }, { name: "delete" }],
  },
  {
    name: "schemas",
    resources: [
      {
        name: "collections",
        actions: [{ name: "create" }, { name: "update" }, { name: "delete" }],
      },
      {
        name: "documents",
        actions: [{ name: "create" }, { name: "update" }, { name: "delete" }],
      },
    ],
    actions: [{ name: "create" }, { name: "update" }, { name: "delete" }],
  },
  {
    name: "teams",
    resources: [
      {
        name: "memberships",
        actions: [{ name: "create" }, { name: "update", columns: ["status"] }, { name: "delete" }],
      },
    ],
    actions: [{ name: "create" }, { name: "update" }, { name: "delete" }],
  },
  {
    name: "users",
    resources: [
      {
        name: "recovery",
        actions: [{ name: "create" }, { name: "delete" }],
      },
      {
        name: "sessions",
        actions: [{ name: "create" }, { name: "delete" }],
      },
      {
        name: "verification",
        actions: [{ name: "create" }, { name: "delete" }],
      },
    ],
    actions: [
      { name: "create" },
      { name: "update", columns: ["email", "name", "password", "status", "prefs"] },
      { name: "delete" },
    ],
  },
  {
    name: "providers",
    resources: [],
    actions: [{ name: "create" }, { name: "update" }, { name: "delete" }],
  },
  {
    name: "topics",
    resources: [
      {
        name: "subscribers",
        actions: [{ name: "create" }, { name: "delete" }],
      },
    ],
    actions: [{ name: "create" }, { name: "update" }, { name: "delete" }],
  },
  {
    name: "messages",
    resources: [],
    actions: [{ name: "create" }, { name: "update" }, { name: "delete" }],
  },
];

const serviceNames = eventServices.map((service) => service.name);
const resourceNames = eventServices.flatMap((service) =>
  service.resources.map((resource) => resource.name),
);
const actionNames = [
  ...eventServices.flatMap((service) => service.actions?.map((item) => item.name) ?? []),
  ...eventServices.flatMap((service) =>
    service.resources.flatMap((resource) => resource.actions?.map((item) => item.name) ?? []),
  ),
];
const columnNames = [
  ...eventServices.flatMap(
    (service) => service.actions?.flatMap((action) => action.columns ?? []) ?? [],
  ),
  ...eventServices.flatMap((service) =>
    service.resources.flatMap(
      (resource) => resource.actions?.flatMap((action) => action.columns ?? []) ?? [],
    ),
  ),
];

const isService = (value: string) => serviceNames.includes(value);
const isResource = (value: string) => resourceNames.includes(value);
const isAction = (value: string) => actionNames.includes(value);
const isColumn = (value: string) => columnNames.includes(value);

const at = <T,>(array: T[], index: number): T | undefined => array[index];

const singular = (value: string | undefined) => {
  if (!value) return "";
  return value.endsWith("s") ? value.slice(0, -1) : value;
};

interface EventSelectorProps {
  isOpen: boolean;
  onOpenChange: (o: boolean) => void;
  initialValue?: string;
  onCreated?: (eventValue: string) => void;
}

type SelectedState = {
  service: EventService | null;
  resource: EventResource | null;
  action: EventAction | null;
  column: string | null;
};

export function EventSelector({
  isOpen,
  onOpenChange,
  initialValue,
  onCreated,
}: EventSelectorProps) {
  const [selected, setSelected] = useState<SelectedState>({
    service: null,
    resource: null,
    action: null,
    column: null,
  });
  const [showInput, setShowInput] = useState(false);
  const [customInput, setCustomInput] = useState<string | null>(null);
  const [helper, setHelper] = useState<string | null>(null);
  const [customInputCursor, setCustomInputCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const inferSelectedFromCustomInput = useCallback((input: string | null): SelectedState => {
    const nextSelected: SelectedState = {
      service: null,
      resource: null,
      action: null,
      column: null,
    };

    if (!input) {
      return nextSelected;
    }

    for (const field of input.split(".")) {
      if (isService(field)) {
        nextSelected.service = eventServices.find((service) => service.name === field) ?? null;
      } else if (isResource(field)) {
        nextSelected.resource =
          nextSelected.service?.resources.find((resource) => resource.name === field) ?? null;
      } else if (isAction(field)) {
        nextSelected.action =
          nextSelected.resource?.actions?.find((action) => action.name === field) ||
          nextSelected.service?.actions?.find((action) => action.name === field) ||
          null;
      } else if (isColumn(field)) {
        nextSelected.column =
          nextSelected.action?.columns?.find((column) => column === field) ?? null;
      }
    }

    return nextSelected;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSelected({ service: null, resource: null, action: null, column: null });
      setCustomInput(null);
      setShowInput(false);
      setHelper(null);
      setCustomInputCursor(-1);
      return;
    }

    if (initialValue) {
      setCustomInput(initialValue);
      setSelected(inferSelectedFromCustomInput(initialValue));
    }
  }, [isOpen, initialValue, inferSelectedFromCustomInput]);

  const available = useMemo(() => {
    const resources = selected.service?.resources ?? [];
    const actions = selected.resource
      ? (selected.resource.actions ?? [])
      : (selected.service?.actions ?? []);
    const columns = selected.action?.columns ?? [];

    return {
      services: eventServices,
      resources,
      actions,
      columns,
    };
  }, [selected]);

  const getHelperStr = useCallback((fields: string[], index: number) => {
    const currField = at(fields, index);
    const prevField = at(fields, index - 1);
    const secondToLastField = at(fields, index - 2);

    if (index === 0 || isService(currField ?? "")) return "service";
    if (isColumn(currField ?? "") || isAction(prevField ?? "")) return "attribute";
    if (isAction(currField ?? "")) return "action";
    if (isResource(currField ?? "")) return "resource";
    if (isService(prevField ?? "") || isResource(prevField ?? "") || index === 1) {
      return `ID of ${singular(prevField)}`;
    }
    if (isService(secondToLastField ?? "") || index === 2) return "resource or action";
    if (isResource(secondToLastField ?? "")) return "action";

    return "";
  }, []);

  const getCustomInputHelperStr = useCallback(
    (input: string, selectionStart: number) => {
      const fields = input.split(".");
      let fieldIndex = -1;

      if (selectionStart > -1) {
        let currentIndex = 0;
        let arrayIndex = 0;

        for (const item of fields) {
          currentIndex += item.length + 1;
          if (currentIndex > selectionStart) {
            fieldIndex = arrayIndex;
            break;
          }
          arrayIndex += 1;
        }
      }

      return getHelperStr(fields, fieldIndex);
    },
    [getHelperStr],
  );

  const eventString = useMemo(() => {
    if (showInput) {
      return [];
    }

    const fields: string[] = [];

    if (customInput) {
      return customInput.split(".").map((value, index, arr) => ({
        value,
        description: getHelperStr(arr, index),
      }));
    }

    if (selected.service) {
      fields.push(selected.service.name, "*");
    }

    if (selected.resource?.name === "rows") {
      fields.push("tables", "*");
    }

    if (selected.resource) {
      fields.push(selected.resource.name, "*");
    }

    if (selected.action) {
      fields.push(selected.action.name);
    }

    if (selected.column) {
      fields.push(selected.column);
    }

    return fields.map((value, index, arr) => ({
      value,
      description: getHelperStr(arr, index),
    }));
  }, [customInput, getHelperStr, selected, showInput]);

  const inputValue = useMemo(() => {
    if (showInput) {
      return customInput ?? "";
    }

    return eventString.map((item) => item.value).join(".");
  }, [customInput, eventString, showInput]);

  useEffect(() => {
    if (!showInput) {
      setHelper(null);
      return;
    }

    setHelper(getCustomInputHelperStr(customInput ?? "", customInputCursor));
  }, [customInput, customInputCursor, getCustomInputHelperStr, showInput]);

  const resetSelected = useCallback(() => {
    setSelected({ service: null, resource: null, action: null, column: null });
  }, []);

  const toggleShowInput = (event?: React.MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    const nextState = !showInput;
    setShowInput(nextState);

    if (!nextState) {
      setHelper(null);
      setSelected(inferSelectedFromCustomInput(customInput));
    }
  };

  const select = useCallback(
    (
      field: "service" | "resource" | "action" | "attribute",
      value: EventService | EventResource | EventAction | string,
    ) => {
      setSelected((current) => {
        const next = { ...current };

        if (typeof value === "string") {
          next.column = next.column === value ? null : value;
        } else {
          if (next[field as "service" | "resource" | "action"]?.name === value.name) {
            next[field as "service" | "resource" | "action"] = null;
          } else {
            next[field as keyof typeof next] = value as any;
          }
        }

        if (field === "service") {
          next.resource = null;
          next.action = null;
          next.column = null;
        }

        if (field === "resource") {
          const availableActions = next.resource
            ? (next.resource.actions ?? [])
            : (next.service?.actions ?? []);

          const availableAction = availableActions.find(
            (action) => action.name === next.action?.name,
          );

          if (!availableAction) {
            next.action = null;
            next.column = null;
          } else {
            next.action = availableAction;
            if (!next.action.columns?.includes(next.column ?? "")) {
              next.column = null;
            }
          }
        }

        if (field === "action") {
          next.column = null;
        }

        return next;
      });

      setCustomInput(null);
    },
    [],
  );

  const create = () => {
    if (!inputValue) return;
    onCreated?.(inputValue);
    onOpenChange(false);
  };

  const handleInputSelect = (event: React.SyntheticEvent<HTMLInputElement>) => {
    setCustomInputCursor(event.currentTarget.selectionStart ?? -1);
  };

  const handleEdit = () => {
    setCustomInput(inputValue);
    setShowInput(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogClose />
        <DialogHeader>
          <DialogTitle>{initialValue ? "Edit event" : "Create event"}</DialogTitle>
          <DialogDescription>
            Select the events you want to subscribe to for this webhook.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="space-y-4">
            <div className="space-y-2 flex flex-col">
              <Text variant="label-strong-s">Choose a service</Text>
              <div className="flex flex-wrap gap-2">
                {available.services.map((service) => (
                  <Chip
                    key={service.name}
                    label={service.name}
                    selected={selected.service?.name === service.name}
                    onClick={() => !showInput && select("service", service)}
                    disabled={showInput}
                  />
                ))}
              </div>
            </div>

            {available.resources.length > 0 && (
              <div className="space-y-2 flex flex-col">
                <Text variant="label-strong-s">Choose a resource (optional)</Text>
                <div className="flex flex-wrap gap-2">
                  {available.resources.map((resource) => (
                    <Chip
                      key={resource.name}
                      label={resource.name}
                      selected={selected.resource?.name === resource.name}
                      onClick={() => !showInput && select("resource", resource)}
                      disabled={showInput}
                    />
                  ))}
                </div>
              </div>
            )}

            {available.actions.length > 0 && (
              <div className="space-y-2 flex flex-col">
                <Text variant="label-strong-s">Choose an action (optional)</Text>
                <div className="flex flex-wrap gap-2">
                  {available.actions.map((action) => (
                    <Chip
                      key={action.name}
                      label={action.name}
                      selected={selected.action?.name === action.name}
                      onClick={() => !showInput && select("action", action)}
                      disabled={showInput}
                    />
                  ))}
                </div>
              </div>
            )}

            {available.columns.length > 0 && (
              <div className="space-y-2">
                <Text variant="label-strong-s">Choose an attribute (optional)</Text>
                <div className="flex flex-wrap gap-2">
                  {available.columns.map((column) => (
                    <Tag
                      key={column}
                      variant={selected.column === column ? "brand" : "neutral"}
                      onClick={() => !showInput && select("attribute", column)}
                    >
                      {column}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 flex flex-col">
              <Text variant="label-strong-s">Event string</Text>
              <Input
                ref={inputRef}
                value={showInput ? (customInput ?? "") : inputValue}
                placeholder="Enter custom event"
                labelAsPlaceholder
                readOnly={!showInput}
                onChange={(event) => setCustomInput(event.target.value)}
                onSelect={handleInputSelect}
                hasSuffix={
                  <div className="flex gap-2">
                    {showInput ? (
                      <>
                        <Button size="s" variant="secondary" onClick={toggleShowInput}>
                          Save
                        </Button>
                        <Button size="s" variant="tertiary" onClick={toggleShowInput}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <IconButton
                          size="m"
                          variant="secondary"
                          onClick={handleEdit}
                          icon="edit"
                          tooltip="Edit"
                        />

                        <IconButton
                          size="m"
                          icon="clipboard"
                          variant="secondary"
                          onClick={() => navigator.clipboard.writeText(inputValue)}
                          disabled={!inputValue}
                          tooltip="Copy"
                        />
                      </>
                    )}
                  </div>
                }
              />
              {showInput && helper ? (
                <Text variant="body-default-s" onBackground="neutral-weak">
                  {helper}
                </Text>
              ) : null}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Row horizontal="end" gap="4">
            <Button variant="secondary" size="s" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={showInput || !inputValue} size="s" onClick={create}>
              {initialValue ? "Update" : "Create"}
            </Button>
          </Row>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

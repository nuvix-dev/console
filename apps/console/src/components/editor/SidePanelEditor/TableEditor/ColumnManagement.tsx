import { isEmpty, noop, partition } from "lodash";
import { Key } from "lucide-react";
import { useState } from "react";
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  Droppable,
  DroppableProvided,
} from "react-beautiful-dnd";

import InformationBox from "@/ui/InformationBox";
import type { EnumeratedType } from "@/data/enumerated-types/enumerated-types-query";
// import { useSendEventMutation } from "@/data/telemetry/send-event-mutation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@nuvix/sui/components/tooltip";

import { generateColumnField } from "../ColumnEditor/ColumnEditor.utils";
import { ForeignKeySelector } from "../ForeignKeySelector/ForeignKeySelector";
import type { ForeignKey } from "../ForeignKeySelector/ForeignKeySelector.types";
import { TEXT_TYPES } from "../SidePanelEditor.constants";
import type { ColumnField, ExtendedPostgresRelationship } from "../SidePanelEditor.types";
import Column from "./Column";
import type { ImportContent, TableField } from "./TableEditor.types";
import { useParams } from "next/navigation";
import { Button, Icon } from "@nuvix/ui/components";
import { Admonition } from "@/ui/admonition";
import { useCheckSchemaType } from "@/hooks/useProtectedSchemas";
import { useQuerySchemaState } from "@/hooks/useSchemaQueryState";
import AlertError from "@/components/others/ui/alert-error";

interface ColumnManagementProps {
  table: TableField;
  columns?: ColumnField[];
  relations: ForeignKey[];
  enumTypes: EnumeratedType[];
  importContent?: ImportContent;
  isNewRecord: boolean;
  onColumnsUpdated: (columns: ColumnField[]) => void;
  onSelectImportData: () => void;
  onClearImportContent: () => void;
  onUpdateFkRelations: (relations: ForeignKey[]) => void;
}

const ColumnManagement = ({
  table,
  columns = [],
  relations,
  enumTypes = [],
  importContent,
  isNewRecord,
  onColumnsUpdated = noop,
  onSelectImportData = noop,
  onClearImportContent = noop,
  onUpdateFkRelations,
}: ColumnManagementProps) => {
  const { id: projectRef } = useParams();
  // const org = useSelectedOrganization();

  const [open, setOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<ColumnField>();
  const [selectedFk, setSelectedFk] = useState<ForeignKey>();
  const { selectedSchema } = useQuerySchemaState();
  const { isSchemaType: isManagedSchema } = useCheckSchemaType({
    schema: selectedSchema,
    type: "managed",
  });

  // const { mutate: sendEvent } = useSendEventMutation();

  const hasImportContent = !isEmpty(importContent);
  const [primaryKeyColumns, otherColumns] = partition(
    columns,
    (column: ColumnField) => column.isPrimaryKey,
  );

  const checkIfHaveForeignKeys = (column: ColumnField) => {
    return (
      relations.find((relation) => relation.columns.find((x) => x.source === column.name)) !==
      undefined
    );
  };

  const onUpdateColumn = (columnToUpdate: ColumnField, changes: Partial<ColumnField>) => {
    const updatedColumns = columns.map((column: ColumnField) => {
      if (column.id === columnToUpdate.id) {
        const isTextBasedColumn = TEXT_TYPES.includes(columnToUpdate.format);
        if (!isTextBasedColumn && changes.defaultValue === "") {
          changes.defaultValue = null;
        }

        if ("name" in changes && column.foreignKey !== undefined) {
          const foreignKey: ExtendedPostgresRelationship = {
            ...column.foreignKey,
            source_column_name: changes?.name ?? "",
          };
          return { ...column, ...changes, foreignKey };
        }
        return { ...column, ...changes };
      } else {
        return column;
      }
    });
    onColumnsUpdated(updatedColumns);
  };

  const onAddColumn = () => {
    const defaultColumn = generateColumnField();
    const updatedColumns = columns.concat(defaultColumn);
    onColumnsUpdated(updatedColumns);
  };

  const onRemoveColumn = (columnToRemove: ColumnField) => {
    const updatedColumns = columns.filter((column: ColumnField) => column.id !== columnToRemove.id);
    onColumnsUpdated(updatedColumns);
  };

  const onSortColumns = (result: any, type: "pks" | "others") => {
    // Dropped outside of the list
    if (!result.destination) {
      return;
    }

    if (type === "pks") {
      const updatedPrimaryKeyColumns = primaryKeyColumns.slice();
      const [removed] = updatedPrimaryKeyColumns.splice(result.source.index, 1);
      updatedPrimaryKeyColumns.splice(result.destination.index, 0, removed);
      const updatedColumns = updatedPrimaryKeyColumns.concat(otherColumns);
      return onColumnsUpdated(updatedColumns);
    }

    if (type === "others") {
      const updatedOtherColumns = otherColumns.slice();
      const [removed] = updatedOtherColumns.splice(result.source.index, 1);
      updatedOtherColumns.splice(result.destination.index, 0, removed);
      const updatedColumns = primaryKeyColumns.concat(updatedOtherColumns);
      return onColumnsUpdated(updatedColumns);
    }
  };

  return (
    <>
      <div className="w-full !space-y-4 table-editor-columns">
        <div className="flex items-center justify-between w-full">
          <h5>Columns</h5>
          <div className="flex items-center gap-x-2">
            <Button
              size="s"
              variant="secondary"
              type="button"
              prefixIcon={"externalLink"}
              href="https://nuvix.in/docs/guides/database/tables#data-types"
              target="_blank"
              rel="noreferrer"
            >
              About data types
            </Button>
            {isNewRecord && (
              <>
                <div className="py-3 border-r" />
                {hasImportContent ? (
                  <div className="flex items-center gap-x-2">
                    <Button
                      size="s"
                      variant="secondary"
                      type="button"
                      prefixIcon={"edit"}
                      onClick={onSelectImportData}
                    >
                      Edit content
                    </Button>
                    <Button
                      size="s"
                      variant="danger"
                      type="button"
                      prefixIcon={"trash"}
                      onClick={onClearImportContent}
                    >
                      Remove content
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="s"
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      onSelectImportData();
                      // sendEvent({
                      //   action: "import_data_button_clicked",
                      //   properties: { tableType: "New Table" },
                      //   groups: {
                      //     project: projectRef ?? "Unknown",
                      //     organization: org?.slug ?? "Unknown",
                      //   },
                      // });
                    }}
                  >
                    Import data from CSV
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {hasImportContent && (
          <p className="text-sm neutral-on-background-medium my-2">
            Your table will be created with {importContent?.rowCount?.toLocaleString()} rows and the
            following {columns.length} columns.
          </p>
        )}

        {primaryKeyColumns.length === 0 && (
          <Admonition
            type="warning"
            title="Warning: No primary keys selected"
            description="Tables should have at least one column as the primary key to identify each row. Without a primary key, you will not be able to update or delete rows from the table."
          />
        )}

        {primaryKeyColumns.length > 1 &&
          (isManagedSchema && primaryKeyColumns.some((col) => col.name === "_id") ? (
            <AlertError
              subject="Error: can not use '_id' column in composite primary key"
              error={{
                message:
                  "In managed schemas, the '_id' column is reserved and cannot be used as part of a composite primary key. Please select different columns for the primary key.",
              }}
              showSupportLink={false}
            />
          ) : (
            <InformationBox
              block
              icon={Key}
              title="Composite primary key selected"
              description="The columns that you've selected will be grouped as a primary key, and will serve as the unique identifier for the rows in your table"
            />
          ))}

        <div className="space-y-2">
          {/* Headers */}
          <div className="flex w-full px-3">
            {/* Drag handle */}
            {isNewRecord && <div className="w-[5%]" />}
            <div className="w-[25%] flex items-center">
              <h5 className="text-xs neutral-on-background-weak !mr-2">Name</h5>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Icon name="helpCircle" size="xs" onBackground="neutral-weak" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="w-[300px]">
                  Recommended to use lowercase and use an underscore to separate words e.g.
                  column_name
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="w-[25%]">
              <h5 className="text-xs neutral-on-background-weak">Type</h5>
            </div>
            <div className={`${isNewRecord ? "w-[25%]" : "w-[30%]"} flex items-center`}>
              <h5 className="text-xs neutral-on-background-weak !mr-2">Default Value</h5>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Icon name="helpCircle" size="xs" onBackground="neutral-weak" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="w-[300px]">
                  Can either be a literal or an expression. When using an expression wrap your
                  expression in brackets, e.g. (gen_random_uuid())
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="w-[10%]">
              <h5 className="text-xs neutral-on-background-weak">Primary</h5>
            </div>
            {/* Empty space */}
            <div className={`${hasImportContent ? "w-[10%]" : "w-0"}`} />
            {/* More config button */}
            <div className="w-[5%]" />
            {/* Delete button */}
            {!hasImportContent && <div className="w-[5%]" />}
          </div>

          {primaryKeyColumns.length > 0 && (
            <DragDropContext onDragEnd={(result: any) => onSortColumns(result, "pks")}>
              <Droppable droppableId="pk_columns_droppable">
                {(droppableProvided: DroppableProvided) => (
                  <div
                    ref={droppableProvided.innerRef}
                    className={`space-y-2 rounded-md flex flex-col bg-[var(--neutral-alpha-weak)] px-3 py-2 ${
                      isNewRecord ? "" : "-mx-3"
                    }`}
                  >
                    {primaryKeyColumns.map((column: ColumnField, index: number) => (
                      <Draggable key={column.id} draggableId={column.id} index={index}>
                        {(draggableProvided: DraggableProvided) => (
                          <div
                            ref={draggableProvided.innerRef}
                            {...(draggableProvided.draggableProps as object)}
                          >
                            <Column
                              column={column}
                              relations={relations.filter((relation) => {
                                return relation.columns.some((x) => x.source === column.name);
                              })}
                              enumTypes={enumTypes}
                              hasForeignKeys={checkIfHaveForeignKeys(column)}
                              isNewRecord={isNewRecord}
                              hasImportContent={hasImportContent}
                              dragHandleProps={draggableProvided.dragHandleProps}
                              onUpdateColumn={(changes) => onUpdateColumn(column, changes)}
                              onRemoveColumn={() => onRemoveColumn(column)}
                              onEditForeignKey={(fk) => {
                                setOpen(true);
                                setSelectedColumn(column);
                                if (fk) setSelectedFk(fk);
                              }}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {droppableProvided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}

          <DragDropContext onDragEnd={(result: any) => onSortColumns(result, "others")}>
            <Droppable droppableId="other_columns_droppable">
              {(droppableProvided: DroppableProvided) => (
                <div
                  ref={droppableProvided.innerRef}
                  className={`space-y-2 py-2 flex flex-col ${isNewRecord ? "px-3 " : ""}`}
                >
                  {otherColumns.map((column: ColumnField, index: number) => (
                    <Draggable key={column.id} draggableId={column.id} index={index}>
                      {(draggableProvided: DraggableProvided) => (
                        <div
                          ref={draggableProvided.innerRef}
                          {...(draggableProvided.draggableProps as object)}
                        >
                          <Column
                            column={column}
                            relations={relations.filter((relation) => {
                              return relation.columns.some((x) => x.source === column.name);
                            })}
                            enumTypes={enumTypes}
                            isNewRecord={isNewRecord}
                            hasForeignKeys={checkIfHaveForeignKeys(column)}
                            hasImportContent={hasImportContent}
                            dragHandleProps={draggableProvided.dragHandleProps}
                            onUpdateColumn={(changes) => onUpdateColumn(column, changes)}
                            onRemoveColumn={() => onRemoveColumn(column)}
                            onEditForeignKey={(fk) => {
                              setOpen(true);
                              setSelectedColumn(column);
                              if (fk) setSelectedFk(fk);
                            }}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {droppableProvided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {!hasImportContent && (
          <div className="flex items-center justify-center rounded border border-strong border-dashed py-3">
            <Button variant="secondary" size="s" onClick={() => onAddColumn()}>
              Add column
            </Button>
          </div>
        )}
      </div>

      <ForeignKeySelector
        visible={open}
        column={selectedColumn}
        table={{ id: table.id, name: table.name, columns: table.columns }}
        foreignKey={selectedFk}
        onClose={() => {
          setOpen(false);
          setSelectedFk(undefined);
          setSelectedColumn(undefined);
        }}
        onSaveRelation={(fk) => {
          const existingRelationIds = relations.map((x) => x.id);
          if (fk.id !== undefined && existingRelationIds.includes(fk.id)) {
            onUpdateFkRelations(
              relations.map((x) => {
                if (x.id === fk.id) return fk;
                return x;
              }),
            );
          } else {
            onUpdateFkRelations(relations.concat([fk]));
          }
        }}
      />
    </>
  );
};

export default ColumnManagement;

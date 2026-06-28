import { IconButton, Input } from "@nuvix/ui/components";
import { Field } from "formik";
import { GripVertical, Trash } from "lucide-react";
import { Draggable, DraggableProvided } from "react-beautiful-dnd";

interface EnumeratedTypeValueRowProps {
  index: number;
  id: string;
  field: any;
  isDisabled?: boolean;
  onRemoveValue: () => void;
}

const EnumeratedTypeValueRow = ({
  index,
  id,
  field,
  isDisabled = false,
  onRemoveValue,
}: EnumeratedTypeValueRowProps) => {
  return (
    <Draggable draggableId={id} index={index} isDragDisabled={!!isDisabled}>
      {(draggableProvided: DraggableProvided) => (
        <div
          ref={draggableProvided.innerRef}
          {...(draggableProvided.draggableProps as object)}
          className="flex items-center space-x-2 space-y-2"
        >
          <div
            {...draggableProvided.dragHandleProps}
            className={`opacity-50 hover:opacity-100 transition ${
              isDisabled ? "neutral-on-background-weak !cursor-default" : "text-foreground"
            }`}
          >
            <GripVertical size={16} strokeWidth={1.5} />
          </div>
          <Field name={field} as={Input} labelAsPlaceholder height="s" />
          <IconButton
            type="button"
            size="s"
            variant="ghost"
            disabled={isDisabled}
            icon={<Trash strokeWidth={1.5} size={16} />}
            onClick={() => onRemoveValue()}
          />
        </div>
      )}
    </Draggable>
  );
};

export default EnumeratedTypeValueRow;

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Maximize2, PanelRight, X } from "lucide-react";

export function ChatSurfaceActions({
  expanded,
  onExpandedChange,
  onClose,
}: {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onClose: () => void;
}) {
  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={expanded ? "Collapse to side panel" : "Expand panel"}
              onClick={() => onExpandedChange(!expanded)}
            />
          }
        >
          {expanded ? <PanelRight /> : <Maximize2 />}
        </TooltipTrigger>
        <TooltipContent>
          {expanded ? "Collapse to side panel" : "Expand panel"}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close AI chat"
              onClick={onClose}
            />
          }
        >
          <X />
        </TooltipTrigger>
        <TooltipContent>Close</TooltipContent>
      </Tooltip>
    </>
  );
}

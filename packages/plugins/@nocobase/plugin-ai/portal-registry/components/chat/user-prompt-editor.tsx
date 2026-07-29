import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";
import { useAIChatBase } from "../../providers";

export function UserPromptEditor() {
  const { currentEmployee, saveUserPrompt } = useAIChatBase();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open) return;
    setPrompt(currentEmployee.userConfig?.prompt ?? "");
    setError(undefined);
  }, [currentEmployee.userConfig?.prompt, currentEmployee.username, open]);

  const save = async () => {
    setSaving(true);
    setError(undefined);
    try {
      await saveUserPrompt(prompt);
      setOpen(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save prompt"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Personalized prompt"
                />
              }
            />
          }
        >
          <MessageSquareText />
        </TooltipTrigger>
        <TooltipContent>Personalized prompt</TooltipContent>
      </Tooltip>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] gap-3 p-4"
      >
        <PopoverHeader>
          <PopoverTitle>Personalized prompt</PopoverTitle>
          <PopoverDescription>
            Add instructions that this AI employee should follow when working
            with you.
          </PopoverDescription>
        </PopoverHeader>
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={5}
          className="max-h-52 min-h-28 resize-y"
          placeholder="For example: Keep answers concise and ask before changing data."
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

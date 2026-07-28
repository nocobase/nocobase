import {
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
} from "@/components/ui/select";
import { getAIModelKey, groupAIModels, type AIModel } from "../../providers";
import { Fragment } from "react";

export function AIModelSelectOptions({ models }: { models: AIModel[] }) {
  const groups = groupAIModels(models);

  return groups.map((group, index) => (
    <Fragment key={group.key}>
      {index > 0 ? <SelectSeparator /> : null}
      <SelectGroup className="py-1">
        <SelectLabel className="px-2 py-1.5 font-medium">
          {group.label}
        </SelectLabel>
        {group.models.map((model) => (
          <SelectItem key={getAIModelKey(model)} value={getAIModelKey(model)}>
            <span className="block max-w-64 truncate" title={model.label}>
              {model.label}
            </span>
          </SelectItem>
        ))}
      </SelectGroup>
    </Fragment>
  ));
}

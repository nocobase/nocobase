import { useGetLocale, useSetLocale, useTranslate } from "@refinedev/core";
import { Languages, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useEnabledLocales } from "@/providers/i18n";

export type LanguageSwitcherProps = {
  className?: string;
  label?: ReactNode | false;
  triggerClassName?: string;
};

export function LanguageSwitcher({
  className,
  label,
  triggerClassName,
}: LanguageSwitcherProps) {
  const translate = useTranslate();
  const getLocale = useGetLocale();
  const setLocale = useSetLocale();
  const locales = useEnabledLocales();
  const currentLocale = getLocale();
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string>();
  const resolvedLabel =
    typeof label === "undefined"
      ? translate("language.label", { ns: "nocobase-i18n" }, "Language")
      : label;

  if (locales.length < 2) return null;

  const currentDefinition =
    locales.find(({ locale }) => locale === currentLocale) ?? locales[0];

  return (
    <div className={cn("space-y-2", className)}>
      {resolvedLabel === false ? null : (
        <p className="text-xs font-medium text-muted-foreground">
          {resolvedLabel}
        </p>
      )}
      <Select
        value={currentLocale}
        disabled={switching}
        onValueChange={(value) => {
          if (!value || value === currentLocale) return;
          setSwitching(true);
          setError(undefined);
          Promise.resolve(setLocale(value)).catch((reason) => {
            setError(
              reason instanceof Error
                ? reason.message
                : translate(
                    "language.switchError",
                    { ns: "nocobase-i18n" },
                    "Unable to switch language."
                  )
            );
            setSwitching(false);
          });
        }}
      >
        <SelectTrigger
          className={cn("w-full min-w-52", triggerClassName)}
          aria-label={String(resolvedLabel || "Language")}
        >
          {switching ? <Loader2 className="animate-spin" /> : <Languages />}
          <SelectValue>{currentDefinition?.label ?? currentLocale}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {locales.map((definition) => (
            <SelectItem key={definition.locale} value={definition.locale}>
              {definition.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function LanguageUserMenuItems() {
  const translate = useTranslate();
  const getLocale = useGetLocale();
  const setLocale = useSetLocale();
  const locales = useEnabledLocales();
  const currentLocale = getLocale();

  if (locales.length < 2) return null;

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="min-h-9 gap-2 px-2 text-muted-foreground focus:text-foreground">
          <Languages />
          <span>
            {translate("language.label", { ns: "nocobase-i18n" }, "Language")}
          </span>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="min-w-44">
          <DropdownMenuRadioGroup
            value={currentLocale}
            onValueChange={(value) => {
              if (value && value !== currentLocale) void setLocale(value);
            }}
          >
            {locales.map((definition) => (
              <DropdownMenuRadioItem
                key={definition.locale}
                value={definition.locale}
              >
                {definition.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    </>
  );
}

import { registerTranslationResources } from "@/lib/i18n";
import { usersExample as enUS } from "./en-US";
import { usersExample as zhCN } from "./zh-CN";

registerTranslationResources("app", {
  "en-US": enUS,
  "zh-CN": zhCN,
});

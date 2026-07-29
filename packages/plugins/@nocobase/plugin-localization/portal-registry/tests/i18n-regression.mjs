import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

try {
  await server.ssrLoadModule("/src/locales/index.ts");
  const {
    applySystemLocale,
    getCurrentLocale,
    i18n,
    registerLocaleResources,
    translate,
  } = await server.ssrLoadModule("/src/providers/i18n/runtime.ts");
  const { resolveTranslatableText } =
    await server.ssrLoadModule("/src/lib/i18n.ts");

  await i18n.changeLanguage("en-US");
  assert.equal(translate("resources.users", { ns: "app" }, "Users"), "Users");

  await i18n.changeLanguage("zh-CN");
  assert.equal(translate("resources.users", { ns: "app" }, "Users"), "用户");
  assert.equal(resolveTranslatableText('{{t("Admin")}}'), "管理员");
  assert.equal(
    resolveTranslatableText("Full permissions", { ns: "starter" }),
    "全部权限"
  );

  registerLocaleResources("example-feature", {
    "en-US": { title: "Example" },
    "zh-CN": { title: "示例" },
  });
  assert.equal(
    translate("title", { ns: "example-feature" }, "Example"),
    "示例"
  );

  await applySystemLocale({
    appLang: "en-US",
    enabledLanguages: ["en-US", "zh-CN"],
  });
  assert.equal(getCurrentLocale(), "en-US");

  console.log("NocoBase i18n regression tests passed");
} finally {
  await server.close();
}

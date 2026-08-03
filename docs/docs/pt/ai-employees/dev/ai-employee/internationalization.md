---
title: "Internacionalização de plugins para funcionários de IA"
description: "Apresenta os arquivos de internacionalização, os templates de tradução e as limitações atuais de Tools, Skills e perfis de funcionários de IA integrados do NocoBase."
keywords: "NocoBase,internacionalização de plugins para funcionários de IA,Tool introduction,Skill introduction,locale"
---

# Internacionalização de plugins para funcionários de IA

Os textos da interface de administração de um plugin para funcionários de IA devem acompanhar o idioma atual da interface. Tools e Skills podem usar os arquivos de locale do próprio plugin por meio de `introduction`; os dados do perfil do funcionário seguem um tratamento diferente.

## Quais conteúdos precisam de internacionalização

Normalmente, é necessário internacionalizar os textos exibidos a administradores ou usuários:

- `introduction.title` e `introduction.about` da Tool
- `introduction.title` e `introduction.about` da Skill
- Textos de cartões, modais e botões de ação no frontend

`definition.name`, `definition.description`, as descrições do schema, o corpo da Skill e o prompt de sistema do funcionário de IA são destinados principalmente ao modelo. Não altere o nome estável da Tool nem o conteúdo do fluxo de trabalho apenas para traduzir a interface.

## Traduzir os textos de administração de Tools e Skills

O campo `introduction` de uma Tool pode usar o template de tradução `{{t(...)}}`:

```ts
introduction: {
  title: '{{t("ai.tools.greetDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}',
  about: '{{t("ai.tools.greetDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}',
},
```

Uma Skill usa a mesma sintaxe no frontmatter de `SKILLS.md`:

```yaml
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
```

O valor de `ns` deve corresponder ao namespace de internacionalização realmente usado pelo plugin.

## Adicionar arquivos de idioma

Os arquivos de idioma do plugin ficam no diretório `src/locale/`. Use as mesmas chaves em todos os idiomas e altere apenas os textos correspondentes.

### Adicionar textos em inglês

Adicione os textos a `src/locale/en-US.json`:

```json
{
  "ai.tools.greetDeveloper.title": "Developer name check",
  "ai.tools.greetDeveloper.about": "Validate the developer name before writing a welcome message.",
  "ai.tools.developerChoice.title": "Developer choices",
  "ai.tools.developerChoice.about": "Ask the developer to choose the next plugin capability.",
  "ai.skills.welcomeDeveloper.title": "Developer welcome",
  "ai.skills.welcomeDeveloper.about": "Welcome a developer and ask what plugin capability they want to build."
}
```

### Adicionar textos em chinês

Adicione os textos a `src/locale/zh-CN.json`:

```json
{
  "ai.tools.greetDeveloper.title": "开发者姓名确认",
  "ai.tools.greetDeveloper.about": "在生成欢迎语之前确认开发者姓名。",
  "ai.tools.developerChoice.title": "开发方向选择",
  "ai.tools.developerChoice.about": "让开发者选择下一步要实现的插件能力。",
  "ai.skills.welcomeDeveloper.title": "欢迎开发者",
  "ai.skills.welcomeDeveloper.about": "欢迎开发者，并询问接下来要实现的插件能力。"
}
```

## Limitações atuais do perfil do funcionário de IA

Os campos `nickname`, `position`, `bio` e `greeting` do perfil do funcionário de IA não usam o mecanismo de template `{{t(...)}}` mostrado acima. Atualmente, o runtime dos funcionários integrados traduz essas strings originais no namespace `@nocobase/plugin-ai`; por isso, plugins de terceiros não devem pressupor que um namespace personalizado será aplicado automaticamente.

Se não houver uma lógica adicional de localização, escolha um idioma padrão para o perfil do funcionário e mantenha os textos da interface de Tools, Skills e interações no frontend nos arquivos de locale do próprio plugin.

## Links relacionados

- [Desenvolvimento de plugins para funcionários de IA](./index.md) — volte à visão geral do guia de desenvolvimento
- [Definir uma Tool no servidor](./define-tool.md) — use templates de tradução em `introduction` da Tool
- [Definir uma Skill](./define-skill.md) — use templates de tradução no frontmatter da Skill
- [Definir um funcionário de IA integrado](./define-ai-employee.md) — conheça os campos do perfil do funcionário
- [Adicionar interação no frontend a uma Tool](./frontend-tool-ui.md) — traduza os textos de cartões e modais no frontend

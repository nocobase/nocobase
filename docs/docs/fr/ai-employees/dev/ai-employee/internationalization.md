---
title: "Internationalisation des plugins d’employés IA"
description: "Présentation des fichiers de traduction, des modèles de traduction et des limites actuelles de l’internationalisation des Tools, des Skills et des profils d’employés IA intégrés dans NocoBase."
keywords: "NocoBase,internationalisation plugin employé IA,Tool introduction,Skill introduction,locale"
---

# Internationalisation des plugins d’employés IA

Les textes affichés dans l’interface d’administration d’un plugin d’employé IA doivent suivre la langue active de l’interface. Les Tools et les Skills peuvent utiliser les fichiers de locale du plugin dans leur champ `introduction`. Les profils des employés sont traités différemment.

## Contenus à internationaliser

Il faut généralement internationaliser les textes d’interface présentés aux administrateurs ou aux utilisateurs :

- `introduction.title` et `introduction.about` d’un Tool
- `introduction.title` et `introduction.about` d’un Skill
- les textes des cartes frontend, des fenêtres modales et des boutons d’action

Les champs `definition.name`, `definition.description`, les descriptions de schéma, le contenu des Skills et le prompt système de l’employé IA sont principalement destinés au modèle. Ne modifiez pas le nom stable d’un Tool ni le contenu de son workflow uniquement pour traduire l’interface.

## Traduire les textes d’administration des Tools et des Skills

Le champ `introduction` d’un Tool peut utiliser le modèle de traduction `{{t(...)}}` :

```ts
introduction: {
  title: '{{t("ai.tools.greetDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}',
  about: '{{t("ai.tools.greetDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}',
},
```

Un Skill utilise la même syntaxe dans le frontmatter de `SKILLS.md` :

```yaml
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
```

La valeur de `ns` doit correspondre au namespace d’internationalisation réellement utilisé par le plugin.

## Ajouter les fichiers de langue

Les fichiers de langue du plugin se trouvent dans le répertoire `src/locale/`. Utilisez les mêmes clés dans chaque langue et adaptez uniquement les textes correspondants.

### Ajouter les textes anglais

Ajoutez les entrées suivantes dans `src/locale/en-US.json` :

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

### Ajouter les textes chinois

Ajoutez les entrées suivantes dans `src/locale/zh-CN.json` :

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

## Limites actuelles des profils d’employés IA

Les champs `nickname`, `position`, `bio` et `greeting` du profil d’un employé IA n’utilisent pas le mécanisme `{{t(...)}}` ci-dessus. À l’heure actuelle, le runtime des employés intégrés traduit ces chaînes brutes dans le namespace `@nocobase/plugin-ai`. Un plugin tiers ne doit donc pas supposer que son namespace personnalisé sera appliqué automatiquement.

Sans logique de localisation supplémentaire, choisissez une langue par défaut pour le profil de l’employé. Placez les textes d’interface des Tools, des Skills et des interactions frontend dans les fichiers de locale propres au plugin.

## Liens connexes

- [Développement de plugins pour les employés IA](./index.md) — revenir à la présentation du guide de développement
- [Définir un Tool côté serveur](./define-tool.md) — utiliser un modèle de traduction dans le champ `introduction` d’un Tool
- [Définir un Skill](./define-skill.md) — utiliser un modèle de traduction dans le frontmatter d’un Skill
- [Définir un employé IA intégré](./define-ai-employee.md) — découvrir les champs du profil d’un employé
- [Ajouter une interaction frontend à un Tool](./frontend-tool-ui.md) — traduire les cartes frontend et les fenêtres modales

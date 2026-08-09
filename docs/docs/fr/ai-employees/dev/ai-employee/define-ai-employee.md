---
title: "Définir un employé IA intégré"
description: "Découvrez comment un plugin NocoBase utilise defineAIEmployee, prompt.md et les répertoires skills et tools pour créer un employé IA intégré."
keywords: "NocoBase,employé IA intégré,defineAIEmployee,prompt.md,AIEmployeeOptions,Nathan"
---

# Définir un employé IA intégré

Les travailleurs de l'IA intégrés sont enregistrés auprès du plugin. Lorsque le plug-in est chargé pour la première fois, NocoBase créera l'enregistrement d'employé correspondant et le marquera comme employé intégré ; Les chargements ultérieurs du plug-in mettront à jour les informations par défaut, les mots d'invite, les compétences et les outils de l'employé en fonction du code.

## Deux formats : fichier unique ou répertoire

Lorsque les données sont simples et indépendantes, et que des ressources exclusives ne sont pas nécessaires, un seul fichier peut être utilisé :

```text
src/ai/ai-employees/lina.ts
```

Lorsque vous avez besoin de `prompt.md`, d'une compétence exclusive ou d'un outil exclusif, utilisez le répertoire :

```text
src/ai/ai-employees/nathan/
├── index.ts
├── prompt.md
├── skills/
└── tools/
```

Le format répertoire est plus adapté à la maintenance à long terme.

## Utiliser `defineAIEmployee()`

`index.ts` utilise `defineAIEmployee()` fourni par `@nocobase/ai` :

```ts
import { defineAIEmployee } from '@nocobase/ai';

export default defineAIEmployee({
  username: 'developer-helper-dev-assistant',
  category: 'developer',
  description: 'AI employee for helping developers start NocoBase plugin development.',
  avatar: 'nocobase-002-male',
  nickname: 'Dev Helper',
  position: 'Plugin development guide',
  bio: 'Helps developers understand plugin structure and complete small development tasks.',
  greeting: 'Hello, I can help you start a NocoBase plugin development task. What would you like to build?',
});
```

Les principaux champs sont les suivants :

| Champ | Fonction |
| --- | --- |
| `username` | Identifiant unique de l'employé IA, obligatoire et nécessite une stabilité à long terme |
| `category` | Classification des employés, telle que `developer` ou `business` |
| `description` | Description interne et informations de récupération |
| `avatar` | Logo avatar |
| `nickname` | Le nom affiché à l'utilisateur |
| `position` | Poste |
| `bio` | Introduction |
| `greeting` | Message d'accueil pour nouvelle conversation |
| `systemPrompt` | Mot d'invite du système par défaut |
| `skills` | Nom de la compétence explicitement lié |
| `tools` | Configuration de l'outil explicitement liée |
| `chatSettings` | S'il faut activer les paramètres de discussion tels que la compétence, l'outil et le mode mot d'invite du système |
| `sort` | Tri des employés intégré |

Actuellement, le type de `tools` est un tableau d'objets :

```ts
tools: [
  { name: 'greetDeveloper' },
  { name: 'customDataExporter', autoCall: true }, // customDataExporter 的 scope 必须是 CUSTOM
]
```

`autoCall` est uniquement utilisé pour remplacer l'autorisation d'appel de l'employé AI actuel vers l'outil `CUSTOM`. Pour les outils `GENERAL` et `SPECIFIED`, le moteur d'exécution est toujours basé sur le propre `defaultPermission` de l'outil ; si l'outil `CUSTOM` n'a pas de configuration au niveau des employés, il reviendra également au `defaultPermission` de l'outil.

Les outils découverts automatiquement dans le répertoire seront normalisés en `{ name: 'toolName' }`.

## Placer les prompts longs dans `prompt.md`

Si l'employé d'IA utilise le format d'annuaire, le mot d'invite du système peut être placé dans `prompt.md` au même niveau :

```text
src/ai/ai-employees/dev-helper/prompt.md
```

```md
You are Dev Helper, a NocoBase plugin development guide.

Help the user break a plugin requirement into small, verifiable steps.

When the user asks you to welcome a developer, load the `welcome-developer` skill and follow it.

Never claim that a Tool succeeded before receiving its result.
```

La présence de `prompt.md` écrasera `systemPrompt` dans `index.ts`. Placer de longues invites dans les fichiers Markdown est plus facile à examiner et évite les problèmes d'échappement dans les chaînes de modèles TypeScript.

## Exemple d'employé IA intégré : Nathan

Le profil de l’employé de `packages/plugins/@nocobase/plugin-flow-engine/src/ai/ai-employees/nathan/index.ts` est très court :

```ts
export default defineAIEmployee({
  username: 'nathan',
  category: 'developer',
  description: 'AI employee for coding',
  avatar: 'nocobase-002-male',
  nickname: 'Nathan',
  position: 'Frontend code engineer',
  greeting: 'Hello, I’m Nathan, your frontend code engineer...',
});
```

Les capacités complètes de Nathan proviennent d'autres ressources du même répertoire :

```text
nathan/
├── index.ts
├── prompt.md
└── skills/
    └── frontend-developer/
        ├── SKILLS.md
        └── tools/
            ├── getContextApis.ts
            ├── getContextEnvs.ts
            ├── getContextVars.ts
            ├── lintAndTestJS.ts
            ├── patchJSCode.ts
            ├── readJSCode.ts
            └── writeJSCode.ts
```

Le processus de chargement terminera automatiquement la reliure à trois couches :

1. Les fichiers dans `tools/` sont enregistrés en tant qu'outil
2. L'outil est automatiquement lié à la compétence `frontend-developer`
3. La compétence est automatiquement liée à Nathan

Par conséquent, `index.ts` n’a pas besoin d’être répertorié de manière répétée pour l’ensemble de `skills` et `tools`.

## Liens connexes

- [Développement de plug-ins pour employés d'IA](./index.md) — Comprendre la relation entre les employés d'IA intégrés et les outils et compétences
- [Définir la compétence](./define-skill.md) – Créer des compétences spécifiques aux employés
- [Exemple complet : créer un employé IA intégré](./complete-example.md) — Consultez l'annuaire complet des employés et le processus d'inscription
- [Internationalisation des plugins d’employés IA](./internationalization.md) – Comprendre les différences de localisation entre les informations sur les employés et la rédaction d'outils et de compétences.

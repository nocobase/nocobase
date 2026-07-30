---
title: "Exemple complet : créer un employé IA intégré"
description: "Définissez les Tools, les Skills, le prompt système et un employé IA intégré dans un plugin NocoBase à partir d’un exemple complet."
keywords: "NocoBase,Dev Helper,exemple employé IA,defineTools,defineAIEmployee,SKILLS.md"
---

# Exemple complet : créer un employé IA intégré

Créons un employé IA intégré nommé `Dev Helper`. Lorsqu'un utilisateur dit « Veuillez dire bonjour à Alice », l'employé charge la compétence `welcome-developer`, appelle l'outil `greetDeveloper` pour confirmer le nom, puis génère un message d'accueil dans la langue actuelle de l'utilisateur.

:::tip Lecture préalable

- [Définir un Tool côté serveur](./define-tool.md) — comprendre `defineTools()` et la structure de base d’un Tool
- [Définir un Skill](./define-skill.md) — comprendre `SKILLS.md` et la liaison des Tools
- [Définir un employé IA intégré](./define-ai-employee.md) — comprendre `defineAIEmployee()` et le répertoire d’un employé

:::

## Effet final

Une fois terminé, ce plug-in offrira les fonctionnalités suivantes :

- Créez un employé IA intégré nommé `Dev Helper`
- Lier automatiquement la compétence `welcome-developer` aux employés
- Appelez l'outil `greetDeveloper` via Skill pour confirmer le nom du développeur
- Générez des salutations et des questions de suivi en fonction de la langue que parle actuellement l'utilisateur

<!-- 需要一张 AI 员工管理页中 Dev Helper 被标记为内置员工的截图 -->

## Structure finale du répertoire

```text
src/ai/ai-employees/dev-helper/
├── index.ts
├── prompt.md
└── skills/
    └── welcome-developer/
        ├── SKILLS.md
        └── tools/
            └── greetDeveloper.ts
```

Cet exemple ne nécessite aucun code frontal ni enregistrement manuel dans `src/server/plugin.ts`.

## Étape 1 : définir le Tool

Créez `src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/greetDeveloper.ts` :

```ts
import type { Context } from '@nocobase/actions';
import { defineTools } from '@nocobase/ai';
import { z } from 'zod';

export default defineTools({
  scope: 'SPECIFIED',
  defaultPermission: 'ALLOW',
  introduction: {
    title: '{{t("ai.tools.greetDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}',
    about: '{{t("ai.tools.greetDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}',
  },
  definition: {
    name: 'greetDeveloper',
    description: 'Validate the developer name before the assistant writes a welcome message.',
    schema: z.object({
      name: z.string().min(1).describe('The developer name provided by the user.'),
    }),
  },
  invoke: async (_ctx: Context, args: { name: string }) => {
    return {
      status: 'success',
      content: {
        name: args.name,
      },
    };
  },
});
```

## Étape 2 : définir le Skill

Créez `src/ai/ai-employees/dev-helper/skills/welcome-developer/SKILLS.md` :

```md
---
scope: SPECIFIED
name: welcome-developer
description: Greet a developer by name and guide them to the next NocoBase plugin-development step.
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
---

You welcome developers who are starting NocoBase plugin development.

# Workflow

1. Read the developer name from the user's request.
2. If the name is missing, ask the user for it.
3. Call `greetDeveloper` exactly once.
4. Wait for a tool result with `status: "success"`.
5. Use `content.name` to write a short welcome message in the same language as the user.
6. Ask which plugin capability the developer wants to build next, using the same language as the user.

# Constraints

- Do not invent a name.
- Do not claim the Tool succeeded before receiving its result.
- Write both the welcome message and the follow-up question in the same language as the user.
```

Étant donné que `greetDeveloper.ts` se trouve dans le répertoire `tools/` de la compétence actuelle, il n'est pas nécessaire d'écrire `tools: [greetDeveloper]`.

## Étape 3 : définir le profil de l’employé IA

Créez `src/ai/ai-employees/dev-helper/index.ts` :

```ts
import { defineAIEmployee } from '@nocobase/ai';

export default defineAIEmployee({
  username: 'developer-helper-dev-assistant',
  category: 'developer',
  description: 'AI employee for helping developers start NocoBase plugin development.',
  avatar: 'nocobase-002-male',
  nickname: 'Dev Helper',
  position: 'Plugin development guide',
  bio: 'Welcomes developers and guides them into a small, verifiable plugin-development task.',
  greeting: 'Hello, I can help you begin a NocoBase plugin development task. Who are we welcoming today?',
});
```

`username` est l'identifiant unique dans la base de données. Ne la modifiez pas après la publication, sinon NocoBase traitera la nouvelle valeur comme un autre travailleur IA intégré.

:::warning Attention

`username` doit non seulement être stable, mais doit également éviter d'avoir le même nom que d'autres plug-ins ou des employés d'IA existants. Si le même `username` existe déjà dans la base de données, l'enregistrement correspondant sera mis à jour au chargement du plugin au lieu de créer un nouvel employé isolé les uns des autres.

Lors du rechargement du plug-in, `category`, `nickname`, `position`, `avatar`, `bio`, `greeting`, les mots d'invite système par défaut, les liaisons de compétences et d'outils, `chatSettings` et `sort` dans le code peuvent être réécrits dans la base de données. Il est recommandé aux plug-ins formels d'utiliser des noms avec un préfixe de plug-in, tel que `developer-helper-dev-assistant`.

:::

## Étape 4 : définir le prompt système

Créez `src/ai/ai-employees/dev-helper/prompt.md` :

```md
You are Dev Helper, a NocoBase plugin development guide.

Help users begin with a small, verifiable task.

When the user asks you to greet or welcome a developer, load the `welcome-developer` skill and follow its workflow.

Never claim that a Tool succeeded before receiving its result.
```

À ce stade, la relation de répertoire a été automatiquement liée :

```text
greetDeveloper Tool
  → welcome-developer Skill
  → dev-helper AI employee
```

## Étape 5 : activer et vérifier

Reconstruisez ou redémarrez le service de développement et confirmez que le plugin contenant ces fichiers est activé. Rendez-vous ensuite sur la page de gestion des employés AI pour vérifier :

- Peut voir `Dev Helper`
- Les employés sont marqués comme employés intégrés
- La compétence exclusive de l'employé contient `welcome-developer`
- La compétence peut être utilisée après le chargement de `greetDeveloper`

Dans la conversation, saisissez :

```text
请向 Alice 打个招呼。
```

Le processus attendu est le suivant :

```text
加载 welcome-developer
  → 调用 greetDeveloper({ name: "Alice" })
  → 收到 status: "success" 和 content.name
  → Skill 使用用户当前语言生成问候语
  → 询问接下来要开发什么插件能力
```

Si vous ne souhaitez pas que l'outil demande une confirmation à l'utilisateur avant chaque appel, définissez `defaultPermission: 'ALLOW'`. Pour les outils impliquant une suppression, une modification par lots ou des effets secondaires externes, il est plus approprié de conserver `ASK` par défaut.

## Résumé

| Fichier | Responsabilité |
| --- | --- |
| `greetDeveloper.ts` | Valider l’entrée et renvoyer un résultat de Tool structuré |
| `SKILLS.md` | Définir l’appel du Tool et le déroulement de la réponse |
| `prompt.md` | Définir le rôle de l’employé et ses contraintes globales |
| `index.ts` | Définir le profil de l’employé IA intégré |

## Liens connexes

- [Développement de plugins pour les employés IA](./index.md) - Comprendre la relation entre l'outil, la compétence et l'employé IA intégré
- [Définir un Tool côté serveur](./define-tool.md) — Afficher la configuration complète de `defineTools()`
- [Définir un Skill](./define-skill.md) — Afficher les champs et les méthodes d'écriture de `SKILLS.md`
- [Définir un employé IA intégré](./define-ai-employee.md) — Afficher `defineAIEmployee()` et les liaisons de répertoire
- [Internationalisation des plugins d’employés IA](./internationalization.md) — Ajouter une traduction pour la copie de l'interface de gestion dans l'exemple

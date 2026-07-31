---
title: "Développement de plugins pour les employés IA"
description: "Présentation des relations entre les Tools, les Skills, les employés IA intégrés et les interfaces frontend des Tools dans les plugins NocoBase, avec les conventions de répertoire et le parcours d’apprentissage."
keywords: "NocoBase,développement plugin employé IA,Tool,Skill,defineAIEmployee,src/ai"
---

# Développement de plugins pour les employés IA

Dans NocoBase, un plugin peut mettre ses capacités métier à la disposition des employés IA. Trois points d’extension couvrent différents niveaux :

- **Tool (outil)** — exécute une opération précise, comme interroger des données, appeler une API ou modifier un enregistrement
- **Skill (compétence)** — indique au modèle quand utiliser les Tools et quelles étapes suivre pour accomplir une tâche
- **Employé IA intégré (Built-in AI Employee)** — assemble un profil, un prompt système, des Skills et des Tools pour fournir un employé prêt à l’emploi

En règle générale, il n’est pas nécessaire d’appeler manuellement les API d’enregistrement. Placez les fichiers dans le répertoire conventionnel `src/ai` du plugin : NocoBase les analyse et les enregistre automatiquement au chargement du plugin. Un enregistrement supplémentaire dans `src/client-v2/plugin.tsx` n’est nécessaire que lorsqu’un Tool requiert une carte personnalisée, une fenêtre modale ou une logique exécutée dans le navigateur.

Avant de commencer, vérifiez que l’application a installé et activé `@nocobase/plugin-ai`. Le code du plugin peut utiliser les types et les fonctions de définition fournis par `@nocobase/ai` et `@nocobase/actions`.

:::tip Lecture préalable

- [Écrire votre premier plugin](../../../plugin-development/write-your-first-plugin.md) — découvrez d’abord la structure, la compilation et l’activation d’un plugin si vous n’avez pas encore d’expérience dans le développement de plugins
- [Employés IA](../../index.md) — familiarisez-vous avec la configuration et l’utilisation de base des employés IA

:::


## Index rapide

| Je veux… | Consulter |
| --- | --- |
| Permettre à l’IA d’appeler une opération côté serveur | [Définir un Tool côté serveur](./define-tool.md) |
| Définir le processus d’appel de plusieurs Tools | [Définir un Skill](./define-skill.md) |
| Fournir un rôle IA fixe avec un plugin | [Définir un employé IA intégré](./define-ai-employee.md) |
| Comprendre l’assemblage complet d’un Tool, d’un Skill et d’un employé | [Exemple complet : créer un employé IA intégré](./complete-example.md) |
| Ajouter une interface de confirmation, de sélection ou de modification à un Tool | [Ajouter une interaction frontend à un Tool](./frontend-tool-ui.md) |
| Traduire l’interface d’administration des Tools et des Skills | [Internationalisation des plugins d’employés IA](./internationalization.md) |
| Diagnostiquer les problèmes d’enregistrement, de liaison ou d’exécution | [Problèmes courants](./troubleshooting.md) |

## Choisir d’abord le niveau à étendre

Les Tools, les Skills et les employés IA intégrés ne sont pas trois fonctions indépendantes. Ils se combinent progressivement, du niveau le plus bas au niveau le plus haut. Un plugin n’a pas forcément besoin d’implémenter les trois niveaux.

```text
Tool：让 AI 能执行一个具体动作
  ↓
Skill：让 AI 按固定方法完成一类任务
  ↓
内置 AI 员工：把这些能力装配成一个固定角色和使用入口
```

Choisissez le point de départ selon votre besoin :

- Si l’IA doit uniquement interroger des données, appeler une API ou modifier un enregistrement, un Tool suffit
- Si vous devez définir l’ordre d’appel des Tools, les étapes de confirmation et le format de sortie, ajoutez un Skill pour ces Tools
- Si le plugin doit fournir directement un rôle fixe après son activation, créez également un employé IA intégré et liez-lui les Skills et les Tools correspondants

Lorsque les trois niveaux sont utilisés, une tâche suit cet ordre :

1. L’utilisateur confie une tâche à l’employé IA
2. L’employé IA détermine le Skill à utiliser à partir du prompt système
3. Le Skill indique au modèle quels Tools appeler et dans quel ordre
4. Le Tool exécute une requête, une écriture ou un appel externe, puis renvoie le résultat
5. L’employé IA prépare la réponse finale à partir du résultat du Tool

La carte frontend d’un Tool ne constitue pas un quatrième niveau. Elle complète uniquement l’interface d’un ToolCall lorsque le Tool doit demander à l’utilisateur de confirmer, de sélectionner une option ou de modifier des paramètres.

## Placer les ressources IA dans `src/ai`

NocoBase détecte les ressources IA d’un plugin selon des conventions de répertoire. Dans un plugin standard, placez les Tools, les Skills et les employés IA intégrés sous `src/ai` ; il n’est pas nécessaire de les enregistrer un par un dans la méthode `load()` de `src/server/plugin.ts`.

Un répertoire complet peut être organisé ainsi :

```text
src/ai/
├── tools/
│   └── searchDocs.ts
├── skills/
│   └── document-search/
│       ├── SKILLS.md
│       └── tools/
│           └── readDocument.ts
└── ai-employees/
    ├── translator.ts
    └── developer/
        ├── index.ts
        ├── prompt.md
        ├── skills/
        └── tools/
```

Chaque emplacement correspond à un mode d’enregistrement :

| Fichier ou répertoire | Traitement par NocoBase |
| --- | --- |
| `src/ai/tools/<name>.ts` | Enregistre un Tool indépendant |
| `src/ai/skills/<name>/SKILLS.md` | Enregistre un Skill |
| `tools/` dans le répertoire d’un Skill | Enregistre les Tools et les lie automatiquement au Skill courant |
| `src/ai/ai-employees/<name>.ts` | Enregistre un employé IA intégré défini dans un seul fichier |
| `src/ai/ai-employees/<name>/index.ts` | Enregistre un employé IA intégré défini dans un répertoire |
| `prompt.md` dans le répertoire d’un employé IA | Devient le prompt système par défaut de cet employé |
| `skills/` et `tools/` dans le répertoire d’un employé IA | Enregistre les ressources et les lie automatiquement à cet employé |

Lors du chargement du plugin, NocoBase effectue les opérations suivantes avant d’exécuter la méthode `load()` du plugin :

1. Analyser et enregistrer les Tools
2. Analyser les fichiers `SKILLS.md`, puis lier les Tools de chaque répertoire au Skill correspondant
3. Charger les employés IA intégrés et fusionner leur `prompt.md`, leurs Skills et leurs Tools

`src/client-v2` ne fait pas partie de ces répertoires analysés automatiquement. Un enregistrement supplémentaire dans `src/client-v2/plugin.tsx` est nécessaire uniquement lorsqu’un Tool requiert une carte frontend, une fenêtre modale ou une logique exécutée dans le navigateur.

## Référence rapide des points d’extension et des répertoires

| Point d’extension | Responsabilité | Emplacement par défaut |
| --- | --- | --- |
| Tool | Exécuter une opération précise, comme une requête, une écriture ou un appel externe | `src/ai/**/tools/` |
| Skill | Définir le processus, l’ordre d’appel des Tools et les contraintes de sortie | `src/ai/**/skills/<name>/SKILLS.md` |
| Employé IA intégré | Définir un rôle fixe et assembler son prompt système, ses Skills et ses Tools | `src/ai/ai-employees/` |
| Carte frontend d’un Tool | Afficher un ToolCall et recueillir une confirmation, une modification ou un refus | `src/client-v2/` |

Commencez par implémenter un Tool. Ajoutez un Skill si vous avez besoin d’un processus fixe, puis créez un employé IA intégré si vous souhaitez fournir un rôle fixe. N’ajoutez une carte frontend que lorsqu’un Tool requiert une interaction dans le navigateur.

## Liens connexes

- [Écrire votre premier plugin](../../../plugin-development/write-your-first-plugin.md) — créez et exécutez un plugin NocoBase à partir de zéro
- [Présentation des employés IA](../../index.md) — découvrez les points d’accès aux employés IA
- [Guide d’ingénierie des prompts](../../configuration/prompt-engineering-guide.md) — rédigez des prompts système et des contraintes de tâche

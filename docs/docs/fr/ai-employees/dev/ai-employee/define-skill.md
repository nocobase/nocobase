---
title: "Définir un Skill"
description: "Découvrez le frontmatter, le prompt, la liaison des Tools et la détection automatique des répertoires dans un fichier SKILLS.md pour les employés IA NocoBase."
keywords: "NocoBase,Skill employé IA,SKILLS.md,liaison Tool Skill,business-analysis-report"
---

# Définir un Skill

Les compétences n'exécutent pas de code. Il s'agit d'un guide opérationnel fourni avec le modèle qui spécifie le flux de traitement, les outils disponibles, les étapes d'inspection et les exigences de sortie.

## Répertoire d’un Skill

Utilisez un répertoire distinct pour chaque compétence :

```text
src/ai/skills/business-analysis-report/
├── SKILLS.md
└── tools/
    └── businessReportGenerator.ts
```

dans:

- `SKILLS.md` définit les métadonnées et le texte du mot d'invite
- Outils de sauvegarde `tools/` utilisés uniquement avec cette compétence
- Les outils trouvés dans `tools/` seront automatiquement ajoutés à la liste d'outils de cette compétence

## Frontmatter de `SKILLS.md`

Une compétence minimale est la suivante :

```md
---
scope: SPECIFIED
name: welcome-developer
description: Greet a developer by name and explain the next step for starting NocoBase plugin development.
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
---

You help welcome developers who are starting NocoBase plugin development.

When the user asks you to greet or welcome a developer:

1. Extract the developer name from the request.
2. Call `greetDeveloper` exactly once.
3. Return the greeting from the tool result.
4. Ask which plugin capability the developer wants to build next.

Do not claim that the greeting was generated until the tool returns `status: "success"`.
```

Les champs couramment utilisés dans le frontmatter sont les suivants :

| Champ | Fonction |
| --- | --- |
| `scope` | La gamme de compétences disponible, `SPECIFIED` en cas d'omission |
| `name` | Le nom unique de la compétence |
| `description` | Aide le modèle à déterminer quand charger cette compétence |
| `introduction.title` | Titre affiché sur l'interface de gestion |
| `introduction.about` | Instructions pour l'affichage de l'interface de gestion |
| `tools` | Liste des noms d'outils supplémentaires qui doivent être liés |

Le corps de la compétence est enregistré tel quel et ajouté au contexte du modèle une fois la compétence chargée. Le texte principal doit se concentrer sur le flux de travail et les contraintes, et ne pas copier les détails de mise en œuvre de l'outil.

## Lier des Tools à un Skill

Il y a deux manières.

La première est de le déclarer explicitement en frontmatter :

```yaml
tools:
  - getSkill
  - businessReportGenerator
```

La seconde consiste à placer l'outil dans le répertoire `tools/` de la compétence actuelle :

```text
src/ai/skills/welcome-developer/
├── SKILLS.md
└── tools/
    └── greetDeveloper.ts
```

Le chargeur découvrira automatiquement `greetDeveloper` et le fusionnera dans la liste d'outils de la compétence. Il est recommandé de placer par défaut les outils spécifiques à une compétence dans le répertoire de la compétence, afin que l'emplacement du fichier puisse exprimer la relation de liaison.

## Comment bien écrire un Skill

Une compétence utilisable contient généralement ces contenus :

1. Limites des rôles et des tâches
2. Séquence de traitement à suivre
3. Quel outil doit-on appeler à chaque étape ?
4. Dans quelles circonstances est-il nécessaire de confirmer auprès de l'utilisateur ?
5. Comment gérer l'échec de l'outil
6. Structure du résultat final et conditions de vérification

Si l'outil modifie les données, la compétence doit explicitement exiger que le modèle attende que l'outil renvoie un résultat réussi et ne peut pas prétendre que l'opération est terminée avant de l'appeler.

## Exemple de compétence intégrée : `business-analysis-report`

`packages/plugins/@nocobase/plugin-ai/src/ai/skills/business-analysis-report/SKILLS.md` décompose l'analyse commerciale en flux de travail clairs :

```yaml
---
scope: GENERAL
name: business-analysis-report
description: Analyze business data with the data-query workflow and generate stakeholder-facing reports with markdown and ECharts.
introduction:
  title: '{{t("ai.skills.businessAnalysisReport.title", { ns: "@nocobase/plugin-ai" })}}'
  about: '{{t("ai.skills.businessAnalysisReport.about", { ns: "@nocobase/plugin-ai" })}}'
tools:
  - getSkill
  - businessReportGenerator
---
```

Le texte ne dit pas seulement « générer un rapport d'activité », mais continue de stipuler :

- Comprendre d'abord les objectifs de la décision, le public, le calendrier et les indicateurs
- Lorsque des données métiers sont impliquées, le premier ToolCall doit charger la compétence `data-query`
- Aucune supposition sur les tables de données, les chemins d'association et les résultats des requêtes n'est autorisée
- Appelez `businessReportGenerator` une fois les données prêtes
- Les graphiques et les rapports Markdown sont générés dans le même ToolCall
- Déterminez s'il réussit en fonction des `status`, `chartCount`, `errors` et `warnings` renvoyés par Tool
- Réessayez une seule fois si le graphique échoue, puis revenez au rapport Markdown pur

Ce type de règle constitue la principale valeur de Skill : elle condense « ce que le modèle peut faire » en un processus reproductible et vérifiable.

## Liens connexes

- [Développement du plug-in AI Employee](./index.md) — Comprendre la position de la compétence dans l'extension AI Employee
- [Définir l'outil serveur](./define-tool.md) – Définir l'outil que la compétence peut appeler
- [Définir les employés IA intégrés](./define-ai-employee.md) — Lier la compétence aux employés fixes
- [Exemple complet : créer un employé IA intégré](./complete-example.md) — Consultez l'exemple de liaison complet de compétence et d'outil

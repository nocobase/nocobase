---
title: "Problèmes courants du développement de plugins d’employés IA"
description: "Résolvez les problèmes d’enregistrement et d’exécution des Tools, des Skills, des employés IA intégrés et des cartes frontend des Tools dans NocoBase."
keywords: "NocoBase,problèmes employé IA,Tool non enregistré,Skill non chargé,carte frontend"
---

# Problèmes courants du développement de plugins d’employés IA

## Le Tool n’est pas enregistré

Vérifiez les points suivants dans cet ordre :

- Le fichier se trouve-t-il dans `src/ai/**/tools/`, à l’intérieur du périmètre de compilation du plugin ?
- Utilise-t-il l’extension `.ts` ou `.js` ?
- Exporte-t-il `defineTools(...)` avec `export default` ?
- Le fichier du Tool a-t-il été nommé par erreur avec l’extension `.d.ts` ?
- Un autre Tool porte-t-il le même nom, ce qui entraîne l’ignorance du dernier élément enregistré ?
- Le plugin a-t-il été recompilé et rechargé ?

## Le Skill n’apparaît pas

Commencez par vérifier le nom du fichier. Il doit actuellement être exactement :

```text
SKILLS.md
```

Vérifiez également que le frontmatter contient des champs `name` et `description` stables et que le fichier se trouve dans `src/ai/**/skills/<skill-name>/SKILLS.md`.

## Le Skill est chargé, mais ne peut pas appeler le Tool

Vérifiez les points suivants :

- La liste `tools` du Skill contient-elle le nom du Tool ?
- Le Tool se trouve-t-il dans le répertoire `tools/` du Skill courant ?
- Le nom du fichier du Tool, son champ `definition.name` et la référence utilisée par le Skill sont-ils identiques ?
- Le `scope` convient-il au mode de liaison utilisé ?
- Le Tool n’a-t-il pas été ignoré à cause d’un nom en double ?

Lier un Tool signifie seulement que le modèle peut l’utiliser. Si le Tool apparaît dans le Skill, mais que le modèle ne l’appelle toujours pas, indiquez clairement dans le workflow de `SKILLS.md` le moment de l’appel, les paramètres requis et l’étape d’attente du résultat.

## La carte frontend ne s’affiche pas

Le nom enregistré côté frontend doit être strictement identique au nom final du Tool côté serveur :

```ts
this.ai.toolsManager.registerTools('developerChoice', options);
```

Vérifiez également les points suivants :

- Le plugin personnalisé utilise-t-il le runtime `src/client-v2/` ?
- La carte est-elle enregistrée dans la méthode `load()` du plugin client ?
- Le ToolCall atteint-il un état pris en charge par la carte ?
- La carte est-elle désactivée par une condition sur `invokeStatus` ?
- Le plugin client a-t-il été recompilé et rechargé ?

## Le Tool ne poursuit pas son exécution après un clic sur la carte

Vérifiez que l’une des méthodes `approve()`, `edit()` ou `reject()` est appelée. Pour réinjecter le choix de l’utilisateur dans les paramètres, utilisez :

```ts
await decisions.edit({
  ...toolCall.args,
  option: selectedOption,
});
```

Vérifiez aussi que le schéma côté serveur autorise ce champ et que la méthode `invoke()` le lit.

## La modification de `definition.name` n’a aucun effet

Le nom d’un Tool chargé automatiquement est déterminé par le nom de son fichier ou de son répertoire. Par exemple :

```text
src/ai/tools/developerChoice.ts
```

Le nom final est `developerChoice`. Pour le modifier, renommez également le fichier, les références dans les Skills, la configuration de l’employé IA et le nom enregistré côté frontend.

## Liens connexes

- [Développement de plugins pour les employés IA](./index.md) — revenez à la présentation du guide de développement
- [Définir un Tool côté serveur](./define-tool.md) — vérifiez le nom et le mode d’enregistrement du Tool
- [Définir un Skill](./define-skill.md) — vérifiez la liaison entre le Skill et le Tool
- [Ajouter une interaction frontend à un Tool](./frontend-tool-ui.md) — vérifiez le ToolCall et l’enregistrement frontend

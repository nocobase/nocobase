---
title: "Ajouter une interaction frontend à un Tool"
description: "Découvrez les cartes, les fenêtres modales, decisions.edit et l’exécution frontend des Tools des employés IA NocoBase, avec une carte de sélection pour un employé IA intégré."
keywords: "NocoBase,carte frontend Tool,ToolsUIProperties,decisions.edit,SuggestionsOptionsCard,frontend Tool"
---

# Ajouter une interaction frontend à un Tool

Certains outils doivent uniquement être exécutés côté serveur et ne nécessitent pas d’interface personnalisée. D'autres outils doivent permettre aux utilisateurs de confirmer, sélectionner ou modifier les paramètres. Dans ce cas, vous pouvez enregistrer une carte frontale pour l'outil portant le même nom.

:::tip Distinguer deux concepts

**La carte frontale** est uniquement responsable de l'affichage et de l'interaction homme-machine de ToolCall. Cela ne signifie pas que la logique métier de Tool doit être exécutée dans le navigateur.

Si vous affichez simplement les options telles que `suggestions` et continuez le côté serveur `invoke()` après que l'utilisateur l'a sélectionné, conservez simplement le `execution: 'backend'` par défaut. Définissez `execution: 'frontend'` et implémentez `invoke` frontal uniquement si la logique réelle de l'outil doit accéder à la page actuelle du navigateur, au FlowModel ou à l'état de l'éditeur.

:::

## Définir d’abord les paramètres et la logique d’exécution côté serveur

L'outil `suggestions` intégré se trouve à l'emplacement :

```text
packages/plugins/@nocobase/plugin-ai/src/ai/tools/suggestions.ts
```

Son schéma contient à la fois les candidats et le choix final de l'utilisateur :

```ts
schema: z.object({
  option: z.string().describe('user selected option, ignore this param').optional(),
  options: z.array(z.string()).describe('A list of suggested prompts for the user to choose from.'),
})
```

Selon la description de l'outil, le modèle ne doit générer `options` que lors de son premier appel. Étant donné que `defaultPermission: 'ALLOW'` n'est pas défini pour cet outil, l'autorisation par défaut est `ASK` et ToolCall se mettra en pause en attendant l'opération de l'utilisateur.

Une fois que l'utilisateur l'a sélectionné, le frontal fusionne `option` dans les paramètres d'origine via `decisions.edit()`, puis restaure ToolCall. Le serveur `invoke()` renvoie finalement le contenu sélectionné :

```ts
return {
  status: 'success',
  content: args?.option,
};
```

L'implémentation intégrée réécrira également le résultat de la sélection dans `aiMessages.toolCalls`, de sorte que lorsque le message historique sera restitué, il pourra toujours afficher l'élément sélectionné par l'utilisateur.

## Créer la carte du Tool

La carte frontale reçoit `ToolsUIProperties` :

```tsx
import { useState } from 'react';
import type { ToolsUIProperties } from '@nocobase/client-v2';
import { Button, Flex } from 'antd';

interface DeveloperChoiceArgs {
  options?: string[] | string;
  option?: string;
}

const parseOptions = (value: DeveloperChoiceArgs['options']): string[] => {
  if (Array.isArray(value)) {
    return value.filter((option): option is string => typeof option === 'string');
  }
  if (typeof value !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((option): option is string => typeof option === 'string') : [];
  } catch {
    return [];
  }
};

export const DeveloperChoiceCard = ({
  toolCall,
  decisions,
}: ToolsUIProperties<DeveloperChoiceArgs>) => {
  const [submitting, setSubmitting] = useState(false);
  const options = parseOptions(toolCall.args?.options);

  const handleSelect = async (option: string) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await decisions.edit({
        ...toolCall.args,
        option,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Flex gap="small" wrap="wrap">
      {options.map((option, index) => (
        <Button
          key={`${option}-${index}`}
          disabled={toolCall.invokeStatus !== 'interrupted' || submitting}
          onClick={() => handleSelect(option)}
        >
          {option}
        </Button>
      ))}
    </Flex>
  );
};
```

:::warning Attention

Ce composant démontre l'utilisation générale de `decisions.edit()` et gère les clics répétés et les paramètres de chaîne JSON. Lorsqu'il est utilisé officiellement, il est également nécessaire de gérer les conversations en lecture seule, les messages actifs en cours et l'état de sélection historique en fonction de l'interface de discussion. Pour une mise en œuvre complète, veuillez vous référer à `packages/plugins/@nocobase/plugin-ai/src/client-v2/ai-employees/tools/SuggestionsOptionsCard.tsx`.

:::

`decisions` propose trois opérations :

| Méthode | Fonction |
| --- | --- |
| `approve()` | Continuer l'exécution en utilisant les paramètres d'origine |
| `edit(args)` | Continuer l'exécution après avoir modifié les paramètres |
| `reject(message?)` | Rejeter l'exécution et renvoyer le motif au flux de dialogue |

Le `SuggestionsOptionsCard.tsx` intégré gère en outre ces détails :

- Compatible avec les formes `options` de tableau et de chaîne JSON
- ToolCall affiche toujours le chargement une fois généré
- Autoriser uniquement la sélection de ToolCall dans le statut `interrupted`
- Désactivez le bouton immédiatement après avoir cliqué pour éviter les soumissions répétées
- Conservez les options sélectionnées dans les messages de l'historique et mettez-les en surbrillance
- Autoriser uniquement les conversations modifiables en cours à déclencher des actions

## Enregistrer la carte dans le plugin client

Le nom d'enregistrement frontal doit être exactement le même que le nom de l'outil côté serveur :

```tsx
import { Plugin } from '@nocobase/client-v2';
import { DeveloperChoiceCard } from './ai-employees/tools/DeveloperChoiceCard';

export class PluginDeveloperHelperClient extends Plugin {
  async load() {
    this.ai.toolsManager.registerTools('developerChoice', {
      ui: {
        card: DeveloperChoiceCard,
      },
    });
  }
}

export default PluginDeveloperHelperClient;
```

Si le fichier serveur est `src/ai/tools/developerChoice.ts`, `developerChoice` est enregistré ici.

Le processus d'enregistrement du `suggestions` intégré se déroule également comme ceci :

```ts
export const suggestionsTool = [
  'suggestions',
  {
    ui: {
      card: SuggestionsOptionsCard,
    },
  },
];
```

Ensuite, `PluginAIClientV2.load()` appelle `registerPluginAIClientV2BuiltinTools(this.ai.toolsManager)` pour fusionner la carte dans la définition d'outil du même nom renvoyée par le serveur.

## Choisir entre une carte, une fenêtre modale et une exécution frontend

Seules les configurations courantes du client `ToolsOptions` sont répertoriées ci-dessous. Voir `packages/core/client-v2/src/ai/tools-manager/types.ts` pour le type complet.

```ts
type ToolsOptions = {
  ui?: {
    card?: ComponentType<ToolsUIProperties>;
    modal?: {
      title?: string;
      okText?: string;
      Component?: ComponentType;
      footer?: ComponentType;
      hideOkButton?: boolean;
      // modal.props、useOnOk 等配置请查看完整类型。
    };
  };
  invoke?: (app, params) => unknown | Promise<unknown>;
  // useHooks 等其他配置请查看完整类型。
};
```

### Utiliser une carte

Utilisez `card` par défaut. Une carte convient pour afficher l’état d’exécution, des boutons de confirmation ou un petit nombre d’options à l’emplacement du ToolCall.

### Utiliser une fenêtre modale

Ajoutez une `modal` lorsque le contenu est plus volumineux, qu’un aperçu de grande taille est nécessaire ou que l’utilisateur doit modifier des paramètres complexes.

### Exécuter le Tool dans le navigateur

Si le Tool côté serveur définit `execution: 'frontend'`, le client doit également fournir `invoke`. Ce type de Tool convient pour lire le contexte de la page actuelle, le contenu de l’éditeur ou l’état de FlowEngine. Il ne convient pas aux écritures de données qui doivent rester protégées par les permissions côté serveur.

## Exemple complet : ajouter une carte de sélection à un employé IA intégré

Après avoir terminé [Exemple complet : créer un employé IA intégré](./complete-example.md), vous pouvez transformer la question de suivi de `Dev Helper` en options cliquables. Définissez pour cela un autre Tool `developerChoice` et enregistrez une carte frontend. Le fichier côté serveur se trouve à l’emplacement suivant :

```text
src/ai/ai-employees/dev-helper/skills/welcome-developer/tools/developerChoice.ts
```

Cet outil est chargé de déclarer les options et de recevoir les sélections des utilisateurs :

```ts
import type { Context } from '@nocobase/actions';
import { defineTools } from '@nocobase/ai';
import { z } from 'zod';

export default defineTools({
  scope: 'SPECIFIED',
  introduction: {
    title: '{{t("ai.tools.developerChoice.title", { ns: "@nocobase/plugin-developer-helper" })}}',
    about: '{{t("ai.tools.developerChoice.about", { ns: "@nocobase/plugin-developer-helper" })}}',
  },
  definition: {
    name: 'developerChoice',
    description: 'Show a short list of plugin-development directions for the user to choose from.',
    schema: z.object({
      options: z.array(z.string()).min(2).max(4),
      option: z.string().optional(),
    }),
  },
  invoke: async (_ctx: Context, args: { options: string[]; option?: string }) => {
    return {
      status: 'success',
      content: args.option,
    };
  },
});
```
Étant donné que `developerChoice.ts` se trouve dans le répertoire `tools/` de la compétence `welcome-developer`, il est automatiquement lié à la compétence actuelle. Cependant, la liaison signifie uniquement que le modèle peut utiliser cet outil, mais cela ne signifie pas que le modèle l'appellera définitivement.

Il est également nécessaire de modifier simultanément le flux de travail de `SKILLS.md` et de remplacer les étapes originales 5 à 6 par :

```md
5. Use `content.name` to write a short welcome message in the same language as the user.
6. Call `developerChoice` exactly once with 2–4 plugin-development directions written in the user's language.
7. Wait for the user to select an option.
8. Continue according to the selected option.
```

La carte frontale réutilise le `DeveloperChoiceCard` précédemment défini et l'enregistre dans :

```text
src/client-v2/ai-employees/tools/DeveloperChoiceCard.tsx
```

Finalement enregistré dans `src/client-v2/plugin.tsx` :

```tsx
import { Plugin } from '@nocobase/client-v2';
import { DeveloperChoiceCard } from './ai-employees/tools/DeveloperChoiceCard';

export class PluginDeveloperHelperClient extends Plugin {
  async load() {
    this.ai.toolsManager.registerTools('developerChoice', {
      ui: {
        card: DeveloperChoiceCard,
      },
    });
  }
}

export default PluginDeveloperHelperClient;
```

Une fois l'enregistrement de la carte terminé, reconstruisez le client. Lorsque vous atteignez `developerChoice` dans la conversation, ToolCall se met en pause et affiche les options cliquables.

<!-- 需要一张对话中显示 developerChoice 可点击选项的截图 -->

## Liens connexes

- [Définir un Tool côté serveur](./define-tool.md) — Définissez l'outil serveur correspondant à la carte frontale
- [Exemple complet : créer un employé IA intégré](./complete-example.md) — Complétez d'abord l'exemple de base de Dev Helper
- [Internationalisation des plugins d’employés IA](./internationalization.md) — Traduire la copie de l'interface de gestion de l'outil et de la compétence
- [Plugin client](../../../plugin-development/client/plugin.md) — En savoir plus sur l'entrée du plug-in client et `load()`

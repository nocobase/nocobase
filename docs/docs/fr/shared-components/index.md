---
title: "Composants partagés"
description: "Composants partagés de NocoBase client v2 : conteneurs de formulaire, champs, filtres, tableaux et icônes."
keywords: "client-v2,shared components,React,Antd,NocoBase"
---

# Composants partagés

NocoBase client v2 intègre un ensemble de composants partagés. Pour créer des pages de plugin, des pages de configuration ou des formulaires, tu peux les utiliser directement et réutiliser l’UI ainsi que les interactions préparées par NocoBase.

Cette section organise les composants par scénario d’utilisation. Chaque page décrit un seul composant : quand l’utiliser, son API courante et s’il peut être prévisualisé dans la documentation.

## Index rapide

| Je veux... | Où consulter |
| --- | --- |
| Contrôler le scanner plein écran de bas niveau | [CodeScanner](./form/code-scanner) |
| Placer un formulaire standard dans un dialog | [DialogFormLayout](./form/dialog-form-layout) |
| Placer un formulaire standard dans un drawer | [DrawerFormLayout](./form/drawer-form-layout) |
| Autoriser uniquement les variables d’environnement `$env` | [EnvVariableInput](./form/env-variable-input) |
| Saisir une taille de fichier et la stocker en octets | [FileSizeInput](./form/file-size-input) |
| Modifier une configuration JSON / JSON5 | [JsonTextArea](./form/json-text-area) |
| Saisir un mot de passe avec indicateur de robustesse | [PasswordInput](./form/password-input) |
| Charger les options d’un Select de façon asynchrone depuis une API | [RemoteSelect](./form/remote-select) |
| Ajouter la prise en charge du scan à un champ de saisie | [ScanInput](./form/scan-input) |
| Permettre à un champ d’accepter à la fois des constantes et des variables | [TypedVariableInput](./form/typed-variable-input) |
| Permettre à un champ sur une ligne d’accepter des variables comme `{{ $env.X }}` et `{{ $user.name }}` | [VariableInput](./form/variable-input) |
| Insérer des variables dans une configuration JSON / JSON5 | [VariableJsonTextArea](./form/variable-json-text-area) |
| Permettre au texte multiligne d’accepter des variables | [VariableTextArea](./form/variable-text-area) |
| Filtrer une Collection avec plusieurs conditions | [CollectionFilter](./filter/) |
| Intégrer un panneau de filtre de Collection dans une page | [CollectionFilterPanel](./filter/collection-filter-panel) |
| Personnaliser la ligne déplaçable d’une antd Table | [SortableRow](./table/sortable-row) |
| Personnaliser la colonne de poignée de déplacement d’une Table | [SortHandle](./table/sort-handle) |
| Afficher des listes, sélectionner des lignes et trier par glisser-déposer dans les pages de configuration | [Table](./table/) |
| Utiliser les icônes Ant Design ou enregistrer des icônes personnalisées | [Icon](./icon) |
| Créer un registre interne pour les points d’extension du plugin | [createFormRegistry](./create-form-registry) |

## Utilisation

Importe les composants nécessaires dans un plugin client, puis utilise-les comme des composants React ordinaires :

```tsx
import { RemoteSelect, Table } from '@nocobase/client-v2';

function SettingsPage() {
  return (
    <>
      <RemoteSelect request={loadOptions} />
      <Table rowKey="id" columns={columns} dataSource={records} />
    </>
  );
}
```

## Conseils de choix

Par défaut, React + Antd suffit. Consulte d’abord ces composants pour les scénarios fréquents des plugins NocoBase :

- Ouvrir des formulaires dans un drawer ou un dialog sur les pages de configuration
- Insérer des variables, éditer du JSON, saisir des tailles de fichiers ou scanner des codes dans les champs de formulaire
- Utiliser des filtres de Collection ou le tri par glisser-déposer dans les listes
- Utiliser l’entrée d’icônes unifiée de NocoBase

Pour les champs, boutons et messages ordinaires, les composants Antd sont généralement plus clairs.

## Liens associés

- [Développement de composants](../plugin-development/client/component/index.md)
- [Context - Capacités courantes](../plugin-development/client/ctx/common-capabilities.md)
- [FlowEngine](../flow-engine/index.md)

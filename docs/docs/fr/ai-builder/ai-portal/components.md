---
title: "Composants standard et extensions"
description: "La base de composants shadcn/ui de l'AI Portal et son mécanisme d'extension — un répertoire par extension, découverte et montage automatiques."
keywords: "AI Portal, shadcn/ui, composants, extensions, AppExtension, Registry, Tailwind CSS"
---

# Composants standard et extensions

:::tip Prérequis

Avant de lire cette page, assurez-vous d'avoir un premier Portal en fonctionnement en suivant le [Démarrage rapide de l'AI Portal](./index.md).

:::

L'interface d'un Portal comporte deux parties : `src/components/ui` fournit les composants de base, et `src/extensions` contient les modules métier. Cette page couvre l'usage des deux.

## Base de composants

`src/components/ui` contient une soixantaine de composants [shadcn/ui](https://ui.shadcn.com/) — boutons, formulaires, boîtes de dialogue, tiroirs, tableaux, graphiques, tous les incontournables. Le style se configure dans `components.json`, et les icônes proviennent de lucide.

À la différence d'une bibliothèque de composants que l'on installe, **le code source de ces composants appartient à votre projet**. Il vit dans votre dépôt, vous pouvez le modifier librement, et les mises à jour amont ne l'écrasent jamais.

C'est pourquoi il vaut mieux personnaliser par composition plutôt qu'en les modifiant directement :

```tsx
// Recommandé : encapsuler, pour que le composant de base reste remplaçable
import { Button } from "@/components/ui/button";

export function SubmitButton(props) {
  return <Button variant="default" size="lg" {...props} />;
}
```

Modifier directement `src/components/ui/button.tsx` fonctionne aussi, mais rend plus difficile la récupération ultérieure des corrections de bugs amont. Lorsque vous devez vraiment modifier un composant de base, comparez d'abord avec la version amont et fusionnez de façon sélective, au lieu d'écraser en bloc vos modifications locales.

:::warning Attention

N'introduisez pas Ant Design, ni les composants client de NocoBase basés sur Ant Design, dans un Portal. Le style d'un Portal repose sur Tailwind CSS et shadcn/ui, et les mélanger provoque des conflits de styles. Cette convention est déjà inscrite dans le fichier `AGENTS.md` du modèle.

:::

## Mécanisme d'extension

Les fonctionnalités métier s'écrivent sous forme d'extensions dans `src/extensions/`, un répertoire par module fonctionnel :

```text
src/extensions/
├── nocobase-acl/               Composants de permissions
├── nocobase-ai/                Capacités de conversation IA
├── nocobase-route-surfaces/    Supports de route : page, tiroir et modale
└── nocobase-users-example/     Exemple de gestion des utilisateurs
```

Chaque répertoire contient un `extension.tsx` qui exporte par défaut un `AppExtension`. Le modèle les parcourt et les charge automatiquement — **déposez-le dans le répertoire et il fonctionne, sans code d'enregistrement à modifier**.

## AppExtension

Une extension peut fournir les éléments suivants :

| Champ | Description |
| --- | --- |
| `id` | Identifiant de l'extension, obligatoire |
| `priority` | Ordre de chargement, les valeurs les plus basses d'abord, 100 par défaut |
| `resources` | Définitions de ressources Refine, qui déterminent le menu de navigation et la correspondance des routes |
| `routes` | Éléments de route, montés sous l'arbre des routes authentifiées |
| `Provider` | Un Provider qui enveloppe toute l'application |
| `AuthRuntimeProvider` | Provider du runtime d'authentification, actif avant la connexion |
| `UserMenuItems` | Entrées à ajouter au menu utilisateur |
| `authAdapters` | Adaptateurs de méthodes d'authentification |
| `dev` | Ressources et routes qui ne s'appliquent qu'en mode développement |

Une extension minimale ressemble à ceci :

```tsx
import type { AppExtension } from "@/app/extension";
import { Route } from "react-router";
import { Package } from "lucide-react";
import { ProductList } from "./list";

const productsExtension: AppExtension = {
  id: "products",
  resources: [
    {
      name: "products",
      list: "/products",
      meta: {
        label: "Products",
        icon: <Package />,
        acl: { type: "collection" }, // Participe à la vérification des permissions de table de NocoBase
      },
    },
  ],
  routes: <Route path="/products" element={<ProductList />} />,
};

export default productsExtension;
```

## Extensions intégrées

Le modèle est livré avec quatre extensions. Elles sont prêtes à l'emploi, et constituent aussi la meilleure référence pour écrire du nouveau code :

**`nocobase-users-example`** — un module CRUD complet sur la table `users` standard de NocoBase, avec les vues liste, création, édition et détail. Renvoyez-y l'IA lorsqu'elle construit une nouvelle page.

**`nocobase-acl`** — les composants de permissions : `CanAccess`, `AclPage`, `AclRegion`, `AclField` et `RoleSwitcher`.

**`nocobase-route-surfaces`** — trois supports de route : page entière, tiroir et modale. Le même contenu peut s'ouvrir comme page autonome ou surgir dans un tiroir à l'intérieur d'une page de liste, l'état de la route restant synchronisé.

**`nocobase-ai`** — apporte au front-end les capacités de conversation IA de NocoBase, dont la fenêtre de chat, le streaming, l'historique des conversations et le contexte de page. Utilisez-la pour intégrer un assistant IA à votre propre Portal.

## Règles d'import

Deux conventions de chemins s'appliquent lors de l'écriture d'une extension :

- Utilisez l'alias `@/` pour tout ce qui provient de l'application hôte, par exemple `@/components/ui/button`
- Empêchez les imports relatifs internes à l'extension de sortir de son propre répertoire

Chaque extension reste ainsi autonome, ce qui vous permet de copier tout le répertoire dans un autre Portal et de continuer à l'utiliser.

## Extensions officielles installables

<!-- Registry 的对外地址和可安装项清单待定，确定后补充这一节：怎么安装、有哪些可选扩展、安装后源码落在哪里 -->

Au-delà des quatre extensions intégrées, NocoBase fournira un ensemble d'extensions officielles que vous pourrez installer selon vos besoins. Une fois installée, le code source arrive dans `src/extensions/` et devient le code de votre projet, au même titre qu'une extension intégrée, prêt à être modifié et versionné avec l'application.

## Localisation

Les textes vivent dans `src/locales/`, et le modèle est livré avec l'anglais et le chinois. Une extension peut avoir son propre pack de langues : créez un répertoire `locales/` à l'intérieur de l'extension et importez-le depuis `extension.tsx`.

## Liens connexes

- [Démarrage rapide de l'AI Portal](./index.md) — mettre en route votre premier point d'entrée front-end écrit par l'IA
- [Structure du projet et stack technique](./project-structure.md) — les conventions de répertoires complètes et les commandes courantes
- [Construire avec un AI Agent](./agent-workflow.md) — faire suivre à l'IA une extension intégrée pour écrire un nouveau module

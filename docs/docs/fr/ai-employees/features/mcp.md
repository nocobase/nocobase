---
pkg: "@nocobase/plugin-ai"
title: "Intégration MCP pour les AI Employees"
description: "Intégrez des services MCP aux AI Employees, testez la disponibilité des services MCP et gérez les autorisations d'appel des outils MCP."
keywords: "compétences AI Employees,MCP,Model Context Protocol,tools"
---

# Intégration MCP

Les AI Employees peuvent se connecter à des services MCP qui suivent le protocole Model Context Protocol (MCP). Une fois connecté à un service MCP, l'AI Employee peut utiliser les outils fournis par ce service pour accomplir des tâches.


## Configuration MCP

Accédez au module de configuration MCP : vous pouvez y ajouter de nouveaux services MCP et gérer ceux qui sont déjà intégrés.

![20260323095943](https://static-docs.nocobase.com/20260323095943.png)


## Ajouter un service MCP

Cliquez sur le bouton «Ajouter» en haut à droite de la liste des services MCP, puis saisissez les informations d'intégration du service MCP dans la fenêtre contextuelle pour terminer l'ajout du service.

Les protocoles de transport pris en charge sont Stdio et HTTP (Streamable / SSE).

![20260323100904](https://static-docs.nocobase.com/20260323100904.png)

Lors de l'ajout d'un service MCP, vous devez renseigner le «nom», le «titre» et la «description». Le «nom» est l'identifiant unique du service MCP ; le «titre» est le nom affiché dans le système ; la «description» est facultative et sert à décrire brièvement les fonctionnalités fournies par le service MCP.

![20260323101635](https://static-docs.nocobase.com/20260323101635.png)

### Stdio 

Lors de l'ajout d'un service MCP utilisant le protocole de transport stdio, vous devez saisir la «commande» et les «arguments de commande» pour exécuter le service MCP. Vous pouvez également ajouter les «variables d'environnement» nécessaires à l'exécution de la commande.

:::warning Attention
Les commandes d'exécution du service MCP, telles que node, npx, uvx, go, etc., nécessitent que l'environnement du serveur déployant NocoBase les supporte.

L'image Docker de NocoBase ne prend en charge que les commandes d'environnement Node.js telles que node, npx, etc.
:::

![20260323103511](https://static-docs.nocobase.com/20260323103511.png)

### HTTP

Lors de l'ajout d'un service MCP utilisant le protocole de transport http, vous devez saisir l'`URL` du service MCP. Vous pouvez également ajouter des «en-têtes de requête» selon vos besoins.

Le protocole de transport http prend en charge deux modes : Streamable et SSE. Streamable est le nouveau mode de transport ajouté au standard MCP, tandis que SSE est en passe d'être déprécié. Veuillez choisir le mode de transport en fonction de la documentation du service MCP que vous utilisez.

![20260323103906](https://static-docs.nocobase.com/20260323103906.png)

### Test de disponibilité

Lors de l'ajout ou de la modification d'un service MCP, après avoir saisi les informations de configuration MCP, vous pouvez lancer un test de disponibilité du service MCP. Si les informations de configuration MCP sont complètes et correctes et que le service MCP est disponible, le test de disponibilité retournera un message de succès.

![20260323105608](https://static-docs.nocobase.com/20260323105608.png)

## Consulter un service MCP

Cliquez sur le bouton «Voir» dans la liste des services MCP pour consulter la liste des outils fournis par ce service MCP.

Dans la liste des outils du service MCP, vous pouvez également configurer les autorisations d'utilisation de l'outil par l'AI Employee. Lorsque l'autorisation de l'outil est définie sur `Ask`, l'utilisateur sera consulté avant l'appel de l'outil ; lorsqu'elle est définie sur `Allow`, l'outil sera appelé directement en cas de besoin.

![20260323111106](https://static-docs.nocobase.com/20260323111106.png)

## Utiliser un service MCP

Une fois le service MCP activé dans le module de configuration MCP, lors d'une conversation avec un AI Employee, ce dernier utilisera automatiquement les outils fournis par le service MCP pour accomplir ses tâches.

![20260323110535](https://static-docs.nocobase.com/20260323110535.png)

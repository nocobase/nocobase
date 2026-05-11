[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja-JP.md) | Français | [Español](./README.es.md) | [Português](./README.pt.md) | [Bahasa Indonesia](./README.id.md) | [Tiếng Việt](./README.vi.md) | [Deutsch](./README.de.md)

https://github.com/user-attachments/assets/3b89d965-f60f-48e0-8110-24186c2911d2

<p align="center">
<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</p>

## Sommaire

- [Qu'est-ce que NocoBase](#quest-ce-que-nocobase)
- [Notes de version](#notes-de-version)
- [Points distinctifs](#points-distinctifs)
- [Connexion d'un agent IA](#connexion-dun-agent-ia)
- [Installation](#installation)

## Qu'est-ce que NocoBase

NocoBase est une plateforme open source de développement AI + no-code conçue pour créer rapidement des systèmes métiers. Au lieu de demander à l'IA de générer tout le code depuis zéro, NocoBase fournit une infrastructure éprouvée en production et une interface no-code WYSIWYG, afin que l'IA et les humains collaborent efficacement tout en garantissant à la fois vitesse de développement et fiabilité du système.

Site officiel :  
https://www.nocobase.com/fr

Démo en ligne :  
https://demo.nocobase.com/new

Documentation :  
https://docs.nocobase.com/fr/

Forum :  
https://forum.nocobase.com/

Retours d'expérience :  
https://www.nocobase.com/fr/blog/tags/customer-stories

## Notes de version

Les [notes de version](https://www.nocobase.com/fr/blog/timeline) sont publiées régulièrement sur le blog.

## Points distinctifs

### 1. Collaboratif : l'IA et les équipes construisent ensemble

Les agents de code disposent d'une CLI et de skills, tandis que les équipes ont une interface no-code WYSIWYG, afin que tous collaborent efficacement.

#### Développez avec les agents de code IA que vous connaissez déjà

Avec les principaux agents de code, vous passez du déploiement à un système opérationnel en quelques minutes.

- Compatible avec Claude Code, Cursor, Codex, OpenCode, TRAE et d'autres agents majeurs
- Les agents peuvent gérer setup, développement, migration et mise en production

![coding-agent](https://static-docs.nocobase.com/coding-agent.png)

#### Construisez manuellement dans une interface no-code WYSIWYG

Les équipes peuvent construire et modifier visuellement dans une interface WYSIWYG, même sans IA.

- Basculez en un clic entre le mode d'usage et le mode configuration
- Le modèle de données, les pages, les workflows et les permissions se relisent et se configurent visuellement
- Pensé pour les utilisateurs métier, pas seulement pour les développeurs

![wysiwyg](https://static-docs.nocobase.com/wysiwyg.gif)

#### Combinez librement développement par IA et construction manuelle

Répartissez le travail selon vos besoins : les équipes affinent ce que l'IA construit, et l'IA reprend ce que les équipes configurent.

- L'IA peut créer rapidement le modèle de données, les pages et les workflows
- Les équipes peuvent ajuster rapidement l'interface et les interactions
- Collaborez au bon niveau, et itérez en continu

![ai-no-coding](https://static-docs.nocobase.com/ai-no-coding.png)

### 2. Intelligent : l'IA agit aussi dans le métier

NocoBase intègre des collaborateurs IA pour que l'IA agisse directement dans le système.

#### Des collaborateurs IA intégrés aux processus métier

Les collaborateurs IA récupèrent le contexte métier automatiquement et exécutent directement les tâches dans le système.

- Front-office : aide à l'analyse, aux réponses intelligentes et au remplissage de formulaires
- Back-office : traitement automatique des documents, des risques et de la distribution des tâches
- Intégrés aux workflows, les collaborateurs IA participent à la décision et à l'exécution

![AI-employee](https://static-docs.nocobase.com/ai-employee-home.png)

#### Des interfaces ouvertes pour se connecter à l'écosystème des agents

MCP, HTTP API, CLI et un riche système de skills permettent aux agents externes de se connecter en toute sécurité.

- Des plateformes comme OpenClaw, Hermes, Dify, Coze ou n8n se connectent via des protocoles standard
- L'intégration avec Telegram, WhatsApp, Slack ou Gmail permet de consulter des données, déclencher des actions et exécuter des processus métier
- Un modèle d'interface unique garde agents internes et externes dans les mêmes limites

![agents](https://static-docs.nocobase.com/f-agents-logos.jpeg)

#### Des permissions fines pour garder le contrôle

Toutes les actions de l'IA suivent les mêmes permissions fines que celles des utilisateurs humains.

- Chaque collaborateur IA a son propre rôle, avec des permissions jusqu'au niveau du champ
- Les journaux d'audit rendent chaque changement de donnée et chaque déclenchement de workflow traçables
- Les administrateurs peuvent ajuster les permissions IA à tout moment pour garder des limites claires

![permission](https://static-docs.nocobase.com/f-permission.png)

### 3. Fiable : une infrastructure prête pour le métier

Le modèle de données, le contrôle des permissions et l'orchestration des workflows sont complexes et ne laissent pas de place à l'erreur.  
NocoBase les fournit comme une infrastructure intégrée, rigoureusement testée et largement éprouvée en production.

#### Une infrastructure complète, sans repartir de zéro à chaque fois

Des dizaines de modules intégrés couvrent les besoins métier les plus fréquents.

- Modélisation des données, permissions, workflows et journaux d'audit fonctionnent immédiatement
- Éprouvé en production, au lieu d'être régénéré comme du code opaque à chaque projet
- Des garde-fous intégrés maintiennent les sorties de l'IA dans l'architecture du système

![core](https://static-docs.nocobase.com/f-core.png)

#### Une approche pilotée par le modèle de données, qui découple données et interface

Les données métier restent dans des structures relationnelles standard, séparées de l'interface.

- La base principale, les bases externes et les API tierces peuvent servir de sources de données
- L'IA et les humains travaillent sur le même modèle de données, pour des résultats transparents
- Vos données restent toujours dans votre propre base, sans verrouillage par la plateforme

![model](https://static-docs.nocobase.com/model.png)

#### Une architecture par plugins pour faire évoluer le système durablement

Avec une conception en micro-noyau, chaque fonction est un plugin et le système peut évoluer sans perdre le contrôle.

- Les nouvelles fonctions s'ajoutent via des plugins composables et des conventions communes
- Combinez plugins maison et officiels selon vos besoins métier
- La même architecture s'applique aux plugins générés par l'IA comme à ceux développés à la main

![plugins](https://static-docs.nocobase.com/plugins.png)

## Connexion d'un agent IA

Le plus simple est d'installer NocoBase CLI, d'initialiser l'environnement, puis de lancer ou relancer votre session d'agent IA dans ce répertoire.

- NocoBase CLI sert à installer, connecter et gérer les applications NocoBase
- Lors de l'initialisation, la CLI installe automatiquement les NocoBase Skills pour que l'agent comprenne modèles de données, pages, workflows, permissions et plugins
- Une fois l'initialisation terminée, l'agent IA peut travailler directement tant que son espace de travail pointe vers ce répertoire

```bash
npm install -g @nocobase/cli@beta
mkdir my-nocobase && cd my-nocobase
nb init --ui
cd my-nocobase && codex
```

En savoir plus :  
https://docs.nocobase.com/fr/ai/quick-start

## Installation

NocoBase prend en charge trois méthodes d'installation :

- <a target="_blank" href="https://docs.nocobase.com/fr/welcome/getting-started/installation/docker-compose">Installer avec Docker (recommandé)</a>

  Idéal pour les scénarios no-code et ne nécessite pas d'écrire du code. Pour mettre à niveau, récupérez la dernière image puis redémarrez.

- <a target="_blank" href="https://docs.nocobase.com/fr/welcome/getting-started/installation/create-nocobase-app">Installer avec create-nocobase-app</a>

  Le code métier de votre projet reste entièrement indépendant et convient bien au low-code.

- <a target="_blank" href="https://docs.nocobase.com/fr/welcome/getting-started/installation/git-clone">Installer depuis le code source Git</a>

  Si vous voulez essayer la toute dernière version non publiée, ou contribuer en modifiant et déboguant directement le code source, cette méthode est recommandée. Elle demande un niveau de développement plus avancé, et vous pourrez récupérer les mises à jour via Git lorsque le code évolue.

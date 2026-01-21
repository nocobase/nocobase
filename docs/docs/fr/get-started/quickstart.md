---
versions:
  - label: Latest (Stable)
    features: Fonctionnalités stables, bien testées, avec uniquement des corrections de bugs.
    audience: Utilisateurs recherchant une expérience stable et des déploiements en production.
    stability: ★★★★★
    production_recommendation: Recommandé
  - label: Bêta
    features: Inclut les fonctionnalités à venir, ayant subi des tests préliminaires, mais pouvant contenir quelques problèmes.
    audience: Utilisateurs souhaitant découvrir les nouvelles fonctionnalités en avant-première et fournir des retours.
    stability: ★★★★☆
    production_recommendation: À utiliser avec prudence
  - label: Alpha (Développement)
    features: Version en cours de développement, avec les dernières fonctionnalités, mais potentiellement incomplète ou instable.
    audience: Utilisateurs techniques et contributeurs intéressés par le développement de pointe.
    stability: ★★☆☆☆
    production_recommendation: À utiliser avec prudence

install_methods:
  - label: Installation Docker (Recommandée)
    features: Aucun code requis ; installation rapide ; convient pour des essais rapides.
    scenarios: Utilisateurs sans code, ou souhaitant un déploiement rapide sur un serveur.
    technical_requirement: ★☆☆☆☆
    upgrade_method: Tirer la dernière image et redémarrer le conteneur.
  - label: Installation via create-nocobase-app
    features: Base de code d'application indépendante ; prend en charge les extensions de plugin et la personnalisation de l'interface utilisateur.
    scenarios: Développeurs front-end/full-stack, projets d'équipe, développement low-code.
    technical_requirement: ★★★☆☆
    upgrade_method: Mettre à jour les dépendances avec yarn.
  - label: Installation depuis le code source Git
    features: Obtenir le dernier code source ; convient pour la contribution et le débogage.
    scenarios: Développeurs techniques, ou souhaitant tester des versions non encore publiées.
    technical_requirement: ★★★★★
    upgrade_method: Synchroniser les mises à jour via Git.
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Comparaison des méthodes d'installation et des versions

Vous pouvez installer NocoBase de différentes manières.

## Comparaison des versions

| Critère | **Latest (Stable)** | **Bêta** | **Alpha (Développement)** |
|--------|---------------------|----------|---------------------------|
| **Caractéristiques** | Fonctionnalités stables, bien testées, avec uniquement des corrections de bugs. | Inclut les fonctionnalités à venir, ayant subi des tests préliminaires, mais pouvant contenir quelques problèmes. | Version en cours de développement, avec les dernières fonctionnalités, mais potentiellement incomplète ou instable. |
| **Public cible** | Utilisateurs recherchant une expérience stable et des déploiements en production. | Utilisateurs souhaitant découvrir les nouvelles fonctionnalités en avant-première et fournir des retours. | Utilisateurs techniques et contributeurs intéressés par le développement de pointe. |
| **Stabilité** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Recommandé pour la production** | Recommandé | À utiliser avec prudence | À utiliser avec prudence |

## Comparaison des méthodes d'installation

| Critère | **Installation Docker (Recommandée)** | **Installation via create-nocobase-app** | **Installation depuis le code source Git** |
|--------|---------------------------------------|------------------------------------------|-------------------------------------------|
| **Caractéristiques** | Aucun code requis ; installation rapide ; convient pour des essais rapides. | Base de code d'application indépendante ; prend en charge les extensions de plugin et la personnalisation de l'interface utilisateur. | Obtenir le dernier code source ; convient pour la contribution et le débogage. |
| **Scénarios d'utilisation** | Utilisateurs sans code, ou souhaitant un déploiement rapide sur un serveur. | Développeurs front-end/full-stack, projets d'équipe, développement low-code. | Développeurs techniques, ou souhaitant tester des versions non encore publiées. |
| **Exigences techniques** | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ |
| **Méthode de mise à jour** | Tirer la dernière image et redémarrer le conteneur. | Mettre à jour les dépendances avec yarn. | Synchroniser les mises à jour via Git. |
| **Tutoriels** | [<code>Installation</code>](#) [<code>Mise à jour</code>](#) [<code>Déploiement</code>](#) | [<code>Installation</code>](#) [<code>Mise à jour</code>](#) [<code>Déploiement</code>](#) | [<code>Installation</code>](#) [<code>Mise à jour</code>](#) [<code>Déploiement</code>](#) |
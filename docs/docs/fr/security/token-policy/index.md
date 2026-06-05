---
pkg: '@nocobase/plugin-auth'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Stratégie de sécurité des Tokens

## Introduction

La stratégie de sécurité des Tokens est une configuration fonctionnelle conçue pour protéger la sécurité du système et améliorer l'expérience utilisateur. Elle comprend trois éléments de configuration principaux : la « Durée de validité de la session », la « Durée de validité du Token » et le « Délai de rafraîchissement du Token expiré ».

## Accès à la configuration

Vous trouverez l'accès à la configuration dans les Paramètres du plugin - Sécurité - Stratégie des Tokens :

![20250105111821-2025-01-05-11-18-24](https://static-docs.nocobase.com/20250105111821-2025-01-05-11-18-24.png)

## Durée de validité de la session

**Définition :**

La durée de validité de la session désigne la durée maximale pendant laquelle le système autorise un utilisateur à maintenir une session active après sa connexion.

**Fonctionnement :**

Une fois la durée de validité de la session dépassée, l'utilisateur recevra une réponse d'erreur 401 lors de sa prochaine tentative d'accès au système, et sera ensuite redirigé vers la page de connexion pour une nouvelle authentification.
Exemple :
Si la durée de validité de la session est définie sur 8 heures, la session expirera 8 heures après la connexion de l'utilisateur, en l'absence d'interactions supplémentaires.

**Paramètres recommandés :**

- Scénarios d'opérations courtes : Nous recommandons 1 à 2 heures pour renforcer la sécurité.
- Scénarios de travail prolongé : Vous pouvez définir 8 heures pour répondre aux besoins de votre activité.

## Durée de validité du Token

**Définition :**

La durée de validité du Token désigne le cycle de vie de chaque Token émis par le système pendant la session active de l'utilisateur.

**Fonctionnement :**

Lorsqu'un Token expire, le système émet automatiquement un nouveau Token pour maintenir l'activité de la session.
Chaque Token expiré ne peut être rafraîchi qu'une seule fois.

**Paramètres recommandés :**

Pour des raisons de sécurité, nous vous recommandons de le définir entre 15 et 30 minutes.
Des ajustements peuvent être effectués en fonction des exigences du scénario. Par exemple :
- Scénarios de haute sécurité : La durée de validité du Token peut être réduite à 10 minutes ou moins.
- Scénarios à faible risque : La durée de validité du Token peut être prolongée de manière appropriée jusqu'à 1 heure.

## Délai de rafraîchissement du Token expiré

**Définition :**

Le délai de rafraîchissement du Token expiré désigne la fenêtre de temps maximale pendant laquelle un utilisateur est autorisé à obtenir un nouveau Token via une opération de rafraîchissement après l'expiration du Token.

**Caractéristiques :**

Si le délai de rafraîchissement est dépassé, l'utilisateur doit se reconnecter pour obtenir un nouveau Token.
L'opération de rafraîchissement ne prolonge pas la durée de validité de la session, elle ne fait que régénérer le Token.

**Paramètres recommandés :**

Pour des raisons de sécurité, nous vous recommandons de le définir entre 5 et 10 minutes.
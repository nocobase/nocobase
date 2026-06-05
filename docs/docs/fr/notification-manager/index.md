---
pkg: '@nocobase/plugin-notification-manager'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Gestionnaire de notifications

## Introduction

Le Gestionnaire de notifications est un service centralisé qui intègre plusieurs canaux de notification. Il offre une interface unifiée pour la configuration des canaux, la gestion des envois et la journalisation, tout en permettant une extension flexible à des canaux supplémentaires.

![20240928112556](https://static-docs.nocobase.com/20240928112556.png)

- **Partie violette** : Le Gestionnaire de notifications offre un service complet qui inclut la configuration des canaux et la journalisation, avec la possibilité d'ajouter d'autres canaux de notification.
- **Partie verte** : Le message intégré à l'application (In-App Message), un canal intégré, permet aux utilisateurs de recevoir des notifications directement dans l'application.
- **Partie rouge** : L'e-mail (Email), un canal extensible, permet aux utilisateurs de recevoir des notifications par e-mail.

## Gestion des canaux

![20240928181752](https://static-docs.nocobase.com/20240928181752.png)

Les canaux actuellement pris en charge sont :

- [Message intégré à l'application](/notification-manager/notification-in-app-message)
- [E-mail](/notification-manager/notification-email) (utilisant le transport SMTP intégré)

Vous pouvez également étendre le système à d'autres canaux de notification. Pour cela, consultez la documentation sur l'[Extension de canaux](/notification-manager/development/extension).

## Journaux de notifications

Le système enregistre des informations détaillées et le statut de chaque notification, ce qui facilite l'analyse et le dépannage.

![20240928181649](https://static-docs.nocobase.com/20240928181649.png)

## Nœud de notification de flux de travail

![20240928181726](https://static-docs.nocobase.com/20240928181726.png)
:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/log-and-monitor/logger/overview).
:::

# Journaux du serveur, journaux d'audit et historique des enregistrements

## Journaux du serveur

### Journaux système

> Voir [Journaux système](./index.md#journaux-système)

- Enregistrent les informations d'exécution du système applicatif, tracent les chaînes d'exécution du code et permettent de remonter aux exceptions ou erreurs d'exécution.
- Les journaux sont classés par niveaux de gravité et par modules fonctionnels.
- Sortie via le terminal ou stockage sous forme de fichiers.
- Principalement utilisés pour diagnostiquer et résoudre les situations anormales survenant pendant l'exploitation du système.

### Journaux de requêtes

> Voir [Journaux de requêtes](./index.md#journaux-de-requêtes)

- Enregistrent les détails des requêtes et réponses API HTTP, en se concentrant sur l'ID de requête, le chemin de l'API, les en-têtes, le code d'état de la réponse et la durée.
- Sortie via le terminal ou stockage sous forme de fichiers.
- Principalement utilisés pour suivre les appels d'API et leurs conditions d'exécution.

## Journaux d'audit

> Voir [Journaux d'audit](/security/audit-logger/index.md)

- Enregistrent les actions des utilisateurs (ou de l'API) sur les ressources du système, en se concentrant sur le type de ressource, l'objet cible, le type d'opération, les informations utilisateur et le statut de l'opération.
- Pour mieux suivre le contenu spécifique et les résultats des opérations utilisateur, les paramètres de requête et les réponses sont enregistrés en tant que métadonnées (MetaData). Ces informations recoupent partiellement les journaux de requêtes mais ne sont pas identiques ; par exemple, les journaux de requêtes classiques n'incluent généralement pas l'intégralité du corps de la requête.
- Les paramètres et réponses de requête ne sont pas équivalents à des instantanés (snapshots) de ressources. Ils permettent de comprendre quel type de modification a été produit par la logique du code, mais ne permettent pas de connaître précisément le contenu d'un enregistrement avant sa modification, et ne peuvent donc pas être utilisés pour le contrôle de version ou la restauration de données après une erreur de manipulation.
- Stockés sous forme de fichiers et de tables de base de données.

![](https://static-docs.nocobase.com/202501031627922.png)

## Historique des enregistrements

> Voir [Historique des enregistrements](/record-history/index.md)

- Enregistre l'historique des modifications du contenu des données.
- Les informations principalement enregistrées sont le type de ressource, l'objet de la ressource, le type d'opération, les champs modifiés et les valeurs avant/après modification.
- Peut être utilisé pour la comparaison de données.
- Stocké sous forme de tables de base de données.

![](https://static-docs.nocobase.com/202511011338499.png)
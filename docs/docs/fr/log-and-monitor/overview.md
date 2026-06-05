:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Journaux du serveur, Journaux d'audit et Historique des modifications

## Journaux du serveur

### Journaux système

> Voir [Journaux système](#)

- Enregistrent les informations d'exécution du système applicatif, suivent les chaînes d'exécution du code et retracent les exceptions ou les erreurs d'exécution.
- Ils sont classés par niveaux de gravité et par modules fonctionnels.
- Ils sont affichés via le terminal ou stockés sous forme de fichiers.
- Ils servent principalement à diagnostiquer et à résoudre les erreurs système survenant pendant le fonctionnement.

### Journaux des requêtes

> Voir [Journaux des requêtes](#)

- Enregistrent les détails des requêtes et réponses HTTP API, en se concentrant sur l'ID de la requête, le chemin de l'API, les en-têtes, le code de statut de la réponse et la durée.
- Ils sont affichés via le terminal ou stockés sous forme de fichiers.
- Ils servent principalement à suivre les appels d'API et leurs performances d'exécution.

## Journaux d'audit

> Voir [Journaux d'audit](../security/audit-logger/index.md)

- Enregistrent les actions des utilisateurs (ou des API) sur les ressources du système, en se concentrant sur le type de ressource, l'objet cible, le type d'opération, les informations utilisateur et le statut de l'opération.
- Afin de mieux suivre les actions des utilisateurs et les résultats produits, les paramètres et les réponses des requêtes sont enregistrés en tant que métadonnées. Ces informations se recoupent partiellement avec les journaux des requêtes, mais ne sont pas identiques ; par exemple, les journaux des requêtes n'incluent généralement pas le corps complet des requêtes.
- Les paramètres et les réponses des requêtes ne sont **pas équivalents** à des instantanés de données. Ils peuvent révéler le type d'opérations effectuées, mais pas les données exactes avant modification. Par conséquent, ils ne peuvent pas être utilisés pour le contrôle de version ou la restauration de données après des erreurs de manipulation.
- Ils sont stockés sous forme de fichiers et de tables de base de données.

![](https://static-docs.nocobase.com/202501031627922.png)

## Historique des modifications

> Voir [Historique des modifications](/record-history/index.md)

- Enregistre l'**historique des modifications** du contenu des données.
- Il suit le type de ressource, l'objet de la ressource, le type d'opération, les champs modifiés et les valeurs avant/après.
- Il est utile pour la **comparaison et l'audit des données**.
- Il est stocké dans des tables de base de données.

![](https://static-docs.nocobase.com/202511011338499.png)
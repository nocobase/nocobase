:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Synchronisation des données utilisateur via l'API HTTP

## Obtenir une clé API

Référez-vous à la section [Clés API](/auth-verification/api-keys). Assurez-vous que le rôle associé à votre clé API dispose des permissions nécessaires pour synchroniser les données utilisateur.

## Présentation de l'API

### Exemple

```bash
curl 'https://localhost:13000/api/userData:push' \
  -H 'Authorization: Bearer <token>' \
  --data-raw '{"dataType":"user","records":[]}' # Voir les détails du corps de la requête ci-dessous
```

### Endpoint

```bash
POST /api/userData:push
```

### Format des données utilisateur

#### UserData

| Paramètre  | Type                               | Description                                                                 |
| ---------- | ---------------------------------- | --------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'`           | Obligatoire. Type de données à envoyer. Utilisez `user` pour les données utilisateur.      |
| `matchKey` | `'username' \| 'email' \| 'phone'` | Facultatif. Permet de faire correspondre les utilisateurs existants du système en fonction du champ spécifié. |
| `records`  | `UserRecord[]`                     | Obligatoire. Tableau d'enregistrements de données utilisateur.                                       |

#### UserRecord

| Paramètre     | Type       | Description                                                                                                 |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `uid`         | `string`   | Obligatoire. Identifiant unique des données utilisateur source, utilisé pour associer les données source à l'utilisateur système. Immuable pour un utilisateur donné. |
| `nickname`    | `string`   | Facultatif. Surnom de l'utilisateur.                                                                                  |
| `username`    | `string`   | Facultatif. Nom d'utilisateur.                                                                                         |
| `email`       | `string`   | Facultatif. Adresse e-mail de l'utilisateur.                                                                             |
| `phone`       | `string`   | Facultatif. Numéro de téléphone de l'utilisateur.                                                                              |
| `departments` | `string[]` | Facultatif. Tableau des UIDs des départements auxquels l'utilisateur appartient.                                                     |
| `isDeleted`   | `boolean`  | Facultatif. Indique si l'enregistrement est supprimé.                                                          |
| `<field>`     | `any`      | Facultatif. Champs personnalisés dans la table utilisateur.                                                                  |

### Format des données de département

:::info
L'envoi de données de département nécessite que le **plugin** [Départements](../../departments) soit installé et activé.
:::

#### DepartmentData

| Paramètre  | Type                     | Description                                                                |
| ---------- | ------------------------ | -------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'` | Obligatoire. Type de données à envoyer. Utilisez `department` pour les données de département. |
| `records`  | `DepartmentRecord[]`     | Obligatoire. Tableau d'enregistrements de données de département.                                |

#### DepartmentRecord

| Paramètre   | Type      | Description                                                                                                       |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------------------- |
| `uid`       | `string`  | Obligatoire. Identifiant unique des données de département source, utilisé pour associer les données source au département système. Immuable pour un département donné. |
| `title`     | `string`  | Obligatoire. Titre du département.                                                                                         |
| `parentUid` | `string`  | Facultatif. UID du département parent.                                                                             |
| `isDeleted`   | `boolean` | Facultatif. Indique si l'enregistrement est supprimé.                                                                  |
| `<field>`   | `any`     | Facultatif. Champs personnalisés dans la table de département.                                                                    |

:::info

1. L'envoi de données est une opération idempotente.
2. Si un département parent n'existe pas lors de l'envoi de données de département, l'association ne peut pas être établie. Vous pouvez renvoyer les données une fois que le département parent a été créé.
3. Si le département d'un utilisateur n'existe pas lors de l'envoi de données utilisateur, l'utilisateur ne peut pas être associé à ce département. Vous pouvez renvoyer les données utilisateur après avoir envoyé les données de département.

:::
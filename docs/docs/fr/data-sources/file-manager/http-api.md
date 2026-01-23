:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# API HTTP

Les téléchargements de fichiers, qu'il s'agisse de champs de pièce jointe ou de collections de fichiers, peuvent être gérés via l'API HTTP. La méthode d'appel varie en fonction du moteur de stockage utilisé par la pièce jointe ou la collection de fichiers.

## Téléchargement côté serveur

Pour les moteurs de stockage open source intégrés (tels que S3, OSS et COS), l'API HTTP utilise la même logique que la fonctionnalité de téléchargement de l'interface utilisateur, où les fichiers sont téléchargés via le serveur. Les appels API nécessitent la transmission d'un jeton JWT (basé sur l'authentification de l'utilisateur) dans l'en-tête de requête `Authorization` ; sans cela, l'accès sera refusé.

### Champ de pièce jointe

Lancez une action `create` sur la ressource `attachments` (la collection de pièces jointes) en envoyant une requête POST et téléchargez le contenu binaire via le champ `file`. Après cet appel, le fichier sera téléchargé vers le moteur de stockage par défaut.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create"
```

Pour télécharger des fichiers vers un moteur de stockage différent, vous pouvez utiliser le paramètre `attachmentField` afin de spécifier le moteur de stockage configuré pour le champ de la collection. S'il n'est pas configuré, le fichier sera téléchargé vers le moteur de stockage par défaut.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/attachments:create?attachmentField=<collection_name>.<field_name>"
```

### Collection de fichiers

Le téléchargement vers une collection de fichiers générera automatiquement un enregistrement de fichier. Lancez une action `create` sur la ressource de la collection de fichiers en envoyant une requête POST et téléchargez le contenu binaire via le champ `file`.

```shell
curl -X POST \
    -H "Authorization: Bearer <JWT>" \
    -F "file=@<path/to/file>" \
    "http://localhost:3000/api/<file_collection_name>:create"
```

Lors du téléchargement vers une collection de fichiers, il n'est pas nécessaire de spécifier un moteur de stockage ; le fichier sera téléchargé vers le moteur de stockage configuré pour cette collection.

## Téléchargement côté client

Pour les moteurs de stockage compatibles S3, fournis via le plugin commercial S3-Pro, le téléchargement via l'API HTTP nécessite plusieurs étapes.

### Champ de pièce jointe

1.  Obtenir les informations du moteur de stockage

    Lancez une action `getBasicInfo` sur la collection `storages` (les stockages), en incluant le nom du stockage, pour demander les informations de configuration du moteur de stockage.

    ```shell
    curl 'http://localhost:13000/api/storages:getBasicInfo/<storage_name>' \
      -H 'Authorization: Bearer <JWT>'
    ```

    Exemple d'informations de configuration du moteur de stockage renvoyées :

    ```json
    {
      "id": 2,
      "title": "xxx",
      "name": "xxx",
      "type": "s3-compatible",
      "rules": { ... }
    }
    ```

2.  Obtenir l'URL pré-signée du fournisseur de services

    Lancez une action `createPresignedUrl` sur la ressource `fileStorageS3` en envoyant une requête POST avec les informations relatives au fichier dans le corps de la requête, afin d'obtenir les informations de téléchargement pré-signées.

    ```shell
    curl 'http://localhost:13000/api/fileStorageS3:createPresignedUrl' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"name":<name>,"size":<size>,"type":<type>,"storageId":<storageId>,"storageType":<storageType>}'
    ```

    > Remarque :
    >
    > *   `name` : Nom du fichier
    > *   `size` : Taille du fichier (en octets)
    > *   `type` : Le type MIME du fichier. Vous pouvez consulter les [types MIME courants](https://developer.mozilla.org/fr/docs/Web/HTTP/MIME_types/Common_types)
    > *   `storageId` : L'ID du moteur de stockage (le champ `id` renvoyé à l'étape 1).
    > *   `storageType` : Le type du moteur de stockage (le champ `type` renvoyé à l'étape 1).
    >
    > Exemple de données de requête :
    >
    > ```
    > --data-raw '{"name":"a.png","size":4405,"type":"image/png","storageId":2,"storageType":"s3-compatible"}'
    > ```

    La structure des données des informations pré-signées obtenues est la suivante :

    ```json
    {
      "putUrl": "https://xxxxxxx",
      "fileInfo": {
        "key": "xxx",
        "title": "xxx",
        "filename": "xxx",
        "extname": ".png",
        "size": 4405,
        "mimetype": "image/png",
        "meta": {},
        "url": ""
      }
    }
    ```

3.  Télécharger le fichier

    Utilisez l'URL `putUrl` renvoyée pour effectuer une requête `PUT`, en téléchargeant le fichier comme corps de la requête.

    ```shell
    curl '<putUrl>' \
      -X 'PUT' \
      -T <file_path>
    ```
    > Remarque :
    > *   `putUrl` : Le champ `putUrl` renvoyé à l'étape précédente.
    > *   `file_path` : Le chemin local du fichier à télécharger.
    >
    > Exemple de données de requête :
    > ```
    > curl 'https://xxxxxxx' \
    >  -X 'PUT' \
    >  -T /Users/Downloads/a.png
    > ```

4.  Créer l'enregistrement du fichier

    Après un téléchargement réussi, créez l'enregistrement du fichier en lançant une action `create` sur la ressource `attachments` (la collection de pièces jointes) avec une requête POST.

    ```shell
    curl 'http://localhost:13000/api/attachments:create?attachmentField=<collection_name>.<field_name>' \
      -X POST \
      -H 'Accept: application/json, text/plain, */*' \
      -H 'Authorization: Bearer <JWT>' \
      -H 'Content-Type: application/json' \
      --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
    ```

    > Explication des données dépendantes dans `data-raw` :
    > *   `title` : Le champ `fileInfo.title` renvoyé à l'étape précédente.
    > *   `filename` : Le champ `fileInfo.key` renvoyé à l'étape précédente.
    > *   `extname` : Le champ `fileInfo.extname` renvoyé à l'étape précédente.
    > *   `path` : Vide par défaut.
    > *   `size` : Le champ `fileInfo.size` renvoyé à l'étape précédente.
    > *   `url` : Vide par défaut.
    > *   `mimetype` : Le champ `fileInfo.mimetype` renvoyé à l'étape précédente.
    > *   `meta` : Le champ `fileInfo.meta` renvoyé à l'étape précédente.
    > *   `storageId` : Le champ `id` renvoyé à l'étape 1.
    >
    > Exemple de données de requête :
    > ```
    >   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
    > ```

### Collection de fichiers

Les trois premières étapes sont identiques à celles du téléchargement vers un champ de pièce jointe. Cependant, à la quatrième étape, vous devez créer l'enregistrement du fichier en lançant une action `create` sur la ressource de la collection de fichiers avec une requête POST, et en téléchargeant les informations du fichier dans le corps de la requête.

```shell
curl 'http://localhost:13000/api/<file_collection_name>:create' \
  -H 'Authorization: Bearer <JWT>' \
  -H 'Content-Type: application/json' \
  --data-raw '{"title":<title>,"filename":<filename>,"extname":<extname>,"path":"","size":<size>,"url":"","mimetype":<mimetype>,"meta":<meta>,"storageId":<storageId>}'
```

> Explication des données dépendantes dans `data-raw` :
> *   `title` : Le champ `fileInfo.title` renvoyé à l'étape précédente.
> *   `filename` : Le champ `fileInfo.key` renvoyé à l'étape précédente.
> *   `extname` : Le champ `fileInfo.extname` renvoyé à l'étape précédente.
> *   `path` : Vide par défaut.
> *   `size` : Le champ `fileInfo.size` renvoyé à l'étape précédente.
> *   `url` : Vide par défaut.
> *   `mimetype` : Le champ `fileInfo.mimetype` renvoyé à l'étape précédente.
> *   `meta` : Le champ `fileInfo.meta` renvoyé à l'étape précédente.
> *   `storageId` : Le champ `id` renvoyé à l'étape 1.
>
> Exemple de données de requête :
> ```
>   --data-raw '{"title":"ATT00001","filename":"ATT00001-8nuuxkuz4jn.png","extname":".png","path":"","size":4405,"url":"","mimetype":"image/png","meta":{},"storageId":2}'
> ```
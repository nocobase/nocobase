---
pkg: "@nocobase/plugin-field-encryption"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Chiffrement

## Introduction

Certaines données commerciales sensibles, telles que les numéros de téléphone mobile des clients, les adresses e-mail ou les numéros de carte, peuvent être chiffrées. Une fois chiffrées, elles sont stockées sous forme de texte chiffré dans la base de données.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Méthode de chiffrement

:::warning
Le plugin génère automatiquement une `clé d'application`, qui est stockée dans le répertoire `/storage/apps/main/encryption-field-keys`.

Le fichier de la `clé d'application` est nommé d'après l'ID de la clé, avec l'extension `.key`. Veuillez ne pas modifier le nom du fichier.

Veuillez conserver le fichier de la `clé d'application` en lieu sûr. Si vous perdez ce fichier, les données chiffrées ne pourront pas être déchiffrées.

Si le plugin est activé pour une sous-application, la clé est par défaut enregistrée dans le répertoire `/storage/apps/${nom_sous_application}/encryption-field-keys`.
:::

### Fonctionnement

Utilise le chiffrement par enveloppe.

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Processus de création des clés
1. Lors de la première création d'un champ chiffré, une `clé d'application` de 32 bits est automatiquement générée par le système et stockée dans le répertoire de stockage par défaut, encodée en Base64.
2. Chaque fois qu'un nouveau champ chiffré est créé, une `clé de champ` aléatoire de 32 bits est générée pour ce champ. Elle est ensuite chiffrée à l'aide de la `clé d'application` et d'un `vecteur de chiffrement de champ` de 16 bits généré aléatoirement (algorithme de chiffrement `AES`), puis enregistrée dans le champ `options` de la table `fields`.

### Processus de chiffrement des champs
1. Chaque fois que vous écrivez des données dans un champ chiffré, vous récupérez d'abord la `clé de champ` chiffrée et le `vecteur de chiffrement de champ` à partir du champ `options` de la table `fields`.
2. La `clé de champ` chiffrée est déchiffrée à l'aide de la `clé d'application` et du `vecteur de chiffrement de champ`. Ensuite, les données sont chiffrées à l'aide de la `clé de champ` et d'un `vecteur de chiffrement de données` de 16 bits généré aléatoirement (algorithme de chiffrement `AES`).
3. Les données sont signées à l'aide de la `clé de champ` déchiffrée (algorithme de hachage `HMAC-SHA256`) et converties en une chaîne de caractères encodée en Base64 (la `signature de données` résultante est ensuite utilisée pour la récupération des données).
4. Le `vecteur d'initialisation de données` de 16 bits et le `texte chiffré` sont concaténés binairement, puis encodés en Base64 pour former une chaîne de caractères.
5. La chaîne de caractères encodée en Base64 de la `signature de données` et la chaîne de caractères encodée en Base64 du `texte chiffré` concaténé sont assemblées, séparées par un point (`.`).
6. La chaîne de caractères finale ainsi assemblée est enregistrée dans la base de données.

## Variables d'environnement

Si vous souhaitez spécifier une `clé d'application` personnalisée, vous pouvez utiliser la variable d'environnement `ENCRYPTION_FIELD_KEY_PATH`. Le plugin chargera le fichier situé à ce chemin comme `clé d'application`.

Exigences pour le fichier de la clé d'application :
1. L'extension du fichier doit être `.key`.
2. Le nom du fichier sera utilisé comme ID de clé ; il est recommandé d'utiliser un UUID pour garantir l'unicité.
3. Le contenu du fichier doit être des données binaires de 32 bits encodées en Base64.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Configuration des champs

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Impact sur le filtrage après chiffrement

Les champs chiffrés ne prennent en charge que les opérations suivantes :
- Égal à
- Différent de
- Existe
- N'existe pas

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Processus de filtrage des données :
1. Récupérez la `clé de champ` du champ chiffré, puis déchiffrez-la à l'aide de la `clé d'application`.
2. Utilisez la `clé de champ` pour signer le texte de recherche saisi par l'utilisateur (algorithme de hachage `HMAC-SHA256`).
3. Concaténez la signature avec un séparateur `.` et effectuez une recherche par correspondance de préfixe sur le champ chiffré dans la base de données.

## Rotation des clés

:::warning
Avant d'utiliser la commande `nocobase key-rotation`, assurez-vous que le plugin a été chargé par l'application.
:::

Lorsque vous migrez une application vers un nouvel environnement et que vous ne souhaitez pas continuer à utiliser la même clé que l'ancien environnement, vous pouvez utiliser la commande `nocobase key-rotation` pour remplacer la `clé d'application`.

L'exécution de la commande de rotation des clés nécessite de spécifier la `clé d'application` de l'ancien environnement. Après exécution, une nouvelle `clé d'application` sera générée et remplacera l'ancienne. La nouvelle `clé d'application` sera enregistrée (encodée en Base64) dans le répertoire par défaut.

```bash
# --key-path spécifie le fichier de la clé d'application de l'ancien environnement correspondant aux données chiffrées de la base de données.
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Pour remplacer la `clé d'application` d'une sous-application, vous devez ajouter le paramètre `--app-name` et spécifier le `nom` de la sous-application.

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```
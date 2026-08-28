---
pkg: "@nocobase/plugin-field-encryption"
title: "Chiffrement des champs"
description: "Chiffrez et stockez les données métier privées (numéros de téléphone, adresses e-mail, numéros de carte, etc.) sous forme chiffrée dans la base de données afin de protéger les informations sensibles."
keywords: "Chiffrement des champs,Encryption,données sensibles,stockage chiffré,NocoBase"
---
# Chiffrement

## Présentation

Certaines données métier privées, telles que les numéros de téléphone des clients, les adresses e-mail et les numéros de carte, peuvent être chiffrées. Une fois chiffrées, elles sont stockées sous forme chiffrée dans la base de données.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Méthode de chiffrement

:::warning
Le plugin génère automatiquement un`应用密钥`, qui est enregistré dans le répertoire `/storage/apps/main/encryption-field-keys`.

Le nom du fichier `应用密钥` correspond à l’ID de la clé, et son extension est `.key`. Ne modifiez pas arbitrairement le nom du fichier.

Conservez soigneusement le fichier `应用密钥`. Si vous perdez le fichier `应用密钥`, les données chiffrées ne pourront pas être déchiffrées.

Si le plugin est activé dans une sous-application, le répertoire d’enregistrement par défaut de la clé est `/storage/apps/${子应用name}/encryption-field-keys`
:::

### Fonctionnement

Le chiffrement par enveloppe est utilisé.

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Processus de création des clés
1. Lors de la première création d’un champ chiffré, le système génère automatiquement un `应用密钥` de 32 bits et l’enregistre sous forme encodée en base64 dans le répertoire de stockage par défaut.
2. À chaque création d’un nouveau champ chiffré, un `字段密钥` aléatoire de 32 bits est généré pour ce champ. Il est ensuite chiffré à l’aide de `应用密钥` et d’un `字段加密向量` aléatoire de 16 bits (algorithme de chiffrement `AES`), puis enregistré dans le champ `options` de la table `fields`.

### Processus de chiffrement des champs
1. Chaque fois que des données sont écrites dans un champ chiffré, le `字段密钥` et le `字段加密向量` chiffrés sont d’abord récupérés depuis le champ options de la table fields.
2. Utilisez `应用密钥` et `字段加密向量` pour déchiffrer le `字段密钥` chiffré, puis chiffrez les données à l’aide de `字段密钥` et d’un `数据加密向量` aléatoire de 16 bits (algorithme de chiffrement `AES`).
3. Signez les données avec le `字段密钥` déchiffré (algorithme de hachage `HMAC-SHA256`), puis convertissez la signature en chaîne encodée en base64 (le `数据签名` généré sera utilisé ultérieurement pour la recherche de données).
4. Concaténez en binaire le `数据加密向量` de 16 bits et le `数据密文` chiffré, puis convertissez le résultat en chaîne encodée en base64.
5. Concaténez la chaîne encodée en base64 `数据签名` et la chaîne encodée en base64 `数据密文` obtenue après concaténation, en les séparant par « . ».
6. Enregistrez la chaîne finale concaténée dans la base de données.


## Variables d’environnement

Pour spécifier `应用密钥`, utilisez la variable d’environnement `ENCRYPTION_FIELD_KEY_PATH`. Le plugin chargera le fichier situé à ce chemin en tant que `应用密钥`.

`应用密钥`Exigences relatives au format du fichier :
1. L’extension du fichier doit obligatoirement être `.key`.
2. Le nom du fichier sera utilisé comme ID de clé. Il est recommandé d’utiliser un UUID afin de garantir son unicité.
3. Le contenu du fichier doit être constitué de données binaires de 32 bits encodées en base64.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Configuration des champs

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Impact du chiffrement sur le filtrage

Les champs chiffrés prennent uniquement en charge les opérateurs suivants : égal à, différent de, existe et n’existe pas.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Méthode de filtrage des données :
1. Récupérez le `字段密钥` du champ chiffré, puis déchiffrez le `字段密钥` à l’aide de `应用密钥`.
2. Utilisez 字段密钥 pour signer le texte de recherche saisi par l’utilisateur (algorithme de hachage HMAC-SHA256).
3. Concaténez le texte de recherche signé avec le séparateur ., puis effectuez une recherche par correspondance de préfixe sur le champ chiffré dans la base de données.

## Rotation des clés

:::warning
Avant d’utiliser la commande de rotation des clés nocobase key-rotation, vérifiez que l’application a déjà chargé ce plugin.
:::

Après la migration de l’application vers un nouvel environnement, si vous ne souhaitez plus utiliser la même clé que dans l’ancien environnement, vous pouvez utiliser la commande nocobase key-rotation pour remplacer `应用密钥`.

L’exécution de la commande de rotation des clés nécessite de spécifier la clé d’application de l’ancien environnement. Une fois la commande exécutée, une nouvelle clé d’application est générée et remplace l’ancienne. La nouvelle clé d’application est enregistrée sous forme encodée en base64 dans le répertoire de stockage par défaut.

```bash
# --key-path 指定的是和数据库加密数据对应的旧环境的应用密钥文件
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Si vous remplacez la sous-application 应用密钥, vous devez ajouter le paramètre `--app-name` afin de spécifier `name`

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```

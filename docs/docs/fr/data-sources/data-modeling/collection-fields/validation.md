---
title: "Validation des champs"
description: "Règles de validation des champs : règles de configuration et de validation basées sur Joi, prenant en charge la longueur minimale/maximale, les champs obligatoires et autres pour les chaînes, les nombres, les dates, etc."
keywords: "validation des champs, vérification des champs,Joi,règles de validation,règles de configuration,NocoBase"
---

# Validation des champs
Pour garantir l’exactitude, la sécurité et la cohérence des données, NocoBase fournit une fonctionnalité de validation des champs. Cette fonctionnalité se divise principalement en deux parties : les règles de configuration et les règles de validation.

## Règles de configuration
![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

Les champs système de NocoBase intègrent les règles de [Joi](https://joi.dev/api/), avec la prise en charge suivante :

### Type chaîne
Les types de champs NocoBase correspondant au type chaîne de Joi comprennent : texte sur une ligne, texte multiligne, numéro de téléphone mobile, e-mail, URL, mot de passe et UUID.
#### Règles générales
- Longueur minimale
- Longueur maximale
- Longueur
- Expression régulière
- Obligatoire

#### E-mail
![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)
[Voir plus d’options](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL
![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)
[Voir plus d’options](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID
![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)
[Voir plus d’options](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### Type numérique
Les types de champs NocoBase correspondant au type numérique de Joi comprennent : entier, nombre et pourcentage.
#### Règles générales
- Supérieur à
- Inférieur à
- Valeur maximale
- Valeur minimale
- Multiple entier

#### Entier
Outre les règles générales, les champs entiers prennent également en charge la [validation des entiers](https://joi.dev/api/?v=17.13.3#numberinteger) et la [validation des entiers non sécurisés](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Nombre et pourcentage
Outre les règles générales, les champs de type nombre et pourcentage prennent également en charge la [validation de la précision](https://joi.dev/api/?v=17.13.3#numberinteger).
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Type date
Les types de champs NocoBase correspondant au type date de Joi comprennent : date (avec fuseau horaire), date (sans fuseau horaire), date uniquement et horodatage Unix.

Règles de validation prises en charge :
- Supérieur à
- Inférieur à
- Valeur maximale
- Valeur minimale
- Validation du format de l’horodatage
- Obligatoire

### Champs relationnels
Les champs relationnels prennent uniquement en charge la validation des champs obligatoires. Notez que la validation des champs obligatoires pour les champs relationnels ne peut actuellement pas être appliquée dans les sous-formulaires ou les sous-tableaux.
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Application des règles de validation
Après la configuration des règles de champ, les règles de validation correspondantes sont déclenchées lors de l’ajout ou de la modification des données.
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Lorsqu’un champ est utilisé dans un formulaire, ses règles de validation s’affichent également dans les paramètres de validation du champ. Ces règles apparaissent sous « Règles de validation des champs côté serveur » et sont affichées en lecture seule à cet endroit. Pour modifier ces règles, vous devez revenir à « Configuration de la source de données / de la table de données » afin de modifier le champ.

Vous pouvez toujours ajouter des règles supplémentaires au champ du formulaire actuel sous « Règles de validation côté client ». Ces règles n’affectent que le composant du champ actuel. Les règles de validation finalement appliquées combinent les « Règles de validation des champs côté serveur » et les « Règles de validation côté client ».

Les règles de validation s’appliquent également aux composants de sous-tableau et de sous-formulaire :
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Notez que dans les sous-formulaires ou les sous-tableaux, la validation des champs obligatoires pour les champs relationnels ne prend actuellement pas effet.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Différences entre les règles de validation des champs côté serveur et les règles de validation côté client
Les règles de validation des champs côté serveur et les règles de validation côté client sont configurées à des emplacements différents et leur portée diffère également.

### Différences de configuration
- **Règles de validation des champs côté serveur** : les règles de champ sont configurées dans « Configuration de la source de données / de la table de données ». Ces règles constituent les règles de base du champ
- **Règles de validation côté client** : des règles supplémentaires sont ajoutées dans les paramètres du champ du formulaire. Ces règles n’affectent que le composant du champ actuel
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)


### Différences au niveau du déclenchement de la validation
- **Règles de validation des champs côté serveur** : lorsque le champ est utilisé dans un formulaire, la validation côté client est déclenchée, puis la validation est également déclenchée avant l’écriture des données. Ces règles s’appliquent aussi aux scénarios d’ajout ou de modification de données via les workflows, l’importation de données, etc.
- **Règles de validation côté client** : la validation côté client est déclenchée uniquement dans le champ du formulaire actuel
- **Affichage des règles** : les règles de validation des champs côté serveur sont affichées en lecture seule en tant que règles héritées. Les règles de validation côté client sont affichées séparément et peuvent être modifiées à cet endroit
- **Messages d’erreur** : les règles de validation côté client prennent en charge les messages d’erreur personnalisés, tandis que les règles de validation des champs côté serveur ne les prennent actuellement pas en charge.
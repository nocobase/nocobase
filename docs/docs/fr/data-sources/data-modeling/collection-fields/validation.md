:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Validation des champs

Pour garantir l'exactitude, la sécurité et la cohérence des données dans vos **collections**, NocoBase propose une fonctionnalité de validation des champs. Cette fonctionnalité se divise principalement en deux parties : la configuration des règles et l'application de ces règles.

## Configuration des règles

![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

Les champs système de NocoBase intègrent les règles de [Joi](https://joi.dev/api/). Voici les types de support disponibles :

### Types de chaîne de caractères

Les types de chaîne de caractères de Joi correspondent aux types de champs NocoBase suivants : Texte sur une ligne, Texte long, Numéro de téléphone, E-mail, URL, Mot de passe et UUID.

#### Règles communes

- Longueur minimale
- Longueur maximale
- Longueur exacte
- Expression régulière (Pattern)
- Obligatoire

#### E-mail

![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)

[Voir plus d'options](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL

![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)

[Voir plus d'options](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID

![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)

[Voir plus d'options](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### Types numériques

Les types numériques de Joi correspondent aux types de champs NocoBase suivants : Entier, Nombre et Pourcentage.

#### Règles communes

- Supérieur à
- Inférieur à
- Valeur maximale
- Valeur minimale
- Multiple de

#### Entier

En plus des règles communes, les champs de type entier prennent également en charge la [validation d'entiers](https://joi.dev/api/?v=17.13.3#numberinteger) et la [validation d'entiers non sécurisés](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).

![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Nombre et Pourcentage

En plus des règles communes, les champs de type nombre et pourcentage prennent également en charge la [validation de précision](https://joi.dev/api/?v=17.13.3#numberinteger).

![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Types de date

Les types de date de Joi correspondent aux types de champs NocoBase suivants : Date (avec fuseau horaire), Date (sans fuseau horaire), Date uniquement et Horodatage Unix.

Règles de validation prises en charge :

- Supérieur à
- Inférieur à
- Valeur maximale
- Valeur minimale
- Format d'horodatage
- Obligatoire

### Champs de relation

Les champs de relation ne prennent en charge que la validation "obligatoire". Il est important de noter que la validation "obligatoire" pour les champs de relation n'est actuellement pas prise en charge dans les scénarios de sous-formulaire ou de sous-tableau.

![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Application des règles de validation

Une fois les règles de champ configurées, les règles de validation correspondantes seront déclenchées lors de l'ajout ou de la modification de données.

![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Les règles de validation s'appliquent également aux composants de sous-tableau et de sous-formulaire :

![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Il est à noter que dans les scénarios de sous-formulaire ou de sous-tableau, la validation "obligatoire" pour les champs de relation n'est pas encore effective.

![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Différences avec la validation des champs côté client

La validation des champs côté client et côté serveur s'applique à des scénarios d'utilisation différents. Elles présentent des différences significatives en termes de mise en œuvre et de moment de déclenchement des règles, nécessitant ainsi une gestion distincte.

### Différences de méthode de configuration

- **Validation côté client** : Vous configurez les règles directement dans les formulaires d'édition (comme illustré ci-dessous).
- **Validation des champs côté serveur** : Vous définissez les règles de champ dans **Source de données** → Configuration de la **collection**.

![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)

### Différences de moment de déclenchement de la validation

- **Validation côté client** : Elle se déclenche en temps réel lorsque les utilisateurs remplissent les champs, affichant immédiatement les messages d'erreur.
- **Validation des champs côté serveur** : Elle est effectuée côté serveur après la soumission des données et avant leur enregistrement. Les messages d'erreur sont renvoyés via les réponses de l'API.
- **Portée de l'application** : La validation des champs côté serveur prend effet non seulement lors de la soumission de formulaires, mais elle est également déclenchée dans tous les scénarios impliquant l'ajout ou la modification de données, tels que les **flux de travail** et les importations de données.
- **Messages d'erreur** : La validation côté client prend en charge les messages d'erreur personnalisés, tandis que la validation côté serveur ne les prend pas encore en charge.
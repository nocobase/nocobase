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

Lorsque le champ est utilisé dans un formulaire, ses règles de validation apparaissent également dans les paramètres de validation du champ. Ces règles sont affichées sous **Règles de validation des champs côté serveur** et y sont en lecture seule. Si vous devez les modifier, éditez le champ dans Source de données → Configuration de la collection.

Vous pouvez toujours ajouter des règles supplémentaires pour le champ de formulaire actuel sous **Règles de validation côté client**. Ces règles s'appliquent uniquement au composant de champ actuel. Le résultat final de la validation combine les **Règles de validation des champs côté serveur** et les **Règles de validation côté client**.

Les règles de validation s'appliquent également aux composants de sous-tableau et de sous-formulaire :

![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Il est à noter que dans les scénarios de sous-formulaire ou de sous-tableau, la validation "obligatoire" pour les champs de relation n'est pas encore effective.

![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Différences entre les règles de validation des champs côté serveur et côté client

Les règles de validation des champs côté serveur et côté client se configurent à des endroits différents et n'ont pas le même périmètre.

### Différences de méthode de configuration

- **Règles de validation des champs côté serveur** : Vous définissez les règles du champ dans Source de données → Configuration de la collection. Ces règles sont les règles de base du champ.
- **Règles de validation côté client** : Vous configurez des règles supplémentaires dans les paramètres d'un champ de formulaire. Ces règles affectent uniquement le composant de champ actuel.

![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)

### Différences de moment de déclenchement de la validation

- **Règles de validation des champs côté serveur** : Elles déclenchent une validation côté frontend lorsque le champ est utilisé dans un formulaire, et valident également les données avant leur écriture. Elles s'appliquent aussi aux scénarios qui créent ou mettent à jour des données, comme les workflows et les importations de données.
- **Règles de validation côté client** : Elles déclenchent la validation côté frontend uniquement dans le champ de formulaire actuel.
- **Affichage des règles** : Les règles de validation des champs côté serveur sont affichées comme des règles héritées en lecture seule. Les règles de validation côté client sont affichées séparément et peuvent y être modifiées.
- **Messages d'erreur** : Les règles de validation côté client prennent en charge les messages d'erreur personnalisés, tandis que les règles de validation des champs côté serveur ne les prennent pas encore en charge.

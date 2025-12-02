:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Un-à-un

Dans une relation entre des employés et des profils personnels, chaque employé ne peut avoir qu'un seul enregistrement de profil personnel, et chaque enregistrement de profil personnel ne peut correspondre qu'à un seul employé. On parle alors d'une relation un-à-un entre l'employé et le profil personnel.

La clé étrangère dans une relation un-à-un peut être placée soit dans la collection source, soit dans la collection cible. Si elle représente une relation de type « a un », la clé étrangère est plus appropriée dans la collection cible. Si elle représente une relation de type « appartient à », alors la clé étrangère est mieux placée dans la collection source.

Par exemple, dans le cas mentionné ci-dessus, où un employé n'a qu'un seul profil personnel et que ce profil personnel appartient à l'employé, il est approprié de placer la clé étrangère dans la collection de profils personnels.

## Un-à-un (A un)

Cela indique qu'un employé a un enregistrement de profil personnel.

Relation ER

![alt text](https://static-docs.nocobase.com/4359e128936bbd7c9ff51bcff1d646dd.png)

Configuration du champ

![alt text](https://static-docs.nocobase.com/7665a87e094b4fb50c9426a108f87105.png)

## Un-à-un (Appartient à)

Cela indique qu'un profil personnel appartient à un employé spécifique.

Relation ER

![](https://static-docs.nocobase.com/31e7cc3e630220cf1e98573ca24ac72d.png)

Configuration du champ

![alt text](https://static-docs.nocobase.com/4f09eeb3c7717d61a349842da43c187c.png)

## Description des paramètres

### Source collection

La collection source, c'est-à-dire la collection où se trouve le champ actuel.

### Target collection

La collection cible, la collection avec laquelle la relation est établie.

### Foreign key

Utilisée pour établir une relation entre deux collections. Dans une relation un-à-un, la clé étrangère peut être placée soit dans la collection source, soit dans la collection cible. Si elle représente une relation de type « a un », la clé étrangère est plus appropriée dans la collection cible. Si elle représente une relation de type « appartient à », alors la clé étrangère est mieux placée dans la collection source.

### Source key <- Foreign key (Clé étrangère dans la collection cible)

Le champ référencé par la contrainte de clé étrangère doit être unique. Lorsque la clé étrangère est placée dans la collection cible, cela indique une relation de type « a un ».

### Target key <- Foreign key (Clé étrangère dans la collection source)

Le champ référencé par la contrainte de clé étrangère doit être unique. Lorsque la clé étrangère est placée dans la collection source, cela indique une relation de type « appartient à ».

### ON DELETE

ON DELETE fait référence aux règles d'action pour la référence de clé étrangère dans la collection enfant associée lors de la suppression d'enregistrements de la collection parente. C'est une option définie lors de l'établissement d'une contrainte de clé étrangère. Les options ON DELETE courantes incluent :

- CASCADE : Lorsque vous supprimez un enregistrement dans la collection parente, tous les enregistrements associés dans la collection enfant sont automatiquement supprimés.
- SET NULL : Lorsque vous supprimez un enregistrement dans la collection parente, la valeur de la clé étrangère dans la collection enfant associée est définie sur NULL.
- RESTRICT : L'option par défaut. La suppression d'un enregistrement de la collection parente est refusée s'il existe des enregistrements associés dans la collection enfant.
- NO ACTION : Similaire à RESTRICT. La suppression d'un enregistrement de la collection parente est refusée s'il existe des enregistrements associés dans la collection enfant.
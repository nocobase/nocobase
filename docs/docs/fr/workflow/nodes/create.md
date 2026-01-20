:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Créer un enregistrement

Permet d'ajouter un nouvel enregistrement à une collection.

Les valeurs des champs du nouvel enregistrement peuvent utiliser des variables du contexte du flux de travail. Pour attribuer des valeurs aux champs d'association, vous pouvez directement référencer les variables de données correspondantes dans le contexte, qu'il s'agisse d'un objet ou d'une valeur de clé étrangère. Si vous n'utilisez pas de variables, vous devrez saisir manuellement les valeurs des clés étrangères. Pour les relations un-à-plusieurs, les multiples valeurs de clés étrangères doivent être séparées par des virgules.

## Créer un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud « Créer un enregistrement » :

![Ajouter le nœud « Créer un enregistrement »](https://static-docs.nocobase.com/386c8c01c89b1eeab848510e77f4841a.png)

## Configuration du nœud

![Nœud Créer un enregistrement_Exemple_Configuration du nœud](https://static-docs.nocobase.com/5f7b97a51b64a1741cf82a4d4455b610.png)

### Collection

Sélectionnez la collection à laquelle vous souhaitez ajouter un nouvel enregistrement.

### Valeurs des champs

Attribuez des valeurs aux champs de la collection. Vous pouvez utiliser des variables du contexte du flux de travail ou saisir manuellement des valeurs statiques.

:::info{title="Remarque"}
Les données créées par le nœud « Créer un enregistrement » dans un flux de travail ne gèrent pas automatiquement les données utilisateur telles que « Créé par » et « Dernière modification par ». Vous devez configurer vous-même les valeurs de ces champs selon vos besoins.
:::

### Précharger les données d'association

Si les champs du nouvel enregistrement incluent des champs d'association et que vous souhaitez utiliser les données d'association correspondantes dans les étapes ultérieures du flux de travail, vous pouvez cocher les champs d'association pertinents dans la configuration de préchargement. Ainsi, une fois le nouvel enregistrement créé, les données d'association correspondantes seront automatiquement chargées et stockées avec les données de résultat du nœud.

## Exemple

Par exemple, lorsqu'un enregistrement dans la collection « Articles » est créé ou mis à jour, un enregistrement « Versions d'articles » doit être automatiquement créé pour enregistrer l'historique des modifications de l'article. Vous pouvez utiliser le nœud « Créer un enregistrement » pour y parvenir :

![Nœud Créer un enregistrement_Exemple_Configuration du flux de travail](https://static-docs.nocobase.com/dfb4820d49c145fa331883fc09c9161f.png)

![Nœud Créer un enregistrement_Exemple_Configuration du nœud](https://static-docs.nocobase.com/1a0992e66170be12a068da6503298868.png)

Après avoir activé le flux de travail avec cette configuration, lorsqu'un enregistrement dans la collection « Articles » est modifié, un enregistrement « Versions d'articles » sera automatiquement créé pour consigner l'historique des modifications de l'article.
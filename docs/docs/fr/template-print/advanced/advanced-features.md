:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

## Fonctionnalités avancées

### Pagination

#### 1. Mise à jour des numéros de page

##### Syntaxe
Il suffit de l'insérer dans votre logiciel Office.

##### Exemple
Dans Microsoft Word :
- Utilisez la fonction « Insertion → Numéro de page »
Dans LibreOffice :
- Utilisez la fonction « Insertion → Champs → Numéro de page »

##### Résultat
Dans le rapport généré, les numéros de page de chaque page seront mis à jour automatiquement.

#### 2. Génération de la table des matières

##### Syntaxe
Il suffit de l'insérer dans votre logiciel Office.

##### Exemple
Dans Microsoft Word :
- Utilisez la fonction « Insertion → Index et tables → Table des matières »
Dans LibreOffice :
- Utilisez la fonction « Insertion → Table des matières et index → Table, index ou bibliographie »

##### Résultat
La table des matières du rapport sera mise à jour automatiquement en fonction du contenu du document.

#### 3. Répétition des en-têtes de tableau

##### Syntaxe
Il suffit de l'insérer dans votre logiciel Office.

##### Exemple
Dans Microsoft Word :
- Faites un clic droit sur l'en-tête du tableau → Propriétés du tableau → Cochez « Répéter en tant que ligne d'en-tête en haut de chaque page »
Dans LibreOffice :
- Faites un clic droit sur l'en-tête du tableau → Propriétés du tableau → Onglet Flux de texte → Cochez « Répéter l'en-tête »

##### Résultat
Lorsqu'un tableau s'étend sur plusieurs pages, l'en-tête se répète automatiquement en haut de chaque page.

### Internationalisation (i18n)

#### 1. Traduction de texte statique

##### Syntaxe
Utilisez la balise `{t(texte)}` pour internationaliser le texte statique :
```
{t(meeting)}
```

##### Exemple
Dans le modèle :
```
{t(meeting)} {t(apples)}
```
Les données JSON ou un dictionnaire de localisation externe (par exemple, pour "fr-fr") fournissent les traductions correspondantes, comme « meeting » → « rendez-vous » et « apples » → « Pommes ».

##### Résultat
Lors de la génération du rapport, le texte sera remplacé par la traduction correspondante en fonction de la langue cible.

#### 2. Traduction de texte dynamique

##### Syntaxe
Pour le contenu des données, utilisez le formateur `:t`, par exemple :
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```

##### Exemple
Dans le modèle :
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```
Les données JSON et le dictionnaire de localisation fournissent les traductions appropriées.

##### Résultat
En fonction de la condition, la sortie sera « lundi » ou « mardi » (en prenant la langue cible comme exemple).

### Mappage clé-valeur

#### 1. Conversion d'énumération (:convEnum)

##### Syntaxe
```
{données:convEnum(nomEnum)}
```
Par exemple :
```
0:convEnum('ORDER_STATUS')
```

##### Exemple
Dans un exemple d'options d'API, les éléments suivants sont fournis :
```json
{
  "enum": {
    "ORDER_STATUS": ["pending", "sent", "delivered"]
  }
}
```
Dans le modèle :
```
0:convEnum('ORDER_STATUS')
```

##### Résultat
Affiche « pending » ; si l'index dépasse la plage de l'énumération, la valeur originale est affichée.

### Images dynamiques
:::info
Actuellement, seuls les types de fichiers XLSX et DOCX sont pris en charge.
:::
Vous pouvez insérer des « images dynamiques » dans les modèles de document. Cela signifie que les images de substitution dans le modèle seront automatiquement remplacées par des images réelles lors du rendu, en fonction des données. Ce processus est très simple et ne nécessite que les étapes suivantes :

1. Insérez une image temporaire comme espace réservé.

2. Modifiez le « Texte alternatif » de cette image pour définir l'étiquette du champ.

3. Rendez le document, et le système la remplacera automatiquement par l'image réelle.

Ci-dessous, nous allons expliquer les méthodes d'opération pour les fichiers DOCX et XLSX à travers des exemples spécifiques.

#### Insertion d'images dynamiques dans les fichiers DOCX
##### Remplacement d'une seule image

1. Ouvrez votre modèle DOCX et insérez une image temporaire (il peut s'agir de n'importe quelle image de substitution, comme une [image bleu uni](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png)).

:::info
**Instructions sur le format d'image**

- Actuellement, les images de substitution ne prennent en charge que le format PNG. Nous vous recommandons d'utiliser notre exemple fourni : [image bleu uni](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png).
- Les images cibles rendues ne prennent en charge que les formats PNG, JPG et JPEG. D'autres types d'images pourraient échouer à être rendus.

**Instructions sur la taille d'image**

Que ce soit pour les fichiers DOCX ou XLSX, la taille finale de l'image rendue suivra les dimensions de l'image temporaire dans le modèle. Autrement dit, l'image de remplacement réelle sera automatiquement mise à l'échelle pour correspondre à la taille de l'image de substitution que vous avez insérée. Si vous souhaitez que l'image rendue ait une taille de 150×150, veuillez utiliser une image temporaire dans le modèle et l'ajuster à cette taille.
:::

2. Faites un clic droit sur cette image, modifiez son « Texte alternatif (Alt Text) » et saisissez l'étiquette du champ d'image que vous souhaitez insérer, par exemple `{d.imageUrl}` :

![20250414211130-2025-04-14-21-11-31](https://static-docs.nocobase.com/20250414211130-2025-04-14-21-11-31.png)

3. Utilisez les données d'exemple suivantes pour le rendu :
```json
{
  "name": "Apple",
  "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
}
```

4. Dans le résultat rendu, l'image temporaire sera remplacée par l'image réelle :

![20250414203444-2025-04-14-20-34-46](https://static-docs.nocobase.com/20250414203444-2025-04-14-20-34-46.png)

##### Remplacement d'images multiples en boucle

Si vous souhaitez insérer un groupe d'images dans le modèle, comme une liste de produits, vous pouvez également le faire via des boucles. Les étapes spécifiques sont les suivantes :

1. Supposons que vos données soient les suivantes :
```json
{
  "products": [
    {
      "name": "Apple",
      "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg",
    },
    {
      "name": "Banana",
      "imageUrl": "https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg",
    },
  ]
}
```

2. Dans le modèle DOCX, configurez une zone de boucle et insérez des images temporaires dans chaque élément de la boucle avec le texte alternatif défini sur `{d.products[i].imageUrl}`, comme illustré ci-dessous :

![20250414205418-2025-04-14-20-54-19](https://static-docs.nocobase.com/20250414205418-2025-04-14-20-54-19.png)

3. Après le rendu, toutes les images temporaires seront remplacées par leurs images de données respectives :

![20250414205503-2025-04-14-20-55-05](https://static-docs.nocobase.com/20250414205503-2025-04-14-20-55-05.png)

#### Insertion d'images dynamiques dans les fichiers XLSX

La méthode d'opération dans les modèles Excel (XLSX) est fondamentalement la même, il suffit de noter les points suivants :

1. Après avoir inséré une image, assurez-vous de sélectionner « image dans la cellule » plutôt que d'avoir l'image flottant au-dessus de la cellule.

![20250414211643-2025-04-14-21-16-45](https://static-docs.nocobase.com/20250414211643-2025-04-14-21-16-45.png)

2. Après avoir sélectionné la cellule, cliquez pour afficher le « Texte alternatif » afin de renseigner l'étiquette du champ, par exemple `{d.imageUrl}`.

### Codes-barres
:::info
Actuellement, seuls les types de fichiers XLSX et DOCX sont pris en charge.
:::

#### Génération de codes-barres (tels que les codes QR)

La génération de codes-barres fonctionne de la même manière que les images dynamiques, ne nécessitant que trois étapes :

1. Insérez une image temporaire dans le modèle pour marquer l'emplacement du code-barres.

2. Modifiez le « Texte alternatif » de l'image et saisissez l'étiquette du champ de format de code-barres, par exemple `{d.code:barcode(qrcode)}`, où `qrcode` est le type de code-barres (voir la liste des types pris en charge ci-dessous).

![20250414214626-2025-04-14-21-46-28](https://static-docs.nocobase.com/20250414214626-2025-04-14-21-46-28.png)

3. Après le rendu, l'image de substitution sera automatiquement remplacée par l'image du code-barres correspondant :

![20250414214925-2025-04-14-21-49-26](https://static-docs.nocobase.com/20250414214925-2025-04-14-21-49-26.png)

#### Types de codes-barres pris en charge

| Nom du code-barres | Type   |
| ------------------ | ------ |
| Code QR            | qrcode |
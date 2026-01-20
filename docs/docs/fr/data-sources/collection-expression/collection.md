:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Collection d'expressions

## Créer une collection modèle "Expression"

Avant d'utiliser des nœuds d'opération d'expression dynamique dans un flux de travail, vous devez d'abord créer une collection modèle "Expression" à l'aide de l'outil de gestion des collections. Cette collection servira de référentiel pour différentes expressions :

![Créer une collection modèle d'expressions](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Saisir les données d'expression

Ensuite, créez un bloc tableau pour ajouter plusieurs entrées de formule à cette collection modèle. Chaque ligne de données dans la collection modèle "Expression" peut être considérée comme une règle de calcul conçue pour un modèle de données spécifique au sein de la collection. Vous pouvez utiliser les valeurs de champ des modèles de données de différentes collections comme variables, en élaborant des expressions uniques comme règles de calcul. Bien sûr, vous pouvez également utiliser différents moteurs de calcul.

![Saisir les données d'expression](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Conseil}
Une fois les formules établies, vous devez les lier aux données métier. Associer directement chaque ligne de données métier à une ligne de données de formule peut être fastidieux. C'est pourquoi nous utilisons généralement une collection de métadonnées, similaire à une collection de classification, pour créer une relation plusieurs-à-un (ou un-à-un) avec la collection de formules. Ensuite, les données métier sont associées aux métadonnées classifiées via une relation plusieurs-à-un. Cette approche vous permet de simplement spécifier les métadonnées classifiées pertinentes lors de la création des données métier, facilitant ainsi la localisation et l'utilisation des données de formule correspondantes via le chemin d'association établi.
:::

## Charger les données pertinentes dans le flux de travail

À titre d'exemple, créez un flux de travail déclenché par un événement de collection. Lorsque vous créez une commande, le déclencheur doit précharger les données de produit associées à la commande, ainsi que les données d'expression liées à ces produits :

![Événement de collection_Configuration du déclencheur](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)
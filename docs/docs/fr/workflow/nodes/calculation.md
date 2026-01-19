:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Calcul

Le nœud de **calcul** permet d'évaluer une expression. Le résultat de ce calcul est enregistré dans le nœud correspondant, et peut être utilisé par les nœuds suivants. C'est un outil puissant pour calculer, traiter et transformer des données. Dans une certaine mesure, il peut remplacer la fonctionnalité des langages de programmation qui consiste à appeler une fonction sur une valeur et à l'assigner à une variable.

## Créer un nœud

Dans l'interface de configuration du **flux de travail**, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud de « Calcul » :

![计算节点_添加](https://static-docs.nocobase.com/58a465540d26945251cd143eb4b16579.png)

## Configuration du nœud

![计算节点_节点配置](https://static-docs.nocobase.com/6a155de3f6a83d8cd1881b2d9c33874.png)

### Moteur de calcul

Le moteur de calcul définit la syntaxe prise en charge par l'expression. Actuellement, les moteurs de calcul pris en charge sont [Math.js](https://mathjs.org/) et [Formula.js](https://formulajs.info/). Chaque moteur intègre un grand nombre de fonctions courantes et de méthodes d'opération de données. Pour une utilisation spécifique, veuillez consulter leur documentation officielle.

:::info{title=Conseil}
Il est important de noter que les différents moteurs gèrent l'accès aux indices de tableau différemment. Les indices de Math.js commencent à partir de `1`, tandis que ceux de Formula.js commencent à partir de `0`.
:::

De plus, si vous avez besoin d'une simple concaténation de chaînes de caractères, vous pouvez utiliser directement le « Modèle de chaîne ». Ce moteur remplacera les variables de l'expression par leurs valeurs correspondantes, puis renverra la chaîne de caractères concaténée.

### Expression

Une expression est une représentation textuelle (chaîne de caractères) d'une formule de calcul. Elle peut être composée de variables, de constantes, d'opérateurs et de fonctions prises en charge. Vous pouvez utiliser les variables du contexte du **flux de travail**, telles que le résultat d'un nœud précédant le nœud de calcul, ou les variables locales d'une boucle.

Si l'expression saisie ne respecte pas la syntaxe, une erreur sera affichée dans la configuration du nœud. Si, lors de l'exécution, une variable n'existe pas, que le type ne correspond pas, ou qu'une fonction inexistante est utilisée, le nœud de calcul se terminera prématurément avec un statut d'erreur.

## Exemple

### Calculer le prix total d'une commande

Généralement, une commande peut contenir plusieurs articles, chacun ayant un prix et une quantité différents. Le prix total de la commande doit être la somme des produits du prix et de la quantité de tous les articles. Après avoir chargé la liste des détails de la commande (un ensemble de données avec une relation un-à-plusieurs), vous pouvez utiliser un nœud de calcul pour déterminer le prix total de la commande :

![计算节点_示例_节点配置](https://static-docs.nocobase.com/85966b0116afb49aa966eeaa85e78dae.png)

Ici, la fonction `SUMPRODUCT` de Formula.js peut calculer la somme des produits pour deux tableaux de même longueur, ce qui permet d'obtenir le prix total de la commande.
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Qu'est-ce que FlowEngine ?

FlowEngine est un nouveau moteur de développement front-end sans code et low-code, introduit avec NocoBase 2.0. Il combine les modèles (Model) et les flux (Flow) pour simplifier la logique front-end, améliorer la réutilisabilité et la maintenabilité. De plus, grâce à la configurabilité des flux, il dote les composants front-end et la logique métier de capacités de configuration et d'orchestration sans code.

## Pourquoi l'appeler FlowEngine ?

Parce que dans FlowEngine, les propriétés et la logique des composants ne sont plus définies statiquement, mais sont pilotées et gérées par un **flux (Flow)**.

*   **Flow**, tel un flux de données, décompose la logique en étapes (Step) ordonnées et les applique séquentiellement au composant ;
*   **Engine** signifie qu'il s'agit d'un moteur qui pilote la logique et les interactions front-end.

Ainsi, **FlowEngine = Un moteur de logique front-end piloté par des flux**.

## Qu'est-ce qu'un Model ?

Dans FlowEngine, un Model est un modèle abstrait d'un composant, responsable de :

*   Gérer les **propriétés (Props) et l'état** du composant ;
*   Définir la **méthode de rendu** du composant ;
*   Héberger et exécuter le **flux (Flow)** ;
*   Gérer de manière unifiée la **distribution des événements** et les **cycles de vie**.

En d'autres termes, **le Model est le cerveau logique du composant**, le transformant d'un élément statique en une unité dynamique, configurable et orchestrable.

## Qu'est-ce qu'un Flow ?

Dans FlowEngine, un **Flow est un flux logique au service du Model**.
Son rôle est de :

*   Décomposer la logique des propriétés ou des événements en étapes (Step) et les exécuter séquentiellement, à la manière d'un flux ;
*   Gérer les changements de propriétés ainsi que les réponses aux événements ;
*   Rendre la logique **dynamique, configurable et réutilisable**.

## Comment comprendre ces concepts ?

Vous pouvez imaginer un **Flow** comme un **courant d'eau** :

*   **Une étape (Step) est comme un nœud sur le chemin du courant**
    Chaque étape (Step) accomplit une petite tâche (par exemple, définir une propriété, déclencher un événement, appeler une API), tout comme l'eau produit un effet lorsqu'elle passe par une écluse ou une roue à aubes.

*   **Le flux est ordonné**
    Le courant d'eau suit un chemin prédéterminé de l'amont vers l'aval, passant par toutes les étapes (Step) dans l'ordre ; de même, la logique d'un Flow est exécutée dans l'ordre défini.

*   **Le flux peut être ramifié et combiné**
    Un courant d'eau peut se diviser en plusieurs petits courants ou se regrouper ; un Flow peut également être décomposé en plusieurs sous-flux ou combiné en des chaînes logiques plus complexes.

*   **Le flux est configurable et contrôlable**
    La direction et le volume d'un courant d'eau peuvent être ajustés par une écluse ; la méthode d'exécution et les paramètres d'un Flow peuvent également être contrôlés via la configuration (stepParams).

Résumé de l'analogie

*   Un **composant** est comme une roue à aubes qui a besoin d'un courant d'eau pour tourner ;
*   Le **Model** est la base et le contrôleur de cette roue à aubes, responsable de recevoir l'eau et de piloter son fonctionnement ;
*   Le **Flow** est ce courant d'eau qui passe par chaque étape (Step) dans l'ordre, faisant en sorte que le composant change et réponde continuellement.

Ainsi, dans FlowEngine :

*   **Flow permet à la logique de circuler naturellement comme un courant d'eau** ;
*   **Model fait du composant le porteur et l'exécuteur de ce courant**.
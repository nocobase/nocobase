:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Qu'est-ce que FlowEngine ?

FlowEngine est un nouveau moteur de développement front-end sans code/low-code introduit avec NocoBase 2.0. Il combine les Modèles (Model) et les Flux (Flow) pour simplifier la logique front-end et améliorer la réutilisabilité et la maintenabilité. De plus, en tirant parti de la configurabilité des Flux, il offre des capacités de configuration et d'orchestration sans code pour les composants front-end et la logique métier.

## Pourquoi l'appelle-t-on FlowEngine ?

Dans FlowEngine, les propriétés et la logique d'un composant ne sont plus définies statiquement, mais sont pilotées et gérées par des **Flux**.

*   Un **Flux**, tel un flux de données, décompose la logique en étapes (Steps) ordonnées qui s'appliquent progressivement au composant.
*   Un **Moteur (Engine)** signifie qu'il s'agit d'un moteur qui pilote la logique et les interactions front-end.

Ainsi, **FlowEngine = Un moteur de logique front-end piloté par les Flux**.

## Qu'est-ce qu'un Modèle ?

Dans FlowEngine, un Modèle est un modèle abstrait d'un composant, responsable de :

*   La gestion des **propriétés (Props) et de l'état** du composant ;
*   La définition de la **méthode de rendu** du composant ;
*   L'hébergement et l'exécution des **Flux** ;
*   La gestion uniforme de la **distribution des événements** et des **cycles de vie**.

En d'autres termes, **un Modèle est le cerveau logique d'un composant**, le transformant d'une unité statique en une unité dynamique configurable et orchestrable.

## Qu'est-ce qu'un Flux ?

Dans FlowEngine, **un Flux est un flux logique qui sert un Modèle**.
Son objectif est de :

*   Décomposer la logique des propriétés ou des événements en étapes (Steps) et les exécuter séquentiellement sous forme de flux ;
*   Gérer les changements de propriétés ainsi que les réponses aux événements ;
*   Rendre la logique **dynamique, configurable et réutilisable**.

## Comment comprendre ces concepts ?

Vous pouvez imaginer un **Flux** comme un **courant d'eau** :

*   **Une Étape (Step) est comme un nœud le long du courant d'eau**
    Chaque Étape exécute une petite tâche (par exemple, définir une propriété, déclencher un événement, appeler une API), tout comme un courant d'eau a un effet lorsqu'il passe par une écluse ou une roue à aubes.

*   **Les Flux sont ordonnés**
    Un courant d'eau suit un chemin prédéterminé de l'amont vers l'aval, passant par toutes les Étapes séquentiellement ; de même, la logique d'un Flux est exécutée dans l'ordre défini.

*   **Les Flux peuvent être ramifiés et combinés**
    Un courant d'eau peut se diviser en plusieurs petits ruisseaux ou se fusionner ; un Flux peut également être décomposé en plusieurs sous-flux ou combiné en des chaînes logiques plus complexes.

*   **Les Flux sont configurables et contrôlables**
    La direction et le volume d'un courant d'eau peuvent être ajustés avec une écluse ; la méthode d'exécution et les paramètres d'un Flux peuvent également être contrôlés via la configuration (stepParams).

En résumé de l'analogie

*   Un **composant** est comme une roue à aubes qui a besoin d'un courant d'eau pour tourner.
*   Un **Modèle** est la base et le contrôleur de cette roue à aubes, responsable de la réception du courant d'eau et de son fonctionnement.
*   Un **Flux** est ce courant d'eau, passant par chaque Étape dans l'ordre, poussant le composant à changer et à réagir continuellement.

Ainsi, dans FlowEngine :

*   Les **Flux permettent à la logique de circuler naturellement comme un courant d'eau**.
*   Les **Modèles permettent aux composants de devenir les porteurs et les exécuteurs de ce courant**.
---
pkg: "@nocobase/plugin-calendar"
title: "Bloc calendrier"
description: "Le bloc calendrier affiche les événements et les données de date dans une vue calendrier. Il convient à la planification de réunions et d’activités, avec la configuration du champ de titre, des heures de début et de fin, du calendrier lunaire et de la plage de données."
keywords: "bloc calendrier,vue calendrier,événement,planification de réunions,Calendar,NocoBase"
---
# Bloc calendrier

## Présentation

Le bloc calendrier affiche les données liées aux événements et aux dates dans une vue calendrier. Il convient notamment à la planification de réunions et d’activités.

## Installation

Plugin intégré, aucune installation requise.

## Ajouter un bloc

![20250403220300](https://static-docs.nocobase.com/20250403220300.png)

1. Champ de titre : informations affichées sur les barres du calendrier ; prend actuellement en charge les types de champs `input`, `select`, `phone`, `email`, `radioGroup` et `sequence`. Les types de champs pris en charge par le bloc calendrier peuvent être étendus au moyen de plugins.
2. Heure de début : heure de début de la tâche ;
3. Heure de fin : heure de fin de la tâche ;

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>


Cliquez sur une barre de tâche pour la mettre en surbrillance et ouvrir une fenêtre contextuelle.

![20240408171928](https://static-docs.nocobase.com/20240408171928.png)

## Options de configuration du bloc

![20240419203321](https://static-docs.nocobase.com/20240419203321.png)

### Afficher le calendrier lunaire

![20240419203603](https://static-docs.nocobase.com/20240419203603.png)

-
-

### Configurer la plage de données

![20240419203751](https://static-docs.nocobase.com/20240419203751.png)

Pour plus d’informations, consultez

### Définir la hauteur du bloc

Exemple : ajuster la hauteur du bloc calendrier des commandes afin qu’aucune barre de défilement n’apparaisse à l’intérieur du bloc calendrier.

![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)

Pour plus d’informations, consultez

### Champ de couleur d’arrière-plan

:::info{title=Conseil}
La version de NocoBase doit être v1.4.0-beta ou ultérieure.
:::

Cette option permet de configurer la couleur d’arrière-plan des événements du calendrier. Procédez comme suit :

1. La table de données du calendrier doit contenir un champ de type **liste déroulante à sélection unique (Single select)** ou **groupe de boutons radio (Radio group)**, auquel une couleur doit être configurée.
2. Ensuite, revenez à l’interface de configuration du bloc calendrier et sélectionnez, dans le **champ de couleur d’arrière-plan**, le champ auquel vous venez d’attribuer une couleur.
3. Enfin, essayez de sélectionner une couleur pour un événement du calendrier, puis cliquez sur Envoyer. Vous pourrez alors constater que la couleur est appliquée.

![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)

### Premier jour de la semaine

> Prise en charge à partir de la version v1.7.7

Le bloc calendrier permet de définir le premier jour de la semaine. Vous pouvez choisir **dimanche** ou **lundi** comme premier jour de la semaine.
Le premier jour par défaut est **lundi**, afin de permettre aux utilisateurs d’adapter l’affichage du calendrier aux habitudes de leur région et de mieux répondre à leurs besoins réels.

![20250707165958](https://static-docs.nocobase.com/20250707165958.png)
## Configurer les opérations

![20240419203424](https://static-docs.nocobase.com/20240419203424.png)

### Aujourd’hui

Le bouton « Aujourd’hui » du bloc calendrier offre une fonction de navigation pratique, permettant aux utilisateurs de revenir rapidement à la page du calendrier correspondant à la date actuelle après avoir consulté d’autres dates.

![20240419203514](https://static-docs.nocobase.com/20240419203514.png)

### Changer de vue

La vue mensuelle est définie par défaut.

![20240419203349](https://static-docs.nocobase.com/20240419203349.png)

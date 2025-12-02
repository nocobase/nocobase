:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Définir la portée des données

## Introduction

La définition de la portée des données pour un champ de relation est similaire à celle d'un bloc. Elle permet de définir des conditions de filtrage par défaut pour les données associées.

## Instructions d'utilisation

![20251028211328](https://static-docs.nocobase.com/20251028211328.png)

### Valeur statique

Exemple : Seuls les produits non supprimés peuvent être sélectionnés pour l'association.

> La liste des champs contient les champs de la collection cible du champ de relation.

![20251028211434](https://static-docs.nocobase.com/20251028211434.png)

### Valeur de variable

Exemple : Seuls les produits dont la date de service est postérieure à la date de commande peuvent être sélectionnés pour l'association.

![20251028211727](https://static-docs.nocobase.com/20251028211727.png)

Pour plus d'informations sur les variables, consultez [Variables](/interface-builder/variables)

### Liaison de champs de relation

La liaison entre les champs de relation est réalisée en définissant la portée des données.

Exemple : La collection "Commandes" contient un champ de relation "Produit d'opportunité" (un-à-plusieurs) et un champ de relation "Opportunité" (plusieurs-à-un). La collection "Produit d'opportunité" contient également un champ de relation "Opportunité" (plusieurs-à-un). Dans le bloc de formulaire de commande, les données sélectionnables pour "Produit d'opportunité" sont filtrées pour n'afficher que les produits d'opportunité associés à l'opportunité actuellement sélectionnée dans le formulaire.

![20251028212943](https://static-docs.nocobase.com/20251028212943.png)

![20240422154145](https://static-docs.nocobase.com/20240422154145.png)

![20251028213408](https://static-docs.nocobase.com/20251028213408.gif)
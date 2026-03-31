:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

## Problèmes courants et solutions

### 1. Les colonnes et cellules vides des modèles Excel disparaissent lors du rendu

**Description du problème** : Dans les modèles Excel, si une cellule ne contient aucun contenu ou style, elle risque d'être supprimée pendant le rendu, entraînant l'absence de cette cellule dans le document final.

**Solutions** :

- **Remplir la couleur d'arrière-plan** : Appliquez une couleur d'arrière-plan aux cellules vides de la zone cible pour vous assurer qu'elles restent visibles pendant le processus de rendu.
- **Insérer des espaces** : Insérez un caractère d'espace dans les cellules vides pour maintenir la structure de la cellule, même sans contenu réel.
- **Définir des bordures** : Ajoutez des styles de bordure au tableau pour renforcer les limites des cellules et éviter qu'elles ne disparaissent pendant le rendu.

**Exemple** :

Dans le modèle Excel, définissez un arrière-plan gris clair pour toutes les cellules cibles et insérez des espaces dans les cellules vides.

### 2. Les cellules fusionnées ne sont pas prises en compte lors de la sortie

**Description du problème** : Lorsque vous utilisez la fonctionnalité de boucle pour générer des tableaux, la présence de cellules fusionnées dans le modèle peut entraîner des résultats de rendu anormaux, tels que la perte de l'effet de fusion ou un décalage des données.

**Solutions** :

- **Évitez d'utiliser des cellules fusionnées** : Essayez d'éviter d'utiliser des cellules fusionnées dans les tableaux générés par une boucle afin d'assurer un rendu correct des données.
- **Utilisez la fonction « Centrer sur plusieurs colonnes »** : Si vous avez besoin que le texte soit centré horizontalement sur plusieurs cellules, utilisez la fonction « Centrer sur plusieurs colonnes » plutôt que de fusionner les cellules.
- **Limitez la position des cellules fusionnées** : Si l'utilisation de cellules fusionnées est impérative, ne les fusionnez qu'au-dessus ou à droite du tableau. Évitez de les fusionner en dessous ou à gauche pour prévenir la perte de l'effet de fusion lors du rendu.

### 3. Le contenu situé sous une zone de rendu en boucle perturbe la mise en forme

**Description du problème** : Dans les modèles Excel, si d'autres contenus (par exemple, un récapitulatif de commande, des notes) sont placés sous une zone de boucle qui s'étend dynamiquement en fonction des éléments de données (par exemple, les détails de la commande), les lignes de données générées par la boucle s'étendront vers le bas lors du rendu. Cela aura pour effet de chevaucher ou de repousser directement le contenu statique inférieur, entraînant un désordre de formatage et un chevauchement du contenu dans le document final.

**Solutions** :

  * **Ajustez la mise en page, placez la zone de boucle en bas** : C'est la méthode la plus recommandée. Placez la zone de tableau nécessitant un rendu en boucle au bas de la feuille de calcul. Déplacez toutes les informations qui se trouvaient initialement en dessous (récapitulatif, signatures, etc.) au-dessus de la zone de boucle. Ainsi, les données de la boucle pourront s'étendre librement vers le bas sans affecter d'autres éléments.
  * **Réservez suffisamment de lignes vides** : Si vous devez absolument placer du contenu sous la zone de boucle, estimez le nombre maximal de lignes que la boucle pourrait générer et insérez manuellement suffisamment de lignes vides comme tampon entre la zone de boucle et le contenu inférieur. Cependant, cette méthode présente des risques : si les données réelles dépassent le nombre de lignes estimé, le problème réapparaîtra.
  * **Utilisez des modèles Word** : Si les exigences de mise en page sont complexes et ne peuvent pas être résolues en ajustant la structure Excel, envisagez d'utiliser des documents Word comme modèles. Les tableaux dans Word repoussent automatiquement le contenu situé en dessous lorsque le nombre de lignes augmente, évitant ainsi les problèmes de chevauchement de contenu. Cela les rend plus adaptés à la génération de documents dynamiques de ce type.

**Exemple** :

**Approche incorrecte** : Placer les informations de « Récapitulatif de commande » immédiatement sous le tableau « Détails de la commande » en boucle.
![20250820080712](https://static-docs.nocobase.com/20250820080712.png)

**Approche correcte 1 (Ajustement de la mise en page)** : Déplacez les informations de « Récapitulatif de commande » au-dessus du tableau « Détails de la commande », faisant de la zone de boucle l'élément inférieur de la page.
![20250820082226](https://static-docs.nocobase.com/20250820082226.png)

**Approche correcte 2 (Réserver des lignes vides)** : Réservez de nombreuses lignes vides entre les « Détails de la commande » et le « Récapitulatif de commande » pour vous assurer que le contenu de la boucle dispose de suffisamment d'espace d'expansion.
![20250820081510](https://static-docs.nocobase.com/20250820081510.png)

**Approche correcte 3** : Utilisez des modèles Word.

### 4. Des messages d'erreur apparaissent lors du rendu du modèle

**Description du problème** : Pendant le processus de rendu du modèle, le système affiche des messages d'erreur, entraînant l'échec du rendu.

**Causes possibles** :

- **Erreurs de placeholder** : Les noms des placeholders ne correspondent pas aux champs du jeu de données ou contiennent des erreurs de syntaxe.
- **Données manquantes** : Le jeu de données ne contient pas les champs référencés dans le modèle.
- **Utilisation incorrecte du formateur** : Les paramètres du formateur sont incorrects ou le type de formatage n'est pas pris en charge.

**Solutions** :

- **Vérifiez les placeholders** : Assurez-vous que les noms des placeholders dans le modèle correspondent aux noms des champs du jeu de données et que la syntaxe est correcte.
- **Validez le jeu de données** : Confirmez que le jeu de données contient tous les champs référencés dans le modèle et que les formats de données sont conformes aux exigences.
- **Ajustez les formateurs** : Vérifiez les méthodes d'utilisation des formateurs, assurez-vous que les paramètres sont corrects et utilisez les types de formatage pris en charge.

**Exemple** :

**Modèle incorrect** :
```
Numéro de commande : {d.orderId}
Date de commande : {d.orderDate:format('YYYY/MM/DD')}
Montant total : {d.totalAmount:format('0.00')}
```

**Jeu de données** :
```json
{
  "orderId": "A123456789",
  "orderDate": "2025-01-01T10:00:00Z"
  // Le champ totalAmount est manquant
}
```

**Solution** : Ajoutez le champ `totalAmount` au jeu de données ou supprimez la référence à `totalAmount` du modèle.
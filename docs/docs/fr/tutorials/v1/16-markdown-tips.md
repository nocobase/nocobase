# Astuces sur le bloc Markdown

Le bloc Markdown est l'un de nos blocs les plus utilisés et les plus puissants. Du simple message d'aide léger jusqu'au style HTML, voire à la prise en charge d'une logique métier importante, ses fonctionnalités sont variées et flexibles.

## I. Fonctions de base du bloc Markdown

Comme il est flexible, public et modifiable à tout moment, le bloc Markdown sert souvent à afficher des annonces système. Que ce soit sur un module métier, une fonctionnalité, un bloc ou un champ, on peut, comme un petit post-it, y coller à tout moment des indications utiles.

Avant d'utiliser le bloc Markdown, nous vous conseillons de vous familiariser avec la mise en forme et la syntaxe Markdown. Vous pouvez consulter l'[exemple Vditor](https://docs.nocobase.com/api/field/markdown-vditor).

> Remarque : le bloc Markdown des pages est relativement léger ; certaines fonctionnalités (formules mathématiques, cartes mentales, etc.) ne sont pas encore prises en charge dans le rendu. Vous pouvez néanmoins les obtenir avec du HTML, et le système propose également un composant de champ Vditor à découvrir.

### 1.1 Exemples de pages

Vous pouvez observer l'utilisation de Markdown sur la « Démo en ligne » du système, notamment sur la page d'accueil, la page Commandes et la page « Plus d'exemples ».

Par exemple, les avertissements et messages sur la page d'accueil :
![20250227085425](https://static-docs.nocobase.com/20250227085425.png)

La logique de calcul du module Commandes :
![20250227085536](https://static-docs.nocobase.com/20250227085536.png)

Le tutoriel et les images dans « Plus d'exemples » :
![20250227085730](https://static-docs.nocobase.com/20250227085730.png)

En passant en mode édition, vous pouvez modifier le contenu Markdown à tout moment et observer les changements sur la page.
![20250227085855](https://static-docs.nocobase.com/20250227085855.png)

### 1.2 Créer un bloc Markdown

Vous pouvez créer un bloc Markdown librement sur les pages, dans les fenêtres modales et dans les formulaires.

#### Méthodes de création

- **Création dans une fenêtre modale ou une page :**

  ![Bloc Markdown dans fenêtre/page](https://static-docs.nocobase.com/20250227091156.png)
- **Création dans un bloc formulaire :**

  ![Bloc Markdown dans formulaire](https://static-docs.nocobase.com/20250227091309.png)

#### Exemples d'usage

En saisissant `---` en syntaxe Markdown, vous obtenez une ligne horizontale qui simule un séparateur de groupe :

![Exemple de séparation 1](https://static-docs.nocobase.com/20250227092156.png)
![Exemple de séparation 2](https://static-docs.nocobase.com/20250227092236.png)

---

## II. Affichage de contenu personnalisé

Autre grand atout du bloc Markdown : il prend en charge le remplissage par des variables système, ce qui permet de générer des titres et des messages personnalisés et de garantir que chaque utilisateur voit dans son formulaire des informations adaptées.

![Personnalisation 1](https://static-docs.nocobase.com/20250227092400.png)
![Personnalisation 2](https://static-docs.nocobase.com/20250227092430.png)

Vous pouvez aussi associer ces variables aux données du formulaire pour réaliser des mises en forme simples, comme dans l'exemple suivant :

**Exemple de titre mis en avant :**

```markdown
# #{{$nRecord.id}} {{$nPopupRecord.task_name}}

---
```

![Effet titre mis en avant](https://static-docs.nocobase.com/20250227164055.png)

**Exemple de séparation centrée :**

![Effet champ centré](https://static-docs.nocobase.com/20250227164456.png)

## III. Du contenu plus riche

Au fur et à mesure que vous vous familiarisez avec la syntaxe Markdown et les variables, vous pouvez aussi insérer dans le bloc Markdown des contenus plus riches, comme du HTML !

### 3.1 Exemple HTML

Si vous n'avez pas l'habitude de la syntaxe HTML, vous pouvez demander à Deepseek de l'écrire pour vous (notez que la balise `script` n'est pas prise en charge ; nous vous recommandons d'inclure tous les styles dans une `div` locale).

Voici un exemple d'annonce stylisée :

```html
<div style="font-family: 'Arial', sans-serif; background-color: #e9f5ff; margin: 20px; padding: 20px; border: 2px solid #007bff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #007bff; text-align: center; font-size: 2em; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">Join Us for a Fun Getaway!</h1>
    <p style="font-size: 1.2em; line-height: 1.6; color: #333;">Hi Everyone,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">We're excited to invite you to an awesome group outing filled with laughter, adventure, and great vibes!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Mark your calendars for <span style="color: red; font-weight: bold; font-size: 1.5em;">November 10, 2025</span>, and get ready to explore, relax, and enjoy some quality time together.</p>
    <p style="font-size: 1.2em; line-height: 1.6;">We'll share more details about the itinerary and meeting spot soon—stay tuned!</p>
    <p style="font-size: 1.2em; line-height: 1.6; font-style: italic;">Can't wait to see you there!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Cheers,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Your Event Team</p>
</div>

```

![20250227092832](https://static-docs.nocobase.com/20250227092832.png)

![20250227093003](https://static-docs.nocobase.com/20250227093003.png)

### 3.2 Exemple d'animation

Vous pouvez même associer du CSS pour réaliser des animations simples, comme un effet d'apparition / disparition à la manière d'une diapositive (essayez de coller le code ci-dessous dans un Markdown !) :

```html
<div style="background-color: #f8e1e1; border: 2px solid #d14; border-radius: 10px; padding: 20px; text-align: center; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); animation: fadeInOut 3s infinite;">
    <h2 style="color: #d14; font-family: 'Arial', sans-serif;">🎉 Special Announcement 🎉</h2>
    <p style="color: #333; font-size: 18px; font-family: 'Georgia', serif;">Thank you for your support and attention! We will hold a special event next Monday, stay tuned!</p>
    <button style="background-color: #d14; color: white; border: none; border-radius: 5px; padding: 10px 20px; cursor: pointer;">Click to Learn More</button>
</div>

<style>
@keyframes fadeInOut {
    0%, 100% { opacity: 0; transform: translateY(-20px); }
    10%, 90% { opacity: 1; transform: translateY(0); }
}
</style>

```

![](https://static-docs.nocobase.com/202502270933fade-out.gif)

# Room Overview Card (FR)

Carte Home Assistant « **pièce** » : une pièce en un coup d'œil, avec des pastilles de capteurs (température, humidité, puissance, porte, mouvement…) et des tuiles d'interrupteurs/lumières. Style verre, thème clair/sombre automatique, éditeur visuel, textes en français.

## Installation (HACS)
HACS → ⋮ → Dépôts personnalisés → URL de ce dépôt, catégorie **Tableau de bord** → installer → recharger la page.

## Configuration
```yaml
type: custom:room-overview-card
title: Salle de jeux
icon: mdi:nintendo-game-boy
sensors:
  - entity: sensor.temperature_salle_de_jeux_temperature
  - entity: sensor.temperature_salle_de_jeux_humidite
  - entity: sensor.esp_tableau_salle_de_jeux_puissance
  - entity: binary_sensor.porte_salle_de_jeux_porte
    name: Porte
toggles:
  - entity: switch.dingtian_relay22251_switch1
    name: Coin Télé
  - entity: switch.dingtian_relay22251_switch2
```

| Option | Description |
|---|---|
| `title`, `icon` | Nom et icône de la pièce (l'icône s'allume quand un élément est allumé) |
| `sensors[]` | Pastilles : `entity`, `name`, `icon` facultatifs ; `size: large` l'affiche en grande tuile comme un interrupteur (ex. prochaine alarme d'un Echo : « Demain 07:15 — dans 11 h 30 », ou « Aucune alarme »). Les capteurs binaires (porte, fenêtre, mouvement…) affichent « Ouverte/Fermée », etc. |
| `toggles[]` | Tuiles cliquables : un appui bascule l'entité, un appui long ouvre ses détails |
| `image` | Image de la pièce (ex. `/local/jurassic-park.jpg`, dossier `/config/www/`) |
| `image_mode` | `background` (fond de carte, défaut), `top` (bandeau au-dessus) ou `side` (sur le côté) |
| `image_opacity` | Fond : opacité de 0 à 1 (0,35 par défaut) pour garder le texte lisible |
| `image_height` | Bandeau du haut : hauteur en px (130 par défaut) |
| `image_width`, `image_side` | Côté : largeur en % (38 par défaut) et `left` / `right` |
| `image_fit` | `cover` (remplit, rogne) ou `contain` (image entière) |
| `columns` | Colonnes des tuiles (0 = automatique) |
| `theme` | `auto`, `light`, `dark` |

### Exemple : chambre d'enfant personnalisée
```yaml
type: custom:room-overview-card
title: Chambre Logan
icon: mdi:bed
image: /local/minecraft.jpg
image_mode: top
image_height: 140
sensors:
  - entity: sensor.temperature_logan_temperature
  - entity: sensor.temperature_logan_humidite
  - entity: sensor.echo_dot_logan_prochaine_alarme   # prochaine alarme de l'Echo Dot
    name: Prochaine alarme
    size: large
toggles:
  - entity: switch.veilleuse_logan
```
Une carte par chambre : chacune peut avoir son image (Jurassic Park pour l'une, Minecraft pour l'autre).

Licence MIT.

## Apparence : nuance de couleur

Dans l'éditeur visuel, à côté du thème :

| Option | Valeurs |
|---|---|
| `nuance` | `theme` (par défaut), `braise`, `ocean`, `lagon`, `foret`, `lavande`, `framboise`, `ambre`, `ardoise`, `perso` |
| `nuance_perso` | Couleur au choix (sélecteur de couleur), utilisée avec `nuance: perso` |
| `intensite` | De `0` (neutre) à `2` (très coloré), `1` par défaut |

La nuance teinte le dégradé de fond (et la couleur d'accent quand la carte en a une). Les couleurs d'état (vert, orange, rouge…) ne changent pas.

**Une seule nuance pour toutes les cartes Johan854** : laisse `nuance: theme` et ajoute à ton thème Home Assistant :

```yaml
carte-nuance: "#2f8fd8"
```

Sans cette ligne, `nuance: theme` garde les couleurs d'origine de la carte.

## Historique des versions

- **1.3.0** : nuance de couleur au choix (8 nuances, couleur personnalisée, intensité, ou nuance commune via `carte-nuance` dans le thème).

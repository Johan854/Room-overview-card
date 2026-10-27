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
| `sensors[]` | Pastilles : `entity`, `name`, `icon` facultatifs. Les capteurs binaires (porte, fenêtre, mouvement…) affichent « Ouverte/Fermée », etc. |
| `toggles[]` | Tuiles cliquables : un appui bascule l'entité, un appui long ouvre ses détails |
| `columns` | Colonnes des tuiles (0 = automatique) |
| `theme` | `auto`, `light`, `dark` |

Licence MIT.

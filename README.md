# EduWebQuest Builder

EduWebQuest Builder és una aplicació web pensada per crear WebQuests modernes llestes per publicar en línia o importar a Moodle.

## Característiques

- Formulari complet per definir cada secció d'una WebQuest.
- Vista prèvia en directe generada amb una plantilla responsive.
- Exportació a HTML estàtic o paquet IMS per integrar en Moodle.
- Possibilitat de guardar i restaurar esborranys JSON.
- Interfície multilingüe (valencià, castellà i anglés).

## Requisits

Només cal un navegador modern. Per desenvolupar i servir l'aplicació en local pots utilitzar qualsevol servidor estàtic (per exemple `python -m http.server`).

## Desenvolupament

1. Clona el repositori i accedeix al directori `EduWebQuest`.
2. Obri `index.html` en un navegador o llança un servidor estàtic.
3. Fes canvis en els fitxers d'`assets/css` i `assets/js` i recarrega la pàgina.
4. Per compartir exemples exportats, col·loca els HTML a la carpeta `html/`, registra'ls en `html/examples.json` i l'índex es generarà automàticament al visitar `html/index.html`.

## Publicació

Pots utilitzar la versió en producció a GitHub Pages: https://sasogu.github.io/EduWebQuest/

## Licència

Vore l'arxiu [LICENSE](LICENSE).

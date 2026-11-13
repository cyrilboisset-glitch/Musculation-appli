# Mannequin 3D réaliste

Le corps 3D de l'appli vient de **MakeHuman** (maillage de base, squelette, poids et morphologies, licence **CC0**).
Le rendu utilise **three.js** r170 (licence MIT, notice conservée dans le bundle).

- `build_body.py` : applique les morphologies (homme athlétique ~1,71 m), simplifie le squelette, calcule les poids,
  les masques musculaires (pec, abs, obl, dos, trap, lomb, glu, delt, bic, tri, fa, quad, isch, psoas, calf + short)
  et les teintes (sourcils, lèvres, cheveux). Sortie : `body.json` + `body.bin`.
  Données d'entrée attendues dans `/tmp/claude-0/mh` : `3dobjs_base.obj`, `rigs_default.mhskel`,
  `rigs_default_weights.mhw` (dépôt makehumancommunity/makehuman) et `targets.npz` (paquet PyPI makehuman 1.3.2).
- `entry.js` : sous-ensemble de three.js, compilé avec `esbuild entry.js --bundle --minify --format=iife --target=es2018`.
- `real3.js` : pilote le squelette avec les poses du moteur de l'appli (AN.pose3), un seul contexte WebGL partagé.
- `patch_app.py` : insère le tout dans `Muscu_maison.html` (s'applique sur la version sans 3D).

Si WebGL n'est pas disponible, l'appli revient automatiquement à l'ancien mannequin vectoriel.

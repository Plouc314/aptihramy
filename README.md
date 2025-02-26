## Manual changes in the files
* 1855: row 856 page changed from 32-33 to 32 so polar can interpret it as i64

chef_vocation_top_terms == chef_vocation

There are 73 files at the origin and 72 after merging 1813_part1 and 1813_part2.

## Perfect matching columns
- nom_rue
- nom_rue_htr_corr
- nom_rue_norm
- no_maison
- chef_prenom
- chef_prenom_htr_corr
- chef_prenom_norm
- chef_nom
- chef_nom_htr_corr
- chef_nom_norm
- chef_origine
- chef_origine_htr_corr
- chef_origine_norm
- chef_vocation
- chef_vocation_htr_corr
- chef_vocation_norm
- observations
- Page

It seems that some columns do not differ much (norm vs standard)
## Partial matching columns
These columns appear most of the time and may be used for fine grained matching but as it does not appear everywhere they should be used carefully.

- chef_recepisse: (53)
- proprietaire_nom: (60)
- chef_annee_naissance: (60)
- chef_origine_corr: (69) may be the same as chef_origine_norm
- pensionnaires_prenom: (66)
- pensionnaires_prenom_norm: (66)
- pensionnaires_nom: (66)
- pensionnaires_nom_norm: (66)
- pensionnaires_condition_norm: (66)

## Non relevant columns
All columns appearing once or twice
- chef_permis (13)
- nb_domestiques: 7
- nb_ouvriers: 7
- nb_pensionnaires: 7

## Manual cleaning
In years 1883, 1884 and 1885 the column name `epouse_nom_prenom_norm` to `epouse_nom_norm`, `epouse_nom_prenom` to `epouse_nom`, `epouse_nom_prenom_corr` to `epouse_nom_corr`, `epouse_nom_prenom_htr_corr`to `epouse_nom_htr_corr`,
`epouse_nom_prenom_norm` to  `epouse_nom_norm`


But some entries contain xx|yy


## Children
Some years have `enfants_dans_la_commune_prenom`, some `enfants_chez_parents_prenom` and some `fils_prenom` and `filles_prenom`

The years with `enfants_dans_la_commune_prenom` were renamed `enfants_chez_parents_prenom` and the years with `fils_prenom` and `filles_prenom` were merged in one column named `enfants_chez_parents_prenom` separated with `|` to respect the convention used by the majority of the files.







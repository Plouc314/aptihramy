export const COLUMN_PRETTY_TO_RAW = new Map([
    ["Nom de rue", "nom_rue"],
    ["Numéro de maison", "no_maison"],
    ["Prénom du chef de famille", "chef_prenom"],
    ["Nom du chef de famille", "chef_nom"],
    ["Nom de l'épouse", "epouse_nom"],
    ["Prénoms des enfants chez leurs parents", "enfants_chez_parents_prenom"],
    ["Origin du chef de famille", "chef_origine"],
    ["Vocation du chef de famille", "chef_vocation"],
    ["Page", "Page"],
    ["Première occurence", "annee"],
])

export const COLUMN_RAW_TO_PRETTY = new Map(Array.from(COLUMN_PRETTY_TO_RAW, ([key, value]) => [value, key]));

export const COLUMNS_PRETTY = Array.from(COLUMN_PRETTY_TO_RAW.keys());
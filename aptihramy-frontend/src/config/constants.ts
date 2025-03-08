export const COLUMN_TRANSLATION = new Map([
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

export const COLUMNS = Array.from(COLUMN_TRANSLATION.keys());
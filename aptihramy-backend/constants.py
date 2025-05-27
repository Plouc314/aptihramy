import blitzbeaver as bb

PATH_MANIFEST = "."
PATH_GRAPH = "./beaver_files/graph.beaver"
PATH_DATAFRAMES = "."
PATH_NORMALIZED_DATAFRAMES = "."

RECORD_SCHEMA = bb.RecordSchema(
    [
        bb.FieldSchema("nom_rue_norm", bb.ElementType.String),
        bb.FieldSchema("chef_prenom_norm", bb.ElementType.String),
        bb.FieldSchema("chef_nom_norm", bb.ElementType.String),
        bb.FieldSchema("chef_origine", bb.ElementType.String),
        bb.FieldSchema("epouse_nom", bb.ElementType.String),
        bb.FieldSchema("chef_vocation", bb.ElementType.String),
    ]
)

COLUMN_PRETTY_TO_RAW = {
    "Nom de rue": "nom_rue_norm",
    "Numéro de maison": "no_maison",
    "Prénom du chef de famille": "chef_prenom_norm",
    "Nom du chef de famille": "chef_nom_norm",
    "Nom de l'épouse": "epouse_nom",
    "Prénoms des enfants chez leurs parents": "enfants_chez_parents_prenom",
    "Origine du chef de famille": "chef_origine",
    "Vocation du chef de famille": "chef_vocation",
    "Page": "Page",
    "Première occurence": "annee",
}

COLUMN_RAW_TO_PRETTY = {value: key for key, value in COLUMN_PRETTY_TO_RAW.items()}

COLUMNS_PRETTY = list(COLUMN_PRETTY_TO_RAW.keys())

FOLDER_PATH = "pages"

const tree3Dpractice = {
    "name": "ROOT",
    "root": true,
    "can_add": false,
    "visible": true,
    "children": [
        {
            "name": "Chordates", "visible": true, "can_add": false, "children": [
                {"name": "Birds", "visible": true, "can_add": true, "items": [2, 3, 4], "children": []},
                {"name": "Mammals", "visible": true, "can_add": true, "items": [7, 8, 9], "children": []},
                {"name": "ChordatesY", "visible": false, "can_add": true, "items": [], "children": []}
            ]
        },
        {
            "name": "X", "visible": false, "can_add": true, "children": [
                {"name": "XY", "visible": false, "can_add": false, "items": [], "children": []}

            ]
        },

        {
            "name": "Molluscs", "visible": true, "can_add": false, "children": [
                {"name": "MolluscsY", "visible": false, "can_add": true, "items": [], "children": []},
                {"name": "Cephalopods", "visible": true, "can_add": true, "items": [16, 17, 18], "children": []},
                {"name": "Gastropods", "visible": true, "can_add": true,  "items": [20, 21, 22], "children": []}
            ]
        }
    ]
}
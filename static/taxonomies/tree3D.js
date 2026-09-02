const tree3D = {
    "name": "ROOT",
    "root": true,
    "visible": true,
    "can_add": false,
    "children": [
        {
            "name": "A", "visible": true , "can_add": false, "children": [
                {"name": "AA", "visible": true, "can_add": true, "items": [2, 3, 4], "children": []},
                {"name": "AB", "visible": true,  "can_add": true,"items": [6, 7, 8], "children": []},
                {"name": "AY", "visible": false,  "can_add": true, "items": [], "children": []}
            ]
        },
        {
            "name": "X", "visible": false, "can_add": true, "children": [
                {"name": "XY", "visible": false, "can_add": false, "items": [], "children":[]}
            ]
        },
        {
            "name": "B", "visible": true, "can_add": false, "children": [
                {"name": "BY", "visible": false, "can_add": true, "items": [], "children": []},
                {"name": "BA", "visible": true, "can_add": true, "items": [24, 25, 26], "children": []},
                {"name": "BB", "visible": true, "can_add": true, "items": [28, 29, 30], "children": []}
            ]
        }
    ]
}
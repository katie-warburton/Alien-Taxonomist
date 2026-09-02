const CONDITIONS = {
    "1": [1, 15, 17, 21], 
    "2": [5, 7, 12, 24],
    "3": [6, 8, 13, 22],
    "4": [4, 14, 18, 19],
    "5": [2, 9, 10, 23],
    "6": [3, 11, 16, 20]
}

const TRIAL_TYPES = {"1": "2LF",
                    "2": "2LM",
                    "3": "2LB",
                    "4": "2CF",
                    "5": "2CM",
                    "6": "2CB",
                    "7": "2RF",
                    "8": "2RM",
                    "9": "2RB",
                    "10": "3LF",
                    "11": "3LM",
                    "12": "3LB",
                    "13": "3CF",
                    "14": "3CM",
                    "15": "3CB",
                    "16": "3RF",
                    "17": "3RM",
                    "18": "3RB",
                    "19": "2LA",
                    "20": "2CA",
                    "21": "2RA",
                    "22": "3LA",
                    "23": "3CA",
                    "24": "3RA"
    }

const STIMULI_DATA = {"paths": ["stimuli/Set 1", "stimuli/Set 2", "stimuli/Set 3", "stimuli/Set 4"],
                      "names": ["X-Alpha-25", "Gamma-Y3", "Sigma-X Delta", "Z-Theta 99"]
                    }

const CONDITION_PARAMS = {
    "orders": {
                "F": [12, 13, 15, 14, 16, 18, 17, 19, 20],
                "B": [20, 19, 17, 18, 16, 14, 15, 13, 12],
                "M1": [16, 17, 15, 18, 14, 19, 13, 20, 12],
                "M2": [16, 15, 17, 14, 18, 13, 19, 12, 20],
                "A": [12, 13, 14, 15, 16, 17, 18, 19, 20]
    },
    "shift": 3, 
    "distractors": [1, 3, 29, 31]
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    let arrayCopy = [...array];
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [arrayCopy[currentIndex], arrayCopy[randomIndex]] = [arrayCopy[randomIndex], arrayCopy[currentIndex]];
    }
    return arrayCopy;
}

function get_item_sets(trials, orders, shift, distractors) {
    let item_sets = {};

    trials.forEach(([d, l, o]) => {
        let items;
        if (o === 'M') {
            let mKey = getRandomChoice(['M1', 'M2']);
            items = [...orders[mKey]];
        } else {
            items = [...orders[o]];
        }

        let dist = shuffle(distractors);

        if (l === 'L') {
            items = items.map(i => i - shift);
        } else if (l === 'R') {
            items = items.map(i => i + shift);
        }

        let code = `${d}${l}${o}`;

        item_sets[code] = [
            ...items.slice(0, 1),
            ...dist.slice(0, 1),
            ...items.slice(1, 4),
            ...dist.slice(1, 2),
            ...items.slice(4, 5),
            ...dist.slice(2, 3),
            ...items.slice(5, 8),
            ...dist.slice(3, 4),
            ...items.slice(8, 9)
        ];
    });

    return item_sets;
}

function get_data() {
    const cond = String(getRandomInt(1, 6));

    const trial_set = CONDITIONS[cond];
    
    // Map conditions and shuffle order
    let current_conds = trial_set.map(i => TRIAL_TYPES[String(i)]);
    current_conds = shuffle(current_conds);
    const trial_codes = current_conds.map(([d, l, o]) => [parseInt(d, 10), l, o]);

    // Shuffle stimuli and species names
    const stimuli_paths = shuffle(STIMULI_DATA.paths);
    const species_names = shuffle(STIMULI_DATA.names);

    const { orders, shift, distractors } = CONDITION_PARAMS;
    const item_sets = get_item_sets(trial_codes, orders, shift, distractors);

    return {
        trials: trial_codes,
        stimuli: stimuli_paths,
        names: species_names,
        orders: item_sets,
        qref: cond
    };
}

// 4. GENERATE EXPERIMENT DATA ON PAGE LOAD
var expt_data = get_data();
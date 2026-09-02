# Alien Taxonomist Code
Code to replicate the experiment used in [An Experimental Study of the Evolution of Hierarchical Category Systems](https://katiewarburton.com/resources/papers/anExperimental2026.pdf). The demo can be run [here](https://katiewarburton.com/Alien-Taxonomist/). 

## Running the Experiment
The code here is used to run an experiment demo. The version used to collect data was integrated into the [CHDH LambdaExpt framework](https://github.com/complex-human-data-hub/LambdaExpt) so data could be collected and stored. This repository contains all the code required to run the experiment in full with the following modifications:

#### To "experiment_setup.js"
- Instead of generating a random number between 1 and 6 (see the first line of ``get_data``), use a queue of numbers repeating from 1 to 6 to ensure balanced distribution of the conditions across participants.

#### To "index.html"
- Uncomment ``timeline.push(demographics)``, ``timeline.push(plain_language_statement)``, and ``timeline.push(consent)``. Comment out ``timeline.push(demo_consent)``.
- Uncomment ``timeline.push(practice_loop)``. Comment out ``timeline.push(skip_practice_trial)`` and ``timeline.push(practice_conditional_node)``.
- Modify the ``on_finish`` function in ``initJsPsych`` so that the experiment data is sent to the database/server where the experiment is hosted.
- In the online version of the experiment, ``MAX_PRACTICE`` was set to 15, but data were still excluded if they took more than 3 attempts to answer the comprehension questions. To keep people from getting stuck in a long loop, I've set it to 3. 

## Stimuli 
Stimuli used can be found in static/stimuli. This repository includes all four sets used in the experiment plus the stimuli required to run the experiment tutorial. Other sets of stimuli can be substituted, but they must follow the same naming convention, "item (i).png", to work with the code. 

## Taxonomies
These are javascript files that define the hierarchical tree structures in json format. They are found in static/taxonomies.

## Condition Details

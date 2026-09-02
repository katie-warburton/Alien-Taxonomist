var jsPsychAdaptiveHierarchy = (function (jspsych) {

    const info = {
        name: 'hierarchical-categorization',
        description: "Code for performing hierarchical categorization task in sequence.", 
        version: "1.0.0", 
        parameters: {
            start_tree: {
                type: jspsych.ParameterType.OBJECT,
                default: void 0,
                description: "The starting category system."
            },
            items: {
                type: jspsych.ParameterType.ARRAY,
                arrayType: jspsych.ParameterType.INT,
                default: [],
                description: 'The list of items to be categorized.'
            },
            item_loc: {
                type: jspsych.ParameterType.STRING,
                default: void 0, 
                description: 'The folder that contains the stimuli used for the task'
            },
            title: {
                type: jspsych.ParameterType.HTML_STRING,
                default: "Alien Organisms",
                description: "The title of the task."
            },
            depth: {
                type: jspsych.ParameterType.INT,
                default: void 0,
                description: "The level at which items are added to the graph."
            },
            prompts: {type: jspsych.ParameterType.ARRAY,
                arrayType: jspsych.ParameterType.HTML_STRING,
                default: [],
                description: "The prompts to display to participants as they complete the trial."
            },
            button_labels: {type: jspsych.ParameterType.ARRAY,
                arrayType: jspsych.ParameterType.STRING,
                default: [],
                description: 'The text that will appear on the next button during the experiment.'
            },
            background_color: {
                type: jspsych.ParameterType.STRING,
                default: "lightblue",
                description: "The background color of the canvas."
            },
            node_background_color: {
                type: jspsych.ParameterType.STRING,
                default: "white",
                description: "The background color of the nodes."
            },
            node_border_width: {
                type: jspsych.ParameterType.INT,
                default: 2,
                description: "The width of the line for the border of the nodes and the links."
            },
            min_width_gap: {
                type: jspsych.ParameterType.INT,
                default: 0.015,
                description: "The minimum gap size between nodes (calculated as a proportion of the total space)."
            },
            min_height_gap: {
                type: jspsych.ParameterType.INT,
                default: 0.05,
                description: "The minimum gap size between nodes (calculated as a proportion of the total space)."
            },
            start_idx: {
                type: jspsych.ParameterType.INT,
                default: -1,
                description: "How many prompts there are at the start."
            }
        },
        data: {
            rts: {
                type: jspsych.ParameterType.ARRAY,
                arrayType: jspsych.ParameterType.INT,
                default: [],
                description: 'The response times in milliseconds.'
            },
            item_order: {
                type: jspsych.ParameterType.ARRAY,
                arrayType: jspsych.ParameterType.INT,
                default: [],
                description: 'The order in which stimuli are presented to participants.'
            },
            final_tree: {
                type: jspsych.ParameterType.OBJECT,
                default: void 0,
                description: 'The final category system that the participant ends the task with.'
            },
            category_choices: {
                type: jspsych.ParameterType.ARRAY,
                arrayType: jspsych.ParameterType.OBJECT,
                default: [],
                description: 'The locations a participant placed each new item into the hierarchy.'
            },
            actions: {
                type: jspsych.ParameterType.ARRAY,
                arrayType: jspsych.ParameterType.STRING,
                default: [],
                description: 'The sequence of actions taken by participants during the experiment.'
            },
            category_changes: {
                type: jspsych.ParameterType.ARRAY,
                arrayType: jspsych.ParameterType.OBJECT,
                default: [],
                description: 'The number of times a participant changes their mind per item.'
            },
            categorization_times: {
                type: jspsych.ParameterType.ARRAY,
                arrayType: jspsych.ParameterType.OBJECT,
                default: [],
                description: 'The amount of time it takes to categorize each item.'
            }
        }
    };
    /**
     * **adaptive-hierarchy**
     *
     * {description}
     *
     * @author Katie Warburton
     * @see {@link {documentation-url}}
     */
    class AdaptiveHierarchy {
        constructor (jsPsych) {
            this.jsPsych = jsPsych;
            this.resizeHandler = null; 
        }

        static info = info;    

        trial(display_element, trial) {
            // Define the base HTML for the trial
            const self = this; 
            let html = `<div class="jspsych-display-element" style="height:95vh; aspect-ratio:1.7; background-color: white;" >
                            <div class="sequence-grid">
                                <div id="title-container">
                                    <div>
                                        <h1 class="exp-title">${trial.title} <span style="font-size:75%;">(One at a time)</span></h1>
                                    </div>
                                </div>
                                <div id="item-box"></div>
                                <div id="prompt-container">
                                    <p>${trial.prompts[0]}</p>
                                </div>
                                <svg id="category-tree" style="background-color: ${trial.background_color};">
                                </svg>
                                <div id="button-container">
                                    <button class="trial-button" id="continue-button">${trial.button_labels[0]}</button>
                                </div>
                            </div>
                        </div>`;

            display_element.innerHTML = html;
            const itemSeq = trial.items;
            
            const updateLayout = () => {
                const vh = 0.95 * Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
                
                const container = document.querySelector('.jspsych-display-element');
                if (container) {
                    container.style.height = vh + 'px';
                    container.style.aspectRatio = 1.7;
                }

                if (typeof redrawTree === 'function') {
                    redrawTree();
                }

                const itemDisplay = document.getElementById('item-box');
                if (itemDisplay) {
                    const img = itemDisplay.querySelector('img');
                    if (img) {
                        img.width = ITEM_SIZE;
                        img.height = ITEM_SIZE;
                    }
                }
            };

            // Calculate various node parameters and store them
            function get_node_info(tree) {
                let nodes_by_level = {};
                let nodes_by_name = {};
                function traverse(node, depth=0) {
                    if (node.root) {
                        node.parent = null;
                    }
                    if (!nodes_by_level[depth]) {
                        nodes_by_level[depth] = {'SIZE': 0, 'BIGGEST': 0};
                        };
                    node.index = nodes_by_level[depth]['SIZE'];
                    node.depth = depth;
                    nodes_by_level[depth]['SIZE'] += 1;
                    nodes_by_name[node.name] = node;
                    if (node.children.length !== 0) {
                        node.children.forEach(child => traverse(child, depth+1));
                        node.items = node.children.flatMap(child => child.items);
                        // assign current node as parent to children
                        node.children.forEach(child => child.parent = node);
                    }
                    if (node.items.length > nodes_by_level[depth]['BIGGEST'] ){
                        nodes_by_level[depth]['BIGGEST'] = node.items.length;
                    }
                }
                traverse(tree); 
            return nodes_by_level;
            }         

            let svg, root, nodes, ITEM_SIZE;
            let category_tree = document.getElementById("category-tree");

            // Function to completely redraw the tree with new dimensions
            const redrawTree = () => {
                if (!svg || !root || !nodes) return;
                
                // svg.selectAll("*").remove();
                
                const category_tree = document.getElementById("category-tree");
                if (!category_tree) return;
                const category_tree_box = category_tree.getBoundingClientRect();
                
                NODES_BY_LEVEL = get_node_info(root.data);
                get_node_boundaries(tree, category_tree_box, NODES_BY_LEVEL);
                
                ITEM_SIZE = root.data.item_size;
 
               const nodeSelection = svg.selectAll(".node");
                nodeSelection.each(function(d) {
                    const node = d3.select(this);
                    
                    node.attr("transform", "translate(" + get_x_edge(d.data) + "," + d.data.y + ")");
                    
                    const rect = node.select("rect");
                    rect.attr("width", d.data.width)
                        .attr("height", d.data.height);
                        
                    const circle = node.select("circle");
                    circle.attr("cx", d.data.width/2);
                    
                    node.selectAll("image").remove();
                    node.selectAll(".highlight-border").remove();

                    if (d.data.items && d.data.items.length > 0) {
                        for (let i = 0; i < d.data.items.length; i++) {
                            let x = trial.node_border_width + ((i % d.data.cols) * d.data.item_size);
                            let y = trial.node_border_width + (Math.floor(i / d.data.cols) * d.data.item_size);
                            
                            let item_path = trial.item_loc + "\\item (" + Math.trunc(d.data.items[i]) + ").png";
                            let img = node.append("image")
                                .attr("xlink:href", item_path)
                                .attr("x", x)
                                .attr("y", y)
                                .attr('id', d.data.items[i])
                                .attr("width", d.data.item_size)
                                .attr("height", d.data.item_size)
                                .attr('visibility', 'visible')
                                .attr("pointer-events",  "none");

                            // Add highlighting for new items
                            let isNewItem = d.data.items[i] === CURRENT_ITEM;
                            if (isNewItem) {
                                node.append("rect")
                                    .attr("class", "highlight-border")
                                    .attr("x", x + 1)
                                    .attr("y", y + 1)
                                    .attr("rx", trial.node_border_width)
                                    .attr("width", d.data.item_size - 2)
                                    .attr("height", d.data.item_size - 2)
                                    .attr("fill", "none")
                                    .attr("stroke", "#6DB752")
                                    .attr("stroke-width", trial.node_border_width);
                            };
                        };
                    };

                    const text = node.select("text");
                        text.attr("font-size", function(d) {
                            let width = MIN_TEXT_WIDTH;
                            let height = root.data.item_size;
                            let text = d3.select(this);
                            let size = 0;
                            let text_width = 0;
                            let text_height = 0;
                            while (text_width < (width) && text_height < (height)) {
                                size += 1;
                                text.style("font-size", size + "px");
                                text_width = text.node().getBBox().width;
                                text_height = text.node().getBBox().height;
                            }                        
                            return size + "px";
                        })
                        .on('mouseover.hover', function() {
                            d3.select(this).attr("fill", "red");
                        })
                        .on('mouseout.hover', function() {
                            d3.select(this).attr("fill", "black");
                        });
                        
                    
                    // Raise circles to top
                    circle.raise();                
                });

            redraw_links(svg);
            };
            


            let resizeTimeout;
            const debouncedResize = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    updateLayout();
                }, 150);
            };

            // Add resize event listener
            self.resizeHandler = debouncedResize;
            window.addEventListener('resize', self.resizeHandler);
            
            // Get the best size for the items in the tree such that they fit into the space and have y rows and x columns. 
            function get_best_item_size(n, width, height) {
                let best_size = 0;
                let best_rows = 1;
                let best_cols = n;
                for (let rows = 1; rows <= n; rows++) {
                    let cols = Math.ceil(n / rows);
                    let item_width = (width-(2*trial.node_border_width)) / cols;
                    let item_height = (height - (2*trial.node_border_width))/ rows;
                    let item_size = Math.min(item_width, item_height);
                    if (item_size > best_size) {
                        best_size = item_size;
                        best_cols = cols;
                        best_rows = rows; 
                    }
                }
                return [best_size, best_rows, best_cols];
            }
            
            function get_rows(n, cols) {
                return Math.ceil(n/cols);
            }

            function get_cols(n, max_cols) {
                return Math.min(n, max_cols);
            }

            function get_node_boundaries(tree, category_box, nodes_by_level) {
                // get heights of nodes such that the height of a node is proportional to its depth in the tree
                let min_height_gap = trial.min_height_gap * category_box.height;
                const available_height = category_box.height - (min_height_gap * (4));
                let numerators = Array.from({length: 3}, (_, i) => i+1);
                const denominator = numerators.reduce((a, b) => a+b, 0);
                let node_heights = numerators.map(n => n/denominator * available_height);
                // get widths of nodes such that the width is proportional to the number of nodes at that level
                let min_width_gap = trial.min_width_gap * category_box.width;
                let stats_by_level = {};
                let sizes = [];
                for (let level in nodes_by_level) {
                    let num_nodes = nodes_by_level[level]['SIZE'];
                    let available_width = category_box.width - (min_width_gap * (num_nodes+1));
                    let width = available_width/num_nodes;
                    let height = node_heights[level];
                    let most_in_node = nodes_by_level[level]['BIGGEST'] + trial.items.length;
                    let [size, rows, cols] = get_best_item_size(most_in_node, width, height);
                    stats_by_level[level] = [width, height, rows, cols];
                    sizes.push(size);
                }
                MIN_TEXT_WIDTH = (category_box.width - (min_width_gap * (8)))/8;
                const item_size = Math.min(...sizes);
                // assign properties that determine the size of a node in the display
                function traverse(node) {
                    let level = node.depth;
                    let index = node.index;
                    let [width, height, rows, cols]= stats_by_level[level];
                    node.max_width = width;
                    node.max_height = height;
                    node.item_size = item_size;
                    node.rows = rows;
                    node.cols = cols;
                    node.y = min_height_gap + (node_heights.slice(0, level).reduce((a, b) => a+b, 0) + (min_height_gap * level));
                    node.min_x = min_width_gap + (width+ min_width_gap) * index;
                    node.center_x = node.min_x + width/2;
                    node.max_x = node.center_x + width/2;
                    node.width = (2*trial.node_border_width) + (node.item_size * get_cols(node.items.length, node.cols));
                    node.height = (2*trial.node_border_width) + (node.item_size * get_rows(node.items.length, node.cols));
                    if (node.children.length !== 0) {
                        node.children.forEach(child => traverse(child));
                    }
                }
                traverse(tree);
            }

            // Get X and Y coordinates of a link
            function calculate_link_xy (source, target) {
                let source_x = source.data.center_x;
                let source_y = source.data.y + source.data.height;
                let target_x = target.data.center_x;
                let target_y = target.data.y;
                let xy_string = "M" + source_x + "," + source_y + " " + target_x + "," + target_y;
                return xy_string;
            }

            function get_x_edge(node) {
                let x_edge = node.center_x - (node.width/2);
                return x_edge;
            }

            function add_item(item, d) {
                let inserted = false;
                for (let i = 0; i < d.data.items.length; i++) {
                    if (item < d.data.items[i]) {
                        d.data.items.splice(i, 0, item);
                        inserted = true;
                        break;
                    }
                }
                if (!inserted) {
                    d.data.items.push(item);
                }
            }

            function redraw_node(rect, node, d, newToTree=true) {
                const newItem = CURRENT_ITEM;
                if (newToTree){
                    add_item(newItem, d)
                } else {
                    d.data.items = d.data.children.flatMap(child => child.items);
                }
                
                // Clear existing images and redraw all in the correct order
                node.selectAll("image").remove();
                node.selectAll(".highlight-border").remove();
                
                // Redraw all items in their sorted positions
                for (let i = 0; i < d.data.items.length; i++) {
                    let x = trial.node_border_width + ((i % d.data.cols) * d.data.item_size);
                    let y = trial.node_border_width + (Math.floor(i / d.data.cols) * d.data.item_size);
                    
                    let item_path = trial.item_loc + "\\item (" + Math.trunc(d.data.items[i]) + ").png";

                    node.append("image")
                        .attr("xlink:href", item_path)
                        .attr("x", x)
                        .attr("y", y)
                        .attr("width", d.data.item_size)
                        .attr("height", d.data.item_size)
                        .attr("pointer-events", "none")
                        .attr('visibility', 'visible');

                    let isNewItem = d.data.items[i] === newItem;
                    if (isNewItem) {
                        node.append("rect")
                            .attr("class", "highlight-border")
                            .attr("x", x + 1)  // Make the border slightly larger than the image
                            .attr("y", y + 1)
                            .attr("rx", trial.node_border_width)
                            .attr("width", d.data.item_size - 2)
                            .attr("height", d.data.item_size - 2)
                            .attr("fill", "none")
                            .attr("stroke", "green")
                            .attr("stroke-width", trial.node_border_width)
                        }
                }

                // Update node dimensions
                d.data.width = (2*trial.node_border_width) + (d.data.item_size * get_cols(d.data.items.length, d.data.cols));
                d.data.height = (2*trial.node_border_width) + (d.data.item_size * get_rows(d.data.items.length, d.data.cols));

                // Redraw rectangle
                rect.attr("width", d => d.data.width)
                    .attr("height", d => d.data.height);
                    
                // Empty the item display
                let item_display = document.getElementById("item-box");
                item_display.innerHTML = '';

                // Center the node if needed
                if (d.data.items.length < d.data.cols+1) {
                    node.attr("transform", d => "translate(" + get_x_edge(d.data) + "," + d.data.y + ")");
                    node.select("circle")
                        .attr("cx", d.data.width/2);
                }
                node.select("circle").raise();
            }

            function remove_item(rect, node, d) {
                // Find the item to remove (last item in this case)
                const itemToRemove = CURRENT_ITEM;
                
                // Find and remove the item
                const itemIndex = d.data.items.indexOf(itemToRemove);
                if (itemIndex > -1) {
                    d.data.items.splice(itemIndex, 1);
                }
                node.selectAll(".highlight-border").remove();
                node.selectAll("image").remove();

                                    
                d.data.width = (2*trial.node_border_width) + (d.data.item_size * get_cols(d.data.items.length, d.data.cols));
                d.data.height = (2*trial.node_border_width) + (d.data.item_size * get_rows(d.data.items.length, d.data.cols));
        
                rect.attr("width", d => d.data.width)
                    .attr("height", d => d.data.height);
        
                // Adjust position if needed
                if (d.data.items.length < d.data.cols) {
                    node.attr("transform", d => "translate(" + get_x_edge(d.data) + "," + d.data.y + ")");
                    node.select("circle")
                        .attr("cx", d.data.width/2);
                }

                // If node is now empty
                if (d.data.items.length === 0) {
                    // Make text visible only if parent is not empty 
                    if (d.data.parent.items.length > 1) {
                        let text = node.select("text");
                        text.attr("visibility", "visible");

                    } 

                    d.data.visible = false;
                    // Make node and links invisible
                    let circle = node.select("circle");
                    circle.attr("visibility", "hidden");
                    rect.attr("visibility", "hidden");
                    let parent = d.parent;
                    let link = d3.selectAll(".link").filter(function(l) {return l.source === parent && l.target === d;});
                    link.attr("visibility", "hidden");

        
                    d.data.width = 0;
                    d.data.height = 0;

                } else {
                    // redraw all items in sorted order
                    for (let i = 0; i < d.data.items.length; i++) {
                        let x = trial.node_border_width + ((i % d.data.cols) * d.data.item_size);
                        let y = trial.node_border_width + (Math.floor(i / d.data.cols) * d.data.item_size);
                        
                        let item_path = trial.item_loc + "\\item (" +  Math.trunc(d.data.items[i]) + ").png";
                        node.append("image")
                            .attr("xlink:href", item_path)
                            .attr("x", x)
                            .attr("y", y)
                            .attr("width", d.data.item_size)
                            .attr("height", d.data.item_size)
                            .attr("pointer-events", "none")
                            .attr('visibility', 'visible');
                    }
                    node.select("circle").raise();
                }
            }

            function redraw_links(svg) {
                let links = svg.selectAll(".link");
                links.each(function(d) {
                    let link = d3.select(this);
                    let xy_string = calculate_link_xy(d.source, d.target);
                    link.attr("d", xy_string);
                });
            }

            function create_category_node (d, node) {
                if (d.data.items && d.data.items.length > 0) {
                    d.data.items.sort((a, b) => a - b);
                }

                node.append("rect")
                .attr("depth", d => d.data.depth)
                .attr("width", d => d.data.width)
                .attr("height", d => d.data.height)
                .attr("fill", trial.node_background_color)
                .attr("stroke", "black")
                .attr("rx", trial.node_border_width)
                .attr("stroke-width", trial.node_border_width)
                .attr("visibility", d => d.data.visible ? "visible" : "hidden")
                .style("cursor", d => d.data.depth == trial.depth-1 ? "pointer" : "default")
                .on("mouseover", function() {
                    if (d.data.can_add){
                        d3.select(this).attr("stroke", "red");
                        d3.select(this).attr("stroke-width", trial.node_border_width*2);

                    }
                })
                .on("mouseout", function() {
                    d3.select(this).attr("stroke", "black");
                    d3.select(this).attr("stroke-width", trial.node_border_width);
                })
                .on("click", function() {
                    let click_time = performance.now() - TIME; 
                    if (d.data.can_add && BUILD_MODE && ITEM_LOC === null) {
                        let rect = d3.select(this)
                        redraw_node(rect, node, d, true);

                        // Update parent nodes and visual elements
                        let parent = d.parent;
                        while (parent) {
                            let prev_rows = get_rows(parent.data.items.length, parent.data.cols);
                            let parentNode = d3.select(`g[name="${parent.data.name}"]`);
                            let parentRect = parentNode.select("rect");
                            redraw_node(parentRect, parentNode, parent, false);
                            let curr_rows = get_rows(parent.data.items.length, parent.data.cols);
                            // if the node rows increase, shift the links down
                            if (prev_rows != curr_rows) {
                                redraw_links(svg);
                            }
                            parent = parent.parent;
                        }
                        ITEM_LOC = d.data.name;
                        REACTION_TIMES.push(click_time)
                        ACTIONS.push(`ADD ${CURRENT_ITEM} to ${ITEM_LOC}`)
                        NEXT_BUTTON.disabled = false;
                        TIME = performance.now();

                    } else if (d.data.can_add && BUILD_MODE && ITEM_LOC !== null && ITEM_LOC !== d.data.name) {                        
                        let old_node = d3.select(`g[name="${ITEM_LOC}"]`);
                        let old_rect = old_node.select("rect");
                        let old_d = NODES_BY_NAME[ITEM_LOC];
                        remove_item(old_rect, old_node, old_d);
                        
                        // Update parent nodes of the old location
                        let old_parent = old_d.parent;
                        while (old_parent) {
                            let prev_rows = get_rows(old_parent.data.items.length, old_parent.data.cols);
                            let parent_rect = d3.select(`g[name="${old_parent.data.name}"]`).select("rect");
                            let parent_node = d3.select(`g[name="${old_parent.data.name}"]`);
                            remove_item(parent_rect, parent_node, old_parent);
                            
                            let curr_rows = get_rows(old_parent.data.items.length, old_parent.data.cols);  
                            if (prev_rows != curr_rows) {
                                redraw_links(svg);
                            } 
                            old_parent = old_parent.parent
                        }
                        
                        // Add to new node
                        let rect = d3.select(this);
                        redraw_node(rect, node, d, true);
                        
                        // Update parent nodes of the new location
                        let parent = d.parent;
                        while (parent) {
                            let prev_rows = get_rows(parent.data.items.length, parent.data.cols);
                            let parent_rect = d3.select(`g[name="${parent.data.name}"]`).select("rect");
                            let parent_node = d3.select(`g[name="${parent.data.name}"]`);
                            redraw_node(parent_rect, parent_node, parent, false);
                            let curr_rows = get_rows(parent.data.items.length, parent.data.cols);
                            if (prev_rows != curr_rows) {
                                redraw_links(svg);
                            }
                            parent = parent.parent;
                        }
                        REACTION_TIMES.push(click_time);
                        ACTIONS.push(`MOVE ${CURRENT_ITEM} from ${ITEM_LOC} to ${d.data.name}`)
                        ITEM_CHOICES.push(ITEM_LOC);
                        ITEM_LOC = d.data.name;
                        TIME = performance.now();
                    }
                })
                ;

                let i = 0;
                for (let row = 0; row < d.data.rows; row++) {
                    for (let col = 0; col < d.data.cols; col++) {
                        if (i < d.data.items.length) {
                            let item = d.data.items[i];
                            let item_path = trial.item_loc + "\\item (" +  Math.trunc(item) + ").png";
                            let x = trial.node_border_width + (col * d.data.item_size);
                            let y = trial.node_border_width + (row * d.data.item_size);
                            node.append("image")
                            .attr("xlink:href", item_path)
                            .attr("x", x)
                            .attr("y", y)
                            .attr("width", d.data.item_size)
                            .attr("height", d.data.item_size)
                            .attr("pointer-events", "none");
                            i++;
                        }
                    }
                }

                node.append("text")
                .text(d => 'NEW CATEGORY')
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "hanging")
                // make bold
                .attr("font-weight", "bold")
                .attr("font-size", function(d) {
                    let height = root.data.item_size;
                    let width = MIN_TEXT_WIDTH;
                    let text = d3.select(this);
                    let size = 0;
                    let text_width = 0;
                    let text_height = 0;
                    while (text_height < (height) && text_width < (width)) {
                        size += 1;
                        text.style("font-size", size + "px");
                        text_width = text.node().getBBox().width;
                        text_height = text.node().getBBox().height;
                    }                        
                    return size + "px";
                })
                .attr("fill", "black")
                .attr("visibility", d => (!d.data.visible && d.data.can_add) ? "visible" : "hidden")
                .style("cursor", "pointer")
                .on("mouseover", function() {
                    d3.select(this).attr("fill", "red");
                })
                .on("mouseout", function() {
                    d3.select(this).attr("fill", "black");
                })
                .on("click", function() {
                    let click_time = performance.now() - TIME;
                    // make text invisible
                    if (BUILD_MODE && ITEM_LOC === null) {
                        let text = d3.select(this);
                        text.attr("visibility", "hidden");
                        
                        d.data.visible = true;
                        let circle = node.select("circle");
                        circle.attr("visibility", "visible");
                        let rect = node.select("rect");
                        rect.attr("visibility", "visible");
                        redraw_node(rect, node, d, true);

                        // make link between node and parent visible
                        let parent = d.parent;
                        let link = svg.selectAll(".link").filter(function(l) {return l.source === parent && l.target === d;});
                        link.attr("visibility", "visible");

                        // Update parent nodes and visual elements
                        while (parent) {
                            let prev_rows = get_rows(parent.data.items.length, parent.data.cols);
                            let parent_rect = d3.select(`g[name="${parent.data.name}"]`).select("rect");
                            let parent_node = d3.select(`g[name="${parent.data.name}"]`);
                            redraw_node(parent_rect, parent_node, parent, false);
                            let curr_rows = get_rows(parent.data.items.length, parent.data.cols);
                            if (prev_rows != curr_rows) {
                                redraw_links(svg);
                            }
                            parent = parent.parent;
                        }

                        if (d.data.children.length == 1) {
                            let label = d.data.children[0].name
                            let child = d3.select(`g[name="${label}"]`);
                            let circle_kid = child.select("circle")
                            circle_kid.attr("visibility", "visible")
                            let kid_rect = child.select("rect")
                            kid_rect.attr("visibility", "visible");

                            let kid_d = NODES_BY_NAME[label]
                            redraw_node(kid_rect, child, kid_d, true);
                            let link = svg.selectAll(".link").filter(function(l) {return l.source === d && l.target === kid_d});
                            link.attr("visibility", "visible");
                            d.data.can_add = false; 
                            kid_d.data.can_add = true;
                            kid_d.visible = true; 
                            ITEM_LOC = label;
                            
    
                        } else {
                            ITEM_LOC = d.data.name;
                        }
                        REACTION_TIMES.push(click_time);
                        ACTIONS.push(`ADD ${CURRENT_ITEM} to ${ITEM_LOC}`)
                        NEXT_BUTTON.disabled = false;
                        TIME = performance.now();

                    } else if (BUILD_MODE && ITEM_LOC !== null && ITEM_LOC !== d.data.name) {
                        let text = d3.select(this);
                        text.attr("visibility", "hidden");

                        d.data.visible = true;
                        let circle = node.select("circle");
                        circle.attr("visibility", "visible");
                        let rect = node.select("rect");
                        rect.attr("visibility", "visible");
                        redraw_node(rect, node, d, true);

                        // make link between node and parent visible
                        let parent = d.parent;
                        let link = svg.selectAll(".link").filter(function(l) {return l.source === parent && l.target === d;});
                        link.attr("visibility", "visible");

                        let old_node = d3.select(`g[name="${ITEM_LOC}"]`);
                        let old_rect = old_node.select("rect");
                        let old_d = NODES_BY_NAME[ITEM_LOC];
                        remove_item(old_rect, old_node, old_d);
                        let old_parent = old_d.parent;
                        while (old_parent) {
                            let prev_rows = get_rows(old_parent.data.items.length, old_parent.data.cols);
                            let parent_rect = d3.select(`g[name="${old_parent.data.name}"]`).select("rect");
                            let parent_node = d3.select(`g[name="${old_parent.data.name}"]`);
                            remove_item(parent_rect, parent_node, old_parent);
                            let curr_rows = get_rows(old_parent.data.items.length, old_parent.data.cols);  
                            if (prev_rows != curr_rows) {
                                redraw_links(svg);
                            } 
                            old_parent = old_parent.parent

                        }
                        // Update parent nodes and visual elements
                        while (parent) {
                            let prev_rows = get_rows(parent.data.items.length, parent.data.cols);
                            let parent_rect = d3.select(`g[name="${parent.data.name}"]`).select("rect");
                            let parent_node = d3.select(`g[name="${parent.data.name}"]`);
                            redraw_node(parent_rect, parent_node, parent, false);
                            let curr_rows = get_rows(parent.data.items.length, parent.data.cols);
                            if (prev_rows != curr_rows) {
                                redraw_links(svg);
                            }
                            parent = parent.parent;
                        }

                        
                        ITEM_CHOICES.push(ITEM_LOC);
                        let old_loc = ITEM_LOC;
                        if (d.data.children.length == 1) {
                            let label = d.data.children[0].name
                            let child = d3.select(`g[name="${label}"]`);
                            let circle_kid = child.select("circle")
                            circle_kid.attr("visibility", "visible")
                            let kid_rect = child.select("rect")
                            kid_rect.attr("visibility", "visible");

                            let kid_d = NODES_BY_NAME[label]
                            redraw_node(kid_rect, child, kid_d, true);
                            let link = svg.selectAll(".link").filter(function(l) {return l.source === d && l.target === kid_d});
                            link.attr("visibility", "visible");
                            d.data.can_add = false; 
                            kid_d.data.can_add = true;
                            kid_d.visible = true; 
                            ITEM_LOC = label;
                            
    
                        } else {
                            ITEM_LOC = d.data.name;
                        }
                        ACTIONS.push(`MOVE ${CURRENT_ITEM} from ${old_loc} to ${ITEM_LOC}`)
                        REACTION_TIMES.push(click_time);
                        TIME = performance.now();
                    }
                });

                node.append("circle")
                .attr("cx", d.data.width/2)
                .attr("r", trial.node_border_width*2)
                .attr("fill", "black")
                .attr("visibility", d => (d.data.visible && !d.data.root)? "visible" : "hidden");


            }

             function clearItems(node) {
                if (node.children.length !== 0) {
                    node.items = [];
                }
                delete node.depth;
                delete node.width;
                delete node.item_size;
                delete node.height;
                delete node.max_height;
                delete node.max_width;
                delete node.cols;
                delete node.rows;
                delete node.max_x;
                delete node.center_x;
                delete node.min_x;
                delete node.y; 
                node.children.forEach(child => {
                    clearItems(child);
                });
            }

            function showElement(index) {
                if (index < 0) {
                    let prompt = document.getElementById("prompt-container");
                    if (index < trial.prompts.length-1) {
                        prompt.innerHTML = trial.prompts[index+Math.abs(trial.start_idx)];
                        NEXT_BUTTON.textContent = trial.button_labels[index+Math.abs(trial.start_idx)];
                    } else {
                        prompt.innerHTML = '';
                    }
                    NEXT_BUTTON.textContent = trial.button_labels[index+Math.abs(trial.start_idx)];
                } else if (index < trial.items.length) {
                    CAT_TIME = performance.now();
                    CURRENT_ITEM = trial.items[current_idx];
                    if(root.data.items.includes(CURRENT_ITEM)){
                        CURRENT_ITEM += 0.01
                    }
                    ITEM_CHOICES = [];
                    let item_display = document.getElementById("item-box");
                    item_display.innerHTML = '';
                    const image_element = document.createElement('img');
                    image_element.src = trial.item_loc + "\\item (" + trial.items[index] + ").png";
                    image_element.id = `stimuli-${CURRENT_ITEM}`;
                    image_element.width = ITEM_SIZE;
                    image_element.height = ITEM_SIZE;
                    image_element.className = 'stimuli';
                    image_element.addEventListener('load', () => {
                        item_display.appendChild(image_element);
                    });
                    BUILD_MODE = true;
                    let prompt = document.getElementById("prompt-container");
                    if (index < trial.prompts.length-1) {
                        prompt.innerHTML = trial.prompts[index+Math.abs(trial.start_idx)];
                        NEXT_BUTTON.textContent = trial.button_labels[index+Math.abs(trial.start_idx)];
                    } else {
                        prompt.innerHTML = '';
                    }
                    NEXT_BUTTON.textContent = trial.button_labels[index+Math.abs(trial.start_idx)];
                    NEXT_BUTTON.disabled = true;
                } else {
                    BUILD_MODE = false;

                    if (self.resizeHandler) {
                        window.removeEventListener('resize', self.resizeHandler);
                        self.resizeHandler = null;
                    }
                    self.jsPsych.pluginAPI.clearAllTimeouts();

                    // ensures that the final tree does not have any circular references
                    for (let node of nodes) {
                        delete node.data.parent;

                    }
                    let final_tree = root.data;
                    clearItems(final_tree);

                    let data = {
                        rts: REACTION_TIMES,
                        final_tree: final_tree,
                        category_choices: CATEGORY_CHOICES,
                        item_order: itemSeq, 
                        actions: ACTIONS,
                        category_changes: CATEGORY_CHANGES,
                        categorization_times: CATEGORIZATION_TIMES
                    };
                    jsPsych.finishTrial(data);
                }   
                TIME = performance.now();
                CAT_TIME = performance.now();
            }

            let BUILD_MODE = false;
            let ITEM_LOC = null;
            let MIN_TEXT_WIDTH;
            let NODES_BY_NAME = {};
            let CURRENT_ITEM; 
            let ITEM_CHOICES;
            let REACTION_TIMES = [];
            let CATEGORIZATION_TIMES = [];
            let CATEGORY_CHOICES = [];
            let CATEGORY_CHANGES = [];
            let ACTIONS = [];
            let NEXT_BUTTON = document.getElementById("continue-button");
            category_tree = document.getElementById("category-tree");
            let category_tree_box = category_tree.getBoundingClientRect();
        
            let tree = trial.start_tree;
            let NODES_BY_LEVEL = get_node_info(tree);
            get_node_boundaries(tree, category_tree_box, NODES_BY_LEVEL);
            
            svg = d3.select("#category-tree")            
            let g = svg.append("g");
            root = d3.hierarchy(tree);
            let treeLayout = d3.tree();
            treeLayout(root);
            nodes = root.descendants();
            let links = root.links();

            let node = g.selectAll(".node")
            .data(nodes)
            .enter()
            .append("g")
            .attr("class", "node")
            .attr('name', d => d.data.name)
            .attr("transform", d => "translate(" + get_x_edge(d.data) + "," + d.data.y + ")");

            nodes.forEach(node => {
                NODES_BY_NAME[node.data.name] = node;
            });

            node.each(function(d) {
                let node = d3.select(this);
                create_category_node(d, node);
              
            });

            svg.selectAll(".link")
            .data(links)
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", d => calculate_link_xy(d.source, d.target))
            .attr("fill", "none")
            .attr("stroke", "black")
            .attr("stroke-width", trial.node_border_width)
            .attr("visibility", d => d.source.data.visible && d.target.data.visible ? "visible" : "hidden")
            .lower();

            ITEM_SIZE = root.data.item_size; 
            let current_idx = trial.start_idx;
            let CAT_TIME = performance.now();
            let TIME = performance.now();
            NEXT_BUTTON.addEventListener("click", function() {
                REACTION_TIMES.push(performance.now() - TIME);
                ACTIONS.push(`CLICK '${NEXT_BUTTON.textContent || NEXT_BUTTON.innerText}' button`)
                if (current_idx > -1 ){
                    let time_taken = performance.now() - CAT_TIME;
                    let choice = {}; let changes = {}; let cat_time = {};
                    choice[CURRENT_ITEM] = ITEM_LOC;
                    CATEGORY_CHOICES.push(choice);

                    changes[CURRENT_ITEM] = ITEM_CHOICES.length;
                    CATEGORY_CHANGES.push(changes);

                    cat_time[CURRENT_ITEM] = time_taken;
                    CATEGORIZATION_TIMES.push(time_taken);
                }
                d3.selectAll(".highlight-border").remove();

                current_idx++;
                ITEM_LOC = null;
                document.getElementById("prompt-container").scrollTop = 0;
                showElement(current_idx);
            });
        }
    }
    AdaptiveHierarchy.info = info;
    return AdaptiveHierarchy;

})(jsPsychModule);
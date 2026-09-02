var jsPsychFreeSortHierarchy = (function (jspsych) {

    //test
    const info = {
        name: 'free-sort-hierarchy',
        description: "Code for hierarchical categorization task.", 
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
                description: 'The response time in milliseconds.'
            },
            item_order: {
                type: jspsych.ParameterType.ARRAY,
                arrayType: jspsych.ParameterType.INT,
                default: [],
                description: 'The order in which stimuli appear in the item box.'
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
                type: jspsych.ParameterType.OBJECT,
                default: {},
                description: 'The number of times an item changes categories.'
            },
            categorization_time: {
                type: jspsych.ParameterType.INT,
                default: void 0,
                description: 'The time it takes for all items to be categorized into the system.'
            }
        }
    };
    /**
     * **afree-sort-hierarchy**
     *
     * {description}
     *
     * @author Katie Warburton
     * @see {@link {documentation-url}}
     */
    class FreeSortHierarchy {
        constructor (jsPsych) {
            this.jsPsych = jsPsych;
            this.resizeHandler = null; 
        }

        static info = info;    

        trial(display_element, trial) {
            const self = this;

            // Define the base HTML for the trial
            let html = `<div class="jspsych-display-element" style="height:95vh; aspect-ratio:1.7; background-color: white;">
                            <div class="at-once-grid">
                                <div id="title-container">
                                    <div>
                                        <h1 class="exp-title">${trial.title} <span style="font-size:75%;">(All at once)</span></h1>
                                    </div>
                                </div>
                                <div id="prompt-container" style="grid-row-end: item-buff;">
                                    <p>${trial.prompts[0]}</p>
                                </div>
                                <div id="item-bin" style="width: 0%; height:0%; border: none"></div>
                                <svg id="category-tree" style="background-color: ${trial.background_color};"></svg>
                                <div id="button-container">
                                    <button class="trial-button" id="continue-button">${trial.button_labels[0]}</button>
                                </div>
                            </div>
                        </div>`;

            display_element.innerHTML = html;

                        
            const updateLayout = () => {
                const vh = 0.95 * Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
                
                const container = document.querySelector('.jspsych-display-element');
                if (container) {
                    container.style.height = vh + 'px';
                    container.style.aspectRatio = 1.7;
                }

                if (typeof redrawTree === 'function' && svg && root && nodes) {
                    redrawTree();
                }
                                
                const itemDisplay = document.getElementById('item-bin');
                    if (itemDisplay) {
                        // Recalculate item sizes for the new layout
                        if (BUILD_MODE && root && root.data && root.data.item_size) {
                            const images = itemDisplay.querySelectorAll('img.stimuli');
                            images.forEach(img => {
                                img.width = root.data.item_size;
                                img.height = root.data.item_size;
                                img.style.width = root.data.item_size + 'px';
                                img.style.height = root.data.item_size + 'px';
                                img.style.cursor = 'grab';
                            });

                            const placeholders = itemDisplay.querySelectorAll('.item-placeholder');
                            placeholders.forEach(placeholder => {
                                placeholder.style.width = root.data.item_size + 'px';
                                placeholder.style.height = root.data.item_size + 'px';
                            });
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


            function redrawTree() {
                if (!svg || !root || !nodes) return;
                
                const category_tree = document.getElementById("category-tree");
                if (!category_tree) return;
                const category_tree_box = category_tree.getBoundingClientRect();

                NODES_BY_LEVEL = get_node_info(root.data);
                get_node_boundaries(root.data, category_tree_box, NODES_BY_LEVEL);

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
                    node.selectAll(".hover-outline").remove();

                    
                    // Redraw items if node has items
                    if (d.data.items && d.data.items.length > 0) {
                        const isLeafNode = d.data.depth === trial.depth - 1;
                        
                        for (let i = 0; i < d.data.items.length; i++) {
                            let x = trial.node_border_width + ((i % d.data.cols) * d.data.item_size);
                            let y = trial.node_border_width + (Math.floor(i / d.data.cols) * d.data.item_size);
                            
                            let item_path = trial.item_loc + "\\item (" + Math.trunc(d.data.items[i]) + ").png";
                            let isAdded = d.data.newItems && d.data.newItems.includes(d.data.items[i]);
                            let img = node.append("image")
                                .attr("xlink:href", item_path)
                                .attr("x", x)
                                .attr("y", y)
                                .attr('id', d.data.items[i])
                                .attr("width", d.data.item_size)
                                .attr("height", d.data.item_size)
                                .attr('visibility', 'visible')
                                .attr("pointer-events", isAdded && isLeafNode ? "auto" : "none");

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
                            }
                            
                            // Re-add interaction handlers for removable items
                            if (isAdded && isLeafNode) {
                                img.on("mouseover", function() {
                                    node.append("rect")
                                        .attr("class", "hover-outline")
                                        .attr("x", x + 1)  
                                        .attr("y", y + d.data.item_size - 1)
                                        .attr("width", d.data.item_size - 2)
                                        .attr("height", trial.node_border_width)
                                        .attr("fill", "#FF007F")
                                        .attr("stroke", "#FF007F")
                                        .attr("stroke-width", trial.node_border_width)
                                        .attr("pointer-events", "none");
                                })
                                .on("mouseout", function() {
                                    d3.selectAll(".hover-outline").remove();
                                })
                                .on("dblclick", event => {
                                    let current_time = performance.now();
                                    event.preventDefault();
                                    CURRENT_ITEM = parseFloat(img.attr('id'));
                                    remove_item(node.select('rect'), node, d);
                                    let parent = d.parent;
                                    while (parent) {
                                        let prev_rows = get_rows(parent.data.items.length, parent.data.cols);
                                        let parentNode = d3.select(`g[name="${parent.data.name}"]`);
                                        let parentRect = parentNode.select("rect");
                                        redraw_node(parentRect, parentNode, parent, false);
                                        let curr_rows = get_rows(parent.data.items.length, parent.data.cols);
                                        if (prev_rows != curr_rows) {
                                            redraw_links(svg);
                                        }
                                        parent = parent.parent;
                                    }
                                    
                                    const placeholder = document.getElementById(`placeholder-${CURRENT_ITEM}`);
                                    const image_element = document.createElement('img');
                                    image_element.src = trial.item_loc + "\\item (" + Math.trunc(CURRENT_ITEM) + ").png";
                                    image_element.id = `stimuli-${CURRENT_ITEM}`;
                                    image_element.style.width = placeholder.style.width;
                                    image_element.style.height = placeholder.style.height;
                                    image_element.draggable = true;
                                    image_element.style.cursor = 'grab';

                                    image_element.className = 'stimuli';
                                    image_element.addEventListener('dragstart', handleDragStart);
                                    image_element.addEventListener('dragend', handleDragEnd);

                                    placeholder.parentNode.replaceChild(image_element, placeholder);
                                    CATEGORY_CHOICES = CATEGORY_CHOICES.filter(obj => !obj.hasOwnProperty(CURRENT_ITEM));
                                    ACTIONS.push(`REMOVE ${CURRENT_ITEM} from ${d.data.name}`);
                                    REACTION_TIMES.push(current_time - performance.now());
                                    // delete CATEGORY_CHOICES[CURRENT_ITEM];
                                    checkAllItemsPlaced();
                                    d3.selectAll(".highlight-border").remove();
                                    TIME = performance.now();
                                });
                            }
                        }
                    }
                    
                    // Update text positioning and size
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
                //             
            }

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

            let MIN_TEXT_WIDTH;
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
                d.data.newItems.push(item);
            }

            function redraw_node(rect, node, d, newToTree=true) {
                
                // Insert item in sorted order
                const newItem = CURRENT_ITEM;
                if (newToTree){
                    add_item(newItem, d)
                } else {
                    d.data.items = d.data.children.flatMap(child => child.items);
                }
                
                // Clear existing images and redraw all in the correct order
                node.selectAll("image").remove();
                d3.selectAll(".hover-outline").remove();
                node.selectAll(".highlight-border").remove(); 


                if (d.data.items.length === 0) {
                    
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
                    
                    if (d.data.parent.items.length > 1) {
                        let text = node.select("text");
                        text.attr("visibility", "visible")
                        .attr("fill", "black");
                    } 

                } else {

                    const isLeafNode = d.data.depth === trial.depth - 1;

                    // Redraw all items in their sorted positions
                    for (let i = 0; i < d.data.items.length; i++) {
                        let x = trial.node_border_width + ((i % d.data.cols) * d.data.item_size);
                        let y = trial.node_border_width + (Math.floor(i / d.data.cols) * d.data.item_size);
                        
                        let item_path = trial.item_loc + "\\item (" + Math.trunc(d.data.items[i]) + ").png";
                        let isAdded = d.data.newItems.includes(d.data.items[i])

                        let img = node.append("image")
                            .attr("xlink:href", item_path)
                            .attr("x", x)
                            .attr("y", y)
                            .attr('id', d.data.items[i])
                            .attr("width", d.data.item_size)
                            .attr("height", d.data.item_size)
                            .attr('visibility', 'visible')
                            .attr("pointer-events", isAdded && isLeafNode ? "auto" : "none");

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
                                .attr("stroke", "#6DB752")
                                .attr("stroke-width", trial.node_border_width)
                            }
                        
                        if (isAdded && isLeafNode) {
                            // Add pink line at bottom of images that have been added (and can be removed)
                            img.on("mouseover", function() {
                                node.append("rect")
                                    .attr("class", "hover-outline")
                                    .attr("x", x + 1)  
                                    .attr("y", y + d.data.item_size - 1)
                                    .attr("width", d.data.item_size - 2)
                                    .attr("height", trial.node_border_width)
                                    .attr("fill", "#FF007F")
                                    .attr("stroke", "#FF007F")
                                    .attr("stroke-width", trial.node_border_width)
                                    .attr("pointer-events", "none");
                            })
                            .on("mouseout", function() {
                                // Remove pink line when not hovering
                                d3.selectAll(".hover-outline").remove();
                            })
                            .on("dblclick", event => {
                                let current_time = performance.now();
                                event.preventDefault();
                                CURRENT_ITEM = parseFloat(img.attr('id'));
                                remove_item(node.select('rect'), node, d);

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
                                
                                const placeholder = document.getElementById(`placeholder-${CURRENT_ITEM}`);
                                const image_element = document.createElement('img');
                                image_element.src = trial.item_loc + "\\item (" + Math.trunc(CURRENT_ITEM) + ").png";
                                image_element.id = `stimuli-${CURRENT_ITEM}`;
                                image_element.style.width = placeholder.style.width;
                                image_element.style.height = placeholder.style.height;
                                image_element.style.cursor = 'grab';

                                image_element.draggable = true;
                                image_element.className = 'stimuli';
                                image_element.addEventListener('dragstart', handleDragStart);
                                image_element.addEventListener('dragend', handleDragEnd);

                                placeholder.parentNode.replaceChild(image_element, placeholder);
                                // delete CATEGORY_CHOICES[CURRENT_ITEM];
                                CATEGORY_CHOICES = CATEGORY_CHOICES.filter(obj => !obj.hasOwnProperty(CURRENT_ITEM));
                                ACTIONS.push(`REMOVE ${CURRENT_ITEM} from ${d.data.name}`);
                                REACTION_TIMES.push(current_time - TIME);
                                checkAllItemsPlaced();
                                d3.selectAll(".highlight-border").remove();
                                TIME = performance.now();
                                

                            })
                            ;
                        }
                    }
                }
                // Update node dimensions
                let w = (2*trial.node_border_width) + (d.data.item_size * get_cols(d.data.items.length, d.data.cols));
                let h = (2*trial.node_border_width) + (d.data.item_size * get_rows(d.data.items.length, d.data.cols));

                // Redraw rectangle
                rect.attr("width", w)
                    .attr("height", h);

                d.data.width = w;
                d.data.height = h;
        

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
                node.selectAll("image").remove();
                d3.selectAll(".hover-outline").remove();
                node.selectAll(".highlight-border").remove();
   
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
                    d.data.visible = false;
                    let circle = node.select("circle");
                    circle.attr("visibility", "hidden");
                    rect.attr("visibility", "hidden");
                    let parent = d.parent;
                    let link = d3.selectAll(".link").filter(function(l) {return l.source === parent && l.target === d;});
                    link.attr("visibility", "hidden");
                    d.data.width = 0;
                    d.data.height = 0;

                    if (d.data.parent.items.length > 1) {
                        let text = node.select("text");
                        text.attr("visibility", "visible")
                        .attr("fill", "black");
                    } 

                } else {
                    // Redraw all items in sorted order
                    const isLeafNode = d.data.depth === trial.depth - 1;
                    
                    for (let i = 0; i < d.data.items.length; i++) {
                        let x = trial.node_border_width + ((i % d.data.cols) * d.data.item_size);
                        let y = trial.node_border_width + (Math.floor(i / d.data.cols) * d.data.item_size);
                        
                        let item_path = trial.item_loc + "\\item (" +  Math.trunc(d.data.items[i]) + ").png";
                        let isAdded = d.data.newItems.includes(d.data.items[i])

                        let img = node.append("image")
                            .attr("xlink:href", item_path)
                            .attr("x", x)
                            .attr("y", y)
                            .attr('id', d.data.items[i])
                            .attr("width", d.data.item_size)
                            .attr("height", d.data.item_size)
                            .attr("pointer-events", isAdded && isLeafNode ? "auto" : "none")
                            .attr('visibility', 'visible');
                            if (isAdded && isLeafNode) {
                                img.on("mouseover", function() {
                                    // Add pink line at bottom of images 
                                    node.select('rect').dispatch('mouseover');
                                    node.append("rect")
                                        .attr("class", "hover-outline")
                                        .attr("x", x + 1) 
                                        .attr("y", y + d.data.item_size - 1)
                                        .attr("width", d.data.item_size - 2)
                                        .attr("height", trial.node_border_width)
                                        .attr("fill", "#FF007F")
                                        .attr("stroke", "#FF007F")
                                        .attr("stroke-width", trial.node_border_width)
                                        .attr("pointer-events", "none");
                                })
                                .on("mouseout", function() {
                                    // Remove pink line when not hovering
                                    d3.selectAll(".hover-outline").remove();
                                    node.select('rect').dispatch('mouseout');
                                })
                                .on("dblclick", event => {
                                    let current_time = performance.now();
                                    event.preventDefault();
                                    CURRENT_ITEM = parseFloat(img.attr('id'));
                                    remove_item(node.select('rect'), node, d);
        
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
                                    
                                    const placeholder = document.getElementById(`placeholder-${CURRENT_ITEM}`);
                                    const image_element = document.createElement('img');
                                    image_element.src = trial.item_loc + "\\item (" + Math.trunc(CURRENT_ITEM) + ").png";
                                    image_element.id = `stimuli-${CURRENT_ITEM}`;
                                    image_element.style.width = placeholder.style.width;
                                    image_element.style.height = placeholder.style.height;
                                    image_element.style.cursor = 'grab';
                                    image_element.draggable = true;
                                    image_element.className = 'stimuli';
                                    image_element.addEventListener('dragstart', handleDragStart);
                                    image_element.addEventListener('dragend', handleDragEnd);
        
                                    placeholder.parentNode.replaceChild(image_element, placeholder);
                                    // delete CATEGORY_CHOICES[CURRENT_ITEM];
                                    CATEGORY_CHOICES = CATEGORY_CHOICES.filter(obj => !obj.hasOwnProperty(CURRENT_ITEM));
                                    ACTIONS.push(`REMOVE ${CURRENT_ITEM} from ${d.data.name}`);
                                    REACTION_TIMES.push(current_time - TIME);
                                    checkAllItemsPlaced();
                                    d3.selectAll(".highlight-border").remove();
                                    TIME = performance.now();
                                });
                            }
                        
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

            function removeItemFromContainer(itemId) {
                const itemElement = document.getElementById(`stimuli-${itemId}`);
                if (itemElement) {
                    // Create a placeholder div to maintain spacing
                    const placeholder = document.createElement('div');
                    placeholder.style.width = `${itemElement.width}px`;
                    placeholder.style.height = `${itemElement.height}px`;
                    placeholder.style.margin = '5px';
                    placeholder.style.visibility = 'hidden';
                    placeholder.className = 'item-placeholder';
                    placeholder.id = `placeholder-${itemId}`;
                    
                    // Replace the item with the placeholder
                    itemElement.parentNode.replaceChild(placeholder, itemElement);
                }
            }
            

            function handleItemDrop(d, node, rect) {
                let current_time = performance.now();
                if (!d.data.can_add || !BUILD_MODE || DRAGGED_ITEM === null) return;
                
                CURRENT_ITEM = parseFloat(DRAGGED_ITEM);
                
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
                removeItemFromContainer(DRAGGED_ITEM);
                let cat_choice = {};
                cat_choice[CURRENT_ITEM] = d.data.name;
                CATEGORY_CHOICES.push(cat_choice);
                if (!(CURRENT_ITEM in CATEGORY_CHANGES)){
                    CATEGORY_CHANGES[CURRENT_ITEM] = 0;
                } else{
                    CATEGORY_CHANGES[CURRENT_ITEM] = CATEGORY_CHANGES[CURRENT_ITEM] + 1;
                }
                ACTIONS.push(`ADD ${CURRENT_ITEM} to ${d.data.name}`);
                REACTION_TIMES.push(current_time - TIME)
                DRAGGED_ITEM = null;
                TIME = performance.now();

            }

            function handleAddCategoryDrop(d, node, text) {
                let current_time = performance.now();
                if (!BUILD_MODE || DRAGGED_ITEM === null) return;
                
                CURRENT_ITEM = parseFloat(DRAGGED_ITEM);
                
                // Hide the text and make node visible
                text.attr("visibility", "hidden");
                
                d.data.visible = true;
                let circle = node.select("circle");
                circle.attr("visibility", "visible");
                let rect = node.select("rect");
                rect.attr("visibility", "visible");
                
                removeItemFromContainer(DRAGGED_ITEM);
                // Add item to the new node
                redraw_node(rect, node, d, true);
                
                // make link between node and parent visible
                let parent = d.parent;
                let link = svg.selectAll(".link").filter(function(l) {return l.source === parent && l.target === d;});
                link.attr("visibility", "visible");
                
                // Update parent nodes
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
                
                // Special handling for child nodes if needed
                if (d.data.children.length == 1) {
                    let label = d.data.children[0].name;
                    let child = d3.select(`g[name="${label}"]`);
                    let circle_kid = child.select("circle");
                    circle_kid.attr("visibility", "visible");
                    let kid_rect = child.select("rect");
                    kid_rect.attr("visibility", "visible");

                    let kid_d = NODES_BY_NAME[label];
                    redraw_node(kid_rect, child, kid_d, true);
                    let childLink = svg.selectAll(".link").filter(function(l) {return l.source === d && l.target === kid_d;});
                    childLink.attr("visibility", "visible");
                    d.data.can_add = false; 
                    kid_d.data.can_add = true;
                    kid_d.visible = true; 
                    let cat_choice = {};
                    cat_choice[CURRENT_ITEM] = kid_d.data.name;
                    CATEGORY_CHOICES.push(cat_choice);
                    if (!(CURRENT_ITEM in CATEGORY_CHANGES)){
                        CATEGORY_CHANGES[CURRENT_ITEM] = 0;
                    } else{
                        CATEGORY_CHANGES[CURRENT_ITEM] = CATEGORY_CHANGES[CURRENT_ITEM] + 1;
                    }
                    ACTIONS.push(`ADD ${CURRENT_ITEM} to ${kid_d.data.name}`);
                    REACTION_TIMES.push(current_time - TIME);
                } else {
                    let cat_choice = {};
                    cat_choice[DRAGGED_ITEM] = d.data.name;
                    CATEGORY_CHOICES.push(cat_choice);
                    if (!(CURRENT_ITEM in CATEGORY_CHANGES)){
                        CATEGORY_CHANGES[CURRENT_ITEM] = 0;
                    } else{
                         CATEGORY_CHANGES[CURRENT_ITEM] = CATEGORY_CHANGES[CURRENT_ITEM] + 1;
                    }
                    ACTIONS.push(`ADD ${CURRENT_ITEM} to ${d.data.name}`);
                    REACTION_TIMES.push(current_time - TIME);

                }
                DRAGGED_ITEM = null;
                TIME = performance.now();
            }

            let originalPointerEvents = {};
            
            function handleDragStart(event) {

                d3.selectAll(".highlight-border").remove();
                d3.selectAll(".hover-outline").remove();

                const img = event.target;
                DRAGGED_ITEM = img.id.split('-')[1];
                img.classList.add('dragging');
                
                // Set drag image 
                const dragImage = img.cloneNode(true);
                dragImage.style.width = `${img.width}px`;
                dragImage.style.height = `${img.height}px`;
                dragImage.style.position = 'absolute';
                dragImage.style.top = '-1000px'; 
                dragImage.style.left = '-1000px';
                document.body.appendChild(dragImage);
                event.dataTransfer.setDragImage(dragImage, img.width / 2, img.height / 2);
                setTimeout(() => document.body.removeChild(dragImage), 0);

                
                event.dataTransfer.setData('text/plain', DRAGGED_ITEM);
                event.dataTransfer.effectAllowed = 'move';

                d3.selectAll("image").each(function() {
                    const element = this;
                    originalPointerEvents[element.id] = window.getComputedStyle(element).pointerEvents;
                    d3.select(element).style("pointer-events", "none");
                });
                
            }
            
            function handleDragEnd(event) {
                event.target.classList.remove('dragging');
                d3.selectAll("image").each(function() {
                    const element = this;
                    const originalValue = originalPointerEvents[element.id] || "auto";
                    d3.select(element).style("pointer-events", originalValue);
                });
                  d3.selectAll(".red")
                    .attr("stroke", "black")
                    .attr("stroke-width", trial.node_border_width)
                    .classed("red", false);
            
                // Clear the stored values
                originalPointerEvents = {};
            }
            
            function handleDragOver(event, d) {
                if (d.data.can_add && BUILD_MODE) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    // Add visual feedback - turn border red
                    if (event.target.tagName === "rect" || event.target.tagName === "RECT") {
                        d3.select(event.target).attr("stroke", "red").attr("stroke-width", trial.node_border_width*2).classed("red", true);
                    }
                }
            }
            
            function handleDragEnter(event, d) {
                if (d.data.can_add && BUILD_MODE) {
                    event.preventDefault();
                }
            }
            
            function handleDragLeave(event) {
                if (event.target.tagName.toLowerCase() === "text") {
                    d3.select(event.target).classed("text-drag-over", false);
                } else {
                    d3.select(event.target).classed("drag-over", false);
                }
                if (event.target.tagName === "rect" || event.target.tagName === "RECT") {
                        d3.select(event.target).attr("stroke", "black").attr("stroke-width", trial.node_border_width).classed("red", false);
                    }
                if (d3.select(event.target).classed("red")) {
                    d3.select(event.target).attr("stroke", "black").attr("stroke-width", trial.node_border_width).classed("red", false)
                }
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
                            .attr('id', item)
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
                .attr("fill", "black")
                .attr("visibility", d => (!d.data.visible && d.data.can_add) ? "visible" : "hidden")
                .style("cursor", "pointer")
                .on("mouseover", function() {
                    d3.select(this).attr("fill", "red");
                })
                .on("mouseout", function() {
                    d3.select(this).attr("fill", "black");
                })

                node.append("circle")
                .attr("cx", d.data.width/2)
                .attr("r", trial.node_border_width*2)
                .attr("fill", "black")
                .attr("visibility", d => (d.data.visible && !d.data.root)? "visible" : "hidden");


            }

            // BUILD TREE
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

            let NODES_BY_NAME = {};
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

            function markInitialItems(node) {
                node.newItems = [];
                
                if (node.children && node.children.length > 0) {
                    node.children.forEach(child => markInitialItems(child));
                }
            }
            
            markInitialItems(tree);


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

            function checkAllItemsPlaced() {
                // Check if there are any items left in the item container
                const itemContainer = document.getElementById("item-bin");
                const remainingItems = itemContainer.querySelectorAll('img.stimuli').length;
                
                NEXT_BUTTON.disabled = remainingItems > 0;
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
                } else if (index == 0) {
                    let item_display = document.getElementById("item-bin");
                    item_display.style.width = '100%';
                    item_display.style.height = '100%';
                    item_display.style.border = '3px solid black';
                    item_display.innerHTML = '';
                    BUILD_MODE = true;

                    let prompt_container = document.getElementById("prompt-container");
                    prompt_container.style.gridRowEnd = 'prompt-box';

                    let items = trial.items; 
                    items = items.sort(() => Math.random() - 0.5);
                    ITEM_SEQ = items;


                    for (let i = 0; i < trial.items.length; i++) {
                        let it = trial.items[i]
                        let label;
                        if (root.data.items.includes(it)) {
                            label = it + 0.01;
                        } else {
                            label = it;
                        }
                        const image_element = document.createElement('img');
                        image_element.src = trial.item_loc + "\\item (" + it + ").png";
                        image_element.id = `stimuli-${label}`;
                        image_element.width = ITEM_SIZE;
                        image_element.height = ITEM_SIZE;
                        image_element.draggable = true;
                        image_element.className = 'stimuli';
                        image_element.style.cursor = 'grab';
                        image_element.addEventListener('load', () => {
                            item_display.appendChild(image_element);
                        });
                        image_element.addEventListener('dragstart', handleDragStart);
                        image_element.addEventListener('dragend', handleDragEnd);
                        CAT_TIME = performance.now();
                        
                    };

                    d3.selectAll("rect").each(function(d) {
                        if (d && d.data) {
                            this.addEventListener('dragover', function(event) { handleDragOver(event, d); });
                            this.addEventListener('dragenter', function(event) { handleDragEnter.call(this, event, d); });
                            this.addEventListener('dragleave', handleDragLeave);
                            this.addEventListener('drop', function(event) {
                                event.preventDefault();
                                if (d.data.can_add && BUILD_MODE) {
                                    const node = d3.select(d3.select(this).node().parentNode);
                                    const rect = d3.select(this);
                                    handleItemDrop(d, node, rect);
                                    checkAllItemsPlaced();
                                }
                            });
                        }
                    });

                    d3.selectAll("text").each(function(d) {
                        if (d && d.data) {
                            this.addEventListener('dragover', function(event) {
                                if (BUILD_MODE) {
                                    event.preventDefault();
                                    event.dataTransfer.dropEffect = 'move';
                                    d3.select(this).attr("fill", "red");
                                }
                            });
                            
                            this.addEventListener('dragenter', function(event) {
                                if (BUILD_MODE) {
                                    event.preventDefault();
                                    d3.select(this).classed("drag-over", true);
                                }
                            });
                            
                            this.addEventListener('dragleave', function() {
                                d3.select(this).classed("text-drag-over", false);
                                d3.select(this).attr("fill", "black");
                            });
                            
                            this.addEventListener('drop', function(event) {
                                event.preventDefault();
                                if (BUILD_MODE) {
                                    const node = d3.select(d3.select(this).node().parentNode);
                                    handleAddCategoryDrop(d, node, d3.select(this));
                                    checkAllItemsPlaced();
                                }
                            });
                        }
                    });

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
                    let final_time = performance.now() - CAT_TIME;
                    BUILD_MODE = false;
                    // ensures that the final tree does not have any circular references

                    if (self.resizeHandler) {
                        window.removeEventListener('resize', self.resizeHandler);
                        delete self.resizeHandler; 

                    }
                    self.jsPsych.pluginAPI.clearAllTimeouts();
                    for (let node of nodes) {
                        delete node.data.parent;

                    }
                    let final_tree = root.data;
                    clearItems(final_tree);

                    let data = {
                        rts: REACTION_TIMES,
                        final_tree: final_tree,
                        category_choices: CATEGORY_CHOICES,
                        item_order: ITEM_SEQ,
                        categorization_time: CAT_TIME,
                        actions: ACTIONS,
                        category_changes: CATEGORY_CHANGES
                    };
                    jsPsych.finishTrial(data);
                }   
                TIME = performance.now();
            }

            
            let DRAGGED_ITEM = null;
            let BUILD_MODE = false;
            let current_idx = trial.start_idx;
            let CURRENT_ITEM; 
            let ITEM_SEQ;
            let REACTION_TIMES = [];
            let CATEGORY_CHOICES = [];
            let CATEGORY_CHANGES = {};
            let ACTIONS = [];
            let TIME = performance.now();
            let CAT_TIME;
            let NEXT_BUTTON = document.getElementById("continue-button");
            ITEM_SIZE = root.data.item_size; 
            NEXT_BUTTON.addEventListener("click", function() {
                REACTION_TIMES.push(performance.now() - TIME);
                ACTIONS.push(`CLICK '${NEXT_BUTTON.textContent || NEXT_BUTTON.innerText}' button`)
                d3.selectAll(".highlight-border").remove();
                current_idx++;
                document.getElementById("prompt-container").scrollTop = 0;
                showElement(current_idx);
            });
        }
    }
    FreeSortHierarchy.info = info;
    return FreeSortHierarchy;

})(jsPsychModule);
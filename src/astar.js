export default class AStar {
    constructor () {
        this.initialize();
    }

    initialize () {
        this.solidOb = {solid: true, exists: true};
        this.maxSearchTime = 5000;
        this.s = {};
        this.g = {};
        this.open = [];
        this.closed = [];
        this.nodes = {};
        this.preventClipping = true;
    }

    findHeuristic (x, y) {
        let dx = Math.abs(x - this.g.x);
        let dy = Math.abs(y - this.g.y);
        let val1 = Math.min(dx, dy) * 1.410000;
        let val2 = Math.max(dx, dy) - Math.min(dx, dy);
        return (val1 + val2);
    }

    cost (who, newx, newy) {
        let val = 1;
        if ((who.x - newx) !== 0 && (who.y - newy) !== 0) {
            val = 1.410000;
            if (this.preventClipping) {
                let xsign = (who.x - newx) / Math.abs(who.x - newx);
                let ysign = (who.y - newy) / Math.abs(who.y - newy);
                let cell1x = who.x - xsign;
                let cell1y = who.y;
                let cell1 = this.nodes["node" + cell1x + "_" + cell1y];
                let cell2x = who.x;
                let cell2y = who.y - ysign;
                let cell2 = this.nodes["node" + cell2x + "_" + cell2y];
                if ((cell1 && cell1.solid) || (cell2 && cell2.solid)) {
                    val = 100000;
                }
            }
        }
        return (val);
    }

    checkNode (newx, newy, whoName) {
        let who = this.nodes[whoName];
        let name = "node" + newx + "_" + newy;
        let g = who.g + this.cost(who, newx, newy);
        if (who.x == this.g.x && who.y == this.g.y) {
            this.keepSearching = false;
        }
        if (this.nodes[name] && !this.nodes[name].exists) {
            this.addOpen(newx, newy, g, whoName);
        } else if (this.nodes[name] && !this.nodes[name].solid) {
            if (g < this.nodes[name].g) {
                let ob = this.nodes[name];
                ob.parent = whoName;
                ob.g = g;
                ob.f = ob.h + g;
                let f = ob.f;
                if (this.nodes[name].where == "open") {
                    var j = 0;
                    while (j < this.open.length) {
                        if (this.open[j].name == name) {
                            this.open.splice(j, 1);
                        }
                        ++j;
                    }
                    let i = 0;
                    while (i < this.open.length) {
                        if (f < this.open[i].f) {
                            this.open.splice(i, 0, ob);
                            this.nodes[name] = this.open[i];
                            break;
                        }
                        if (i == this.open.length - 1) {
                            this.open.push(ob);
                            this.nodes[name] = astar.open[i + 1];
                            break;
                        }
                        ++i;
                    }
                }
                if (this.nodes[name].where == "closed") {
                    let j = 0;
                    while (j < this.closed.length) {
                        if (this.closed[j].name == name) {
                            this.closed.splice(j, 1);
                        }
                        ++j;
                    }
                }
            }
        }
    }

    buildPath () {
        let name = "node" + this.g.x + "_" + this.g.y;
        let parent = this.nodes[name].parent;
        this.path = [];
        debugger;
        while (parent != null) {
            this.path.push([this.nodes[parent].x, this.nodes[parent].y]);
            parent = this.nodes[parent].parent;
        }
        this.path.reverse();
        this.path.shift();
        this.path.push([this.g.x, this.g.y]);
    }

    expandNode (index) {
        let who = this.open[index];
        let nodex = who.x;
        let nodey = who.y;
        let whoName = "node" + nodex + "_" + nodey;
        this.checkNode(nodex + 1, nodey, whoName);
        this.checkNode(nodex + 1, nodey - 1, whoName);
        this.checkNode(nodex, nodey - 1, whoName);
        this.checkNode(nodex - 1, nodey - 1, whoName);
        this.checkNode(nodex - 1, nodey, whoName);
        this.checkNode(nodex - 1, nodey + 1, whoName);
        this.checkNode(nodex, nodey + 1, whoName);
        this.checkNode(nodex + 1, nodey + 1, whoName);
        let temp = this.open[index];
        temp.where = "closed";
        this.open.splice(index, 1);
        this.closed.push(temp);
        debugger;
        if (!this.keepSearching) {
            this.buildPath();
        }
    }

    addOpen (x, y, g, parent) {
        let h = this.findHeuristic(x, y);
        let f = g + h;
        let name = "node" + x + "_" + y;
        let ob = {x: x, y: y, g: g, h: h, f: f, name: name, parent: parent, exists: true, where: "open"};
        if (parent == null) {
            this.open.push(ob);
            this.nodes[name] = this.open[0];
        }
        let i = 0;
        while (i < this.open.length) {
            if (f < this.open[i].f) {
                this.open.splice(i, 0, ob);
                this.nodes[name] = this.open[i];
                break;
            }
            if (i == (this.open.length - 1)) {
                this.open.push(ob);
                this.nodes[name] = this.open[i + 1];
                break;
            }
            ++i;
        }
    }
    search () {
        delete this.path;
        this.now = new Date().getTime();
        this.addOpen(this.s.x, this.s.y, 0, null);
        this.keepSearching = true
        while (this.keepSearching) {
            this.expandNode(0);
            if ((new Date().getTime() - this.now) > this.maxSearchTime) {
                console.log("no solution");
                this.keepSearching = false;
            }
        }
        // st.text = getTimer() - this.now;

        //this.initialize();
        return (this.path);
    };
}
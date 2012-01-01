var r;


//MIT license: https://twitter.com/#!/RaphaelJS/statuses/172989490229559296 http://raphaeljs.com/graffle.html
Raphael.fn.connection = function (obj1, obj2, line, bg) {
    if (obj1.line && obj1.from && obj1.to) {
        line = obj1;
        obj1 = line.from;
        obj2 = line.to;
    }
    var bb1 = obj1.getBBox(),
    bb2 = obj2.getBBox(),
    p = [{
        x: bb1.x + bb1.width / 2, 
        y: bb1.y - 1
    },

    {
        x: bb1.x + bb1.width / 2, 
        y: bb1.y + bb1.height + 1
    },

    {
        x: bb1.x - 1, 
        y: bb1.y + bb1.height / 2
    },

    {
        x: bb1.x + bb1.width + 1, 
        y: bb1.y + bb1.height / 2
    },

    {
        x: bb2.x + bb2.width / 2, 
        y: bb2.y - 1
    },

    {
        x: bb2.x + bb2.width / 2, 
        y: bb2.y + bb2.height + 1
    },

    {
        x: bb2.x - 1, 
        y: bb2.y + bb2.height / 2
    },

    {
        x: bb2.x + bb2.width + 1, 
        y: bb2.y + bb2.height / 2
    }],
    d = {}, dis = [];
    for (var i = 0; i < 4; i++) {
        for (var j = 4; j < 8; j++) {
            var dx = Math.abs(p[i].x - p[j].x),
            dy = Math.abs(p[i].y - p[j].y);
            if ((i == j - 4) || (((i != 3 && j != 6) || p[i].x < p[j].x) && ((i != 2 && j != 7) || p[i].x > p[j].x) && ((i != 0 && j != 5) || p[i].y > p[j].y) && ((i != 1 && j != 4) || p[i].y < p[j].y))) {
                dis.push(dx + dy);
                d[dis[dis.length - 1]] = [i, j];
            }
        }
    }
    if (dis.length == 0) {
        var res = [0, 4];
    } else {
        res = d[Math.min.apply(Math, dis)];
    }
    var x1 = p[res[0]].x,
    y1 = p[res[0]].y,
    x4 = p[res[1]].x,
    y4 = p[res[1]].y;
    dx = Math.max(Math.abs(x1 - x4) / 2, 10);
    dy = Math.max(Math.abs(y1 - y4) / 2, 10);
    var x2 = [x1, x1, x1 - dx, x1 + dx][res[0]].toFixed(3),
    y2 = [y1 - dy, y1 + dy, y1, y1][res[0]].toFixed(3),
    x3 = [0, 0, 0, 0, x4, x4, x4 - dx, x4 + dx][res[1]].toFixed(3),
    y3 = [0, 0, 0, 0, y1 + dy, y1 - dy, y4, y4][res[1]].toFixed(3);
    var path = ["M", x1.toFixed(3), y1.toFixed(3), "C", x2, y2, x3, y3, x4.toFixed(3), y4.toFixed(3)].join(",");
    if (line && line.line) {
        line.bg && line.bg.attr({
            path: path
        });
        line.line.attr({
            path: path
        });
    } else {
        var color = typeof line == "string" ? line : "#000";
        return {
            bg: bg && bg.split && this.path(path).attr({
                stroke: bg.split("|")[0], 
                fill: "none", 
                "stroke-width": bg.split("|")[1] || 2
            }),
            line: this.path(path).attr({
                stroke: color, 
                fill: "none"
            }),
            from: obj1,
            to: obj2
        };
    }
};

var createText = function(text) {
    var ret = r.text(-100,-100,text);
    ret.attr("fill", "#fff");
    return ret;
}
var getpos = function(shape) {
    if (shape.type == "rect") {
        return {
            x: shape.attr("x") + (shape.attr("width")*0.5),
            y: shape.attr("y") + (shape.attr("height")*0.5)
        };
    } else {
        return {
            x: shape.attr("cx"),
            y: shape.attr("cy")
        };
    }
}
var movesubelements = function() {
    for (var i = 0; i < subelements.length; i++) {
        for (var j = 0; j < subelements[i].length; j++) {
            var gp = getpos(shapes[i]);
            gp.y = gp.y - shapes[i].attr('height')*0.5 + 20;
            gp.y = parseInt(gp.y) + $(subelements[i][j]).data("_dy");
            gp.x = parseInt(gp.x) + $(subelements[i][j]).data("_dx");
            gp.cx = gp.x;
            gp.cy = gp.y;
            
            //gp["y"] = parseInt(gp["y"]);
            //console.log(gp);
            subelements[i][j].attr(gp);
        }
    }
    for (var i = connections.length; i--;) {
        r.connection(connections[i]);
    }    
    r.safari();
};
var dragger = function () {
    this.ox = this.type == "rect" ? this.attr("x") : this.attr("cx");
    this.oy = this.type == "rect" ? this.attr("y") : this.attr("cy");
    this.animate({
        "fill-opacity": .5
    }, 500);
},
move = function (dx, dy) {
    var att = this.type == "rect" ? {
        x: this.ox + dx, 
        y: this.oy + dy
    } : {
        cx: this.ox + dx, 
        cy: this.oy + dy
    };
    this.attr(att);
    movesubelements();
},
up = function () {
    this.animate({
        "fill-opacity": 0.1
    }, 500);
};

var connections = [];
var shapes = [];
var subelements = [];

var addNode = function(node, x, y) {
    var _dy = 0;
    var text = (node.name != undefined? node.name : "") + ":" + node.type;
    
    var shap = r.rect(x,y, 60, 40, 2);
    $(shap).data("nodeID", node._UID);
    $(shap).data("nodeName", node.name);
    
    var subelems = [];
    var telem = createText(text);
    $(telem).data("_dy",_dy);
    $(telem).data("_dx",0);
    _dy += 30;
    subelems.push(telem);
    
    var color = Raphael.getColor();
    shap.attr({
        fill: color, 
        stroke: color, 
        "fill-opacity": 0.1, 
        "stroke-width": 2, 
        cursor: "move"
    });
    shap.drag(move, dragger, up);
    
    shap.attr("width", telem.getBBox().width + 20);
    shap.attr("height", _dy + 40);
    
    shapes.push(shap);
    subelements.push(subelems);
    movesubelements();    
}

var addOptions = function(node) {
    var subelems = null;
    var shap = null;
    for (var i in shapes) {
        if ($(shapes[i]).data("nodeID") == node._UID) {
            subelems = subelements[i];
            shap = shapes[i];
        }
    }
    var _dy = 30;
    if (node.options !== undefined) {
        for (var o in node.options) {
            var ttelem = createText(o); //node.options[o].player_text);
            var p_title = (node.options[o].name !== undefined? "<b><i><u>" + node.options[o].name + "</u></i></b>" : "") + ": " + node.options[o].player_text;
            var p_content = ich["option-popover-contentWrapper"](node.options[o]);
            var ttcir = r.circle(20,20,5);
            ttcir.attr("x", 200);
            ttcir.attr("stroke", 1);
            ttcir.attr("fill", "#fff");
            $(ttcir).data("_dy", _dy);
            $(ttcir).data("_dx", +20);
            $(ttelem).data("_dy",_dy);
            $(ttelem).data("_dx",-20);
            subelems.push(ttelem);
            subelems.push(ttcir);
            
            $(ttelem.node).popover({
                "title": p_title, 
                content: p_content
            });
            $(ttcir.node).popover({
                "title": p_title, 
                content: p_content
            });
            _dy += 25;
            for (var i in shapes) {
                if ($(shapes[i]).data("nodeName") == node.options[o]["goto"]) {
                    if (shapes[i] == shap) {
                        ttcir.attr("fill", "#222");
                    } else {
                        var clr = "#fff";
                        if (node.options[o]["goto"] == "fight") {
                            clr = "#f55";
                        } else if (node.options[o]["goto"] == "done") {
                            clr = "#5f5";
                        }
                        connections.push(r.connection(ttcir, shapes[i], clr));
                    }
                }
            }
        }
    }
    shap.attr("height", _dy + 40);
}

var addLink = function(nid1, nid2) {
    if (nid1 !== undefined && nid2 !== undefined) {    
        var nid1s = [];
        var nid2s = [];
        for (var i in shapes) {
            if ($(shapes[i]).data("nodeID") == nid1) {
                nid1s.push(shapes[i]);
            }
            if ($(shapes[i]).data("nodeName") == nid2) {
                nid2s.push(shapes[i]);
            }
        }
    
        for (var i in nid1s) {
            for (var j in nid2s) {
                connections.push(r.connection(nid1s[i], nid2s[j], "#ddd", "#fff"));
            }
        }
    }
}


function propertiesToString(obj) {
    var str = "";
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop)) {
            str += prop + " = " + obj[prop] + "\n";
        }
    }
    str += "\n";
    for(var prop in obj) {
        if(!obj.hasOwnProperty(prop)) {
            str += prop + " = " + obj[prop] + "\n";
        }
    }
    return str;
}
function dump(obj) {
    alert(propertiesToString(obj));
}

/**
 * Represents a 2d point or vector. Some of its methods rely on a somewhat peculiar
 * definition of "direction". This is represented as an integer. Assuming a
 * coordinate system of x going from left to right and y going down, direction 0
 * means right, direction 1 means diagonally up and right, and so on anticlockwise.
 */
function Point(x, y) {
    this.getX = function() {
        return x;
    };
    this.getY = function() {
        return y;
    };
}
Point.prototype.toString = function() {
    return "Point(" + this.getX() + "," + this.getY() + ")";
};
Point.prototype.offset = function(direction, distance) {
    if (typeof distance == "undefined") {
        distance = 1;
    }
    var x = this.getX();
    var y = this.getY();
    switch (direction % 8) {
    case 0:
        x += distance;
        break;
    case 1:
        x += distance;
        y -= distance;
        break;
    case 2:
        y -= distance;
        break;
    case 3:
        x -= distance;
        y -= distance;
        break;
    case 4:
        x -= distance;
        break;
    case 5:
        x -= distance;
        y += distance;
        break;
    case 6:
        y += distance;
        break;
    case 7:
        x += distance;
        y += distance;
        break;
    }
    return new Point(x, y);
};
Point.prototype.cssPos = function() {
    return {left: this.getX() + "px", top: this.getY() + "px"};
};
/**
 * Treating the point as a vector, this method returns its approximate direction.
 */
Point.prototype.getDirection = function() {
    var x = this.getX();
    var y = this.getY();
    var aspect = Math.abs(x/y);
    if(aspect < 0.5) { // Almost vertical.
        return y < 0 ? 2 : 6;
    } else if(aspect > 2) { // Almost horizontal.
        return x > 0 ? 0 : 4;
    } else if(x < 0) { // Diagonal to the left.
        return y < 0 ? 3 : 5;
    } else { // Diagonal to the right.
        return y > 0 ? 7 : 1;
    }
};
Point.min = function(p1, p2) {
    var x = Math.min(p1.getX(), p2.getX());
    var y = Math.min(p1.getY(), p2.getY());
    return new Point(x, y);
};
Point.relative = function(from, to) {
    var x = to.getX() - from.getX();
    var y = to.getY() - from.getY();
    return new Point(x, y);
};

function Console() {
    var sinker = $("#sinker");
    
    this.writeMessage = function(message, classes) {
        var div = $("<div>" + message + "</div>").addClass("message");
        //if (classes) {
            for(var i in classes) div.addClass(classes[i]);
        //}
        div.hide();
        sinker.append(div);
        div.show(400, "swing");
        // TODO Remove oldest message if there are too many.
    };
}

function Board(halfwidth) {
    var width = 5 + halfwidth * 2;
    var height = 5 + halfwidth * 2;
    var boardStatus = [];
    var moves = [];
    var middle = new Point(halfwidth + 2, halfwidth + 2);
    var pos = middle;
    this.currentPlayer = 1;
    (function(array) {
        var size = width * height;
        for (var i = 0; i < size; i++) {
            array[i] = 0;
        }
    })(boardStatus);
    
    var getIndex = function(point) {
        var x = point.getX();
        var y = point.getY();
        if (x < 0) throw "x is too small (" + x + ")";
        if (y < 0) throw "y is too small (" + y + ")";
        if (x >= width) throw "x is too large (" + x + ")";
        if (y >= height) throw "y is too large (" + y + ")";
        return y * width + x;
    };
    
    this.getWidth = function() {
        return width;
    };
    this.getHeight = function() {
        return height;
    };
    this.getPos = function() {
        return pos;
    };
    this.getMiddle = function() {
        return middle;
    };
    this.getStatus = function(pos) {
        return boardStatus[getIndex(pos)];
    };
    var appendStatus = function(pos, status) {
        var index = getIndex(pos);
        boardStatus[index] = boardStatus[index] | status;
    }
    this.appendLine = function(pos, direction) {
        appendStatus(pos, 1 << (direction % 8));
        appendStatus(pos.offset(direction), 1 << ((direction + 4) % 8));
    };
    this.move = function(direction) {
        var validation = this.validateMove(direction);
        if (validation > 0) {
            this.appendLine(pos, direction);
            pos = pos.offset(direction);
            if (validation == 1) {
                this.currentPlayer = 3 - this.currentPlayer;
            }
        }
        return validation;
    };
}
Board.prototype.hasLine = function(pos, direction) {
    return (this.getStatus(pos) & (1 << direction)) != 0;
};
Board.prototype.hasAnyLine = function(pos) {
    return this.getStatus(pos) != 0;
};
/**
 * Returns 0 for invalid, 1 for valid, 2 for valid + grant another move.
 */
Board.prototype.validateMove = function(direction) {
    direction = direction % 8;
    //alert("validating move from " + this.getPos().toString() + " to " + this.getPos().offset(direction).toString() + " (direction = " + direction + ")");
    if(this.hasLine(this.getPos(), direction)) {
        //alert("There's already a line there.");
        return 0;
    }
    var newPos = this.getPos().offset(direction);
    if(!this.withinBounds(newPos)) {
        //alert("That's out of bounds.");
        return 0;
    }
    // TODO Don't allow diagonal lines outside the cage (possible near the goals).
    return this.hasAnyLine(newPos) ? 2 : 1;
};
Board.prototype.withinBounds = function(point) {
    var y = point.getY();
    var x = point.getX();
    var extraWidth = (Math.abs(y - this.getMiddle().getY()) <= 1) ? 1 : 2;
    //var stuff = {}
    //stuff["x"] = x;
    //stuff["y"] = y;
    //stuff["y < 2 || y >= " + (this.getHeight() - 2)] = y < 2 || y >= this.getHeight() - 2;
    //stuff["x < " + extraWidth + " || x >= " + (this.getWidth() - extraWidth)] = x < extraWidth || x >= this.getWidth() - extraWidth;
    //dump(stuff);
    if(y < 2 || y >= this.getHeight() - 2) return false;
    if(x < extraWidth || x >= this.getWidth() - extraWidth) return false;
    return true;
};

function VisualBoard() {
    var halfwidth = 5;
    var gridSize = 20;
    this.gridSize = gridSize;

    this.console = new Console();
    this.board = new Board(halfwidth);
    this.div = $("#board");
    this.lineDiv = $("#lines");
    this.markerDiv = $("#marker");
    this.pos = this.getPixelPos(this.board.getPos());
    this.markerDiv.css(this.pos.cssPos());
    this.players = {1: {name:"Player1", className:"player1"}, 2: {name:"Player2", className:"player2"}};
    
    this.writeNewTurn();
    this.addCage();
    
    var me = this; // "this" will refer to the event target within the handler.
    this.div.on("click", function(event) {
        var direction = Point.relative(me.pos, me.getPixelPos(event)).getDirection();
        me.move(direction);
        event.preventDefault();
    });
    // TODO Also check for mouse movement and draw a visually distinct "preview" line for current position.
}
VisualBoard.prototype.addCage = function() {
    var max = this.board.getWidth() - 3;
    var gapStart = Math.floor(this.board.getWidth() / 2) - 1;
    var board = this;
    var addLine = function(x, y, direction) {
        var point = new Point(x, y);
        board.lineDiv.append(board.createLine(point, direction));
        board.board.appendLine(point, direction);
    };
    
    for (var i = max - 1; i >= 2; i--) {
        addLine(i, 2, 0);
        addLine(i, max, 0);
        if (i < gapStart || i >= gapStart + 2) {
            addLine(2, i, 6);
            addLine(max, i, 6);
        }
    }
    addLine(2, gapStart, 4);
    addLine(2, gapStart + 2, 4);
    addLine(max, gapStart, 0);
    addLine(max, gapStart + 2, 0);
};
VisualBoard.prototype.move = function(direction) {
    var startingPos = this.board.getPos();
    var validation = this.board.move(direction);
    if (validation > 0) {
        var line = this.createLine(startingPos, direction);
        this.lineDiv.append(line);
        this.pos = this.getPixelPos(this.board.getPos());
        this.markerDiv.css(this.pos.cssPos());
        if(validation == 1) this.writeNewTurn();
    }
    return validation;
};
VisualBoard.prototype.writeNewTurn = function() {
    this.console.writeMessage("It's " + this.currentPlayer().name + "'s turn to move.", [this.currentPlayer().className]);
}
VisualBoard.prototype.currentPlayer = function() {
    return this.players[this.board.currentPlayer];
}
VisualBoard.prototype.createLine = function(pos, direction) {
    var classname;
    direction = direction % 8;
    switch(direction % 4) {
    case 0:
        classname = "horizontal-line";
        break;
    case 1:
        classname = "climbing-line";
        break;
    case 2:
        classname = "vertical-line";
        break;
    case 3:
        classname = "dropping-line";
        break;
    }
    var topLeft = Point.min(pos, pos.offset(direction));
    topLeft = this.getPixelPos(topLeft);

    return $(document.createElement("div"))
        .addClass(classname)
        .css(topLeft.cssPos());
}
VisualBoard.prototype.getPixelPos = function(input) {
    if (input instanceof Point) {
        return new Point(input.getX() * 20, input.getY() * 20);
    } else if (input.pageX && input.pageY) {
        var x = input.pageX - this.div[0].offsetLeft;
        var y = input.pageY - this.div[0].offsetTop;
        return new Point(x, y);
    } else {
        throw "unrecognized input";
    }
}
VisualBoard.prototype.getBoardPos = function(input) {
    if (input instanceof Point) {
        return new Point(Math.round(input.getX() / 20), Math.round(input.getY() / 20));
    } else if (input.pageX && input.pageY) {
        return this.getBoardPos(this.getPixelPos(input));
    } else {
        throw "unrecognized input";
    }
}

$(function() {
    new VisualBoard();
});

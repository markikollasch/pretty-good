/**
 * Pretty Good
 * by Mark Kollasch <markikollasch@gmail.com>
 */

// namespace pg
var pg = pg || {};

// enumeration of valid text unit states
var pg.Status = {
    BLANK: "Blank",
    UNFINISHED: "Unfinished",
    BAD: "Bad",
    PRETTY_GOOD: "Pretty Good",
    GREAT: "Great"
};
if (Object.freeze) { Object.freeze(pg.Status); }

// text unit type definition
// usage: new TextUnit(header, body, status (per pg.Status), tags (any number)
// all arguments are optional
var pg.TextUnit = function() {
    if (arguments.length > 0) { // first argument - head
        this.head = arguments[0];
        if (arguments.length > 1) { // second argument - body
            this.body = arguments[1];
            if (arguments.length > 2) { // third argument - status
                this.status = arguments[2];
                if (arguments.length > 3) { // subsequent arguments - tags
                    this.tags = arguments.slice(3);
                }
                else {
                    this.tags = [];
            }
            else {
                this.status = pg.Status.BLANK;
            }
        else {
            this.body = "";
        }
    } else {
        this.head = "";
    }
};
pg.TextUnit.prototype.addTag = function(tag) {
    if (tags.indexOf(tag) == -1)
        tags.push(tag);
};
pg.TextUnit.prototype.removeTag = function(tag) {
    tags.forEach(function(element, index, array) {
        if (element === tag)
            tags.splice(index, 1);
    });
}
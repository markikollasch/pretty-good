/**
 * Pretty Good
 * by Mark Kollasch <markikollasch@gmail.com>
 */

// namespace pg
var pg = pg || {};

// enumeration of valid text unit states
pg.Status = {
    BLANK: "Blank",
    UNFINISHED: "Unfinished",
    BAD: "Bad",
    PRETTY_GOOD: "Pretty Good",
    GREAT: "Great"
};
if (Object.freeze) { Object.freeze(pg.Status); }

// text unit type definition
pg.TextUnit = function(head, body, status) {
    this.head = head===undefined ? "" : head;
    this.body = body===undefined ? "" : body;
    this.status = status===undefined ? "" : pg.Status.BLANK;
};

pg.TextUnitDisplay = function(unit) {
    this.unit = unit===undefined? new TextUnit() : unit;
    
    this.rootDiv = document.createElement("div");
    this.rootDiv.className = "text-unit";
    
    this.headDiv = document.createElement("div");
    this.headDiv.className = "unit-head";
    this.headDiv.contentEditable = true;
    this.headDiv.innerHTML = this.unit.head;
    
    this.bodyDiv = document.createElement("div");
    this.bodyDiv.className = "unit-body";
    this.bodyDiv.contentEditable = true;
    this.bodyDiv.innerHTML = this.unit.body;
    
    //TODO: create the controls as well
    
    this.rootDiv.appendChild(this.headDiv);
    this.rootDiv.appendChild(this.bodyDiv);
}

pg.AdderDisplay
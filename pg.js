/**
 * Pretty Good
 * by Mark Kollasch <markikollasch@gmail.com>
 */

// namespace pg
var pg = pg || {};

// enumeration of valid text unit states
pg.Status = {
    BLANK: {value: 0, name: "Blank"},
    UNFINISHED: {value: 1, name: "Unfinished"},
    BAD: {value: 2, name: "Bad"},
    OK: {value: 3, name: "Pretty Good"},
    GREAT: {value: 4, name: "Great"}
};
if (Object.freeze) { Object.freeze(pg.Status); }

// text unit type definition
pg.TextUnit = function(head, body, status) {
    this.head = head===undefined ? "" : head;
    this.body = body===undefined ? "" : body;
    this.status = status===undefined ? pg.Status.BLANK : status;
};

// visually represents and manipulates a text unit
pg.TextUnitDisplay = function(u) {
    /*  <table class="text-unit" data-status="Whatever">
     *      <tr class="unit-editor">
     *          <td class="unit-head></td>
     *          <td class="unit-body></td>
     *      </tr>
     *      <tfoot class="unit-controls" colspan="2">
     *          <td class="unit-controls-inner" colspan="2"></td>
     *      </tfoot>
     *  </div>
     */
    var unit = u===undefined? new TextUnit() : u;
    
    this.rootDiv = document.createElement("table");
    this.rootDiv.className = "text-unit";
    this.rootDiv.setAttribute("data-status", unit.status.value);
    
    this.editorDiv = document.createElement("tr");
    this.editorDiv.className = "unit-editor";
    
    // head
    var headDiv = document.createElement("td");
    headDiv.className = "unit-head";
    headDiv.contentEditable = true;
    headDiv.innerHTML = unit.head;
    // synchronize inner data with representation
    headDiv.addEventListener("input", function() {
        unit.head = headDiv.innerHTML; });
    this.headDiv = headDiv;
    
    // body
    var bodyDiv = document.createElement("td");
    bodyDiv.className = "unit-body";
    bodyDiv.contentEditable = true;
    bodyDiv.innerHTML = unit.body;
    // synchronize inner data with representation
    bodyDiv.addEventListener("input", function() {
        unit.body = bodyDiv.innerHTML; });
    this.bodyDiv = bodyDiv;
    
    // controls
    var ctrlDiv = document.createElement("tfoot");
    ctrlDiv.className = "unit-controls";
    var ctrlDivInner = document.createElement("td");
    ctrlDivInner.className = "unit-controls-inner";
    ctrlDivInner.colSpan = "2";
    ctrlDivInner.innerHTML = "CONTROLS PLACEHOLDER";
    ctrlDiv.appendChild(ctrlDivInner);
    
    this.rootDiv.addEventListener("mouseover", function() {
        ctrlDiv.style.visibility = "visible";});
    this.rootDiv.addEventListener("mouseleave", function() {
        ctrlDiv.style.visibility = "collapse";});
    
    this.ctrlDivInner = ctrlDivInner;
    this.ctrlDiv = ctrlDiv;
    
    this.unit = unit;
    this.editorDiv.appendChild(this.headDiv);
    this.editorDiv.appendChild(this.bodyDiv);
    this.rootDiv.appendChild(this.editorDiv);
    this.rootDiv.appendChild(this.ctrlDiv);
}

pg.workspace = document.getElementById("workspace");

for (var i=0; i<10; i++) {
    pg.workspace.appendChild(new pg.TextUnitDisplay(new pg.TextUnit()).rootDiv);
}
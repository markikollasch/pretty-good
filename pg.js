/**
 * Pretty Good
 * by Mark Kollasch <markikollasch@gmail.com>
 */

// namespace pg
var pg = pg || {};

pg.workspace = document.createElement("div");
pg.workspace.id = "workspace";
document.body.appendChild(pg.workspace);

pg.saving = false;
pg.requireSave = function(){
    if (!pg.saving) {
        pg.saving = true;
        // TODO: write to web storage
        pg.saving = false;
    } else { // it did not save - try again later
        window.setTimeout(pg.requireSave, 100);
    }
    
};

// enumeration of valid text unit states
pg.Status = {
    BLANK: {value: 0, name: "Blank"},
    UNFINISHED: {value: 1, name: "Unfinished"},
    BAD: {value: 2, name: "Bad"},
    OK: {value: 3, name: "Pretty Good"},
    GREAT: {value: 4, name: "Great"},
    fromValue: function(v) {
        switch(v) {
            case undefined:
            case 0:
            case "0":
                return pg.Status.BLANK;
                break;
            case 1:
            case "1":
                return pg.Status.UNFINISHED;
                break;
            case 2:
            case "2":
                return pg.Status.BAD;
                break;
            case 3:
            case "3":
                return pg.Status.OK;
                break;
            case 4:
            case "4":
                return pg.Status.GREAT;
                break;
        }
    }
};
if (Object.freeze) { Object.freeze(pg.Status); }

// visually represents and manipulates a text unit
pg.TextUnit = function(t, n, s) {
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
    var text = t===undefined ? "" : t;
    var notes = n===undefined ? "" : n;
    var status = s===undefined ? pg.Status.BLANK : s;
    
    this.rootDiv = document.createElement("table");
    this.rootDiv.className = "text-unit";
    this.setStatus(status);
    //this.rootDiv.setAttribute("data-status", status.value);
    
    this.editorDiv = document.createElement("tr");
    this.editorDiv.className = "unit-editor";
    
    // head
    this.headDiv = document.createElement("td");
    this.headDiv.className = "unit-head";
    this.headDiv.contentEditable = true;
    this.setNotes(notes);
    //headDiv.innerHTML = notes;
    this.headDiv.addEventListener("input", function(e) {
        requireSave(); });
    
    // body
    this.bodyDiv = document.createElement("td");
    this.bodyDiv.className = "unit-body";
    this.bodyDiv.contentEditable = true;
    this.setText(text);
    //bodyDiv.innerHTML = text;
    this.bodyDiv.addEventListener("input", function(e) {
        requireSave(); });
    
    // controls
    var ctrlDiv = document.createElement("tfoot");
    ctrlDiv.className = "unit-controls";
    var ctrlDivInner = document.createElement("td");
    ctrlDivInner.className = "unit-controls-inner";
    ctrlDivInner.colSpan = "2";
    
    var addBtn = document.createElement("button");
    addBtn.innerHTML = "Add new...";
    var addBtn_click = (function(e) { this.addNew(this); }).bind(this);
    addBtn.addEventListener("click", addBtn_click);
    ctrlDivInner.appendChild(addBtn);
    
    var delBtn = document.createElement("button");
    delBtn.innerHTML = "Delete!";
    var delBtn_click = (function(e) { this.deleteCurrent(); }).bind(this);
    delBtn.addEventListener("click", delBtn_click);
    ctrlDivInner.appendChild(delBtn);
    
    ctrlDiv.appendChild(ctrlDivInner);
    
    // show controls only for the unit under the mouse
    this.rootDiv.addEventListener("mouseover", function() {
        ctrlDiv.style.visibility = "visible";});
    this.rootDiv.addEventListener("mouseleave", function() {
        ctrlDiv.style.visibility = "collapse";});
    
    this.editorDiv.appendChild(this.headDiv);
    this.editorDiv.appendChild(this.bodyDiv);
    this.rootDiv.appendChild(this.editorDiv);
    this.rootDiv.appendChild(ctrlDiv);
};
pg.TextUnit.prototype.getText = function() {
    return this.bodyDiv.innerHTML;
};
pg.TextUnit.prototype.getNotes = function() {
    return this.headDiv.innerHTML;
};
pg.TextUnit.prototype.getStatus = function() {
    return pg.Status.fromValue(this.rootDiv.getAttribute("data-status"));
};
pg.TextUnit.prototype.setText = function(t) {
    this.bodyDiv.innerHTML = t===undefined ? "" : t;
    pg.requireSave();
};
pg.TextUnit.prototype.setNotes = function(n) {
    this.headDiv.innerHTML = n===undefined ? "" : n;
    pg.requireSave();
};
pg.TextUnit.prototype.setStatus = function(s) {
    this.rootDiv.setAttribute("data-status", (s===undefined ? pg.Status.BLANK : s.value));
    pg.requireSave();
};
// add a new text unit after the indicated one
pg.TextUnit.prototype.addNew = function(at) {
    if ((at === undefined) || !at.rootDiv.nextSibling) { // the given unit is the last one or no unit is given
        pg.workspace.appendChild((new pg.TextUnit()).rootDiv);
    } else { // this is not the last node
        pg.workspace.insertBefore((new pg.TextUnit()).rootDiv, at.rootDiv.nextSibling);
    }
    pg.requireSave();
}
pg.TextUnit.prototype.deleteCurrent = function() {
    workspace.removeChild(this.rootDiv);
    pg.requireSave();
}

// adds a new text unit in the initial position
// even if none exist
// and returns it, for testing purposes
pg.addFirst = function() {
    var unit = new pg.TextUnit();
    pg.workspace.insertBefore (unit.rootDiv, pg.workspace.firstChild);
    pg.requireSave();
    return unit;
}

//===============================================
// Initialize
// ==============================================
var second = pg.addFirst();
var first = pg.addFirst();
second.setNotes("Second");
first.setNotes("first");
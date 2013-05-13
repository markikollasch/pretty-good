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
};
pg.Status.fromValue = function(v) {
    var s;
    switch(v) {
        case undefined:
        case 0:
        case "0":
            s = pg.Status.BLANK;
            break;
        case 1:
        case "1":
            s = pg.Status.UNFINISHED;
            break;
        case 2:
        case "2":
            s = pg.Status.BAD;
            break;
        case 3:
        case "3":
            s = pg.Status.OK;
            break;
        case 4:
        case "4":
            s = pg.Status.GREAT;
            break;
    }
    return s;
};
if (Object.freeze) { Object.freeze(pg.Status); }

// visually represents and manipulates a text unit
pg.TextUnit = function(t, n, s) {
    /*  <table class="text-unit" data-status="Whatever">
     *      <tr class="unit-editor">
     *          <td class="head-container"><div class="unit-head"></div></td>
     *          <td class="unit-body"></td>
     *          <td class="unit-summary"></td>
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
    // provide access to this abstraction from the DOM
    this.rootDiv.owningUnit = this;
    
    this.editorDiv = document.createElement("tr");
    this.editorDiv.className = "unit-editor";
    
    // head
    var headContainer = document.createElement("td");
    headContainer.className = "head-container";
    this.headDiv = document.createElement("div");
    this.headDiv.className = "unit-head";
    this.headDiv.contentEditable = true;
    headContainer.appendChild(this.headDiv);
    this.setNotes(notes);
    this.headDiv.addEventListener("input", function(e) {
        pg.requireSave(); });
    
    // body
    this.bodyDiv = document.createElement("td");
    this.bodyDiv.className = "unit-body";
    this.bodyDiv.contentEditable = true;
    this.setText(text);
    this.bodyDiv.addEventListener("input", function(e) {
        pg.requireSave(); });
    
    // summary - only visible when not expanded
    this.summaryDiv = document.createElement("td");
    this.summaryDiv.className = "unit-summary";
    this.setExpanded(true);
    
    var expandBtn = document.createElement("button");
    expandBtn.innerHTML = "Expand";
    expandBtn.addEventListener("click", (function(e) { this.setExpanded(true); }).bind(this));
    this.summaryDiv.appendChild(expandBtn);
    
    // controls
    var ctrlDiv = document.createElement("tfoot");
    ctrlDiv.className = "unit-controls";
    var ctrlDivInner = document.createElement("td");
    ctrlDivInner.className = "unit-controls-inner";
    ctrlDivInner.colSpan = "3";
    
    var statusBtns = [];
    for (var i=0; i<5; i++) {
        var statusBtn = document.createElement("button");
        statusBtn.innerHTML = "&nbsp;";
        statusBtn.className = "status-" + i;
        ctrlDivInner.appendChild(statusBtn);
        statusBtns.push(statusBtn);
    }
    statusBtns[0].addEventListener("click", (function(e) { this.setStatus(pg.Status.BLANK); }).bind(this));
    statusBtns[1].addEventListener("click", (function(e) { this.setStatus(pg.Status.UNFINISHED); }).bind(this));
    statusBtns[2].addEventListener("click", (function(e) { this.setStatus(pg.Status.BAD); }).bind(this));
    statusBtns[3].addEventListener("click", (function(e) { this.setStatus(pg.Status.OK); }).bind(this));
    statusBtns[4].addEventListener("click", (function(e) { this.setStatus(pg.Status.GREAT); }).bind(this));
    
    
    var addBtn = document.createElement("button");
    addBtn.innerHTML = "Add new...";
    addBtn.addEventListener("click", (function(e) { this.addNew(this); }).bind(this));
    ctrlDivInner.appendChild(addBtn);
    
    var delBtn = document.createElement("button");
    delBtn.innerHTML = "Delete!";
    delBtn.addEventListener("click", (function(e) { this.deleteCurrent(); }).bind(this));
    ctrlDivInner.appendChild(delBtn);
    
    var collapseBtn = document.createElement("button");
    collapseBtn.innerHTML = "Collapse";
    collapseBtn.addEventListener("click", (function(e) { this.setExpanded(false); }).bind(this));
    ctrlDivInner.appendChild(collapseBtn);
    
    var moveUpBtn = document.createElement("button");
    moveUpBtn.innerHTML = "Move Up";
    moveUpBtn.addEventListener("click", (function(e) {
        // insert this element before its previous sibling (if one exists)
        var prev = this.rootDiv.previousSibling;
        if (!!prev) {
            var swap = pg.workspace.replaceChild(prev, this.rootDiv);
            pg.workspace.insertBefore(swap, prev);
        }
    }).bind(this));
    ctrlDivInner.appendChild(moveUpBtn);
    
    var moveDownBtn = document.createElement("button");
    moveDownBtn.innerHTML = "Move Down";
    moveDownBtn.addEventListener("click", (function(e) {
        // insert this element's next sibling (if one exists) before it
        var next = this.rootDiv.nextSibling;
        if (!!next) {
            var swap = pg.workspace.replaceChild(next, this.rootDiv);
            pg.workspace.insertBefore(swap, next.nextSibling);
        }
    }).bind(this));
    ctrlDivInner.appendChild(moveDownBtn);
    
    ctrlDiv.appendChild(ctrlDivInner);
    
    // show controls only for the unit under the mouse
    this.rootDiv.addEventListener("mouseover", (function() {
        if (this.getExpanded())
            ctrlDiv.style.display = "";
        }).bind(this));
    this.rootDiv.addEventListener("mouseout", function() {
        ctrlDiv.style.display = "none";});
    
    this.editorDiv.appendChild(headContainer);
    this.editorDiv.appendChild(this.bodyDiv);
    this.editorDiv.appendChild(this.summaryDiv);
    this.rootDiv.appendChild(this.editorDiv);
    this.rootDiv.appendChild(ctrlDiv);
};
pg.TextUnit.prototype.getText = function() {
    return this.bodyDiv.innerHTML;
};
pg.TextUnit.prototype.setText = function(t) {
    this.bodyDiv.innerHTML = t===undefined ? "" : t;
    pg.requireSave();
};

pg.TextUnit.prototype.getNotes = function() {
    return this.headDiv.innerHTML;
};
pg.TextUnit.prototype.setNotes = function(n) {
    this.headDiv.innerHTML = n===undefined ? "" : n;
    pg.requireSave();
};

pg.TextUnit.prototype.getStatus = function() {
    return pg.Status.fromValue(this.rootDiv.getAttribute("data-status"));
};
pg.TextUnit.prototype.setStatus = function(s) {
    this.rootDiv.setAttribute("data-status", (s===undefined ? pg.Status.BLANK : s.value));
    pg.requireSave();
};

pg.TextUnit.prototype.getExpanded = function() {
    return (this.rootDiv.getAttribute("data-expanded") == "true");
};
pg.TextUnit.prototype.setExpanded = function(e) {
    this.rootDiv.setAttribute("data-expanded", e ? "true" : "false");
}
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
    pg.workspace.removeChild(this.rootDiv);
    // if there are none left, add a new one
    if (!pg.workspace.firstChild) {
        pg.addFirst();
    }
    pg.requireSave();
};


//===============================================
// Initialize
// ==============================================

// searcher
(function(){
    var searcher = document.getElementById("search");
    var includeNotes = document.getElementById("search-notes");
    includeNotes.checked = true;
    var includeText = document.getElementById("search-text");
    includeText.checked = true;
    
    var execSearch = function(e) {
        if (searcher.value) { // contract all that match, expand all that don't
            var elements = pg.workspace.children;
            for (var i=0; i<elements.length; i++) {
                var unit = elements[i].owningUnit;
                unit.setExpanded(false);
                if (includeNotes.checked) {
                    if (unit.headDiv.innerHTML.indexOf(searcher.value) != -1) {
                        unit.setExpanded(true);
                    }
                }
                if (includeText.checked) {
                    if (unit.bodyDiv.innerHTML.indexOf(searcher.value) != -1) {
                        unit.setExpanded(true);
                    }
                }
            }
        }
        else {
            var elements = pg.workspace.children;
            for (var i=0; i< elements.length; i++) { // just expand them all
                elements[i].owningUnit.setExpanded(true);
            }
        }
    };
    searcher.addEventListener("input", execSearch);
    includeNotes.addEventListener("change", execSearch);
    includeText.addEventListener("change", execSearch);
})();


// adds a new text unit in the initial position
// and returns it, for testing purposes
pg.addFirst = function() {
    var unit = new pg.TextUnit();
    pg.workspace.insertBefore (unit.rootDiv, pg.workspace.firstChild);
    pg.requireSave();
    return unit;
};

// a single blank unit to start with
pg.addFirst();
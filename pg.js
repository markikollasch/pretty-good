/**
 * Pretty Good
 * by Mark Kollasch <markikollasch@gmail.com>
 */

// namespace pg
var pg = pg || {};

pg.workspace = document.createElement("div");
pg.workspace.id = "workspace";
pg.titleElement = document.getElementById("title");
pg.authorElement = document.getElementById("author");
document.body.appendChild(pg.workspace);

pg.saving = false;
pg.saveStatus = document.getElementById("saving");
pg.requireSave = function(){
    if (!pg.saving) {
        pg.saving = true;
        pg.saveStatus.setAttribute("data-saving","true");
        // write to web storage
        //========================
        localStorage.setItem("pg.title", pg.titleElement.innerHTML);
        localStorage.setItem("pg.author", pg.authorElement.innerHTML);
        var elements = pg.workspace.children;
        var objs = [];
        for (var i=0; i<elements.length; i++) {
            if (elements[i] != pg.controls.div) {
                var unit = elements[i].owningUnit;
                objs.push({
                    Text: unit.getText(),
                    Notes: unit.getNotes(),
                    Status: unit.getStatus()
                });
            }
        }
        var asString = JSON.stringify(objs);
        console.log("Saved:" + asString);
        localStorage.setItem("pg.data", asString);
        //========================
        pg.saveStatus.setAttribute("data-saving","false");
        pg.saving = false;
    } else { // it did not save - try again later
        window.setTimeout(pg.requireSave, 100);
    }
};

pg.load = function(){
    var title = localStorage.getItem("pg.title");
    pg.titleElement.innerHTML = title ? title : "Pretty Good v0.1";
    var author = localStorage.getItem("pg.author")
    pg.authorElement.innerHTML = author ? author : "Mark Kollasch";
    
    var rawdata = localStorage.getItem("pg.data");
    if (rawdata != null){
        console.log("Loaded:" + rawdata);
        var pgdata = JSON.parse(rawdata);
        if (pgdata.length > 0) {
            for (var i=0; i<pgdata.length; i++) {
                pg.workspace.appendChild((new pg.TextUnit(pgdata[i].Text, pgdata[i].Notes, pgdata[i].Status)).rootDiv);
            }
        }
        else { // initial boot - 
            pg.addFirst();
        }
    }
    else { // initial boot - 
        pg.addFirst();
    }
};

pg.download = function(){
    alert("This does nothing yet.");
};

pg.addFirst = function() {
    var unit = new pg.TextUnit();
    pg.workspace.insertBefore (unit.rootDiv, pg.workspace.firstChild);
    pg.requireSave();
    return unit;
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

// controls for manipulating a TextUnit
pg.controls = new (function(){
    this.currentUnit = null;
    this.div = document.createElement("div");
    this.div.className = "unit-controls";
    
    // controls
    
    var statusBtns = [];
    for (var i=0; i<5; i++) {
        var statusBtn = document.createElement("button");
        statusBtn.innerHTML = "&nbsp;";
        statusBtn.className = "status-" + i;
        statusBtn.title = pg.Status.fromValue(i).name
        this.div.appendChild(statusBtn);
        statusBtns.push(statusBtn);
    }
    statusBtns[0].addEventListener("click", (function(e) { this.currentUnit.setStatus(pg.Status.BLANK); }).bind(this));
    statusBtns[1].addEventListener("click", (function(e) { this.currentUnit.setStatus(pg.Status.UNFINISHED); }).bind(this));
    statusBtns[2].addEventListener("click", (function(e) { this.currentUnit.setStatus(pg.Status.BAD); }).bind(this));
    statusBtns[3].addEventListener("click", (function(e) { this.currentUnit.setStatus(pg.Status.OK); }).bind(this));
    statusBtns[4].addEventListener("click", (function(e) { this.currentUnit.setStatus(pg.Status.GREAT); }).bind(this));
    
    var addBtn = document.createElement("button");
    addBtn.innerHTML = "Add new...";
    addBtn.addEventListener("click", (function(e) {
        if (!!this.currentUnit) {
            this.currentUnit.addNew(this.currentUnit);
        }
        else {
            this.attachTo(pg.addFirst());
        }
    }).bind(this));
    this.div.appendChild(addBtn);
    
    var delBtn = document.createElement("button");
    delBtn.innerHTML = "Delete!";
    // TODO: make this safer
    delBtn.addEventListener("click", (function(e) {
        if (!!this.currentUnit) {
            this.currentUnit.deleteCurrent();
            // make sure the controls attach properly too
            if (!!this.div.previousSibling) {
                this.currentUnit = this.div.previousSibling.owningUnit;
            }
            else {
                this.currentUnit = null;
            }
        }
    }).bind(this));
    this.div.appendChild(delBtn);
    
    var collapseBtn = document.createElement("button");
    collapseBtn.innerHTML = "Collapse";
    collapseBtn.addEventListener("click", (function(e) { this.currentUnit.setExpanded(false); }).bind(this));
    this.div.appendChild(collapseBtn);
    
    var moveUpBtn = document.createElement("button");
    moveUpBtn.innerHTML = "Move Up";
    moveUpBtn.addEventListener("click", (function(e) {
        // insert this element before its previous sibling (if one exists)
        var prev = this.currentUnit.rootDiv.previousSibling;
        if (!!prev) {
            var swap = pg.workspace.replaceChild(prev, this.currentUnit.rootDiv);
            pg.workspace.insertBefore(swap, prev);
            // make sure the controls attach properly too
            this.currentUnit = this.div.previousSibling.owningUnit;
        }
    }).bind(this));
    this.div.appendChild(moveUpBtn);
    
    var moveDownBtn = document.createElement("button");
    moveDownBtn.innerHTML = "Move Down";
    moveDownBtn.addEventListener("click", (function(e) {
        // insert this element's next sibling (if one exists) before it
        var next = this.currentUnit.rootDiv.nextSibling.nextSibling; // the next sibling is the controls, so we want two
        if (!!next) {
            var swap = pg.workspace.replaceChild(next, this.currentUnit.rootDiv);
            pg.workspace.insertBefore(swap, next.nextSibling);
            // make sure the controls attach properly too
            this.currentUnit = this.div.previousSibling.owningUnit;
        }
    }).bind(this));
    this.div.appendChild(moveDownBtn);
    
    // move the controls to just below the specified unit
    // "null" for beginning of list
    this.attachTo = function(unit) {
        if (!!unit) {
            var before = unit.rootDiv.nextSibling;
            pg.workspace.insertBefore(this.div, before);
            this.currentUnit = unit;
        }
        else {
            pg.workspace.appendChild(this.div);
        }
    };
    
    // remove the controls so the workspace contains only units
    this.remove = function() {
        if (!!this.currentUnit && this.div.parentNode == pg.workspace) {
            pg.workspace.removeChild(this.div);
        }
    };
})();

// visually represents and manipulates a text unit
pg.TextUnit = function(t, n, s) {
    /*  <table class="text-unit" data-status="Whatever">
     *      <tr class="unit-editor">
     *          <td class="head-container"><div class="unit-head"></div></td>
     *          <td class="unit-body"></td>
     *          <td class="unit-summary"></td>
     *      </tr>
     *  </table>
     */
    var text = t===undefined ? "" : t;
    var notes = n===undefined ? "" : n;
    var status = s===undefined ? pg.Status.BLANK : s;
    
    this.rootDiv = document.createElement("table");
    this.rootDiv.className = "text-unit";
    this.alterStatus(status);
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
    this.alterNotes(notes);
    this.headDiv.addEventListener("input", function(e) {
        pg.requireSave(); });
    this.headDiv.addEventListener("focus", (function(e) {
        pg.controls.attachTo(this);
    }).bind(this));
    
    // body
    this.bodyDiv = document.createElement("td");
    this.bodyDiv.className = "unit-body";
    this.bodyDiv.contentEditable = true;
    this.alterText(text);
    this.bodyDiv.addEventListener("input", function(e) {
        pg.requireSave(); });
    this.bodyDiv.addEventListener("focus", (function(e) {
        pg.controls.attachTo(this);
    }).bind(this));
    
    // summary - only visible when not expanded
    this.summaryDiv = document.createElement("td");
    this.summaryDiv.className = "unit-summary";
    this.setExpanded(true);
    
    var expandBtn = document.createElement("button");
    expandBtn.innerHTML = "Expand";
    expandBtn.addEventListener("click", (function(e) { this.setExpanded(true); }).bind(this));
    this.summaryDiv.appendChild(expandBtn);
    
    // show controls only for the unit under the mouse
    this.rootDiv.addEventListener("mouseover", (function() {
        pg.controls.attachTo(this);
    }).bind(this));
    
    this.editorDiv.appendChild(headContainer);
    this.editorDiv.appendChild(this.bodyDiv);
    this.editorDiv.appendChild(this.summaryDiv);
    this.rootDiv.appendChild(this.editorDiv);
};
pg.TextUnit.prototype.getText = function() {
    return this.bodyDiv.innerHTML;
};
pg.TextUnit.prototype.alterText = function(t) {
    this.bodyDiv.innerHTML = t===undefined ? "" : t;
};
pg.TextUnit.prototype.setText = function(t) {
    alterText(t);
    pg.requireSave();
};

pg.TextUnit.prototype.getNotes = function() {
    return this.headDiv.innerHTML;
};
pg.TextUnit.prototype.alterNotes = function(n) {
    this.headDiv.innerHTML = n===undefined ? "" : n;
};
pg.TextUnit.prototype.setNotes = function(n) {
    this.alterNotes(n);
    pg.requireSave();
};

pg.TextUnit.prototype.getStatus = function() {
    return pg.Status.fromValue(this.rootDiv.getAttribute("data-status"));
};
pg.TextUnit.prototype.alterStatus = function(s) {
    this.rootDiv.setAttribute("data-status", (s===undefined ? pg.Status.BLANK : s.value));
};
pg.TextUnit.prototype.setStatus = function(s) {
    alterStatus(s);
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

// TODO: word counter
// make it a link that opens up a breakdown of exactly how many words are in what categories


pg.load();
/**
 * Pretty Good
 * by Mark Kollasch <markikollasch@gmail.com>
 */

// namespace pg
var pg = pg || {};

// versioning schema as of version 0.1.1:
// each version is a larger number than the last one;
// micro versions increase for small features and bugfixes
// minor versions increase when some set of related features is "done";
// major versions not yet defined
pg.version = "0.2.4";

pg.workspace = document.createElement("div");
pg.workspace.id = "workspace";
pg.workspace.setAttribute("data-column-width", "narrow");
pg.titleElement = document.getElementById("title");
pg.authorElement = document.getElementById("author");
document.body.appendChild(pg.workspace);

// returns a string containing all the data on the page
// in JSON format
pg.currentDataToJSON = function() {
    var elements = pg.workspace.children;
    var obj = {
        title: pg.titleElement.innerHTML,
        author: pg.authorElement.innerHTML,
        objs: []
    };
    for (var i=0; i<elements.length; i++) {
        if (elements[i] != pg.controls.div) {
            var unit = elements[i].owningUnit;
            obj.objs.push({
                Text: unit.getText(),
                Notes: unit.getNotes(),
                Status: unit.getStatus()
            });
        }
    }
    return JSON.stringify(obj);
};

// use the given JSON string
// to obliterate all data on the page
// and replace it with the given data
// (assume the given data is valid)
pg.obliterateCurrentDataFromJSON = function(raw){
    var obliterate = false;
    var obj;
    try {
        obj = JSON.parse(raw);
        obliterate = true;
    }
    catch (se) {
        if (window.confirm("Data parse error. Destroy everything?")) {
            obliterate = true;
            obj = {
            title: "Pretty Good v" + pg.version,
            author: "Mark Kollasch",
            objs: []};
        }
    }
    finally {
        if (obliterate) {
            pg.titleElement.innerHTML = obj.title;
            pg.authorElement.innerHTML = obj.author;
            while (pg.workspace.hasChildNodes()) {
                pg.workspace.removeChild(pg.workspace.lastChild);
            }
            // parse all the units
            if (obj.objs.length > 0) {
                for (var i=0; i<obj.objs.length; i++) {
                    pg.workspace.appendChild((new pg.TextUnit(obj.objs[i].Text, obj.objs[i].Notes, obj.objs[i].Status)).rootDiv);
                }
            }
            else { // saved 0 units
                pg.addFirst();
            }
            pg.controls.attachTo(pg.workspace.firstChild.owningUnit);
        }
        pg.updateWordCount();
    }
};

/////file handling
pg.readFile = function(fs) {
    var file = fs[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        pg.obliterateCurrentDataFromJSON(contents);
    };
    reader.readAsText(file);
};

pg.getFile = function(e) {
    document.getElementById("uploader").click();
};

pg.exportFile = function(){
    // build a data URI containing the JSON for all the stuff on the page
    var uri = "data:application/x-download;charset=utf-8," + encodeURIComponent(pg.currentDataToJSON());
    // and download it
    window.location.assign(uri);
};

// Used for editing of things meant only to be a single line
// such as the title and author fields
pg.cleanInput = function(){
    // do not allow insertion of anything but text
    // if there's anything but text in this
    // - which is to say, if it has any element children
    // remove them
    while (!!this.firstElementChild) {
        this.removeChild(title.firstElementChild);
    }
    // save
    pg.requireSave();
};

// strip all tags except <br> and <p> from the specified element
pg.sanitizeField = function(elem){
    // descend the tree, exploding each node
    var newElem = document.createElement("null");
    while (elem.hasChildNodes()) {
        switch (elem.firstChild.nodeName.toLowerCase()) {
            case "#text":
            case "br": // it is already sanitized
                newElem.appendChild(elem.firstChild);
                break;
            case "p": // put a <br> and then sanitize the text within
            case "div":
                newElem.appendChild(document.createElement("br"));
                var ip = elem.firstChild;
                while (ip.hasChildNodes()) {
                    elem.insertBefore(ip.firstChild, ip);
                }
                elem.removeChild(ip);
                break;
            default: // just use its interior content
                var ip = elem.firstChild;
                while (ip.hasChildNodes()) {
                    elem.insertBefore(ip.firstChild, ip);
                }
                elem.removeChild(ip);
                break;
        }
    }
    newElem.normalize();
    // copy them all back to the original node
    while (newElem.hasChildNodes()) {
        elem.appendChild(newElem.firstChild);
    }
};

//// local save/load
pg.saving = false;
pg.saveStatus = document.getElementById("saving");
pg.requireSave = function(){
    if (!pg.saving) {
        pg.saving = true;
        pg.saveStatus.setAttribute("data-saving","true");
        // write to web storage
        //========================
        localStorage.setItem("pg.data", pg.currentDataToJSON());
        //========================
        pg.saveStatus.setAttribute("data-saving","false");
        pg.saving = false;
    } else { // it did not save - try again later
        window.setTimeout(pg.requireSave, 100);
    }
};

pg.load = function(){
    var title = localStorage.getItem("pg.title");
    pg.titleElement.innerHTML = title ? title : "Pretty Good v" + pg.version;
    var author = localStorage.getItem("pg.author")
    pg.authorElement.innerHTML = author ? author : "Mark Kollasch";
    
    var rawdata = localStorage.getItem("pg.data");
    if (rawdata != null){
        pg.obliterateCurrentDataFromJSON(rawdata);
    }
    else { // initial boot - 
        pg.addFirst();
    }
    
    pg.updateWordCount();
};

// export all text (but not notes) to a text file
pg.exportText = function(){
    console.log("exporting");
    var allText = pg.titleElement.innerHTML + "\n" + pg.authorElement.innerHTML + "\n\n";
    var elements = pg.workspace.children;
    for (var i=0; i<elements.length; i++) {
        if (elements[i] != pg.controls.div) {
            var unit = elements[i].owningUnit;
            var text = unit.getText();
            // replace all br and p tags and &nbsp;s
            text = text.replace(/\<br\\?>/gi, "\n").replace(/\<p\\?>/gi, "\n\n").replace(/[&]nbsp[;]/gi," ");
            allText += "\n\n" + text;
        }
    }
    // build a data URI containing the text
    var uri = "data:application/x-download;charset=utf-8," + encodeURIComponent(allText);
    // and download it
    window.location.assign(uri);
};

// destroy everything
pg.purge = function(){
    if (window.confirm("Erase all data?")) {
        
        pg.titleElement.innerHTML = "Pretty Good v" + pg.version;
        pg.authorElement.innerHTML = "Mark Kollasch";
        while (pg.workspace.hasChildNodes()) {
            pg.workspace.removeChild(pg.workspace.lastChild);
        }
        pg.controls.attachTo(pg.addFirst());
    }
    pg.updateWordCount();
    pg.requireSave();
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

// count all the words (defined as everything separated by any amount of whitespace)
// returns { text: #, notes : # }
pg.wordCount = function() {
    var o = { text: 0, notes: 0 };
    
    // splits a string on any amount of whitespace
    // and counts the number of splits
    var count = function(str) {
        // a slightly magical regular expression
        // that strips all the tags and &nbsp;s out of the original
        var fstr = str.replace(/(<([^>]+)>|[&]nbsp[;])/ig," ");
        // a slightly magical regular expression
        // that matches on every sequence of non-whitespace characters
        var arr = fstr.match(/\S+\s*/g);
        return !!arr ? arr.length: 0;
    };
    
    var elements = pg.workspace.children;
    
    for (var i=0; i<elements.length; i++) {
        if (elements[i] != pg.controls.div) {
            var unit = elements[i].owningUnit;
            o.text += count(unit.getText());
            o.notes += count(unit.getNotes());
        }
    }
    return o;
};
pg.updateWordCount = function(){
    var o = pg.wordCount();
    document.getElementById("word-count").innerHTML = o.text.toString() + " (+ " + o.notes.toString() + ")";
};

//=================== UI =============
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
            // attach to the newly added unit
            this.attachTo(this.currentUnit.rootDiv.nextSibling.owningUnit);
        }
        else {
            this.attachTo(pg.addFirst());
        }
    }).bind(this));
    this.div.appendChild(addBtn);
    
    var delBtn = document.createElement("button");
    delBtn.innerHTML = "Delete!";
    this.deleteCurrent = function() {
        if (!!this.currentUnit && window.confirm("This will delete the current unit. Proceed?")) {
            var next = this.currentUnit.rootDiv.nextSibling ? this.currentUnit.rootDiv.nextSibling.owningUnit : this.currentUnit.rootDiv.previousSibling ? this.currentUnit.rootDiv.previousSibling.owningUnit : null;;
            this.currentUnit.deleteCurrent();
            // make sure the controls attach properly too
            this.attachTo(next);
        }
    };
    delBtn.addEventListener("click", (function(e) {
        this.deleteCurrent();
    }).bind(this));
    this.div.appendChild(delBtn);
    
    this.collapseBtn = document.createElement("button");
    this.collapseBtn.innerHTML ="Collapse";
    this.collapseBtn.addEventListener("click", (function(e) {
        this.currentUnit.setExpanded(!this.currentUnit.getExpanded());
        this.collapseBtn.innerHTML = (this.currentUnit.getExpanded()) ? "Collapse" : "Expand";
    }).bind(this));
    this.div.appendChild(this.collapseBtn);
    
    var moveUpBtn = document.createElement("button");
    moveUpBtn.innerHTML = "Move Up";
    moveUpBtn.addEventListener("click", (function(e) {
        // insert this element before its previous sibling (if one exists)
        var prev = this.currentUnit.rootDiv.previousSibling;
        if (!!prev) {
            var swap = pg.workspace.replaceChild(prev, this.currentUnit.rootDiv);
            pg.workspace.insertBefore(swap, prev);
            // make sure the controls attach properly too
        }
    }).bind(this));
    this.div.appendChild(moveUpBtn);
    
    var moveDownBtn = document.createElement("button");
    moveDownBtn.innerHTML = "Move Down";
    moveDownBtn.addEventListener("click", (function(e) {
        // insert this element's next sibling (if one exists) before it
        var next = this.currentUnit.rootDiv.nextSibling;
        if (!!next) {
            var swap = pg.workspace.replaceChild(next, this.currentUnit.rootDiv);
            pg.workspace.insertBefore(swap, next.nextSibling);
        }
    }).bind(this));
    this.div.appendChild(moveDownBtn);
    
    // attach the controls to the given unit
    this.attachTo = function(unit) {
        if (!!this.currentUnit) {
            this.currentUnit.setSelected(false);
        }
        this.currentUnit = unit;
        this.currentUnit.setSelected(true);
        
        this.collapseBtn.innerHTML = (this.currentUnit.getExpanded()) ? "Collapse" : "Expand";
    };
    
    // insert it
    document.getElementById("header").appendChild(this.div);
})();

// visually represents and manipulates a text unit
pg.TextUnit = function(t, n, s) {
    /*  <table class="text-unit" data-status="Whatever" data-selected="false">
     *      <tr class="unit-editor">
     *          <td class="head-container"><div class="unit-head"></div></td>
     *          <td class="body-container"><div class="unit-body"></div></td>
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
    this.setSelected(false);
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
    // Require saving after every change to the content
    this.headDiv.addEventListener("input", (function(e) {
        pg.updateWordCount();
        pg.requireSave();
    }).bind(this));
    this.headDiv.addEventListener("blur", (function(e) {
        pg.sanitizeField(this.headDiv);
        pg.requireSave();
    }).bind(this));
    // Ensure the controls point to the active unit
    this.headDiv.addEventListener("focus", (function(e) {
        pg.controls.attachTo(this);
    }).bind(this));
    // Keyboard shortcuts:
    this.headDiv.addEventListener("keydown", (function(e) {
        /*  Alt+Up: move focus to the notes above, if it exists
            Alt+Down: move focus to the notes below, if it exists
            Alt+Right: expand if collapsed, and move focus to text
            Alt+Left: nothing
            Alt+Enter: insert new unit and move focus to notes below
            Alt+Delete: delete the current unit
            Alt+1 through 5: colorize current
        */
        if (e.altKey) {
            switch(e.keyCode) {
                case 37: // left - collapse (if expanded)
                    this.setExpanded(false);
                    e.preventDefault();
                    break;
                case 38: // up
                    if (this.rootDiv.previousSibling)
                        this.rootDiv.previousSibling.owningUnit.headDiv.focus();
                        e.preventDefault();
                    break;
                case 39: // right
                    this.setExpanded(true);
                    this.bodyDiv.focus();
                    e.preventDefault();
                    break;
                case 40: // down
                    if (this.rootDiv.nextSibling)
                        this.rootDiv.nextSibling.owningUnit.headDiv.focus();
                        e.preventDefault();
                    break;
                case 13: // enter                    
                    var neo = this.addNew(this);
                    neo.headDiv.focus();
                    e.preventDefault(); // don't add a new line break to it
                    break;
                case 46: // delete
                    pg.controls.deleteCurrent();
                    pg.controls.currentUnit.headDiv.focus();
                    e.preventDefault();
                    break;
                case 49: // 1
                    this.setStatus(pg.Status.BLANK);
                    e.preventDefault();
                    break;
                case 50: // 2
                    this.setStatus(pg.Status.UNFINISHED);
                    e.preventDefault();
                    break;
                case 51: // 3
                    this.setStatus(pg.Status.BAD);
                    e.preventDefault();
                    break;
                case 52: // 4
                    this.setStatus(pg.Status.OK);
                    e.preventDefault();
                    break;
                case 53: // 5
                    this.setStatus(pg.Status.GREAT);
                    e.preventDefault();
                    break;
            }
        }
    }).bind(this));
    
    // body
    var bodyContainer = document.createElement("td");
    bodyContainer.className = "body-container";
    this.bodyDiv = document.createElement("div");
    this.bodyDiv.className = "unit-body";
    this.bodyDiv.contentEditable = true;
    bodyContainer.appendChild(this.bodyDiv);
    this.alterText(text);
    // Require saving after every change to the content
    this.bodyDiv.addEventListener("input", (function(e) {
        pg.updateWordCount();
        pg.requireSave();
    }).bind(this));
    this.bodyDiv.addEventListener("blur", (function(e) {
        pg.sanitizeField(this.bodyDiv);
        pg.requireSave();
    }).bind(this));
    // Ensure the controls point to the active unit
    this.bodyDiv.addEventListener("focus", (function(e) {
        pg.controls.attachTo(this);
    }).bind(this));
    // Keyboard shortcuts:
    this.bodyDiv.addEventListener("keydown", (function(e) {
        /*  Alt+Up: move focus to the text above, if it exists
            Alt+Down: move focus to the text below, if it exists
            Alt+Right: nothing
            Alt+Left: move to notes
            Alt+Enter: insert new unit and move focus to text below
            Alt+Delete: delete the current unit
            Alt+1 through 5: colorize current
        */
        if (e.altKey) {
            switch(e.keyCode) {
                case 37: // left
                    this.headDiv.focus();
                    e.preventDefault();
                    break;
                case 38: // up
                    if (this.rootDiv.previousSibling)
                        this.rootDiv.previousSibling.owningUnit.bodyDiv.focus();
                        e.preventDefault();
                    break;
                case 40: // down
                    if (this.rootDiv.nextSibling)
                        this.rootDiv.nextSibling.owningUnit.bodyDiv.focus();
                        e.preventDefault();
                    break;
                case 13: // enter                    
                    var neo = this.addNew(this);
                    neo.bodyDiv.focus();
                    e.preventDefault(); // don't add a new line break to it
                    break;
                case 46: // delete
                    pg.controls.deleteCurrent();
                    pg.controls.currentUnit.bodyDiv.focus();
                    e.preventDefault();
                    break;
                case 49: // 1
                    this.setStatus(pg.Status.BLANK);
                    e.preventDefault();
                    break;
                case 50: // 2
                    this.setStatus(pg.Status.UNFINISHED);
                    e.preventDefault();
                    break;
                case 51: // 3
                    this.setStatus(pg.Status.BAD);
                    e.preventDefault();
                    break;
                case 52: // 4
                    this.setStatus(pg.Status.OK);
                    e.preventDefault();
                    break;
                case 53: // 5
                    this.setStatus(pg.Status.GREAT);
                    e.preventDefault();
                    break;
            }
        }
    }).bind(this));
    
    this.setExpanded(true);
    
    this.editorDiv.appendChild(headContainer);
    this.editorDiv.appendChild(bodyContainer);
    this.rootDiv.appendChild(this.editorDiv);
};
pg.TextUnit.prototype.getText = function() {
    return this.bodyDiv.innerHTML;
};
pg.TextUnit.prototype.alterText = function(t) {
    this.bodyDiv.innerHTML = t===undefined ? "" : t;
};
pg.TextUnit.prototype.setText = function(t) {
    this.alterText(t);
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
    this.alterStatus(s);
    pg.requireSave();
};

pg.TextUnit.prototype.getExpanded = function() {
    return (this.rootDiv.getAttribute("data-expanded") == "true");
};
pg.TextUnit.prototype.setExpanded = function(e) {
    this.rootDiv.setAttribute("data-expanded", e ? "true" : "false");
};

pg.TextUnit.prototype.getSelected = function() {
    return (this.rootDiv.getAttribute("data-selected") == "true");
};
pg.TextUnit.prototype.setSelected = function(s) {
    this.rootDiv.setAttribute("data-selected", s ? "true" : "false");
};

// add a new text unit after the indicated one
pg.TextUnit.prototype.addNew = function(at) {
    var neo = new pg.TextUnit();
    if ((at == null) || !at.rootDiv.nextSibling) { // the given unit is the last one or no unit is given
        pg.workspace.appendChild(neo.rootDiv);
    } else { // this is not the last node
        pg.workspace.insertBefore(neo.rootDiv, at.rootDiv.nextSibling);
    }
    pg.requireSave();
    // return the created unit
    return neo;
}
pg.TextUnit.prototype.deleteCurrent = function() {
    pg.workspace.removeChild(this.rootDiv);
    // if there are none left, add a new one
    if (!pg.workspace.firstChild) {
        pg.addFirst();
    }
    pg.updateWordCount();
    pg.requireSave();
};

// alter column width
pg.columnToggle = function(wide) {
    if (!!wide) { // a value was passed, so use it explicitly
        if (wide == "wide") {
            pg.workspace.setAttribute("data-column-width","wide");
        }
        else if (wide == "narrow") {
            pg.workspace.setAttribute("data-column-width","narrow");
        }
    }
    else { // no value was passed, so toggle
        if (pg.workspace.getAttribute("data-column-width") == "narrow") {
            pg.workspace.setAttribute("data-column-width", "wide");
        }
        else {
            pg.workspace.setAttribute("data-column-width", "narrow");
        }
    }
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

pg.adjustHeight = function(){
    var headerHeight = document.getElementById("header").offsetHeight;
    pg.workspace.style.top = headerHeight + "px";
    pg.workspace.style.maxHeight = ( window.innerHeight - headerHeight ) + "px";
};
(function() {
    pg.adjustHeight();
    window.onresize = function() { pg.adjustHeight(); };
})();

pg.adjustHeight();


pg.load();

var RESERVEDCHARS = ["!", "=", "<", ">", "/", "*", "-", "+", "~"];
var DEBUGGING_ENABLED = false;
var _TEXTBUFFER = [];
var _CONVERSATIONSTATE = 0;

function startConversation() {
    _CONVERSATIONSTATE = 1;
    for (var tp in SCOPE.temporary) {  //Clear temporary scope
        SCOPE.temporary[tp] = 0;
    }
    executeBlock(getBlock("Greeting"));
}

function log(prefix, inLine) {
    if (DEBUGGING_ENABLED) {
        console.log(">" + prefix + ">  " + inLine);
    }
}

function logFunc(inLine) {
    log("LF", inLine);
}

function nullFunc(inLine) {
    log("NULL", inLine);
}

function _pushToObj(inLine) {
    _currentObj.lines.push(inLine);
}

function BLOCK_Greeting(inLine) {
    log("GREETING", inLine);
    _pushToObj(inLine);
}
function BLOCK_GreetingStart(inLine) {
    log("START_GREETING", inLine);
    getNewObj("Greeting");
}

function BLOCK_Node(inLine) {
    log("NODE", inLine);
    _pushToObj(inLine);
}
function BLOCK_NodeStart(inLine) {
    log("START_NODE", inLine);
    getNewObj("Node");
    _currentObj.options = [];
}

function BLOCK_Option(inLine) {
    log("OPTION", inLine);
    _pushToObj(inLine);
}
function BLOCK_OptionStart(inLine) {
    log("START_OPTION", inLine);
    getNewObj("Option");
    getLastNode().options.push(_currentObj);    
}

function BLOCK_Text(inLine) {
    log("TEXT", inLine);
    _pushToObj(inLine);
}
function BLOCK_TextStart(inLine) {
    log("START_TEXT", inLine);
    getNewObj("Text");
}

function endBlock(inLine) {
    _currentFunc = nullFunc;
}

function trimF(inLine) {
    return $.trim(inLine);
}

function getLastNode() {
    for (var i = _objects.length - 1; i >= 0; i--) {
        if (_objects[i].type == "Node") {
            return _objects[i];
        }
    }
    return null;
}

function setCurrentBlock(blockObj) {
    $("*.currentNode").removeClass("currentNode");
    $("*[data-uid=" + blockObj._UID + "]").addClass("currentNode");
}

var _currentFunc = nullFunc;
var _objects = [];
var _currentObj = null;
var _objID = 0;

var SCOPE = {};
function resetValues() {
    SCOPE.global = {};
    SCOPE.temporary = {};
    SCOPE.namespaced = {};
}
resetValues();



function getNewObj(type) {
    _currentObj = {};    
    
    _objID += 1;
    _currentObj._UID = _objID;
    _currentObj.lines = [];
    _currentObj.type = type;
    if (type != "Option") {
        _objects.push(_currentObj);
    }
    return _currentObj;
}

function firstPass(inArray) {
    for (i in inArray) {
        var line = inArray[i];
        line = trimF(line); //Strip whitespace
        line = $.trim(line.substring(0,(line.indexOf("//") == -1?line.length : line.indexOf("//")))); //Strip comments + any potential whitespace (again)
        
        if (line.indexOf("greeting") == 0) {
            BLOCK_GreetingStart(line);
            _currentFunc = BLOCK_Greeting;
        }
        if (line.indexOf("option") == 0) {
            BLOCK_OptionStart(line);
            _currentFunc = BLOCK_Option;
        }
        if (line.indexOf("node") == 0) {
            BLOCK_NodeStart(line);
            _currentFunc = BLOCK_Node;
        }
        if (line.indexOf("text") == 0) {
            BLOCK_TextStart(line);
            _currentFunc = BLOCK_Text;
        }
        
        if (line.indexOf(".") == 0) {
            execCurrentFunc(line);
            _currentFunc = nullFunc;
        }
        
        execCurrentFunc(line);
    }
}

/*
 * Does some checking, then executes the 'current' function....
 */
function execCurrentFunc(line) {
    if (line != "") {
        _currentFunc(line);
    }
}

/**
 * Applies an array of consequences.
 */
function applyConsequences(consequences) {
    if (consequences != undefined) {
        for (var i in consequences) {
            var cons = consequences[i];
            evalConsequence(cons);
        }
    }
}


/**
 * Evaluates a string encased in 'square brackets', such as [foo] or [Credits+100]
 * 
 * According to the docs, this should do the following (in this order, presumably stopping once a valid action is found):
 * 1) find any arithmetic operations, then evaluate numeric parameters on either side and performing the arithmetic. NOTE: see above in numeric flags about arithmetic and order of operations.
 * 2) substitute text items with the named key. If the key is found but conditions are not met, that's treated as a match yielding the empty string, not a failure to match.
 * 3) substitute the value of any numeric flag with that key, or 0 if none.
 */
function evalSquareBracketString(instring) {
    //instring still contains the square brackets
    instring = instring.substr(1,instring.length-2); // not anymore ;)
    var retstring = "";
    
    var spFound = false;
    for (var i = 0; i < instring.length; i++) {
        if (_isReservedChar(instring[i])) {
            spFound = true;
        }
    }
    var getBlockTest = getBlock("Text", instring);
    
    
    //Case 1:
    if (spFound) {
        console.log(" TODO: evalSquareBracketString case 1");
    } else if (getBlockTest != null) {
        retstring = "";
        for (var j in getBlockTest.text) {
            retstring = retstring + getBlockTest.text[j];
            if (j < getBlockTest.text.length-1) {
                retstring = retstring + "\n";
            }
        }
        //Now apply the consequences..
        if (getBlockTest.consequences != undefined) {
            applyConsequences(getBlockTest.consequences);
        }
    } else {
        retstring = getFlagValue(getScope(instring) + instring);
    }
    
    return retstring;
}

function displayText(textArr) {
    //TODO: evaluating TEXT NODE references.
    if (textArr != undefined) {
        for (var i in textArr) {
            var dispString = textArr[i];
            var sqBrackets = textArr[i].match(/\[[^\[\]]*\]/gi); //get all 'square bracket notation' strings
            for (j in sqBrackets) {
                dispString = dispString.replace(sqBrackets[j], evalSquareBracketString(sqBrackets[j]));
            }
            $.each(dispString.split("\n"), function(sa, sb){
                console.log("> "  + sb);
                _TEXTBUFFER.push(sb);
            });
        }
    }
} 

function gotoBlock(gotoID) {
    if (gotoID != undefined) {
        if (gotoID == "fight") {
            console.log(">> End of conversation (BATTLE INITIATED!)");
            _CURRENTOPTIONS = [];
            _CONVERSATIONSTATE = 3;
        } else if (gotoID == "done") {
            console.log(">> End of conversation (no battle)");
            _CURRENTOPTIONS = [];
            _CONVERSATIONSTATE = 2;
        } else {
            //Checking conditions is done in getBlock...
            executeBlock(getBlock("Node", gotoID));
        }
    }
}

//From a set of possible options, check which ones are available to the player (eval their conditions)
function getAvailableOptions(options) {
    var retArr = [];
    for (var o in options) {
        var option = options[o];
        if (evalConditions(option.conditions)) {
            var addO = true;
            if (option.name != undefined) {
                //Check if we already have a option in the array with this option's name
                for (var i in retArr) {
                    if (retArr[i].name == option.name) {
                        addO = false;
                    }
                }
            } 
            if (addO) { //add it (if no conflict)
                retArr.push(option);
            }
        }
    }
    return retArr;
}

function dO(nr) {
    applyConsequences(_CURRENTOPTIONS[nr].consequences);
    displayText(_CURRENTOPTIONS[nr].text);
    gotoBlock(_CURRENTOPTIONS[nr]["goto"]);
}

var _CURRENTOPTIONS;
var _CURRENTOBJECT;

function executeBlock(block) {
    _CURRENTOBJECT = block;
    if (DEBUGGING_ENABLED) {
        console.log("--Executing block--");
        console.log(block);
    }
    if (block.consequences != undefined) {
        applyConsequences(block.consequences);
    }
    if (block.text != undefined) {
        displayText(block.text);
    }
    if (block.options != undefined) {
        _CURRENTOPTIONS = getAvailableOptions(block.options);
        for (var i in _CURRENTOPTIONS) {
            console.log(i + ": " + _CURRENTOPTIONS[i].player_text);
        }
    }
    console.log("-------------------");
    if (block["goto"] != undefined) {
        gotoBlock(block["goto"]); //Should be the last line in this function!
    }
}

/*
 * Parse Greeting objects
 */
function greetingPass() {
    for (o in _objects) {
        var object = _objects[o];
        if (object.type == "Greeting") {
            //Greeting objects have names, consequences AND conditions. All of those are placed in the FIRST line, together with the 'greeting' declaration.   
            _parseNCCs(object, object.lines[0].substring(9));
            object.lines = object.lines.slice(1);
            object["goto"] = object.lines.pop().substring(1);
            object.text = object.lines;
            delete object.lines;            
        }
    }
}

/*
 * Parse Text objects
 */
function textPass() {
    for (o in _objects) {
        var object = _objects[o];
        if (object.type == "Text") {
            //Text objects have names, consequences AND conditions. All of those are placed in the FIRST line, together with the 'text' declaration.   
            _parseNCCs(object, object.lines[0].substring(5));
            object.lines = object.lines.slice(1);
            object["goto"] = object.lines.pop().substring(1);
            object.text = object.lines;
            delete object.lines;    
        }
    }
}

/*
 * Parse Option objects (which are stored inside Node objects!)
 */
function optionPass() {
    for (o1 in _objects) {
        var pobject = _objects[o1];
        if (pobject.type == "Node") {
            for (o in pobject.options) {
                var object = pobject.options[o];
                //Option objects have names, consequences AND conditions. All of those are placed in the FIRST line, together with the 'option' declaration.                
                _parseNCCs(object, object.lines[0].substring(7));
                object.lines = object.lines.slice(1); //remove first line
                object["player_text"] = object.lines[0];
                object.lines = object.lines.slice(1); //remove first line
                object["goto"] = object.lines.pop().substring(1);
                object.text = object.lines;
                delete object.lines;    
            }
        }
    }
}

/*
 * Parse Node objects
 */
function nodePass() {
    for (o in _objects) {
        var object = _objects[o];
        if (object.type == "Node") {
            //Node objects have names, consequences AND conditions. All of those are placed in the FIRST line, together with the 'node' declaration.    
            _parseNCCs(object, object.lines[0].substring(5));
            object.lines = object.lines.slice(1); //remove first line
            //That should be it for Node objects..
            delete object.lines;
        }
    }
}

function _isReservedChar(inchar) {
    return $.inArray(inchar,RESERVEDCHARS) > -1;
}

function _getScopedFlags(instring) {
    var flags = _getFlags(instring);
    var scopedFlags = $.merge([],flags);
    for (var i in scopedFlags) {
        var flag = scopedFlags[i];
        scopedFlags[i] = getScope(flag) + flag;
    }
    return {
        "flags" : flags, 
        "scopedFlags": scopedFlags
    };
}

function evalCondition(unparsedExpression) {
    return eval(_getParsedConditionString(unparsedExpression));
}

function evalConsequence(unparsedExpression) {
    return eval(_getParsedConsequenceString(unparsedExpression));
}

function _getParsedConsequenceString(instring) { //For eval
    var arr = _getParsedConsequence(instring);
    var retStr = "";
    if (arr.length > 1) {
        if (arr[0].value == "~") {
            retStr = arr[1].value + " = (getFlagValue(\"" + arr[1].value + "\") == 0 ? 1 : 0)";
            if (arr.length > 2) {
                console.warn("Warning: some arguments ignored for expression '" + instring + "' --> ~ expressions may only contain a tilde and a flag");
            }
        } else if (arr[0].value == "+") {
            if (arr.length > 3) {
                retStr += arr[1].value + " ";
                for (var i = 2; i < arr.length; i++) {
                    if (arr[i].type == "FLAG") {
                        retStr += "getFlagValue(\"" + arr[i].value + "\") ";
                    } else {
                        retStr += arr[i].value + " ";
                    }
                }
            } else {
                retStr = arr[1].value + " = 1";
            }
        }
        else if (arr[0].value == "-") {
            retStr = arr[1].value + " = 0";
            if (arr.length > 2) {
                console.warn("Warning: some arguments ignored for expression '" + instring + "' --> - expressions may only contain a minus and a flag");
            }
        }
    } else {
        console.warn("Ignored a consequence with less than 2 items ('" + instring + "') --> This shouldn't happen (or have any meaning whatsoever)..");
    }
    return retStr;
}

function _getParsedConditionString(instring) { //For eval
    var arr = _getParsedCondition(instring);
    var retStr = "";
    if (arr.length > 0) {
        if (arr[0].value == "!") {
            retStr += arr.shift().value; //Pop the first element off
        } else if (arr[0].value == "==") {
            arr.shift(); //Ignore the "==" completely
        }
        retStr += "(";
        for (var i in arr) {
            if (arr[i].type == "FLAG") {
                retStr += "getFlagValue(\"" + arr[i].value + "\")";
            } else {
                retStr += arr[i].value + " ";
            }
        }
        retStr += ")";
    }
    return retStr;
}

function getFlagValue(flagStrPtr) {
    var x = flagStrPtr;
    x = x.replace("SCOPE.","");
    var sc = SCOPE;
    var split = x.split(".")
    for (var i in split) {
        if (sc[split[i]] != undefined) {
            sc = sc[split[i]];
        } else {
            sc[split[i]] = 0;
            sc = sc[split[i]];
        }
    }
    return sc;
}

//Not very DRY, but fuck it.
function _getParsedConsequence(instring) {
    var arr = __getParsedExpressionFirstPass(instring);
    for (var i in arr) {
        var a = arr[i];
        if (a.type == "FLAG") {
            a.value = getScope(a.value) + "" + a.value; // Add the 'scope' stuff
        }
    }
    return arr;
}

//Not very DRY (see above), but fuck it.
function _getParsedCondition(instring) {
    var arr = __getParsedExpressionFirstPass(instring);
    for (var i in arr) {
        var a = arr[i];
        if (a.type == "FLAG") {
            a.value = getScope(a.value) + "" + a.value; // Add the 'scope' stuff
        }
        if (a.type == "RESERVED") {
            //For JavaScript eval: replace "=" with "==".
            a.value = a.value.replace("=", "==");
        }
    }
    return arr;
}

function __getParsedExpressionFirstPass(instring) {
    var retArr = [];
    var cObj = {};
    //don't push it
    for (var i in instring) {
        var ic = instring[i];
        if (_isReservedChar(ic)) {
            if (cObj.type === "RESERVED") {
                cObj.value = cObj.value + ic;
            } else {
                cObj = {};
                retArr.push(cObj);
                cObj.type = "RESERVED";
                cObj.value = "" + ic;
            }
        } else if (ic >= "0" && ic <= "9") {
            if (cObj.type === "NUMBER") {
                cObj.value = cObj.value + "" + ic;
            } else {
                cObj = {};
                retArr.push(cObj);
                cObj.type = "NUMBER";
                cObj.value = "" + ic;
            }
        } else {
            if (cObj.type === "FLAG") {
                cObj.value = cObj.value + "" + ic;
            } else {
                cObj = {};
                retArr.push(cObj);
                cObj.type = "FLAG";
                cObj.value = "" + ic;
            }
        }
    }
    return retArr;
}

function _getFlags(instring) {
    var retArr = [];
    retArr.push("");
    for (var i in instring) {
        var ic = instring[i];
        if (_isReservedChar(ic)) {
            if (retArr[retArr.length-1] != "") {
                retArr.push("");
            }
        } else {
            retArr[retArr.length-1] =  retArr[retArr.length-1] + ic;
        }
    }
    for (var i in retArr) {
        if (retArr[i] != "") {
            if (retArr[i][0] >= "0" && retArr[i][0] <= "9") {
                retArr.splice(i,1); //remove numbers or 'flags'  starting with a number (which aren't really flags)
            }
        }
    }
    if (retArr[retArr.length-1] == "") {
        retArr.pop(); //remove empty strings...
    }
    return retArr;
}

function evalConditions(conditions) {
    var proc = true;
    for (var i in conditions) {
        var cond = conditions[i];
        var evalled = evalCondition(cond);
        proc = proc & evalled;
    }
    return proc;
}

function getBlock(blocktype, blockname) {
    for (var oi in _objects) {
        if (_objects[oi].type == blocktype && (blockname == undefined || _objects[oi].name == blockname)) {
            var b = _objects[oi];
            if (evalConditions(b.conditions) == true) {
                return b;
            }
        }
    }
    return null; //couldn't find a greeting
}

/**
*  Parses Name, Conditions and Consequences. Adds them to the object.
*  param object: the Object to store Conditions and Consequences on.
*  param inString: the String to parse (should not start with "greeting", "option" or "text")
*/
function _parseNCCs(object, inString) {
    object["consequences"] = [];
    object["conditions"] = [];
    args = inString.split(" ");
    for (ai in args) {
        var arg = $.trim(args[ai]);
        if (arg != "") {
            if (_isConsequence(arg)) {
                object["consequences"].push(arg);
            } else if (_isCondition(arg)) {
                object["conditions"].push(arg);
            } else if (_isCompound(arg)) {
                var targ = arg.substring(1);
                if (arg[0] == ">") {
                    object["conditions"].push("!" + targ);
                    object["consequences"].push("+" + targ);
                } else if (arg[0] == "<") {
                    object["conditions"].push("=" + targ);
                    object["consequences"].push("-" + targ);
                }
            } else { //must be a name..
                if (object["name"] === undefined) {
                    object["name"] = arg;
                } else {
                    console.warn("WARNING: Multiple 'name' arguments applied for block object! Erroring line is: '" + object.lines[0] + "'.. Additional argument (" + arg + ") ignored!");
                }
            }
        }
    }
}

/**
* Returns true if the inString is a condition; false otherwise
*/
function _isCondition(inString) {
    switch(inString[0]) {
        case "=":
            return true;
        case "!":
            return true;
        default:
            return false;
    }
    return false;
}

/**
* Returns true if the inString is a consequence; false otherwise
*/
function _isConsequence(inString) {
    switch(inString[0]) {
        case "+":
            return true;
        case "-":
            return true;
        case "~":
            return true;
        default:
            return false;
    }
    return false;
}

/**
* Returns true if the inString is a compound operation; false otherwise
*/
function _isCompound(inString) {
    switch(inString[0]) {
        case ">":
            return true;
        case "<":
            return true;
        default:
            return false;
    }
    return false;
}

function uqmParse(input) {
    resetValues();
    
    input = input.replace(/&gt;/g,">").replace(/&lt;/g,"<");
    input = input.split("\n");
    
    firstPass(input);
    //Input isn't needed anymore!
    greetingPass();
    textPass();
    optionPass();
    nodePass();
    
    console.log("Parsing complete. The following objects have been read:");
    console.log(_objects);
    console.log(" ----------------- ");
    console.log("To start the conversation, call startConversation() (and optionally resetValues() which also resets namespaced and global scopes)");
    console.log("To select an option, call dO(option_nr)");
    console.log("If you want additional debugging info, set DEBUGGING_ENABLED to TRUE");
    console.log("If you want to inspect the state of the conversation, try looking at _objects, _CURRENTOBJECT, _CURRENTOPTIONS and SCOPE (which contains all stored values!)")
    console.log(" ----------------- ");
}

function getScope(input) {
    if (input.toLowerCase() == input) { 
        return "SCOPE.temporary.";
    } else if (input.toUpperCase() == input) {
        return "SCOPE.global."
    } else {
        return "SCOPE.namespaced.";
    }
}



console.log("Initialized JS-Dialog parser...");
console.log("Version 0.2");
console.log(" Probably contains bugs and may not be 100% according to spec");
console.log("Supports: ");
console.log(" +Parsing conversation input completely");
console.log(" +Rudimentary evaluation support (order of operations may not be according to spec)");
console.log(" +Playing conversations in the JavaScript console");
console.log("Doesn't support:");
console.log(" -Proper order of operations");
console.log(" -Arithmetics in block text items (like [Foo+bar-baz])");
console.log("##################################################################################");
console.log(" ");
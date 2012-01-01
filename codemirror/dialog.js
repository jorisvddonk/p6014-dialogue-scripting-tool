CodeMirror.defineMode("dialogue-p6014", function() {
    return {
        token: function(stream, state) {
            var sol = stream.sol();
            var eol = stream.eol();

            state.afterSection = false;

            if (sol) {
                state.isheader = false;
                state.position = "";
                if (state.playertext > 0) {
                    state.playertext -= 1;
                }
            }

            if (sol) {
                while(stream.eatSpace());
            }

	  
            if (sol && stream.match("node", false, true)) {
                state.position = "keyword";
                state.blockposition = "node";
                stream.eatWhile(/\S/);
                state.isheader = true;
                return "keyword";
            }
            if (sol && stream.match("option", false, true)) {
                state.position = "keyword";
                state.blockposition = "option";
                stream.eatWhile(/\S/);
                state.isheader = true;
                state.playertext = 2;   
                return "keyword";
            }

            if (sol && stream.match("greeting", false, true)) {
                state.position = "keyword";
                state.blockposition = "greeting";
                stream.eatWhile(/\S/);
                state.isheader = true;
                return "keyword";
            }
            
            if (sol && stream.match("text", false, true)) {
                state.position = "keyword";
                state.blockposition = "text";
                stream.eatWhile(/\S/);
                state.isheader = true;
                return "keyword";
            }
                
            var ch = stream.next();
	  
            if (ch === "/" && stream.peek() === "/") {
                state.position = "comment";
                if (state.playertext == 1 && sol) {
                    state.playertext = 2;
                }
                stream.skipToEnd();
            }
	  
            if (ch === "." && sol) {
                state.position = "endblock";
                stream.eatWhile(/\S/);
            }
	  
            if (state.isheader) {
                if (ch === "=" || ch === "!") {
                    state.position = "condition";
                    stream.eatWhile(/\S/);
                } else if (ch === ">" || ch === "<") {
                    state.position = "compound";
                    stream.eatWhile(/\S/);
                } else if (ch === "+" || ch === "-" || ch === "~") {
                    state.position = "consequence";
                    stream.eatWhile(/\S/);
                }
            }
	  
            if (!state.isheader && state.blockposition != "") {
                if (ch === "[") {
                    state.position = "reference";
                }
                if (ch === "]") {
                    state.position = "reference";                    
                    state.endreference = true;
                }
            }
	  
	  
	  
            if (eol && state.isheader) {
                state.isheader = false;
            }
	  
            var ret = state.position + (state.blockposition != "" ? " block-" + state.blockposition : "") + (state.isheader ? " header" : " body") + (state.playertext == 1? " playertext" : "");
            if (state.position == "endblock") {
                state.blockposition = "";
            }
            if (state.endreference) {
                state.endreference = false;
                state.position = "";
            }
            return ret;
        },

        startState: function() {
            return {
                position : "",
                blockposition : "",
                isheader: false,
                playertext: 0
            };
        }

    };
});

CodeMirror.defineMIME("text/x-properties", "properties");
CodeMirror.defineMIME("text/x-ini", "properties");

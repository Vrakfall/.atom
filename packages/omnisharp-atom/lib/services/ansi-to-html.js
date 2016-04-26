"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Convert = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var entities = require("entities");
var STYLES = {
    "ef0": "color:#000",
    "ef1": "color:#A00",
    "ef2": "color:#0A0",
    "ef3": "color:#A50",
    "ef4": "color:#00A",
    "ef5": "color:#A0A",
    "ef6": "color:#0AA",
    "ef7": "color:#AAA",
    "ef8": "color:#555",
    "ef9": "color:#F55",
    "ef10": "color:#5F5",
    "ef11": "color:#FF5",
    "ef12": "color:#55F",
    "ef13": "color:#F5F",
    "ef14": "color:#5FF",
    "ef15": "color:#FFF",
    "eb0": "background-color:#000",
    "eb1": "background-color:#A00",
    "eb2": "background-color:#0A0",
    "eb3": "background-color:#A50",
    "eb4": "background-color:#00A",
    "eb5": "background-color:#A0A",
    "eb6": "background-color:#0AA",
    "eb7": "background-color:#AAA",
    "eb8": "background-color:#555",
    "eb9": "background-color:#F55",
    "eb10": "background-color:#5F5",
    "eb11": "background-color:#FF5",
    "eb12": "background-color:#55F",
    "eb13": "background-color:#F5F",
    "eb14": "background-color:#5FF",
    "eb15": "background-color:#FFF"
};
var toHexString = function toHexString(num) {
    num = num.toString(16);
    while (num.length < 2) {
        num = "0" + num;
    }
    return num;
};
[0, 1, 2, 3, 4, 5].forEach(function (red) {
    return [0, 1, 2, 3, 4, 5].forEach(function (green) {
        return [0, 1, 2, 3, 4, 5].forEach(function (blue) {
            var c = 16 + red * 36 + green * 6 + blue;
            var r = red > 0 ? red * 40 + 55 : 0;
            var g = green > 0 ? green * 40 + 55 : 0;
            var b = blue > 0 ? blue * 40 + 55 : 0;
            var rgb = function () {
                var ref = [r, g, b];
                var results = [];
                for (var j = 0, len = ref.length; j < len; j++) {
                    var n = ref[j];
                    results.push(toHexString(n));
                }
                return results;
            }().join("");
            STYLES["ef" + c] = "color:#" + rgb;
            return STYLES["eb" + c] = "background-color:#" + rgb;
        });
    });
});
(function () {
    var results = [];
    for (var j = 0; j <= 23; j++) {
        results.push(j);
    }
    return results;
}).apply(undefined).forEach(function (gray) {
    var c = gray + 232;
    var l = toHexString(gray * 10 + 8);
    STYLES["ef" + c] = "color:#" + l + l + l;
    return STYLES["eb" + c] = "background-color:#" + l + l + l;
});
var defaults = {
    fg: "#FFF",
    bg: "#000",
    newline: false,
    escapeXML: false,
    stream: false
};

var Convert = exports.Convert = function () {
    function Convert(options) {
        _classCallCheck(this, Convert);

        this.input = [];
        this.stack = [];
        this.stickyStack = [];
        if (options == null) {
            options = {};
        }
        this.opts = (0, _lodash.extend)({}, defaults, options);
    }

    _createClass(Convert, [{
        key: "toHtml",
        value: function toHtml(input) {
            var _this = this;

            this.input = typeof input === "string" ? [input] : input;
            var buf = [];
            this.stickyStack.forEach(function (element) {
                return _this.generateOutput(element.token, element.data, function (chunk) {
                    return buf.push(chunk);
                });
            });
            this.forEach(function (chunk) {
                return buf.push(chunk);
            });
            this.input = [];
            return buf.join("");
        }
    }, {
        key: "forEach",
        value: function forEach(callback) {
            var _this2 = this;

            var buf = "";
            this.input.forEach(function (chunk) {
                buf += chunk;
                return _this2.tokenize(buf, function (token, data) {
                    _this2.generateOutput(token, data, callback);
                    if (_this2.opts.stream) {
                        return _this2.updateStickyStack(token, data);
                    }
                });
            });
            if (this.stack.length) {
                return callback(this.resetStyles());
            }
        }
    }, {
        key: "generateOutput",
        value: function generateOutput(token, data, callback) {
            switch (token) {
                case "text":
                    return callback(this.pushText(data));
                case "display":
                    return this.handleDisplay(data, callback);
                case "xterm256":
                    return callback(this.pushStyle("ef" + data));
            }
        }
    }, {
        key: "updateStickyStack",
        value: function updateStickyStack(token, data) {
            var notCategory = function notCategory(category) {
                return function (e) {
                    return (category === null || e.category !== category) && category !== "all";
                };
            };
            if (token !== "text") {
                this.stickyStack = this.stickyStack.filter(notCategory(this.categoryForCode(data)));
                return this.stickyStack.push({
                    token: token,
                    data: data,
                    category: this.categoryForCode(data)
                });
            }
        }
    }, {
        key: "handleDisplay",
        value: function handleDisplay(code, callback) {
            code = parseInt(code, 10);
            if (code === -1) {
                callback("<br/>");
            }
            if (code === 0) {
                if (this.stack.length) {
                    callback(this.resetStyles());
                }
            }
            if (code === 1) {
                callback(this.pushTag("b"));
            }
            if (2 < code && code < 5) {
                callback(this.pushTag("u"));
            }
            if (4 < code && code < 7) {
                callback(this.pushTag("blink"));
            }
            if (code === 8) {
                callback(this.pushStyle("display:none"));
            }
            if (code === 9) {
                callback(this.pushTag("strike"));
            }
            if (code === 24) {
                callback(this.closeTag("u"));
            }
            if (29 < code && code < 38) {
                callback(this.pushStyle("ef" + (code - 30)));
            }
            if (code === 39) {
                callback(this.pushStyle("color:" + this.opts.fg));
            }
            if (39 < code && code < 48) {
                callback(this.pushStyle("eb" + (code - 40)));
            }
            if (code === 49) {
                callback(this.pushStyle("background-color:" + this.opts.bg));
            }
            if (89 < code && code < 98) {
                callback(this.pushStyle("ef" + (8 + (code - 90))));
            }
            if (99 < code && code < 108) {
                return callback(this.pushStyle("eb" + (8 + (code - 100))));
            }
        }
    }, {
        key: "categoryForCode",
        value: function categoryForCode(code) {
            code = parseInt(code, 10);
            if (code === 0) {
                return "all";
            } else if (code === 1) {
                return "bold";
            } else if (2 < code && code < 5) {
                return "underline";
            } else if (4 < code && code < 7) {
                return "blink";
            } else if (code === 8) {
                return "hide";
            } else if (code === 9) {
                return "strike";
            } else if (29 < code && code < 38 || code === 39 || 89 < code && code < 98) {
                return "foreground-color";
            } else if (39 < code && code < 48 || code === 49 || 99 < code && code < 108) {
                return "background-color";
            } else {
                return null;
            }
        }
    }, {
        key: "pushTag",
        value: function pushTag(tag, style) {
            if (style == null) {
                style = "";
            }
            if (style.length && style.indexOf(":") === -1) {
                style = STYLES[style];
            }
            this.stack.push(tag);
            return ["<" + tag, style ? " style=\"" + style + "\"" : void 0, ">"].join("");
        }
    }, {
        key: "pushText",
        value: function pushText(text) {
            if (this.opts.escapeXML) {
                return entities.encodeXML(text);
            } else {
                return text;
            }
        }
    }, {
        key: "pushStyle",
        value: function pushStyle(style) {
            return this.pushTag("span", style);
        }
    }, {
        key: "closeTag",
        value: function closeTag(style) {
            var last = void 0;
            if (this.stack.slice(-1)[0] === style) {
                last = this.stack.pop();
            }
            if (last != null) {
                return "</" + style + ">";
            }
        }
    }, {
        key: "resetStyles",
        value: function resetStyles() {
            var ref = [this.stack, []],
                stack = ref[0];
            this.stack = ref[1];
            return stack.reverse().map(function (tag) {
                return "</" + tag + ">";
            }).join("");
        }
    }, {
        key: "tokenize",
        value: function tokenize(text, callback) {
            var _this3 = this;

            var ansiMatch = false;
            var ansiHandler = 3;
            var remove = function remove(m) {
                return "";
            };
            var removeXterm256 = function removeXterm256(m, g1) {
                callback("xterm256", g1);
                return "";
            };
            var newline = function newline(m) {
                if (_this3.opts.newline) {
                    callback("display", -1);
                } else {
                    callback("text", m);
                }
                return "";
            };
            var ansiMess = function ansiMess(m, g1) {
                ansiMatch = true;
                var code = void 0;
                if (g1.trim().length === 0) {
                    g1 = "0";
                }
                g1 = g1.trimRight(";").split(";");
                for (var o = 0, len = g1.length; o < len; o++) {
                    code = g1[o];
                    callback("display", code);
                }
                return "";
            };
            var realText = function realText(m) {
                callback("text", m);
                return "";
            };
            var tokens = [{
                pattern: /^\x08+/,
                sub: remove
            }, {
                pattern: /^\x1b\[[012]?K/,
                sub: remove
            }, {
                pattern: /^\x1b\[38;5;(\d+)m/,
                sub: removeXterm256
            }, {
                pattern: /^\n+/,
                sub: newline
            }, {
                pattern: /^\x1b\[((?:\d{1,3};?)+|)m/,
                sub: ansiMess
            }, {
                pattern: /^\x1b\[?[\d;]{0,3}/,
                sub: remove
            }, {
                pattern: /^([^\x1b\x08\n]+)/,
                sub: realText
            }];
            var process = function process(handler, i) {
                if (i > ansiHandler && ansiMatch) {
                    return;
                } else {
                    ansiMatch = false;
                }
                text = text.replace(handler.pattern, handler.sub);
            };
            var results1 = [];
            while ((length = text.length) > 0) {
                for (var i = 0, o = 0, len = tokens.length; o < len; i = ++o) {
                    var handler = tokens[i];
                    process(handler, i);
                }
                if (text.length === length) {
                    break;
                } else {
                    results1.push(void 0);
                }
            }
            return results1;
        }
    }]);

    return Convert;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9hbnNpLXRvLWh0bWwuanMiLCJsaWIvc2VydmljZXMvYW5zaS10by1odG1sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FDQ0EsSUFBTSxXQUFXLFFBQVEsVUFBUixDQUFqQjtBQUVBLElBQU0sU0FBUztBQUNYLFdBQU8sWUFESTtBQUVYLFdBQU8sWUFGSTtBQUdYLFdBQU8sWUFISTtBQUlYLFdBQU8sWUFKSTtBQUtYLFdBQU8sWUFMSTtBQU1YLFdBQU8sWUFOSTtBQU9YLFdBQU8sWUFQSTtBQVFYLFdBQU8sWUFSSTtBQVNYLFdBQU8sWUFUSTtBQVVYLFdBQU8sWUFWSTtBQVdYLFlBQVEsWUFYRztBQVlYLFlBQVEsWUFaRztBQWFYLFlBQVEsWUFiRztBQWNYLFlBQVEsWUFkRztBQWVYLFlBQVEsWUFmRztBQWdCWCxZQUFRLFlBaEJHO0FBaUJYLFdBQU8sdUJBakJJO0FBa0JYLFdBQU8sdUJBbEJJO0FBbUJYLFdBQU8sdUJBbkJJO0FBb0JYLFdBQU8sdUJBcEJJO0FBcUJYLFdBQU8sdUJBckJJO0FBc0JYLFdBQU8sdUJBdEJJO0FBdUJYLFdBQU8sdUJBdkJJO0FBd0JYLFdBQU8sdUJBeEJJO0FBeUJYLFdBQU8sdUJBekJJO0FBMEJYLFdBQU8sdUJBMUJJO0FBMkJYLFlBQVEsdUJBM0JHO0FBNEJYLFlBQVEsdUJBNUJHO0FBNkJYLFlBQVEsdUJBN0JHO0FBOEJYLFlBQVEsdUJBOUJHO0FBK0JYLFlBQVEsdUJBL0JHO0FBZ0NYLFlBQVE7QUFoQ0csQ0FBZjtBQW1DQSxJQUFNLGNBQWMsU0FBZCxXQUFjLENBQVMsR0FBVCxFQUFpQjtBQUNqQyxVQUFNLElBQUksUUFBSixDQUFhLEVBQWIsQ0FBTjtBQUNBLFdBQU8sSUFBSSxNQUFKLEdBQWEsQ0FBcEIsRUFBdUI7QUFDbkIsY0FBTSxNQUFNLEdBQVo7QUFDSDtBQUNELFdBQU8sR0FBUDtBQUNILENBTkQ7QUFRQSxDQUFDLENBQUQsRUFBSSxDQUFKLEVB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dG1sLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXh0ZW5kIH0gZnJvbSBcImxvZGFzaFwiO1xuY29uc3QgZW50aXRpZXMgPSByZXF1aXJlKFwiZW50aXRpZXNcIik7XG5jb25zdCBTVFlMRVMgPSB7XG4gICAgXCJlZjBcIjogXCJjb2xvcjojMDAwXCIsXG4gICAgXCJlZjFcIjogXCJjb2xvcjojQTAwXCIsXG4gICAgXCJlZjJcIjogXCJjb2xvcjojMEEwXCIsXG4gICAgXCJlZjNcIjogXCJjb2xvcjojQTUwXCIsXG4gICAgXCJlZjRcIjogXCJjb2xvcjojMDBBXCIsXG4gICAgXCJlZjVcIjogXCJjb2xvcjojQTBBXCIsXG4gICAgXCJlZjZcIjogXCJjb2xvcjojMEFBXCIsXG4gICAgXCJlZjdcIjogXCJjb2xvcjojQUFBXCIsXG4gICAgXCJlZjhcIjogXCJjb2xvcjojNTU1XCIsXG4gICAgXCJlZjlcIjogXCJjb2xvcjojRjU1XCIsXG4gICAgXCJlZjEwXCI6IFwiY29sb3I6IzVGNVwiLFxuICAgIFwiZWYxMVwiOiBcImNvbG9yOiNGRjVcIixcbiAgICBcImVmMTJcIjogXCJjb2xvcjojNTVGXCIsXG4gICAgXCJlZjEzXCI6IFwiY29sb3I6I0Y1RlwiLFxuICAgIFwiZWYxNFwiOiBcImNvbG9yOiM1RkZcIixcbiAgICBcImVmMTVcIjogXCJjb2xvcjojRkZGXCIsXG4gICAgXCJlYjBcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiMwMDBcIixcbiAgICBcImViMVwiOiBcImJhY2tncm91bmQtY29sb3I6I0EwMFwiLFxuICAgIFwiZWIyXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojMEEwXCIsXG4gICAgXCJlYjNcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNBNTBcIixcbiAgICBcImViNFwiOiBcImJhY2tncm91bmQtY29sb3I6IzAwQVwiLFxuICAgIFwiZWI1XCI6IFwiYmFja2dyb3VuZC1jb2xvcjojQTBBXCIsXG4gICAgXCJlYjZcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiMwQUFcIixcbiAgICBcImViN1wiOiBcImJhY2tncm91bmQtY29sb3I6I0FBQVwiLFxuICAgIFwiZWI4XCI6IFwiYmFja2dyb3VuZC1jb2xvcjojNTU1XCIsXG4gICAgXCJlYjlcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNGNTVcIixcbiAgICBcImViMTBcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiM1RjVcIixcbiAgICBcImViMTFcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNGRjVcIixcbiAgICBcImViMTJcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiM1NUZcIixcbiAgICBcImViMTNcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNGNUZcIixcbiAgICBcImViMTRcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiM1RkZcIixcbiAgICBcImViMTVcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNGRkZcIlxufTtcbmNvbnN0IHRvSGV4U3RyaW5nID0gZnVuY3Rpb24gKG51bSkge1xuICAgIG51bSA9IG51bS50b1N0cmluZygxNik7XG4gICAgd2hpbGUgKG51bS5sZW5ndGggPCAyKSB7XG4gICAgICAgIG51bSA9IFwiMFwiICsgbnVtO1xuICAgIH1cbiAgICByZXR1cm4gbnVtO1xufTtcblswLCAxLCAyLCAzLCA0LCA1XS5mb3JFYWNoKGZ1bmN0aW9uIChyZWQpIHtcbiAgICByZXR1cm4gWzAsIDEsIDIsIDMsIDQsIDVdLmZvckVhY2goZnVuY3Rpb24gKGdyZWVuKSB7XG4gICAgICAgIHJldHVybiBbMCwgMSwgMiwgMywgNCwgNV0uZm9yRWFjaChmdW5jdGlvbiAoYmx1ZSkge1xuICAgICAgICAgICAgY29uc3QgYyA9IDE2ICsgKHJlZCAqIDM2KSArIChncmVlbiAqIDYpICsgYmx1ZTtcbiAgICAgICAgICAgIGNvbnN0IHIgPSByZWQgPiAwID8gcmVkICogNDAgKyA1NSA6IDA7XG4gICAgICAgICAgICBjb25zdCBnID0gZ3JlZW4gPiAwID8gZ3JlZW4gKiA0MCArIDU1IDogMDtcbiAgICAgICAgICAgIGNvbnN0IGIgPSBibHVlID4gMCA/IGJsdWUgKiA0MCArIDU1IDogMDtcbiAgICAgICAgICAgIGNvbnN0IHJnYiA9ICgoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlZiA9IFtyLCBnLCBiXTtcbiAgICAgICAgICAgICAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuID0gcmVmW2pdO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2godG9IZXhTdHJpbmcobikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICAgIH0pKCkpLmpvaW4oXCJcIik7XG4gICAgICAgICAgICBTVFlMRVNbXCJlZlwiICsgY10gPSBcImNvbG9yOiNcIiArIHJnYjtcbiAgICAgICAgICAgIHJldHVybiBTVFlMRVNbXCJlYlwiICsgY10gPSBcImJhY2tncm91bmQtY29sb3I6I1wiICsgcmdiO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0pO1xuKGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCByZXN1bHRzID0gW107XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPD0gMjM7IGorKykge1xuICAgICAgICByZXN1bHRzLnB1c2goaik7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xufSkuYXBwbHkodGhpcykuZm9yRWFjaChmdW5jdGlvbiAoZ3JheSkge1xuICAgIGNvbnN0IGMgPSBncmF5ICsgMjMyO1xuICAgIGNvbnN0IGwgPSB0b0hleFN0cmluZyhncmF5ICogMTAgKyA4KTtcbiAgICBTVFlMRVNbXCJlZlwiICsgY10gPSBcImNvbG9yOiNcIiArIGwgKyBsICsgbDtcbiAgICByZXR1cm4gU1RZTEVTW1wiZWJcIiArIGNdID0gXCJiYWNrZ3JvdW5kLWNvbG9yOiNcIiArIGwgKyBsICsgbDtcbn0pO1xuY29uc3QgZGVmYXVsdHMgPSB7XG4gICAgZmc6IFwiI0ZGRlwiLFxuICAgIGJnOiBcIiMwMDBcIixcbiAgICBuZXdsaW5lOiBmYWxzZSxcbiAgICBlc2NhcGVYTUw6IGZhbHNlLFxuICAgIHN0cmVhbTogZmFsc2Vcbn07XG5leHBvcnQgY2xhc3MgQ29udmVydCB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICB0aGlzLmlucHV0ID0gW107XG4gICAgICAgIHRoaXMuc3RhY2sgPSBbXTtcbiAgICAgICAgdGhpcy5zdGlja3lTdGFjayA9IFtdO1xuICAgICAgICBpZiAob3B0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgICAgICBvcHRpb25zID0ge307XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vcHRzID0gZXh0ZW5kKHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG4gICAgfVxuICAgIHRvSHRtbChpbnB1dCkge1xuICAgICAgICB0aGlzLmlucHV0ID0gdHlwZW9mIGlucHV0ID09PSBcInN0cmluZ1wiID8gW2lucHV0XSA6IGlucHV0O1xuICAgICAgICBjb25zdCBidWYgPSBbXTtcbiAgICAgICAgdGhpcy5zdGlja3lTdGFjay5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZW5lcmF0ZU91dHB1dChlbGVtZW50LnRva2VuLCBlbGVtZW50LmRhdGEsIGZ1bmN0aW9uIChjaHVuaykge1xuICAgICAgICAgICAgICAgIHJldHVybiBidWYucHVzaChjaHVuayk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbiAoY2h1bmspIHtcbiAgICAgICAgICAgIHJldHVybiBidWYucHVzaChjaHVuayk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmlucHV0ID0gW107XG4gICAgICAgIHJldHVybiBidWYuam9pbihcIlwiKTtcbiAgICB9XG4gICAgZm9yRWFjaChjYWxsYmFjaykge1xuICAgICAgICBsZXQgYnVmID0gXCJcIjtcbiAgICAgICAgdGhpcy5pbnB1dC5mb3JFYWNoKChjaHVuaykgPT4ge1xuICAgICAgICAgICAgYnVmICs9IGNodW5rO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9rZW5pemUoYnVmLCAodG9rZW4sIGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmdlbmVyYXRlT3V0cHV0KHRva2VuLCBkYXRhLCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5zdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudXBkYXRlU3RpY2t5U3RhY2sodG9rZW4sIGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHRoaXMuc3RhY2subGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodGhpcy5yZXNldFN0eWxlcygpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZW5lcmF0ZU91dHB1dCh0b2tlbiwgZGF0YSwgY2FsbGJhY2spIHtcbiAgICAgICAgc3dpdGNoICh0b2tlbikge1xuICAgICAgICAgICAgY2FzZSBcInRleHRcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodGhpcy5wdXNoVGV4dChkYXRhKSk7XG4gICAgICAgICAgICBjYXNlIFwiZGlzcGxheVwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZURpc3BsYXkoZGF0YSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgY2FzZSBcInh0ZXJtMjU2XCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKFwiZWZcIiArIGRhdGEpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGVTdGlja3lTdGFjayh0b2tlbiwgZGF0YSkge1xuICAgICAgICBjb25zdCBub3RDYXRlZ29yeSA9IGZ1bmN0aW9uIChjYXRlZ29yeSkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChjYXRlZ29yeSA9PT0gbnVsbCB8fCBlLmNhdGVnb3J5ICE9PSBjYXRlZ29yeSkgJiYgY2F0ZWdvcnkgIT09IFwiYWxsXCI7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9O1xuICAgICAgICBpZiAodG9rZW4gIT09IFwidGV4dFwiKSB7XG4gICAgICAgICAgICB0aGlzLnN0aWNreVN0YWNrID0gdGhpcy5zdGlja3lTdGFjay5maWx0ZXIobm90Q2F0ZWdvcnkodGhpcy5jYXRlZ29yeUZvckNvZGUoZGF0YSkpKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN0aWNreVN0YWNrLnB1c2goe1xuICAgICAgICAgICAgICAgIHRva2VuOiB0b2tlbixcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgICAgIGNhdGVnb3J5OiB0aGlzLmNhdGVnb3J5Rm9yQ29kZShkYXRhKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaGFuZGxlRGlzcGxheShjb2RlLCBjYWxsYmFjaykge1xuICAgICAgICBjb2RlID0gcGFyc2VJbnQoY29kZSwgMTApO1xuICAgICAgICBpZiAoY29kZSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFwiPGJyLz5cIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvZGUgPT09IDApIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YWNrLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucmVzZXRTdHlsZXMoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvZGUgPT09IDEpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFRhZyhcImJcIikpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgoMiA8IGNvZGUgJiYgY29kZSA8IDUpKSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hUYWcoXCJ1XCIpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKDQgPCBjb2RlICYmIGNvZGUgPCA3KSkge1xuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoVGFnKFwiYmxpbmtcIikpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2RlID09PSA4KSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hTdHlsZShcImRpc3BsYXk6bm9uZVwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvZGUgPT09IDkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFRhZyhcInN0cmlrZVwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvZGUgPT09IDI0KSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLmNsb3NlVGFnKFwidVwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCgyOSA8IGNvZGUgJiYgY29kZSA8IDM4KSkge1xuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoXCJlZlwiICsgKGNvZGUgLSAzMCkpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29kZSA9PT0gMzkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKFwiY29sb3I6XCIgKyB0aGlzLm9wdHMuZmcpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKDM5IDwgY29kZSAmJiBjb2RlIDwgNDgpKSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hTdHlsZShcImViXCIgKyAoY29kZSAtIDQwKSkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2RlID09PSA0OSkge1xuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoXCJiYWNrZ3JvdW5kLWNvbG9yOlwiICsgdGhpcy5vcHRzLmJnKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCg4OSA8IGNvZGUgJiYgY29kZSA8IDk4KSkge1xuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoXCJlZlwiICsgKDggKyAoY29kZSAtIDkwKSkpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKDk5IDwgY29kZSAmJiBjb2RlIDwgMTA4KSkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKFwiZWJcIiArICg4ICsgKGNvZGUgLSAxMDApKSkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNhdGVnb3J5Rm9yQ29kZShjb2RlKSB7XG4gICAgICAgIGNvZGUgPSBwYXJzZUludChjb2RlLCAxMCk7XG4gICAgICAgIGlmIChjb2RlID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJhbGxcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjb2RlID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJib2xkXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoKDIgPCBjb2RlICYmIGNvZGUgPCA1KSkge1xuICAgICAgICAgICAgcmV0dXJuIFwidW5kZXJsaW5lXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoKDQgPCBjb2RlICYmIGNvZGUgPCA3KSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiYmxpbmtcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjb2RlID09PSA4KSB7XG4gICAgICAgICAgICByZXR1cm4gXCJoaWRlXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoY29kZSA9PT0gOSkge1xuICAgICAgICAgICAgcmV0dXJuIFwic3RyaWtlXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoKDI5IDwgY29kZSAmJiBjb2RlIDwgMzgpIHx8IGNvZGUgPT09IDM5IHx8ICg4OSA8IGNvZGUgJiYgY29kZSA8IDk4KSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiZm9yZWdyb3VuZC1jb2xvclwiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKCgzOSA8IGNvZGUgJiYgY29kZSA8IDQ4KSB8fCBjb2RlID09PSA0OSB8fCAoOTkgPCBjb2RlICYmIGNvZGUgPCAxMDgpKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJiYWNrZ3JvdW5kLWNvbG9yXCI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwdXNoVGFnKHRhZywgc3R5bGUpIHtcbiAgICAgICAgaWYgKHN0eWxlID09IG51bGwpIHtcbiAgICAgICAgICAgIHN0eWxlID0gXCJcIjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3R5bGUubGVuZ3RoICYmIHN0eWxlLmluZGV4T2YoXCI6XCIpID09PSAtMSkge1xuICAgICAgICAgICAgc3R5bGUgPSBTVFlMRVNbc3R5bGVdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RhY2sucHVzaCh0YWcpO1xuICAgICAgICByZXR1cm4gW1wiPFwiICsgdGFnLCAoc3R5bGUgPyBcIiBzdHlsZT1cXFwiXCIgKyBzdHlsZSArIFwiXFxcIlwiIDogdm9pZCAwKSwgXCI+XCJdLmpvaW4oXCJcIik7XG4gICAgfVxuICAgIHB1c2hUZXh0KHRleHQpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0cy5lc2NhcGVYTUwpIHtcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllcy5lbmNvZGVYTUwodGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGV4dDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwdXNoU3R5bGUoc3R5bGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHVzaFRhZyhcInNwYW5cIiwgc3R5bGUpO1xuICAgIH1cbiAgICBjbG9zZVRhZyhzdHlsZSkge1xuICAgICAgICBsZXQgbGFzdDtcbiAgICAgICAgaWYgKHRoaXMuc3RhY2suc2xpY2UoLTEpWzBdID09PSBzdHlsZSkge1xuICAgICAgICAgICAgbGFzdCA9IHRoaXMuc3RhY2sucG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxhc3QgIT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIFwiPC9cIiArIHN0eWxlICsgXCI+XCI7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmVzZXRTdHlsZXMoKSB7XG4gICAgICAgIGNvbnN0IHJlZiA9IFt0aGlzLnN0YWNrLCBbXV0sIHN0YWNrID0gcmVmWzBdO1xuICAgICAgICB0aGlzLnN0YWNrID0gcmVmWzFdO1xuICAgICAgICByZXR1cm4gc3RhY2sucmV2ZXJzZSgpLm1hcChmdW5jdGlvbiAodGFnKSB7XG4gICAgICAgICAgICByZXR1cm4gXCI8L1wiICsgdGFnICsgXCI+XCI7XG4gICAgICAgIH0pLmpvaW4oXCJcIik7XG4gICAgfVxuICAgIHRva2VuaXplKHRleHQsIGNhbGxiYWNrKSB7XG4gICAgICAgIGxldCBhbnNpTWF0Y2ggPSBmYWxzZTtcbiAgICAgICAgY29uc3QgYW5zaUhhbmRsZXIgPSAzO1xuICAgICAgICBjb25zdCByZW1vdmUgPSBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHJlbW92ZVh0ZXJtMjU2ID0gZnVuY3Rpb24gKG0sIGcxKSB7XG4gICAgICAgICAgICBjYWxsYmFjayhcInh0ZXJtMjU2XCIsIGcxKTtcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBuZXdsaW5lID0gKG0pID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdHMubmV3bGluZSkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKFwiZGlzcGxheVwiLCAtMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhcInRleHRcIiwgbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgYW5zaU1lc3MgPSBmdW5jdGlvbiAobSwgZzEpIHtcbiAgICAgICAgICAgIGFuc2lNYXRjaCA9IHRydWU7XG4gICAgICAgICAgICBsZXQgY29kZTtcbiAgICAgICAgICAgIGlmIChnMS50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZzEgPSBcIjBcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGcxID0gZzEudHJpbVJpZ2h0KFwiO1wiKS5zcGxpdChcIjtcIik7XG4gICAgICAgICAgICBmb3IgKGxldCBvID0gMCwgbGVuID0gZzEubGVuZ3RoOyBvIDwgbGVuOyBvKyspIHtcbiAgICAgICAgICAgICAgICBjb2RlID0gZzFbb107XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soXCJkaXNwbGF5XCIsIGNvZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHJlYWxUZXh0ID0gZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFwidGV4dFwiLCBtKTtcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCB0b2tlbnMgPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgwOCsvLFxuICAgICAgICAgICAgICAgIHN1YjogcmVtb3ZlXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgxYlxcW1swMTJdP0svLFxuICAgICAgICAgICAgICAgIHN1YjogcmVtb3ZlXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgxYlxcWzM4OzU7KFxcZCspbS8sXG4gICAgICAgICAgICAgICAgc3ViOiByZW1vdmVYdGVybTI1NlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eXFxuKy8sXG4gICAgICAgICAgICAgICAgc3ViOiBuZXdsaW5lXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgxYlxcWygoPzpcXGR7MSwzfTs/KSt8KW0vLFxuICAgICAgICAgICAgICAgIHN1YjogYW5zaU1lc3NcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiAvXlxceDFiXFxbP1tcXGQ7XXswLDN9LyxcbiAgICAgICAgICAgICAgICBzdWI6IHJlbW92ZVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eKFteXFx4MWJcXHgwOFxcbl0rKS8sXG4gICAgICAgICAgICAgICAgc3ViOiByZWFsVGV4dFxuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuICAgICAgICBjb25zdCBwcm9jZXNzID0gZnVuY3Rpb24gKGhhbmRsZXIsIGkpIHtcbiAgICAgICAgICAgIGlmIChpID4gYW5zaUhhbmRsZXIgJiYgYW5zaU1hdGNoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgYW5zaU1hdGNoID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKGhhbmRsZXIucGF0dGVybiwgaGFuZGxlci5zdWIpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCByZXN1bHRzMSA9IFtdO1xuICAgICAgICB3aGlsZSAoKGxlbmd0aCA9IHRleHQubGVuZ3RoKSA+IDApIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBvID0gMCwgbGVuID0gdG9rZW5zLmxlbmd0aDsgbyA8IGxlbjsgaSA9ICsrbykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSB0b2tlbnNbaV07XG4gICAgICAgICAgICAgICAgcHJvY2VzcyhoYW5kbGVyLCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHRzMS5wdXNoKHZvaWQgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdHMxO1xuICAgIH1cbn1cbiIsImltcG9ydCB7ZXh0ZW5kfSBmcm9tIFwibG9kYXNoXCI7XG5jb25zdCBlbnRpdGllcyA9IHJlcXVpcmUoXCJlbnRpdGllc1wiKTtcblxuY29uc3QgU1RZTEVTID0ge1xuICAgIFwiZWYwXCI6IFwiY29sb3I6IzAwMFwiLFxuICAgIFwiZWYxXCI6IFwiY29sb3I6I0EwMFwiLFxuICAgIFwiZWYyXCI6IFwiY29sb3I6IzBBMFwiLFxuICAgIFwiZWYzXCI6IFwiY29sb3I6I0E1MFwiLFxuICAgIFwiZWY0XCI6IFwiY29sb3I6IzAwQVwiLFxuICAgIFwiZWY1XCI6IFwiY29sb3I6I0EwQVwiLFxuICAgIFwiZWY2XCI6IFwiY29sb3I6IzBBQVwiLFxuICAgIFwiZWY3XCI6IFwiY29sb3I6I0FBQVwiLFxuICAgIFwiZWY4XCI6IFwiY29sb3I6IzU1NVwiLFxuICAgIFwiZWY5XCI6IFwiY29sb3I6I0Y1NVwiLFxuICAgIFwiZWYxMFwiOiBcImNvbG9yOiM1RjVcIixcbiAgICBcImVmMTFcIjogXCJjb2xvcjojRkY1XCIsXG4gICAgXCJlZjEyXCI6IFwiY29sb3I6IzU1RlwiLFxuICAgIFwiZWYxM1wiOiBcImNvbG9yOiNGNUZcIixcbiAgICBcImVmMTRcIjogXCJjb2xvcjojNUZGXCIsXG4gICAgXCJlZjE1XCI6IFwiY29sb3I6I0ZGRlwiLFxuICAgIFwiZWIwXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojMDAwXCIsXG4gICAgXCJlYjFcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNBMDBcIixcbiAgICBcImViMlwiOiBcImJhY2tncm91bmQtY29sb3I6IzBBMFwiLFxuICAgIFwiZWIzXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojQTUwXCIsXG4gICAgXCJlYjRcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiMwMEFcIixcbiAgICBcImViNVwiOiBcImJhY2tncm91bmQtY29sb3I6I0EwQVwiLFxuICAgIFwiZWI2XCI6IFwiYmFja2dyb3VuZC1jb2xvcjojMEFBXCIsXG4gICAgXCJlYjdcIjogXCJiYWNrZ3JvdW5kLWNvbG9yOiNBQUFcIixcbiAgICBcImViOFwiOiBcImJhY2tncm91bmQtY29sb3I6IzU1NVwiLFxuICAgIFwiZWI5XCI6IFwiYmFja2dyb3VuZC1jb2xvcjojRjU1XCIsXG4gICAgXCJlYjEwXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojNUY1XCIsXG4gICAgXCJlYjExXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojRkY1XCIsXG4gICAgXCJlYjEyXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojNTVGXCIsXG4gICAgXCJlYjEzXCI6IFwiYmFja2dyb3VuZC1jb2xvcjojRjVGXCIsXG4gICAgXCJlYjE0XCI6IFwiYmFja2dyb3VuZC1jb2xvcjojNUZGXCIsXG4gICAgXCJlYjE1XCI6IFwiYmFja2dyb3VuZC1jb2xvcjojRkZGXCJcbn07XG5cbmNvbnN0IHRvSGV4U3RyaW5nID0gZnVuY3Rpb24obnVtOiBhbnkpIHtcbiAgICBudW0gPSBudW0udG9TdHJpbmcoMTYpO1xuICAgIHdoaWxlIChudW0ubGVuZ3RoIDwgMikge1xuICAgICAgICBudW0gPSBcIjBcIiArIG51bTtcbiAgICB9XG4gICAgcmV0dXJuIG51bTtcbn07XG5cblswLCAxLCAyLCAzLCA0LCA1XS5mb3JFYWNoKGZ1bmN0aW9uKHJlZCkge1xuICAgIHJldHVybiBbMCwgMSwgMiwgMywgNCwgNV0uZm9yRWFjaChmdW5jdGlvbihncmVlbikge1xuICAgICAgICByZXR1cm4gWzAsIDEsIDIsIDMsIDQsIDVdLmZvckVhY2goZnVuY3Rpb24oYmx1ZSkge1xuICAgICAgICAgICAgY29uc3QgYyA9IDE2ICsgKHJlZCAqIDM2KSArIChncmVlbiAqIDYpICsgYmx1ZTtcbiAgICAgICAgICAgIGNvbnN0IHIgPSByZWQgPiAwID8gcmVkICogNDAgKyA1NSA6IDA7XG4gICAgICAgICAgICBjb25zdCBnID0gZ3JlZW4gPiAwID8gZ3JlZW4gKiA0MCArIDU1IDogMDtcbiAgICAgICAgICAgIGNvbnN0IGIgPSBibHVlID4gMCA/IGJsdWUgKiA0MCArIDU1IDogMDtcbiAgICAgICAgICAgIGNvbnN0IHJnYiA9ICgoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVmID0gW3IsIGcsIGJdO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdHM6IGFueVtdID0gW107XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaiA9IDAsIGxlbiA9IHJlZi5sZW5ndGg7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuID0gcmVmW2pdO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2godG9IZXhTdHJpbmcobikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICAgICAgICAgIH0pKCkpLmpvaW4oXCJcIik7XG4gICAgICAgICAgICBTVFlMRVNbXCJlZlwiICsgY10gPSBcImNvbG9yOiNcIiArIHJnYjtcbiAgICAgICAgICAgIHJldHVybiBTVFlMRVNbXCJlYlwiICsgY10gPSBcImJhY2tncm91bmQtY29sb3I6I1wiICsgcmdiO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0pO1xuXG4oZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgcmVzdWx0czogYW55W10gPSBbXTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8PSAyMzsgaisrKSB7IHJlc3VsdHMucHVzaChqKTsgfVxuICAgIHJldHVybiByZXN1bHRzO1xufSkuYXBwbHkodGhpcykuZm9yRWFjaChmdW5jdGlvbihncmF5OiBhbnkpIHtcbiAgICBjb25zdCBjID0gZ3JheSArIDIzMjtcbiAgICBjb25zdCBsID0gdG9IZXhTdHJpbmcoZ3JheSAqIDEwICsgOCk7XG4gICAgU1RZTEVTW1wiZWZcIiArIGNdID0gXCJjb2xvcjojXCIgKyBsICsgbCArIGw7XG4gICAgcmV0dXJuIFNUWUxFU1tcImViXCIgKyBjXSA9IFwiYmFja2dyb3VuZC1jb2xvcjojXCIgKyBsICsgbCArIGw7XG59KTtcblxuY29uc3QgZGVmYXVsdHMgPSB7XG4gICAgZmc6IFwiI0ZGRlwiLFxuICAgIGJnOiBcIiMwMDBcIixcbiAgICBuZXdsaW5lOiBmYWxzZSxcbiAgICBlc2NhcGVYTUw6IGZhbHNlLFxuICAgIHN0cmVhbTogZmFsc2Vcbn07XG5cbmV4cG9ydCBjbGFzcyBDb252ZXJ0IHtcbiAgICBwcml2YXRlIG9wdHM6IGFueTtcbiAgICBwcml2YXRlIGlucHV0OiBhbnlbXSA9IFtdO1xuICAgIHByaXZhdGUgc3RhY2s6IGFueVtdID0gW107XG4gICAgcHJpdmF0ZSBzdGlja3lTdGFjazogYW55W10gPSBbXTtcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zPzogYW55KSB7XG4gICAgICAgIGlmIChvcHRpb25zID09IG51bGwpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9wdHMgPSBleHRlbmQoe30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdG9IdG1sKGlucHV0OiBhbnkpIHtcbiAgICAgICAgdGhpcy5pbnB1dCA9IHR5cGVvZiBpbnB1dCA9PT0gXCJzdHJpbmdcIiA/IFtpbnB1dF0gOiBpbnB1dDtcbiAgICAgICAgY29uc3QgYnVmOiBhbnlbXSA9IFtdO1xuICAgICAgICB0aGlzLnN0aWNreVN0YWNrLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdlbmVyYXRlT3V0cHV0KGVsZW1lbnQudG9rZW4sIGVsZW1lbnQuZGF0YSwgZnVuY3Rpb24oY2h1bms6IGFueSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBidWYucHVzaChjaHVuayk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbihjaHVuazogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4gYnVmLnB1c2goY2h1bmspO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5pbnB1dCA9IFtdO1xuICAgICAgICByZXR1cm4gYnVmLmpvaW4oXCJcIik7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBmb3JFYWNoKGNhbGxiYWNrOiBhbnkpIHtcbiAgICAgICAgbGV0IGJ1ZiA9IFwiXCI7XG4gICAgICAgIHRoaXMuaW5wdXQuZm9yRWFjaCgoY2h1bmspID0+IHtcbiAgICAgICAgICAgIGJ1ZiArPSBjaHVuaztcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRva2VuaXplKGJ1ZiwgKHRva2VuOiBhbnksIGRhdGE6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZ2VuZXJhdGVPdXRwdXQodG9rZW4sIGRhdGEsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vcHRzLnN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy51cGRhdGVTdGlja3lTdGFjayh0b2tlbiwgZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodGhpcy5zdGFjay5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayh0aGlzLnJlc2V0U3R5bGVzKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZW5lcmF0ZU91dHB1dCh0b2tlbjogYW55LCBkYXRhOiBhbnksIGNhbGxiYWNrOiBhbnkpIHtcbiAgICAgICAgc3dpdGNoICh0b2tlbikge1xuICAgICAgICAgICAgY2FzZSBcInRleHRcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gY2FsbGJhY2sodGhpcy5wdXNoVGV4dChkYXRhKSk7XG4gICAgICAgICAgICBjYXNlIFwiZGlzcGxheVwiOlxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmhhbmRsZURpc3BsYXkoZGF0YSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgY2FzZSBcInh0ZXJtMjU2XCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKFwiZWZcIiArIGRhdGEpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgdXBkYXRlU3RpY2t5U3RhY2sodG9rZW46IGFueSwgZGF0YTogYW55KSB7XG4gICAgICAgIGNvbnN0IG5vdENhdGVnb3J5ID0gZnVuY3Rpb24oY2F0ZWdvcnk6IGFueSkge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGU6IGFueSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoY2F0ZWdvcnkgPT09IG51bGwgfHwgZS5jYXRlZ29yeSAhPT0gY2F0ZWdvcnkpICYmIGNhdGVnb3J5ICE9PSBcImFsbFwiO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHRva2VuICE9PSBcInRleHRcIikge1xuICAgICAgICAgICAgdGhpcy5zdGlja3lTdGFjayA9IHRoaXMuc3RpY2t5U3RhY2suZmlsdGVyKG5vdENhdGVnb3J5KHRoaXMuY2F0ZWdvcnlGb3JDb2RlKGRhdGEpKSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdGlja3lTdGFjay5wdXNoKHtcbiAgICAgICAgICAgICAgICB0b2tlbjogdG9rZW4sXG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgICAgICBjYXRlZ29yeTogdGhpcy5jYXRlZ29yeUZvckNvZGUoZGF0YSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBoYW5kbGVEaXNwbGF5KGNvZGU6IGFueSwgY2FsbGJhY2s6IGFueSkge1xuICAgICAgICBjb2RlID0gcGFyc2VJbnQoY29kZSwgMTApO1xuICAgICAgICBpZiAoY29kZSA9PT0gLTEpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFwiPGJyLz5cIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvZGUgPT09IDApIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YWNrLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucmVzZXRTdHlsZXMoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvZGUgPT09IDEpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFRhZyhcImJcIikpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgoMiA8IGNvZGUgJiYgY29kZSA8IDUpKSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hUYWcoXCJ1XCIpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKDQgPCBjb2RlICYmIGNvZGUgPCA3KSkge1xuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoVGFnKFwiYmxpbmtcIikpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2RlID09PSA4KSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hTdHlsZShcImRpc3BsYXk6bm9uZVwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvZGUgPT09IDkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFRhZyhcInN0cmlrZVwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvZGUgPT09IDI0KSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLmNsb3NlVGFnKFwidVwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCgyOSA8IGNvZGUgJiYgY29kZSA8IDM4KSkge1xuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoXCJlZlwiICsgKGNvZGUgLSAzMCkpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29kZSA9PT0gMzkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKFwiY29sb3I6XCIgKyB0aGlzLm9wdHMuZmcpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKDM5IDwgY29kZSAmJiBjb2RlIDwgNDgpKSB7XG4gICAgICAgICAgICBjYWxsYmFjayh0aGlzLnB1c2hTdHlsZShcImViXCIgKyAoY29kZSAtIDQwKSkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2RlID09PSA0OSkge1xuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoXCJiYWNrZ3JvdW5kLWNvbG9yOlwiICsgdGhpcy5vcHRzLmJnKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCg4OSA8IGNvZGUgJiYgY29kZSA8IDk4KSkge1xuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wdXNoU3R5bGUoXCJlZlwiICsgKDggKyAoY29kZSAtIDkwKSkpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKDk5IDwgY29kZSAmJiBjb2RlIDwgMTA4KSkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHRoaXMucHVzaFN0eWxlKFwiZWJcIiArICg4ICsgKGNvZGUgLSAxMDApKSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjYXRlZ29yeUZvckNvZGUoY29kZTogYW55KSB7XG4gICAgICAgIGNvZGUgPSBwYXJzZUludChjb2RlLCAxMCk7XG4gICAgICAgIGlmIChjb2RlID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJhbGxcIjtcbiAgICAgICAgfSBlbHNlIGlmIChjb2RlID09PSAxKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJib2xkXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoKDIgPCBjb2RlICYmIGNvZGUgPCA1KSkge1xuICAgICAgICAgICAgcmV0dXJuIFwidW5kZXJsaW5lXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoKDQgPCBjb2RlICYmIGNvZGUgPCA3KSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiYmxpbmtcIjtcbiAgICAgICAgfSBlbHNlIGlmIChjb2RlID09PSA4KSB7XG4gICAgICAgICAgICByZXR1cm4gXCJoaWRlXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoY29kZSA9PT0gOSkge1xuICAgICAgICAgICAgcmV0dXJuIFwic3RyaWtlXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoKDI5IDwgY29kZSAmJiBjb2RlIDwgMzgpIHx8IGNvZGUgPT09IDM5IHx8ICg4OSA8IGNvZGUgJiYgY29kZSA8IDk4KSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiZm9yZWdyb3VuZC1jb2xvclwiO1xuICAgICAgICB9IGVsc2UgaWYgKCgzOSA8IGNvZGUgJiYgY29kZSA8IDQ4KSB8fCBjb2RlID09PSA0OSB8fCAoOTkgPCBjb2RlICYmIGNvZGUgPCAxMDgpKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJiYWNrZ3JvdW5kLWNvbG9yXCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgcHVzaFRhZyh0YWc6IGFueSwgc3R5bGU/OiBhbnkpIHtcbiAgICAgICAgaWYgKHN0eWxlID09IG51bGwpIHtcbiAgICAgICAgICAgIHN0eWxlID0gXCJcIjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3R5bGUubGVuZ3RoICYmIHN0eWxlLmluZGV4T2YoXCI6XCIpID09PSAtMSkge1xuICAgICAgICAgICAgc3R5bGUgPSBTVFlMRVNbc3R5bGVdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuc3RhY2sucHVzaCh0YWcpO1xuICAgICAgICByZXR1cm4gW1wiPFwiICsgdGFnLCAoc3R5bGUgPyBcIiBzdHlsZT1cXFwiXCIgKyBzdHlsZSArIFwiXFxcIlwiIDogdm9pZCAwKSwgXCI+XCJdLmpvaW4oXCJcIik7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBwdXNoVGV4dCh0ZXh0OiBhbnkpIHtcbiAgICAgICAgaWYgKHRoaXMub3B0cy5lc2NhcGVYTUwpIHtcbiAgICAgICAgICAgIHJldHVybiBlbnRpdGllcy5lbmNvZGVYTUwodGV4dCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGV4dDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgcHVzaFN0eWxlKHN0eWxlOiBhbnkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucHVzaFRhZyhcInNwYW5cIiwgc3R5bGUpO1xuICAgIH1cblxuICAgIHByaXZhdGUgY2xvc2VUYWcoc3R5bGU6IGFueSkge1xuICAgICAgICBsZXQgbGFzdDogYW55O1xuICAgICAgICBpZiAodGhpcy5zdGFjay5zbGljZSgtMSlbMF0gPT09IHN0eWxlKSB7XG4gICAgICAgICAgICBsYXN0ID0gdGhpcy5zdGFjay5wb3AoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGFzdCAhPSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gXCI8L1wiICsgc3R5bGUgKyBcIj5cIjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgcmVzZXRTdHlsZXMoKSB7XG4gICAgICAgIGNvbnN0IHJlZiA9IFt0aGlzLnN0YWNrLCBbXV0sIHN0YWNrID0gcmVmWzBdO1xuICAgICAgICB0aGlzLnN0YWNrID0gcmVmWzFdO1xuICAgICAgICByZXR1cm4gc3RhY2sucmV2ZXJzZSgpLm1hcChmdW5jdGlvbih0YWcpIHtcbiAgICAgICAgICAgIHJldHVybiBcIjwvXCIgKyB0YWcgKyBcIj5cIjtcbiAgICAgICAgfSkuam9pbihcIlwiKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHRva2VuaXplKHRleHQ6IGFueSwgY2FsbGJhY2s6IGFueSkge1xuICAgICAgICBsZXQgYW5zaU1hdGNoID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IGFuc2lIYW5kbGVyID0gMztcbiAgICAgICAgY29uc3QgcmVtb3ZlID0gZnVuY3Rpb24obTogYW55KSB7XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgcmVtb3ZlWHRlcm0yNTYgPSBmdW5jdGlvbihtOiBhbnksIGcxOiBhbnkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFwieHRlcm0yNTZcIiwgZzEpO1xuICAgICAgICAgICAgcmV0dXJuIFwiXCI7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IG5ld2xpbmUgPSAobTogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5vcHRzLm5ld2xpbmUpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhcImRpc3BsYXlcIiwgLTEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhcInRleHRcIiwgbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgYW5zaU1lc3MgPSBmdW5jdGlvbihtOiBhbnksIGcxOiBhbnkpIHtcbiAgICAgICAgICAgIGFuc2lNYXRjaCA9IHRydWU7XG4gICAgICAgICAgICBsZXQgY29kZTogYW55O1xuICAgICAgICAgICAgaWYgKGcxLnRyaW0oKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBnMSA9IFwiMFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZzEgPSBnMS50cmltUmlnaHQoXCI7XCIpLnNwbGl0KFwiO1wiKTtcbiAgICAgICAgICAgIGZvciAobGV0IG8gPSAwLCBsZW4gPSBnMS5sZW5ndGg7IG8gPCBsZW47IG8rKykge1xuICAgICAgICAgICAgICAgIGNvZGUgPSBnMVtvXTtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhcImRpc3BsYXlcIiwgY29kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgcmVhbFRleHQgPSBmdW5jdGlvbihtOiBhbnkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrKFwidGV4dFwiLCBtKTtcbiAgICAgICAgICAgIHJldHVybiBcIlwiO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCB0b2tlbnMgPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgwOCsvLFxuICAgICAgICAgICAgICAgIHN1YjogcmVtb3ZlXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgxYlxcW1swMTJdP0svLFxuICAgICAgICAgICAgICAgIHN1YjogcmVtb3ZlXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgxYlxcWzM4OzU7KFxcZCspbS8sXG4gICAgICAgICAgICAgICAgc3ViOiByZW1vdmVYdGVybTI1NlxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eXFxuKy8sXG4gICAgICAgICAgICAgICAgc3ViOiBuZXdsaW5lXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgcGF0dGVybjogL15cXHgxYlxcWygoPzpcXGR7MSwzfTs/KSt8KW0vLFxuICAgICAgICAgICAgICAgIHN1YjogYW5zaU1lc3NcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiAvXlxceDFiXFxbP1tcXGQ7XXswLDN9LyxcbiAgICAgICAgICAgICAgICBzdWI6IHJlbW92ZVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHBhdHRlcm46IC9eKFteXFx4MWJcXHgwOFxcbl0rKS8sXG4gICAgICAgICAgICAgICAgc3ViOiByZWFsVGV4dFxuICAgICAgICAgICAgfVxuICAgICAgICBdO1xuICAgICAgICBjb25zdCBwcm9jZXNzID0gZnVuY3Rpb24oaGFuZGxlcjogYW55LCBpOiBhbnkpIHtcbiAgICAgICAgICAgIGlmIChpID4gYW5zaUhhbmRsZXIgJiYgYW5zaU1hdGNoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBhbnNpTWF0Y2ggPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoaGFuZGxlci5wYXR0ZXJuLCBoYW5kbGVyLnN1Yik7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHJlc3VsdHMxOiBhbnlbXSA9IFtdO1xuICAgICAgICB3aGlsZSAoKGxlbmd0aCA9IHRleHQubGVuZ3RoKSA+IDApIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBvID0gMCwgbGVuID0gdG9rZW5zLmxlbmd0aDsgbyA8IGxlbjsgaSA9ICsrbykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSB0b2tlbnNbaV07XG4gICAgICAgICAgICAgICAgcHJvY2VzcyhoYW5kbGVyLCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0ZXh0Lmxlbmd0aCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdHMxLnB1c2godm9pZCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0czE7XG4gICAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

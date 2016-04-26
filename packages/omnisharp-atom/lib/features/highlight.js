"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.enhancedHighlighting = exports.ExcludeClassifications = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.augmentEditor = augmentEditor;
exports.getEnhancedGrammar = getEnhancedGrammar;

var _omni = require("../server/omni");

var _omnisharpTextEditor = require("../server/omnisharp-text-editor");

var _lodash = require("lodash");

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AtomGrammar = require(atom.config.resourcePath + "/node_modules/first-mate/lib/grammar.js");
var DEBOUNCE_TIME = 240;
var fastdom = require("fastdom");
var HIGHLIGHT = "HIGHLIGHT",
    HIGHLIGHT_REQUEST = "HIGHLIGHT_REQUEST";
function getHighlightsFromQuickFixes(path, quickFixes, projectNames) {
    return (0, _lodash.chain)(quickFixes).filter(function (x) {
        return x.FileName === path;
    }).map(function (x) {
        return {
            StartLine: x.Line,
            StartColumn: x.Column,
            EndLine: x.EndLine,
            EndColumn: x.EndColumn,
            Kind: "unused code",
            Projects: projectNames
        };
    }).value();
}
var ExcludeClassifications = exports.ExcludeClassifications = [2, 3, 5, 4, 6];

var Highlight = function () {
    function Highlight() {
        _classCallCheck(this, Highlight);

        this.unusedCodeRows = new UnusedMap();
        this.required = false;
        this.title = "Enhanced Highlighting";
        this.description = "Enables server based highlighting, which includes support for string interpolation, class names and more.";
        this.default = false;
    }

    _createClass(Highlight, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.editors = [];
            this.disposable.add((0, _omnisharpTextEditor.registerContextItem)(HIGHLIGHT_REQUEST, function (context) {
                return new _rxjs.Subject();
            }));
            this.disposable.add((0, _omnisharpTextEditor.registerContextItem)(HIGHLIGHT, function (context, editor) {
                return context.get(HIGHLIGHT_REQUEST).startWith(true).switchMap(function () {
                    return _rxjs.Observable.defer(function () {
                        var projects = context.project.activeFramework.Name === "all" ? [] : [context.project.activeFramework.Name];
                        var linesToFetch = (0, _lodash.uniq)(editor.getGrammar().linesToFetch);
                        if (!linesToFetch || !linesToFetch.length) linesToFetch = [];
                        _this.unusedCodeRows.set(editor.getPath(), []);
                        return _rxjs.Observable.combineLatest(_this.unusedCodeRows.get(editor.getPath()), _omni.Omni.request(editor, function (solution) {
                            return solution.highlight({
                                ProjectNames: projects,
                                Lines: linesToFetch,
                                ExcludeClassifications: ExcludeClassifications
                            });
                        }), function (quickfixes, response) {
                            return {
                                editor: editor,
                                projects: projects,
                                highlights: (response ? response.Highlights : []).concat(getHighlightsFromQuickFixes(editor.getPath(), quickfixes, projects))
                            };
                        }).do(function (_ref) {
                            var highlights = _ref.highlights;

                            if (editor.getGrammar) {
                                editor.getGrammar().setResponses(highlights, projects.length > 0);
                            }
                        }).flatMap(function () {
                            return _rxjs.Observable.race(context.solution.model.observe.codecheck.delay(4000), context.solution.observe.codecheck.filter(function (x) {
                                return x.request.FileName === editor.getPath();
                            }).map(function (x) {
                                return x.response && x.response.QuickFixes || [];
                            })).take(1).do(function (value) {
                                return _this.unusedCodeRows.set(editor.getPath(), (0, _lodash.filter)(value, function (x) {
                                    return x.LogLevel === "Hidden";
                                }));
                            });
                        }).publishReplay(1).refCount();
                    });
                });
            }));
            this.disposable.add(_omni.Omni.eachEditor(function (editor, cd) {
                _this.setupEditor(editor, cd);
                cd.add(editor.omnisharp.project.observe.activeFramework.skip(1).distinctUntilChanged().subscribe(function () {
                    editor.omnisharp.get(HIGHLIGHT_REQUEST).next(true);
                }));
                cd.add(editor.omnisharp.get(HIGHLIGHT).subscribe(function () {
                    editor.displayBuffer.tokenizedBuffer["silentRetokenizeLines"]();
                }));
            }));
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                if (editor.displayBuffer.tokenizedBuffer["silentRetokenizeLines"]) {
                    editor.displayBuffer.tokenizedBuffer["silentRetokenizeLines"]();
                }
            }));
            this.disposable.add(_omni.Omni.listener.codecheck.flatMap(function (x) {
                return x.response && x.response.QuickFixes || [];
            }).filter(function (x) {
                return x.LogLevel === "Hidden";
            }).groupBy(function (x) {
                return x.FileName;
            }, function (x) {
                return x;
            }).flatMap(function (x) {
                return x.toArray();
            }, function (_ref2, result) {
                var key = _ref2.key;
                return { key: key, result: result };
            }).subscribe(function (_ref3) {
                var key = _ref3.key;
                var result = _ref3.result;

                _this.unusedCodeRows.set(key, result);
            }));
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
                _this.unusedCodeRows.clear();
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            if (this.disposable) {
                this.disposable.dispose();
            }
        }
    }, {
        key: "setupEditor",
        value: function setupEditor(editor, disposable) {
            var _this2 = this;

            if (editor["_oldGrammar"] || !editor.getGrammar) return;
            var issueRequest = editor.omnisharp.get(HIGHLIGHT_REQUEST);
            augmentEditor(editor, this.unusedCodeRows, true);
            disposable.add(_omnisharpClient.Disposable.create(function () {
                _this2.unusedCodeRows.delete(editor.getPath());
            }));
            this.editors.push(editor);
            this.disposable.add(disposable);
            disposable.add(_omnisharpClient.Disposable.create(function () {
                editor.getGrammar().linesToFetch = [];
                if (editor.getGrammar().responses) editor.getGrammar().responses.clear();
                editor.displayBuffer.tokenizedBuffer.retokenizeLines();
                delete editor["_oldGrammar"];
            }));
            this.disposable.add(editor.onDidDestroy(function () {
                (0, _lodash.pull)(_this2.editors, editor);
            }));
            disposable.add(editor.omnisharp.project.observe.activeFramework.subscribe(function () {
                editor.getGrammar().linesToFetch = [];
                if (editor.getGrammar().responses) editor.getGrammar().responses.clear();
                issueRequest.next(true);
            }));
            disposable.add(editor.onDidStopChanging(function () {
                return issueRequest.next(true);
            }));
            disposable.add(editor.onDidSave(function () {
                editor.getGrammar().linesToFetch = [];
                issueRequest.next(true);
            }));
            disposable.add(editor.omnisharp.solution.whenConnected().delay(1000).subscribe({ complete: function complete() {
                    issueRequest.next(true);
                } }));
        }
    }]);

    return Highlight;
}();

function augmentEditor(editor) {
    var unusedCodeRows = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
    var doSetGrammar = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

    if (!editor["_oldGrammar"]) editor["_oldGrammar"] = editor.getGrammar();
    if (!editor["_setGrammar"]) editor["_setGrammar"] = editor.setGrammar;
    if (!editor.displayBuffer.tokenizedBuffer["_buildTokenizedLineForRowWithText"]) editor.displayBuffer.tokenizedBuffer["_buildTokenizedLineForRowWithText"] = editor.displayBuffer.tokenizedBuffer.buildTokenizedLineForRowWithText;
    if (!editor.displayBuffer.tokenizedBuffer["_markTokenizationComplete"]) editor.displayBuffer.tokenizedBuffer["_markTokenizationComplete"] = editor.displayBuffer.tokenizedBuffer.markTokenizationComplete;
    if (!editor.displayBuffer.tokenizedBuffer["_retokenizeLines"]) editor.displayBuffer.tokenizedBuffer["_retokenizeLines"] = editor.displayBuffer.tokenizedBuffer.retokenizeLines;
    if (!editor.displayBuffer.tokenizedBuffer["_tokenizeInBackground"]) editor.displayBuffer.tokenizedBuffer["_tokenizeInBackground"] = editor.displayBuffer.tokenizedBuffer.tokenizeInBackground;
    if (!editor.displayBuffer.tokenizedBuffer["_chunkSize"]) editor.displayBuffer.tokenizedBuffer["chunkSize"] = 20;
    editor.setGrammar = setGrammar;
    if (doSetGrammar) editor.setGrammar(editor.getGrammar());
    editor.displayBuffer.tokenizedBuffer.buildTokenizedLineForRowWithText = function (row) {
        editor.getGrammar()["__row__"] = row;
        return editor.displayBuffer.tokenizedBuffer["_buildTokenizedLineForRowWithText"].apply(this, arguments);
    };
    if (!editor.displayBuffer.tokenizedBuffer.silentRetokenizeLines) {
        editor.displayBuffer.tokenizedBuffer.silentRetokenizeLines = (0, _lodash.debounce)(function () {
            if (editor.getGrammar().isObserveRetokenizing) editor.getGrammar().isObserveRetokenizing.next(false);
            var lastRow = void 0;
            lastRow = this.buffer.getLastRow();
            this.tokenizedLines = this.buildPlaceholderTokenizedLinesForRows(0, lastRow);
            this.invalidRows = [];
            if (this.linesToTokenize && this.linesToTokenize.length) {
                this.invalidateRow((0, _lodash.min)(this.linesToTokenize));
            } else {
                this.invalidateRow(0);
            }
            this.fullyTokenized = false;
        }, DEBOUNCE_TIME, { leading: true, trailing: true });
    }
    editor.displayBuffer.tokenizedBuffer.markTokenizationComplete = function () {
        if (editor.getGrammar().isObserveRetokenizing) editor.getGrammar().isObserveRetokenizing.next(true);
        return editor.displayBuffer.tokenizedBuffer["_markTokenizationComplete"].apply(this, arguments);
    };
    editor.displayBuffer.tokenizedBuffer.retokenizeLines = function () {
        if (editor.getGrammar().isObserveRetokenizing) editor.getGrammar().isObserveRetokenizing.next(false);
        return editor.displayBuffer.tokenizedBuffer["_retokenizeLines"].apply(this, arguments);
    };
    editor.displayBuffer.tokenizedBuffer.tokenizeInBackground = function () {
        var _this3 = this;

        if (!this.visible || this.pendingChunk || !this.isAlive()) return;
        this.pendingChunk = true;
        fastdom.mutate(function () {
            _this3.pendingChunk = false;
            if (_this3.isAlive() && _this3.buffer.isAlive()) {
                _this3.tokenizeNextChunk();
            }
        });
    };
    editor.displayBuffer.tokenizedBuffer.scopesFromTags = function (startingScopes, tags) {
        var scopes = startingScopes.slice();
        var grammar = editor.getGrammar();
        for (var i = 0, len = tags.length; i < len; i++) {
            var tag = tags[i];
            if (tag < 0) {
                if (tag % 2 === -1) {
                    scopes.push(tag);
                } else {
                    var matchingStartTag = tag + 1;
                    while (true) {
                        if (scopes.pop() === matchingStartTag) {
                            break;
                        }
                        if (scopes.length === 0) {
                            scopes.push(grammar.startIdForScope("." + grammar.scopeName));
                            console.info("Encountered an unmatched scope end tag.", {
                                filePath: editor.buffer.getPath(),
                                grammarScopeName: grammar.scopeName,
                                tag: tag,
                                unmatchedEndTag: grammar.scopeForId(tag)
                            });
                            editor.getGrammar().setResponses([]);
                            if (unusedCodeRows && (0, _omnisharpTextEditor.isOmnisharpTextEditor)(editor)) {
                                unusedCodeRows.get(editor.getPath()).take(1).subscribe(function (rows) {
                                    return editor.getGrammar().setResponses(getHighlightsFromQuickFixes(editor.getPath(), rows, []));
                                });
                            }
                            break;
                        }
                    }
                }
            }
        }
        return scopes;
    };
}

var Grammar = function () {
    function Grammar(editor, base, options) {
        var _this4 = this;

        _classCallCheck(this, Grammar);

        this._gid = (0, _lodash.uniqueId)("og");
        this.isObserveRetokenizing = new _rxjs.ReplaySubject(1);
        this.isObserveRetokenizing.next(true);
        this.editor = editor;
        this.responses = new Map();
        this.linesToFetch = [];
        this.linesToTokenize = [];
        this.activeFramework = {};
        if (!options || !options.readonly) {
            editor.getBuffer().preemptDidChange(function (e) {
                var oldRange = e.oldRange;
                var newRange = e.newRange;

                var start = oldRange.start.row,
                    delta = newRange.end.row - oldRange.end.row;
                start = start - 5;
                if (start < 0) start = 0;
                var end = editor.buffer.getLineCount() - 1;
                var lines = (0, _lodash.range)(start, end + 1);
                if (!_this4.responses.keys().next().done) {
                    var _linesToFetch;

                    (_linesToFetch = _this4.linesToFetch).push.apply(_linesToFetch, _toConsumableArray(lines));
                }
                if (lines.length === 1) {
                    var responseLine = _this4.responses.get(lines[0]);
                    if (responseLine) {
                        (function () {
                            var oldFrom = oldRange.start.column,
                                newFrom = newRange.start.column;
                            (0, _lodash.remove)(responseLine, function (span) {
                                if (span.StartLine < lines[0]) {
                                    return true;
                                }
                                if (span.StartColumn >= oldFrom || span.EndColumn >= oldFrom) {
                                    return true;
                                }
                                if (span.StartColumn >= newFrom || span.EndColumn >= newFrom) {
                                    return true;
                                }
                                return false;
                            });
                        })();
                    }
                } else {
                    (0, _lodash.each)(lines, function (line) {
                        _this4.responses.delete(line);
                    });
                }
                if (delta > 0) {
                    var count = editor.getLineCount();
                    for (var i = count - 1; i > end; i--) {
                        if (_this4.responses.has(i)) {
                            _this4.responses.set(i + delta, _this4.responses.get(i));
                            _this4.responses.delete(i);
                        }
                    }
                } else if (delta < 0) {
                    var _count = editor.getLineCount();
                    var absDelta = Math.abs(delta);
                    for (var _i = end; _i < _count; _i++) {
                        if (_this4.responses.has(_i + absDelta)) {
                            _this4.responses.set(_i, _this4.responses.get(_i + absDelta));
                            _this4.responses.delete(_i + absDelta);
                        }
                    }
                }
            });
        }
    }

    _createClass(Grammar, [{
        key: "setResponses",
        value: function setResponses(value, enableExcludeCode) {
            var _this5 = this;

            var results = (0, _lodash.chain)(value);
            var groupedItems = results.map(function (highlight) {
                return (0, _lodash.range)(highlight.StartLine, highlight.EndLine + 1).map(function (line) {
                    return { line: line, highlight: highlight };
                });
            }).flatten().groupBy(function (z) {
                return z.line;
            }).value();
            (0, _lodash.each)(groupedItems, function (item, key) {
                var k = +key,
                    mappedItem = item.map(function (x) {
                    return x.highlight;
                });
                if (!enableExcludeCode || (0, _lodash.some)(mappedItem, function (i) {
                    return i.Kind === "preprocessor keyword";
                }) && (0, _lodash.every)(mappedItem, function (i) {
                    return i.Kind === "excluded code" || i.Kind === "preprocessor keyword";
                })) {
                    mappedItem = mappedItem.filter(function (z) {
                        return z.Kind !== "excluded code";
                    });
                }
                if (!_this5.responses.has(k)) {
                    _this5.responses.set(k, mappedItem);
                    _this5.linesToTokenize.push(k);
                } else {
                    var responseLine = _this5.responses.get(k);
                    if (responseLine.length !== mappedItem.length || (0, _lodash.some)(responseLine, function (l, i) {
                        return !(0, _lodash.isEqual)(l, mappedItem[i]);
                    })) {
                        _this5.responses.set(k, mappedItem);
                        _this5.linesToTokenize.push(k);
                    }
                }
            });
        }
    }]);

    return Grammar;
}();

(0, _lodash.extend)(Grammar.prototype, AtomGrammar.prototype);
Grammar.prototype["omnisharp"] = true;
Grammar.prototype["tokenizeLine"] = function (line, ruleStack) {
    var firstLine = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

    var baseResult = AtomGrammar.prototype.tokenizeLine.call(this, line, ruleStack, firstLine);
    var tags = void 0;
    if (this.responses) {
        var row = this["__row__"];
        if (!this.responses.has(row)) return baseResult;
        var highlights = this.responses.get(row);
        if (highlights[0] && highlights[0].Kind === "excluded code") {
            tags = [line.length];
            getAtomStyleForToken(this.name, tags, highlights[0], 0, tags.length - 1, line);
            baseResult.ruleStack = [baseResult.ruleStack[0]];
        } else {
            tags = this.getCsTokensForLine(highlights, line, row, ruleStack, firstLine, baseResult.tags);
        }
        baseResult.tags = tags;
    }
    return baseResult;
};
Grammar.prototype.getCsTokensForLine = function (highlights, line, row, ruleStack, firstLine, tags) {
    var _this6 = this;

    ruleStack = [{ rule: this.getInitialRule() }];
    (0, _lodash.each)(highlights, function (highlight) {
        var start = highlight.StartColumn - 1;
        var end = highlight.EndColumn - 1;
        if (highlight.EndLine > highlight.StartLine && highlight.StartColumn === 0 && highlight.EndColumn === 0) {
            getAtomStyleForToken(_this6.name, tags, highlight, 0, tags.length - 1, line);
            return;
        }
        var distance = -1;
        var index = -1;
        var i = void 0;
        for (i = 0; i < tags.length; i++) {
            if (tags[i] > 0) {
                if (distance + tags[i] > start) {
                    index = i;
                    break;
                }
                distance += tags[i];
            }
        }
        var str = line.substring(start, end);
        var size = end - start;
        if (tags[index] >= size) {
            var values = void 0;
            var prev = void 0,
                next = void 0;
            if (distance === start) {
                values = [size, tags[index] - size];
            } else {
                prev = start - distance;
                next = tags[index] - size - prev;
                if (next > 0) {
                    values = [prev, size, tags[index] - size - prev];
                } else {
                    values = [prev, size];
                }
            }
            tags.splice.apply(tags, [index, 1].concat(_toConsumableArray(values)));
            if (prev) index = index + 1;
            getAtomStyleForToken(_this6.name, tags, highlight, index, index + 1, str);
        } else if (tags[index] < size) {
            var backtrackIndex = index;
            var backtrackDistance = 0;
            for (i = backtrackIndex; i >= 0; i--) {
                if (tags[i] > 0) {
                    if (backtrackDistance >= size) {
                        backtrackIndex = i;
                        break;
                    }
                    backtrackDistance += tags[i];
                } else if (tags[i] % 2 === 0) {
                    if (backtrackDistance >= size) {
                        backtrackIndex = i + 1;
                        break;
                    }
                }
            }
            if (i === -1) {
                backtrackIndex = 0;
            }
            var forwardtrackIndex = index;
            var remainingSize = size;
            for (i = index + 1; i < tags.length; i++) {
                if (remainingSize <= 0 && tags[i] > 0) {
                    forwardtrackIndex = i - 1;
                    break;
                }
                if (tags[i] > 0) {
                    remainingSize -= tags[i];
                } else if (tags[i] % 2 === 0) {
                    var openFound = false;
                    for (var h = i; h >= 0; h--) {
                        if (tags[h] === tags[i] + 1) {
                            openFound = true;
                            break;
                        }
                    }
                    if (!openFound) {
                        forwardtrackIndex = i - 1;
                        break;
                    }
                }
            }
            if (i === tags.length) {
                forwardtrackIndex = tags.length - 1;
            }
            getAtomStyleForToken(_this6.name, tags, highlight, backtrackIndex, forwardtrackIndex, str);
        }
    });
    return tags;
};
var getIdForScope = function () {
    var ids = {};
    var grammars = {};
    function buildScopesForGrammar(grammarName) {
        var grammar = (0, _lodash.find)(atom.grammars.getGrammars(), function (gammr) {
            return gammr.name === grammarName;
        });
        if (!grammar) return;
        ids[grammar.name] = {};
        grammars[grammar.name] = grammar;
        (0, _lodash.each)(grammar.registry.scopesById, function (value, key) {
            ids[grammar.name][value] = +key;
        });
    }
    var method = function method(grammar, scope) {
        if (!ids[grammar]) {
            buildScopesForGrammar(grammar);
        }
        if (!ids[grammar][scope]) ids[grammar][scope] = grammars[grammar].registry.startIdForScope(scope);
        return +ids[grammar][scope];
    };
    method.end = function (scope) {
        return +scope - 1;
    };
    return method;
}();
function getAtomStyleForToken(grammar, tags, token, index, indexEnd, str) {
    var previousScopes = [];
    for (var i = index - 1; i >= 0; i--) {
        if (tags[i] > 0) break;
        previousScopes.push(tags[i]);
    }
    var replacements = [];
    var opens = [];
    var closes = [];

    var _loop = function _loop(_i2) {
        if (tags[_i2] > 0) return "continue";
        if (tags[_i2] % 2 === 0) {
            var openIndex = (0, _lodash.findIndex)(opens, function (x) {
                return x.tag === tags[_i2] + 1;
            });
            if (openIndex > -1) {
                opens.splice(openIndex, 1);
            } else {
                closes.push({ tag: tags[_i2], index: _i2 });
            }
        } else {
            opens.unshift({ tag: tags[_i2], index: _i2 });
        }
    };

    for (var _i2 = index; _i2 < indexEnd; _i2++) {
        var _ret2 = _loop(_i2);

        if (_ret2 === "continue") continue;
    }
    var unfullfilled = [];
    if (closes.length > 0) {
        unfullfilled = (0, _lodash.sortBy)(opens.concat(closes), function (x) {
            return x.index;
        });
    } else if (opens.length > 0) {
        replacements.unshift({
            start: opens[opens.length - 1].index,
            end: indexEnd,
            replacement: tags.slice(opens[opens.length - 1].index, indexEnd + 1)
        });
    }
    var internalIndex = index;
    for (var _i3 = 0; _i3 < unfullfilled.length; _i3++) {
        var v = unfullfilled[_i3];
        replacements.unshift({
            start: internalIndex,
            end: v.index,
            replacement: tags.slice(internalIndex, v.index)
        });
        internalIndex = v.index + 1;
    }
    if (replacements.length === 0) {
        replacements.unshift({
            start: index,
            end: indexEnd,
            replacement: tags.slice(index, indexEnd)
        });
    } else {}
    function add(scope) {
        var id = getIdForScope(grammar, scope);
        if (id === -1) return;
        if (!(0, _lodash.some)(previousScopes, function (z) {
            return z === id;
        })) {
            previousScopes.push(id);
        }
        (0, _lodash.each)(replacements, function (ctx) {
            var replacement = ctx.replacement;
            replacement.unshift(id);
            replacement.push(getIdForScope.end(id));
        });
    }
    switch (token.Kind) {
        case "number":
            add("constant.numeric");
            break;
        case "struct name":
            add("support.constant.numeric.identifier.struct");
            break;
        case "enum name":
            add("support.constant.numeric.identifier.enum");
            break;
        case "identifier":
            add("identifier");
            break;
        case "class name":
            add("support.class.type.identifier");
            break;
        case "delegate name":
            add("support.class.type.identifier.delegate");
            break;
        case "interface name":
            add("support.class.type.identifier.interface");
            break;
        case "preprocessor keyword":
            add("constant.other.symbol");
            break;
        case "excluded code":
            add("comment.block");
            break;
        case "unused code":
            add("unused");
            break;
        default:
            console.log("unhandled Kind " + token.Kind);
            break;
    }
    (0, _lodash.each)(replacements, function (ctx) {
        var replacement = ctx.replacement;
        var end = ctx.end;
        var start = ctx.start;

        if (replacement.length === 2) return;
        var num = end - start;
        if (num <= 0) {
            num = 1;
        }
        tags.splice.apply(tags, [start, num].concat(_toConsumableArray(replacement)));
    });
}
function setGrammar(grammar) {
    var g2 = getEnhancedGrammar(this, grammar);
    if (g2 !== grammar) this._setGrammar(g2);
    return g2;
}
function getEnhancedGrammar(editor, grammar, options) {
    if (!grammar) grammar = editor.getGrammar();
    if (!grammar["omnisharp"] && _omni.Omni.isValidGrammar(grammar)) {
        (function () {
            var newGrammar = new Grammar(editor, grammar, options);
            (0, _lodash.each)(grammar, function (x, i) {
                return (0, _lodash.has)(grammar, i) && (newGrammar[i] = x);
            });
            grammar = newGrammar;
        })();
    }
    return grammar;
}

var UnusedMap = function () {
    function UnusedMap() {
        _classCallCheck(this, UnusedMap);

        this._map = new Map();
    }

    _createClass(UnusedMap, [{
        key: "get",
        value: function get(key) {
            if (!this._map.has(key)) this._map.set(key, new _rxjs.BehaviorSubject([]));
            return this._map.get(key);
        }
    }, {
        key: "_getObserver",
        value: function _getObserver(key) {
            return this.get(key);
        }
    }, {
        key: "set",
        value: function set(key, value) {
            var o = this._getObserver(key);
            if (!(0, _lodash.isEqual)(o.getValue(), value)) {
                o.next(value || []);
            }
            return this;
        }
    }, {
        key: "delete",
        value: function _delete(key) {
            if (this._map.has(key)) this._map.delete(key);
        }
    }, {
        key: "clear",
        value: function clear() {
            this._map.clear();
        }
    }]);

    return UnusedMap;
}();

var enhancedHighlighting = exports.enhancedHighlighting = new Highlight();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9oaWdobGlnaHQudHMiLCJsaWIvZmVhdHVyZXMvaGlnaGxpZ2h0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztRQWlNQSxhLEdBQUEsYTtRQTJnQkEsa0IsR0FBQSxrQjs7QUM1c0JBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7QURLQSxJQUFNLGNBQWMsUUFBYyxLQUFNLE1BQU4sQ0FBYSxZQUFiLEdBQTRCLHlDQUExQyxDQUFwQjtBQUVBLElBQU0sZ0JBQWdCLEdBQXRCO0FBQ0EsSUFBSSxVQUEwQixRQUFRLFNBQVIsQ0FBOUI7QUFFQSxJQUFNLFlBQVksV0FBbEI7SUFDSSxvQkFBb0IsbUJBRHhCO0FBR0EsU0FBQSwyQkFBQSxDQUFxQyxJQUFyQyxFQUFtRCxVQUFuRCxFQUE0RixZQUE1RixFQUFrSDtBQUM5RyxXQUFPLG1CQUFNLFVBQU4sRUFDRixNQURFLENBQ0s7QUFBQSxlQUFLLEVBQUUsUUFBRixLQUFlLElBQXBCO0FBQUEsS0FETCxFQUVGLEdBRkUsQ0FFRTtBQUFBLGVBQU07QUFDUCx1QkFBVyxFQUFFLElBRE47QUFFUCx5QkFBYSxFQUFFLE1BRlI7QUFHUCxxQkFBUyxFQUFFLE9BSEo7QUFJUCx1QkFBVyxFQUFFLFNBSk47QUFLUCxrQkFBTSxhQUxDO0FBTVAsc0JBQVU7QUFOSCxTQUFOO0FBQUEsS0FGRixFQVVGLEtBVkUsRUFBUDtBQVdIO0FBR00sSUFBTSwwREFBeUIsQ0FDbEMsQ0FEa0MsRUFFbEMsQ0FGa0MsRUFHbEMsQ0FIa0MsRUFJbEMsQ0FKa0MsRUFLbEMsQ0FMa0MsQ0FBL0I7O0lBU1AsUztBQUFBLHlCQUFBO0FBQUE7O0FBR1ksYUFBQSxjQUFBLEdBQWlCLElBQUksU0FBSixFQUFqQjtBQStJRCxhQUFBLFFBQUEsR0FBVyxLQUFYO0FBQ0EsYUFBQSxLQUFBLEdBQVEsdUJBQVI7QUFDQSxhQUFBLFdBQUEsR0FBYywyR0FBZDtBQUNBLGFBQUEsT0FBQSxHQUFVLEtBQVY7QUFD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QUwsQ0FBVSxHQUFWLENBQWMsR0FBZCxDQUFKLEVBQ0ksS0FBSyxJQUFMLENBQVUsTUFBVixDQUFpQixHQUFqQjtBQUNQOzs7Z0NBRVc7QUFDUixpQkFBSyxJQUFMLENBQVUsS0FBVjtBQUNIOzs7Ozs7QUFHRSxJQUFNLHNEQUF1QixJQUFJLFNBQUosRUFBN0IiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2hpZ2hsaWdodC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIHRzbGludDpkaXNhYmxlOm5vLXN0cmluZy1saXRlcmFsICovXG5pbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQge09tbmlzaGFycFRleHRFZGl0b3IsIGlzT21uaXNoYXJwVGV4dEVkaXRvcn0gZnJvbSBcIi4uL3NlcnZlci9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcbmltcG9ydCB7ZWFjaCwgZXh0ZW5kLCBoYXMsIHNvbWUsIHJhbmdlLCByZW1vdmUsIHB1bGwsIGZpbmQsIGNoYWluLCB1bmlxLCBmaW5kSW5kZXgsIGV2ZXJ5LCBpc0VxdWFsLCBtaW4sIGRlYm91bmNlLCBzb3J0QnksIHVuaXF1ZUlkLCBmaWx0ZXJ9IGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdCwgUmVwbGF5U3ViamVjdCwgQmVoYXZpb3JTdWJqZWN0LCBTdWJzY3JpYmVyfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHtyZWdpc3RlckNvbnRleHRJdGVtfSBmcm9tIFwiLi4vc2VydmVyL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xuLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xuY29uc3QgQXRvbUdyYW1tYXIgPSByZXF1aXJlKCg8YW55PmF0b20pLmNvbmZpZy5yZXNvdXJjZVBhdGggKyBcIi9ub2RlX21vZHVsZXMvZmlyc3QtbWF0ZS9saWIvZ3JhbW1hci5qc1wiKTtcbi8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xuY29uc3QgREVCT1VOQ0VfVElNRSA9IDI0MC8qMjQwKi87XG5sZXQgZmFzdGRvbTogdHlwZW9mIEZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcblxuY29uc3QgSElHSExJR0hUID0gXCJISUdITElHSFRcIixcbiAgICBISUdITElHSFRfUkVRVUVTVCA9IFwiSElHSExJR0hUX1JFUVVFU1RcIjtcblxuZnVuY3Rpb24gZ2V0SGlnaGxpZ2h0c0Zyb21RdWlja0ZpeGVzKHBhdGg6IHN0cmluZywgcXVpY2tGaXhlczogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdLCBwcm9qZWN0TmFtZXM6IHN0cmluZ1tdKSB7XG4gICAgcmV0dXJuIGNoYWluKHF1aWNrRml4ZXMpXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4LkZpbGVOYW1lID09PSBwYXRoKVxuICAgICAgICAubWFwKHggPT4gKHtcbiAgICAgICAgICAgIFN0YXJ0TGluZTogeC5MaW5lLFxuICAgICAgICAgICAgU3RhcnRDb2x1bW46IHguQ29sdW1uLFxuICAgICAgICAgICAgRW5kTGluZTogeC5FbmRMaW5lLFxuICAgICAgICAgICAgRW5kQ29sdW1uOiB4LkVuZENvbHVtbixcbiAgICAgICAgICAgIEtpbmQ6IFwidW51c2VkIGNvZGVcIixcbiAgICAgICAgICAgIFByb2plY3RzOiBwcm9qZWN0TmFtZXNcbiAgICAgICAgfSBhcyBNb2RlbHMuSGlnaGxpZ2h0U3BhbikpXG4gICAgICAgIC52YWx1ZSgpO1xufVxuXG4vKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXG5leHBvcnQgY29uc3QgRXhjbHVkZUNsYXNzaWZpY2F0aW9ucyA9IFtcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uQ29tbWVudCxcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uU3RyaW5nLFxuICAgIE1vZGVscy5IaWdobGlnaHRDbGFzc2lmaWNhdGlvbi5QdW5jdHVhdGlvbixcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uT3BlcmF0b3IsXG4gICAgTW9kZWxzLkhpZ2hsaWdodENsYXNzaWZpY2F0aW9uLktleXdvcmRcbl07XG4vKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cblxuY2xhc3MgSGlnaGxpZ2h0IGltcGxlbWVudHMgSUZlYXR1cmUge1xuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcbiAgICBwcml2YXRlIGVkaXRvcnM6IEFycmF5PE9tbmlzaGFycFRleHRFZGl0b3I+O1xuICAgIHByaXZhdGUgdW51c2VkQ29kZVJvd3MgPSBuZXcgVW51c2VkTWFwKCk7XG5cbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZWRpdG9ycyA9IFtdO1xuXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQocmVnaXN0ZXJDb250ZXh0SXRlbShISUdITElHSFRfUkVRVUVTVCwgKGNvbnRleHQpID0+IG5ldyBTdWJqZWN0PGJvb2xlYW4+KCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChyZWdpc3RlckNvbnRleHRJdGVtKEhJR0hMSUdIVCwgKGNvbnRleHQsIGVkaXRvcikgPT5cbiAgICAgICAgICAgIGNvbnRleHQuZ2V0PFN1YmplY3Q8Ym9vbGVhbj4+KEhJR0hMSUdIVF9SRVFVRVNUKVxuICAgICAgICAgICAgICAgIC5zdGFydFdpdGgodHJ1ZSlcbiAgICAgICAgICAgICAgICAuc3dpdGNoTWFwKCgpID0+IE9ic2VydmFibGUuZGVmZXIoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9qZWN0cyA9IGNvbnRleHQucHJvamVjdC5hY3RpdmVGcmFtZXdvcmsuTmFtZSA9PT0gXCJhbGxcIiA/IFtdIDogW2NvbnRleHQucHJvamVjdC5hY3RpdmVGcmFtZXdvcmsuTmFtZV07XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IGxpbmVzVG9GZXRjaCA9IHVuaXE8bnVtYmVyPigoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5saW5lc1RvRmV0Y2gpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWxpbmVzVG9GZXRjaCB8fCAhbGluZXNUb0ZldGNoLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpbmVzVG9GZXRjaCA9IFtdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IGNvZGUgcm93c1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLnNldChlZGl0b3IuZ2V0UGF0aCgpLCBbXSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuY29tYmluZUxhdGVzdChcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3MuZ2V0KGVkaXRvci5nZXRQYXRoKCkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uaGlnaGxpZ2h0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBQcm9qZWN0TmFtZXM6IHByb2plY3RzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIExpbmVzOiBsaW5lc1RvRmV0Y2gsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRXhjbHVkZUNsYXNzaWZpY2F0aW9uc1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkpLFxuICAgICAgICAgICAgICAgICAgICAgICAgKHF1aWNrZml4ZXMsIHJlc3BvbnNlKSA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHRzOiAocmVzcG9uc2UgPyByZXNwb25zZS5IaWdobGlnaHRzIDogW10pLmNvbmNhdChnZXRIaWdobGlnaHRzRnJvbVF1aWNrRml4ZXMoZWRpdG9yLmdldFBhdGgoKSwgcXVpY2tmaXhlcywgcHJvamVjdHMpKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZG8oKHtoaWdobGlnaHRzfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlZGl0b3IuZ2V0R3JhbW1hcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5zZXRSZXNwb25zZXMoaGlnaGxpZ2h0cywgcHJvamVjdHMubGVuZ3RoID4gMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IE9ic2VydmFibGUucmFjZTxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdhaXQgZm9yIGEgbmV3IGNvZGVjaGVjaywgb3RoZXJ3aXNlIGxvb2sgYXQgd2hhdCBleGlzdHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250ZXh0LnNvbHV0aW9uLm1vZGVsLm9ic2VydmUuY29kZWNoZWNrLmRlbGF5KDQwMDApLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQuc29sdXRpb24ub2JzZXJ2ZS5jb2RlY2hlY2tcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+IHgucmVxdWVzdC5GaWxlTmFtZSA9PT0gZWRpdG9yLmdldFBhdGgoKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCh4ID0+IDxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+KHgucmVzcG9uc2UgJiYgeC5yZXNwb25zZS5RdWlja0ZpeGVzIHx8IFtdKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZG8oKHZhbHVlKSA9PiB0aGlzLnVudXNlZENvZGVSb3dzLnNldChlZGl0b3IuZ2V0UGF0aCgpLCBmaWx0ZXIodmFsdWUsIHggPT4geC5Mb2dMZXZlbCA9PT0gXCJIaWRkZW5cIikpKVxuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5yZWZDb3VudCgpO1xuICAgICAgICAgICAgICAgIH0pKSkpO1xuXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5lYWNoRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldHVwRWRpdG9yKGVkaXRvciwgY2QpO1xuXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9tbmlzaGFycC5wcm9qZWN0XG4gICAgICAgICAgICAgICAgLm9ic2VydmUuYWN0aXZlRnJhbWV3b3JrXG4gICAgICAgICAgICAgICAgLnNraXAoMSlcbiAgICAgICAgICAgICAgICAuZGlzdGluY3RVbnRpbENoYW5nZWQoKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBlZGl0b3Iub21uaXNoYXJwLmdldDxTdWJzY3JpYmVyPGJvb2xlYW4+PihISUdITElHSFRfUkVRVUVTVCkubmV4dCh0cnVlKTtcbiAgICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub21uaXNoYXJwXG4gICAgICAgICAgICAgICAgLmdldDxPYnNlcnZhYmxlPHsgZWRpdG9yOiBPbW5pc2hhcnBUZXh0RWRpdG9yOyBoaWdobGlnaHRzOiBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdOyBwcm9qZWN0czogc3RyaW5nW10gfT4+KEhJR0hMSUdIVClcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wic2lsZW50UmV0b2tlbml6ZUxpbmVzXCJdKCk7XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgaWYgKGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcInNpbGVudFJldG9rZW5pemVMaW5lc1wiXSkge1xuICAgICAgICAgICAgICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcInNpbGVudFJldG9rZW5pemVMaW5lc1wiXSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLmNvZGVjaGVja1xuICAgICAgICAgICAgLmZsYXRNYXAoeCA9PiB4LnJlc3BvbnNlICYmIDxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+eC5yZXNwb25zZS5RdWlja0ZpeGVzIHx8IFtdKVxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IHguTG9nTGV2ZWwgPT09IFwiSGlkZGVuXCIpXG4gICAgICAgICAgICAuZ3JvdXBCeSh4ID0+IHguRmlsZU5hbWUsIHggPT4geClcbiAgICAgICAgICAgIC5mbGF0TWFwKHggPT4geC50b0FycmF5KCksICh7a2V5fSwgcmVzdWx0KSA9PiAoeyBrZXksIHJlc3VsdCB9KSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKHtrZXksIHJlc3VsdH0pID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLnNldChrZXksIHJlc3VsdCk7XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLmNsZWFyKCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgc2V0dXBFZGl0b3IoZWRpdG9yOiBPbW5pc2hhcnBUZXh0RWRpdG9yLCBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlKSB7XG4gICAgICAgIGlmIChlZGl0b3JbXCJfb2xkR3JhbW1hclwiXSB8fCAhZWRpdG9yLmdldEdyYW1tYXIpIHJldHVybjtcblxuICAgICAgICBjb25zdCBpc3N1ZVJlcXVlc3QgPSBlZGl0b3Iub21uaXNoYXJwLmdldDxTdWJqZWN0PGJvb2xlYW4+PihISUdITElHSFRfUkVRVUVTVCk7XG5cbiAgICAgICAgYXVnbWVudEVkaXRvcihlZGl0b3IsIHRoaXMudW51c2VkQ29kZVJvd3MsIHRydWUpO1xuXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3MuZGVsZXRlKGVkaXRvci5nZXRQYXRoKCkpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5lZGl0b3JzLnB1c2goZWRpdG9yKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkaXNwb3NhYmxlKTtcblxuICAgICAgICBkaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5saW5lc1RvRmV0Y2ggPSBbXTtcbiAgICAgICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5yZXNwb25zZXMpICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLnJlc3BvbnNlcy5jbGVhcigpO1xuICAgICAgICAgICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcygpO1xuICAgICAgICAgICAgZGVsZXRlIGVkaXRvcltcIl9vbGRHcmFtbWFyXCJdO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcbiAgICAgICAgICAgIHB1bGwodGhpcy5lZGl0b3JzLCBlZGl0b3IpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9tbmlzaGFycC5wcm9qZWN0XG4gICAgICAgICAgICAub2JzZXJ2ZS5hY3RpdmVGcmFtZXdvcmtcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICAgICAgICAgIGlmICgoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5yZXNwb25zZXMpICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLnJlc3BvbnNlcy5jbGVhcigpO1xuICAgICAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZFN0b3BDaGFuZ2luZygoKSA9PiBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKSkpO1xuXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZFNhdmUoKCkgPT4ge1xuICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkubGluZXNUb0ZldGNoID0gW107XG4gICAgICAgICAgICBpc3N1ZVJlcXVlc3QubmV4dCh0cnVlKTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb25cbiAgICAgICAgICAgIC53aGVuQ29ubmVjdGVkKClcbiAgICAgICAgICAgIC5kZWxheSgxMDAwKVxuICAgICAgICAgICAgLnN1YnNjcmliZSh7IGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XG4gICAgICAgICAgICB9IH0pKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVxdWlyZWQgPSBmYWxzZTtcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkVuaGFuY2VkIEhpZ2hsaWdodGluZ1wiO1xuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiRW5hYmxlcyBzZXJ2ZXIgYmFzZWQgaGlnaGxpZ2h0aW5nLCB3aGljaCBpbmNsdWRlcyBzdXBwb3J0IGZvciBzdHJpbmcgaW50ZXJwb2xhdGlvbiwgY2xhc3MgbmFtZXMgYW5kIG1vcmUuXCI7XG4gICAgcHVibGljIGRlZmF1bHQgPSBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGF1Z21lbnRFZGl0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIHVudXNlZENvZGVSb3dzOiBVbnVzZWRNYXAgPSBudWxsLCBkb1NldEdyYW1tYXIgPSBmYWxzZSkge1xuICAgIGlmICghZWRpdG9yW1wiX29sZEdyYW1tYXJcIl0pXG4gICAgICAgIGVkaXRvcltcIl9vbGRHcmFtbWFyXCJdID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcbiAgICBpZiAoIWVkaXRvcltcIl9zZXRHcmFtbWFyXCJdKVxuICAgICAgICBlZGl0b3JbXCJfc2V0R3JhbW1hclwiXSA9IGVkaXRvci5zZXRHcmFtbWFyO1xuICAgIGlmICghZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0XCJdKVxuICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHRcIl0gPSBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIuYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHQ7XG4gICAgaWYgKCFlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdKVxuICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdID0gZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLm1hcmtUb2tlbml6YXRpb25Db21wbGV0ZTtcbiAgICBpZiAoIWVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcIl9yZXRva2VuaXplTGluZXNcIl0pXG4gICAgICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcIl9yZXRva2VuaXplTGluZXNcIl0gPSBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIucmV0b2tlbml6ZUxpbmVzO1xuICAgIGlmICghZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX3Rva2VuaXplSW5CYWNrZ3JvdW5kXCJdKVxuICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfdG9rZW5pemVJbkJhY2tncm91bmRcIl0gPSBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIudG9rZW5pemVJbkJhY2tncm91bmQ7XG4gICAgaWYgKCFlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfY2h1bmtTaXplXCJdKVxuICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJjaHVua1NpemVcIl0gPSAyMDtcblxuICAgIGVkaXRvci5zZXRHcmFtbWFyID0gc2V0R3JhbW1hcjtcbiAgICBpZiAoZG9TZXRHcmFtbWFyKSBlZGl0b3Iuc2V0R3JhbW1hcihlZGl0b3IuZ2V0R3JhbW1hcigpKTtcblxuICAgICg8YW55PmVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcikuYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHQgPSBmdW5jdGlvbihyb3c6IG51bWJlcikge1xuICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKVtcIl9fcm93X19cIl0gPSByb3c7XG4gICAgICAgIHJldHVybiBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHRcIl0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gICAgaWYgKCEoPGFueT5lZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIpLnNpbGVudFJldG9rZW5pemVMaW5lcykge1xuICAgICAgICAoPGFueT5lZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIpLnNpbGVudFJldG9rZW5pemVMaW5lcyA9IGRlYm91bmNlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZylcbiAgICAgICAgICAgICAgICAoPGFueT5lZGl0b3IuZ2V0R3JhbW1hcigpKS5pc09ic2VydmVSZXRva2VuaXppbmcubmV4dChmYWxzZSk7XG4gICAgICAgICAgICBsZXQgbGFzdFJvdzogbnVtYmVyO1xuICAgICAgICAgICAgbGFzdFJvdyA9IHRoaXMuYnVmZmVyLmdldExhc3RSb3coKTtcbiAgICAgICAgICAgIHRoaXMudG9rZW5pemVkTGluZXMgPSB0aGlzLmJ1aWxkUGxhY2Vob2xkZXJUb2tlbml6ZWRMaW5lc0ZvclJvd3MoMCwgbGFzdFJvdyk7XG4gICAgICAgICAgICB0aGlzLmludmFsaWRSb3dzID0gW107XG4gICAgICAgICAgICBpZiAodGhpcy5saW5lc1RvVG9rZW5pemUgJiYgdGhpcy5saW5lc1RvVG9rZW5pemUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnZhbGlkYXRlUm93KG1pbih0aGlzLmxpbmVzVG9Ub2tlbml6ZSkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVSb3coMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZ1bGx5VG9rZW5pemVkID0gZmFsc2U7XG4gICAgICAgIH0sIERFQk9VTkNFX1RJTUUsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSk7XG4gICAgfVxuXG4gICAgKDxhbnk+ZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyKS5tYXJrVG9rZW5pemF0aW9uQ29tcGxldGUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZylcbiAgICAgICAgICAgICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KHRydWUpO1xuICAgICAgICByZXR1cm4gZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX21hcmtUb2tlbml6YXRpb25Db21wbGV0ZVwiXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICAoPGFueT5lZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIpLnJldG9rZW5pemVMaW5lcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nKVxuICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQoZmFsc2UpO1xuICAgICAgICByZXR1cm4gZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX3JldG9rZW5pemVMaW5lc1wiXS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICAoPGFueT5lZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIpLnRva2VuaXplSW5CYWNrZ3JvdW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICghdGhpcy52aXNpYmxlIHx8IHRoaXMucGVuZGluZ0NodW5rIHx8ICF0aGlzLmlzQWxpdmUoKSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB0aGlzLnBlbmRpbmdDaHVuayA9IHRydWU7XG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGVuZGluZ0NodW5rID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0FsaXZlKCkgJiYgdGhpcy5idWZmZXIuaXNBbGl2ZSgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50b2tlbml6ZU5leHRDaHVuaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgKDxhbnk+ZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyKS5zY29wZXNGcm9tVGFncyA9IGZ1bmN0aW9uKHN0YXJ0aW5nU2NvcGVzOiBudW1iZXJbXSwgdGFnczogbnVtYmVyW10pIHtcbiAgICAgICAgY29uc3Qgc2NvcGVzID0gc3RhcnRpbmdTY29wZXMuc2xpY2UoKTtcbiAgICAgICAgY29uc3QgZ3JhbW1hciA9ICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gdGFncy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdGFnID0gdGFnc1tpXTtcbiAgICAgICAgICAgIGlmICh0YWcgPCAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKCh0YWcgJSAyKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGVzLnB1c2godGFnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGluZ1N0YXJ0VGFnID0gdGFnICsgMTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZXMucG9wKCkgPT09IG1hdGNoaW5nU3RhcnRUYWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSGFjayB0byBlbnN1cmUgdGhhdCBhbGwgbGluZXMgYWx3YXlzIGdldCB0aGUgcHJvcGVyIHNvdXJjZSBsaW5lcy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZXMucHVzaCg8YW55PmdyYW1tYXIuc3RhcnRJZEZvclNjb3BlKGAuJHtncmFtbWFyLnNjb3BlTmFtZX1gKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiRW5jb3VudGVyZWQgYW4gdW5tYXRjaGVkIHNjb3BlIGVuZCB0YWcuXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IGVkaXRvci5idWZmZXIuZ2V0UGF0aCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBncmFtbWFyU2NvcGVOYW1lOiBncmFtbWFyLnNjb3BlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bm1hdGNoZWRFbmRUYWc6IGdyYW1tYXIuc2NvcGVGb3JJZCh0YWcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+ZWRpdG9yLmdldEdyYW1tYXIoKSkuc2V0UmVzcG9uc2VzKFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodW51c2VkQ29kZVJvd3MgJiYgaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdW51c2VkQ29kZVJvd3MuZ2V0KGVkaXRvci5nZXRQYXRoKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShyb3dzID0+ICg8YW55PmVkaXRvci5nZXRHcmFtbWFyKCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNldFJlc3BvbnNlcyhnZXRIaWdobGlnaHRzRnJvbVF1aWNrRml4ZXMoZWRpdG9yLmdldFBhdGgoKSwgcm93cywgW10pKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzY29wZXM7XG4gICAgfTtcbn1cblxuaW50ZXJmYWNlIElIaWdobGlnaHRpbmdHcmFtbWFyIGV4dGVuZHMgRmlyc3RNYXRlLkdyYW1tYXIge1xuICAgIGlzT2JzZXJ2ZVJldG9rZW5pemluZzogU3ViamVjdDxib29sZWFuPjtcbiAgICBsaW5lc1RvRmV0Y2g6IG51bWJlcltdO1xuICAgIGxpbmVzVG9Ub2tlbml6ZTogbnVtYmVyW107XG4gICAgcmVzcG9uc2VzOiBNYXA8bnVtYmVyLCBNb2RlbHMuSGlnaGxpZ2h0U3BhbltdPjtcbiAgICBmdWxseVRva2VuaXplZDogYm9vbGVhbjtcbiAgICBzY29wZU5hbWU6IHN0cmluZztcbn1cblxuY2xhc3MgR3JhbW1hciB7XG4gICAgcHVibGljIGlzT2JzZXJ2ZVJldG9rZW5pemluZzogUmVwbGF5U3ViamVjdDxib29sZWFuPjtcbiAgICBwdWJsaWMgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3I7XG4gICAgcHVibGljIGxpbmVzVG9GZXRjaDogYW55W107XG4gICAgcHVibGljIGxpbmVzVG9Ub2tlbml6ZTogYW55W107XG4gICAgcHVibGljIGFjdGl2ZUZyYW1ld29yazogYW55O1xuICAgIHB1YmxpYyByZXNwb25zZXM6IE1hcDxudW1iZXIsIE1vZGVscy5IaWdobGlnaHRTcGFuW10+O1xuICAgIHB1YmxpYyBfZ2lkID0gdW5pcXVlSWQoXCJvZ1wiKTtcblxuICAgIGNvbnN0cnVjdG9yKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBiYXNlOiBGaXJzdE1hdGUuR3JhbW1hciwgb3B0aW9uczogeyByZWFkb25seTogYm9vbGVhbiB9KSB7XG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nID0gbmV3IFJlcGxheVN1YmplY3Q8Ym9vbGVhbj4oMSk7XG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQodHJ1ZSk7XG5cbiAgICAgICAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XG4gICAgICAgIHRoaXMucmVzcG9uc2VzID0gbmV3IE1hcDxudW1iZXIsIE1vZGVscy5IaWdobGlnaHRTcGFuW10+KCk7XG4gICAgICAgIHRoaXMubGluZXNUb0ZldGNoID0gW107XG4gICAgICAgIHRoaXMubGluZXNUb1Rva2VuaXplID0gW107XG4gICAgICAgIHRoaXMuYWN0aXZlRnJhbWV3b3JrID0ge307XG5cbiAgICAgICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLnJlYWRvbmx5KSB7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0QnVmZmVyKCkucHJlZW1wdERpZENoYW5nZSgoZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qge29sZFJhbmdlLCBuZXdSYW5nZX0gPSBlO1xuICAgICAgICAgICAgICAgIGxldCBzdGFydDogbnVtYmVyID0gb2xkUmFuZ2Uuc3RhcnQucm93LFxuICAgICAgICAgICAgICAgICAgICBkZWx0YTogbnVtYmVyID0gbmV3UmFuZ2UuZW5kLnJvdyAtIG9sZFJhbmdlLmVuZC5yb3c7XG5cbiAgICAgICAgICAgICAgICBzdGFydCA9IHN0YXJ0IC0gNTtcbiAgICAgICAgICAgICAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDA7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBlbmQgPSBlZGl0b3IuYnVmZmVyLmdldExpbmVDb3VudCgpIC0gMTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmVzID0gcmFuZ2Uoc3RhcnQsIGVuZCArIDEpO1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5yZXNwb25zZXMua2V5cygpLm5leHQoKS5kb25lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGluZXNUb0ZldGNoLnB1c2goLi4ubGluZXMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChsaW5lcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VMaW5lID0gdGhpcy5yZXNwb25zZXMuZ2V0KGxpbmVzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlTGluZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkRnJvbSA9IG9sZFJhbmdlLnN0YXJ0LmNvbHVtbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdGcm9tID0gbmV3UmFuZ2Uuc3RhcnQuY29sdW1uO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZW1vdmUocmVzcG9uc2VMaW5lLCAoc3BhbjogTW9kZWxzLkhpZ2hsaWdodFNwYW4pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3Bhbi5TdGFydExpbmUgPCBsaW5lc1swXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRDb2x1bW4gPj0gb2xkRnJvbSB8fCBzcGFuLkVuZENvbHVtbiA+PSBvbGRGcm9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3Bhbi5TdGFydENvbHVtbiA+PSBuZXdGcm9tIHx8IHNwYW4uRW5kQ29sdW1uID49IG5ld0Zyb20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWFjaChsaW5lcywgbGluZSA9PiB7IHRoaXMucmVzcG9uc2VzLmRlbGV0ZShsaW5lKTsgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGRlbHRhID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBOZXcgbGluZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb3VudCA9IGVkaXRvci5nZXRMaW5lQ291bnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGNvdW50IC0gMTsgaSA+IGVuZDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNwb25zZXMuaGFzKGkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGkgKyBkZWx0YSwgdGhpcy5yZXNwb25zZXMuZ2V0KGkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5kZWxldGUoaSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRlbHRhIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmVkIGxpbmVcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY291bnQgPSBlZGl0b3IuZ2V0TGluZUNvdW50KCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFic0RlbHRhID0gTWF0aC5hYnMoZGVsdGEpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gZW5kOyBpIDwgY291bnQ7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucmVzcG9uc2VzLmhhcyhpICsgYWJzRGVsdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGksIHRoaXMucmVzcG9uc2VzLmdldChpICsgYWJzRGVsdGEpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5kZWxldGUoaSArIGFic0RlbHRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHNldFJlc3BvbnNlcyh2YWx1ZTogTW9kZWxzLkhpZ2hsaWdodFNwYW5bXSwgZW5hYmxlRXhjbHVkZUNvZGU6IGJvb2xlYW4pIHtcbiAgICAgICAgY29uc3QgcmVzdWx0cyA9IGNoYWluKHZhbHVlKTtcblxuICAgICAgICBjb25zdCBncm91cGVkSXRlbXMgPSA8YW55PnJlc3VsdHMubWFwKGhpZ2hsaWdodCA9PiByYW5nZShoaWdobGlnaHQuU3RhcnRMaW5lLCBoaWdobGlnaHQuRW5kTGluZSArIDEpXG4gICAgICAgICAgICAubWFwKGxpbmUgPT4gKHsgbGluZSwgaGlnaGxpZ2h0IH0pKSlcbiAgICAgICAgICAgIC5mbGF0dGVuPHsgbGluZTogbnVtYmVyOyBoaWdobGlnaHQ6IE1vZGVscy5IaWdobGlnaHRTcGFuIH0+KClcbiAgICAgICAgICAgIC5ncm91cEJ5KHogPT4gei5saW5lKVxuICAgICAgICAgICAgLnZhbHVlKCk7XG5cbiAgICAgICAgZWFjaChncm91cGVkSXRlbXMsIChpdGVtOiB7IGhpZ2hsaWdodDogTW9kZWxzLkhpZ2hsaWdodFNwYW4gfVtdLCBrZXk6IG51bWJlcikgPT4ge1xuICAgICAgICAgICAgbGV0IGsgPSAra2V5LCBtYXBwZWRJdGVtID0gaXRlbS5tYXAoeCA9PiB4LmhpZ2hsaWdodCk7XG5cbiAgICAgICAgICAgIGlmICghZW5hYmxlRXhjbHVkZUNvZGUgfHwgc29tZShtYXBwZWRJdGVtLCBpID0+IGkuS2luZCA9PT0gXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiKSAmJiBldmVyeShtYXBwZWRJdGVtLCBpID0+IGkuS2luZCA9PT0gXCJleGNsdWRlZCBjb2RlXCIgfHwgaS5LaW5kID09PSBcInByZXByb2Nlc3NvciBrZXl3b3JkXCIpKSB7XG4gICAgICAgICAgICAgICAgbWFwcGVkSXRlbSA9IG1hcHBlZEl0ZW0uZmlsdGVyKHogPT4gei5LaW5kICE9PSBcImV4Y2x1ZGVkIGNvZGVcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5yZXNwb25zZXMuaGFzKGspKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGssIG1hcHBlZEl0ZW0pO1xuICAgICAgICAgICAgICAgIHRoaXMubGluZXNUb1Rva2VuaXplLnB1c2goayk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlTGluZSA9IHRoaXMucmVzcG9uc2VzLmdldChrKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VMaW5lLmxlbmd0aCAhPT0gbWFwcGVkSXRlbS5sZW5ndGggfHwgc29tZShyZXNwb25zZUxpbmUsIChsLCBpKSA9PiAhaXNFcXVhbChsLCBtYXBwZWRJdGVtW2ldKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGssIG1hcHBlZEl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5wdXNoKGspO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG59XG5cbi8qIHRzbGludDpkaXNhYmxlOm1lbWJlci1hY2Nlc3MgKi9cbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgKi9cbmV4dGVuZChHcmFtbWFyLnByb3RvdHlwZSwgQXRvbUdyYW1tYXIucHJvdG90eXBlKTtcblxuR3JhbW1hci5wcm90b3R5cGVbXCJvbW5pc2hhcnBcIl0gPSB0cnVlO1xuR3JhbW1hci5wcm90b3R5cGVbXCJ0b2tlbml6ZUxpbmVcIl0gPSBmdW5jdGlvbihsaW5lOiBzdHJpbmcsIHJ1bGVTdGFjazogYW55W10sIGZpcnN0TGluZSA9IGZhbHNlKTogeyB0YWdzOiBudW1iZXJbXTsgcnVsZVN0YWNrOiBhbnkgfSB7XG4gICAgY29uc3QgYmFzZVJlc3VsdCA9IEF0b21HcmFtbWFyLnByb3RvdHlwZS50b2tlbml6ZUxpbmUuY2FsbCh0aGlzLCBsaW5lLCBydWxlU3RhY2ssIGZpcnN0TGluZSk7XG4gICAgbGV0IHRhZ3M6IGFueVtdO1xuXG4gICAgaWYgKHRoaXMucmVzcG9uc2VzKSB7XG4gICAgICAgIGNvbnN0IHJvdyA9IHRoaXNbXCJfX3Jvd19fXCJdO1xuXG4gICAgICAgIGlmICghdGhpcy5yZXNwb25zZXMuaGFzKHJvdykpIHJldHVybiBiYXNlUmVzdWx0O1xuXG4gICAgICAgIGNvbnN0IGhpZ2hsaWdodHMgPSB0aGlzLnJlc3BvbnNlcy5nZXQocm93KTtcbiAgICAgICAgLy8gRXhjbHVkZWQgY29kZSBibG93cyBhd2F5IGFueSBvdGhlciBmb3JtYXR0aW5nLCBvdGhlcndpc2Ugd2UgZ2V0IGludG8gYSB2ZXJ5IHdlaXJkIHN0YXRlLlxuICAgICAgICBpZiAoaGlnaGxpZ2h0c1swXSAmJiBoaWdobGlnaHRzWzBdLktpbmQgPT09IFwiZXhjbHVkZWQgY29kZVwiKSB7XG4gICAgICAgICAgICB0YWdzID0gW2xpbmUubGVuZ3RoXTtcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0c1swXSwgMCwgdGFncy5sZW5ndGggLSAxLCBsaW5lKTtcbiAgICAgICAgICAgIGJhc2VSZXN1bHQucnVsZVN0YWNrID0gW2Jhc2VSZXN1bHQucnVsZVN0YWNrWzBdXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRhZ3MgPSB0aGlzLmdldENzVG9rZW5zRm9yTGluZShoaWdobGlnaHRzLCBsaW5lLCByb3csIHJ1bGVTdGFjaywgZmlyc3RMaW5lLCBiYXNlUmVzdWx0LnRhZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGJhc2VSZXN1bHQudGFncyA9IHRhZ3M7XG4gICAgfVxuICAgIHJldHVybiBiYXNlUmVzdWx0O1xufTtcblxuKEdyYW1tYXIucHJvdG90eXBlIGFzIGFueSkuZ2V0Q3NUb2tlbnNGb3JMaW5lID0gZnVuY3Rpb24oaGlnaGxpZ2h0czogTW9kZWxzLkhpZ2hsaWdodFNwYW5bXSwgbGluZTogc3RyaW5nLCByb3c6IG51bWJlciwgcnVsZVN0YWNrOiBhbnlbXSwgZmlyc3RMaW5lOiBib29sZWFuLCB0YWdzOiBudW1iZXJbXSkge1xuICAgIHJ1bGVTdGFjayA9IFt7IHJ1bGU6IHRoaXMuZ2V0SW5pdGlhbFJ1bGUoKSB9XTtcblxuICAgIGVhY2goaGlnaGxpZ2h0cywgKGhpZ2hsaWdodCkgPT4ge1xuICAgICAgICBjb25zdCBzdGFydCA9IGhpZ2hsaWdodC5TdGFydENvbHVtbiAtIDE7XG4gICAgICAgIGNvbnN0IGVuZCA9IGhpZ2hsaWdodC5FbmRDb2x1bW4gLSAxO1xuXG4gICAgICAgIGlmIChoaWdobGlnaHQuRW5kTGluZSA+IGhpZ2hsaWdodC5TdGFydExpbmUgJiYgaGlnaGxpZ2h0LlN0YXJ0Q29sdW1uID09PSAwICYmIGhpZ2hsaWdodC5FbmRDb2x1bW4gPT09IDApIHtcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0LCAwLCB0YWdzLmxlbmd0aCAtIDEsIGxpbmUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRpc3RhbmNlID0gLTE7XG4gICAgICAgIGxldCBpbmRleCA9IC0xO1xuICAgICAgICBsZXQgaTogbnVtYmVyO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRpc3RhbmNlICsgdGFnc1tpXSA+IHN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRpc3RhbmNlICs9IHRhZ3NbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzdHIgPSBsaW5lLnN1YnN0cmluZyhzdGFydCwgZW5kKTtcbiAgICAgICAgY29uc3Qgc2l6ZSA9IGVuZCAtIHN0YXJ0O1xuICAgICAgICBpZiAodGFnc1tpbmRleF0gPj0gc2l6ZSkge1xuICAgICAgICAgICAgbGV0IHZhbHVlczogbnVtYmVyW107XG4gICAgICAgICAgICBsZXQgcHJldjogbnVtYmVyLCBuZXh0OiBudW1iZXI7XG4gICAgICAgICAgICBpZiAoZGlzdGFuY2UgPT09IHN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgdmFsdWVzID0gW3NpemUsIHRhZ3NbaW5kZXhdIC0gc2l6ZV07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHByZXYgPSBzdGFydCAtIGRpc3RhbmNlO1xuICAgICAgICAgICAgICAgIG5leHQgPSB0YWdzW2luZGV4XSAtIHNpemUgLSBwcmV2O1xuICAgICAgICAgICAgICAgIGlmIChuZXh0ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbcHJldiwgc2l6ZSwgdGFnc1tpbmRleF0gLSBzaXplIC0gcHJldl07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzID0gW3ByZXYsIHNpemVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRhZ3Muc3BsaWNlKGluZGV4LCAxLCAuLi52YWx1ZXMpO1xuICAgICAgICAgICAgaWYgKHByZXYpIGluZGV4ID0gaW5kZXggKyAxO1xuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIGluZGV4LCBpbmRleCArIDEsIHN0cik7XG4gICAgICAgIH0gZWxzZSBpZiAodGFnc1tpbmRleF0gPCBzaXplKSB7XG4gICAgICAgICAgICBsZXQgYmFja3RyYWNrSW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgIGxldCBiYWNrdHJhY2tEaXN0YW5jZSA9IDA7XG4gICAgICAgICAgICBmb3IgKGkgPSBiYWNrdHJhY2tJbmRleDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJhY2t0cmFja0Rpc3RhbmNlID49IHNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0luZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0Rpc3RhbmNlICs9IHRhZ3NbaV07XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YWdzW2ldICUgMiA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYmFja3RyYWNrRGlzdGFuY2UgPj0gc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja3RyYWNrSW5kZXggPSBpICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoaSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBmb3J3YXJkdHJhY2tJbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgbGV0IHJlbWFpbmluZ1NpemUgPSBzaXplO1xuICAgICAgICAgICAgZm9yIChpID0gaW5kZXggKyAxOyBpIDwgdGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICgocmVtYWluaW5nU2l6ZSA8PSAwICYmIHRhZ3NbaV0gPiAwKS8qIHx8IHRhZ3NbaV0gJSAyID09PSAtMSovKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvcndhcmR0cmFja0luZGV4ID0gaSAtIDE7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVtYWluaW5nU2l6ZSAtPSB0YWdzW2ldO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGFnc1tpXSAlIDIgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSGFuZGxlcyBjYXNlIHdoZXJlIHRoZXJlIGlzIGEgY2xvc2luZyB0YWdcbiAgICAgICAgICAgICAgICAgICAgLy8gYnV0IG5vIG9wZW5pbmcgdGFnIGhlcmUuXG4gICAgICAgICAgICAgICAgICAgIGxldCBvcGVuRm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaCA9IGk7IGggPj0gMDsgaC0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFnc1toXSA9PT0gdGFnc1tpXSArIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuRm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghb3BlbkZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IGkgLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpID09PSB0YWdzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGZvcndhcmR0cmFja0luZGV4ID0gdGFncy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBnZXRBdG9tU3R5bGVGb3JUb2tlbih0aGlzLm5hbWUsIHRhZ3MsIGhpZ2hsaWdodCwgYmFja3RyYWNrSW5kZXgsIGZvcndhcmR0cmFja0luZGV4LCBzdHIpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdGFncztcbn07XG5cbmNvbnN0IGdldElkRm9yU2NvcGUgPSAoZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgaWRzOiB7IFtrZXk6IHN0cmluZ106IHsgW2tleTogc3RyaW5nXTogbnVtYmVyIH07IH0gPSB7fTtcbiAgICBjb25zdCBncmFtbWFyczogYW55ID0ge307XG5cbiAgICBmdW5jdGlvbiBidWlsZFNjb3Blc0ZvckdyYW1tYXIoZ3JhbW1hck5hbWU6IHN0cmluZykge1xuICAgICAgICBjb25zdCBncmFtbWFyID0gZmluZChhdG9tLmdyYW1tYXJzLmdldEdyYW1tYXJzKCksIGdhbW1yID0+IGdhbW1yLm5hbWUgPT09IGdyYW1tYXJOYW1lKTtcbiAgICAgICAgaWYgKCFncmFtbWFyKSByZXR1cm47XG5cbiAgICAgICAgaWRzW2dyYW1tYXIubmFtZV0gPSB7fTtcbiAgICAgICAgZ3JhbW1hcnNbZ3JhbW1hci5uYW1lXSA9IGdyYW1tYXI7XG5cbiAgICAgICAgZWFjaChncmFtbWFyLnJlZ2lzdHJ5LnNjb3Blc0J5SWQsICh2YWx1ZTogc3RyaW5nLCBrZXk6IGFueSkgPT4geyBpZHNbZ3JhbW1hci5uYW1lXVt2YWx1ZV0gPSAra2V5OyB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBtZXRob2QgPSAoZ3JhbW1hcjogc3RyaW5nLCBzY29wZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGlmICghaWRzW2dyYW1tYXJdKSB7XG4gICAgICAgICAgICBidWlsZFNjb3Blc0ZvckdyYW1tYXIoZ3JhbW1hcik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWlkc1tncmFtbWFyXVtzY29wZV0pXG4gICAgICAgICAgICBpZHNbZ3JhbW1hcl1bc2NvcGVdID0gZ3JhbW1hcnNbZ3JhbW1hcl0ucmVnaXN0cnkuc3RhcnRJZEZvclNjb3BlKHNjb3BlKTtcblxuICAgICAgICByZXR1cm4gK2lkc1tncmFtbWFyXVtzY29wZV07XG4gICAgfTtcblxuICAgICg8YW55Pm1ldGhvZCkuZW5kID0gKHNjb3BlOiBudW1iZXIpID0+ICtzY29wZSAtIDE7XG5cbiAgICByZXR1cm4gPHsgKGdyYW1tYXI6IHN0cmluZywgc2NvcGU6IHN0cmluZyk6IG51bWJlcjsgZW5kOiAoc2NvcGU6IG51bWJlcikgPT4gbnVtYmVyOyB9Pm1ldGhvZDtcbn0pKCk7XG5cblxuLy8vIE5PVEU6IGJlc3Qgd2F5IEkgaGF2ZSBmb3VuZCBmb3IgdGhlc2UgaXMgdG8ganVzdCBsb29rIGF0IHRoZW1lIFwibGVzc1wiIGZpbGVzXG4vLyBBbHRlcm5hdGl2ZWx5IGp1c3QgaW5zcGVjdCB0aGUgdG9rZW4gZm9yIGEgLmpzIGZpbGVcbmZ1bmN0aW9uIGdldEF0b21TdHlsZUZvclRva2VuKGdyYW1tYXI6IHN0cmluZywgdGFnczogbnVtYmVyW10sIHRva2VuOiBNb2RlbHMuSGlnaGxpZ2h0U3BhbiwgaW5kZXg6IG51bWJlciwgaW5kZXhFbmQ6IG51bWJlciwgc3RyOiBzdHJpbmcpIHtcbiAgICBjb25zdCBwcmV2aW91c1Njb3BlczogYW55W10gPSBbXTtcbiAgICBmb3IgKGxldCBpID0gaW5kZXggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBpZiAodGFnc1tpXSA+IDApXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgcHJldmlvdXNTY29wZXMucHVzaCh0YWdzW2ldKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXBsYWNlbWVudHM6IHsgc3RhcnQ6IG51bWJlcjsgZW5kOiBudW1iZXI7IHJlcGxhY2VtZW50OiBudW1iZXJbXSB9W10gPSBbXTtcbiAgICBjb25zdCBvcGVuczogeyB0YWc6IG51bWJlcjsgaW5kZXg6IG51bWJlciB9W10gPSBbXTtcbiAgICBjb25zdCBjbG9zZXM6IHR5cGVvZiBvcGVucyA9IFtdO1xuXG4gICAgLy8gU2NhbiBmb3IgYW55IHVuY2xvc2VkIG9yIHVub3BlbmVkIHRhZ3NcbiAgICBmb3IgKGxldCBpID0gaW5kZXg7IGkgPCBpbmRleEVuZDsgaSsrKSB7XG4gICAgICAgIGlmICh0YWdzW2ldID4gMCkgY29udGludWU7XG4gICAgICAgIGlmICh0YWdzW2ldICUgMiA9PT0gMCkge1xuICAgICAgICAgICAgY29uc3Qgb3BlbkluZGV4ID0gZmluZEluZGV4KG9wZW5zLCB4ID0+IHgudGFnID09PSAodGFnc1tpXSArIDEpKTtcbiAgICAgICAgICAgIGlmIChvcGVuSW5kZXggPiAtMSkge1xuICAgICAgICAgICAgICAgIG9wZW5zLnNwbGljZShvcGVuSW5kZXgsIDEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbG9zZXMucHVzaCh7IHRhZzogdGFnc1tpXSwgaW5kZXg6IGkgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvcGVucy51bnNoaWZ0KHsgdGFnOiB0YWdzW2ldLCBpbmRleDogaSB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGxldCB1bmZ1bGxmaWxsZWQ6IHR5cGVvZiBvcGVucyA9IFtdO1xuICAgIGlmIChjbG9zZXMubGVuZ3RoID4gMCkge1xuICAgICAgICB1bmZ1bGxmaWxsZWQgPSBzb3J0Qnkob3BlbnMuY29uY2F0KGNsb3NlcyksIHggPT4geC5pbmRleCk7XG4gICAgfSBlbHNlIGlmIChvcGVucy5sZW5ndGggPiAwKSB7XG4gICAgICAgIC8vIEdyYWIgdGhlIGxhc3Qga25vd24gb3BlbiwgYW5kIGFwcGVuZCBmcm9tIHRoZXJlXG4gICAgICAgIHJlcGxhY2VtZW50cy51bnNoaWZ0KHtcbiAgICAgICAgICAgIHN0YXJ0OiBvcGVuc1tvcGVucy5sZW5ndGggLSAxXS5pbmRleCxcbiAgICAgICAgICAgIGVuZDogaW5kZXhFbmQsXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShvcGVuc1tvcGVucy5sZW5ndGggLSAxXS5pbmRleCwgaW5kZXhFbmQgKyAxKVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBsZXQgaW50ZXJuYWxJbmRleCA9IGluZGV4O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdW5mdWxsZmlsbGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHYgPSB1bmZ1bGxmaWxsZWRbaV07XG4gICAgICAgIHJlcGxhY2VtZW50cy51bnNoaWZ0KHtcbiAgICAgICAgICAgIHN0YXJ0OiBpbnRlcm5hbEluZGV4LFxuICAgICAgICAgICAgZW5kOiB2LmluZGV4LFxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2UoaW50ZXJuYWxJbmRleCwgdi5pbmRleClcbiAgICAgICAgfSk7XG4gICAgICAgIGludGVybmFsSW5kZXggPSB2LmluZGV4ICsgMTtcbiAgICB9XG5cbiAgICBpZiAocmVwbGFjZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XG4gICAgICAgICAgICBzdGFydDogaW5kZXgsXG4gICAgICAgICAgICBlbmQ6IGluZGV4RW5kLFxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2UoaW5kZXgsIGluZGV4RW5kKVxuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvKnJlcGxhY2VtZW50cy51bnNoaWZ0KHtcbiAgICAgICAgICAgIHN0YXJ0OiBpbnRlcm5hbEluZGV4LFxuICAgICAgICAgICAgZW5kOiBpbmRleEVuZCxcbiAgICAgICAgICAgIHJlcGxhY2VtZW50OiB0YWdzLnNsaWNlKGludGVybmFsSW5kZXgsIGluZGV4RW5kKVxuICAgICAgICB9KTsqL1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZChzY29wZTogYW55KSB7XG4gICAgICAgIGNvbnN0IGlkID0gZ2V0SWRGb3JTY29wZShncmFtbWFyLCBzY29wZSk7XG4gICAgICAgIGlmIChpZCA9PT0gLTEpIHJldHVybjtcblxuICAgICAgICBpZiAoIXNvbWUocHJldmlvdXNTY29wZXMsIHogPT4geiA9PT0gaWQpKSB7XG4gICAgICAgICAgICBwcmV2aW91c1Njb3Blcy5wdXNoKGlkKTtcbiAgICAgICAgfVxuICAgICAgICBlYWNoKHJlcGxhY2VtZW50cywgY3R4ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gY3R4LnJlcGxhY2VtZW50O1xuICAgICAgICAgICAgcmVwbGFjZW1lbnQudW5zaGlmdChpZCk7XG4gICAgICAgICAgICByZXBsYWNlbWVudC5wdXNoKGdldElkRm9yU2NvcGUuZW5kKGlkKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzd2l0Y2ggKHRva2VuLktpbmQpIHtcbiAgICAgICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgICAgICAgYWRkKGBjb25zdGFudC5udW1lcmljYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInN0cnVjdCBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY29uc3RhbnQubnVtZXJpYy5pZGVudGlmaWVyLnN0cnVjdGApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJlbnVtIG5hbWVcIjpcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jb25zdGFudC5udW1lcmljLmlkZW50aWZpZXIuZW51bWApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJpZGVudGlmaWVyXCI6XG4gICAgICAgICAgICBhZGQoYGlkZW50aWZpZXJgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiY2xhc3MgbmFtZVwiOlxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNsYXNzLnR5cGUuaWRlbnRpZmllcmApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJkZWxlZ2F0ZSBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyLmRlbGVnYXRlYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImludGVyZmFjZSBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyLmludGVyZmFjZWApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiOlxuICAgICAgICAgICAgYWRkKGBjb25zdGFudC5vdGhlci5zeW1ib2xgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZXhjbHVkZWQgY29kZVwiOlxuICAgICAgICAgICAgYWRkKGBjb21tZW50LmJsb2NrYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInVudXNlZCBjb2RlXCI6XG4gICAgICAgICAgICBhZGQoYHVudXNlZGApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInVuaGFuZGxlZCBLaW5kIFwiICsgdG9rZW4uS2luZCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBlYWNoKHJlcGxhY2VtZW50cywgY3R4ID0+IHtcbiAgICAgICAgY29uc3Qge3JlcGxhY2VtZW50LCBlbmQsIHN0YXJ0fSA9IGN0eDtcbiAgICAgICAgaWYgKHJlcGxhY2VtZW50Lmxlbmd0aCA9PT0gMikgcmV0dXJuO1xuICAgICAgICBsZXQgbnVtID0gZW5kIC0gc3RhcnQ7XG4gICAgICAgIGlmIChudW0gPD0gMCkge1xuICAgICAgICAgICAgbnVtID0gMTtcbiAgICAgICAgfVxuICAgICAgICB0YWdzLnNwbGljZShzdGFydCwgbnVtLCAuLi5yZXBsYWNlbWVudCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHNldEdyYW1tYXIoZ3JhbW1hcjogRmlyc3RNYXRlLkdyYW1tYXIpOiBGaXJzdE1hdGUuR3JhbW1hciB7XG4gICAgY29uc3QgZzIgPSBnZXRFbmhhbmNlZEdyYW1tYXIodGhpcywgZ3JhbW1hcik7XG4gICAgaWYgKGcyICE9PSBncmFtbWFyKVxuICAgICAgICB0aGlzLl9zZXRHcmFtbWFyKGcyKTtcbiAgICByZXR1cm4gZzI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFbmhhbmNlZEdyYW1tYXIoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGdyYW1tYXI/OiBGaXJzdE1hdGUuR3JhbW1hciwgb3B0aW9ucz86IHsgcmVhZG9ubHk6IGJvb2xlYW4gfSkge1xuICAgIGlmICghZ3JhbW1hcikgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XG4gICAgaWYgKCFncmFtbWFyW1wib21uaXNoYXJwXCJdICYmIE9tbmkuaXNWYWxpZEdyYW1tYXIoZ3JhbW1hcikpIHtcbiAgICAgICAgY29uc3QgbmV3R3JhbW1hciA9IG5ldyBHcmFtbWFyKGVkaXRvciwgZ3JhbW1hciwgb3B0aW9ucyk7XG4gICAgICAgIGVhY2goZ3JhbW1hciwgKHgsIGkpID0+IGhhcyhncmFtbWFyLCBpKSAmJiAobmV3R3JhbW1hcltpXSA9IHgpKTtcbiAgICAgICAgZ3JhbW1hciA9IDxhbnk+bmV3R3JhbW1hcjtcbiAgICB9XG4gICAgcmV0dXJuIGdyYW1tYXI7XG59XG5cbi8vIFVzZWQgdG8gY2FjaGUgdmFsdWVzIGZvciBzcGVjaWZpYyBlZGl0b3JzXG5jbGFzcyBVbnVzZWRNYXAge1xuICAgIHByaXZhdGUgX21hcCA9IG5ldyBNYXA8c3RyaW5nLCBPYnNlcnZhYmxlPE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4+KCk7XG4gICAgcHVibGljIGdldChrZXk6IHN0cmluZykge1xuICAgICAgICBpZiAoIXRoaXMuX21hcC5oYXMoa2V5KSkgdGhpcy5fbWFwLnNldChrZXksIDxhbnk+bmV3IEJlaGF2aW9yU3ViamVjdDxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+KFtdKSk7XG4gICAgICAgIHJldHVybiB0aGlzLl9tYXAuZ2V0KGtleSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0T2JzZXJ2ZXIoa2V5OiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIDxTdWJzY3JpYmVyPE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4gJiB7IGdldFZhbHVlKCk6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSB9Pjxhbnk+dGhpcy5nZXQoa2V5KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0KGtleTogc3RyaW5nLCB2YWx1ZT86IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSkge1xuICAgICAgICBjb25zdCBvID0gdGhpcy5fZ2V0T2JzZXJ2ZXIoa2V5KTtcbiAgICAgICAgaWYgKCFpc0VxdWFsKG8uZ2V0VmFsdWUoKSwgdmFsdWUpKSB7XG4gICAgICAgICAgICBvLm5leHQodmFsdWUgfHwgW10pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZWxldGUoa2V5OiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMuX21hcC5oYXMoa2V5KSlcbiAgICAgICAgICAgIHRoaXMuX21hcC5kZWxldGUoa2V5KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuX21hcC5jbGVhcigpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IGVuaGFuY2VkSGlnaGxpZ2h0aW5nID0gbmV3IEhpZ2hsaWdodDtcbiIsImltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IGlzT21uaXNoYXJwVGV4dEVkaXRvciB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XG5pbXBvcnQgeyBlYWNoLCBleHRlbmQsIGhhcywgc29tZSwgcmFuZ2UsIHJlbW92ZSwgcHVsbCwgZmluZCwgY2hhaW4sIHVuaXEsIGZpbmRJbmRleCwgZXZlcnksIGlzRXF1YWwsIG1pbiwgZGVib3VuY2UsIHNvcnRCeSwgdW5pcXVlSWQsIGZpbHRlciB9IGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QsIFJlcGxheVN1YmplY3QsIEJlaGF2aW9yU3ViamVjdCB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IHJlZ2lzdGVyQ29udGV4dEl0ZW0gfSBmcm9tIFwiLi4vc2VydmVyL29tbmlzaGFycC10ZXh0LWVkaXRvclwiO1xuY29uc3QgQXRvbUdyYW1tYXIgPSByZXF1aXJlKGF0b20uY29uZmlnLnJlc291cmNlUGF0aCArIFwiL25vZGVfbW9kdWxlcy9maXJzdC1tYXRlL2xpYi9ncmFtbWFyLmpzXCIpO1xuY29uc3QgREVCT1VOQ0VfVElNRSA9IDI0MDtcbmxldCBmYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XG5jb25zdCBISUdITElHSFQgPSBcIkhJR0hMSUdIVFwiLCBISUdITElHSFRfUkVRVUVTVCA9IFwiSElHSExJR0hUX1JFUVVFU1RcIjtcbmZ1bmN0aW9uIGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhwYXRoLCBxdWlja0ZpeGVzLCBwcm9qZWN0TmFtZXMpIHtcbiAgICByZXR1cm4gY2hhaW4ocXVpY2tGaXhlcylcbiAgICAgICAgLmZpbHRlcih4ID0+IHguRmlsZU5hbWUgPT09IHBhdGgpXG4gICAgICAgIC5tYXAoeCA9PiAoe1xuICAgICAgICBTdGFydExpbmU6IHguTGluZSxcbiAgICAgICAgU3RhcnRDb2x1bW46IHguQ29sdW1uLFxuICAgICAgICBFbmRMaW5lOiB4LkVuZExpbmUsXG4gICAgICAgIEVuZENvbHVtbjogeC5FbmRDb2x1bW4sXG4gICAgICAgIEtpbmQ6IFwidW51c2VkIGNvZGVcIixcbiAgICAgICAgUHJvamVjdHM6IHByb2plY3ROYW1lc1xuICAgIH0pKVxuICAgICAgICAudmFsdWUoKTtcbn1cbmV4cG9ydCBjb25zdCBFeGNsdWRlQ2xhc3NpZmljYXRpb25zID0gW1xuICAgIDIsXG4gICAgMyxcbiAgICA1LFxuICAgIDQsXG4gICAgNlxuXTtcbmNsYXNzIEhpZ2hsaWdodCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3MgPSBuZXcgVW51c2VkTWFwKCk7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiRW5oYW5jZWQgSGlnaGxpZ2h0aW5nXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkVuYWJsZXMgc2VydmVyIGJhc2VkIGhpZ2hsaWdodGluZywgd2hpY2ggaW5jbHVkZXMgc3VwcG9ydCBmb3Igc3RyaW5nIGludGVycG9sYXRpb24sIGNsYXNzIG5hbWVzIGFuZCBtb3JlLlwiO1xuICAgICAgICB0aGlzLmRlZmF1bHQgPSBmYWxzZTtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZWRpdG9ycyA9IFtdO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHJlZ2lzdGVyQ29udGV4dEl0ZW0oSElHSExJR0hUX1JFUVVFU1QsIChjb250ZXh0KSA9PiBuZXcgU3ViamVjdCgpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQocmVnaXN0ZXJDb250ZXh0SXRlbShISUdITElHSFQsIChjb250ZXh0LCBlZGl0b3IpID0+IGNvbnRleHQuZ2V0KEhJR0hMSUdIVF9SRVFVRVNUKVxuICAgICAgICAgICAgLnN0YXJ0V2l0aCh0cnVlKVxuICAgICAgICAgICAgLnN3aXRjaE1hcCgoKSA9PiBPYnNlcnZhYmxlLmRlZmVyKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHByb2plY3RzID0gY29udGV4dC5wcm9qZWN0LmFjdGl2ZUZyYW1ld29yay5OYW1lID09PSBcImFsbFwiID8gW10gOiBbY29udGV4dC5wcm9qZWN0LmFjdGl2ZUZyYW1ld29yay5OYW1lXTtcbiAgICAgICAgICAgIGxldCBsaW5lc1RvRmV0Y2ggPSB1bmlxKGVkaXRvci5nZXRHcmFtbWFyKCkubGluZXNUb0ZldGNoKTtcbiAgICAgICAgICAgIGlmICghbGluZXNUb0ZldGNoIHx8ICFsaW5lc1RvRmV0Y2gubGVuZ3RoKVxuICAgICAgICAgICAgICAgIGxpbmVzVG9GZXRjaCA9IFtdO1xuICAgICAgICAgICAgdGhpcy51bnVzZWRDb2RlUm93cy5zZXQoZWRpdG9yLmdldFBhdGgoKSwgW10pO1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuY29tYmluZUxhdGVzdCh0aGlzLnVudXNlZENvZGVSb3dzLmdldChlZGl0b3IuZ2V0UGF0aCgpKSwgT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uaGlnaGxpZ2h0KHtcbiAgICAgICAgICAgICAgICBQcm9qZWN0TmFtZXM6IHByb2plY3RzLFxuICAgICAgICAgICAgICAgIExpbmVzOiBsaW5lc1RvRmV0Y2gsXG4gICAgICAgICAgICAgICAgRXhjbHVkZUNsYXNzaWZpY2F0aW9uc1xuICAgICAgICAgICAgfSkpLCAocXVpY2tmaXhlcywgcmVzcG9uc2UpID0+ICh7XG4gICAgICAgICAgICAgICAgZWRpdG9yLFxuICAgICAgICAgICAgICAgIHByb2plY3RzLFxuICAgICAgICAgICAgICAgIGhpZ2hsaWdodHM6IChyZXNwb25zZSA/IHJlc3BvbnNlLkhpZ2hsaWdodHMgOiBbXSkuY29uY2F0KGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhlZGl0b3IuZ2V0UGF0aCgpLCBxdWlja2ZpeGVzLCBwcm9qZWN0cykpXG4gICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAuZG8oKHsgaGlnaGxpZ2h0cyB9KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKSB7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkuc2V0UmVzcG9uc2VzKGhpZ2hsaWdodHMsIHByb2plY3RzLmxlbmd0aCA+IDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gT2JzZXJ2YWJsZS5yYWNlKGNvbnRleHQuc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5jb2RlY2hlY2suZGVsYXkoNDAwMCksIGNvbnRleHQuc29sdXRpb24ub2JzZXJ2ZS5jb2RlY2hlY2tcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHggPT4geC5yZXF1ZXN0LkZpbGVOYW1lID09PSBlZGl0b3IuZ2V0UGF0aCgpKVxuICAgICAgICAgICAgICAgIC5tYXAoeCA9PiAoeC5yZXNwb25zZSAmJiB4LnJlc3BvbnNlLlF1aWNrRml4ZXMgfHwgW10pKSlcbiAgICAgICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgICAgIC5kbygodmFsdWUpID0+IHRoaXMudW51c2VkQ29kZVJvd3Muc2V0KGVkaXRvci5nZXRQYXRoKCksIGZpbHRlcih2YWx1ZSwgeCA9PiB4LkxvZ0xldmVsID09PSBcIkhpZGRlblwiKSkpKVxuICAgICAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpXG4gICAgICAgICAgICAgICAgLnJlZkNvdW50KCk7XG4gICAgICAgIH0pKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZWFjaEVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zZXR1cEVkaXRvcihlZGl0b3IsIGNkKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub21uaXNoYXJwLnByb2plY3RcbiAgICAgICAgICAgICAgICAub2JzZXJ2ZS5hY3RpdmVGcmFtZXdvcmtcbiAgICAgICAgICAgICAgICAuc2tpcCgxKVxuICAgICAgICAgICAgICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCgpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5nZXQoSElHSExJR0hUX1JFUVVFU1QpLm5leHQodHJ1ZSk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9tbmlzaGFycFxuICAgICAgICAgICAgICAgIC5nZXQoSElHSExJR0hUKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcInNpbGVudFJldG9rZW5pemVMaW5lc1wiXSgpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcbiAgICAgICAgICAgIGlmIChlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJzaWxlbnRSZXRva2VuaXplTGluZXNcIl0pIHtcbiAgICAgICAgICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJzaWxlbnRSZXRva2VuaXplTGluZXNcIl0oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIuY29kZWNoZWNrXG4gICAgICAgICAgICAuZmxhdE1hcCh4ID0+IHgucmVzcG9uc2UgJiYgeC5yZXNwb25zZS5RdWlja0ZpeGVzIHx8IFtdKVxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IHguTG9nTGV2ZWwgPT09IFwiSGlkZGVuXCIpXG4gICAgICAgICAgICAuZ3JvdXBCeSh4ID0+IHguRmlsZU5hbWUsIHggPT4geClcbiAgICAgICAgICAgIC5mbGF0TWFwKHggPT4geC50b0FycmF5KCksICh7IGtleSB9LCByZXN1bHQpID0+ICh7IGtleSwgcmVzdWx0IH0pKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoeyBrZXksIHJlc3VsdCB9KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLnNldChrZXksIHJlc3VsdCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnVudXNlZENvZGVSb3dzLmNsZWFyKCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXR1cEVkaXRvcihlZGl0b3IsIGRpc3Bvc2FibGUpIHtcbiAgICAgICAgaWYgKGVkaXRvcltcIl9vbGRHcmFtbWFyXCJdIHx8ICFlZGl0b3IuZ2V0R3JhbW1hcilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgaXNzdWVSZXF1ZXN0ID0gZWRpdG9yLm9tbmlzaGFycC5nZXQoSElHSExJR0hUX1JFUVVFU1QpO1xuICAgICAgICBhdWdtZW50RWRpdG9yKGVkaXRvciwgdGhpcy51bnVzZWRDb2RlUm93cywgdHJ1ZSk7XG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMudW51c2VkQ29kZVJvd3MuZGVsZXRlKGVkaXRvci5nZXRQYXRoKCkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZWRpdG9ycy5wdXNoKGVkaXRvcik7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzcG9zYWJsZSk7XG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkubGluZXNUb0ZldGNoID0gW107XG4gICAgICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIoKS5yZXNwb25zZXMpXG4gICAgICAgICAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKS5yZXNwb25zZXMuY2xlYXIoKTtcbiAgICAgICAgICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlci5yZXRva2VuaXplTGluZXMoKTtcbiAgICAgICAgICAgIGRlbGV0ZSBlZGl0b3JbXCJfb2xkR3JhbW1hclwiXTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4ge1xuICAgICAgICAgICAgcHVsbCh0aGlzLmVkaXRvcnMsIGVkaXRvcik7XG4gICAgICAgIH0pKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9tbmlzaGFycC5wcm9qZWN0XG4gICAgICAgICAgICAub2JzZXJ2ZS5hY3RpdmVGcmFtZXdvcmtcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKS5saW5lc1RvRmV0Y2ggPSBbXTtcbiAgICAgICAgICAgIGlmIChlZGl0b3IuZ2V0R3JhbW1hcigpLnJlc3BvbnNlcylcbiAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLnJlc3BvbnNlcy5jbGVhcigpO1xuICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkU3RvcENoYW5naW5nKCgpID0+IGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpKSk7XG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZFNhdmUoKCkgPT4ge1xuICAgICAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKS5saW5lc1RvRmV0Y2ggPSBbXTtcbiAgICAgICAgICAgIGlzc3VlUmVxdWVzdC5uZXh0KHRydWUpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb25cbiAgICAgICAgICAgIC53aGVuQ29ubmVjdGVkKClcbiAgICAgICAgICAgIC5kZWxheSgxMDAwKVxuICAgICAgICAgICAgLnN1YnNjcmliZSh7IGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaXNzdWVSZXF1ZXN0Lm5leHQodHJ1ZSk7XG4gICAgICAgICAgICB9IH0pKTtcbiAgICB9XG59XG5leHBvcnQgZnVuY3Rpb24gYXVnbWVudEVkaXRvcihlZGl0b3IsIHVudXNlZENvZGVSb3dzID0gbnVsbCwgZG9TZXRHcmFtbWFyID0gZmFsc2UpIHtcbiAgICBpZiAoIWVkaXRvcltcIl9vbGRHcmFtbWFyXCJdKVxuICAgICAgICBlZGl0b3JbXCJfb2xkR3JhbW1hclwiXSA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XG4gICAgaWYgKCFlZGl0b3JbXCJfc2V0R3JhbW1hclwiXSlcbiAgICAgICAgZWRpdG9yW1wiX3NldEdyYW1tYXJcIl0gPSBlZGl0b3Iuc2V0R3JhbW1hcjtcbiAgICBpZiAoIWVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcIl9idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dFwiXSlcbiAgICAgICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX2J1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0XCJdID0gZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLmJ1aWxkVG9rZW5pemVkTGluZUZvclJvd1dpdGhUZXh0O1xuICAgIGlmICghZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX21hcmtUb2tlbml6YXRpb25Db21wbGV0ZVwiXSlcbiAgICAgICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX21hcmtUb2tlbml6YXRpb25Db21wbGV0ZVwiXSA9IGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlci5tYXJrVG9rZW5pemF0aW9uQ29tcGxldGU7XG4gICAgaWYgKCFlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdKVxuICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfcmV0b2tlbml6ZUxpbmVzXCJdID0gZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLnJldG9rZW5pemVMaW5lcztcbiAgICBpZiAoIWVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcIl90b2tlbml6ZUluQmFja2dyb3VuZFwiXSlcbiAgICAgICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX3Rva2VuaXplSW5CYWNrZ3JvdW5kXCJdID0gZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLnRva2VuaXplSW5CYWNrZ3JvdW5kO1xuICAgIGlmICghZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiX2NodW5rU2l6ZVwiXSlcbiAgICAgICAgZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyW1wiY2h1bmtTaXplXCJdID0gMjA7XG4gICAgZWRpdG9yLnNldEdyYW1tYXIgPSBzZXRHcmFtbWFyO1xuICAgIGlmIChkb1NldEdyYW1tYXIpXG4gICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKGVkaXRvci5nZXRHcmFtbWFyKCkpO1xuICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlci5idWlsZFRva2VuaXplZExpbmVGb3JSb3dXaXRoVGV4dCA9IGZ1bmN0aW9uIChyb3cpIHtcbiAgICAgICAgZWRpdG9yLmdldEdyYW1tYXIoKVtcIl9fcm93X19cIl0gPSByb3c7XG4gICAgICAgIHJldHVybiBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfYnVpbGRUb2tlbml6ZWRMaW5lRm9yUm93V2l0aFRleHRcIl0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIGlmICghZWRpdG9yLmRpc3BsYXlCdWZmZXIudG9rZW5pemVkQnVmZmVyLnNpbGVudFJldG9rZW5pemVMaW5lcykge1xuICAgICAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIuc2lsZW50UmV0b2tlbml6ZUxpbmVzID0gZGVib3VuY2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGVkaXRvci5nZXRHcmFtbWFyKCkuaXNPYnNlcnZlUmV0b2tlbml6aW5nKVxuICAgICAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQoZmFsc2UpO1xuICAgICAgICAgICAgbGV0IGxhc3RSb3c7XG4gICAgICAgICAgICBsYXN0Um93ID0gdGhpcy5idWZmZXIuZ2V0TGFzdFJvdygpO1xuICAgICAgICAgICAgdGhpcy50b2tlbml6ZWRMaW5lcyA9IHRoaXMuYnVpbGRQbGFjZWhvbGRlclRva2VuaXplZExpbmVzRm9yUm93cygwLCBsYXN0Um93KTtcbiAgICAgICAgICAgIHRoaXMuaW52YWxpZFJvd3MgPSBbXTtcbiAgICAgICAgICAgIGlmICh0aGlzLmxpbmVzVG9Ub2tlbml6ZSAmJiB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVSb3cobWluKHRoaXMubGluZXNUb1Rva2VuaXplKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmludmFsaWRhdGVSb3coMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmZ1bGx5VG9rZW5pemVkID0gZmFsc2U7XG4gICAgICAgIH0sIERFQk9VTkNFX1RJTUUsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSk7XG4gICAgfVxuICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlci5tYXJrVG9rZW5pemF0aW9uQ29tcGxldGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChlZGl0b3IuZ2V0R3JhbW1hcigpLmlzT2JzZXJ2ZVJldG9rZW5pemluZylcbiAgICAgICAgICAgIGVkaXRvci5nZXRHcmFtbWFyKCkuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQodHJ1ZSk7XG4gICAgICAgIHJldHVybiBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXJbXCJfbWFya1Rva2VuaXphdGlvbkNvbXBsZXRlXCJdLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgICBlZGl0b3IuZGlzcGxheUJ1ZmZlci50b2tlbml6ZWRCdWZmZXIucmV0b2tlbml6ZUxpbmVzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoZWRpdG9yLmdldEdyYW1tYXIoKS5pc09ic2VydmVSZXRva2VuaXppbmcpXG4gICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLmlzT2JzZXJ2ZVJldG9rZW5pemluZy5uZXh0KGZhbHNlKTtcbiAgICAgICAgcmV0dXJuIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlcltcIl9yZXRva2VuaXplTGluZXNcIl0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlci50b2tlbml6ZUluQmFja2dyb3VuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnZpc2libGUgfHwgdGhpcy5wZW5kaW5nQ2h1bmsgfHwgIXRoaXMuaXNBbGl2ZSgpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLnBlbmRpbmdDaHVuayA9IHRydWU7XG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucGVuZGluZ0NodW5rID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5pc0FsaXZlKCkgJiYgdGhpcy5idWZmZXIuaXNBbGl2ZSgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50b2tlbml6ZU5leHRDaHVuaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIGVkaXRvci5kaXNwbGF5QnVmZmVyLnRva2VuaXplZEJ1ZmZlci5zY29wZXNGcm9tVGFncyA9IGZ1bmN0aW9uIChzdGFydGluZ1Njb3BlcywgdGFncykge1xuICAgICAgICBjb25zdCBzY29wZXMgPSBzdGFydGluZ1Njb3Blcy5zbGljZSgpO1xuICAgICAgICBjb25zdCBncmFtbWFyID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHRhZ3MubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHRhZyA9IHRhZ3NbaV07XG4gICAgICAgICAgICBpZiAodGFnIDwgMCkge1xuICAgICAgICAgICAgICAgIGlmICgodGFnICUgMikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3Blcy5wdXNoKHRhZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGluZ1N0YXJ0VGFnID0gdGFnICsgMTtcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZXMucG9wKCkgPT09IG1hdGNoaW5nU3RhcnRUYWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzY29wZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGVzLnB1c2goZ3JhbW1hci5zdGFydElkRm9yU2NvcGUoYC4ke2dyYW1tYXIuc2NvcGVOYW1lfWApKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oXCJFbmNvdW50ZXJlZCBhbiB1bm1hdGNoZWQgc2NvcGUgZW5kIHRhZy5cIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlUGF0aDogZWRpdG9yLmJ1ZmZlci5nZXRQYXRoKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyYW1tYXJTY29wZU5hbWU6IGdyYW1tYXIuc2NvcGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVubWF0Y2hlZEVuZFRhZzogZ3JhbW1hci5zY29wZUZvcklkKHRhZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0R3JhbW1hcigpLnNldFJlc3BvbnNlcyhbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVudXNlZENvZGVSb3dzICYmIGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVudXNlZENvZGVSb3dzLmdldChlZGl0b3IuZ2V0UGF0aCgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocm93cyA9PiBlZGl0b3IuZ2V0R3JhbW1hcigpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc2V0UmVzcG9uc2VzKGdldEhpZ2hsaWdodHNGcm9tUXVpY2tGaXhlcyhlZGl0b3IuZ2V0UGF0aCgpLCByb3dzLCBbXSkpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNjb3BlcztcbiAgICB9O1xufVxuY2xhc3MgR3JhbW1hciB7XG4gICAgY29uc3RydWN0b3IoZWRpdG9yLCBiYXNlLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX2dpZCA9IHVuaXF1ZUlkKFwib2dcIik7XG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nID0gbmV3IFJlcGxheVN1YmplY3QoMSk7XG4gICAgICAgIHRoaXMuaXNPYnNlcnZlUmV0b2tlbml6aW5nLm5leHQodHJ1ZSk7XG4gICAgICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuICAgICAgICB0aGlzLnJlc3BvbnNlcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5saW5lc1RvRmV0Y2ggPSBbXTtcbiAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUgPSBbXTtcbiAgICAgICAgdGhpcy5hY3RpdmVGcmFtZXdvcmsgPSB7fTtcbiAgICAgICAgaWYgKCFvcHRpb25zIHx8ICFvcHRpb25zLnJlYWRvbmx5KSB7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0QnVmZmVyKCkucHJlZW1wdERpZENoYW5nZSgoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgb2xkUmFuZ2UsIG5ld1JhbmdlIH0gPSBlO1xuICAgICAgICAgICAgICAgIGxldCBzdGFydCA9IG9sZFJhbmdlLnN0YXJ0LnJvdywgZGVsdGEgPSBuZXdSYW5nZS5lbmQucm93IC0gb2xkUmFuZ2UuZW5kLnJvdztcbiAgICAgICAgICAgICAgICBzdGFydCA9IHN0YXJ0IC0gNTtcbiAgICAgICAgICAgICAgICBpZiAoc3RhcnQgPCAwKVxuICAgICAgICAgICAgICAgICAgICBzdGFydCA9IDA7XG4gICAgICAgICAgICAgICAgY29uc3QgZW5kID0gZWRpdG9yLmJ1ZmZlci5nZXRMaW5lQ291bnQoKSAtIDE7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSByYW5nZShzdGFydCwgZW5kICsgMSk7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5rZXlzKCkubmV4dCgpLmRvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvRmV0Y2gucHVzaCguLi5saW5lcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChsaW5lcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2VMaW5lID0gdGhpcy5yZXNwb25zZXMuZ2V0KGxpbmVzWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlTGluZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2xkRnJvbSA9IG9sZFJhbmdlLnN0YXJ0LmNvbHVtbiwgbmV3RnJvbSA9IG5ld1JhbmdlLnN0YXJ0LmNvbHVtbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbW92ZShyZXNwb25zZUxpbmUsIChzcGFuKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRMaW5lIDwgbGluZXNbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzcGFuLlN0YXJ0Q29sdW1uID49IG9sZEZyb20gfHwgc3Bhbi5FbmRDb2x1bW4gPj0gb2xkRnJvbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNwYW4uU3RhcnRDb2x1bW4gPj0gbmV3RnJvbSB8fCBzcGFuLkVuZENvbHVtbiA+PSBuZXdGcm9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWFjaChsaW5lcywgbGluZSA9PiB7IHRoaXMucmVzcG9uc2VzLmRlbGV0ZShsaW5lKTsgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChkZWx0YSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY291bnQgPSBlZGl0b3IuZ2V0TGluZUNvdW50KCk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBjb3VudCAtIDE7IGkgPiBlbmQ7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucmVzcG9uc2VzLmhhcyhpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLnNldChpICsgZGVsdGEsIHRoaXMucmVzcG9uc2VzLmdldChpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuZGVsZXRlKGkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGRlbHRhIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb3VudCA9IGVkaXRvci5nZXRMaW5lQ291bnQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWJzRGVsdGEgPSBNYXRoLmFicyhkZWx0YSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBlbmQ7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXNwb25zZXMuaGFzKGkgKyBhYnNEZWx0YSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaSwgdGhpcy5yZXNwb25zZXMuZ2V0KGkgKyBhYnNEZWx0YSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VzLmRlbGV0ZShpICsgYWJzRGVsdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2V0UmVzcG9uc2VzKHZhbHVlLCBlbmFibGVFeGNsdWRlQ29kZSkge1xuICAgICAgICBjb25zdCByZXN1bHRzID0gY2hhaW4odmFsdWUpO1xuICAgICAgICBjb25zdCBncm91cGVkSXRlbXMgPSByZXN1bHRzLm1hcChoaWdobGlnaHQgPT4gcmFuZ2UoaGlnaGxpZ2h0LlN0YXJ0TGluZSwgaGlnaGxpZ2h0LkVuZExpbmUgKyAxKVxuICAgICAgICAgICAgLm1hcChsaW5lID0+ICh7IGxpbmUsIGhpZ2hsaWdodCB9KSkpXG4gICAgICAgICAgICAuZmxhdHRlbigpXG4gICAgICAgICAgICAuZ3JvdXBCeSh6ID0+IHoubGluZSlcbiAgICAgICAgICAgIC52YWx1ZSgpO1xuICAgICAgICBlYWNoKGdyb3VwZWRJdGVtcywgKGl0ZW0sIGtleSkgPT4ge1xuICAgICAgICAgICAgbGV0IGsgPSAra2V5LCBtYXBwZWRJdGVtID0gaXRlbS5tYXAoeCA9PiB4LmhpZ2hsaWdodCk7XG4gICAgICAgICAgICBpZiAoIWVuYWJsZUV4Y2x1ZGVDb2RlIHx8IHNvbWUobWFwcGVkSXRlbSwgaSA9PiBpLktpbmQgPT09IFwicHJlcHJvY2Vzc29yIGtleXdvcmRcIikgJiYgZXZlcnkobWFwcGVkSXRlbSwgaSA9PiBpLktpbmQgPT09IFwiZXhjbHVkZWQgY29kZVwiIHx8IGkuS2luZCA9PT0gXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiKSkge1xuICAgICAgICAgICAgICAgIG1hcHBlZEl0ZW0gPSBtYXBwZWRJdGVtLmZpbHRlcih6ID0+IHouS2luZCAhPT0gXCJleGNsdWRlZCBjb2RlXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5oYXMoaykpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc3BvbnNlcy5zZXQoaywgbWFwcGVkSXRlbSk7XG4gICAgICAgICAgICAgICAgdGhpcy5saW5lc1RvVG9rZW5pemUucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlTGluZSA9IHRoaXMucmVzcG9uc2VzLmdldChrKTtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2VMaW5lLmxlbmd0aCAhPT0gbWFwcGVkSXRlbS5sZW5ndGggfHwgc29tZShyZXNwb25zZUxpbmUsIChsLCBpKSA9PiAhaXNFcXVhbChsLCBtYXBwZWRJdGVtW2ldKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZXMuc2V0KGssIG1hcHBlZEl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpbmVzVG9Ub2tlbml6ZS5wdXNoKGspO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXh0ZW5kKEdyYW1tYXIucHJvdG90eXBlLCBBdG9tR3JhbW1hci5wcm90b3R5cGUpO1xuR3JhbW1hci5wcm90b3R5cGVbXCJvbW5pc2hhcnBcIl0gPSB0cnVlO1xuR3JhbW1hci5wcm90b3R5cGVbXCJ0b2tlbml6ZUxpbmVcIl0gPSBmdW5jdGlvbiAobGluZSwgcnVsZVN0YWNrLCBmaXJzdExpbmUgPSBmYWxzZSkge1xuICAgIGNvbnN0IGJhc2VSZXN1bHQgPSBBdG9tR3JhbW1hci5wcm90b3R5cGUudG9rZW5pemVMaW5lLmNhbGwodGhpcywgbGluZSwgcnVsZVN0YWNrLCBmaXJzdExpbmUpO1xuICAgIGxldCB0YWdzO1xuICAgIGlmICh0aGlzLnJlc3BvbnNlcykge1xuICAgICAgICBjb25zdCByb3cgPSB0aGlzW1wiX19yb3dfX1wiXTtcbiAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlcy5oYXMocm93KSlcbiAgICAgICAgICAgIHJldHVybiBiYXNlUmVzdWx0O1xuICAgICAgICBjb25zdCBoaWdobGlnaHRzID0gdGhpcy5yZXNwb25zZXMuZ2V0KHJvdyk7XG4gICAgICAgIGlmIChoaWdobGlnaHRzWzBdICYmIGhpZ2hsaWdodHNbMF0uS2luZCA9PT0gXCJleGNsdWRlZCBjb2RlXCIpIHtcbiAgICAgICAgICAgIHRhZ3MgPSBbbGluZS5sZW5ndGhdO1xuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHRzWzBdLCAwLCB0YWdzLmxlbmd0aCAtIDEsIGxpbmUpO1xuICAgICAgICAgICAgYmFzZVJlc3VsdC5ydWxlU3RhY2sgPSBbYmFzZVJlc3VsdC5ydWxlU3RhY2tbMF1dO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGFncyA9IHRoaXMuZ2V0Q3NUb2tlbnNGb3JMaW5lKGhpZ2hsaWdodHMsIGxpbmUsIHJvdywgcnVsZVN0YWNrLCBmaXJzdExpbmUsIGJhc2VSZXN1bHQudGFncyk7XG4gICAgICAgIH1cbiAgICAgICAgYmFzZVJlc3VsdC50YWdzID0gdGFncztcbiAgICB9XG4gICAgcmV0dXJuIGJhc2VSZXN1bHQ7XG59O1xuR3JhbW1hci5wcm90b3R5cGUuZ2V0Q3NUb2tlbnNGb3JMaW5lID0gZnVuY3Rpb24gKGhpZ2hsaWdodHMsIGxpbmUsIHJvdywgcnVsZVN0YWNrLCBmaXJzdExpbmUsIHRhZ3MpIHtcbiAgICBydWxlU3RhY2sgPSBbeyBydWxlOiB0aGlzLmdldEluaXRpYWxSdWxlKCkgfV07XG4gICAgZWFjaChoaWdobGlnaHRzLCAoaGlnaGxpZ2h0KSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gaGlnaGxpZ2h0LlN0YXJ0Q29sdW1uIC0gMTtcbiAgICAgICAgY29uc3QgZW5kID0gaGlnaGxpZ2h0LkVuZENvbHVtbiAtIDE7XG4gICAgICAgIGlmIChoaWdobGlnaHQuRW5kTGluZSA+IGhpZ2hsaWdodC5TdGFydExpbmUgJiYgaGlnaGxpZ2h0LlN0YXJ0Q29sdW1uID09PSAwICYmIGhpZ2hsaWdodC5FbmRDb2x1bW4gPT09IDApIHtcbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0LCAwLCB0YWdzLmxlbmd0aCAtIDEsIGxpbmUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkaXN0YW5jZSA9IC0xO1xuICAgICAgICBsZXQgaW5kZXggPSAtMTtcbiAgICAgICAgbGV0IGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0YWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2UgKyB0YWdzW2ldID4gc3RhcnQpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5kZXggPSBpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZGlzdGFuY2UgKz0gdGFnc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdHIgPSBsaW5lLnN1YnN0cmluZyhzdGFydCwgZW5kKTtcbiAgICAgICAgY29uc3Qgc2l6ZSA9IGVuZCAtIHN0YXJ0O1xuICAgICAgICBpZiAodGFnc1tpbmRleF0gPj0gc2l6ZSkge1xuICAgICAgICAgICAgbGV0IHZhbHVlcztcbiAgICAgICAgICAgIGxldCBwcmV2LCBuZXh0O1xuICAgICAgICAgICAgaWYgKGRpc3RhbmNlID09PSBzdGFydCkge1xuICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtzaXplLCB0YWdzW2luZGV4XSAtIHNpemVdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcHJldiA9IHN0YXJ0IC0gZGlzdGFuY2U7XG4gICAgICAgICAgICAgICAgbmV4dCA9IHRhZ3NbaW5kZXhdIC0gc2l6ZSAtIHByZXY7XG4gICAgICAgICAgICAgICAgaWYgKG5leHQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtwcmV2LCBzaXplLCB0YWdzW2luZGV4XSAtIHNpemUgLSBwcmV2XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtwcmV2LCBzaXplXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0YWdzLnNwbGljZShpbmRleCwgMSwgLi4udmFsdWVzKTtcbiAgICAgICAgICAgIGlmIChwcmV2KVxuICAgICAgICAgICAgICAgIGluZGV4ID0gaW5kZXggKyAxO1xuICAgICAgICAgICAgZ2V0QXRvbVN0eWxlRm9yVG9rZW4odGhpcy5uYW1lLCB0YWdzLCBoaWdobGlnaHQsIGluZGV4LCBpbmRleCArIDEsIHN0cik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGFnc1tpbmRleF0gPCBzaXplKSB7XG4gICAgICAgICAgICBsZXQgYmFja3RyYWNrSW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgIGxldCBiYWNrdHJhY2tEaXN0YW5jZSA9IDA7XG4gICAgICAgICAgICBmb3IgKGkgPSBiYWNrdHJhY2tJbmRleDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAodGFnc1tpXSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJhY2t0cmFja0Rpc3RhbmNlID49IHNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0luZGV4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJhY2t0cmFja0Rpc3RhbmNlICs9IHRhZ3NbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChiYWNrdHJhY2tEaXN0YW5jZSA+PSBzaXplKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IGkgKyAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBiYWNrdHJhY2tJbmRleCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgZm9yd2FyZHRyYWNrSW5kZXggPSBpbmRleDtcbiAgICAgICAgICAgIGxldCByZW1haW5pbmdTaXplID0gc2l6ZTtcbiAgICAgICAgICAgIGZvciAoaSA9IGluZGV4ICsgMTsgaSA8IHRhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoKHJlbWFpbmluZ1NpemUgPD0gMCAmJiB0YWdzW2ldID4gMCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yd2FyZHRyYWNrSW5kZXggPSBpIC0gMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0YWdzW2ldID4gMCkge1xuICAgICAgICAgICAgICAgICAgICByZW1haW5pbmdTaXplIC09IHRhZ3NbaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBvcGVuRm91bmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaCA9IGk7IGggPj0gMDsgaC0tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFnc1toXSA9PT0gdGFnc1tpXSArIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcGVuRm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICghb3BlbkZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IGkgLSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaSA9PT0gdGFncy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBmb3J3YXJkdHJhY2tJbmRleCA9IHRhZ3MubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdldEF0b21TdHlsZUZvclRva2VuKHRoaXMubmFtZSwgdGFncywgaGlnaGxpZ2h0LCBiYWNrdHJhY2tJbmRleCwgZm9yd2FyZHRyYWNrSW5kZXgsIHN0cik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gdGFncztcbn07XG5jb25zdCBnZXRJZEZvclNjb3BlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBpZHMgPSB7fTtcbiAgICBjb25zdCBncmFtbWFycyA9IHt9O1xuICAgIGZ1bmN0aW9uIGJ1aWxkU2NvcGVzRm9yR3JhbW1hcihncmFtbWFyTmFtZSkge1xuICAgICAgICBjb25zdCBncmFtbWFyID0gZmluZChhdG9tLmdyYW1tYXJzLmdldEdyYW1tYXJzKCksIGdhbW1yID0+IGdhbW1yLm5hbWUgPT09IGdyYW1tYXJOYW1lKTtcbiAgICAgICAgaWYgKCFncmFtbWFyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZHNbZ3JhbW1hci5uYW1lXSA9IHt9O1xuICAgICAgICBncmFtbWFyc1tncmFtbWFyLm5hbWVdID0gZ3JhbW1hcjtcbiAgICAgICAgZWFjaChncmFtbWFyLnJlZ2lzdHJ5LnNjb3Blc0J5SWQsICh2YWx1ZSwga2V5KSA9PiB7IGlkc1tncmFtbWFyLm5hbWVdW3ZhbHVlXSA9ICtrZXk7IH0pO1xuICAgIH1cbiAgICBjb25zdCBtZXRob2QgPSAoZ3JhbW1hciwgc2NvcGUpID0+IHtcbiAgICAgICAgaWYgKCFpZHNbZ3JhbW1hcl0pIHtcbiAgICAgICAgICAgIGJ1aWxkU2NvcGVzRm9yR3JhbW1hcihncmFtbWFyKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlkc1tncmFtbWFyXVtzY29wZV0pXG4gICAgICAgICAgICBpZHNbZ3JhbW1hcl1bc2NvcGVdID0gZ3JhbW1hcnNbZ3JhbW1hcl0ucmVnaXN0cnkuc3RhcnRJZEZvclNjb3BlKHNjb3BlKTtcbiAgICAgICAgcmV0dXJuICtpZHNbZ3JhbW1hcl1bc2NvcGVdO1xuICAgIH07XG4gICAgbWV0aG9kLmVuZCA9IChzY29wZSkgPT4gK3Njb3BlIC0gMTtcbiAgICByZXR1cm4gbWV0aG9kO1xufSkoKTtcbmZ1bmN0aW9uIGdldEF0b21TdHlsZUZvclRva2VuKGdyYW1tYXIsIHRhZ3MsIHRva2VuLCBpbmRleCwgaW5kZXhFbmQsIHN0cikge1xuICAgIGNvbnN0IHByZXZpb3VzU2NvcGVzID0gW107XG4gICAgZm9yIChsZXQgaSA9IGluZGV4IC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgaWYgKHRhZ3NbaV0gPiAwKVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIHByZXZpb3VzU2NvcGVzLnB1c2godGFnc1tpXSk7XG4gICAgfVxuICAgIGNvbnN0IHJlcGxhY2VtZW50cyA9IFtdO1xuICAgIGNvbnN0IG9wZW5zID0gW107XG4gICAgY29uc3QgY2xvc2VzID0gW107XG4gICAgZm9yIChsZXQgaSA9IGluZGV4OyBpIDwgaW5kZXhFbmQ7IGkrKykge1xuICAgICAgICBpZiAodGFnc1tpXSA+IDApXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgaWYgKHRhZ3NbaV0gJSAyID09PSAwKSB7XG4gICAgICAgICAgICBjb25zdCBvcGVuSW5kZXggPSBmaW5kSW5kZXgob3BlbnMsIHggPT4geC50YWcgPT09ICh0YWdzW2ldICsgMSkpO1xuICAgICAgICAgICAgaWYgKG9wZW5JbmRleCA+IC0xKSB7XG4gICAgICAgICAgICAgICAgb3BlbnMuc3BsaWNlKG9wZW5JbmRleCwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbG9zZXMucHVzaCh7IHRhZzogdGFnc1tpXSwgaW5kZXg6IGkgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBvcGVucy51bnNoaWZ0KHsgdGFnOiB0YWdzW2ldLCBpbmRleDogaSB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgdW5mdWxsZmlsbGVkID0gW107XG4gICAgaWYgKGNsb3Nlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHVuZnVsbGZpbGxlZCA9IHNvcnRCeShvcGVucy5jb25jYXQoY2xvc2VzKSwgeCA9PiB4LmluZGV4KTtcbiAgICB9XG4gICAgZWxzZSBpZiAob3BlbnMubGVuZ3RoID4gMCkge1xuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XG4gICAgICAgICAgICBzdGFydDogb3BlbnNbb3BlbnMubGVuZ3RoIC0gMV0uaW5kZXgsXG4gICAgICAgICAgICBlbmQ6IGluZGV4RW5kLFxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2Uob3BlbnNbb3BlbnMubGVuZ3RoIC0gMV0uaW5kZXgsIGluZGV4RW5kICsgMSlcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxldCBpbnRlcm5hbEluZGV4ID0gaW5kZXg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1bmZ1bGxmaWxsZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgdiA9IHVuZnVsbGZpbGxlZFtpXTtcbiAgICAgICAgcmVwbGFjZW1lbnRzLnVuc2hpZnQoe1xuICAgICAgICAgICAgc3RhcnQ6IGludGVybmFsSW5kZXgsXG4gICAgICAgICAgICBlbmQ6IHYuaW5kZXgsXG4gICAgICAgICAgICByZXBsYWNlbWVudDogdGFncy5zbGljZShpbnRlcm5hbEluZGV4LCB2LmluZGV4KVxuICAgICAgICB9KTtcbiAgICAgICAgaW50ZXJuYWxJbmRleCA9IHYuaW5kZXggKyAxO1xuICAgIH1cbiAgICBpZiAocmVwbGFjZW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXBsYWNlbWVudHMudW5zaGlmdCh7XG4gICAgICAgICAgICBzdGFydDogaW5kZXgsXG4gICAgICAgICAgICBlbmQ6IGluZGV4RW5kLFxuICAgICAgICAgICAgcmVwbGFjZW1lbnQ6IHRhZ3Muc2xpY2UoaW5kZXgsIGluZGV4RW5kKVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkZChzY29wZSkge1xuICAgICAgICBjb25zdCBpZCA9IGdldElkRm9yU2NvcGUoZ3JhbW1hciwgc2NvcGUpO1xuICAgICAgICBpZiAoaWQgPT09IC0xKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAoIXNvbWUocHJldmlvdXNTY29wZXMsIHogPT4geiA9PT0gaWQpKSB7XG4gICAgICAgICAgICBwcmV2aW91c1Njb3Blcy5wdXNoKGlkKTtcbiAgICAgICAgfVxuICAgICAgICBlYWNoKHJlcGxhY2VtZW50cywgY3R4ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcGxhY2VtZW50ID0gY3R4LnJlcGxhY2VtZW50O1xuICAgICAgICAgICAgcmVwbGFjZW1lbnQudW5zaGlmdChpZCk7XG4gICAgICAgICAgICByZXBsYWNlbWVudC5wdXNoKGdldElkRm9yU2NvcGUuZW5kKGlkKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzd2l0Y2ggKHRva2VuLktpbmQpIHtcbiAgICAgICAgY2FzZSBcIm51bWJlclwiOlxuICAgICAgICAgICAgYWRkKGBjb25zdGFudC5udW1lcmljYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInN0cnVjdCBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY29uc3RhbnQubnVtZXJpYy5pZGVudGlmaWVyLnN0cnVjdGApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJlbnVtIG5hbWVcIjpcbiAgICAgICAgICAgIGFkZChgc3VwcG9ydC5jb25zdGFudC5udW1lcmljLmlkZW50aWZpZXIuZW51bWApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJpZGVudGlmaWVyXCI6XG4gICAgICAgICAgICBhZGQoYGlkZW50aWZpZXJgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiY2xhc3MgbmFtZVwiOlxuICAgICAgICAgICAgYWRkKGBzdXBwb3J0LmNsYXNzLnR5cGUuaWRlbnRpZmllcmApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJkZWxlZ2F0ZSBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyLmRlbGVnYXRlYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImludGVyZmFjZSBuYW1lXCI6XG4gICAgICAgICAgICBhZGQoYHN1cHBvcnQuY2xhc3MudHlwZS5pZGVudGlmaWVyLmludGVyZmFjZWApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJwcmVwcm9jZXNzb3Iga2V5d29yZFwiOlxuICAgICAgICAgICAgYWRkKGBjb25zdGFudC5vdGhlci5zeW1ib2xgKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZXhjbHVkZWQgY29kZVwiOlxuICAgICAgICAgICAgYWRkKGBjb21tZW50LmJsb2NrYCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInVudXNlZCBjb2RlXCI6XG4gICAgICAgICAgICBhZGQoYHVudXNlZGApO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInVuaGFuZGxlZCBLaW5kIFwiICsgdG9rZW4uS2luZCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgZWFjaChyZXBsYWNlbWVudHMsIGN0eCA9PiB7XG4gICAgICAgIGNvbnN0IHsgcmVwbGFjZW1lbnQsIGVuZCwgc3RhcnQgfSA9IGN0eDtcbiAgICAgICAgaWYgKHJlcGxhY2VtZW50Lmxlbmd0aCA9PT0gMilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbGV0IG51bSA9IGVuZCAtIHN0YXJ0O1xuICAgICAgICBpZiAobnVtIDw9IDApIHtcbiAgICAgICAgICAgIG51bSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgdGFncy5zcGxpY2Uoc3RhcnQsIG51bSwgLi4ucmVwbGFjZW1lbnQpO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gc2V0R3JhbW1hcihncmFtbWFyKSB7XG4gICAgY29uc3QgZzIgPSBnZXRFbmhhbmNlZEdyYW1tYXIodGhpcywgZ3JhbW1hcik7XG4gICAgaWYgKGcyICE9PSBncmFtbWFyKVxuICAgICAgICB0aGlzLl9zZXRHcmFtbWFyKGcyKTtcbiAgICByZXR1cm4gZzI7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0RW5oYW5jZWRHcmFtbWFyKGVkaXRvciwgZ3JhbW1hciwgb3B0aW9ucykge1xuICAgIGlmICghZ3JhbW1hcilcbiAgICAgICAgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XG4gICAgaWYgKCFncmFtbWFyW1wib21uaXNoYXJwXCJdICYmIE9tbmkuaXNWYWxpZEdyYW1tYXIoZ3JhbW1hcikpIHtcbiAgICAgICAgY29uc3QgbmV3R3JhbW1hciA9IG5ldyBHcmFtbWFyKGVkaXRvciwgZ3JhbW1hciwgb3B0aW9ucyk7XG4gICAgICAgIGVhY2goZ3JhbW1hciwgKHgsIGkpID0+IGhhcyhncmFtbWFyLCBpKSAmJiAobmV3R3JhbW1hcltpXSA9IHgpKTtcbiAgICAgICAgZ3JhbW1hciA9IG5ld0dyYW1tYXI7XG4gICAgfVxuICAgIHJldHVybiBncmFtbWFyO1xufVxuY2xhc3MgVW51c2VkTWFwIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fbWFwID0gbmV3IE1hcCgpO1xuICAgIH1cbiAgICBnZXQoa2V5KSB7XG4gICAgICAgIGlmICghdGhpcy5fbWFwLmhhcyhrZXkpKVxuICAgICAgICAgICAgdGhpcy5fbWFwLnNldChrZXksIG5ldyBCZWhhdmlvclN1YmplY3QoW10pKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcC5nZXQoa2V5KTtcbiAgICB9XG4gICAgX2dldE9ic2VydmVyKGtleSkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXQoa2V5KTtcbiAgICB9XG4gICAgc2V0KGtleSwgdmFsdWUpIHtcbiAgICAgICAgY29uc3QgbyA9IHRoaXMuX2dldE9ic2VydmVyKGtleSk7XG4gICAgICAgIGlmICghaXNFcXVhbChvLmdldFZhbHVlKCksIHZhbHVlKSkge1xuICAgICAgICAgICAgby5uZXh0KHZhbHVlIHx8IFtdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgZGVsZXRlKGtleSkge1xuICAgICAgICBpZiAodGhpcy5fbWFwLmhhcyhrZXkpKVxuICAgICAgICAgICAgdGhpcy5fbWFwLmRlbGV0ZShrZXkpO1xuICAgIH1cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5fbWFwLmNsZWFyKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGVuaGFuY2VkSGlnaGxpZ2h0aW5nID0gbmV3IEhpZ2hsaWdodDtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

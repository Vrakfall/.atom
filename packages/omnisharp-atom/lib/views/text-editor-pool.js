"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EditorElement = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _highlight = require("../features/highlight");

var _omni = require("../server/omni");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fastdom = require("fastdom");
var customExcludes = _highlight.ExcludeClassifications.concat([8, 9, 10]);
var pool = function () {
    var NUM_TO_KEEP = 10;
    var POOL = [];
    var cleanupPool = _lodash2.default.throttle(function cleanupPool() {
        if (POOL.length > NUM_TO_KEEP) {
            var len = Math.min(POOL.length - NUM_TO_KEEP, 10);
            var remove = POOL.splice(0, len);
            remove.forEach(function (x) {
                return x.editor.destroy();
            });
            cleanupPool();
        }
    }, 10000, { trailing: true });

    var Result = function () {
        function Result(editor, element) {
            var _this = this;

            _classCallCheck(this, Result);

            this.editor = editor;
            this.element = element;
            this._disposable = _omnisharpClient.Disposable.create(function () {
                var editor = _this.editor;
                var element = _this.element;

                element.remove();
                POOL.push({ editor: editor, element: element });
                editor.setGrammar(_omni.Omni.grammars[0]);
                editor.setText("");
                cleanupPool();
            });
        }

        _createClass(Result, [{
            key: "dispose",
            value: function dispose() {
                this._disposable.dispose();
            }
        }]);

        return Result;
    }();

    function populatePool() {
        return _rxjs.Observable.interval(50).take(10).map(function () {
            var editorElement = document.createElement("atom-text-editor");
            editorElement.setAttributeNode(document.createAttribute("gutter-hidden"));
            editorElement.removeAttribute("tabindex");
            var editor = editorElement.getModel();
            editor.getDecorations({ class: "cursor-line", type: "line" })[0].destroy();
            editor.setGrammar(_omni.Omni.grammars[0]);
            editor.setSoftWrapped(true);
            (0, _highlight.augmentEditor)(editor);
            return editorElement;
        }).do(function (element) {
            return POOL.push({ element: element, editor: element.getModel() });
        }).toArray();
    }
    setTimeout(function () {
        return populatePool();
    }, 10000);
    function request() {
        if (POOL.length) {
            var _POOL$pop = POOL.pop();

            var editor = _POOL$pop.editor;
            var element = _POOL$pop.element;

            return _rxjs.Observable.of(new Result(editor, element));
        } else {
            return populatePool().flatMap(function () {
                return request();
            });
        }
    }
    return {
        getNext: function getNext() {
            if (!POOL.length) {
                return { success: false, result: null };
            }

            var _POOL$pop2 = POOL.pop();

            var editor = _POOL$pop2.editor;
            var element = _POOL$pop2.element;

            return { success: true, result: new Result(editor, element) };
        },

        request: request
    };
}();

var EditorElement = exports.EditorElement = function (_HTMLSpanElement) {
    _inherits(EditorElement, _HTMLSpanElement);

    function EditorElement() {
        _classCallCheck(this, EditorElement);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(EditorElement).apply(this, arguments));
    }

    _createClass(EditorElement, [{
        key: "setEditorText",
        value: function setEditorText(grammar) {
            if (this._usage) {
                var text = this._usage.Text;
                this._editor._setGrammar(grammar);
                this._editor.setText(_lodash2.default.trimStart(text));
                var marker = this._editor.markBufferRange([[0, +this._usage.Column - this._whitespace], [+this._usage.EndLine - +this._usage.Line, +this._usage.EndColumn - this._whitespace]]);
                this._editor.decorateMarker(marker, { type: "highlight", class: "findusages-underline" });
            } else {
                this._editor.setText(_lodash2.default.trim(this._editorText));
            }
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            this._disposable = new _omnisharpClient.CompositeDisposable();
            if (!this._pre) {
                this._pre = document.createElement("pre");
                this._pre.innerText = this._usage && this._usage.Text || this.editorText;
                this._pre.style.fontSize = atom.config.get("editor.fontSize") + "px !important";
            }
            this.appendChild(this._pre);
        }
    }, {
        key: "revert",
        value: function revert() {
            var _this3 = this;

            fastdom.mutate(function () {
                return _this3._detachEditor(true);
            });
        }
    }, {
        key: "enhance",
        value: function enhance() {
            var _this4 = this;

            if (this._enhanced) return;
            this._enhanced = true;
            var next = pool.getNext();
            if (next.success) {
                if (this._usage && atom.config.get("omnisharp-atom.enhancedHighlighting")) {
                    var s = request({ filePath: this._usage.FileName, startLine: this._usage.Line, endLine: this._usage.EndLine, whitespace: this._whitespace }).subscribe(function (response) {
                        var grammar = _this4._grammar = (0, _highlight.getEnhancedGrammar)(next.result.editor, _lodash2.default.find(_omni.Omni.grammars, function (g) {
                            return _lodash2.default.some(g.fileTypes, function (ft) {
                                return _lodash2.default.endsWith(_this4._usage.FileName, "." + ft);
                            });
                        }), { readonly: true });
                        grammar.setResponses(response);
                        fastdom.mutate(function () {
                            return _this4._attachEditor(next.result, grammar);
                        });
                    });
                    this._disposable.add(s);
                    return;
                }
                fastdom.mutate(function () {
                    return _this4._attachEditor(next.result);
                });
            } else {
                (function () {
                    var s = pool.request().subscribe(function (result) {
                        if (_this4._usage && atom.config.get("omnisharp-atom.enhancedHighlighting")) {
                            var _s = request({ filePath: _this4._usage.FileName, startLine: _this4._usage.Line, endLine: _this4._usage.EndLine, whitespace: _this4._whitespace }).subscribe(function (response) {
                                var grammar = _this4._grammar = (0, _highlight.getEnhancedGrammar)(result.editor, _lodash2.default.find(_omni.Omni.grammars, function (g) {
                                    return _lodash2.default.some(g.fileTypes, function (ft) {
                                        return _lodash2.default.endsWith(_this4._usage.FileName, "." + ft);
                                    });
                                }), { readonly: true });
                                grammar.setResponses(response);
                                fastdom.mutate(function () {
                                    return _this4._attachEditor(result, grammar);
                                });
                            });
                            _this4._disposable.add(_s);
                            return;
                        }
                        fastdom.mutate(function () {
                            return _this4._attachEditor(result);
                        });
                        _this4._disposable.remove(s);
                    });
                    _this4._disposable.add(s);
                })();
            }
        }
    }, {
        key: "_attachEditor",
        value: function _attachEditor(result, grammar) {
            if (this._pre) {
                this._pre.remove();
                this._pre = null;
            }
            this._release = result;
            this._disposable.add(result);
            this._editorElement = result.element;
            this._editor = result.editor;
            this.setEditorText(grammar || this._grammar);
            this.appendChild(this._editorElement);
        }
    }, {
        key: "_detachEditor",
        value: function _detachEditor(append) {
            if (append) {
                this._pre = document.createElement("pre");
                this._pre.innerText = this._usage && this._usage.Text || this.editorText;
                this._pre.style.fontSize = atom.config.get("editor.fontSize") + "px !important";
                this.appendChild(this._pre);
            }
            if (this._release) {
                this._disposable.remove(this._release);
                this._release.dispose();
            }
            if (this._editorElement) this._editorElement.remove();
            this._editor = null;
            this._editorElement = null;
            this._enhanced = false;
        }
    }, {
        key: "detachedCallback",
        value: function detachedCallback() {
            this._detachEditor();
            if (this._pre) {
                this._pre.remove();
                this._pre.innerText = "";
            }
            this._disposable.dispose();
        }
    }, {
        key: "usage",
        get: function get() {
            return this._usage;
        },
        set: function set(value) {
            this._editorText = null;
            this._usage = value;
            this._whitespace = 0;
            var text = this._usage.Text;
            var usageLength = this._usage.EndColumn - this._usage.Column;
            for (var i = this._usage.Column; i > -1; i--) {
                var chunk = text.substr(i);
                console.log(chunk);
                var match = chunk.match(/^((?:@|_|[a-zA-Z])[\w]*)(?:[\W]|$)/);
                if (!match) continue;
                console.log(match);
                var v = match[1];
                if (v.length === usageLength) {
                    this._whitespace = this._usage.Column - i;
                    break;
                }
            }
            if (this._pre) {
                this._pre.innerText = _lodash2.default.trimStart(value.Text);
            }
            if (this._editor) {
                this.setEditorText(this._grammar);
            }
        }
    }, {
        key: "editorText",
        get: function get() {
            return this._editorText;
        },
        set: function set(value) {
            this._usage = null;
            this._editorText = value;
            if (this._pre) {
                this._pre.innerText = _lodash2.default.trimStart(value);
            }
            if (this._editor) {
                this.setEditorText(this._grammar);
            }
        }
    }]);

    return EditorElement;
}(HTMLSpanElement);

function request(_ref) {
    var filePath = _ref.filePath;
    var startLine = _ref.startLine;
    var endLine = _ref.endLine;
    var whitespace = _ref.whitespace;

    return _omni.Omni.request(function (client) {
        return client.highlight({
            Buffer: null,
            FileName: filePath,
            Lines: _lodash2.default.range(startLine, endLine),
            ExcludeClassifications: customExcludes
        }, { silent: true });
    }).map(function (response) {
        return (0, _lodash2.default)(response.Highlights).map(function (x) {
            return {
                StartLine: x.StartLine - startLine,
                StartColumn: x.StartLine === startLine ? x.StartColumn - whitespace : x.StartColumn,
                EndLine: x.EndLine - startLine,
                EndColumn: x.StartLine === startLine ? x.EndColumn - whitespace : x.EndColumn,
                Kind: x.Kind,
                Projects: x.Projects
            };
        }).value();
    }).filter(function (x) {
        return x.length > 0;
    });
}
exports.EditorElement = document.registerElement("omnisharp-editor-element", { prototype: EditorElement.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy90ZXh0LWVkaXRvci1wb29sLmpzIiwibGliL3ZpZXdzL3RleHQtZWRpdG9yLXBvb2wudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7OztBQ0VBLElBQUksVUFBMEIsUUFBUSxTQUFSLENBQTlCO0FBRUEsSUFBTSxpQkFBaUIsa0NBQXVCLE1BQXZCLENBQThCLENBQ2pELENBRGlELEVBRWpELENBRmlELEVBR2pELEVBSGlELENBQTlCLENBQXZCO0FBTUEsSUFBTSxPQUFRLFlBQUE7QUFDVixRQUFNLGNBQWMsRUFBcEI7QUFDQSxRQUFNLE9BQTBFLEVBQWhGO0FBRUEsUUFBTSxjQUFjLGlCQUFFLFFBQUYsQ0FBVyxTQUFBLFdBQUEsR0FBQTtBQUMzQixZQUFJLEtBQUssTUFBTCxHQUFjLFdBQWxCLEVBQStCO0FBQzNCLGdCQUFNLE1BQU0sS0FBSyxHQUFMLENBQVMsS0FBSyxNQUFMLEdBQWMsV0FBdkIsRUFBb0MsRUFBcEMsQ0FBWjtBQUNBLGdCQUFJLFNBQVMsS0FBSyxNQUFMLENBQVksQ0FBWixFQUFlLEdBQWYsQ0FBYjtBQUNBLG1CQUFPLE9BQVAsQ0FBZTtBQUFBLHVCQUFLLEVBQUUsTUFBRixDQUFTLE9BQVQsRUFBTDtBQUFBLGFBQWY7QUFFQTtBQUNIO0FBQ0osS0FSbUIsRUFRakIsS0FSaUIsRUFRVixFQUFFLFVBQVUsSUFBWixFQVJVLENBQXBCOztBQUpVLFFBY1YsTUFkVTtBQTBCTix3QkFBbUIsTUFBbkIsRUFBbUQsT0FBbkQsRUFBb0Y7QUFBQTs7QUFBQTs7QUFBakUsaUJBQUEsTUFBQSxHQUFBLE1BQUE7QUFBZ0MsaUJBQUEsT0FBQSxHQUFBLE9BQUE7QUFYM0MsaUJBQUEsV0FBQSxHQUFjLDRCQUFXLE1BQVgsQ0FBa0IsWUFBQTtBQUFBLG9CQUM3QixNQUQ2QixTQUM3QixNQUQ2QjtBQUFBLG9CQUNyQixPQURxQixTQUNyQixPQURxQjs7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QUVLLFFBQVMsYUFBVCxHQUErQixTQUFVLGVBQVYsQ0FBMEIsMEJBQTFCLEVBQXNELEVBQUUsV0FBVyxjQUFjLFNBQTNCLEVBQXRELENBQS9CIiwiZmlsZSI6ImxpYi92aWV3cy90ZXh0LWVkaXRvci1wb29sLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IGdldEVuaGFuY2VkR3JhbW1hciwgYXVnbWVudEVkaXRvciwgRXhjbHVkZUNsYXNzaWZpY2F0aW9ucyB9IGZyb20gXCIuLi9mZWF0dXJlcy9oaWdobGlnaHRcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmxldCBmYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XG5jb25zdCBjdXN0b21FeGNsdWRlcyA9IEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnMuY29uY2F0KFtcbiAgICA4LFxuICAgIDksXG4gICAgMTAsXG5dKTtcbmNvbnN0IHBvb2wgPSAoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IE5VTV9UT19LRUVQID0gMTA7XG4gICAgY29uc3QgUE9PTCA9IFtdO1xuICAgIGNvbnN0IGNsZWFudXBQb29sID0gXy50aHJvdHRsZShmdW5jdGlvbiBjbGVhbnVwUG9vbCgpIHtcbiAgICAgICAgaWYgKFBPT0wubGVuZ3RoID4gTlVNX1RPX0tFRVApIHtcbiAgICAgICAgICAgIGNvbnN0IGxlbiA9IE1hdGgubWluKFBPT0wubGVuZ3RoIC0gTlVNX1RPX0tFRVAsIDEwKTtcbiAgICAgICAgICAgIGxldCByZW1vdmUgPSBQT09MLnNwbGljZSgwLCBsZW4pO1xuICAgICAgICAgICAgcmVtb3ZlLmZvckVhY2goeCA9PiB4LmVkaXRvci5kZXN0cm95KCkpO1xuICAgICAgICAgICAgY2xlYW51cFBvb2woKTtcbiAgICAgICAgfVxuICAgIH0sIDEwMDAwLCB7IHRyYWlsaW5nOiB0cnVlIH0pO1xuICAgIGNsYXNzIFJlc3VsdCB7XG4gICAgICAgIGNvbnN0cnVjdG9yKGVkaXRvciwgZWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGVkaXRvciwgZWxlbWVudCB9ID0gdGhpcztcbiAgICAgICAgICAgICAgICBlbGVtZW50LnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIFBPT0wucHVzaCh7IGVkaXRvciwgZWxlbWVudCB9KTtcbiAgICAgICAgICAgICAgICBlZGl0b3Iuc2V0R3JhbW1hcihPbW5pLmdyYW1tYXJzWzBdKTtcbiAgICAgICAgICAgICAgICBlZGl0b3Iuc2V0VGV4dChcIlwiKTtcbiAgICAgICAgICAgICAgICBjbGVhbnVwUG9vbCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZGlzcG9zZSgpIHtcbiAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBvcHVsYXRlUG9vbCgpIHtcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuaW50ZXJ2YWwoNTApXG4gICAgICAgICAgICAudGFrZSgxMClcbiAgICAgICAgICAgIC5tYXAoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhdG9tLXRleHQtZWRpdG9yXCIpO1xuICAgICAgICAgICAgZWRpdG9yRWxlbWVudC5zZXRBdHRyaWJ1dGVOb2RlKGRvY3VtZW50LmNyZWF0ZUF0dHJpYnV0ZShcImd1dHRlci1oaWRkZW5cIikpO1xuICAgICAgICAgICAgZWRpdG9yRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoXCJ0YWJpbmRleFwiKTtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGVkaXRvckVsZW1lbnQuZ2V0TW9kZWwoKTtcbiAgICAgICAgICAgIGVkaXRvci5nZXREZWNvcmF0aW9ucyh7IGNsYXNzOiBcImN1cnNvci1saW5lXCIsIHR5cGU6IFwibGluZVwiIH0pWzBdLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKE9tbmkuZ3JhbW1hcnNbMF0pO1xuICAgICAgICAgICAgZWRpdG9yLnNldFNvZnRXcmFwcGVkKHRydWUpO1xuICAgICAgICAgICAgYXVnbWVudEVkaXRvcihlZGl0b3IpO1xuICAgICAgICAgICAgcmV0dXJuIGVkaXRvckVsZW1lbnQ7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuZG8oKGVsZW1lbnQpID0+IFBPT0wucHVzaCh7IGVsZW1lbnQsIGVkaXRvcjogZWxlbWVudC5nZXRNb2RlbCgpIH0pKVxuICAgICAgICAgICAgLnRvQXJyYXkoKTtcbiAgICB9XG4gICAgc2V0VGltZW91dCgoKSA9PiBwb3B1bGF0ZVBvb2woKSwgMTAwMDApO1xuICAgIGZ1bmN0aW9uIHJlcXVlc3QoKSB7XG4gICAgICAgIGlmIChQT09MLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgeyBlZGl0b3IsIGVsZW1lbnQgfSA9IFBPT0wucG9wKCk7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihuZXcgUmVzdWx0KGVkaXRvciwgZWxlbWVudCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHBvcHVsYXRlUG9vbCgpLmZsYXRNYXAoKCkgPT4gcmVxdWVzdCgpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXROZXh0KCkge1xuICAgICAgICAgICAgaWYgKCFQT09MLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlLCByZXN1bHQ6IG51bGwgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHsgZWRpdG9yLCBlbGVtZW50IH0gPSBQT09MLnBvcCgpO1xuICAgICAgICAgICAgcmV0dXJuIHsgc3VjY2VzczogdHJ1ZSwgcmVzdWx0OiBuZXcgUmVzdWx0KGVkaXRvciwgZWxlbWVudCkgfTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWVzdFxuICAgIH07XG59KSgpO1xuZXhwb3J0IGNsYXNzIEVkaXRvckVsZW1lbnQgZXh0ZW5kcyBIVE1MU3BhbkVsZW1lbnQge1xuICAgIGdldCB1c2FnZSgpIHsgcmV0dXJuIHRoaXMuX3VzYWdlOyB9XG4gICAgc2V0IHVzYWdlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX2VkaXRvclRleHQgPSBudWxsO1xuICAgICAgICB0aGlzLl91c2FnZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLl93aGl0ZXNwYWNlID0gMDtcbiAgICAgICAgY29uc3QgdGV4dCA9IHRoaXMuX3VzYWdlLlRleHQ7XG4gICAgICAgIGNvbnN0IHVzYWdlTGVuZ3RoID0gdGhpcy5fdXNhZ2UuRW5kQ29sdW1uIC0gdGhpcy5fdXNhZ2UuQ29sdW1uO1xuICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5fdXNhZ2UuQ29sdW1uOyBpID4gLTE7IGktLSkge1xuICAgICAgICAgICAgY29uc3QgY2h1bmsgPSB0ZXh0LnN1YnN0cihpKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGNodW5rKTtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gY2h1bmsubWF0Y2goL14oKD86QHxffFthLXpBLVpdKVtcXHddKikoPzpbXFxXXXwkKS8pO1xuICAgICAgICAgICAgaWYgKCFtYXRjaClcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1hdGNoKTtcbiAgICAgICAgICAgIGNvbnN0IHYgPSBtYXRjaFsxXTtcbiAgICAgICAgICAgIGlmICh2Lmxlbmd0aCA9PT0gdXNhZ2VMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl93aGl0ZXNwYWNlID0gdGhpcy5fdXNhZ2UuQ29sdW1uIC0gaTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fcHJlKSB7XG4gICAgICAgICAgICB0aGlzLl9wcmUuaW5uZXJUZXh0ID0gXy50cmltU3RhcnQodmFsdWUuVGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2VkaXRvcikge1xuICAgICAgICAgICAgdGhpcy5zZXRFZGl0b3JUZXh0KHRoaXMuX2dyYW1tYXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldCBlZGl0b3JUZXh0KCkgeyByZXR1cm4gdGhpcy5fZWRpdG9yVGV4dDsgfVxuICAgIHNldCBlZGl0b3JUZXh0KHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3VzYWdlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZWRpdG9yVGV4dCA9IHZhbHVlO1xuICAgICAgICBpZiAodGhpcy5fcHJlKSB7XG4gICAgICAgICAgICB0aGlzLl9wcmUuaW5uZXJUZXh0ID0gXy50cmltU3RhcnQodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9lZGl0b3IpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RWRpdG9yVGV4dCh0aGlzLl9ncmFtbWFyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzZXRFZGl0b3JUZXh0KGdyYW1tYXIpIHtcbiAgICAgICAgaWYgKHRoaXMuX3VzYWdlKSB7XG4gICAgICAgICAgICBjb25zdCB0ZXh0ID0gdGhpcy5fdXNhZ2UuVGV4dDtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvci5fc2V0R3JhbW1hcihncmFtbWFyKTtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvci5zZXRUZXh0KF8udHJpbVN0YXJ0KHRleHQpKTtcbiAgICAgICAgICAgIGNvbnN0IG1hcmtlciA9IHRoaXMuX2VkaXRvci5tYXJrQnVmZmVyUmFuZ2UoW1swLCArdGhpcy5fdXNhZ2UuQ29sdW1uIC0gdGhpcy5fd2hpdGVzcGFjZV0sIFsrdGhpcy5fdXNhZ2UuRW5kTGluZSAtICt0aGlzLl91c2FnZS5MaW5lLCArdGhpcy5fdXNhZ2UuRW5kQ29sdW1uIC0gdGhpcy5fd2hpdGVzcGFjZV1dKTtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHsgdHlwZTogXCJoaWdobGlnaHRcIiwgY2xhc3M6IFwiZmluZHVzYWdlcy11bmRlcmxpbmVcIiB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvci5zZXRUZXh0KF8udHJpbSh0aGlzLl9lZGl0b3JUZXh0KSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGlmICghdGhpcy5fcHJlKSB7XG4gICAgICAgICAgICB0aGlzLl9wcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xuICAgICAgICAgICAgdGhpcy5fcHJlLmlubmVyVGV4dCA9IHRoaXMuX3VzYWdlICYmIHRoaXMuX3VzYWdlLlRleHQgfHwgdGhpcy5lZGl0b3JUZXh0O1xuICAgICAgICAgICAgdGhpcy5fcHJlLnN0eWxlLmZvbnRTaXplID0gYCR7YXRvbS5jb25maWcuZ2V0KFwiZWRpdG9yLmZvbnRTaXplXCIpfXB4ICFpbXBvcnRhbnRgO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fcHJlKTtcbiAgICB9XG4gICAgcmV2ZXJ0KCkge1xuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9kZXRhY2hFZGl0b3IodHJ1ZSkpO1xuICAgIH1cbiAgICBlbmhhbmNlKCkge1xuICAgICAgICBpZiAodGhpcy5fZW5oYW5jZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuX2VuaGFuY2VkID0gdHJ1ZTtcbiAgICAgICAgY29uc3QgbmV4dCA9IHBvb2wuZ2V0TmV4dCgpO1xuICAgICAgICBpZiAobmV4dC5zdWNjZXNzKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fdXNhZ2UgJiYgYXRvbS5jb25maWcuZ2V0KFwib21uaXNoYXJwLWF0b20uZW5oYW5jZWRIaWdobGlnaHRpbmdcIikpIHtcbiAgICAgICAgICAgICAgICBsZXQgcyA9IHJlcXVlc3QoeyBmaWxlUGF0aDogdGhpcy5fdXNhZ2UuRmlsZU5hbWUsIHN0YXJ0TGluZTogdGhpcy5fdXNhZ2UuTGluZSwgZW5kTGluZTogdGhpcy5fdXNhZ2UuRW5kTGluZSwgd2hpdGVzcGFjZTogdGhpcy5fd2hpdGVzcGFjZSB9KVxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZ3JhbW1hciA9IHRoaXMuX2dyYW1tYXIgPSBnZXRFbmhhbmNlZEdyYW1tYXIobmV4dC5yZXN1bHQuZWRpdG9yLCBfLmZpbmQoT21uaS5ncmFtbWFycywgZyA9PiBfLnNvbWUoZy5maWxlVHlwZXMsIGZ0ID0+IF8uZW5kc1dpdGgodGhpcy5fdXNhZ2UuRmlsZU5hbWUsIGAuJHtmdH1gKSkpLCB7IHJlYWRvbmx5OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICBncmFtbWFyLnNldFJlc3BvbnNlcyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2F0dGFjaEVkaXRvcihuZXh0LnJlc3VsdCwgZ3JhbW1hcikpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHMpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2F0dGFjaEVkaXRvcihuZXh0LnJlc3VsdCkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGV0IHMgPSBwb29sLnJlcXVlc3QoKS5zdWJzY3JpYmUoKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl91c2FnZSAmJiBhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbS5lbmhhbmNlZEhpZ2hsaWdodGluZ1wiKSkge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcyA9IHJlcXVlc3QoeyBmaWxlUGF0aDogdGhpcy5fdXNhZ2UuRmlsZU5hbWUsIHN0YXJ0TGluZTogdGhpcy5fdXNhZ2UuTGluZSwgZW5kTGluZTogdGhpcy5fdXNhZ2UuRW5kTGluZSwgd2hpdGVzcGFjZTogdGhpcy5fd2hpdGVzcGFjZSB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBncmFtbWFyID0gdGhpcy5fZ3JhbW1hciA9IGdldEVuaGFuY2VkR3JhbW1hcihyZXN1bHQuZWRpdG9yLCBfLmZpbmQoT21uaS5ncmFtbWFycywgZyA9PiBfLnNvbWUoZy5maWxlVHlwZXMsIGZ0ID0+IF8uZW5kc1dpdGgodGhpcy5fdXNhZ2UuRmlsZU5hbWUsIGAuJHtmdH1gKSkpLCB7IHJlYWRvbmx5OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3JhbW1hci5zZXRSZXNwb25zZXMocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fYXR0YWNoRWRpdG9yKHJlc3VsdCwgZ3JhbW1hcikpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQocyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fYXR0YWNoRWRpdG9yKHJlc3VsdCkpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUucmVtb3ZlKHMpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBfYXR0YWNoRWRpdG9yKHJlc3VsdCwgZ3JhbW1hcikge1xuICAgICAgICBpZiAodGhpcy5fcHJlKSB7XG4gICAgICAgICAgICB0aGlzLl9wcmUucmVtb3ZlKCk7XG4gICAgICAgICAgICB0aGlzLl9wcmUgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlbGVhc2UgPSByZXN1bHQ7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHJlc3VsdCk7XG4gICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQgPSByZXN1bHQuZWxlbWVudDtcbiAgICAgICAgdGhpcy5fZWRpdG9yID0gcmVzdWx0LmVkaXRvcjtcbiAgICAgICAgdGhpcy5zZXRFZGl0b3JUZXh0KGdyYW1tYXIgfHwgdGhpcy5fZ3JhbW1hcik7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fZWRpdG9yRWxlbWVudCk7XG4gICAgfVxuICAgIF9kZXRhY2hFZGl0b3IoYXBwZW5kKSB7XG4gICAgICAgIGlmIChhcHBlbmQpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJwcmVcIik7XG4gICAgICAgICAgICB0aGlzLl9wcmUuaW5uZXJUZXh0ID0gdGhpcy5fdXNhZ2UgJiYgdGhpcy5fdXNhZ2UuVGV4dCB8fCB0aGlzLmVkaXRvclRleHQ7XG4gICAgICAgICAgICB0aGlzLl9wcmUuc3R5bGUuZm9udFNpemUgPSBgJHthdG9tLmNvbmZpZy5nZXQoXCJlZGl0b3IuZm9udFNpemVcIil9cHggIWltcG9ydGFudGA7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX3ByZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3JlbGVhc2UpIHtcbiAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUucmVtb3ZlKHRoaXMuX3JlbGVhc2UpO1xuICAgICAgICAgICAgdGhpcy5fcmVsZWFzZS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2VkaXRvckVsZW1lbnQpXG4gICAgICAgICAgICB0aGlzLl9lZGl0b3JFbGVtZW50LnJlbW92ZSgpO1xuICAgICAgICB0aGlzLl9lZGl0b3IgPSBudWxsO1xuICAgICAgICB0aGlzLl9lZGl0b3JFbGVtZW50ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZW5oYW5jZWQgPSBmYWxzZTtcbiAgICB9XG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fZGV0YWNoRWRpdG9yKCk7XG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHJlcXVlc3QoeyBmaWxlUGF0aCwgc3RhcnRMaW5lLCBlbmRMaW5lLCB3aGl0ZXNwYWNlIH0pIHtcbiAgICByZXR1cm4gT21uaS5yZXF1ZXN0KGNsaWVudCA9PiBjbGllbnQuaGlnaGxpZ2h0KHtcbiAgICAgICAgQnVmZmVyOiBudWxsLFxuICAgICAgICBGaWxlTmFtZTogZmlsZVBhdGgsXG4gICAgICAgIExpbmVzOiBfLnJhbmdlKHN0YXJ0TGluZSwgZW5kTGluZSksXG4gICAgICAgIEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnM6IGN1c3RvbUV4Y2x1ZGVzXG4gICAgfSwgeyBzaWxlbnQ6IHRydWUgfSkpXG4gICAgICAgIC5tYXAocmVzcG9uc2UgPT4gXyhyZXNwb25zZS5IaWdobGlnaHRzKVxuICAgICAgICAubWFwKHggPT4gKHtcbiAgICAgICAgU3RhcnRMaW5lOiB4LlN0YXJ0TGluZSAtIHN0YXJ0TGluZSxcbiAgICAgICAgU3RhcnRDb2x1bW46ICh4LlN0YXJ0TGluZSA9PT0gc3RhcnRMaW5lID8geC5TdGFydENvbHVtbiAtIHdoaXRlc3BhY2UgOiB4LlN0YXJ0Q29sdW1uKSxcbiAgICAgICAgRW5kTGluZTogeC5FbmRMaW5lIC0gc3RhcnRMaW5lLFxuICAgICAgICBFbmRDb2x1bW46ICh4LlN0YXJ0TGluZSA9PT0gc3RhcnRMaW5lID8geC5FbmRDb2x1bW4gLSB3aGl0ZXNwYWNlIDogeC5FbmRDb2x1bW4pLFxuICAgICAgICBLaW5kOiB4LktpbmQsXG4gICAgICAgIFByb2plY3RzOiB4LlByb2plY3RzXG4gICAgfSkpXG4gICAgICAgIC52YWx1ZSgpKVxuICAgICAgICAuZmlsdGVyKHggPT4geC5sZW5ndGggPiAwKTtcbn1cbmV4cG9ydHMuRWRpdG9yRWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1lZGl0b3ItZWxlbWVudFwiLCB7IHByb3RvdHlwZTogRWRpdG9yRWxlbWVudC5wcm90b3R5cGUgfSk7XG4iLCJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7RGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQge2dldEVuaGFuY2VkR3JhbW1hciwgYXVnbWVudEVkaXRvciwgRXhjbHVkZUNsYXNzaWZpY2F0aW9uc30gZnJvbSBcIi4uL2ZlYXR1cmVzL2hpZ2hsaWdodFwiO1xuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmxldCBmYXN0ZG9tOiB0eXBlb2YgRmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xuXG5jb25zdCBjdXN0b21FeGNsdWRlcyA9IEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnMuY29uY2F0KFtcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uSWRlbnRpZmllcixcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uUHJlcHJvY2Vzc29yS2V5d29yZCxcbiAgICBNb2RlbHMuSGlnaGxpZ2h0Q2xhc3NpZmljYXRpb24uRXhjbHVkZWRDb2RlLFxuXSk7XG5cbmNvbnN0IHBvb2wgPSAoZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgTlVNX1RPX0tFRVAgPSAxMDtcbiAgICBjb25zdCBQT09MOiB7IGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yOyBlbGVtZW50OiBBdG9tLlRleHRFZGl0b3JDb21wb25lbnQ7IH1bXSA9IFtdO1xuXG4gICAgY29uc3QgY2xlYW51cFBvb2wgPSBfLnRocm90dGxlKGZ1bmN0aW9uIGNsZWFudXBQb29sKCkge1xuICAgICAgICBpZiAoUE9PTC5sZW5ndGggPiBOVU1fVE9fS0VFUCkge1xuICAgICAgICAgICAgY29uc3QgbGVuID0gTWF0aC5taW4oUE9PTC5sZW5ndGggLSBOVU1fVE9fS0VFUCwgMTApO1xuICAgICAgICAgICAgbGV0IHJlbW92ZSA9IFBPT0wuc3BsaWNlKDAsIGxlbik7XG4gICAgICAgICAgICByZW1vdmUuZm9yRWFjaCh4ID0+IHguZWRpdG9yLmRlc3Ryb3koKSk7XG5cbiAgICAgICAgICAgIGNsZWFudXBQb29sKCk7XG4gICAgICAgIH1cbiAgICB9LCAxMDAwMCwgeyB0cmFpbGluZzogdHJ1ZSB9KTtcblxuICAgIGNsYXNzIFJlc3VsdCBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcbiAgICAgICAgcHJpdmF0ZSBfZGlzcG9zYWJsZSA9IERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHtlZGl0b3IsIGVsZW1lbnR9ID0gdGhpcztcbiAgICAgICAgICAgIChlbGVtZW50IGFzIGFueSkucmVtb3ZlKCk7XG4gICAgICAgICAgICBQT09MLnB1c2goeyBlZGl0b3IsIGVsZW1lbnQgfSk7XG5cbiAgICAgICAgICAgIGVkaXRvci5zZXRHcmFtbWFyKE9tbmkuZ3JhbW1hcnNbMF0pO1xuICAgICAgICAgICAgZWRpdG9yLnNldFRleHQoXCJcIik7XG5cbiAgICAgICAgICAgIGNsZWFudXBQb29sKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgcHVibGljIGVsZW1lbnQ6IEF0b20uVGV4dEVkaXRvckNvbXBvbmVudCkgeyB9XG5cbiAgICAgICAgcHVibGljIGRpc3Bvc2UoKSB7XG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvcHVsYXRlUG9vbCgpIHtcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuaW50ZXJ2YWwoNTApXG4gICAgICAgICAgICAudGFrZSgxMClcbiAgICAgICAgICAgIC5tYXAoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGVkaXRvckVsZW1lbnQgPSA8YW55PmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhdG9tLXRleHQtZWRpdG9yXCIpO1xuICAgICAgICAgICAgICAgIGVkaXRvckVsZW1lbnQuc2V0QXR0cmlidXRlTm9kZShkb2N1bWVudC5jcmVhdGVBdHRyaWJ1dGUoXCJndXR0ZXItaGlkZGVuXCIpKTtcbiAgICAgICAgICAgICAgICBlZGl0b3JFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShcInRhYmluZGV4XCIpOyAvLyBtYWtlIHJlYWQtb25seVxuXG4gICAgICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gKDxhbnk+ZWRpdG9yRWxlbWVudCkuZ2V0TW9kZWwoKTtcbiAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0RGVjb3JhdGlvbnMoeyBjbGFzczogXCJjdXJzb3ItbGluZVwiLCB0eXBlOiBcImxpbmVcIiB9KVswXS5kZXN0cm95KCk7IC8vIHJlbW92ZSB0aGUgZGVmYXVsdCBzZWxlY3Rpb24gb2YgYSBsaW5lIGluIGVhY2ggZWRpdG9yXG4gICAgICAgICAgICAgICAgZWRpdG9yLnNldEdyYW1tYXIoT21uaS5ncmFtbWFyc1swXSk7XG4gICAgICAgICAgICAgICAgZWRpdG9yLnNldFNvZnRXcmFwcGVkKHRydWUpO1xuXG4gICAgICAgICAgICAgICAgYXVnbWVudEVkaXRvcihlZGl0b3IpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIDxBdG9tLlRleHRFZGl0b3JDb21wb25lbnQ+ZWRpdG9yRWxlbWVudDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZG8oKGVsZW1lbnQpID0+IFBPT0wucHVzaCh7IGVsZW1lbnQsIGVkaXRvcjogKDxhbnk+ZWxlbWVudCkuZ2V0TW9kZWwoKSB9KSlcbiAgICAgICAgICAgIC50b0FycmF5KCk7XG4gICAgfVxuXG4gICAgc2V0VGltZW91dCgoKSA9PiBwb3B1bGF0ZVBvb2woKSwgMTAwMDApO1xuXG4gICAgZnVuY3Rpb24gcmVxdWVzdCgpOiBPYnNlcnZhYmxlPFJlc3VsdD4ge1xuICAgICAgICBpZiAoUE9PTC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHtlZGl0b3IsIGVsZW1lbnR9ID0gUE9PTC5wb3AoKTtcblxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YobmV3IFJlc3VsdChlZGl0b3IsIGVsZW1lbnQpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBwb3B1bGF0ZVBvb2woKS5mbGF0TWFwKCgpID0+IHJlcXVlc3QoKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXROZXh0KCkge1xuICAgICAgICAgICAgaWYgKCFQT09MLmxlbmd0aCkgeyByZXR1cm4geyBzdWNjZXNzOiBmYWxzZSwgcmVzdWx0OiBudWxsIH07IH1cbiAgICAgICAgICAgIGNvbnN0IHtlZGl0b3IsIGVsZW1lbnR9ID0gUE9PTC5wb3AoKTtcbiAgICAgICAgICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIHJlc3VsdDogbmV3IFJlc3VsdChlZGl0b3IsIGVsZW1lbnQpIH07XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVlc3RcbiAgICB9O1xufSkoKTtcblxuZXhwb3J0IGNsYXNzIEVkaXRvckVsZW1lbnQgZXh0ZW5kcyBIVE1MU3BhbkVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xuICAgIHByaXZhdGUgX3ByZTogSFRNTFByZUVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBfZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcbiAgICBwcml2YXRlIF9yZWxlYXNlOiBJRGlzcG9zYWJsZTtcbiAgICBwcml2YXRlIF9lZGl0b3JFbGVtZW50OiBBdG9tLlRleHRFZGl0b3JDb21wb25lbnQ7XG4gICAgcHJpdmF0ZSBfZWRpdG9yOiBBdG9tLlRleHRFZGl0b3I7XG4gICAgcHJpdmF0ZSBfd2hpdGVzcGFjZTogbnVtYmVyO1xuICAgIHByaXZhdGUgX2dyYW1tYXI6IEZpcnN0TWF0ZS5HcmFtbWFyO1xuXG4gICAgcHJpdmF0ZSBfdXNhZ2U6IE1vZGVscy5RdWlja0ZpeDtcbiAgICBwdWJsaWMgZ2V0IHVzYWdlKCkgeyByZXR1cm4gdGhpcy5fdXNhZ2U7IH1cbiAgICBwdWJsaWMgc2V0IHVzYWdlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX2VkaXRvclRleHQgPSBudWxsO1xuICAgICAgICB0aGlzLl91c2FnZSA9IHZhbHVlO1xuXG4gICAgICAgIHRoaXMuX3doaXRlc3BhY2UgPSAwO1xuXG4gICAgICAgIGNvbnN0IHRleHQgPSB0aGlzLl91c2FnZS5UZXh0O1xuICAgICAgICBjb25zdCB1c2FnZUxlbmd0aCA9IHRoaXMuX3VzYWdlLkVuZENvbHVtbiAtIHRoaXMuX3VzYWdlLkNvbHVtbjtcbiAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMuX3VzYWdlLkNvbHVtbjsgaSA+IC0xOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0IGNodW5rID0gdGV4dC5zdWJzdHIoaSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhjaHVuayk7XG4gICAgICAgICAgICAvLyBUaGlzIHJlZ2V4IHBlcmhhcHMgbmVlZHMgdG8gYmUgaW1wcm92ZWRcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gY2h1bmsubWF0Y2goL14oKD86QHxffFthLXpBLVpdKVtcXHddKikoPzpbXFxXXXwkKS8pO1xuICAgICAgICAgICAgaWYgKCFtYXRjaCkgY29udGludWU7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtYXRjaCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHYgPSBtYXRjaFsxXTtcbiAgICAgICAgICAgIGlmICh2Lmxlbmd0aCA9PT0gdXNhZ2VMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl93aGl0ZXNwYWNlID0gdGhpcy5fdXNhZ2UuQ29sdW1uIC0gaTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSBfLnRyaW1TdGFydCh2YWx1ZS5UZXh0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9lZGl0b3IpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0RWRpdG9yVGV4dCh0aGlzLl9ncmFtbWFyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX2VkaXRvclRleHQ6IHN0cmluZztcbiAgICBwdWJsaWMgZ2V0IGVkaXRvclRleHQoKSB7IHJldHVybiB0aGlzLl9lZGl0b3JUZXh0OyB9XG4gICAgcHVibGljIHNldCBlZGl0b3JUZXh0KHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3VzYWdlID0gbnVsbDtcbiAgICAgICAgdGhpcy5fZWRpdG9yVGV4dCA9IHZhbHVlO1xuXG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSBfLnRyaW1TdGFydCh2YWx1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fZWRpdG9yKSB7XG4gICAgICAgICAgICB0aGlzLnNldEVkaXRvclRleHQodGhpcy5fZ3JhbW1hcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHNldEVkaXRvclRleHQoZ3JhbW1hcjogRmlyc3RNYXRlLkdyYW1tYXIpIHtcbiAgICAgICAgaWYgKHRoaXMuX3VzYWdlKSB7XG4gICAgICAgICAgICBjb25zdCB0ZXh0ID0gdGhpcy5fdXNhZ2UuVGV4dDtcblxuICAgICAgICAgICAgKHRoaXMuX2VkaXRvciBhcyBhbnkpLl9zZXRHcmFtbWFyKDxhbnk+Z3JhbW1hcik7XG4gICAgICAgICAgICB0aGlzLl9lZGl0b3Iuc2V0VGV4dChfLnRyaW1TdGFydCh0ZXh0KSk7XG5cbiAgICAgICAgICAgIGNvbnN0IG1hcmtlciA9IHRoaXMuX2VkaXRvci5tYXJrQnVmZmVyUmFuZ2UoW1swLCArdGhpcy5fdXNhZ2UuQ29sdW1uIC0gdGhpcy5fd2hpdGVzcGFjZV0sIFsrdGhpcy5fdXNhZ2UuRW5kTGluZSAtICt0aGlzLl91c2FnZS5MaW5lLCArdGhpcy5fdXNhZ2UuRW5kQ29sdW1uIC0gdGhpcy5fd2hpdGVzcGFjZV1dKTtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvci5kZWNvcmF0ZU1hcmtlcihtYXJrZXIsIHsgdHlwZTogXCJoaWdobGlnaHRcIiwgY2xhc3M6IFwiZmluZHVzYWdlcy11bmRlcmxpbmVcIiB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvci5zZXRUZXh0KF8udHJpbSh0aGlzLl9lZGl0b3JUZXh0KSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGlmICghdGhpcy5fcHJlKSB7XG4gICAgICAgICAgICB0aGlzLl9wcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xuICAgICAgICAgICAgdGhpcy5fcHJlLmlubmVyVGV4dCA9IHRoaXMuX3VzYWdlICYmIHRoaXMuX3VzYWdlLlRleHQgfHwgdGhpcy5lZGl0b3JUZXh0O1xuICAgICAgICAgICAgdGhpcy5fcHJlLnN0eWxlLmZvbnRTaXplID0gYCR7YXRvbS5jb25maWcuZ2V0KFwiZWRpdG9yLmZvbnRTaXplXCIpfXB4ICFpbXBvcnRhbnRgO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fcHJlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmV2ZXJ0KCkge1xuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9kZXRhY2hFZGl0b3IodHJ1ZSkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2VuaGFuY2VkOiBib29sZWFuO1xuICAgIHB1YmxpYyBlbmhhbmNlKCkge1xuICAgICAgICBpZiAodGhpcy5fZW5oYW5jZWQpIHJldHVybjtcbiAgICAgICAgdGhpcy5fZW5oYW5jZWQgPSB0cnVlO1xuXG4gICAgICAgIGNvbnN0IG5leHQgPSBwb29sLmdldE5leHQoKTtcbiAgICAgICAgaWYgKG5leHQuc3VjY2Vzcykge1xuICAgICAgICAgICAgaWYgKHRoaXMuX3VzYWdlICYmIGF0b20uY29uZmlnLmdldDxib29sZWFuPihcIm9tbmlzaGFycC1hdG9tLmVuaGFuY2VkSGlnaGxpZ2h0aW5nXCIpKSB7XG4gICAgICAgICAgICAgICAgbGV0IHMgPSByZXF1ZXN0KHsgZmlsZVBhdGg6IHRoaXMuX3VzYWdlLkZpbGVOYW1lLCBzdGFydExpbmU6IHRoaXMuX3VzYWdlLkxpbmUsIGVuZExpbmU6IHRoaXMuX3VzYWdlLkVuZExpbmUsIHdoaXRlc3BhY2U6IHRoaXMuX3doaXRlc3BhY2UgfSlcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShyZXNwb25zZSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBncmFtbWFyID0gdGhpcy5fZ3JhbW1hciA9IGdldEVuaGFuY2VkR3JhbW1hcihuZXh0LnJlc3VsdC5lZGl0b3IsIF8uZmluZChPbW5pLmdyYW1tYXJzLCBnID0+IF8uc29tZSgoPGFueT5nKS5maWxlVHlwZXMsIGZ0ID0+IF8uZW5kc1dpdGgodGhpcy5fdXNhZ2UuRmlsZU5hbWUsIGAuJHtmdH1gKSkpLCB7IHJlYWRvbmx5OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+Z3JhbW1hcikuc2V0UmVzcG9uc2VzKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2F0dGFjaEVkaXRvcihuZXh0LnJlc3VsdCwgZ3JhbW1hcikpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9hdHRhY2hFZGl0b3IobmV4dC5yZXN1bHQpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCBzID0gcG9vbC5yZXF1ZXN0KCkuc3Vic2NyaWJlKChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fdXNhZ2UgJiYgYXRvbS5jb25maWcuZ2V0PGJvb2xlYW4+KFwib21uaXNoYXJwLWF0b20uZW5oYW5jZWRIaWdobGlnaHRpbmdcIikpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHMgPSByZXF1ZXN0KHsgZmlsZVBhdGg6IHRoaXMuX3VzYWdlLkZpbGVOYW1lLCBzdGFydExpbmU6IHRoaXMuX3VzYWdlLkxpbmUsIGVuZExpbmU6IHRoaXMuX3VzYWdlLkVuZExpbmUsIHdoaXRlc3BhY2U6IHRoaXMuX3doaXRlc3BhY2UgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocmVzcG9uc2UgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyYW1tYXIgPSB0aGlzLl9ncmFtbWFyID0gZ2V0RW5oYW5jZWRHcmFtbWFyKHJlc3VsdC5lZGl0b3IsIF8uZmluZChPbW5pLmdyYW1tYXJzLCBnID0+IF8uc29tZSgoPGFueT5nKS5maWxlVHlwZXMsIGZ0ID0+IF8uZW5kc1dpdGgodGhpcy5fdXNhZ2UuRmlsZU5hbWUsIGAuJHtmdH1gKSkpLCB7IHJlYWRvbmx5OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PmdyYW1tYXIpLnNldFJlc3BvbnNlcyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fYXR0YWNoRWRpdG9yKHJlc3VsdCwgZ3JhbW1hcikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHMpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2F0dGFjaEVkaXRvcihyZXN1bHQpKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLnJlbW92ZShzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQocyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9hdHRhY2hFZGl0b3IocmVzdWx0OiB7IGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yOyBlbGVtZW50OiBBdG9tLlRleHRFZGl0b3JDb21wb25lbnQ7IGRpc3Bvc2U6ICgpID0+IHZvaWQgfSwgZ3JhbW1hcj86IEZpcnN0TWF0ZS5HcmFtbWFyKSB7XG4gICAgICAgIGlmICh0aGlzLl9wcmUpIHtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5yZW1vdmUoKTtcbiAgICAgICAgICAgIHRoaXMuX3ByZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9yZWxlYXNlID0gcmVzdWx0O1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChyZXN1bHQpO1xuICAgICAgICB0aGlzLl9lZGl0b3JFbGVtZW50ID0gcmVzdWx0LmVsZW1lbnQ7XG4gICAgICAgIHRoaXMuX2VkaXRvciA9IHJlc3VsdC5lZGl0b3I7XG4gICAgICAgIHRoaXMuc2V0RWRpdG9yVGV4dChncmFtbWFyIHx8IHRoaXMuX2dyYW1tYXIpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKDxhbnk+dGhpcy5fZWRpdG9yRWxlbWVudCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZGV0YWNoRWRpdG9yKGFwcGVuZD86IGJvb2xlYW4pIHtcbiAgICAgICAgaWYgKGFwcGVuZCkge1xuICAgICAgICAgICAgdGhpcy5fcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5pbm5lclRleHQgPSB0aGlzLl91c2FnZSAmJiB0aGlzLl91c2FnZS5UZXh0IHx8IHRoaXMuZWRpdG9yVGV4dDtcbiAgICAgICAgICAgIHRoaXMuX3ByZS5zdHlsZS5mb250U2l6ZSA9IGAke2F0b20uY29uZmlnLmdldChcImVkaXRvci5mb250U2l6ZVwiKX1weCAhaW1wb3J0YW50YDtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fcHJlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9yZWxlYXNlKSB7XG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLnJlbW92ZSh0aGlzLl9yZWxlYXNlKTtcbiAgICAgICAgICAgIHRoaXMuX3JlbGVhc2UuZGlzcG9zZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2VkaXRvckVsZW1lbnQpXG4gICAgICAgICAgICAodGhpcy5fZWRpdG9yRWxlbWVudCBhcyBhbnkpLnJlbW92ZSgpO1xuXG4gICAgICAgIHRoaXMuX2VkaXRvciA9IG51bGw7XG4gICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQgPSBudWxsO1xuICAgICAgICB0aGlzLl9lbmhhbmNlZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZXRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9kZXRhY2hFZGl0b3IoKTtcbiAgICAgICAgaWYgKHRoaXMuX3ByZSkge1xuICAgICAgICAgICAgdGhpcy5fcHJlLnJlbW92ZSgpO1xuICAgICAgICAgICAgdGhpcy5fcHJlLmlubmVyVGV4dCA9IFwiXCI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiByZXF1ZXN0KHtmaWxlUGF0aCwgc3RhcnRMaW5lLCBlbmRMaW5lLCB3aGl0ZXNwYWNlfTogeyBmaWxlUGF0aDogc3RyaW5nOyBzdGFydExpbmU6IG51bWJlcjsgZW5kTGluZTogbnVtYmVyOyB3aGl0ZXNwYWNlOiBudW1iZXI7IH0pIHtcbiAgICByZXR1cm4gT21uaS5yZXF1ZXN0KGNsaWVudCA9PiBjbGllbnQuaGlnaGxpZ2h0KHtcbiAgICAgICAgQnVmZmVyOiBudWxsLFxuICAgICAgICBGaWxlTmFtZTogZmlsZVBhdGgsXG4gICAgICAgIExpbmVzOiBfLnJhbmdlKHN0YXJ0TGluZSwgZW5kTGluZSksXG4gICAgICAgIEV4Y2x1ZGVDbGFzc2lmaWNhdGlvbnM6IGN1c3RvbUV4Y2x1ZGVzXG4gICAgfSwgeyBzaWxlbnQ6IHRydWUgfSkpXG4gICAgICAgIC5tYXAocmVzcG9uc2UgPT4gXyhyZXNwb25zZS5IaWdobGlnaHRzKVxuICAgICAgICAgICAgLy8uZmlsdGVyKHggPT4geC5TdGFydExpbmUgPj0gcmVxdWVzdC5zdGFydExpbmUgJiYgeC5FbmRMaW5lIDw9IHJlcXVlc3QuZW5kTGluZSlcbiAgICAgICAgICAgIC5tYXAoeCA9PiAoe1xuICAgICAgICAgICAgICAgIFN0YXJ0TGluZTogeC5TdGFydExpbmUgLSBzdGFydExpbmUsXG4gICAgICAgICAgICAgICAgU3RhcnRDb2x1bW46ICh4LlN0YXJ0TGluZSA9PT0gc3RhcnRMaW5lID8geC5TdGFydENvbHVtbiAtIHdoaXRlc3BhY2UgOiB4LlN0YXJ0Q29sdW1uKSxcbiAgICAgICAgICAgICAgICBFbmRMaW5lOiB4LkVuZExpbmUgLSBzdGFydExpbmUsXG4gICAgICAgICAgICAgICAgRW5kQ29sdW1uOiAoeC5TdGFydExpbmUgPT09IHN0YXJ0TGluZSA/IHguRW5kQ29sdW1uIC0gd2hpdGVzcGFjZSA6IHguRW5kQ29sdW1uKSxcbiAgICAgICAgICAgICAgICBLaW5kOiB4LktpbmQsXG4gICAgICAgICAgICAgICAgUHJvamVjdHM6IHguUHJvamVjdHNcbiAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgLnZhbHVlKCkpXG4gICAgICAgIC5maWx0ZXIoeCA9PiB4Lmxlbmd0aCA+IDApO1xufVxuXG4oPGFueT5leHBvcnRzKS5FZGl0b3JFbGVtZW50ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1lZGl0b3ItZWxlbWVudFwiLCB7IHByb3RvdHlwZTogRWRpdG9yRWxlbWVudC5wcm90b3R5cGUgfSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

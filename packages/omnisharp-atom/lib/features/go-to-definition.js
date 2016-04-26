"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.goToDefintion = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $ = require("jquery");
var Range = require("atom").Range;
var identifierRegex = /^identifier|identifier$|\.identifier\./;

var GoToDefinition = function () {
    function GoToDefinition() {
        _classCallCheck(this, GoToDefinition);

        this.required = true;
        this.title = "Go To Definition";
        this.description = "Adds support to goto definition, as well as display metadata returned by a goto definition metadata response";
    }

    _createClass(GoToDefinition, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            var altGotoDefinition = false;
            this.disposable.add(atom.config.observe("omnisharp-atom:altGotoDefinition", function (value) {
                return altGotoDefinition = value;
            }));
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                var view = $(atom.views.getView(editor));
                var scroll = _this.getFromShadowDom(view, ".scroll-view");
                if (!scroll[0]) {
                    return;
                }
                var click = _rxjs.Observable.fromEvent(scroll[0], "click");
                var mousemove = _rxjs.Observable.fromEvent(scroll[0], "mousemove");
                var keyup = _rxjs.Observable.merge(_rxjs.Observable.fromEvent(view[0], "focus"), _rxjs.Observable.fromEvent(view[0], "blur"), _rxjs.Observable.fromEventPattern(function (x) {
                    atom.getCurrentWindow().on("focus", x);
                }, function (x) {
                    atom.getCurrentWindow().removeListener("focus", x);
                }), _rxjs.Observable.fromEventPattern(function (x) {
                    atom.getCurrentWindow().on("blur", x);
                }, function (x) {
                    atom.getCurrentWindow().removeListener("blur", x);
                }), _rxjs.Observable.fromEvent(view[0], "keyup").filter(function (x) {
                    return altGotoDefinition ? x.which === 18 : x.which === 17 || x.which === 224 || x.which === 93 || x.which === 92 || x.which === 91;
                })).throttleTime(100);
                var keydown = _rxjs.Observable.fromEvent(view[0], "keydown").filter(function (z) {
                    return !z.repeat;
                }).filter(function (e) {
                    return altGotoDefinition ? e.altKey : e.ctrlKey || e.metaKey;
                }).throttleTime(100);
                var specialKeyDown = keydown.switchMap(function (x) {
                    return mousemove.takeUntil(keyup).map(function (event) {
                        var pixelPt = _this.pixelPositionFromMouseEvent(editor, view, event);
                        if (!pixelPt) return;
                        var screenPt = editor.screenPositionForPixelPosition(pixelPt);
                        return editor.bufferPositionForScreenPosition(screenPt);
                    }).filter(function (a) {
                        return !!a;
                    }).startWith(editor.getCursorBufferPosition()).map(function (bufferPt) {
                        return { bufferPt: bufferPt, range: _this.getWordRange(editor, bufferPt) };
                    }).filter(function (z) {
                        return !!z.range;
                    }).distinctUntilChanged(function (current, next) {
                        return current.range.isEqual(next.range);
                    });
                });
                editor.onDidDestroy(function () {
                    return cd.dispose();
                });
                var eventDisposable = void 0;
                cd.add(atom.config.observe("omnisharp-atom.enhancedHighlighting", function (enabled) {
                    _this.enhancedHighlighting = enabled;
                    if (eventDisposable) {
                        eventDisposable.unsubscribe();
                        cd.remove(eventDisposable);
                    }
                    var observable = specialKeyDown;
                    if (!enabled) {
                        observable = observable.debounceTime(200);
                    }
                    eventDisposable = observable.subscribe(function (_ref) {
                        var bufferPt = _ref.bufferPt;
                        var range = _ref.range;
                        return _this.underlineIfNavigable(editor, bufferPt, range);
                    });
                    cd.add(eventDisposable);
                }));
                cd.add(keyup.subscribe(function () {
                    return _this.removeMarker();
                }));
                cd.add(click.subscribe(function (e) {
                    if (!e.ctrlKey && !e.metaKey) {
                        return;
                    }
                    if (altGotoDefinition && !e.altKey) {
                        return;
                    }
                    _this.removeMarker();
                    _this.goToDefinition();
                }));
                _this.disposable.add(cd);
            }));
            this.disposable.add(atom.emitter.on("symbols-view:go-to-declaration", function () {
                return _this.goToDefinition();
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:go-to-definition", function () {
                return _this.goToDefinition();
            }));
            this.disposable.add(atom.config.observe("omnisharp-atom.wantMetadata", function (enabled) {
                _this.wantMetadata = enabled;
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "goToDefinition",
        value: function goToDefinition() {
            var _this2 = this;

            var editor = atom.workspace.getActiveTextEditor();
            if (editor) {
                (function () {
                    var word = editor.getWordUnderCursor();
                    _omni.Omni.request(editor, function (solution) {
                        return solution.gotodefinition({
                            WantMetadata: _this2.wantMetadata
                        });
                    }).subscribe(function (data) {
                        if (data.FileName != null) {
                            _omni.Omni.navigateTo(data);
                        } else if (data.MetadataSource) {
                            var _data$MetadataSource = data.MetadataSource;
                            var AssemblyName = _data$MetadataSource.AssemblyName;
                            var TypeName = _data$MetadataSource.TypeName;

                            atom.workspace.open("omnisharp://metadata/" + AssemblyName + "/" + TypeName, {
                                initialLine: data.Line,
                                initialColumn: data.Column,
                                searchAllPanes: true
                            });
                        } else {
                            atom.notifications.addWarning("Can't navigate to " + word);
                        }
                    });
                })();
            }
        }
    }, {
        key: "getWordRange",
        value: function getWordRange(editor, bufferPt) {
            var buffer = editor.getBuffer();
            var startColumn = bufferPt.column;
            var endColumn = bufferPt.column;
            var line = buffer.getLines()[bufferPt.row];
            if (!/[A-Z_0-9]/i.test(line[bufferPt.column])) {
                if (this.marker) this.removeMarker();
                return;
            }
            while (startColumn > 0 && /[A-Z_0-9]/i.test(line[--startColumn])) {}
            while (endColumn < line.length && /[A-Z_0-9]/i.test(line[++endColumn])) {}
            return new Range([bufferPt.row, startColumn + 1], [bufferPt.row, endColumn]);
        }
    }, {
        key: "underlineIfNavigable",
        value: function underlineIfNavigable(editor, bufferPt, wordRange) {
            var _this3 = this;

            if (this.marker && this.marker.bufferMarker.range && this.marker.bufferMarker.range.compare(wordRange) === 0) return;
            var decoration = void 0;
            var addMark = function addMark() {
                _this3.removeMarker();
                _this3.marker = editor.markBufferRange(wordRange);
                decoration = editor.decorateMarker(_this3.marker, { type: "highlight", class: "gotodefinition-underline" });
            };
            if (this.enhancedHighlighting) {
                var scopes = editor.scopeDescriptorForBufferPosition(bufferPt).scopes;
                if (identifierRegex.test(_lodash2.default.last(scopes))) {
                    addMark();
                }
            } else {
                _omni.Omni.request(editor, function (solution) {
                    return solution.gotodefinition({
                        Line: bufferPt.row,
                        Column: bufferPt.column
                    });
                }).filter(function (data) {
                    return !!data.FileName || !!data.MetadataSource;
                }).subscribe(function (data) {
                    return addMark();
                });
            }
        }
    }, {
        key: "pixelPositionFromMouseEvent",
        value: function pixelPositionFromMouseEvent(editor, editorView, event) {
            var clientX = event.clientX,
                clientY = event.clientY;
            var shadow = this.getFromShadowDom(editorView, ".lines")[0];
            if (!shadow) return;
            var linesClientRect = shadow.getBoundingClientRect();
            var top = clientY - linesClientRect.top;
            var left = clientX - linesClientRect.left;
            top += editor.getScrollTop();
            left += editor.getScrollLeft();
            return { top: top, left: left };
        }
    }, {
        key: "getFromShadowDom",
        value: function getFromShadowDom(element, selector) {
            try {
                var el = element[0];
                var found = el.rootElement.querySelectorAll(selector);
                return $(found[0]);
            } catch (e) {
                return $(document.createElement("div"));
            }
        }
    }, {
        key: "removeMarker",
        value: function removeMarker() {
            if (this.marker != null) {
                this.marker.destroy();
                this.marker = null;
            }
        }
    }]);

    return GoToDefinition;
}();

var goToDefintion = exports.goToDefintion = new GoToDefinition();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9nby10by1kZWZpbml0aW9uLmpzIiwibGliL2ZlYXR1cmVzL2dvLXRvLWRlZmluaXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7O0FDRUEsSUFBTSxJQUFrQixRQUFRLFFBQVIsQ0FBeEI7QUFFQSxJQUFNLFFBQWlDLFFBQVEsTUFBUixFQUFnQixLQUF2RDtBQUVBLElBQU0sa0JBQWtCLHdDQUF4Qjs7SUFFQSxjO0FBQUEsOEJBQUE7QUFBQTs7QUEyTVcsYUFBQSxRQUFBLEdBQVcsSUFBWDtBQUNBLGFBQUEsS0FBQSxHQUFRLGtCQUFSO0FBQ0EsYUFBQSxXQUFBLEdBQWMsOEdBQWQ7QUFDVjs7OzttQ0F4TWtCO0FBQUE7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEI7QUFDQSxnQkFBSSxvQkFBb0IsS0FBeEI7QUFDQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssTUFBTCxDQUFZLE9BQVosQ0FBb0Isa0NBQXBCLEVBQXdEO0FBQUEsdUJBQVMsb0JBQW9CLEtBQTdCO0FBQUEsYUFBeEQsQ0FBcEI7QUFFQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssa0JBQUwsQ0FBd0IsVUFBQyxNQUFELEVBQVMsRUFBVCxFQUFXO0FBQ25ELG9CQUFNLE9BQU8sRUFBRSxLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLE1BQW5CLENBQUYsQ0FBYjtBQUNBLG9CQUFNLFNBQVMsTUFBSyxnQkFBTCxDQUFzQixJQUF0QixFQUE0QixjQUE1QixDQUFmO0FBQ0Esb0JBQUksQ0FBQyxPQUFPLENBQVAsQ0FBTCxFQUFnQjtBQUNaO0FBQ0g7QUFFRCxvQkFBTSxRQUFRLGlCQUFXLFNBQVgsQ0FBaUMsT0FBTyxDQUFQLENBQWpDLEVBQTRDLE9BQTVDLENBQWQ7QUFFQSxvQkFBTSxZQUFZLGlCQUFXLFNBQVgsQ0FBaUMsT0FBTyxDQUFQLENBQWpD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QWdCO0FBQ3RELGdCQUFJO0FBQ0Esb0JBQU0sS0FBSyxRQUFRLENBQVIsQ0FBWDtBQUNBLG9CQUFNLFFBQWMsR0FBSSxXQUFKLENBQWdCLGdCQUFoQixDQUFpQyxRQUFqQyxDQUFwQjtBQUNBLHVCQUFPLEVBQUUsTUFBTSxDQUFOLENBQUYsQ0FBUDtBQUNGLGFBSkYsQ0FJRSxPQUFPLENBQVAsRUFBVTtBQUNSLHVCQUFPLEVBQUUsU0FBUyxhQUFULENBQXVCLEtBQXZCLENBQUYsQ0FBUDtBQUNIO0FBQ0o7Ozt1Q0FFbUI7QUFDaEIsZ0JBQUksS0FBSyxNQUFMLElBQWUsSUFBbkIsRUFBeUI7QUFDckIscUJBQUssTUFBTCxDQUFZLE9BQVo7QUFDQSxxQkFBSyxNQUFMLEdBQWMsSUFBZDtBQUNIO0FBQ0o7Ozs7OztBQU9FLElBQU0sd0NBQWdCLElBQUksY0FBSixFQUF0QiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvZ28tdG8tZGVmaW5pdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5jb25zdCAkID0gcmVxdWlyZShcImpxdWVyeVwiKTtcbmNvbnN0IFJhbmdlID0gcmVxdWlyZShcImF0b21cIikuUmFuZ2U7XG5jb25zdCBpZGVudGlmaWVyUmVnZXggPSAvXmlkZW50aWZpZXJ8aWRlbnRpZmllciR8XFwuaWRlbnRpZmllclxcLi87XG5jbGFzcyBHb1RvRGVmaW5pdGlvbiB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJHbyBUbyBEZWZpbml0aW9uXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgc3VwcG9ydCB0byBnb3RvIGRlZmluaXRpb24sIGFzIHdlbGwgYXMgZGlzcGxheSBtZXRhZGF0YSByZXR1cm5lZCBieSBhIGdvdG8gZGVmaW5pdGlvbiBtZXRhZGF0YSByZXNwb25zZVwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgbGV0IGFsdEdvdG9EZWZpbml0aW9uID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tOmFsdEdvdG9EZWZpbml0aW9uXCIsIHZhbHVlID0+IGFsdEdvdG9EZWZpbml0aW9uID0gdmFsdWUpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmlldyA9ICQoYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcikpO1xuICAgICAgICAgICAgY29uc3Qgc2Nyb2xsID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKHZpZXcsIFwiLnNjcm9sbC12aWV3XCIpO1xuICAgICAgICAgICAgaWYgKCFzY3JvbGxbMF0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBjbGljayA9IE9ic2VydmFibGUuZnJvbUV2ZW50KHNjcm9sbFswXSwgXCJjbGlja1wiKTtcbiAgICAgICAgICAgIGNvbnN0IG1vdXNlbW92ZSA9IE9ic2VydmFibGUuZnJvbUV2ZW50KHNjcm9sbFswXSwgXCJtb3VzZW1vdmVcIik7XG4gICAgICAgICAgICBjb25zdCBrZXl1cCA9IE9ic2VydmFibGUubWVyZ2UoT2JzZXJ2YWJsZS5mcm9tRXZlbnQodmlld1swXSwgXCJmb2N1c1wiKSwgT2JzZXJ2YWJsZS5mcm9tRXZlbnQodmlld1swXSwgXCJibHVyXCIpLCBPYnNlcnZhYmxlLmZyb21FdmVudFBhdHRlcm4oeCA9PiB7IGF0b20uZ2V0Q3VycmVudFdpbmRvdygpLm9uKFwiZm9jdXNcIiwgeCk7IH0sIHggPT4geyBhdG9tLmdldEN1cnJlbnRXaW5kb3coKS5yZW1vdmVMaXN0ZW5lcihcImZvY3VzXCIsIHgpOyB9KSwgT2JzZXJ2YWJsZS5mcm9tRXZlbnRQYXR0ZXJuKHggPT4geyBhdG9tLmdldEN1cnJlbnRXaW5kb3coKS5vbihcImJsdXJcIiwgeCk7IH0sIHggPT4geyBhdG9tLmdldEN1cnJlbnRXaW5kb3coKS5yZW1vdmVMaXN0ZW5lcihcImJsdXJcIiwgeCk7IH0pLCBPYnNlcnZhYmxlLmZyb21FdmVudCh2aWV3WzBdLCBcImtleXVwXCIpXG4gICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+IGFsdEdvdG9EZWZpbml0aW9uID8geC53aGljaCA9PT0gMTggOiAoeC53aGljaCA9PT0gMTcgfHwgeC53aGljaCA9PT0gMjI0IHx8IHgud2hpY2ggPT09IDkzIHx8IHgud2hpY2ggPT09IDkyIHx8IHgud2hpY2ggPT09IDkxKSkpXG4gICAgICAgICAgICAgICAgLnRocm90dGxlVGltZSgxMDApO1xuICAgICAgICAgICAgY29uc3Qga2V5ZG93biA9IE9ic2VydmFibGUuZnJvbUV2ZW50KHZpZXdbMF0sIFwia2V5ZG93blwiKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhei5yZXBlYXQpXG4gICAgICAgICAgICAgICAgLmZpbHRlcihlID0+IGFsdEdvdG9EZWZpbml0aW9uID8gZS5hbHRLZXkgOiAoZS5jdHJsS2V5IHx8IGUubWV0YUtleSkpXG4gICAgICAgICAgICAgICAgLnRocm90dGxlVGltZSgxMDApO1xuICAgICAgICAgICAgY29uc3Qgc3BlY2lhbEtleURvd24gPSBrZXlkb3duXG4gICAgICAgICAgICAgICAgLnN3aXRjaE1hcCh4ID0+IG1vdXNlbW92ZVxuICAgICAgICAgICAgICAgIC50YWtlVW50aWwoa2V5dXApXG4gICAgICAgICAgICAgICAgLm1hcChldmVudCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxQdCA9IHRoaXMucGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvciwgdmlldywgZXZlbnQpO1xuICAgICAgICAgICAgICAgIGlmICghcGl4ZWxQdClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNjcmVlblB0ID0gZWRpdG9yLnNjcmVlblBvc2l0aW9uRm9yUGl4ZWxQb3NpdGlvbihwaXhlbFB0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWRpdG9yLmJ1ZmZlclBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oc2NyZWVuUHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGEgPT4gISFhKVxuICAgICAgICAgICAgICAgIC5zdGFydFdpdGgoZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCkpXG4gICAgICAgICAgICAgICAgLm1hcChidWZmZXJQdCA9PiAoeyBidWZmZXJQdCwgcmFuZ2U6IHRoaXMuZ2V0V29yZFJhbmdlKGVkaXRvciwgYnVmZmVyUHQpIH0pKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXoucmFuZ2UpXG4gICAgICAgICAgICAgICAgLmRpc3RpbmN0VW50aWxDaGFuZ2VkKChjdXJyZW50LCBuZXh0KSA9PiBjdXJyZW50LnJhbmdlLmlzRXF1YWwobmV4dC5yYW5nZSkpKTtcbiAgICAgICAgICAgIGVkaXRvci5vbkRpZERlc3Ryb3koKCkgPT4gY2QuZGlzcG9zZSgpKTtcbiAgICAgICAgICAgIGxldCBldmVudERpc3Bvc2FibGU7XG4gICAgICAgICAgICBjZC5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLmVuaGFuY2VkSGlnaGxpZ2h0aW5nXCIsIChlbmFibGVkKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbmhhbmNlZEhpZ2hsaWdodGluZyA9IGVuYWJsZWQ7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50RGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudERpc3Bvc2FibGUudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICAgICAgY2QucmVtb3ZlKGV2ZW50RGlzcG9zYWJsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxldCBvYnNlcnZhYmxlID0gc3BlY2lhbEtleURvd247XG4gICAgICAgICAgICAgICAgaWYgKCFlbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ic2VydmFibGUgPSBvYnNlcnZhYmxlLmRlYm91bmNlVGltZSgyMDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBldmVudERpc3Bvc2FibGUgPSBvYnNlcnZhYmxlXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKHsgYnVmZmVyUHQsIHJhbmdlIH0pID0+IHRoaXMudW5kZXJsaW5lSWZOYXZpZ2FibGUoZWRpdG9yLCBidWZmZXJQdCwgcmFuZ2UpKTtcbiAgICAgICAgICAgICAgICBjZC5hZGQoZXZlbnREaXNwb3NhYmxlKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNkLmFkZChrZXl1cC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5yZW1vdmVNYXJrZXIoKSkpO1xuICAgICAgICAgICAgY2QuYWRkKGNsaWNrLnN1YnNjcmliZSgoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghZS5jdHJsS2V5ICYmICFlLm1ldGFLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoYWx0R290b0RlZmluaXRpb24gJiYgIWUuYWx0S2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVNYXJrZXIoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmdvVG9EZWZpbml0aW9uKCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGNkKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uZW1pdHRlci5vbihcInN5bWJvbHMtdmlldzpnby10by1kZWNsYXJhdGlvblwiLCAoKSA9PiB0aGlzLmdvVG9EZWZpbml0aW9uKCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206Z28tdG8tZGVmaW5pdGlvblwiLCAoKSA9PiB0aGlzLmdvVG9EZWZpbml0aW9uKCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20ud2FudE1ldGFkYXRhXCIsIGVuYWJsZWQgPT4ge1xuICAgICAgICAgICAgdGhpcy53YW50TWV0YWRhdGEgPSBlbmFibGVkO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGdvVG9EZWZpbml0aW9uKCkge1xuICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgICAgIGlmIChlZGl0b3IpIHtcbiAgICAgICAgICAgIGNvbnN0IHdvcmQgPSBlZGl0b3IuZ2V0V29yZFVuZGVyQ3Vyc29yKCk7XG4gICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5nb3RvZGVmaW5pdGlvbih7XG4gICAgICAgICAgICAgICAgV2FudE1ldGFkYXRhOiB0aGlzLndhbnRNZXRhZGF0YVxuICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoZGF0YSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChkYXRhLkZpbGVOYW1lICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChkYXRhLk1ldGFkYXRhU291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgQXNzZW1ibHlOYW1lLCBUeXBlTmFtZSB9ID0gZGF0YS5NZXRhZGF0YVNvdXJjZTtcbiAgICAgICAgICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3Blbihgb21uaXNoYXJwOi8vbWV0YWRhdGEvJHtBc3NlbWJseU5hbWV9LyR7VHlwZU5hbWV9YCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbExpbmU6IGRhdGEuTGluZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxDb2x1bW46IGRhdGEuQ29sdW1uLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2VhcmNoQWxsUGFuZXM6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhgQ2FuJ3QgbmF2aWdhdGUgdG8gJHt3b3JkfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldFdvcmRSYW5nZShlZGl0b3IsIGJ1ZmZlclB0KSB7XG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgICAgICAgbGV0IHN0YXJ0Q29sdW1uID0gYnVmZmVyUHQuY29sdW1uO1xuICAgICAgICBsZXQgZW5kQ29sdW1uID0gYnVmZmVyUHQuY29sdW1uO1xuICAgICAgICBjb25zdCBsaW5lID0gYnVmZmVyLmdldExpbmVzKClbYnVmZmVyUHQucm93XTtcbiAgICAgICAgaWYgKCEvW0EtWl8wLTldL2kudGVzdChsaW5lW2J1ZmZlclB0LmNvbHVtbl0pKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5tYXJrZXIpXG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVNYXJrZXIoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAoc3RhcnRDb2x1bW4gPiAwICYmIC9bQS1aXzAtOV0vaS50ZXN0KGxpbmVbLS1zdGFydENvbHVtbl0pKSB7IH1cbiAgICAgICAgd2hpbGUgKGVuZENvbHVtbiA8IGxpbmUubGVuZ3RoICYmIC9bQS1aXzAtOV0vaS50ZXN0KGxpbmVbKytlbmRDb2x1bW5dKSkgeyB9XG4gICAgICAgIHJldHVybiBuZXcgUmFuZ2UoW2J1ZmZlclB0LnJvdywgc3RhcnRDb2x1bW4gKyAxXSwgW2J1ZmZlclB0LnJvdywgZW5kQ29sdW1uXSk7XG4gICAgfVxuICAgIHVuZGVybGluZUlmTmF2aWdhYmxlKGVkaXRvciwgYnVmZmVyUHQsIHdvcmRSYW5nZSkge1xuICAgICAgICBpZiAodGhpcy5tYXJrZXIgJiZcbiAgICAgICAgICAgIHRoaXMubWFya2VyLmJ1ZmZlck1hcmtlci5yYW5nZSAmJlxuICAgICAgICAgICAgdGhpcy5tYXJrZXIuYnVmZmVyTWFya2VyLnJhbmdlLmNvbXBhcmUod29yZFJhbmdlKSA9PT0gMClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgbGV0IGRlY29yYXRpb247XG4gICAgICAgIGNvbnN0IGFkZE1hcmsgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZU1hcmtlcigpO1xuICAgICAgICAgICAgdGhpcy5tYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHdvcmRSYW5nZSk7XG4gICAgICAgICAgICBkZWNvcmF0aW9uID0gZWRpdG9yLmRlY29yYXRlTWFya2VyKHRoaXMubWFya2VyLCB7IHR5cGU6IFwiaGlnaGxpZ2h0XCIsIGNsYXNzOiBcImdvdG9kZWZpbml0aW9uLXVuZGVybGluZVwiIH0pO1xuICAgICAgICB9O1xuICAgICAgICBpZiAodGhpcy5lbmhhbmNlZEhpZ2hsaWdodGluZykge1xuICAgICAgICAgICAgY29uc3Qgc2NvcGVzID0gZWRpdG9yLnNjb3BlRGVzY3JpcHRvckZvckJ1ZmZlclBvc2l0aW9uKGJ1ZmZlclB0KS5zY29wZXM7XG4gICAgICAgICAgICBpZiAoaWRlbnRpZmllclJlZ2V4LnRlc3QoXy5sYXN0KHNjb3BlcykpKSB7XG4gICAgICAgICAgICAgICAgYWRkTWFyaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uZ290b2RlZmluaXRpb24oe1xuICAgICAgICAgICAgICAgIExpbmU6IGJ1ZmZlclB0LnJvdyxcbiAgICAgICAgICAgICAgICBDb2x1bW46IGJ1ZmZlclB0LmNvbHVtblxuICAgICAgICAgICAgfSkpLmZpbHRlcihkYXRhID0+ICEhZGF0YS5GaWxlTmFtZSB8fCAhIWRhdGEuTWV0YWRhdGFTb3VyY2UpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShkYXRhID0+IGFkZE1hcmsoKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvciwgZWRpdG9yVmlldywgZXZlbnQpIHtcbiAgICAgICAgY29uc3QgY2xpZW50WCA9IGV2ZW50LmNsaWVudFgsIGNsaWVudFkgPSBldmVudC5jbGllbnRZO1xuICAgICAgICBjb25zdCBzaGFkb3cgPSB0aGlzLmdldEZyb21TaGFkb3dEb20oZWRpdG9yVmlldywgXCIubGluZXNcIilbMF07XG4gICAgICAgIGlmICghc2hhZG93KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBsaW5lc0NsaWVudFJlY3QgPSBzaGFkb3cuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIGxldCB0b3AgPSBjbGllbnRZIC0gbGluZXNDbGllbnRSZWN0LnRvcDtcbiAgICAgICAgbGV0IGxlZnQgPSBjbGllbnRYIC0gbGluZXNDbGllbnRSZWN0LmxlZnQ7XG4gICAgICAgIHRvcCArPSBlZGl0b3IuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgIGxlZnQgKz0gZWRpdG9yLmdldFNjcm9sbExlZnQoKTtcbiAgICAgICAgcmV0dXJuIHsgdG9wOiB0b3AsIGxlZnQ6IGxlZnQgfTtcbiAgICB9XG4gICAgZ2V0RnJvbVNoYWRvd0RvbShlbGVtZW50LCBzZWxlY3Rvcikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZWwgPSBlbGVtZW50WzBdO1xuICAgICAgICAgICAgY29uc3QgZm91bmQgPSBlbC5yb290RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIHJldHVybiAkKGZvdW5kWzBdKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuICQoZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmVtb3ZlTWFya2VyKCkge1xuICAgICAgICBpZiAodGhpcy5tYXJrZXIgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5tYXJrZXIuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5tYXJrZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGdvVG9EZWZpbnRpb24gPSBuZXcgR29Ub0RlZmluaXRpb247XG4iLCJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3Vic2NyaXB0aW9ufSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmNvbnN0ICQ6IEpRdWVyeVN0YXRpYyA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG4vKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXG5jb25zdCBSYW5nZTogdHlwZW9mIFRleHRCdWZmZXIuUmFuZ2UgPSByZXF1aXJlKFwiYXRvbVwiKS5SYW5nZTtcbi8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xuY29uc3QgaWRlbnRpZmllclJlZ2V4ID0gL15pZGVudGlmaWVyfGlkZW50aWZpZXIkfFxcLmlkZW50aWZpZXJcXC4vO1xuXG5jbGFzcyBHb1RvRGVmaW5pdGlvbiBpbXBsZW1lbnRzIElGZWF0dXJlIHtcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG4gICAgcHJpdmF0ZSBlbmhhbmNlZEhpZ2hsaWdodGluZzogYm9vbGVhbjtcbiAgICBwcml2YXRlIG1hcmtlcjogQXRvbS5NYXJrZXI7XG4gICAgcHJpdmF0ZSB3YW50TWV0YWRhdGE6IGJvb2xlYW47XG5cbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGxldCBhbHRHb3RvRGVmaW5pdGlvbiA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbTphbHRHb3RvRGVmaW5pdGlvblwiLCB2YWx1ZSA9PiBhbHRHb3RvRGVmaW5pdGlvbiA9IHZhbHVlKSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdmlldyA9ICQoYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcikpO1xuICAgICAgICAgICAgY29uc3Qgc2Nyb2xsID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKHZpZXcsIFwiLnNjcm9sbC12aWV3XCIpO1xuICAgICAgICAgICAgaWYgKCFzY3JvbGxbMF0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGNsaWNrID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8TW91c2VFdmVudD4oc2Nyb2xsWzBdLCBcImNsaWNrXCIpO1xuXG4gICAgICAgICAgICBjb25zdCBtb3VzZW1vdmUgPSBPYnNlcnZhYmxlLmZyb21FdmVudDxNb3VzZUV2ZW50PihzY3JvbGxbMF0sIFwibW91c2Vtb3ZlXCIpO1xuXG4gICAgICAgICAgICBjb25zdCBrZXl1cCA9IE9ic2VydmFibGUubWVyZ2UoXG4gICAgICAgICAgICAgICAgT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8YW55Pih2aWV3WzBdLCBcImZvY3VzXCIpLFxuICAgICAgICAgICAgICAgIE9ic2VydmFibGUuZnJvbUV2ZW50PGFueT4odmlld1swXSwgXCJibHVyXCIpLFxuICAgICAgICAgICAgICAgIDxhbnk+T2JzZXJ2YWJsZS5mcm9tRXZlbnRQYXR0ZXJuPGFueT4oeCA9PiB7ICg8YW55PmF0b20uZ2V0Q3VycmVudFdpbmRvdygpKS5vbihcImZvY3VzXCIsIHgpOyB9LCB4ID0+IHsgKDxhbnk+YXRvbS5nZXRDdXJyZW50V2luZG93KCkpLnJlbW92ZUxpc3RlbmVyKFwiZm9jdXNcIiwgeCk7IH0pLFxuICAgICAgICAgICAgICAgIDxhbnk+T2JzZXJ2YWJsZS5mcm9tRXZlbnRQYXR0ZXJuPGFueT4oeCA9PiB7ICg8YW55PmF0b20uZ2V0Q3VycmVudFdpbmRvdygpKS5vbihcImJsdXJcIiwgeCk7IH0sIHggPT4geyAoPGFueT5hdG9tLmdldEN1cnJlbnRXaW5kb3coKSkucmVtb3ZlTGlzdGVuZXIoXCJibHVyXCIsIHgpOyB9KSxcbiAgICAgICAgICAgICAgICBPYnNlcnZhYmxlLmZyb21FdmVudDxLZXlib2FyZEV2ZW50Pih2aWV3WzBdLCBcImtleXVwXCIpXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoeCA9PiBhbHRHb3RvRGVmaW5pdGlvbiA/IHgud2hpY2ggPT09IDE4IC8qYWx0Ki8gOiAoeC53aGljaCA9PT0gMTcgLypjdHJsKi8gfHwgLyptZXRhIC0tPiAqLyB4LndoaWNoID09PSAyMjQgfHwgeC53aGljaCA9PT0gOTMgfHwgeC53aGljaCA9PT0gOTIgfHwgeC53aGljaCA9PT0gOTEpKVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC50aHJvdHRsZVRpbWUoMTAwKTtcblxuICAgICAgICAgICAgY29uc3Qga2V5ZG93biA9IE9ic2VydmFibGUuZnJvbUV2ZW50PEtleWJvYXJkRXZlbnQ+KHZpZXdbMF0sIFwia2V5ZG93blwiKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhei5yZXBlYXQpXG4gICAgICAgICAgICAgICAgLmZpbHRlcihlID0+IGFsdEdvdG9EZWZpbml0aW9uID8gZS5hbHRLZXkgOiAoZS5jdHJsS2V5IHx8IGUubWV0YUtleSkpXG4gICAgICAgICAgICAgICAgLnRocm90dGxlVGltZSgxMDApO1xuXG4gICAgICAgICAgICBjb25zdCBzcGVjaWFsS2V5RG93biA9IGtleWRvd25cbiAgICAgICAgICAgICAgICAuc3dpdGNoTWFwKHggPT4gbW91c2Vtb3ZlXG4gICAgICAgICAgICAgICAgICAgIC50YWtlVW50aWwoa2V5dXApXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoZXZlbnQgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxQdCA9IHRoaXMucGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvciwgdmlldywgZXZlbnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFwaXhlbFB0KSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzY3JlZW5QdCA9IGVkaXRvci5zY3JlZW5Qb3NpdGlvbkZvclBpeGVsUG9zaXRpb24ocGl4ZWxQdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZWRpdG9yLmJ1ZmZlclBvc2l0aW9uRm9yU2NyZWVuUG9zaXRpb24oc2NyZWVuUHQpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKGEgPT4gISFhKVxuICAgICAgICAgICAgICAgICAgICAuc3RhcnRXaXRoKGVkaXRvci5nZXRDdXJzb3JCdWZmZXJQb3NpdGlvbigpKVxuICAgICAgICAgICAgICAgICAgICAubWFwKGJ1ZmZlclB0ID0+ICh7IGJ1ZmZlclB0LCByYW5nZTogdGhpcy5nZXRXb3JkUmFuZ2UoZWRpdG9yLCBidWZmZXJQdCkgfSkpXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXoucmFuZ2UpXG4gICAgICAgICAgICAgICAgICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCgoY3VycmVudCwgbmV4dCkgPT4gY3VycmVudC5yYW5nZS5pc0VxdWFsKDxhbnk+bmV4dC5yYW5nZSkpKTtcblxuICAgICAgICAgICAgZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiBjZC5kaXNwb3NlKCkpO1xuXG4gICAgICAgICAgICBsZXQgZXZlbnREaXNwb3NhYmxlOiBTdWJzY3JpcHRpb247XG4gICAgICAgICAgICBjZC5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLmVuaGFuY2VkSGlnaGxpZ2h0aW5nXCIsIChlbmFibGVkOiBib29sZWFuKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5lbmhhbmNlZEhpZ2hsaWdodGluZyA9IGVuYWJsZWQ7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50RGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICBldmVudERpc3Bvc2FibGUudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICAgICAgY2QucmVtb3ZlKGV2ZW50RGlzcG9zYWJsZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IG9ic2VydmFibGUgPSBzcGVjaWFsS2V5RG93bjtcbiAgICAgICAgICAgICAgICBpZiAoIWVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgb2JzZXJ2YWJsZSA9IG9ic2VydmFibGUuZGVib3VuY2VUaW1lKDIwMCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZXZlbnREaXNwb3NhYmxlID0gb2JzZXJ2YWJsZVxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCh7YnVmZmVyUHQsIHJhbmdlfSkgPT4gdGhpcy51bmRlcmxpbmVJZk5hdmlnYWJsZShlZGl0b3IsIGJ1ZmZlclB0LCByYW5nZSkpO1xuXG4gICAgICAgICAgICAgICAgY2QuYWRkKGV2ZW50RGlzcG9zYWJsZSk7XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIGNkLmFkZChrZXl1cC5zdWJzY3JpYmUoKCkgPT4gdGhpcy5yZW1vdmVNYXJrZXIoKSkpO1xuXG4gICAgICAgICAgICBjZC5hZGQoY2xpY2suc3Vic2NyaWJlKChlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFlLmN0cmxLZXkgJiYgIWUubWV0YUtleSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChhbHRHb3RvRGVmaW5pdGlvbiAmJiAhZS5hbHRLZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlTWFya2VyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5nb1RvRGVmaW5pdGlvbigpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChjZCk7XG4gICAgICAgIH0pKTtcblxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uZW1pdHRlci5vbihcInN5bWJvbHMtdmlldzpnby10by1kZWNsYXJhdGlvblwiLCAoKSA9PiB0aGlzLmdvVG9EZWZpbml0aW9uKCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206Z28tdG8tZGVmaW5pdGlvblwiLCAoKSA9PiB0aGlzLmdvVG9EZWZpbml0aW9uKCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20ud2FudE1ldGFkYXRhXCIsIGVuYWJsZWQgPT4ge1xuICAgICAgICAgICAgdGhpcy53YW50TWV0YWRhdGEgPSBlbmFibGVkO1xuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGdvVG9EZWZpbml0aW9uKCkge1xuICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgICAgIGlmIChlZGl0b3IpIHtcbiAgICAgICAgICAgIGNvbnN0IHdvcmQgPSA8YW55PmVkaXRvci5nZXRXb3JkVW5kZXJDdXJzb3IoKTtcbiAgICAgICAgICAgIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmdvdG9kZWZpbml0aW9uKHtcbiAgICAgICAgICAgICAgICBXYW50TWV0YWRhdGE6IHRoaXMud2FudE1ldGFkYXRhXG4gICAgICAgICAgICB9KSlcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKChkYXRhOiBNb2RlbHMuR290b0RlZmluaXRpb25SZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5GaWxlTmFtZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8oZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZGF0YS5NZXRhZGF0YVNvdXJjZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qge0Fzc2VtYmx5TmFtZSwgVHlwZU5hbWV9ID0gZGF0YS5NZXRhZGF0YVNvdXJjZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3Blbihgb21uaXNoYXJwOi8vbWV0YWRhdGEvJHtBc3NlbWJseU5hbWV9LyR7VHlwZU5hbWV9YCwgPGFueT57XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbExpbmU6IGRhdGEuTGluZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbml0aWFsQ29sdW1uOiBkYXRhLkNvbHVtbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWFyY2hBbGxQYW5lczogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkV2FybmluZyhgQ2FuJ3QgbmF2aWdhdGUgdG8gJHt3b3JkfWApO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFdvcmRSYW5nZShlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgYnVmZmVyUHQ6IFRleHRCdWZmZXIuUG9pbnQpOiBUZXh0QnVmZmVyLlJhbmdlIHtcbiAgICAgICAgY29uc3QgYnVmZmVyID0gZWRpdG9yLmdldEJ1ZmZlcigpO1xuICAgICAgICBsZXQgc3RhcnRDb2x1bW4gPSBidWZmZXJQdC5jb2x1bW47XG4gICAgICAgIGxldCBlbmRDb2x1bW4gPSBidWZmZXJQdC5jb2x1bW47XG4gICAgICAgIGNvbnN0IGxpbmUgPSBidWZmZXIuZ2V0TGluZXMoKVtidWZmZXJQdC5yb3ddO1xuXG4gICAgICAgIGlmICghL1tBLVpfMC05XS9pLnRlc3QobGluZVtidWZmZXJQdC5jb2x1bW5dKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMubWFya2VyKSB0aGlzLnJlbW92ZU1hcmtlcigpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgd2hpbGUgKHN0YXJ0Q29sdW1uID4gMCAmJiAvW0EtWl8wLTldL2kudGVzdChsaW5lWy0tc3RhcnRDb2x1bW5dKSkgeyAvKiAqLyB9XG5cbiAgICAgICAgd2hpbGUgKGVuZENvbHVtbiA8IGxpbmUubGVuZ3RoICYmIC9bQS1aXzAtOV0vaS50ZXN0KGxpbmVbKytlbmRDb2x1bW5dKSkgeyAvKiAqLyB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBSYW5nZShbYnVmZmVyUHQucm93LCBzdGFydENvbHVtbiArIDFdLCBbYnVmZmVyUHQucm93LCBlbmRDb2x1bW5dKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHVuZGVybGluZUlmTmF2aWdhYmxlKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBidWZmZXJQdDogVGV4dEJ1ZmZlci5Qb2ludCwgd29yZFJhbmdlOiBUZXh0QnVmZmVyLlJhbmdlKSB7XG4gICAgICAgIGlmICh0aGlzLm1hcmtlciAmJlxuICAgICAgICAgICAgKHRoaXMubWFya2VyLmJ1ZmZlck1hcmtlciBhcyBhbnkpLnJhbmdlICYmXG4gICAgICAgICAgICAodGhpcy5tYXJrZXIuYnVmZmVyTWFya2VyIGFzIGFueSkucmFuZ2UuY29tcGFyZSh3b3JkUmFuZ2UpID09PSAwKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIGxldCBkZWNvcmF0aW9uOiBBdG9tLk1hcmtlcjtcbiAgICAgICAgY29uc3QgYWRkTWFyayA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlTWFya2VyKCk7XG4gICAgICAgICAgICB0aGlzLm1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2Uod29yZFJhbmdlKTtcbiAgICAgICAgICAgIGRlY29yYXRpb24gPSBlZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5tYXJrZXIsIHsgdHlwZTogXCJoaWdobGlnaHRcIiwgY2xhc3M6IFwiZ290b2RlZmluaXRpb24tdW5kZXJsaW5lXCIgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHRoaXMuZW5oYW5jZWRIaWdobGlnaHRpbmcpIHtcbiAgICAgICAgICAgIGNvbnN0IHNjb3Blczogc3RyaW5nW10gPSAoPGFueT5lZGl0b3Iuc2NvcGVEZXNjcmlwdG9yRm9yQnVmZmVyUG9zaXRpb24oYnVmZmVyUHQpKS5zY29wZXM7XG4gICAgICAgICAgICBpZiAoaWRlbnRpZmllclJlZ2V4LnRlc3QoXy5sYXN0KHNjb3BlcykpKSB7XG4gICAgICAgICAgICAgICAgYWRkTWFyaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gSWYgZW5oYW5jZWQgaGlnaGxpZ2h0aW5nIGlzIG9mZiwgZmFsbGJhY2sgdG8gdGhlIG9sZCBtZXRob2QuXG4gICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5nb3RvZGVmaW5pdGlvbih7XG4gICAgICAgICAgICAgICAgTGluZTogYnVmZmVyUHQucm93LFxuICAgICAgICAgICAgICAgIENvbHVtbjogYnVmZmVyUHQuY29sdW1uXG4gICAgICAgICAgICB9KSkuZmlsdGVyKGRhdGEgPT4gISFkYXRhLkZpbGVOYW1lIHx8ICEhZGF0YS5NZXRhZGF0YVNvdXJjZSlcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKGRhdGEgPT4gYWRkTWFyaygpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgcGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBlZGl0b3JWaWV3OiBhbnksIGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgICAgIGNvbnN0IGNsaWVudFggPSBldmVudC5jbGllbnRYLCBjbGllbnRZID0gZXZlbnQuY2xpZW50WTtcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKGVkaXRvclZpZXcsIFwiLmxpbmVzXCIpWzBdO1xuICAgICAgICBpZiAoIXNoYWRvdylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgbGluZXNDbGllbnRSZWN0ID0gc2hhZG93LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gICAgICAgIGxldCB0b3AgPSBjbGllbnRZIC0gbGluZXNDbGllbnRSZWN0LnRvcDtcbiAgICAgICAgbGV0IGxlZnQgPSBjbGllbnRYIC0gbGluZXNDbGllbnRSZWN0LmxlZnQ7XG4gICAgICAgIHRvcCArPSAoPGFueT5lZGl0b3IpLmdldFNjcm9sbFRvcCgpO1xuICAgICAgICBsZWZ0ICs9ICg8YW55PmVkaXRvcikuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0RnJvbVNoYWRvd0RvbShlbGVtZW50OiBKUXVlcnksIHNlbGVjdG9yOiBzdHJpbmcpOiBKUXVlcnkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZWwgPSBlbGVtZW50WzBdO1xuICAgICAgICAgICAgY29uc3QgZm91bmQgPSAoPGFueT5lbCkucm9vdEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgICAgICAgICByZXR1cm4gJChmb3VuZFswXSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiAkKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIikpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZW1vdmVNYXJrZXIoKSB7XG4gICAgICAgIGlmICh0aGlzLm1hcmtlciAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLm1hcmtlci5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLm1hcmtlciA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xuICAgIHB1YmxpYyB0aXRsZSA9IFwiR28gVG8gRGVmaW5pdGlvblwiO1xuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiQWRkcyBzdXBwb3J0IHRvIGdvdG8gZGVmaW5pdGlvbiwgYXMgd2VsbCBhcyBkaXNwbGF5IG1ldGFkYXRhIHJldHVybmVkIGJ5IGEgZ290byBkZWZpbml0aW9uIG1ldGFkYXRhIHJlc3BvbnNlXCI7XG59XG5cbmV4cG9ydCBjb25zdCBnb1RvRGVmaW50aW9uID0gbmV3IEdvVG9EZWZpbml0aW9uO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

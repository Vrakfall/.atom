"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.codeLens = exports.Lens = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fastdom = require("fastdom");

var CodeLens = function () {
    function CodeLens() {
        _classCallCheck(this, CodeLens);

        this.decorations = new WeakMap();
        this.required = false;
        this.title = "Code Lens";
        this.description = "Adds support for displaying references in the editor.";
    }

    _createClass(CodeLens, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add(_omni.Omni.eachEditor(function (editor, cd) {
                cd.add(_omnisharpClient.Disposable.create(function () {
                    var markers = _this.decorations.get(editor);
                    if (markers) {
                        markers.forEach(function (marker) {
                            return marker.dispose();
                        });
                    }
                    _this.decorations.delete(editor);
                }));
                cd.add(atom.config.observe("editor.fontSize", function (size) {
                    var decorations = _this.decorations.get(editor);
                    var lineHeight = editor.getLineHeightInPixels();
                    if (decorations && lineHeight) {
                        decorations.forEach(function (decoration) {
                            return decoration.updateTop(lineHeight);
                        });
                    }
                }));
            }));
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                var items = _this.decorations.get(editor);
                if (!items) _this.decorations.set(editor, new Set());
                var subject = new _rxjs.Subject();
                cd.add(subject.filter(function (x) {
                    return !!x && !editor.isDestroyed();
                }).distinctUntilChanged(function (x) {
                    return !!x;
                }).debounceTime(500).switchMap(function () {
                    return _this.updateCodeLens(editor);
                }).subscribe());
                var bindDidChange = function bindDidChange() {
                    var didChange = editor.getBuffer().onDidChange(function () {
                        didChange.dispose();
                        cd.remove(didChange);
                        subject.next(false);
                    });
                    cd.add(didChange);
                };
                cd.add(editor.getBuffer().onDidStopChanging(_lodash2.default.debounce(function () {
                    if (!subject.isUnsubscribed) subject.next(true);
                    bindDidChange();
                }, 5000)));
                cd.add(editor.getBuffer().onDidSave(function () {
                    return subject.next(true);
                }));
                cd.add(editor.getBuffer().onDidReload(function () {
                    return subject.next(true);
                }));
                cd.add(_rxjs.Observable.timer(1000).subscribe(function () {
                    return subject.next(true);
                }));
                cd.add(editor.onDidChangeScrollTop(function () {
                    return _this.updateDecoratorVisiblility(editor);
                }));
                cd.add(atom.commands.onWillDispatch(function (event) {
                    if (_lodash2.default.includes(["omnisharp-atom:toggle-dock", "omnisharp-atom:show-dock", "omnisharp-atom:hide-dock"], event.type)) {
                        _this.updateDecoratorVisiblility(editor);
                    }
                }));
                cd.add(subject);
                _this.updateDecoratorVisiblility(editor);
            }));
        }
    }, {
        key: "updateDecoratorVisiblility",
        value: function updateDecoratorVisiblility(editor) {
            if (!this.decorations.has(editor)) this.decorations.set(editor, new Set());
            var decorations = this.decorations.get(editor);
            decorations.forEach(function (decoration) {
                return decoration.updateVisible();
            });
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "updateCodeLens",
        value: function updateCodeLens(editor) {
            if (!this.decorations.has(editor)) this.decorations.set(editor, new Set());
            var decorations = this.decorations.get(editor);
            var updated = new WeakSet();
            if (editor.isDestroyed()) {
                return _rxjs.Observable.empty();
            }
            return _omni.Omni.request(editor, function (solution) {
                return solution.currentfilemembersasflat({ Buffer: null, Changes: null });
            }).observeOn(_rxjs.Scheduler.queue).filter(function (fileMembers) {
                return !!fileMembers;
            }).flatMap(function (fileMembers) {
                return fileMembers;
            }).concatMap(function (fileMember) {
                var range = editor.getBuffer().rangeForRow(fileMember.Line, false);
                var marker = editor.markBufferRange(range, { invalidate: "inside" });
                var lens = void 0;
                var iteratee = decorations.values();
                var decoration = iteratee.next();
                while (!decoration.done) {
                    if (decoration.value.isEqual(marker)) {
                        lens = decoration.value;
                        break;
                    }
                    decoration = iteratee.next();
                }
                if (lens) {
                    updated.add(lens);
                    lens.invalidate();
                } else {
                    lens = new Lens(editor, fileMember, marker, range, _omnisharpClient.Disposable.create(function () {
                        decorations.delete(lens);
                    }));
                    updated.add(lens);
                    decorations.add(lens);
                }
                return lens.updateVisible();
            }).do({ complete: function complete() {
                    decorations.forEach(function (lens) {
                        if (lens && !updated.has(lens)) {
                            lens.dispose();
                        }
                    });
                } });
        }
    }]);

    return CodeLens;
}();

function isLineVisible(editor, line) {
    var element = atom.views.getView(editor);
    var top = element.getFirstVisibleScreenRow();
    var bottom = element.getLastVisibleScreenRow();
    if (line <= top || line >= bottom) return false;
    return true;
}

var Lens = exports.Lens = function () {
    function Lens(_editor, _member, _marker, _range, disposer) {
        var _this2 = this;

        _classCallCheck(this, Lens);

        this._editor = _editor;
        this._member = _member;
        this._marker = _marker;
        this._range = _range;
        this._disposable = new _omnisharpClient.CompositeDisposable();
        this.loaded = false;
        this._issueUpdate = _lodash2.default.debounce(function (isVisible) {
            if (!_this2._update.isUnsubscribed) {
                _this2._update.next(isVisible);
            }
        }, 250);
        this._row = _range.getRows()[0];
        this._update = new _rxjs.Subject();
        this._disposable.add(this._update);
        this._path = _editor.getPath();
        this._updateObservable = this._update.observeOn(_rxjs.Scheduler.queue).filter(function (x) {
            return !!x;
        }).flatMap(function () {
            return _omni.Omni.request(_this2._editor, function (solution) {
                return solution.findusages({ FileName: _this2._path, Column: _this2._member.Column + 1, Line: _this2._member.Line, Buffer: null, Changes: null }, { silent: true });
            });
        }).filter(function (x) {
            return x && x.QuickFixes && !!x.QuickFixes.length;
        }).map(function (x) {
            return x && x.QuickFixes && x.QuickFixes.length - 1;
        }).share();
        this._disposable.add(this._updateObservable.take(1).filter(function (x) {
            return x > 0;
        }).do(function () {
            return _this2.loaded = true;
        }).subscribe(function (x) {
            return _this2._decorate(x);
        }));
        this._disposable.add(disposer);
        this._disposable.add(this._marker.onDidDestroy(function () {
            _this2.dispose();
        }));
    }

    _createClass(Lens, [{
        key: "updateVisible",
        value: function updateVisible() {
            var isVisible = this._isVisible();
            this._updateDecoration(isVisible);
            var result = void 0;
            if (isVisible) {
                result = this._updateObservable.take(1);
            } else {
                result = _rxjs.Observable.empty();
            }
            this._issueUpdate(isVisible);
            return result;
        }
    }, {
        key: "updateTop",
        value: function updateTop(lineHeight) {
            if (this._element) this._element.style.top = "-" + lineHeight + "px";
        }
    }, {
        key: "invalidate",
        value: function invalidate() {
            var _this3 = this;

            var self = this._updateObservable.take(1).do(function () {
                return _this3._disposable.remove(self);
            }).subscribe(function (x) {
                if (x <= 0) {
                    _this3.dispose();
                } else {
                    if (_this3._element) {
                        _this3._element.textContent = x.toString();
                    }
                }
            });
            this._disposable.add(self);
        }
    }, {
        key: "isEqual",
        value: function isEqual(marker) {
            return this._marker.isEqual(marker);
        }
    }, {
        key: "_isVisible",
        value: function _isVisible() {
            return isLineVisible(this._editor, this._row);
        }
    }, {
        key: "_updateDecoration",
        value: function _updateDecoration(isVisible) {
            var _this4 = this;

            if (this._decoration && this._element) {
                (function () {
                    var element = _this4._element;
                    if (isVisible) {
                        fastdom.measure(function () {
                            return element.style.display === "none" && fastdom.mutate(function () {
                                return element.style.display = "";
                            });
                        });
                    } else {
                        fastdom.measure(function () {
                            return element.style.display !== "none" && fastdom.mutate(function () {
                                return element.style.display = "none";
                            });
                        });
                    }
                })();
            }
        }
    }, {
        key: "_decorate",
        value: function _decorate(count) {
            var _this5 = this;

            var lineHeight = this._editor.getLineHeightInPixels();
            var element = this._element = document.createElement("div");
            element.style.position = "relative";
            element.style.top = "-" + lineHeight + "px";
            element.style.left = "16px";
            element.classList.add("highlight-info", "badge", "badge-small");
            element.textContent = count.toString();
            element.onclick = function () {
                return _omni.Omni.request(_this5._editor, function (s) {
                    return s.findusages({ FileName: _this5._path, Column: _this5._member.Column + 1, Line: _this5._member.Line, Buffer: null, Changes: null });
                });
            };
            this._decoration = this._editor.decorateMarker(this._marker, { type: "overlay", class: "codelens", item: this._element, position: "head" });
            this._disposable.add(_omnisharpClient.Disposable.create(function () {
                _this5._element.remove();
                if (_this5._decoration) {
                    _this5._decoration.destroy();
                }
                _this5._element = null;
            }));
            var isVisible = isLineVisible(this._editor, this._row);
            if (!isVisible) {
                element.style.display = "none";
            }
            return this._decoration;
        }
    }, {
        key: "dispose",
        value: function dispose() {
            return this._disposable.dispose();
        }
    }]);

    return Lens;
}();

var codeLens = exports.codeLens = new CodeLens();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWxlbnMuanMiLCJsaWIvZmVhdHVyZXMvY29kZS1sZW5zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7OztBQ0dBLElBQUksVUFBMEIsUUFBUSxTQUFSLENBQTlCOztJQVNBLFE7QUFBQSx3QkFBQTtBQUFBOztBQUVZLGFBQUEsV0FBQSxHQUFjLElBQUksT0FBSixFQUFkO0FBd0lELGFBQUEsUUFBQSxHQUFXLEtBQVg7QUFDQSxhQUFBLEtBQUEsR0FBUSxXQUFSO0FBQ0EsYUFBQSxXQUFBLEdBQWMsdURBQWQ7QUFDVjs7OzttQ0F6SWtCO0FBQUE7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEI7QUFFQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssVUFBTCxDQUFnQixVQUFDLE1BQUQsRUFBUyxFQUFULEVBQVc7QUFDM0MsbUJBQUcsR0FBSCxDQUFPLDRCQUFXLE1BQVgsQ0FBa0IsWUFBQTtBQUNyQix3QkFBTSxVQUFVLE1BQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQixNQUFyQixDQUFoQjtBQUVBLHdCQUFJLE9BQUosRUFBYTtBQUNULGdDQUFRLE9BQVIsQ0FBZ0I7QUFBQSxtQ0FBVSxPQUFPLE9BQVAsRUFBVjtBQUFBLHlCQUFoQjtBQUNIO0FBRUQsMEJBQUssV0FBTCxDQUFpQixNQUFqQixDQUF3QixNQUF4QjtBQUNILGlCQVJNLENBQVA7QUFVQSxtQkFBRyxHQUFILENBQU8sS0FBSyxNQUFMLENBQVksT0FBWixDQUFvQixpQkFBcEIsRUFBdUMsVUFBQyxJQUFELEVBQWE7QUFDdkQsd0JBQU0sY0FBYyxNQUFLLFdBQUwsQ0FBaUIsR0FBakIsQ0FBcUIsTUFBckIsQ0FBcEI7QUFDQSx3QkFBTSxhQUFhLE9BQU8scUJBQVAsRUFBbkI7QUFDQSx3QkFBSSxlQUFlLFVBQW5CLEVBQStCO0FBQzNCLG9DQUFZLE9BQVosQ0FBb0I7QUFB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LEVBQW1CLGlCQUFuQixFQUFzQyxNQUFNLEtBQUssUUFBakQsRUFBMkQsVUFBVSxNQUFyRSxFQUExQyxDQUF4QjtBQUNBLGlCQUFLLFdBQUwsQ0FBaUIsR0FBakIsQ0FBcUIsNEJBQVcsTUFBWCxDQUFrQixZQUFBO0FBQ25DLHVCQUFLLFFBQUwsQ0FBYyxNQUFkO0FBQ0Esb0JBQUksT0FBSyxXQUFULEVBQXNCO0FBQ2xCLDJCQUFLLFdBQUwsQ0FBaUIsT0FBakI7QUFDSDtBQUNELHVCQUFLLFFBQUwsR0FBZ0IsSUFBaEI7QUFDSCxhQU5vQixDQUFyQjtBQVFBLGdCQUFNLFlBQVksY0FBYyxLQUFLLE9BQW5CLEVBQTRCLEtBQUssSUFBakMsQ0FBbEI7QUFDQSxnQkFBSSxDQUFDLFNBQUwsRUFBZ0I7QUFDWix3QkFBUSxLQUFSLENBQWMsT0FBZCxHQUF3QixNQUF4QjtBQUNIO0FBRUQsbUJBQU8sS0FBSyxXQUFaO0FBQ0g7OztrQ0FFYTtBQUFLLG1CQUFPLEtBQUssV0FBTCxDQUFpQixPQUFqQixFQUFQO0FBQW9DOzs7Ozs7QUFHcEQsSUFBTSw4QkFBVyxJQUFJLFFBQUosRUFBakIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL2NvZGUtbGVucy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QsIFNjaGVkdWxlciB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmxldCBmYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XG5jbGFzcyBDb2RlTGVucyB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZGVjb3JhdGlvbnMgPSBuZXcgV2Vha01hcCgpO1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkNvZGUgTGVuc1wiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJBZGRzIHN1cHBvcnQgZm9yIGRpc3BsYXlpbmcgcmVmZXJlbmNlcyBpbiB0aGUgZWRpdG9yLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmVhY2hFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcbiAgICAgICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWFya2VycyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFya2Vycy5mb3JFYWNoKG1hcmtlciA9PiBtYXJrZXIuZGlzcG9zZSgpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5kZWNvcmF0aW9ucy5kZWxldGUoZWRpdG9yKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNkLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwiZWRpdG9yLmZvbnRTaXplXCIsIChzaXplKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVjb3JhdGlvbnMgPSB0aGlzLmRlY29yYXRpb25zLmdldChlZGl0b3IpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmVIZWlnaHQgPSBlZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCk7XG4gICAgICAgICAgICAgICAgaWYgKGRlY29yYXRpb25zICYmIGxpbmVIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuZm9yRWFjaChkZWNvcmF0aW9uID0+IGRlY29yYXRpb24udXBkYXRlVG9wKGxpbmVIZWlnaHQpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaXRlbXMgPSB0aGlzLmRlY29yYXRpb25zLmdldChlZGl0b3IpO1xuICAgICAgICAgICAgaWYgKCFpdGVtcylcbiAgICAgICAgICAgICAgICB0aGlzLmRlY29yYXRpb25zLnNldChlZGl0b3IsIG5ldyBTZXQoKSk7XG4gICAgICAgICAgICBjb25zdCBzdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgICAgIGNkLmFkZChzdWJqZWN0XG4gICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEheCAmJiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpXG4gICAgICAgICAgICAgICAgLmRpc3RpbmN0VW50aWxDaGFuZ2VkKHggPT4gISF4KVxuICAgICAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoNTAwKVxuICAgICAgICAgICAgICAgIC5zd2l0Y2hNYXAoKCkgPT4gdGhpcy51cGRhdGVDb2RlTGVucyhlZGl0b3IpKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKSk7XG4gICAgICAgICAgICBjb25zdCBiaW5kRGlkQ2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRpZENoYW5nZSA9IGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZENoYW5nZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGRpZENoYW5nZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIGNkLnJlbW92ZShkaWRDaGFuZ2UpO1xuICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQoZmFsc2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNkLmFkZChkaWRDaGFuZ2UpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRTdG9wQ2hhbmdpbmcoXy5kZWJvdW5jZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFzdWJqZWN0LmlzVW5zdWJzY3JpYmVkKVxuICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgYmluZERpZENoYW5nZSgpO1xuICAgICAgICAgICAgfSwgNTAwMCkpKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRTYXZlKCgpID0+IHN1YmplY3QubmV4dCh0cnVlKSkpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFJlbG9hZCgoKSA9PiBzdWJqZWN0Lm5leHQodHJ1ZSkpKTtcbiAgICAgICAgICAgIGNkLmFkZChPYnNlcnZhYmxlLnRpbWVyKDEwMDApLnN1YnNjcmliZSgoKSA9PiBzdWJqZWN0Lm5leHQodHJ1ZSkpKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRDaGFuZ2VTY3JvbGxUb3AoKCkgPT4gdGhpcy51cGRhdGVEZWNvcmF0b3JWaXNpYmxpbGl0eShlZGl0b3IpKSk7XG4gICAgICAgICAgICBjZC5hZGQoYXRvbS5jb21tYW5kcy5vbldpbGxEaXNwYXRjaCgoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoXy5pbmNsdWRlcyhbXCJvbW5pc2hhcnAtYXRvbTp0b2dnbGUtZG9ja1wiLCBcIm9tbmlzaGFycC1hdG9tOnNob3ctZG9ja1wiLCBcIm9tbmlzaGFycC1hdG9tOmhpZGUtZG9ja1wiXSwgZXZlbnQudHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVEZWNvcmF0b3JWaXNpYmxpbGl0eShlZGl0b3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNkLmFkZChzdWJqZWN0KTtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRGVjb3JhdG9yVmlzaWJsaWxpdHkoZWRpdG9yKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICB1cGRhdGVEZWNvcmF0b3JWaXNpYmxpbGl0eShlZGl0b3IpIHtcbiAgICAgICAgaWYgKCF0aGlzLmRlY29yYXRpb25zLmhhcyhlZGl0b3IpKVxuICAgICAgICAgICAgdGhpcy5kZWNvcmF0aW9ucy5zZXQoZWRpdG9yLCBuZXcgU2V0KCkpO1xuICAgICAgICBjb25zdCBkZWNvcmF0aW9ucyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XG4gICAgICAgIGRlY29yYXRpb25zLmZvckVhY2goZGVjb3JhdGlvbiA9PiBkZWNvcmF0aW9uLnVwZGF0ZVZpc2libGUoKSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIHVwZGF0ZUNvZGVMZW5zKGVkaXRvcikge1xuICAgICAgICBpZiAoIXRoaXMuZGVjb3JhdGlvbnMuaGFzKGVkaXRvcikpXG4gICAgICAgICAgICB0aGlzLmRlY29yYXRpb25zLnNldChlZGl0b3IsIG5ldyBTZXQoKSk7XG4gICAgICAgIGNvbnN0IGRlY29yYXRpb25zID0gdGhpcy5kZWNvcmF0aW9ucy5nZXQoZWRpdG9yKTtcbiAgICAgICAgY29uc3QgdXBkYXRlZCA9IG5ldyBXZWFrU2V0KCk7XG4gICAgICAgIGlmIChlZGl0b3IuaXNEZXN0cm95ZWQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gT21uaS5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uY3VycmVudGZpbGVtZW1iZXJzYXNmbGF0KHsgQnVmZmVyOiBudWxsLCBDaGFuZ2VzOiBudWxsIH0pKVxuICAgICAgICAgICAgLm9ic2VydmVPbihTY2hlZHVsZXIucXVldWUpXG4gICAgICAgICAgICAuZmlsdGVyKGZpbGVNZW1iZXJzID0+ICEhZmlsZU1lbWJlcnMpXG4gICAgICAgICAgICAuZmxhdE1hcChmaWxlTWVtYmVycyA9PiBmaWxlTWVtYmVycylcbiAgICAgICAgICAgIC5jb25jYXRNYXAoZmlsZU1lbWJlciA9PiB7XG4gICAgICAgICAgICBjb25zdCByYW5nZSA9IGVkaXRvci5nZXRCdWZmZXIoKS5yYW5nZUZvclJvdyhmaWxlTWVtYmVyLkxpbmUsIGZhbHNlKTtcbiAgICAgICAgICAgIGNvbnN0IG1hcmtlciA9IGVkaXRvci5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UsIHsgaW52YWxpZGF0ZTogXCJpbnNpZGVcIiB9KTtcbiAgICAgICAgICAgIGxldCBsZW5zO1xuICAgICAgICAgICAgY29uc3QgaXRlcmF0ZWUgPSBkZWNvcmF0aW9ucy52YWx1ZXMoKTtcbiAgICAgICAgICAgIGxldCBkZWNvcmF0aW9uID0gaXRlcmF0ZWUubmV4dCgpO1xuICAgICAgICAgICAgd2hpbGUgKCFkZWNvcmF0aW9uLmRvbmUpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGVjb3JhdGlvbi52YWx1ZS5pc0VxdWFsKG1hcmtlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgbGVucyA9IGRlY29yYXRpb24udmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZWNvcmF0aW9uID0gaXRlcmF0ZWUubmV4dCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGxlbnMpIHtcbiAgICAgICAgICAgICAgICB1cGRhdGVkLmFkZChsZW5zKTtcbiAgICAgICAgICAgICAgICBsZW5zLmludmFsaWRhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGxlbnMgPSBuZXcgTGVucyhlZGl0b3IsIGZpbGVNZW1iZXIsIG1hcmtlciwgcmFuZ2UsIERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuZGVsZXRlKGxlbnMpO1xuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICB1cGRhdGVkLmFkZChsZW5zKTtcbiAgICAgICAgICAgICAgICBkZWNvcmF0aW9ucy5hZGQobGVucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbGVucy51cGRhdGVWaXNpYmxlKCk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuZG8oeyBjb21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGRlY29yYXRpb25zLmZvckVhY2gobGVucyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsZW5zICYmICF1cGRhdGVkLmhhcyhsZW5zKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGVucy5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gfSk7XG4gICAgfVxufVxuZnVuY3Rpb24gaXNMaW5lVmlzaWJsZShlZGl0b3IsIGxpbmUpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcik7XG4gICAgY29uc3QgdG9wID0gZWxlbWVudC5nZXRGaXJzdFZpc2libGVTY3JlZW5Sb3coKTtcbiAgICBjb25zdCBib3R0b20gPSBlbGVtZW50LmdldExhc3RWaXNpYmxlU2NyZWVuUm93KCk7XG4gICAgaWYgKGxpbmUgPD0gdG9wIHx8IGxpbmUgPj0gYm90dG9tKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG59XG5leHBvcnQgY2xhc3MgTGVucyB7XG4gICAgY29uc3RydWN0b3IoX2VkaXRvciwgX21lbWJlciwgX21hcmtlciwgX3JhbmdlLCBkaXNwb3Nlcikge1xuICAgICAgICB0aGlzLl9lZGl0b3IgPSBfZWRpdG9yO1xuICAgICAgICB0aGlzLl9tZW1iZXIgPSBfbWVtYmVyO1xuICAgICAgICB0aGlzLl9tYXJrZXIgPSBfbWFya2VyO1xuICAgICAgICB0aGlzLl9yYW5nZSA9IF9yYW5nZTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMubG9hZGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2lzc3VlVXBkYXRlID0gXy5kZWJvdW5jZSgoaXNWaXNpYmxlKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3VwZGF0ZS5pc1Vuc3Vic2NyaWJlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3VwZGF0ZS5uZXh0KGlzVmlzaWJsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDI1MCk7XG4gICAgICAgIHRoaXMuX3JvdyA9IF9yYW5nZS5nZXRSb3dzKClbMF07XG4gICAgICAgIHRoaXMuX3VwZGF0ZSA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX3VwZGF0ZSk7XG4gICAgICAgIHRoaXMuX3BhdGggPSBfZWRpdG9yLmdldFBhdGgoKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlT2JzZXJ2YWJsZSA9IHRoaXMuX3VwZGF0ZVxuICAgICAgICAgICAgLm9ic2VydmVPbihTY2hlZHVsZXIucXVldWUpXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4KVxuICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gT21uaS5yZXF1ZXN0KHRoaXMuX2VkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24uZmluZHVzYWdlcyh7IEZpbGVOYW1lOiB0aGlzLl9wYXRoLCBDb2x1bW46IHRoaXMuX21lbWJlci5Db2x1bW4gKyAxLCBMaW5lOiB0aGlzLl9tZW1iZXIuTGluZSwgQnVmZmVyOiBudWxsLCBDaGFuZ2VzOiBudWxsIH0sIHsgc2lsZW50OiB0cnVlIH0pKSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4ICYmIHguUXVpY2tGaXhlcyAmJiAhIXguUXVpY2tGaXhlcy5sZW5ndGgpXG4gICAgICAgICAgICAubWFwKHggPT4geCAmJiB4LlF1aWNrRml4ZXMgJiYgeC5RdWlja0ZpeGVzLmxlbmd0aCAtIDEpXG4gICAgICAgICAgICAuc2hhcmUoKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fdXBkYXRlT2JzZXJ2YWJsZVxuICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4ID4gMClcbiAgICAgICAgICAgIC5kbygoKSA9PiB0aGlzLmxvYWRlZCA9IHRydWUpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCh4KSA9PiB0aGlzLl9kZWNvcmF0ZSh4KSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChkaXNwb3Nlcik7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX21hcmtlci5vbkRpZERlc3Ryb3koKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgdXBkYXRlVmlzaWJsZSgpIHtcbiAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gdGhpcy5faXNWaXNpYmxlKCk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZURlY29yYXRpb24oaXNWaXNpYmxlKTtcbiAgICAgICAgbGV0IHJlc3VsdDtcbiAgICAgICAgaWYgKGlzVmlzaWJsZSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5fdXBkYXRlT2JzZXJ2YWJsZS50YWtlKDEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0ID0gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2lzc3VlVXBkYXRlKGlzVmlzaWJsZSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIHVwZGF0ZVRvcChsaW5lSGVpZ2h0KSB7XG4gICAgICAgIGlmICh0aGlzLl9lbGVtZW50KVxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudC5zdHlsZS50b3AgPSBgLSR7bGluZUhlaWdodH1weGA7XG4gICAgfVxuICAgIGludmFsaWRhdGUoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzLl91cGRhdGVPYnNlcnZhYmxlXG4gICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgLmRvKCgpID0+IHRoaXMuX2Rpc3Bvc2FibGUucmVtb3ZlKHNlbGYpKVxuICAgICAgICAgICAgLnN1YnNjcmliZSh4ID0+IHtcbiAgICAgICAgICAgIGlmICh4IDw9IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9lbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICh0aGlzLl9lbGVtZW50LnRleHRDb250ZW50ID0geC50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzZWxmKTtcbiAgICB9XG4gICAgaXNFcXVhbChtYXJrZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcmtlci5pc0VxdWFsKG1hcmtlcik7XG4gICAgfVxuICAgIF9pc1Zpc2libGUoKSB7XG4gICAgICAgIHJldHVybiBpc0xpbmVWaXNpYmxlKHRoaXMuX2VkaXRvciwgdGhpcy5fcm93KTtcbiAgICB9XG4gICAgX3VwZGF0ZURlY29yYXRpb24oaXNWaXNpYmxlKSB7XG4gICAgICAgIGlmICh0aGlzLl9kZWNvcmF0aW9uICYmIHRoaXMuX2VsZW1lbnQpIHtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50O1xuICAgICAgICAgICAgaWYgKGlzVmlzaWJsZSkge1xuICAgICAgICAgICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPT09IFwibm9uZVwiICYmIGZhc3Rkb20ubXV0YXRlKCgpID0+IGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwiXCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiBlbGVtZW50LnN0eWxlLmRpc3BsYXkgIT09IFwibm9uZVwiICYmIGZhc3Rkb20ubXV0YXRlKCgpID0+IGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgX2RlY29yYXRlKGNvdW50KSB7XG4gICAgICAgIGNvbnN0IGxpbmVIZWlnaHQgPSB0aGlzLl9lZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCk7XG4gICAgICAgIGNvbnN0IGVsZW1lbnQgPSB0aGlzLl9lbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgZWxlbWVudC5zdHlsZS5wb3NpdGlvbiA9IFwicmVsYXRpdmVcIjtcbiAgICAgICAgZWxlbWVudC5zdHlsZS50b3AgPSBgLSR7bGluZUhlaWdodH1weGA7XG4gICAgICAgIGVsZW1lbnQuc3R5bGUubGVmdCA9IFwiMTZweFwiO1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJoaWdobGlnaHQtaW5mb1wiLCBcImJhZGdlXCIsIFwiYmFkZ2Utc21hbGxcIik7XG4gICAgICAgIGVsZW1lbnQudGV4dENvbnRlbnQgPSBjb3VudC50b1N0cmluZygpO1xuICAgICAgICBlbGVtZW50Lm9uY2xpY2sgPSAoKSA9PiBPbW5pLnJlcXVlc3QodGhpcy5fZWRpdG9yLCBzID0+IHMuZmluZHVzYWdlcyh7IEZpbGVOYW1lOiB0aGlzLl9wYXRoLCBDb2x1bW46IHRoaXMuX21lbWJlci5Db2x1bW4gKyAxLCBMaW5lOiB0aGlzLl9tZW1iZXIuTGluZSwgQnVmZmVyOiBudWxsLCBDaGFuZ2VzOiBudWxsIH0pKTtcbiAgICAgICAgdGhpcy5fZGVjb3JhdGlvbiA9IHRoaXMuX2VkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLl9tYXJrZXIsIHsgdHlwZTogXCJvdmVybGF5XCIsIGNsYXNzOiBgY29kZWxlbnNgLCBpdGVtOiB0aGlzLl9lbGVtZW50LCBwb3NpdGlvbjogXCJoZWFkXCIgfSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQucmVtb3ZlKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5fZGVjb3JhdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2RlY29yYXRpb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudCA9IG51bGw7XG4gICAgICAgIH0pKTtcbiAgICAgICAgY29uc3QgaXNWaXNpYmxlID0gaXNMaW5lVmlzaWJsZSh0aGlzLl9lZGl0b3IsIHRoaXMuX3Jvdyk7XG4gICAgICAgIGlmICghaXNWaXNpYmxlKSB7XG4gICAgICAgICAgICBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fZGVjb3JhdGlvbjtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHsgcmV0dXJuIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpOyB9XG59XG5leHBvcnQgY29uc3QgY29kZUxlbnMgPSBuZXcgQ29kZUxlbnMoKTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90eXBpbmdzLmQudHNcIiAvPlxuaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3QsIFNjaGVkdWxlciwgU3Vic2NyaXB0aW9ufSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5sZXQgZmFzdGRvbTogdHlwZW9mIEZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcblxuaW50ZXJmYWNlIElEZWNvcmF0aW9uIHtcbiAgICBkZXN0cm95KCk6IGFueTtcbiAgICBnZXRNYXJrZXIoKTogQXRvbS5NYXJrZXI7XG4gICAgZ2V0UHJvcGVydGllcygpOiBhbnk7XG4gICAgc2V0UHJvcGVydGllcyhwcm9wczogYW55KTogYW55O1xufVxuXG5jbGFzcyBDb2RlTGVucyBpbXBsZW1lbnRzIElGZWF0dXJlIHtcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG4gICAgcHJpdmF0ZSBkZWNvcmF0aW9ucyA9IG5ldyBXZWFrTWFwPEF0b20uVGV4dEVkaXRvciwgU2V0PExlbnM+PigpO1xuXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5lYWNoRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hcmtlcnMgPSB0aGlzLmRlY29yYXRpb25zLmdldChlZGl0b3IpO1xuXG4gICAgICAgICAgICAgICAgaWYgKG1hcmtlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFya2Vycy5mb3JFYWNoKG1hcmtlciA9PiBtYXJrZXIuZGlzcG9zZSgpKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLmRlY29yYXRpb25zLmRlbGV0ZShlZGl0b3IpO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICBjZC5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcImVkaXRvci5mb250U2l6ZVwiLCAoc2l6ZTogbnVtYmVyKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVjb3JhdGlvbnMgPSB0aGlzLmRlY29yYXRpb25zLmdldChlZGl0b3IpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmVIZWlnaHQgPSBlZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCk7XG4gICAgICAgICAgICAgICAgaWYgKGRlY29yYXRpb25zICYmIGxpbmVIZWlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuZm9yRWFjaChkZWNvcmF0aW9uID0+IGRlY29yYXRpb24udXBkYXRlVG9wKGxpbmVIZWlnaHQpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pKTtcblxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpdGVtcyA9IHRoaXMuZGVjb3JhdGlvbnMuZ2V0KGVkaXRvcik7XG4gICAgICAgICAgICBpZiAoIWl0ZW1zKSB0aGlzLmRlY29yYXRpb25zLnNldChlZGl0b3IsIG5ldyBTZXQ8TGVucz4oKSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHN1YmplY3QgPSBuZXcgU3ViamVjdDxib29sZWFuPigpO1xuXG4gICAgICAgICAgICBjZC5hZGQoc3ViamVjdFxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXggJiYgIWVkaXRvci5pc0Rlc3Ryb3llZCgpKVxuICAgICAgICAgICAgICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCh4ID0+ICEheClcbiAgICAgICAgICAgICAgICAuZGVib3VuY2VUaW1lKDUwMClcbiAgICAgICAgICAgICAgICAuc3dpdGNoTWFwKCgpID0+IHRoaXMudXBkYXRlQ29kZUxlbnMoZWRpdG9yKSlcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKClcbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIGNvbnN0IGJpbmREaWRDaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaWRDaGFuZ2UgPSBlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRDaGFuZ2UoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBkaWRDaGFuZ2UuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICBjZC5yZW1vdmUoZGlkQ2hhbmdlKTtcblxuICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQoZmFsc2UpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgY2QuYWRkKGRpZENoYW5nZSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkU3RvcENoYW5naW5nKF8uZGVib3VuY2UoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghc3ViamVjdC5pc1Vuc3Vic2NyaWJlZCkgc3ViamVjdC5uZXh0KHRydWUpO1xuICAgICAgICAgICAgICAgIGJpbmREaWRDaGFuZ2UoKTtcbiAgICAgICAgICAgIH0sIDUwMDApKSk7XG5cbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRTYXZlKCgpID0+IHN1YmplY3QubmV4dCh0cnVlKSkpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFJlbG9hZCgoKSA9PiBzdWJqZWN0Lm5leHQodHJ1ZSkpKTtcbiAgICAgICAgICAgIGNkLmFkZChPYnNlcnZhYmxlLnRpbWVyKDEwMDApLnN1YnNjcmliZSgoKSA9PiBzdWJqZWN0Lm5leHQodHJ1ZSkpKTtcblxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZENoYW5nZVNjcm9sbFRvcCgoKSA9PiB0aGlzLnVwZGF0ZURlY29yYXRvclZpc2libGlsaXR5KGVkaXRvcikpKTtcblxuICAgICAgICAgICAgY2QuYWRkKGF0b20uY29tbWFuZHMub25XaWxsRGlzcGF0Y2goKGV2ZW50OiBFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChfLmluY2x1ZGVzKFtcIm9tbmlzaGFycC1hdG9tOnRvZ2dsZS1kb2NrXCIsIFwib21uaXNoYXJwLWF0b206c2hvdy1kb2NrXCIsIFwib21uaXNoYXJwLWF0b206aGlkZS1kb2NrXCJdLCBldmVudC50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZURlY29yYXRvclZpc2libGlsaXR5KGVkaXRvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICBjZC5hZGQoc3ViamVjdCk7XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZURlY29yYXRvclZpc2libGlsaXR5KGVkaXRvcik7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlRGVjb3JhdG9yVmlzaWJsaWxpdHkoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcbiAgICAgICAgaWYgKCF0aGlzLmRlY29yYXRpb25zLmhhcyhlZGl0b3IpKSB0aGlzLmRlY29yYXRpb25zLnNldChlZGl0b3IsIG5ldyBTZXQ8TGVucz4oKSk7XG4gICAgICAgIGNvbnN0IGRlY29yYXRpb25zID0gdGhpcy5kZWNvcmF0aW9ucy5nZXQoZWRpdG9yKTtcbiAgICAgICAgZGVjb3JhdGlvbnMuZm9yRWFjaChkZWNvcmF0aW9uID0+IGRlY29yYXRpb24udXBkYXRlVmlzaWJsZSgpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlQ29kZUxlbnMoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcbiAgICAgICAgaWYgKCF0aGlzLmRlY29yYXRpb25zLmhhcyhlZGl0b3IpKSB0aGlzLmRlY29yYXRpb25zLnNldChlZGl0b3IsIG5ldyBTZXQ8TGVucz4oKSk7XG4gICAgICAgIGNvbnN0IGRlY29yYXRpb25zID0gdGhpcy5kZWNvcmF0aW9ucy5nZXQoZWRpdG9yKTtcblxuICAgICAgICBjb25zdCB1cGRhdGVkID0gbmV3IFdlYWtTZXQ8TGVucz4oKTtcblxuICAgICAgICBpZiAoZWRpdG9yLmlzRGVzdHJveWVkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PG51bWJlcj4oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5jdXJyZW50ZmlsZW1lbWJlcnNhc2ZsYXQoeyBCdWZmZXI6IG51bGwsIENoYW5nZXM6IG51bGwgfSkpXG4gICAgICAgICAgICAub2JzZXJ2ZU9uKFNjaGVkdWxlci5xdWV1ZSlcbiAgICAgICAgICAgIC5maWx0ZXIoZmlsZU1lbWJlcnMgPT4gISFmaWxlTWVtYmVycylcbiAgICAgICAgICAgIC5mbGF0TWFwKGZpbGVNZW1iZXJzID0+IGZpbGVNZW1iZXJzKVxuICAgICAgICAgICAgLmNvbmNhdE1hcChmaWxlTWVtYmVyID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByYW5nZTogVGV4dEJ1ZmZlci5SYW5nZSA9IDxhbnk+ZWRpdG9yLmdldEJ1ZmZlcigpLnJhbmdlRm9yUm93KGZpbGVNZW1iZXIuTGluZSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IEJsb2NrIGRlY29yYXRpb25zXG4gICAgICAgICAgICAgICAgLy8gY29uc3QgbWFya2VyOiBBdG9tLk1hcmtlciA9ICg8YW55PmVkaXRvcikubWFya1NjcmVlblBvc2l0aW9uKFtmaWxlTWVtYmVyLkxpbmUsIDBdKTtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXJrZXI6IEF0b20uTWFya2VyID0gKDxhbnk+ZWRpdG9yKS5tYXJrQnVmZmVyUmFuZ2UocmFuZ2UsIHsgaW52YWxpZGF0ZTogXCJpbnNpZGVcIiB9KTtcbiAgICAgICAgICAgICAgICBsZXQgbGVuczogTGVucztcblxuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZXJhdGVlID0gZGVjb3JhdGlvbnMudmFsdWVzKCk7XG4gICAgICAgICAgICAgICAgbGV0IGRlY29yYXRpb24gPSBpdGVyYXRlZS5uZXh0KCk7XG4gICAgICAgICAgICAgICAgd2hpbGUgKCFkZWNvcmF0aW9uLmRvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlY29yYXRpb24udmFsdWUuaXNFcXVhbChtYXJrZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZW5zID0gZGVjb3JhdGlvbi52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGRlY29yYXRpb24gPSBpdGVyYXRlZS5uZXh0KCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGxlbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlZC5hZGQobGVucyk7XG4gICAgICAgICAgICAgICAgICAgIGxlbnMuaW52YWxpZGF0ZSgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGxlbnMgPSBuZXcgTGVucyhlZGl0b3IsIGZpbGVNZW1iZXIsIG1hcmtlciwgcmFuZ2UsIERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlY29yYXRpb25zLmRlbGV0ZShsZW5zKTtcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVkLmFkZChsZW5zKTtcbiAgICAgICAgICAgICAgICAgICAgZGVjb3JhdGlvbnMuYWRkKGxlbnMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBsZW5zLnVwZGF0ZVZpc2libGUoKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZG8oeyBjb21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBhbGwgb2xkL21pc3NpbmcgZGVjb3JhdGlvbnNcbiAgICAgICAgICAgICAgICBkZWNvcmF0aW9ucy5mb3JFYWNoKGxlbnMgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAobGVucyAmJiAhdXBkYXRlZC5oYXMobGVucykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxlbnMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xuICAgIHB1YmxpYyB0aXRsZSA9IFwiQ29kZSBMZW5zXCI7XG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIHN1cHBvcnQgZm9yIGRpc3BsYXlpbmcgcmVmZXJlbmNlcyBpbiB0aGUgZWRpdG9yLlwiO1xufVxuXG5mdW5jdGlvbiBpc0xpbmVWaXNpYmxlKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBsaW5lOiBudW1iZXIpIHtcbiAgICBjb25zdCBlbGVtZW50OiBhbnkgPSBhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKTtcbiAgICBjb25zdCB0b3AgPSBlbGVtZW50LmdldEZpcnN0VmlzaWJsZVNjcmVlblJvdygpO1xuICAgIGNvbnN0IGJvdHRvbSA9IGVsZW1lbnQuZ2V0TGFzdFZpc2libGVTY3JlZW5Sb3coKTtcblxuICAgIGlmIChsaW5lIDw9IHRvcCB8fCBsaW5lID49IGJvdHRvbSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xufVxuXG5leHBvcnQgY2xhc3MgTGVucyBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcbiAgICBwcml2YXRlIF91cGRhdGU6IFN1YmplY3Q8Ym9vbGVhbj47XG4gICAgcHJpdmF0ZSBfcm93OiBudW1iZXI7XG4gICAgcHJpdmF0ZSBfZGVjb3JhdGlvbjogSURlY29yYXRpb247XG4gICAgcHJpdmF0ZSBfZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgcHJpdmF0ZSBfZWxlbWVudDogSFRNTERpdkVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBfdXBkYXRlT2JzZXJ2YWJsZTogT2JzZXJ2YWJsZTxudW1iZXI+O1xuICAgIHByaXZhdGUgX3BhdGg6IHN0cmluZztcblxuICAgIHB1YmxpYyBsb2FkZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX2VkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBwcml2YXRlIF9tZW1iZXI6IE1vZGVscy5RdWlja0ZpeCwgcHJpdmF0ZSBfbWFya2VyOiBBdG9tLk1hcmtlciwgcHJpdmF0ZSBfcmFuZ2U6IFRleHRCdWZmZXIuUmFuZ2UsIGRpc3Bvc2VyOiBJRGlzcG9zYWJsZSkge1xuICAgICAgICB0aGlzLl9yb3cgPSBfcmFuZ2UuZ2V0Um93cygpWzBdO1xuICAgICAgICB0aGlzLl91cGRhdGUgPSBuZXcgU3ViamVjdDxhbnk+KCk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX3VwZGF0ZSk7XG4gICAgICAgIHRoaXMuX3BhdGggPSBfZWRpdG9yLmdldFBhdGgoKTtcblxuICAgICAgICB0aGlzLl91cGRhdGVPYnNlcnZhYmxlID0gdGhpcy5fdXBkYXRlXG4gICAgICAgICAgICAub2JzZXJ2ZU9uKFNjaGVkdWxlci5xdWV1ZSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXG4gICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiBPbW5pLnJlcXVlc3QodGhpcy5fZWRpdG9yLCBzb2x1dGlvbiA9PlxuICAgICAgICAgICAgICAgIHNvbHV0aW9uLmZpbmR1c2FnZXMoeyBGaWxlTmFtZTogdGhpcy5fcGF0aCwgQ29sdW1uOiB0aGlzLl9tZW1iZXIuQ29sdW1uICsgMSwgTGluZTogdGhpcy5fbWVtYmVyLkxpbmUsIEJ1ZmZlcjogbnVsbCwgQ2hhbmdlczogbnVsbCB9LCB7IHNpbGVudDogdHJ1ZSB9KSkpXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4geCAmJiB4LlF1aWNrRml4ZXMgJiYgISF4LlF1aWNrRml4ZXMubGVuZ3RoKVxuICAgICAgICAgICAgLm1hcCh4ID0+IHggJiYgeC5RdWlja0ZpeGVzICYmIHguUXVpY2tGaXhlcy5sZW5ndGggLSAxKVxuICAgICAgICAgICAgLnNoYXJlKCk7XG5cbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fdXBkYXRlT2JzZXJ2YWJsZVxuICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4ID4gMClcbiAgICAgICAgICAgIC5kbygoKSA9PiB0aGlzLmxvYWRlZCA9IHRydWUpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCh4KSA9PiB0aGlzLl9kZWNvcmF0ZSh4KSkpO1xuXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGRpc3Bvc2VyKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fbWFya2VyLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGVWaXNpYmxlKCkge1xuICAgICAgICBjb25zdCBpc1Zpc2libGUgPSB0aGlzLl9pc1Zpc2libGUoKTtcbiAgICAgICAgdGhpcy5fdXBkYXRlRGVjb3JhdGlvbihpc1Zpc2libGUpO1xuXG4gICAgICAgIGxldCByZXN1bHQ6IE9ic2VydmFibGU8bnVtYmVyPjtcbiAgICAgICAgaWYgKGlzVmlzaWJsZSkge1xuICAgICAgICAgICAgcmVzdWx0ID0gdGhpcy5fdXBkYXRlT2JzZXJ2YWJsZS50YWtlKDEpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVzdWx0ID0gT2JzZXJ2YWJsZS5lbXB0eTxudW1iZXI+KCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9pc3N1ZVVwZGF0ZShpc1Zpc2libGUpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByaXZhdGUgX2lzc3VlVXBkYXRlID0gXy5kZWJvdW5jZSgoaXNWaXNpYmxlOiBib29sZWFuKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5fdXBkYXRlLmlzVW5zdWJzY3JpYmVkKSB7IHRoaXMuX3VwZGF0ZS5uZXh0KGlzVmlzaWJsZSk7IH1cbiAgICB9LCAyNTApO1xuXG4gICAgcHVibGljIHVwZGF0ZVRvcChsaW5lSGVpZ2h0OiBudW1iZXIpIHtcbiAgICAgICAgaWYgKHRoaXMuX2VsZW1lbnQpXG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50LnN0eWxlLnRvcCA9IGAtJHtsaW5lSGVpZ2h0fXB4YDtcbiAgICB9XG5cbiAgICBwdWJsaWMgaW52YWxpZGF0ZSgpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA6IFN1YnNjcmlwdGlvbiA9IHRoaXMuX3VwZGF0ZU9ic2VydmFibGVcbiAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAuZG8oKCkgPT4gdGhpcy5fZGlzcG9zYWJsZS5yZW1vdmUoc2VsZikpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHggPT4ge1xuICAgICAgICAgICAgICAgIGlmICh4IDw9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX2VsZW1lbnQpIHsgKHRoaXMuX2VsZW1lbnQudGV4dENvbnRlbnQgPSB4LnRvU3RyaW5nKCkpOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHNlbGYpO1xuICAgIH1cblxuICAgIHB1YmxpYyBpc0VxdWFsKG1hcmtlcjogQXRvbS5NYXJrZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21hcmtlci5pc0VxdWFsKDxhbnk+bWFya2VyKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9pc1Zpc2libGUoKSB7XG4gICAgICAgIHJldHVybiBpc0xpbmVWaXNpYmxlKHRoaXMuX2VkaXRvciwgdGhpcy5fcm93KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF91cGRhdGVEZWNvcmF0aW9uKGlzVmlzaWJsZTogYm9vbGVhbikge1xuICAgICAgICBpZiAodGhpcy5fZGVjb3JhdGlvbiAmJiB0aGlzLl9lbGVtZW50KSB7XG4gICAgICAgICAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5fZWxlbWVudDtcbiAgICAgICAgICAgIGlmIChpc1Zpc2libGUpIHtcbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4gZWxlbWVudC5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIiAmJiBmYXN0ZG9tLm11dGF0ZSgoKSA9PiBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIlwiKSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiBlbGVtZW50LnN0eWxlLmRpc3BsYXkgIT09IFwibm9uZVwiICYmIGZhc3Rkb20ubXV0YXRlKCgpID0+IGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9kZWNvcmF0ZShjb3VudDogbnVtYmVyKSB7XG4gICAgICAgIGNvbnN0IGxpbmVIZWlnaHQgPSB0aGlzLl9lZGl0b3IuZ2V0TGluZUhlaWdodEluUGl4ZWxzKCk7XG5cbiAgICAgICAgY29uc3QgZWxlbWVudCA9IHRoaXMuX2VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBlbGVtZW50LnN0eWxlLnBvc2l0aW9uID0gXCJyZWxhdGl2ZVwiO1xuICAgICAgICBlbGVtZW50LnN0eWxlLnRvcCA9IGAtJHtsaW5lSGVpZ2h0fXB4YDtcbiAgICAgICAgZWxlbWVudC5zdHlsZS5sZWZ0ID0gXCIxNnB4XCI7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImhpZ2hsaWdodC1pbmZvXCIsIFwiYmFkZ2VcIiwgXCJiYWRnZS1zbWFsbFwiKTtcbiAgICAgICAgZWxlbWVudC50ZXh0Q29udGVudCA9IGNvdW50LnRvU3RyaW5nKCk7XG4gICAgICAgIGVsZW1lbnQub25jbGljayA9ICgpID0+IE9tbmkucmVxdWVzdCh0aGlzLl9lZGl0b3IsIHMgPT4gcy5maW5kdXNhZ2VzKHsgRmlsZU5hbWU6IHRoaXMuX3BhdGgsIENvbHVtbjogdGhpcy5fbWVtYmVyLkNvbHVtbiArIDEsIExpbmU6IHRoaXMuX21lbWJlci5MaW5lLCBCdWZmZXI6IG51bGwsIENoYW5nZXM6IG51bGwgfSkpO1xuXG4gICAgICAgIC8vIFRPRE86IEJsb2NrIGRlY29yYXRpb25zXG4gICAgICAgIC8vIHRoaXMuX2RlY29yYXRpb24gPSA8YW55PnRoaXMuX2VkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLl9tYXJrZXIsIHsgdHlwZTogXCJibG9ja1wiLCBjbGFzczogYGNvZGVsZW5zYCwgaXRlbTogdGhpcy5fZWxlbWVudCwgcG9zaXRpb246IFwiYmVmb3JlXCIgfSk7XG4gICAgICAgIHRoaXMuX2RlY29yYXRpb24gPSA8YW55PnRoaXMuX2VkaXRvci5kZWNvcmF0ZU1hcmtlcih0aGlzLl9tYXJrZXIsIHsgdHlwZTogXCJvdmVybGF5XCIsIGNsYXNzOiBgY29kZWxlbnNgLCBpdGVtOiB0aGlzLl9lbGVtZW50LCBwb3NpdGlvbjogXCJoZWFkXCIgfSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnQucmVtb3ZlKCk7XG4gICAgICAgICAgICBpZiAodGhpcy5fZGVjb3JhdGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2RlY29yYXRpb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fZWxlbWVudCA9IG51bGw7XG4gICAgICAgIH0pKTtcblxuICAgICAgICBjb25zdCBpc1Zpc2libGUgPSBpc0xpbmVWaXNpYmxlKHRoaXMuX2VkaXRvciwgdGhpcy5fcm93KTtcbiAgICAgICAgaWYgKCFpc1Zpc2libGUpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlY29yYXRpb247XG4gICAgfVxuXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7IHJldHVybiB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTsgfVxufVxuXG5leHBvcnQgY29uc3QgY29kZUxlbnMgPSBuZXcgQ29kZUxlbnMoKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

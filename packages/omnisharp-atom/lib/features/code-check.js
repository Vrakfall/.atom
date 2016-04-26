"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.codeCheck = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

var _dock = require("../atom/dock");

var _codecheckOutputPaneView = require("../views/codecheck-output-pane-view");

var _reloadWorkspace = require("./reload-workspace");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CodeCheck = function () {
    function CodeCheck() {
        _classCallCheck(this, CodeCheck);

        this.displayDiagnostics = [];
        this.selectedIndex = 0;
        this.scrollTop = 0;
        this._editorSubjects = new WeakMap();
        this._window = new _codecheckOutputPaneView.CodeCheckOutputElement();
        this.required = true;
        this.title = "Diagnostics";
        this.description = "Support for diagnostic errors.";
    }

    _createClass(CodeCheck, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this._fullCodeCheck = new _rxjs.Subject();
            this.disposable.add(this._fullCodeCheck);
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:next-diagnostic", function () {
                _this._window.next();
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:go-to-diagnostic", function () {
                _omni.Omni.navigateTo(_this._window.current);
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:previous-diagnostic", function () {
                _this._window.prev();
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:go-to-next-diagnostic", function () {
                _this._window.next();
                _omni.Omni.navigateTo(_this._window.current);
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:go-to-previous-diagnostic", function () {
                _this._window.prev();
                _omni.Omni.navigateTo(_this._window.current);
            }));
            this.disposable.add(_omni.Omni.eachEditor(function (editor, cd) {
                var subject = new _rxjs.Subject();
                var o = subject.debounceTime(100).filter(function () {
                    return !editor.isDestroyed();
                }).flatMap(function () {
                    return _this._doCodeCheck(editor);
                }).map(function (response) {
                    return response.QuickFixes || [];
                }).share();
                _this._editorSubjects.set(editor, function () {
                    var result = o.take(1);
                    subject.next(null);
                    return result;
                });
                cd.add(o.subscribe());
                cd.add(editor.getBuffer().onDidSave(function () {
                    return subject.next(null);
                }));
                cd.add(editor.getBuffer().onDidReload(function () {
                    return subject.next(null);
                }));
                cd.add(editor.getBuffer().onDidStopChanging(function () {
                    return subject.next(null);
                }));
                cd.add(_omnisharpClient.Disposable.create(function () {
                    return _this._editorSubjects.delete(editor);
                }));
            }));
            this.disposable.add(_omni.Omni.diagnostics.subscribe(function (diagnostics) {
                _this.displayDiagnostics = _this.filterOnlyWarningsAndErrors(diagnostics);
            }));
            this.disposable.add(_omni.Omni.diagnostics.subscribe(function (s) {
                _this.scrollTop = 0;
                _this.selectedIndex = 0;
            }));
            this.disposable.add(_omni.Omni.diagnostics.delay(100).subscribe(function (diagnostics) {
                return _this._window.update(diagnostics);
            }));
            this.disposable.add(_dock.dock.addWindow("errors", "Errors & Warnings", this._window));
            var started = 0,
                finished = 0;
            this.disposable.add(_rxjs.Observable.combineLatest(_omni.Omni.listener.packageRestoreStarted.map(function (x) {
                return started++;
            }), _omni.Omni.listener.packageRestoreFinished.map(function (x) {
                return finished++;
            }), function (s, f) {
                return s === f;
            }).filter(function (r) {
                return r;
            }).debounceTime(2000).subscribe(function () {
                started = 0;
                finished = 0;
                _this.doFullCodeCheck();
            }));
            this.disposable.add(_omni.Omni.listener.packageRestoreFinished.debounceTime(3000).subscribe(function () {
                return _this.doFullCodeCheck();
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:code-check", function () {
                return _this.doFullCodeCheck();
            }));
            this.disposable.add(this._fullCodeCheck.concatMap(function () {
                return _reloadWorkspace.reloadWorkspace.reloadWorkspace().toArray().concatMap(function (x) {
                    return _omni.Omni.solutions;
                }).concatMap(function (solution) {
                    return solution.whenConnected().do(function () {
                        return solution.codecheck({ FileName: null });
                    });
                });
            }).subscribe());
            _omni.Omni.registerConfiguration(function (solution) {
                return solution.whenConnected().delay(1000).subscribe(function () {
                    return _this._fullCodeCheck.next(true);
                });
            });
        }
    }, {
        key: "doFullCodeCheck",
        value: function doFullCodeCheck() {
            this._fullCodeCheck.next(true);
        }
    }, {
        key: "filterOnlyWarningsAndErrors",
        value: function filterOnlyWarningsAndErrors(quickFixes) {
            return _lodash2.default.filter(quickFixes, function (quickFix) {
                return quickFix.LogLevel !== "Hidden";
            });
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "_doCodeCheck",
        value: function _doCodeCheck(editor) {
            return _omni.Omni.request(editor, function (solution) {
                return solution.codecheck({});
            });
        }
    }, {
        key: "doCodeCheck",
        value: function doCodeCheck(editor) {
            var _this2 = this;

            var callback = this._editorSubjects.get(editor);
            if (callback) {
                return callback();
            }
            return _rxjs.Observable.timer(100).flatMap(function () {
                return _this2.doCodeCheck(editor);
            });
        }
    }]);

    return CodeCheck;
}();

var codeCheck = exports.codeCheck = new CodeCheck();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWNoZWNrLmpzIiwibGliL2ZlYXR1cmVzL2NvZGUtY2hlY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7O0lDR0EsUztBQUFBLHlCQUFBO0FBQUE7O0FBR1csYUFBQSxrQkFBQSxHQUFrRCxFQUFsRDtBQUNBLGFBQUEsYUFBQSxHQUF3QixDQUF4QjtBQUNDLGFBQUEsU0FBQSxHQUFvQixDQUFwQjtBQUNBLGFBQUEsZUFBQSxHQUFrQixJQUFJLE9BQUosRUFBbEI7QUFFQSxhQUFBLE9BQUEsR0FBVSxxREFBVjtBQXFJRCxhQUFBLFFBQUEsR0FBVyxJQUFYO0FBQ0EsYUFBQSxLQUFBLEdBQVEsYUFBUjtBQUNBLGFBQUEsV0FBQSxHQUFjLGdDQUFkO0FBQ1Y7Ozs7bUNBdElrQjtBQUFBOztBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCO0FBRUEsaUJBQUssY0FBTCxHQUFzQixtQkFBdEI7QUFDQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssY0FBekI7QUFFQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLGdDQUFwQyxFQUFzRSxZQUFBO0FBQ3RGLHNCQUFLLE9BQUwsQ0FBYSxJQUFiO0FBQ0gsYUFGbUIsQ0FBcEI7QUFJQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLEVBQW9DLGlDQUFwQyxFQUF1RSxZQUFBO0FBQ3ZGLDJCQUFLLFVBQUwsQ0FBZ0IsTUFBSyxPQUFMLENBQWEsT0FBN0I7QUFDSCxhQUZtQixDQUFwQjtBQUlBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixnQkFBbEIsRUFBb0Msb0NBQXBD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LGFBRE4sQ0FBUDtBQUVIOzs7Ozs7QUFPRSxJQUFNLGdDQUFZLElBQUksU0FBSixFQUFsQiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvY29kZS1jaGVjay5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBkb2NrIH0gZnJvbSBcIi4uL2F0b20vZG9ja1wiO1xuaW1wb3J0IHsgQ29kZUNoZWNrT3V0cHV0RWxlbWVudCB9IGZyb20gXCIuLi92aWV3cy9jb2RlY2hlY2stb3V0cHV0LXBhbmUtdmlld1wiO1xuaW1wb3J0IHsgcmVsb2FkV29ya3NwYWNlIH0gZnJvbSBcIi4vcmVsb2FkLXdvcmtzcGFjZVwiO1xuY2xhc3MgQ29kZUNoZWNrIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5kaXNwbGF5RGlhZ25vc3RpY3MgPSBbXTtcbiAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gMDtcbiAgICAgICAgdGhpcy5zY3JvbGxUb3AgPSAwO1xuICAgICAgICB0aGlzLl9lZGl0b3JTdWJqZWN0cyA9IG5ldyBXZWFrTWFwKCk7XG4gICAgICAgIHRoaXMuX3dpbmRvdyA9IG5ldyBDb2RlQ2hlY2tPdXRwdXRFbGVtZW50O1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiRGlhZ25vc3RpY3NcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiU3VwcG9ydCBmb3IgZGlhZ25vc3RpYyBlcnJvcnMuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9mdWxsQ29kZUNoZWNrID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLl9mdWxsQ29kZUNoZWNrKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206bmV4dC1kaWFnbm9zdGljXCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5uZXh0KCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tZGlhZ25vc3RpY1wiLCAoKSA9PiB7XG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fd2luZG93LmN1cnJlbnQpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnByZXZpb3VzLWRpYWdub3N0aWNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fd2luZG93LnByZXYoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpnby10by1uZXh0LWRpYWdub3N0aWNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fd2luZG93Lm5leHQoKTtcbiAgICAgICAgICAgIE9tbmkubmF2aWdhdGVUbyh0aGlzLl93aW5kb3cuY3VycmVudCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tcHJldmlvdXMtZGlhZ25vc3RpY1wiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl93aW5kb3cucHJldigpO1xuICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMuX3dpbmRvdy5jdXJyZW50KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZWFjaEVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc3ViamVjdCA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgICAgICBjb25zdCBvID0gc3ViamVjdFxuICAgICAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoKCkgPT4gIWVkaXRvci5pc0Rlc3Ryb3llZCgpKVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IHRoaXMuX2RvQ29kZUNoZWNrKGVkaXRvcikpXG4gICAgICAgICAgICAgICAgLm1hcChyZXNwb25zZSA9PiByZXNwb25zZS5RdWlja0ZpeGVzIHx8IFtdKVxuICAgICAgICAgICAgICAgIC5zaGFyZSgpO1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yU3ViamVjdHMuc2V0KGVkaXRvciwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IG8udGFrZSgxKTtcbiAgICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQobnVsbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY2QuYWRkKG8uc3Vic2NyaWJlKCkpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFNhdmUoKCkgPT4gc3ViamVjdC5uZXh0KG51bGwpKSk7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkUmVsb2FkKCgpID0+IHN1YmplY3QubmV4dChudWxsKSkpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFN0b3BDaGFuZ2luZygoKSA9PiBzdWJqZWN0Lm5leHQobnVsbCkpKTtcbiAgICAgICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB0aGlzLl9lZGl0b3JTdWJqZWN0cy5kZWxldGUoZWRpdG9yKSkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5kaWFnbm9zdGljc1xuICAgICAgICAgICAgLnN1YnNjcmliZShkaWFnbm9zdGljcyA9PiB7XG4gICAgICAgICAgICB0aGlzLmRpc3BsYXlEaWFnbm9zdGljcyA9IHRoaXMuZmlsdGVyT25seVdhcm5pbmdzQW5kRXJyb3JzKGRpYWdub3N0aWNzKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZGlhZ25vc3RpY3Muc3Vic2NyaWJlKHMgPT4ge1xuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb3AgPSAwO1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gMDtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZGlhZ25vc3RpY3NcbiAgICAgICAgICAgIC5kZWxheSgxMDApXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGRpYWdub3N0aWNzID0+IHRoaXMuX3dpbmRvdy51cGRhdGUoZGlhZ25vc3RpY3MpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZG9jay5hZGRXaW5kb3coXCJlcnJvcnNcIiwgXCJFcnJvcnMgJiBXYXJuaW5nc1wiLCB0aGlzLl93aW5kb3cpKTtcbiAgICAgICAgbGV0IHN0YXJ0ZWQgPSAwLCBmaW5pc2hlZCA9IDA7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT2JzZXJ2YWJsZS5jb21iaW5lTGF0ZXN0KE9tbmkubGlzdGVuZXIucGFja2FnZVJlc3RvcmVTdGFydGVkLm1hcCh4ID0+IHN0YXJ0ZWQrKyksIE9tbmkubGlzdGVuZXIucGFja2FnZVJlc3RvcmVGaW5pc2hlZC5tYXAoeCA9PiBmaW5pc2hlZCsrKSwgKHMsIGYpID0+IHMgPT09IGYpXG4gICAgICAgICAgICAuZmlsdGVyKHIgPT4gcilcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMjAwMClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgc3RhcnRlZCA9IDA7XG4gICAgICAgICAgICBmaW5pc2hlZCA9IDA7XG4gICAgICAgICAgICB0aGlzLmRvRnVsbENvZGVDaGVjaygpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkLmRlYm91bmNlVGltZSgzMDAwKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5kb0Z1bGxDb2RlQ2hlY2soKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpjb2RlLWNoZWNrXCIsICgpID0+IHRoaXMuZG9GdWxsQ29kZUNoZWNrKCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLl9mdWxsQ29kZUNoZWNrXG4gICAgICAgICAgICAuY29uY2F0TWFwKCgpID0+IHJlbG9hZFdvcmtzcGFjZS5yZWxvYWRXb3Jrc3BhY2UoKVxuICAgICAgICAgICAgLnRvQXJyYXkoKVxuICAgICAgICAgICAgLmNvbmNhdE1hcCh4ID0+IE9tbmkuc29sdXRpb25zKVxuICAgICAgICAgICAgLmNvbmNhdE1hcChzb2x1dGlvbiA9PiBzb2x1dGlvbi53aGVuQ29ubmVjdGVkKClcbiAgICAgICAgICAgIC5kbygoKSA9PiBzb2x1dGlvbi5jb2RlY2hlY2soeyBGaWxlTmFtZTogbnVsbCB9KSkpKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgpKTtcbiAgICAgICAgT21uaS5yZWdpc3RlckNvbmZpZ3VyYXRpb24oc29sdXRpb24gPT4gc29sdXRpb25cbiAgICAgICAgICAgIC53aGVuQ29ubmVjdGVkKClcbiAgICAgICAgICAgIC5kZWxheSgxMDAwKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLl9mdWxsQ29kZUNoZWNrLm5leHQodHJ1ZSkpKTtcbiAgICB9XG4gICAgZG9GdWxsQ29kZUNoZWNrKCkge1xuICAgICAgICB0aGlzLl9mdWxsQ29kZUNoZWNrLm5leHQodHJ1ZSk7XG4gICAgfVxuICAgIGZpbHRlck9ubHlXYXJuaW5nc0FuZEVycm9ycyhxdWlja0ZpeGVzKSB7XG4gICAgICAgIHJldHVybiBfLmZpbHRlcihxdWlja0ZpeGVzLCAocXVpY2tGaXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBxdWlja0ZpeC5Mb2dMZXZlbCAhPT0gXCJIaWRkZW5cIjtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIF9kb0NvZGVDaGVjayhlZGl0b3IpIHtcbiAgICAgICAgcmV0dXJuIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmNvZGVjaGVjayh7fSkpO1xuICAgIH1cbiAgICA7XG4gICAgZG9Db2RlQ2hlY2soZWRpdG9yKSB7XG4gICAgICAgIGNvbnN0IGNhbGxiYWNrID0gdGhpcy5fZWRpdG9yU3ViamVjdHMuZ2V0KGVkaXRvcik7XG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUudGltZXIoMTAwKVxuICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gdGhpcy5kb0NvZGVDaGVjayhlZGl0b3IpKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgY29kZUNoZWNrID0gbmV3IENvZGVDaGVjaztcbiIsImltcG9ydCB7TW9kZWxzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7ZG9ja30gZnJvbSBcIi4uL2F0b20vZG9ja1wiO1xuaW1wb3J0IHtDb2RlQ2hlY2tPdXRwdXRFbGVtZW50fSBmcm9tIFwiLi4vdmlld3MvY29kZWNoZWNrLW91dHB1dC1wYW5lLXZpZXdcIjtcbmltcG9ydCB7cmVsb2FkV29ya3NwYWNlfSBmcm9tIFwiLi9yZWxvYWQtd29ya3NwYWNlXCI7XG5cbmNsYXNzIENvZGVDaGVjayBpbXBsZW1lbnRzIElGZWF0dXJlIHtcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG5cbiAgICBwdWJsaWMgZGlzcGxheURpYWdub3N0aWNzOiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10gPSBbXTtcbiAgICBwdWJsaWMgc2VsZWN0ZWRJbmRleDogbnVtYmVyID0gMDtcbiAgICBwcml2YXRlIHNjcm9sbFRvcDogbnVtYmVyID0gMDtcbiAgICBwcml2YXRlIF9lZGl0b3JTdWJqZWN0cyA9IG5ldyBXZWFrTWFwPEF0b20uVGV4dEVkaXRvciwgKCkgPT4gT2JzZXJ2YWJsZTxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+PigpO1xuICAgIHByaXZhdGUgX2Z1bGxDb2RlQ2hlY2s6IFN1YmplY3Q8YW55PjtcbiAgICBwcml2YXRlIF93aW5kb3cgPSBuZXcgQ29kZUNoZWNrT3V0cHV0RWxlbWVudDtcblxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcblxuICAgICAgICB0aGlzLl9mdWxsQ29kZUNoZWNrID0gbmV3IFN1YmplY3Q8YW55PigpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMuX2Z1bGxDb2RlQ2hlY2spO1xuXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOm5leHQtZGlhZ25vc3RpY1wiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl93aW5kb3cubmV4dCgpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tZGlhZ25vc3RpY1wiLCAoKSA9PiB7XG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fd2luZG93LmN1cnJlbnQpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206cHJldmlvdXMtZGlhZ25vc3RpY1wiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl93aW5kb3cucHJldigpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tbmV4dC1kaWFnbm9zdGljXCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3dpbmRvdy5uZXh0KCk7XG4gICAgICAgICAgICBPbW5pLm5hdmlnYXRlVG8odGhpcy5fd2luZG93LmN1cnJlbnQpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Z28tdG8tcHJldmlvdXMtZGlhZ25vc3RpY1wiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl93aW5kb3cucHJldigpO1xuICAgICAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHRoaXMuX3dpbmRvdy5jdXJyZW50KTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5lYWNoRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzdWJqZWN0ID0gbmV3IFN1YmplY3Q8YW55PigpO1xuXG4gICAgICAgICAgICBjb25zdCBvID0gc3ViamVjdFxuICAgICAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMTAwKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoKCkgPT4gIWVkaXRvci5pc0Rlc3Ryb3llZCgpKVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IHRoaXMuX2RvQ29kZUNoZWNrKGVkaXRvcikpXG4gICAgICAgICAgICAgICAgLm1hcChyZXNwb25zZSA9PiByZXNwb25zZS5RdWlja0ZpeGVzIHx8IFtdKVxuICAgICAgICAgICAgICAgIC5zaGFyZSgpO1xuXG4gICAgICAgICAgICB0aGlzLl9lZGl0b3JTdWJqZWN0cy5zZXQoZWRpdG9yLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gby50YWtlKDEpO1xuICAgICAgICAgICAgICAgIHN1YmplY3QubmV4dChudWxsKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0IGFzIE9ic2VydmFibGU8TW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPjtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBjZC5hZGQoby5zdWJzY3JpYmUoKSk7XG5cbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRTYXZlKCgpID0+IHN1YmplY3QubmV4dChudWxsKSkpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFJlbG9hZCgoKSA9PiBzdWJqZWN0Lm5leHQobnVsbCkpKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRTdG9wQ2hhbmdpbmcoKCkgPT4gc3ViamVjdC5uZXh0KG51bGwpKSk7XG4gICAgICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4gdGhpcy5fZWRpdG9yU3ViamVjdHMuZGVsZXRlKGVkaXRvcikpKTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIC8vIExpbnRlciBpcyBkb2luZyB0aGlzIGZvciB1cyFcbiAgICAgICAgLyp0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBjZC5hZGQoT21uaS53aGVuRWRpdG9yQ29ubmVjdGVkKGVkaXRvcikuc3Vic2NyaWJlKCgpID0+IHRoaXMuZG9Db2RlQ2hlY2soZWRpdG9yKSkpO1xuICAgICAgICB9KSk7Ki9cblxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZGlhZ25vc3RpY3NcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoZGlhZ25vc3RpY3MgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheURpYWdub3N0aWNzID0gdGhpcy5maWx0ZXJPbmx5V2FybmluZ3NBbmRFcnJvcnMoZGlhZ25vc3RpY3MpO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5kaWFnbm9zdGljcy5zdWJzY3JpYmUocyA9PiB7XG4gICAgICAgICAgICB0aGlzLnNjcm9sbFRvcCA9IDA7XG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkSW5kZXggPSAwO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmRpYWdub3N0aWNzXG4gICAgICAgICAgICAuZGVsYXkoMTAwKVxuICAgICAgICAgICAgLnN1YnNjcmliZShkaWFnbm9zdGljcyA9PiB0aGlzLl93aW5kb3cudXBkYXRlKGRpYWdub3N0aWNzKSkpO1xuXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZG9jay5hZGRXaW5kb3coXCJlcnJvcnNcIiwgXCJFcnJvcnMgJiBXYXJuaW5nc1wiLCB0aGlzLl93aW5kb3cpKTtcblxuICAgICAgICBsZXQgc3RhcnRlZCA9IDAsIGZpbmlzaGVkID0gMDtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QoXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLnBhY2thZ2VSZXN0b3JlU3RhcnRlZC5tYXAoeCA9PiBzdGFydGVkKyspLFxuICAgICAgICAgICAgT21uaS5saXN0ZW5lci5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkLm1hcCh4ID0+IGZpbmlzaGVkKyspLFxuICAgICAgICAgICAgKHMsIGYpID0+IHMgPT09IGYpXG4gICAgICAgICAgICAuZmlsdGVyKHIgPT4gcilcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMjAwMClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHN0YXJ0ZWQgPSAwO1xuICAgICAgICAgICAgICAgIGZpbmlzaGVkID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLmRvRnVsbENvZGVDaGVjaygpO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5wYWNrYWdlUmVzdG9yZUZpbmlzaGVkLmRlYm91bmNlVGltZSgzMDAwKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5kb0Z1bGxDb2RlQ2hlY2soKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgXCJvbW5pc2hhcnAtYXRvbTpjb2RlLWNoZWNrXCIsICgpID0+IHRoaXMuZG9GdWxsQ29kZUNoZWNrKCkpKTtcblxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMuX2Z1bGxDb2RlQ2hlY2tcbiAgICAgICAgICAgIC5jb25jYXRNYXAoKCkgPT4gcmVsb2FkV29ya3NwYWNlLnJlbG9hZFdvcmtzcGFjZSgpXG4gICAgICAgICAgICAgICAgLnRvQXJyYXkoKVxuICAgICAgICAgICAgICAgIC5jb25jYXRNYXAoeCA9PiBPbW5pLnNvbHV0aW9ucylcbiAgICAgICAgICAgICAgICAuY29uY2F0TWFwKHNvbHV0aW9uID0+IHNvbHV0aW9uLndoZW5Db25uZWN0ZWQoKVxuICAgICAgICAgICAgICAgICAgICAuZG8oKCkgPT4gc29sdXRpb24uY29kZWNoZWNrKHsgRmlsZU5hbWU6IG51bGwgfSkpKVxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgpKTtcblxuICAgICAgICBPbW5pLnJlZ2lzdGVyQ29uZmlndXJhdGlvbihzb2x1dGlvbiA9PiBzb2x1dGlvblxuICAgICAgICAgICAgLndoZW5Db25uZWN0ZWQoKVxuICAgICAgICAgICAgLmRlbGF5KDEwMDApXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMuX2Z1bGxDb2RlQ2hlY2submV4dCh0cnVlKSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkb0Z1bGxDb2RlQ2hlY2soKSB7XG4gICAgICAgIHRoaXMuX2Z1bGxDb2RlQ2hlY2submV4dCh0cnVlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZmlsdGVyT25seVdhcm5pbmdzQW5kRXJyb3JzKHF1aWNrRml4ZXM6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSk6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXSB7XG4gICAgICAgIHJldHVybiBfLmZpbHRlcihxdWlja0ZpeGVzLCAocXVpY2tGaXg6IE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb24pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBxdWlja0ZpeC5Mb2dMZXZlbCAhPT0gXCJIaWRkZW5cIjtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZG9Db2RlQ2hlY2soZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcbiAgICAgICAgcmV0dXJuIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmNvZGVjaGVjayh7fSkpO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZG9Db2RlQ2hlY2soZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpOiBPYnNlcnZhYmxlPE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT4ge1xuICAgICAgICBjb25zdCBjYWxsYmFjayA9IHRoaXMuX2VkaXRvclN1YmplY3RzLmdldChlZGl0b3IpO1xuICAgICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLnRpbWVyKDEwMClcbiAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IHRoaXMuZG9Db2RlQ2hlY2soZWRpdG9yKSk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkRpYWdub3N0aWNzXCI7XG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJTdXBwb3J0IGZvciBkaWFnbm9zdGljIGVycm9ycy5cIjtcbn1cblxuZXhwb3J0IGNvbnN0IGNvZGVDaGVjayA9IG5ldyBDb2RlQ2hlY2s7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

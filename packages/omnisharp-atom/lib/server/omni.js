"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Omni = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _solutionManager = require("./solution-manager");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _fs = require("fs");

var fs = _interopRequireWildcard(_fs);

var _path = require("path");

var path = _interopRequireWildcard(_path);

var _omnisharpTextEditor = require("./omnisharp-text-editor");

var _metadataEditor = require("./metadata-editor");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEBOUNCE_TIMEOUT = 100;
var statefulProperties = ["isOff", "isConnecting", "isOn", "isReady", "isError"];
function wrapEditorObservable(observable) {
    return observable.subscribeOn(_rxjs.Scheduler.queue).observeOn(_rxjs.Scheduler.queue).debounceTime(DEBOUNCE_TIMEOUT).filter(function (editor) {
        return !editor || editor && !editor.isDestroyed();
    });
}

var OmniManager = function () {
    function OmniManager() {
        _classCallCheck(this, OmniManager);

        this._underlyingEditors = [];
        this._activeEditorOrConfigEditorSubject = new _rxjs.BehaviorSubject(null);
        this._activeEditorOrConfigEditor = wrapEditorObservable(this._activeEditorOrConfigEditorSubject).publishReplay(1).refCount();
        this._activeEditor = wrapEditorObservable(this._activeEditorOrConfigEditorSubject).delay(DEBOUNCE_TIMEOUT).map(function (x) {
            return x && !x.omnisharp.config ? x : null;
        }).publishReplay(1).refCount();
        this._activeConfigEditor = wrapEditorObservable(this._activeEditorOrConfigEditorSubject).delay(DEBOUNCE_TIMEOUT).map(function (x) {
            return x && x.omnisharp.config ? x : null;
        }).publishReplay(1).refCount();
        this._activeProject = this._activeEditorOrConfigEditor.filter(function (editor) {
            return editor && !editor.isDestroyed();
        }).switchMap(function (editor) {
            return editor.omnisharp.solution.model.getProjectForEditor(editor);
        }).distinctUntilChanged().publishReplay(1).refCount();
        this._activeFramework = this._activeEditorOrConfigEditor.filter(function (editor) {
            return editor && !editor.isDestroyed();
        }).switchMap(function (editor) {
            return editor.omnisharp.solution.model.getProjectForEditor(editor);
        }).switchMap(function (project) {
            return project.observe.activeFramework;
        }, function (project, framework) {
            return { project: project, framework: framework };
        }).distinctUntilChanged().publishReplay(1).refCount();
        this._isOff = true;
        this._supportedExtensions = ["project.json", ".cs", ".csx"];
    }

    _createClass(OmniManager, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add((0, _metadataEditor.metadataOpener)());
            var editors = this.createTextEditorObservable(this._supportedExtensions, this.disposable);
            this._editors = wrapEditorObservable(editors.filter(function (x) {
                return !x.omnisharp.config;
            }));
            this._configEditors = wrapEditorObservable(editors.filter(function (x) {
                return x.omnisharp.config;
            }));
            _solutionManager.SolutionManager.setupContextCallback = function (editor) {
                _this._underlyingEditors.push(editor);
                editor.omnisharp.config = _lodash2.default.endsWith(editor.getPath(), "project.json");
                _this.disposable.add(_omnisharpClient.Disposable.create(function () {
                    _lodash2.default.pull(_this._underlyingEditors, editor);
                }));
                editor.omnisharp.solution.disposable.add(_omnisharpClient.Disposable.create(function () {
                    _lodash2.default.pull(_this._underlyingEditors, editor);
                }));
            };
            _solutionManager.SolutionManager.activate(this._activeEditorOrConfigEditor);
            this.disposable.add(_solutionManager.SolutionManager.solutionAggregateObserver.state.subscribe(function (z) {
                return _this._isOff = _lodash2.default.every(z, function (x) {
                    return x.value === _omnisharpClient.DriverState.Disconnected || x.value === _omnisharpClient.DriverState.Error;
                });
            }));
            this.disposable.add((0, _omnisharpClient.createObservable)(function (observer) {
                var dis = atom.workspace.observeActivePaneItem(function (pane) {
                    if (pane && pane.getGrammar && pane.getPath && _this.isValidGrammar(pane.getGrammar())) {
                        observer.next(pane);
                        return;
                    }
                    observer.next(null);
                });
                return function () {
                    return dis.dispose();
                };
            }).concatMap(function (pane) {
                if (!pane || (0, _omnisharpTextEditor.isOmnisharpTextEditor)(pane)) {
                    return _rxjs.Observable.of(pane);
                }
                return wrapEditorObservable(_solutionManager.SolutionManager.getSolutionForEditor(pane).map(function (x) {
                    return pane;
                }));
            }).subscribe(this._activeEditorOrConfigEditorSubject));
            this.disposable.add(this._editors.subscribe(function (editor) {
                var cd = new _omnisharpClient.CompositeDisposable();
                cd.add(editor.onDidStopChanging(_lodash2.default.debounce(function () {
                    _this.request(editor, function (solution) {
                        return solution.updatebuffer({}, { silent: true });
                    });
                }, 1000)));
                cd.add(editor.onDidSave(function () {
                    return _this.request(editor, function (solution) {
                        return solution.updatebuffer({ FromDisk: true }, { silent: true });
                    });
                }));
                cd.add(editor.onDidDestroy(function () {
                    cd.dispose();
                }));
                _this.disposable.add(cd);
            }));
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
                _this._activeEditorOrConfigEditorSubject.next(null);
            }));
            var combinationObservable = this.aggregateListener.observe(function (z) {
                return z.model.observe.codecheck;
            });
            var showDiagnosticsForAllSolutions = new _rxjs.ReplaySubject(1);
            this.disposable.add(atom.config.observe("omnisharp-atom.showDiagnosticsForAllSolutions", function (enabled) {
                showDiagnosticsForAllSolutions.next(enabled);
            }));
            this.disposable.add(showDiagnosticsForAllSolutions);
            this._diagnostics = _rxjs.Observable.combineLatest(this.activeModel.startWith(null), showDiagnosticsForAllSolutions, showDiagnosticsForAllSolutions.skip(1).startWith(atom.config.get("omnisharp-atom.showDiagnosticsForAllSolutions")), function (model, enabled, wasEnabled) {
                return { model: model, enabled: enabled, wasEnabled: wasEnabled };
            }).filter(function (ctx) {
                return !(ctx.enabled && ctx.wasEnabled === ctx.enabled);
            }).switchMap(function (ctx) {
                var enabled = ctx.enabled;
                var model = ctx.model;

                if (enabled) {
                    return combinationObservable.debounceTime(200).map(function (data) {
                        return _lodash2.default.flatten(data);
                    });
                } else if (model) {
                    return model.observe.codecheck;
                }
                return _rxjs.Observable.of([]);
            }).startWith([]).publishReplay(1).refCount();
        }
    }, {
        key: "dispose",
        value: function dispose() {
            if (_solutionManager.SolutionManager._unitTestMode_) return;
            this.disposable.dispose();
            _solutionManager.SolutionManager.deactivate();
        }
    }, {
        key: "connect",
        value: function connect() {
            _solutionManager.SolutionManager.connect();
        }
    }, {
        key: "disconnect",
        value: function disconnect() {
            _solutionManager.SolutionManager.disconnect();
        }
    }, {
        key: "toggle",
        value: function toggle() {
            if (_solutionManager.SolutionManager.connected) {
                _solutionManager.SolutionManager.disconnect();
            } else {
                _solutionManager.SolutionManager.connect();
            }
        }
    }, {
        key: "navigateTo",
        value: function navigateTo(response) {
            return _rxjs.Observable.fromPromise(atom.workspace.open(response.FileName, { initialLine: response.Line, initialColumn: response.Column }));
        }
    }, {
        key: "getFrameworks",
        value: function getFrameworks(projects) {
            var frameworks = _lodash2.default.map(projects, function (project) {
                return project.indexOf("+") === -1 ? "" : project.split("+")[1];
            }).filter(function (fw) {
                return fw.length > 0;
            });
            return frameworks.join(",");
        }
    }, {
        key: "addTextEditorCommand",
        value: function addTextEditorCommand(commandName, callback) {
            var _this2 = this;

            return atom.commands.add("atom-text-editor", commandName, function (event) {
                var editor = atom.workspace.getActiveTextEditor();
                if (!editor) {
                    return;
                }
                ;
                if (_lodash2.default.some(_this2._supportedExtensions, function (ext) {
                    return _lodash2.default.endsWith(editor.getPath(), ext);
                })) {
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    callback(event);
                }
            });
        }
    }, {
        key: "createTextEditorObservable",
        value: function createTextEditorObservable(extensions, disposable) {
            var _this3 = this;

            var config = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

            this._createSafeGuard(extensions, disposable);
            return _rxjs.Observable.merge(_rxjs.Observable.defer(function () {
                return _rxjs.Observable.from(_this3._underlyingEditors);
            }), (0, _omnisharpClient.createObservable)(function (observer) {
                var dis = atom.workspace.observeTextEditors(function (editor) {
                    var cb = function cb() {
                        if (_lodash2.default.some(extensions, function (ext) {
                            return _lodash2.default.endsWith(editor.getPath(), ext);
                        })) {
                            _solutionManager.SolutionManager.getSolutionForEditor(editor).subscribe(function () {
                                return observer.next(editor);
                            });
                        }
                    };
                    var path = editor.getPath();
                    if (!path) {
                        (function () {
                            var disposer = editor.onDidChangePath(function () {
                                cb();
                                disposer.dispose();
                            });
                        })();
                    } else {
                        cb();
                    }
                });
                return function () {
                    return dis.dispose();
                };
            }));
        }
    }, {
        key: "_createSafeGuard",
        value: function _createSafeGuard(extensions, disposable) {
            var editorSubject = new _rxjs.Subject();
            disposable.add(atom.workspace.observeActivePaneItem(function (pane) {
                return editorSubject.next(pane);
            }));
            var editorObservable = editorSubject.filter(function (z) {
                return z && !!z.getGrammar;
            }).startWith(null);
            disposable.add(_rxjs.Observable.zip(editorObservable, editorObservable.skip(1), function (editor, nextEditor) {
                return { editor: editor, nextEditor: nextEditor };
            }).debounceTime(50).subscribe(function (_ref) {
                var editor = _ref.editor;
                var nextEditor = _ref.nextEditor;

                var path = nextEditor.getPath();
                if (!path) {
                    if (editor && _lodash2.default.some(extensions, function (ext) {
                        return _lodash2.default.endsWith(editor.getPath(), ext);
                    })) {
                        atom.notifications.addInfo("OmniSharp", { detail: "Functionality will limited until the file has been saved." });
                    }
                }
            }));
        }
    }, {
        key: "request",
        value: function request(editor, callback) {
            if (_lodash2.default.isFunction(editor)) {
                callback = editor;
                editor = null;
            }
            if (!editor) {
                editor = atom.workspace.getActiveTextEditor();
            }
            var solutionCallback = function solutionCallback(solution) {
                return callback(solution.withEditor(editor));
            };
            var result = void 0;
            if (editor && (0, _omnisharpTextEditor.isOmnisharpTextEditor)(editor)) {
                result = solutionCallback(editor.omnisharp.solution).share();
                result.subscribe();
                return result;
            }
            var solutionResult = void 0;
            if (editor) {
                solutionResult = _solutionManager.SolutionManager.getSolutionForEditor(editor);
            } else {
                solutionResult = _solutionManager.SolutionManager.activeSolution.take(1);
            }
            result = solutionResult.filter(function (z) {
                return !!z;
            }).flatMap(solutionCallback).share();
            result.subscribe();
            return result;
        }
    }, {
        key: "getProject",
        value: function getProject(editor) {
            if ((0, _omnisharpTextEditor.isOmnisharpTextEditor)(editor) && editor.omnisharp.project) {
                return _rxjs.Observable.of(editor.omnisharp.project);
            }
            return _solutionManager.SolutionManager.getSolutionForEditor(editor).flatMap(function (z) {
                return z.model.getProjectForEditor(editor);
            }).take(1);
        }
    }, {
        key: "getSolutionForProject",
        value: function getSolutionForProject(project) {
            return _rxjs.Observable.of((0, _lodash2.default)(_solutionManager.SolutionManager.activeSolutions).filter(function (solution) {
                return _lodash2.default.some(solution.model.projects, function (p) {
                    return p.name === project.name;
                });
            }).first());
        }
    }, {
        key: "getSolutionForEditor",
        value: function getSolutionForEditor(editor) {
            if ((0, _omnisharpTextEditor.isOmnisharpTextEditor)(editor)) {
                return _rxjs.Observable.of(editor.omnisharp.solution);
            }
            return _solutionManager.SolutionManager.getSolutionForEditor(editor);
        }
    }, {
        key: "switchActiveModel",
        value: function switchActiveModel(callback) {
            var _this4 = this;

            var outerCd = new _omnisharpClient.CompositeDisposable();
            outerCd.add(this.activeModel.filter(function (z) {
                return !!z;
            }).subscribe(function (model) {
                var cd = new _omnisharpClient.CompositeDisposable();
                outerCd.add(cd);
                cd.add(_this4.activeModel.filter(function (active) {
                    return active !== model;
                }).subscribe(function () {
                    outerCd.remove(cd);
                    cd.dispose();
                }));
                callback(model, cd);
            }));
            return outerCd;
        }
    }, {
        key: "switchActiveSolution",
        value: function switchActiveSolution(callback) {
            var _this5 = this;

            var outerCd = new _omnisharpClient.CompositeDisposable();
            outerCd.add(this.activeSolution.filter(function (z) {
                return !!z;
            }).subscribe(function (solution) {
                var cd = new _omnisharpClient.CompositeDisposable();
                outerCd.add(cd);
                cd.add(_this5.activeSolution.filter(function (active) {
                    return active !== solution;
                }).subscribe(function () {
                    outerCd.remove(cd);
                    cd.dispose();
                }));
                callback(solution, cd);
            }));
            return outerCd;
        }
    }, {
        key: "switchActiveEditor",
        value: function switchActiveEditor(callback) {
            var _this6 = this;

            var outerCd = new _omnisharpClient.CompositeDisposable();
            outerCd.add(this.activeEditor.filter(function (z) {
                return !!z;
            }).subscribe(function (editor) {
                var cd = new _omnisharpClient.CompositeDisposable();
                outerCd.add(cd);
                cd.add(_this6.activeEditor.filter(function (active) {
                    return active !== editor;
                }).subscribe(function () {
                    outerCd.remove(cd);
                    cd.dispose();
                }));
                callback(editor, cd);
            }));
            return outerCd;
        }
    }, {
        key: "whenEditorConnected",
        value: function whenEditorConnected(editor) {
            if ((0, _omnisharpTextEditor.isOmnisharpTextEditor)(editor)) {
                return editor.omnisharp.solution.whenConnected().map(function (z) {
                    return editor;
                });
            }
            return _solutionManager.SolutionManager.getSolutionForEditor(editor).flatMap(function (solution) {
                return solution.whenConnected();
            }, function () {
                return editor;
            });
        }
    }, {
        key: "switchActiveConfigEditor",
        value: function switchActiveConfigEditor(callback) {
            var _this7 = this;

            var outerCd = new _omnisharpClient.CompositeDisposable();
            outerCd.add(this.activeConfigEditor.filter(function (z) {
                return !!z;
            }).subscribe(function (editor) {
                var cd = new _omnisharpClient.CompositeDisposable();
                outerCd.add(cd);
                cd.add(_this7.activeConfigEditor.filter(function (active) {
                    return active !== editor;
                }).subscribe(function () {
                    outerCd.remove(cd);
                    cd.dispose();
                }));
                callback(editor, cd);
            }));
            return outerCd;
        }
    }, {
        key: "switchActiveEditorOrConfigEditor",
        value: function switchActiveEditorOrConfigEditor(callback) {
            var _this8 = this;

            var outerCd = new _omnisharpClient.CompositeDisposable();
            outerCd.add(this.activeEditorOrConfigEditor.filter(function (z) {
                return !!z;
            }).subscribe(function (editor) {
                var cd = new _omnisharpClient.CompositeDisposable();
                outerCd.add(cd);
                cd.add(_this8.activeEditorOrConfigEditor.filter(function (active) {
                    return active !== editor;
                }).subscribe(function () {
                    outerCd.remove(cd);
                    cd.dispose();
                }));
                callback(editor, cd);
            }));
            return outerCd;
        }
    }, {
        key: "eachEditor",
        value: function eachEditor(callback) {
            var outerCd = new _omnisharpClient.CompositeDisposable();
            outerCd.add(this._editors.subscribe(function (editor) {
                var cd = new _omnisharpClient.CompositeDisposable();
                outerCd.add(cd);
                cd.add(editor.onDidDestroy(function () {
                    outerCd.remove(cd);
                    cd.dispose();
                }));
                callback(editor, cd);
            }));
            return outerCd;
        }
    }, {
        key: "eachConfigEditor",
        value: function eachConfigEditor(callback) {
            var outerCd = new _omnisharpClient.CompositeDisposable();
            outerCd.add(this._configEditors.subscribe(function (editor) {
                var cd = new _omnisharpClient.CompositeDisposable();
                outerCd.add(cd);
                cd.add(editor.onDidDestroy(function () {
                    outerCd.remove(cd);
                    cd.dispose();
                }));
                callback(editor, cd);
            }));
            return outerCd;
        }
    }, {
        key: "registerConfiguration",
        value: function registerConfiguration(callback) {
            _solutionManager.SolutionManager.registerConfiguration(callback);
        }
    }, {
        key: "isValidGrammar",
        value: function isValidGrammar(grammar) {
            return _lodash2.default.some(this.grammars, { scopeName: grammar.scopeName });
        }
    }, {
        key: "viewModelStatefulProperties",
        get: function get() {
            return statefulProperties;
        }
    }, {
        key: "diagnostics",
        get: function get() {
            return this._diagnostics;
        }
    }, {
        key: "isOff",
        get: function get() {
            return this._isOff;
        }
    }, {
        key: "isOn",
        get: function get() {
            return !this.isOff;
        }
    }, {
        key: "listener",
        get: function get() {
            return _solutionManager.SolutionManager.solutionObserver;
        }
    }, {
        key: "aggregateListener",
        get: function get() {
            return _solutionManager.SolutionManager.solutionAggregateObserver;
        }
    }, {
        key: "solutions",
        get: function get() {
            return _rxjs.Observable.defer(function () {
                return _rxjs.Observable.from(_solutionManager.SolutionManager.activeSolutions);
            });
        }
    }, {
        key: "activeModel",
        get: function get() {
            return _solutionManager.SolutionManager.activeSolution.map(function (z) {
                return z.model;
            });
        }
    }, {
        key: "activeSolution",
        get: function get() {
            return _solutionManager.SolutionManager.activeSolution;
        }
    }, {
        key: "activeEditor",
        get: function get() {
            return this._activeEditor;
        }
    }, {
        key: "activeConfigEditor",
        get: function get() {
            return this._activeConfigEditor;
        }
    }, {
        key: "activeEditorOrConfigEditor",
        get: function get() {
            return this._activeEditorOrConfigEditor;
        }
    }, {
        key: "activeProject",
        get: function get() {
            return this._activeProject;
        }
    }, {
        key: "activeFramework",
        get: function get() {
            return this._activeFramework;
        }
    }, {
        key: "editors",
        get: function get() {
            return this._editors;
        }
    }, {
        key: "configEditors",
        get: function get() {
            return this._configEditors;
        }
    }, {
        key: "_kick_in_the_pants_",
        get: function get() {
            return _solutionManager.SolutionManager._kick_in_the_pants_;
        }
    }, {
        key: "grammars",
        get: function get() {
            var _this9 = this;

            return _lodash2.default.filter(atom.grammars.getGrammars(), function (grammar) {
                return _lodash2.default.some(_this9._supportedExtensions, function (ext) {
                    return _lodash2.default.some(grammar.fileTypes, function (ft) {
                        return _lodash2.default.trimStart(ext, ".") === ft;
                    });
                });
            });
        }
    }, {
        key: "packageDir",
        get: function get() {
            if (!this._packageDir) {
                console.info("getPackageDirPaths: " + atom.packages.getPackageDirPaths());
                this._packageDir = _lodash2.default.find(atom.packages.getPackageDirPaths(), function (packagePath) {
                    console.info("packagePath " + packagePath + " exists: " + fs.existsSync(path.join(packagePath, "omnisharp-atom")));
                    return fs.existsSync(path.join(packagePath, "omnisharp-atom"));
                });
                if (!this._packageDir) {
                    this._packageDir = path.resolve(__dirname, "../../..");
                }
            }
            return this._packageDir;
        }
    }]);

    return OmniManager;
}();

var Omni = exports.Omni = new OmniManager();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvb21uaS5qcyIsImxpYi9zZXJ2ZXIvb21uaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQUVBOztJQ0dZLEU7O0FERlo7O0lDR1ksSTs7QURGWjs7QUFDQTs7Ozs7Ozs7QUNRQSxJQUFNLG1CQUFtQixHQUF6QjtBQUNBLElBQU0scUJBQXFCLENBQUMsT0FBRCxFQUFVLGNBQVYsRUFBMEIsTUFBMUIsRUFBa0MsU0FBbEMsRUFBNkMsU0FBN0MsQ0FBM0I7QUFFQSxTQUFBLG9CQUFBLENBQThCLFVBQTlCLEVBQXlFO0FBQ3JFLFdBQU8sV0FDRixXQURFLENBQ1UsZ0JBQVUsS0FEcEIsRUFFRixTQUZFLENBRVEsZ0JBQVUsS0FGbEIsRUFHRixZQUhFLENBR1csZ0JBSFgsRUFJRixNQUpFLENBSUs7QUFBQSxlQUFVLENBQUMsTUFBRCxJQUFXLFVBQVUsQ0FBQyxPQUFPLFdBQVAsRUFBaEM7QUFBQSxLQUpMLENBQVA7QUFLSDs7SUFFRCxXO0FBQUEsMkJBQUE7QUFBQTs7QUFLWSxhQUFBLGtCQUFBLEdBQTRDLEVBQTVDO0FBSUEsYUFBQSxrQ0FBQSxHQUFxQywwQkFBeUMsSUFBekMsQ0FBckM7QUFDQSxhQUFBLDJCQUFBLEdBQThCLHFCQUEyRCxLQUFLLGtDQUFoRSxFQUNqQyxhQURpQyxDQUNuQixDQURtQixFQUNoQixRQURnQixFQUE5QjtBQUdBLGFBQUEsYUFBQSxHQUFnQixxQkFBMkQsS0FBSyxrQ0FBaEUsRUFDbkIsS0FEbUIsQ0FDYixnQkFEYSxFQUVuQixHQUZtQixDQUVmO0FBQUEsbUJBQUssS0FBSyxDQUFDLEVBQUUsU0FBRixDQUFZLE1BQWxCLEdBQTJCLENBQTNCLEdBQStCLElBQXBDO0FBQUEsU0FGZSxFQUduQixhQUhtQixDQUdMLENBSEssRUFHRixRQUhFLEVBQWhCO0FBS0EsYUFBQSxtQkFBQSxHQUFzQixxQkFBMkQsS0FBSyxrQ0FBaEUsRUFDekIsS0FE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LElBQUYsQ0FBYSxRQUFTLFNBQXRCLEVBQ0g7QUFBQSwrQkFBTSxpQkFBRSxTQUFGLENBQVksR0FBWixFQUFpQixHQUFqQixNQUEwQixFQUFoQztBQUFBLHFCQURHLENBQVA7QUFBQSxpQkFETyxDQUFYO0FBQUEsYUFERyxDQUFQO0FBSUg7Ozs0QkFPb0I7QUFDakIsZ0JBQUksQ0FBQyxLQUFLLFdBQVYsRUFBdUI7QUFDbkIsd0JBQVEsSUFBUiwwQkFBb0MsS0FBSyxRQUFMLENBQWMsa0JBQWQsRUFBcEM7QUFDQSxxQkFBSyxXQUFMLEdBQW1CLGlCQUFFLElBQUYsQ0FBTyxLQUFLLFFBQUwsQ0FBYyxrQkFBZCxFQUFQLEVBQTJDLFVBQVMsV0FBVCxFQUFvQjtBQUM5RSw0QkFBUSxJQUFSLGtCQUE0QixXQUE1QixpQkFBbUQsR0FBRyxVQUFILENBQWMsS0FBSyxJQUFMLENBQVUsV0FBVixFQUF1QixnQkFBdkIsQ0FBZCxDQUFuRDtBQUNBLDJCQUFPLEdBQUcsVUFBSCxDQUFjLEtBQUssSUFBTCxDQUFVLFdBQVYsRUFBdUIsZ0JBQXZCLENBQWQsQ0FBUDtBQUNILGlCQUhrQixDQUFuQjtBQU1BLG9CQUFJLENBQUMsS0FBSyxXQUFWLEVBQXVCO0FBQ25CLHlCQUFLLFdBQUwsR0FBbUIsS0FBSyxPQUFMLENBQWEsU0FBYixFQUF3QixVQUF4QixDQUFuQjtBQUNIO0FBQ0o7QUFDRCxtQkFBTyxLQUFLLFdBQVo7QUFDSDs7Ozs7O0FBSUUsSUFBTSxzQkFBTyxJQUFJLFdBQUosRUFBYiIsImZpbGUiOiJsaWIvc2VydmVyL29tbmkuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlLCBSZXBsYXlTdWJqZWN0LCBTdWJqZWN0LCBCZWhhdmlvclN1YmplY3QsIFNjaGVkdWxlciB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBjcmVhdGVPYnNlcnZhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IFNvbHV0aW9uTWFuYWdlciB9IGZyb20gXCIuL3NvbHV0aW9uLW1hbmFnZXJcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IERyaXZlclN0YXRlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgaXNPbW5pc2hhcnBUZXh0RWRpdG9yIH0gZnJvbSBcIi4vb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XG5pbXBvcnQgeyBtZXRhZGF0YU9wZW5lciB9IGZyb20gXCIuL21ldGFkYXRhLWVkaXRvclwiO1xuY29uc3QgREVCT1VOQ0VfVElNRU9VVCA9IDEwMDtcbmNvbnN0IHN0YXRlZnVsUHJvcGVydGllcyA9IFtcImlzT2ZmXCIsIFwiaXNDb25uZWN0aW5nXCIsIFwiaXNPblwiLCBcImlzUmVhZHlcIiwgXCJpc0Vycm9yXCJdO1xuZnVuY3Rpb24gd3JhcEVkaXRvck9ic2VydmFibGUob2JzZXJ2YWJsZSkge1xuICAgIHJldHVybiBvYnNlcnZhYmxlXG4gICAgICAgIC5zdWJzY3JpYmVPbihTY2hlZHVsZXIucXVldWUpXG4gICAgICAgIC5vYnNlcnZlT24oU2NoZWR1bGVyLnF1ZXVlKVxuICAgICAgICAuZGVib3VuY2VUaW1lKERFQk9VTkNFX1RJTUVPVVQpXG4gICAgICAgIC5maWx0ZXIoZWRpdG9yID0+ICFlZGl0b3IgfHwgZWRpdG9yICYmICFlZGl0b3IuaXNEZXN0cm95ZWQoKSk7XG59XG5jbGFzcyBPbW5pTWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX3VuZGVybHlpbmdFZGl0b3JzID0gW107XG4gICAgICAgIHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yU3ViamVjdCA9IG5ldyBCZWhhdmlvclN1YmplY3QobnVsbCk7XG4gICAgICAgIHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yID0gd3JhcEVkaXRvck9ic2VydmFibGUodGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0KVxuICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcbiAgICAgICAgdGhpcy5fYWN0aXZlRWRpdG9yID0gd3JhcEVkaXRvck9ic2VydmFibGUodGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0KVxuICAgICAgICAgICAgLmRlbGF5KERFQk9VTkNFX1RJTUVPVVQpXG4gICAgICAgICAgICAubWFwKHggPT4geCAmJiAheC5vbW5pc2hhcnAuY29uZmlnID8geCA6IG51bGwpXG4gICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xuICAgICAgICB0aGlzLl9hY3RpdmVDb25maWdFZGl0b3IgPSB3cmFwRWRpdG9yT2JzZXJ2YWJsZSh0aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvclN1YmplY3QpXG4gICAgICAgICAgICAuZGVsYXkoREVCT1VOQ0VfVElNRU9VVClcbiAgICAgICAgICAgIC5tYXAoeCA9PiB4ICYmIHgub21uaXNoYXJwLmNvbmZpZyA/IHggOiBudWxsKVxuICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcbiAgICAgICAgdGhpcy5fYWN0aXZlUHJvamVjdCA9IHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yXG4gICAgICAgICAgICAuZmlsdGVyKGVkaXRvciA9PiBlZGl0b3IgJiYgIWVkaXRvci5pc0Rlc3Ryb3llZCgpKVxuICAgICAgICAgICAgLnN3aXRjaE1hcChlZGl0b3IgPT4gZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbi5tb2RlbC5nZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcikpXG4gICAgICAgICAgICAuZGlzdGluY3RVbnRpbENoYW5nZWQoKVxuICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcbiAgICAgICAgdGhpcy5fYWN0aXZlRnJhbWV3b3JrID0gdGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JcbiAgICAgICAgICAgIC5maWx0ZXIoZWRpdG9yID0+IGVkaXRvciAmJiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpXG4gICAgICAgICAgICAuc3dpdGNoTWFwKGVkaXRvciA9PiBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uLm1vZGVsLmdldFByb2plY3RGb3JFZGl0b3IoZWRpdG9yKSlcbiAgICAgICAgICAgIC5zd2l0Y2hNYXAocHJvamVjdCA9PiBwcm9qZWN0Lm9ic2VydmUuYWN0aXZlRnJhbWV3b3JrLCAocHJvamVjdCwgZnJhbWV3b3JrKSA9PiAoeyBwcm9qZWN0LCBmcmFtZXdvcmsgfSkpXG4gICAgICAgICAgICAuZGlzdGluY3RVbnRpbENoYW5nZWQoKVxuICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcbiAgICAgICAgdGhpcy5faXNPZmYgPSB0cnVlO1xuICAgICAgICB0aGlzLl9zdXBwb3J0ZWRFeHRlbnNpb25zID0gW1wicHJvamVjdC5qc29uXCIsIFwiLmNzXCIsIFwiLmNzeFwiLF07XG4gICAgfVxuICAgIGdldCB2aWV3TW9kZWxTdGF0ZWZ1bFByb3BlcnRpZXMoKSB7IHJldHVybiBzdGF0ZWZ1bFByb3BlcnRpZXM7IH1cbiAgICBnZXQgZGlhZ25vc3RpY3MoKSB7IHJldHVybiB0aGlzLl9kaWFnbm9zdGljczsgfVxuICAgIGdldCBpc09mZigpIHsgcmV0dXJuIHRoaXMuX2lzT2ZmOyB9XG4gICAgZ2V0IGlzT24oKSB7IHJldHVybiAhdGhpcy5pc09mZjsgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChtZXRhZGF0YU9wZW5lcigpKTtcbiAgICAgICAgY29uc3QgZWRpdG9ycyA9IHRoaXMuY3JlYXRlVGV4dEVkaXRvck9ic2VydmFibGUodGhpcy5fc3VwcG9ydGVkRXh0ZW5zaW9ucywgdGhpcy5kaXNwb3NhYmxlKTtcbiAgICAgICAgdGhpcy5fZWRpdG9ycyA9IHdyYXBFZGl0b3JPYnNlcnZhYmxlKGVkaXRvcnMuZmlsdGVyKHggPT4gIXgub21uaXNoYXJwLmNvbmZpZykpO1xuICAgICAgICB0aGlzLl9jb25maWdFZGl0b3JzID0gd3JhcEVkaXRvck9ic2VydmFibGUoZWRpdG9ycy5maWx0ZXIoeCA9PiB4Lm9tbmlzaGFycC5jb25maWcpKTtcbiAgICAgICAgU29sdXRpb25NYW5hZ2VyLnNldHVwQ29udGV4dENhbGxiYWNrID0gZWRpdG9yID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3VuZGVybHlpbmdFZGl0b3JzLnB1c2goZWRpdG9yKTtcbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuY29uZmlnID0gXy5lbmRzV2l0aChlZGl0b3IuZ2V0UGF0aCgpLCBcInByb2plY3QuanNvblwiKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIF8ucHVsbCh0aGlzLl91bmRlcmx5aW5nRWRpdG9ycywgZWRpdG9yKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIF8ucHVsbCh0aGlzLl91bmRlcmx5aW5nRWRpdG9ycywgZWRpdG9yKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfTtcbiAgICAgICAgU29sdXRpb25NYW5hZ2VyLmFjdGl2YXRlKHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChTb2x1dGlvbk1hbmFnZXIuc29sdXRpb25BZ2dyZWdhdGVPYnNlcnZlci5zdGF0ZS5zdWJzY3JpYmUoeiA9PiB0aGlzLl9pc09mZiA9IF8uZXZlcnkoeiwgeCA9PiB4LnZhbHVlID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQgfHwgeC52YWx1ZSA9PT0gRHJpdmVyU3RhdGUuRXJyb3IpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoY3JlYXRlT2JzZXJ2YWJsZShvYnNlcnZlciA9PiB7XG4gICAgICAgICAgICBjb25zdCBkaXMgPSBhdG9tLndvcmtzcGFjZS5vYnNlcnZlQWN0aXZlUGFuZUl0ZW0oKHBhbmUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAocGFuZSAmJiBwYW5lLmdldEdyYW1tYXIgJiYgcGFuZS5nZXRQYXRoICYmIHRoaXMuaXNWYWxpZEdyYW1tYXIocGFuZS5nZXRHcmFtbWFyKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIG9ic2VydmVyLm5leHQocGFuZSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgb2JzZXJ2ZXIubmV4dChudWxsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuICgpID0+IGRpcy5kaXNwb3NlKCk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuY29uY2F0TWFwKChwYW5lKSA9PiB7XG4gICAgICAgICAgICBpZiAoIXBhbmUgfHwgaXNPbW5pc2hhcnBUZXh0RWRpdG9yKHBhbmUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YocGFuZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gd3JhcEVkaXRvck9ic2VydmFibGUoU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKHBhbmUpXG4gICAgICAgICAgICAgICAgLm1hcCh4ID0+IHBhbmUpKTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUodGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy5fZWRpdG9ycy5zdWJzY3JpYmUoZWRpdG9yID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcoXy5kZWJvdW5jZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24udXBkYXRlYnVmZmVyKHt9LCB7IHNpbGVudDogdHJ1ZSB9KSk7XG4gICAgICAgICAgICB9LCAxMDAwKSkpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZFNhdmUoKCkgPT4gdGhpcy5yZXF1ZXN0KGVkaXRvciwgc29sdXRpb24gPT4gc29sdXRpb24udXBkYXRlYnVmZmVyKHsgRnJvbURpc2s6IHRydWUgfSwgeyBzaWxlbnQ6IHRydWUgfSkpKSk7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChjZCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvclN1YmplY3QubmV4dChudWxsKTtcbiAgICAgICAgfSkpO1xuICAgICAgICBjb25zdCBjb21iaW5hdGlvbk9ic2VydmFibGUgPSB0aGlzLmFnZ3JlZ2F0ZUxpc3RlbmVyLm9ic2VydmUoeiA9PiB6Lm1vZGVsLm9ic2VydmUuY29kZWNoZWNrKTtcbiAgICAgICAgbGV0IHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucyA9IG5ldyBSZXBsYXlTdWJqZWN0KDEpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5zaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnNcIiwgZnVuY3Rpb24gKGVuYWJsZWQpIHtcbiAgICAgICAgICAgIHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucy5uZXh0KGVuYWJsZWQpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2hvd0RpYWdub3N0aWNzRm9yQWxsU29sdXRpb25zKTtcbiAgICAgICAgdGhpcy5fZGlhZ25vc3RpY3MgPSBPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QodGhpcy5hY3RpdmVNb2RlbC5zdGFydFdpdGgobnVsbCksIHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucywgc2hvd0RpYWdub3N0aWNzRm9yQWxsU29sdXRpb25zLnNraXAoMSkuc3RhcnRXaXRoKGF0b20uY29uZmlnLmdldChcIm9tbmlzaGFycC1hdG9tLnNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9uc1wiKSksIChtb2RlbCwgZW5hYmxlZCwgd2FzRW5hYmxlZCkgPT4gKHsgbW9kZWwsIGVuYWJsZWQsIHdhc0VuYWJsZWQgfSkpXG4gICAgICAgICAgICAuZmlsdGVyKGN0eCA9PiAoIShjdHguZW5hYmxlZCAmJiBjdHgud2FzRW5hYmxlZCA9PT0gY3R4LmVuYWJsZWQpKSlcbiAgICAgICAgICAgIC5zd2l0Y2hNYXAoY3R4ID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHsgZW5hYmxlZCwgbW9kZWwgfSA9IGN0eDtcbiAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbWJpbmF0aW9uT2JzZXJ2YWJsZVxuICAgICAgICAgICAgICAgICAgICAuZGVib3VuY2VUaW1lKDIwMClcbiAgICAgICAgICAgICAgICAgICAgLm1hcChkYXRhID0+IF8uZmxhdHRlbihkYXRhKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChtb2RlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtb2RlbC5vYnNlcnZlLmNvZGVjaGVjaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKFtdKTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdGFydFdpdGgoW10pXG4gICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICBpZiAoU29sdXRpb25NYW5hZ2VyLl91bml0VGVzdE1vZGVfKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICBTb2x1dGlvbk1hbmFnZXIuZGVhY3RpdmF0ZSgpO1xuICAgIH1cbiAgICBjb25uZWN0KCkgeyBTb2x1dGlvbk1hbmFnZXIuY29ubmVjdCgpOyB9XG4gICAgZGlzY29ubmVjdCgpIHsgU29sdXRpb25NYW5hZ2VyLmRpc2Nvbm5lY3QoKTsgfVxuICAgIHRvZ2dsZSgpIHtcbiAgICAgICAgaWYgKFNvbHV0aW9uTWFuYWdlci5jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIFNvbHV0aW9uTWFuYWdlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBTb2x1dGlvbk1hbmFnZXIuY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIG5hdmlnYXRlVG8ocmVzcG9uc2UpIHtcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbVByb21pc2UoYXRvbS53b3Jrc3BhY2Uub3BlbihyZXNwb25zZS5GaWxlTmFtZSwgeyBpbml0aWFsTGluZTogcmVzcG9uc2UuTGluZSwgaW5pdGlhbENvbHVtbjogcmVzcG9uc2UuQ29sdW1uIH0pKTtcbiAgICB9XG4gICAgZ2V0RnJhbWV3b3Jrcyhwcm9qZWN0cykge1xuICAgICAgICBjb25zdCBmcmFtZXdvcmtzID0gXy5tYXAocHJvamVjdHMsIChwcm9qZWN0KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gcHJvamVjdC5pbmRleE9mKFwiK1wiKSA9PT0gLTEgPyBcIlwiIDogcHJvamVjdC5zcGxpdChcIitcIilbMV07XG4gICAgICAgIH0pLmZpbHRlcigoZncpID0+IGZ3Lmxlbmd0aCA+IDApO1xuICAgICAgICByZXR1cm4gZnJhbWV3b3Jrcy5qb2luKFwiLFwiKTtcbiAgICB9XG4gICAgYWRkVGV4dEVkaXRvckNvbW1hbmQoY29tbWFuZE5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIHJldHVybiBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20tdGV4dC1lZGl0b3JcIiwgY29tbWFuZE5hbWUsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICAgICAgaWYgKCFlZGl0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA7XG4gICAgICAgICAgICBpZiAoXy5zb21lKHRoaXMuX3N1cHBvcnRlZEV4dGVuc2lvbnMsIGV4dCA9PiBfLmVuZHNXaXRoKGVkaXRvci5nZXRQYXRoKCksIGV4dCkpKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgY3JlYXRlVGV4dEVkaXRvck9ic2VydmFibGUoZXh0ZW5zaW9ucywgZGlzcG9zYWJsZSwgY29uZmlnID0gZmFsc2UpIHtcbiAgICAgICAgdGhpcy5fY3JlYXRlU2FmZUd1YXJkKGV4dGVuc2lvbnMsIGRpc3Bvc2FibGUpO1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5tZXJnZShPYnNlcnZhYmxlLmRlZmVyKCgpID0+IE9ic2VydmFibGUuZnJvbSh0aGlzLl91bmRlcmx5aW5nRWRpdG9ycykpLCBjcmVhdGVPYnNlcnZhYmxlKG9ic2VydmVyID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRpcyA9IGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycygoZWRpdG9yKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfLnNvbWUoZXh0ZW5zaW9ucywgZXh0ID0+IF8uZW5kc1dpdGgoZWRpdG9yLmdldFBhdGgoKSwgZXh0KSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFNvbHV0aW9uTWFuYWdlci5nZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3IpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiBvYnNlcnZlci5uZXh0KGVkaXRvcikpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gZWRpdG9yLmdldFBhdGgoKTtcbiAgICAgICAgICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzcG9zZXIgPSBlZGl0b3Iub25EaWRDaGFuZ2VQYXRoKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwb3Nlci5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2IoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiAoKSA9PiBkaXMuZGlzcG9zZSgpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIF9jcmVhdGVTYWZlR3VhcmQoZXh0ZW5zaW9ucywgZGlzcG9zYWJsZSkge1xuICAgICAgICBjb25zdCBlZGl0b3JTdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtKChwYW5lKSA9PiBlZGl0b3JTdWJqZWN0Lm5leHQocGFuZSkpKTtcbiAgICAgICAgY29uc3QgZWRpdG9yT2JzZXJ2YWJsZSA9IGVkaXRvclN1YmplY3QuZmlsdGVyKHogPT4geiAmJiAhIXouZ2V0R3JhbW1hcikuc3RhcnRXaXRoKG51bGwpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChPYnNlcnZhYmxlLnppcChlZGl0b3JPYnNlcnZhYmxlLCBlZGl0b3JPYnNlcnZhYmxlLnNraXAoMSksIChlZGl0b3IsIG5leHRFZGl0b3IpID0+ICh7IGVkaXRvciwgbmV4dEVkaXRvciB9KSlcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoNTApXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGZ1bmN0aW9uICh7IGVkaXRvciwgbmV4dEVkaXRvciB9KSB7XG4gICAgICAgICAgICBjb25zdCBwYXRoID0gbmV4dEVkaXRvci5nZXRQYXRoKCk7XG4gICAgICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgICAgICBpZiAoZWRpdG9yICYmIF8uc29tZShleHRlbnNpb25zLCBleHQgPT4gXy5lbmRzV2l0aChlZGl0b3IuZ2V0UGF0aCgpLCBleHQpKSkge1xuICAgICAgICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhcIk9tbmlTaGFycFwiLCB7IGRldGFpbDogXCJGdW5jdGlvbmFsaXR5IHdpbGwgbGltaXRlZCB1bnRpbCB0aGUgZmlsZSBoYXMgYmVlbiBzYXZlZC5cIiB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZ2V0IGxpc3RlbmVyKCkge1xuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLnNvbHV0aW9uT2JzZXJ2ZXI7XG4gICAgfVxuICAgIGdldCBhZ2dyZWdhdGVMaXN0ZW5lcigpIHtcbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5zb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyO1xuICAgIH1cbiAgICBnZXQgc29sdXRpb25zKCkge1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5kZWZlcigoKSA9PiBPYnNlcnZhYmxlLmZyb20oU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucykpO1xuICAgIH1cbiAgICByZXF1ZXN0KGVkaXRvciwgY2FsbGJhY2spIHtcbiAgICAgICAgaWYgKF8uaXNGdW5jdGlvbihlZGl0b3IpKSB7XG4gICAgICAgICAgICBjYWxsYmFjayA9IGVkaXRvcjtcbiAgICAgICAgICAgIGVkaXRvciA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFlZGl0b3IpIHtcbiAgICAgICAgICAgIGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzb2x1dGlvbkNhbGxiYWNrID0gKHNvbHV0aW9uKSA9PiBjYWxsYmFjayhzb2x1dGlvbi53aXRoRWRpdG9yKGVkaXRvcikpO1xuICAgICAgICBsZXQgcmVzdWx0O1xuICAgICAgICBpZiAoZWRpdG9yICYmIGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBzb2x1dGlvbkNhbGxiYWNrKGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24pXG4gICAgICAgICAgICAgICAgLnNoYXJlKCk7XG4gICAgICAgICAgICByZXN1bHQuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIGxldCBzb2x1dGlvblJlc3VsdDtcbiAgICAgICAgaWYgKGVkaXRvcikge1xuICAgICAgICAgICAgc29sdXRpb25SZXN1bHQgPSBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNvbHV0aW9uUmVzdWx0ID0gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uLnRha2UoMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gc29sdXRpb25SZXN1bHRcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXG4gICAgICAgICAgICAuZmxhdE1hcChzb2x1dGlvbkNhbGxiYWNrKVxuICAgICAgICAgICAgLnNoYXJlKCk7XG4gICAgICAgIHJlc3VsdC5zdWJzY3JpYmUoKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgZ2V0UHJvamVjdChlZGl0b3IpIHtcbiAgICAgICAgaWYgKGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpICYmIGVkaXRvci5vbW5pc2hhcnAucHJvamVjdCkge1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YoZWRpdG9yLm9tbmlzaGFycC5wcm9qZWN0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvcilcbiAgICAgICAgICAgIC5mbGF0TWFwKHogPT4gei5tb2RlbC5nZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcikpXG4gICAgICAgICAgICAudGFrZSgxKTtcbiAgICB9XG4gICAgZ2V0U29sdXRpb25Gb3JQcm9qZWN0KHByb2plY3QpIHtcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YoXyhTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zKVxuICAgICAgICAgICAgLmZpbHRlcihzb2x1dGlvbiA9PiBfLnNvbWUoc29sdXRpb24ubW9kZWwucHJvamVjdHMsIHAgPT4gcC5uYW1lID09PSBwcm9qZWN0Lm5hbWUpKVxuICAgICAgICAgICAgLmZpcnN0KCkpO1xuICAgIH1cbiAgICBnZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3IpIHtcbiAgICAgICAgaWYgKGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvcik7XG4gICAgfVxuICAgIGdldCBhY3RpdmVNb2RlbCgpIHtcbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbi5tYXAoeiA9PiB6Lm1vZGVsKTtcbiAgICB9XG4gICAgc3dpdGNoQWN0aXZlTW9kZWwoY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuYWN0aXZlTW9kZWwuZmlsdGVyKHogPT4gISF6KS5zdWJzY3JpYmUobW9kZWwgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICAgICAgb3V0ZXJDZC5hZGQoY2QpO1xuICAgICAgICAgICAgY2QuYWRkKHRoaXMuYWN0aXZlTW9kZWwuZmlsdGVyKGFjdGl2ZSA9PiBhY3RpdmUgIT09IG1vZGVsKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIG91dGVyQ2QucmVtb3ZlKGNkKTtcbiAgICAgICAgICAgICAgICBjZC5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjYWxsYmFjayhtb2RlbCwgY2QpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHJldHVybiBvdXRlckNkO1xuICAgIH1cbiAgICBnZXQgYWN0aXZlU29sdXRpb24oKSB7XG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb247XG4gICAgfVxuICAgIHN3aXRjaEFjdGl2ZVNvbHV0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IG91dGVyQ2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBvdXRlckNkLmFkZCh0aGlzLmFjdGl2ZVNvbHV0aW9uLmZpbHRlcih6ID0+ICEheikuc3Vic2NyaWJlKHNvbHV0aW9uID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgICAgIG91dGVyQ2QuYWRkKGNkKTtcbiAgICAgICAgICAgIGNkLmFkZCh0aGlzLmFjdGl2ZVNvbHV0aW9uLmZpbHRlcihhY3RpdmUgPT4gYWN0aXZlICE9PSBzb2x1dGlvbilcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBvdXRlckNkLnJlbW92ZShjZCk7XG4gICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY2FsbGJhY2soc29sdXRpb24sIGNkKTtcbiAgICAgICAgfSkpO1xuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcbiAgICB9XG4gICAgZ2V0IGFjdGl2ZUVkaXRvcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZUVkaXRvcjtcbiAgICB9XG4gICAgc3dpdGNoQWN0aXZlRWRpdG9yKGNhbGxiYWNrKSB7XG4gICAgICAgIGNvbnN0IG91dGVyQ2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBvdXRlckNkLmFkZCh0aGlzLmFjdGl2ZUVkaXRvci5maWx0ZXIoeiA9PiAhIXopLnN1YnNjcmliZShlZGl0b3IgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICAgICAgb3V0ZXJDZC5hZGQoY2QpO1xuICAgICAgICAgICAgY2QuYWRkKHRoaXMuYWN0aXZlRWRpdG9yLmZpbHRlcihhY3RpdmUgPT4gYWN0aXZlICE9PSBlZGl0b3IpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgb3V0ZXJDZC5yZW1vdmUoY2QpO1xuICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKGVkaXRvciwgY2QpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHJldHVybiBvdXRlckNkO1xuICAgIH1cbiAgICB3aGVuRWRpdG9yQ29ubmVjdGVkKGVkaXRvcikge1xuICAgICAgICBpZiAoaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikpIHtcbiAgICAgICAgICAgIHJldHVybiBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uXG4gICAgICAgICAgICAgICAgLndoZW5Db25uZWN0ZWQoKVxuICAgICAgICAgICAgICAgIC5tYXAoeiA9PiBlZGl0b3IpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKVxuICAgICAgICAgICAgLmZsYXRNYXAoc29sdXRpb24gPT4gc29sdXRpb24ud2hlbkNvbm5lY3RlZCgpLCAoKSA9PiBlZGl0b3IpO1xuICAgIH1cbiAgICBnZXQgYWN0aXZlQ29uZmlnRWRpdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlQ29uZmlnRWRpdG9yO1xuICAgIH1cbiAgICBzd2l0Y2hBY3RpdmVDb25maWdFZGl0b3IoY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuYWN0aXZlQ29uZmlnRWRpdG9yLmZpbHRlcih6ID0+ICEheikuc3Vic2NyaWJlKGVkaXRvciA9PiB7XG4gICAgICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgICAgICBvdXRlckNkLmFkZChjZCk7XG4gICAgICAgICAgICBjZC5hZGQodGhpcy5hY3RpdmVDb25maWdFZGl0b3IuZmlsdGVyKGFjdGl2ZSA9PiBhY3RpdmUgIT09IGVkaXRvcilcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBvdXRlckNkLnJlbW92ZShjZCk7XG4gICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY2FsbGJhY2soZWRpdG9yLCBjZCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XG4gICAgfVxuICAgIGdldCBhY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yO1xuICAgIH1cbiAgICBzd2l0Y2hBY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvcihjYWxsYmFjaykge1xuICAgICAgICBjb25zdCBvdXRlckNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgb3V0ZXJDZC5hZGQodGhpcy5hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvci5maWx0ZXIoeiA9PiAhIXopLnN1YnNjcmliZShlZGl0b3IgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICAgICAgb3V0ZXJDZC5hZGQoY2QpO1xuICAgICAgICAgICAgY2QuYWRkKHRoaXMuYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3IuZmlsdGVyKGFjdGl2ZSA9PiBhY3RpdmUgIT09IGVkaXRvcilcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBvdXRlckNkLnJlbW92ZShjZCk7XG4gICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY2FsbGJhY2soZWRpdG9yLCBjZCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XG4gICAgfVxuICAgIGdldCBhY3RpdmVQcm9qZWN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlUHJvamVjdDtcbiAgICB9XG4gICAgZ2V0IGFjdGl2ZUZyYW1ld29yaygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZUZyYW1ld29yaztcbiAgICB9XG4gICAgZ2V0IGVkaXRvcnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lZGl0b3JzO1xuICAgIH1cbiAgICBnZXQgY29uZmlnRWRpdG9ycygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbmZpZ0VkaXRvcnM7XG4gICAgfVxuICAgIGVhY2hFZGl0b3IoY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuX2VkaXRvcnMuc3Vic2NyaWJlKGVkaXRvciA9PiB7XG4gICAgICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgICAgICBvdXRlckNkLmFkZChjZCk7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkRGVzdHJveSgoKCkgPT4ge1xuICAgICAgICAgICAgICAgIG91dGVyQ2QucmVtb3ZlKGNkKTtcbiAgICAgICAgICAgICAgICBjZC5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9KSkpO1xuICAgICAgICAgICAgY2FsbGJhY2soZWRpdG9yLCBjZCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XG4gICAgfVxuICAgIGVhY2hDb25maWdFZGl0b3IoY2FsbGJhY2spIHtcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuX2NvbmZpZ0VkaXRvcnMuc3Vic2NyaWJlKGVkaXRvciA9PiB7XG4gICAgICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgICAgICBvdXRlckNkLmFkZChjZCk7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkRGVzdHJveSgoKCkgPT4ge1xuICAgICAgICAgICAgICAgIG91dGVyQ2QucmVtb3ZlKGNkKTtcbiAgICAgICAgICAgICAgICBjZC5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9KSkpO1xuICAgICAgICAgICAgY2FsbGJhY2soZWRpdG9yLCBjZCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XG4gICAgfVxuICAgIHJlZ2lzdGVyQ29uZmlndXJhdGlvbihjYWxsYmFjaykge1xuICAgICAgICBTb2x1dGlvbk1hbmFnZXIucmVnaXN0ZXJDb25maWd1cmF0aW9uKGNhbGxiYWNrKTtcbiAgICB9XG4gICAgZ2V0IF9raWNrX2luX3RoZV9wYW50c18oKSB7XG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuX2tpY2tfaW5fdGhlX3BhbnRzXztcbiAgICB9XG4gICAgZ2V0IGdyYW1tYXJzKCkge1xuICAgICAgICByZXR1cm4gXy5maWx0ZXIoYXRvbS5ncmFtbWFycy5nZXRHcmFtbWFycygpLCBncmFtbWFyID0+IF8uc29tZSh0aGlzLl9zdXBwb3J0ZWRFeHRlbnNpb25zLCBleHQgPT4gXy5zb21lKGdyYW1tYXIuZmlsZVR5cGVzLCBmdCA9PiBfLnRyaW1TdGFydChleHQsIFwiLlwiKSA9PT0gZnQpKSk7XG4gICAgfVxuICAgIGlzVmFsaWRHcmFtbWFyKGdyYW1tYXIpIHtcbiAgICAgICAgcmV0dXJuIF8uc29tZSh0aGlzLmdyYW1tYXJzLCB7IHNjb3BlTmFtZTogZ3JhbW1hci5zY29wZU5hbWUgfSk7XG4gICAgfVxuICAgIGdldCBwYWNrYWdlRGlyKCkge1xuICAgICAgICBpZiAoIXRoaXMuX3BhY2thZ2VEaXIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgZ2V0UGFja2FnZURpclBhdGhzOiAke2F0b20ucGFja2FnZXMuZ2V0UGFja2FnZURpclBhdGhzKCl9YCk7XG4gICAgICAgICAgICB0aGlzLl9wYWNrYWdlRGlyID0gXy5maW5kKGF0b20ucGFja2FnZXMuZ2V0UGFja2FnZURpclBhdGhzKCksIGZ1bmN0aW9uIChwYWNrYWdlUGF0aCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgcGFja2FnZVBhdGggJHtwYWNrYWdlUGF0aH0gZXhpc3RzOiAke2ZzLmV4aXN0c1N5bmMocGF0aC5qb2luKHBhY2thZ2VQYXRoLCBcIm9tbmlzaGFycC1hdG9tXCIpKX1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4ocGFja2FnZVBhdGgsIFwib21uaXNoYXJwLWF0b21cIikpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX3BhY2thZ2VEaXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wYWNrYWdlRGlyID0gcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuLi8uLi8uLlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fcGFja2FnZURpcjtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgT21uaSA9IG5ldyBPbW5pTWFuYWdlcjtcbiIsImltcG9ydCB7T2JzZXJ2YWJsZSwgUmVwbGF5U3ViamVjdCwgU3ViamVjdCwgQmVoYXZpb3JTdWJqZWN0LCBTY2hlZHVsZXJ9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUsIElEaXNwb3NhYmxlLCBjcmVhdGVPYnNlcnZhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHtTb2x1dGlvbk1hbmFnZXJ9IGZyb20gXCIuL3NvbHV0aW9uLW1hbmFnZXJcIjtcbmltcG9ydCB7U29sdXRpb259IGZyb20gXCIuL3NvbHV0aW9uXCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQge0RyaXZlclN0YXRlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHtQcm9qZWN0Vmlld01vZGVsfSBmcm9tIFwiLi9wcm9qZWN0LXZpZXctbW9kZWxcIjtcbmltcG9ydCB7Vmlld01vZGVsfSBmcm9tIFwiLi92aWV3LW1vZGVsXCI7XG5pbXBvcnQgKiBhcyBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7RXh0ZW5kQXBpfSBmcm9tIFwiLi4vb21uaXNoYXJwXCI7XG5pbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7T21uaXNoYXJwVGV4dEVkaXRvciwgaXNPbW5pc2hhcnBUZXh0RWRpdG9yfSBmcm9tIFwiLi9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcbmltcG9ydCB7bWV0YWRhdGFPcGVuZXJ9IGZyb20gXCIuL21ldGFkYXRhLWVkaXRvclwiO1xuXG4vLyBUaW1lIHdlIHdhaXQgdG8gdHJ5IGFuZCBkbyBvdXIgYWN0aXZlIHN3aXRjaCB0YXNrcy5cbmNvbnN0IERFQk9VTkNFX1RJTUVPVVQgPSAxMDA7XG5jb25zdCBzdGF0ZWZ1bFByb3BlcnRpZXMgPSBbXCJpc09mZlwiLCBcImlzQ29ubmVjdGluZ1wiLCBcImlzT25cIiwgXCJpc1JlYWR5XCIsIFwiaXNFcnJvclwiXTtcblxuZnVuY3Rpb24gd3JhcEVkaXRvck9ic2VydmFibGUob2JzZXJ2YWJsZTogT2JzZXJ2YWJsZTxPbW5pc2hhcnBUZXh0RWRpdG9yPikge1xuICAgIHJldHVybiBvYnNlcnZhYmxlXG4gICAgICAgIC5zdWJzY3JpYmVPbihTY2hlZHVsZXIucXVldWUpXG4gICAgICAgIC5vYnNlcnZlT24oU2NoZWR1bGVyLnF1ZXVlKVxuICAgICAgICAuZGVib3VuY2VUaW1lKERFQk9VTkNFX1RJTUVPVVQpXG4gICAgICAgIC5maWx0ZXIoZWRpdG9yID0+ICFlZGl0b3IgfHwgZWRpdG9yICYmICFlZGl0b3IuaXNEZXN0cm95ZWQoKSk7XG59XG5cbmNsYXNzIE9tbmlNYW5hZ2VyIGltcGxlbWVudHMgSURpc3Bvc2FibGUge1xuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcblxuICAgIHByaXZhdGUgX2VkaXRvcnM6IE9ic2VydmFibGU8T21uaXNoYXJwVGV4dEVkaXRvcj47XG4gICAgcHJpdmF0ZSBfY29uZmlnRWRpdG9yczogT2JzZXJ2YWJsZTxPbW5pc2hhcnBUZXh0RWRpdG9yPjtcbiAgICBwcml2YXRlIF91bmRlcmx5aW5nRWRpdG9yczogT21uaXNoYXJwVGV4dEVkaXRvcltdID0gW107XG5cbiAgICBwdWJsaWMgZ2V0IHZpZXdNb2RlbFN0YXRlZnVsUHJvcGVydGllcygpIHsgcmV0dXJuIHN0YXRlZnVsUHJvcGVydGllczsgfVxuXG4gICAgcHJpdmF0ZSBfYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0ID0gbmV3IEJlaGF2aW9yU3ViamVjdDxPbW5pc2hhcnBUZXh0RWRpdG9yPihudWxsKTtcbiAgICBwcml2YXRlIF9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvciA9IHdyYXBFZGl0b3JPYnNlcnZhYmxlKDxPYnNlcnZhYmxlPE9tbmlzaGFycFRleHRFZGl0b3I+Pjxhbnk+dGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0KVxuICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xuXG4gICAgcHJpdmF0ZSBfYWN0aXZlRWRpdG9yID0gd3JhcEVkaXRvck9ic2VydmFibGUoPE9ic2VydmFibGU8T21uaXNoYXJwVGV4dEVkaXRvcj4+PGFueT50aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvclN1YmplY3QpXG4gICAgICAgIC5kZWxheShERUJPVU5DRV9USU1FT1VUKVxuICAgICAgICAubWFwKHggPT4geCAmJiAheC5vbW5pc2hhcnAuY29uZmlnID8geCA6IG51bGwpXG4gICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpLnJlZkNvdW50KCk7XG5cbiAgICBwcml2YXRlIF9hY3RpdmVDb25maWdFZGl0b3IgPSB3cmFwRWRpdG9yT2JzZXJ2YWJsZSg8T2JzZXJ2YWJsZTxPbW5pc2hhcnBUZXh0RWRpdG9yPj48YW55PnRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yU3ViamVjdClcbiAgICAgICAgLmRlbGF5KERFQk9VTkNFX1RJTUVPVVQpXG4gICAgICAgIC5tYXAoeCA9PiB4ICYmIHgub21uaXNoYXJwLmNvbmZpZyA/IHggOiBudWxsKVxuICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xuXG4gICAgcHJpdmF0ZSBfYWN0aXZlUHJvamVjdCA9IHRoaXMuX2FjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yXG4gICAgICAgIC5maWx0ZXIoZWRpdG9yID0+IGVkaXRvciAmJiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpXG4gICAgICAgIC5zd2l0Y2hNYXAoZWRpdG9yID0+IGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24ubW9kZWwuZ2V0UHJvamVjdEZvckVkaXRvcihlZGl0b3IpKVxuICAgICAgICAuZGlzdGluY3RVbnRpbENoYW5nZWQoKVxuICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xuXG4gICAgcHJpdmF0ZSBfYWN0aXZlRnJhbWV3b3JrID0gdGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JcbiAgICAgICAgLmZpbHRlcihlZGl0b3IgPT4gZWRpdG9yICYmICFlZGl0b3IuaXNEZXN0cm95ZWQoKSlcbiAgICAgICAgLnN3aXRjaE1hcChlZGl0b3IgPT4gZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbi5tb2RlbC5nZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcikpXG4gICAgICAgIC5zd2l0Y2hNYXAocHJvamVjdCA9PiBwcm9qZWN0Lm9ic2VydmUuYWN0aXZlRnJhbWV3b3JrLCAocHJvamVjdCwgZnJhbWV3b3JrKSA9PiAoeyBwcm9qZWN0LCBmcmFtZXdvcmsgfSkpXG4gICAgICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCgpXG4gICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpLnJlZkNvdW50KCk7XG5cbiAgICBwcml2YXRlIF9kaWFnbm9zdGljczogT2JzZXJ2YWJsZTxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+O1xuICAgIHB1YmxpYyBnZXQgZGlhZ25vc3RpY3MoKSB7IHJldHVybiB0aGlzLl9kaWFnbm9zdGljczsgfVxuXG4gICAgcHJpdmF0ZSBfaXNPZmYgPSB0cnVlO1xuXG4gICAgcHVibGljIGdldCBpc09mZigpIHsgcmV0dXJuIHRoaXMuX2lzT2ZmOyB9XG4gICAgcHVibGljIGdldCBpc09uKCkgeyByZXR1cm4gIXRoaXMuaXNPZmY7IH1cblxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGU7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQobWV0YWRhdGFPcGVuZXIoKSk7XG5cbiAgICAgICAgY29uc3QgZWRpdG9ycyA9IHRoaXMuY3JlYXRlVGV4dEVkaXRvck9ic2VydmFibGUodGhpcy5fc3VwcG9ydGVkRXh0ZW5zaW9ucywgdGhpcy5kaXNwb3NhYmxlKTtcbiAgICAgICAgdGhpcy5fZWRpdG9ycyA9IHdyYXBFZGl0b3JPYnNlcnZhYmxlKGVkaXRvcnMuZmlsdGVyKHggPT4gIXgub21uaXNoYXJwLmNvbmZpZykpO1xuICAgICAgICB0aGlzLl9jb25maWdFZGl0b3JzID0gd3JhcEVkaXRvck9ic2VydmFibGUoZWRpdG9ycy5maWx0ZXIoeCA9PiB4Lm9tbmlzaGFycC5jb25maWcpKTtcblxuICAgICAgICBTb2x1dGlvbk1hbmFnZXIuc2V0dXBDb250ZXh0Q2FsbGJhY2sgPSBlZGl0b3IgPT4ge1xuICAgICAgICAgICAgdGhpcy5fdW5kZXJseWluZ0VkaXRvcnMucHVzaChlZGl0b3IpO1xuICAgICAgICAgICAgZWRpdG9yLm9tbmlzaGFycC5jb25maWcgPSBfLmVuZHNXaXRoKGVkaXRvci5nZXRQYXRoKCksIFwicHJvamVjdC5qc29uXCIpO1xuXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBfLnB1bGwodGhpcy5fdW5kZXJseWluZ0VkaXRvcnMsIGVkaXRvcik7XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIF8ucHVsbCh0aGlzLl91bmRlcmx5aW5nRWRpdG9ycywgZWRpdG9yKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfTtcblxuICAgICAgICBTb2x1dGlvbk1hbmFnZXIuYWN0aXZhdGUodGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3IpO1xuXG4gICAgICAgIC8vIHdlIGFyZSBvbmx5IG9mZiBpZiBhbGwgb3VyIHNvbHV0aW9ucyBhcmUgZGlzY29ubmN0ZWQgb3IgZXJyb2VkLlxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKFNvbHV0aW9uTWFuYWdlci5zb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyLnN0YXRlLnN1YnNjcmliZSh6ID0+IHRoaXMuX2lzT2ZmID0gXy5ldmVyeSh6LCB4ID0+IHgudmFsdWUgPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZCB8fCB4LnZhbHVlID09PSBEcml2ZXJTdGF0ZS5FcnJvcikpKTtcblxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKFxuICAgICAgICAgICAgY3JlYXRlT2JzZXJ2YWJsZTxBdG9tLlRleHRFZGl0b3I+KG9ic2VydmVyID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXMgPSBhdG9tLndvcmtzcGFjZS5vYnNlcnZlQWN0aXZlUGFuZUl0ZW0oKHBhbmU6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAocGFuZSAmJiBwYW5lLmdldEdyYW1tYXIgJiYgcGFuZS5nZXRQYXRoICYmIHRoaXMuaXNWYWxpZEdyYW1tYXIocGFuZS5nZXRHcmFtbWFyKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvYnNlcnZlci5uZXh0KDxBdG9tLlRleHRFZGl0b3I+cGFuZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgb2JzZXJ2ZXIubmV4dChudWxsKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHJldHVybiAoKSA9PiBkaXMuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY29uY2F0TWFwKChwYW5lKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcGFuZSB8fCBpc09tbmlzaGFycFRleHRFZGl0b3IocGFuZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHBhbmUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3cmFwRWRpdG9yT2JzZXJ2YWJsZShcbiAgICAgICAgICAgICAgICAgICAgICAgIFNvbHV0aW9uTWFuYWdlci5nZXRTb2x1dGlvbkZvckVkaXRvcihwYW5lKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAoeCA9PiA8T21uaXNoYXJwVGV4dEVkaXRvcj5wYW5lKVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSh0aGlzLl9hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvclN1YmplY3QpKTtcblxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMuX2VkaXRvcnMuc3Vic2NyaWJlKGVkaXRvciA9PiB7XG4gICAgICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgICAgICAvLyBUT0RPOiBVcGRhdGUgb25jZSByZW5hbWUvY29kZWFjdGlvbnMgc3VwcG9ydCBvcHRpb25hbCB3b3Jrc3BhY2UgY2hhbmdlc1xuICAgICAgICAgICAgLy9jb25zdCBvbW5pQ2hhbmdlczogeyBvbGRSYW5nZTogVGV4dEJ1ZmZlci5SYW5nZTsgbmV3UmFuZ2U6IFRleHRCdWZmZXIuUmFuZ2U7IG9sZFRleHQ6IHN0cmluZzsgbmV3VGV4dDogc3RyaW5nOyB9W10gPSAoPGFueT5lZGl0b3IpLl9fb21uaUNoYW5nZXNfXyA9IFtdO1xuXG4gICAgICAgICAgICAvKmNkLmFkZChlZGl0b3IuZ2V0QnVmZmVyKCkub25EaWRDaGFuZ2UoKGNoYW5nZTogeyBvbGRSYW5nZTogVGV4dEJ1ZmZlci5SYW5nZTsgbmV3UmFuZ2U6IFRleHRCdWZmZXIuUmFuZ2U7IG9sZFRleHQ6IHN0cmluZzsgbmV3VGV4dDogc3RyaW5nOyB9KSA9PiB7XG4gICAgICAgICAgICAgICAgLy9vbW5pQ2hhbmdlcy5wdXNoKGNoYW5nZSk7XG4gICAgICAgICAgICB9KSk7Ki9cblxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZFN0b3BDaGFuZ2luZyhfLmRlYm91bmNlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAvKmlmIChvbW5pQ2hhbmdlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB9Ki9cbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi51cGRhdGVidWZmZXIoe30sIHsgc2lsZW50OiB0cnVlIH0pKTtcbiAgICAgICAgICAgIH0sIDEwMDApKSk7XG5cbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRTYXZlKCgpID0+IHRoaXMucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLnVwZGF0ZWJ1ZmZlcih7IEZyb21EaXNrOiB0cnVlIH0sIHsgc2lsZW50OiB0cnVlIH0pKSkpO1xuXG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGNkKTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3JTdWJqZWN0Lm5leHQobnVsbCk7XG4gICAgICAgIH0pKTtcblxuICAgICAgICAvLyBDYWNoZSB0aGlzIHJlc3VsdCwgYmVjYXVzZSB0aGUgdW5kZXJseWluZyBpbXBsZW1lbnRhdGlvbiBvZiBvYnNlcnZlIHdpbGxcbiAgICAgICAgLy8gICAgY3JlYXRlIGEgY2FjaGUgb2YgdGhlIGxhc3QgcmVjaWV2ZWQgdmFsdWUuICBUaGlzIGFsbG93cyB1cyB0byBwaWNrIHBpY2tcbiAgICAgICAgLy8gICAgdXAgZnJvbSB3aGVyZSB3ZSBsZWZ0IG9mZi5cbiAgICAgICAgY29uc3QgY29tYmluYXRpb25PYnNlcnZhYmxlID0gdGhpcy5hZ2dyZWdhdGVMaXN0ZW5lci5vYnNlcnZlKHogPT4gei5tb2RlbC5vYnNlcnZlLmNvZGVjaGVjayk7XG5cbiAgICAgICAgbGV0IHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucyA9IG5ldyBSZXBsYXlTdWJqZWN0PGJvb2xlYW4+KDEpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5zaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnNcIiwgZnVuY3Rpb24oZW5hYmxlZCkge1xuICAgICAgICAgICAgc2hvd0RpYWdub3N0aWNzRm9yQWxsU29sdXRpb25zLm5leHQoZW5hYmxlZCk7XG4gICAgICAgIH0pKTtcblxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucyk7XG5cbiAgICAgICAgdGhpcy5fZGlhZ25vc3RpY3MgPSBPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QoIC8vIENvbWJpbmUgYm90aCB0aGUgYWN0aXZlIG1vZGVsIGFuZCB0aGUgY29uZmlndXJhdGlvbiBjaGFuZ2VzIHRvZ2V0aGVyXG4gICAgICAgICAgICB0aGlzLmFjdGl2ZU1vZGVsLnN0YXJ0V2l0aChudWxsKSwgPE9ic2VydmFibGU8Ym9vbGVhbj4+PGFueT5zaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnMsIHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9ucy5za2lwKDEpLnN0YXJ0V2l0aChhdG9tLmNvbmZpZy5nZXQ8Ym9vbGVhbj4oXCJvbW5pc2hhcnAtYXRvbS5zaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnNcIikpLFxuICAgICAgICAgICAgKG1vZGVsLCBlbmFibGVkLCB3YXNFbmFibGVkKSA9PiAoeyBtb2RlbCwgZW5hYmxlZCwgd2FzRW5hYmxlZCB9KSlcbiAgICAgICAgICAgIC8vIElmIHRoZSBzZXR0aW5nIGlzIGVuYWJsZWQgKGFuZCBoYXNuXCJ0IGNoYW5nZWQpIHRoZW4gd2UgZG9uXCJ0IG5lZWQgdG8gcmVkbyB0aGUgc3Vic2NyaXB0aW9uXG4gICAgICAgICAgICAuZmlsdGVyKGN0eCA9PiAoIShjdHguZW5hYmxlZCAmJiBjdHgud2FzRW5hYmxlZCA9PT0gY3R4LmVuYWJsZWQpKSlcbiAgICAgICAgICAgIC5zd2l0Y2hNYXAoY3R4ID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7ZW5hYmxlZCwgbW9kZWx9ID0gY3R4O1xuXG4gICAgICAgICAgICAgICAgaWYgKGVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbWJpbmF0aW9uT2JzZXJ2YWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgLmRlYm91bmNlVGltZSgyMDApXG4gICAgICAgICAgICAgICAgICAgICAgICAubWFwKGRhdGEgPT4gXy5mbGF0dGVuPE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb24+KGRhdGEpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG1vZGVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBtb2RlbC5vYnNlcnZlLmNvZGVjaGVjaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZig8TW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdPltdKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc3RhcnRXaXRoKFtdKVxuICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcbiAgICAgICAgaWYgKFNvbHV0aW9uTWFuYWdlci5fdW5pdFRlc3RNb2RlXykgcmV0dXJuO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICBTb2x1dGlvbk1hbmFnZXIuZGVhY3RpdmF0ZSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjb25uZWN0KCkgeyBTb2x1dGlvbk1hbmFnZXIuY29ubmVjdCgpOyB9XG5cbiAgICBwdWJsaWMgZGlzY29ubmVjdCgpIHsgU29sdXRpb25NYW5hZ2VyLmRpc2Nvbm5lY3QoKTsgfVxuXG4gICAgcHVibGljIHRvZ2dsZSgpIHtcbiAgICAgICAgaWYgKFNvbHV0aW9uTWFuYWdlci5jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIFNvbHV0aW9uTWFuYWdlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBTb2x1dGlvbk1hbmFnZXIuY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIG5hdmlnYXRlVG8ocmVzcG9uc2U6IHsgRmlsZU5hbWU6IHN0cmluZzsgTGluZTogbnVtYmVyOyBDb2x1bW46IG51bWJlcjsgfSkge1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tUHJvbWlzZSg8UHJvbWlzZTxBdG9tLlRleHRFZGl0b3I+Pjxhbnk+YXRvbS53b3Jrc3BhY2Uub3BlbihyZXNwb25zZS5GaWxlTmFtZSwgPGFueT57IGluaXRpYWxMaW5lOiByZXNwb25zZS5MaW5lLCBpbml0aWFsQ29sdW1uOiByZXNwb25zZS5Db2x1bW4gfSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRGcmFtZXdvcmtzKHByb2plY3RzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGZyYW1ld29ya3MgPSBfLm1hcChwcm9qZWN0cywgKHByb2plY3Q6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHByb2plY3QuaW5kZXhPZihcIitcIikgPT09IC0xID8gXCJcIiA6IHByb2plY3Quc3BsaXQoXCIrXCIpWzFdO1xuICAgICAgICB9KS5maWx0ZXIoKGZ3OiBzdHJpbmcpID0+IGZ3Lmxlbmd0aCA+IDApO1xuICAgICAgICByZXR1cm4gZnJhbWV3b3Jrcy5qb2luKFwiLFwiKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkVGV4dEVkaXRvckNvbW1hbmQoY29tbWFuZE5hbWU6IHN0cmluZywgY2FsbGJhY2s6ICguLi5hcmdzOiBhbnlbXSkgPT4gYW55KSB7XG4gICAgICAgIHJldHVybiBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20tdGV4dC1lZGl0b3JcIiwgY29tbWFuZE5hbWUsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICAgICAgaWYgKCFlZGl0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoXy5zb21lKHRoaXMuX3N1cHBvcnRlZEV4dGVuc2lvbnMsIGV4dCA9PiBfLmVuZHNXaXRoKGVkaXRvci5nZXRQYXRoKCksIGV4dCkpKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNyZWF0ZVRleHRFZGl0b3JPYnNlcnZhYmxlKGV4dGVuc2lvbnM6IHN0cmluZ1tdLCBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlLCBjb25maWcgPSBmYWxzZSkge1xuICAgICAgICB0aGlzLl9jcmVhdGVTYWZlR3VhcmQoZXh0ZW5zaW9ucywgZGlzcG9zYWJsZSk7XG5cbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUubWVyZ2U8T21uaXNoYXJwVGV4dEVkaXRvcj4oXG4gICAgICAgICAgICBPYnNlcnZhYmxlLmRlZmVyKCgpID0+IE9ic2VydmFibGUuZnJvbSh0aGlzLl91bmRlcmx5aW5nRWRpdG9ycykpLFxuICAgICAgICAgICAgY3JlYXRlT2JzZXJ2YWJsZTxPbW5pc2hhcnBUZXh0RWRpdG9yPihvYnNlcnZlciA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlzID0gYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKChlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjYiA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfLnNvbWUoZXh0ZW5zaW9ucywgZXh0ID0+IF8uZW5kc1dpdGgoZWRpdG9yLmdldFBhdGgoKSwgZXh0KSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IG9ic2VydmVyLm5leHQoPGFueT5lZGl0b3IpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gZWRpdG9yLmdldFBhdGgoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkaXNwb3NlciA9IGVkaXRvci5vbkRpZENoYW5nZVBhdGgoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNiKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcG9zZXIuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gKCkgPT4gZGlzLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9jcmVhdGVTYWZlR3VhcmQoZXh0ZW5zaW9uczogc3RyaW5nW10sIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGUpIHtcbiAgICAgICAgY29uc3QgZWRpdG9yU3ViamVjdCA9IG5ldyBTdWJqZWN0PE9tbmlzaGFycFRleHRFZGl0b3I+KCk7XG5cbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZUFjdGl2ZVBhbmVJdGVtKChwYW5lOiBhbnkpID0+IGVkaXRvclN1YmplY3QubmV4dChwYW5lKSkpO1xuICAgICAgICBjb25zdCBlZGl0b3JPYnNlcnZhYmxlID0gZWRpdG9yU3ViamVjdC5maWx0ZXIoeiA9PiB6ICYmICEhei5nZXRHcmFtbWFyKS5zdGFydFdpdGgobnVsbCk7XG5cbiAgICAgICAgZGlzcG9zYWJsZS5hZGQoT2JzZXJ2YWJsZS56aXAoZWRpdG9yT2JzZXJ2YWJsZSwgZWRpdG9yT2JzZXJ2YWJsZS5za2lwKDEpLCAoZWRpdG9yLCBuZXh0RWRpdG9yKSA9PiAoeyBlZGl0b3IsIG5leHRFZGl0b3IgfSkpXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDUwKVxuICAgICAgICAgICAgLnN1YnNjcmliZShmdW5jdGlvbih7ZWRpdG9yLCBuZXh0RWRpdG9yfSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhdGggPSBuZXh0RWRpdG9yLmdldFBhdGgoKTtcbiAgICAgICAgICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZWRpdG9yIGlzblwidCBzYXZlZCB5ZXQuXG4gICAgICAgICAgICAgICAgICAgIGlmIChlZGl0b3IgJiYgXy5zb21lKGV4dGVuc2lvbnMsIGV4dCA9PiBfLmVuZHNXaXRoKGVkaXRvci5nZXRQYXRoKCksIGV4dCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhcIk9tbmlTaGFycFwiLCB7IGRldGFpbDogXCJGdW5jdGlvbmFsaXR5IHdpbGwgbGltaXRlZCB1bnRpbCB0aGUgZmlsZSBoYXMgYmVlbiBzYXZlZC5cIiB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIHByb3BlcnR5IGNhbiBiZSB1c2VkIHRvIGxpc3RlbiB0byBhbnkgZXZlbnQgdGhhdCBtaWdodCBjb21lIGFjcm9zcyBvbiBhbnkgc29sdXRpb25zLlxuICAgICAqIFRoaXMgaXMgYSBtb3N0bHkgZnVuY3Rpb25hbCByZXBsYWNlbWVudCBmb3IgYHJlZ2lzdGVyQ29uZmlndXJhdGlvbmAsIHRob3VnaCB0aGVyZSBoYXMgYmVlblxuICAgICAqICAgICBvbmUgcGxhY2Ugd2hlcmUgYHJlZ2lzdGVyQ29uZmlndXJhdGlvbmAgY291bGQgbm90IGJlIHJlcGxhY2VkLlxuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgbGlzdGVuZXIoKSB7XG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuc29sdXRpb25PYnNlcnZlcjtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIHByb3BlcnR5IGNhbiBiZSB1c2VkIHRvIG9ic2VydmUgdG8gdGhlIGFnZ3JlZ2F0ZSBvciBjb21iaW5lZCByZXNwb25zZXMgdG8gYW55IGV2ZW50LlxuICAgICAqIEEgZ29vZCBleGFtcGxlIG9mIHRoaXMgaXMsIGZvciBjb2RlIGNoZWNrIGVycm9ycywgdG8gYWdncmVnYXRlIGFsbCBlcnJvcnMgYWNyb3NzIGFsbCBvcGVuIHNvbHV0aW9ucy5cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IGFnZ3JlZ2F0ZUxpc3RlbmVyKCkge1xuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLnNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXI7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBwcm9wZXJ0eSBnZXRzIGEgbGlzdCBvZiBzb2x1dGlvbnMgYXMgYW4gb2JzZXJ2YWJsZS5cbiAgICAgKiBOT1RFOiBUaGlzIHByb3BlcnR5IHdpbGwgbm90IGVtaXQgYWRkaXRpb25zIG9yIHJlbW92YWxzIG9mIHNvbHV0aW9ucy5cbiAgICAgKi9cbiAgICBwdWJsaWMgZ2V0IHNvbHV0aW9ucygpIHtcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZGVmZXIoKCkgPT4gT2JzZXJ2YWJsZS5mcm9tPFNvbHV0aW9uPihTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zKSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVGhpcyBtZXRob2QgYWxsb3dzIHVzIHRvIGZvcmdldCBhYm91dCB0aGUgZW50aXJlIHNvbHV0aW9uIG1vZGVsLlxuICAgICAqIENhbGwgdGhpcyBtZXRob2Qgd2l0aCBhIHNwZWNpZmljIGVkaXRvciwgb3IganVzdCB3aXRoIGEgY2FsbGJhY2sgdG8gY2FwdHVyZSB0aGUgY3VycmVudCBlZGl0b3JcbiAgICAgKlxuICAgICAqIFRoZSBjYWxsYmFjayB3aWxsIHRoZW4gaXNzdWUgdGhlIHJlcXVlc3RcbiAgICAgKiBOT1RFOiBUaGlzIEFQSSBvbmx5IGV4cG9zZXMgdGhlIG9wZXJhdGlvbiBBcGkgYW5kIGRvZXNuXCJ0IGV4cG9zZSB0aGUgZXZlbnQgYXBpLCBhcyB3ZSBhcmUgcmVxdWVzdGluZyBzb21ldGhpbmcgdG8gaGFwcGVuXG4gICAgICovXG4gICAgcHVibGljIHJlcXVlc3Q8VD4oZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGNhbGxiYWNrOiAoc29sdXRpb246IEV4dGVuZEFwaSkgPT4gT2JzZXJ2YWJsZTxUPik6IE9ic2VydmFibGU8VD47XG4gICAgcHVibGljIHJlcXVlc3Q8VD4oY2FsbGJhY2s6IChzb2x1dGlvbjogRXh0ZW5kQXBpKSA9PiBPYnNlcnZhYmxlPFQ+KTogT2JzZXJ2YWJsZTxUPjtcbiAgICBwdWJsaWMgcmVxdWVzdDxUPihlZGl0b3I6IEF0b20uVGV4dEVkaXRvciB8ICgoc29sdXRpb246IEV4dGVuZEFwaSkgPT4gT2JzZXJ2YWJsZTxUPiB8IFByb21pc2U8VD4pLCBjYWxsYmFjaz86IChzb2x1dGlvbjogRXh0ZW5kQXBpKSA9PiBPYnNlcnZhYmxlPFQ+KTogT2JzZXJ2YWJsZTxUPiB7XG4gICAgICAgIGlmIChfLmlzRnVuY3Rpb24oZWRpdG9yKSkge1xuICAgICAgICAgICAgY2FsbGJhY2sgPSA8YW55PmVkaXRvcjtcbiAgICAgICAgICAgIGVkaXRvciA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWVkaXRvcikge1xuICAgICAgICAgICAgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgc29sdXRpb25DYWxsYmFjayA9IChzb2x1dGlvbjogU29sdXRpb24pID0+IGNhbGxiYWNrKHNvbHV0aW9uLndpdGhFZGl0b3IoPGFueT5lZGl0b3IpKTtcblxuICAgICAgICBsZXQgcmVzdWx0OiBPYnNlcnZhYmxlPFQ+O1xuICAgICAgICBpZiAoZWRpdG9yICYmIGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBzb2x1dGlvbkNhbGxiYWNrKGVkaXRvci5vbW5pc2hhcnAuc29sdXRpb24pXG4gICAgICAgICAgICAgICAgLnNoYXJlKCk7XG4gICAgICAgICAgICByZXN1bHQuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHNvbHV0aW9uUmVzdWx0OiBPYnNlcnZhYmxlPFNvbHV0aW9uPjtcbiAgICAgICAgaWYgKGVkaXRvcikge1xuICAgICAgICAgICAgc29sdXRpb25SZXN1bHQgPSBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IoPEF0b20uVGV4dEVkaXRvcj5lZGl0b3IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc29sdXRpb25SZXN1bHQgPSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb24udGFrZSgxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlc3VsdCA9IHNvbHV0aW9uUmVzdWx0XG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6KVxuICAgICAgICAgICAgLmZsYXRNYXAoc29sdXRpb25DYWxsYmFjaylcbiAgICAgICAgICAgIC5zaGFyZSgpO1xuXG4gICAgICAgIC8vIEVuc3VyZSB0aGF0IHRoZSB1bmRlcnlpbmcgcHJvbWlzZSBpcyBjb25uZWN0ZWRcbiAgICAgICAgLy8gICAoaWYgd2UgZG9uXCJ0IHN1YnNjcmliZSB0byB0aGUgcmV1c2x0IG9mIHRoZSByZXF1ZXN0LCB3aGljaCBpcyBub3QgYSByZXF1aXJlbWVudCkuXG4gICAgICAgIHJlc3VsdC5zdWJzY3JpYmUoKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRQcm9qZWN0KGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XG4gICAgICAgIGlmIChpc09tbmlzaGFycFRleHRFZGl0b3IoZWRpdG9yKSAmJiBlZGl0b3Iub21uaXNoYXJwLnByb2plY3QpIHtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKGVkaXRvci5vbW5pc2hhcnAucHJvamVjdCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmdldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvcilcbiAgICAgICAgICAgIC5mbGF0TWFwKHogPT4gei5tb2RlbC5nZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcikpXG4gICAgICAgICAgICAudGFrZSgxKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0U29sdXRpb25Gb3JQcm9qZWN0KHByb2plY3Q6IFByb2plY3RWaWV3TW9kZWw8YW55Pikge1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihcbiAgICAgICAgICAgIF8oU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9ucylcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHNvbHV0aW9uID0+IF8uc29tZShzb2x1dGlvbi5tb2RlbC5wcm9qZWN0cywgcCA9PiBwLm5hbWUgPT09IHByb2plY3QubmFtZSkpXG4gICAgICAgICAgICAgICAgLmZpcnN0KClcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcbiAgICAgICAgaWYgKGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBbGxvd3MgZm9yIHZpZXdzIHRvIG9ic2VydmUgdGhlIGFjdGl2ZSBtb2RlbCBhcyBpdCBjaGFuZ2VzIGJldHdlZW4gZWRpdG9yc1xuICAgICAqL1xuICAgIHB1YmxpYyBnZXQgYWN0aXZlTW9kZWwoKSB7XG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb24ubWFwKHogPT4gei5tb2RlbCk7XG4gICAgfVxuXG4gICAgcHVibGljIHN3aXRjaEFjdGl2ZU1vZGVsKGNhbGxiYWNrOiAobW9kZWw6IFZpZXdNb2RlbCwgY2Q6IENvbXBvc2l0ZURpc3Bvc2FibGUpID0+IHZvaWQpOiBJRGlzcG9zYWJsZSB7XG4gICAgICAgIGNvbnN0IG91dGVyQ2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBvdXRlckNkLmFkZCh0aGlzLmFjdGl2ZU1vZGVsLmZpbHRlcih6ID0+ICEheikuc3Vic2NyaWJlKG1vZGVsID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgICAgIG91dGVyQ2QuYWRkKGNkKTtcblxuICAgICAgICAgICAgY2QuYWRkKHRoaXMuYWN0aXZlTW9kZWwuZmlsdGVyKGFjdGl2ZSA9PiBhY3RpdmUgIT09IG1vZGVsKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBvdXRlckNkLnJlbW92ZShjZCk7XG4gICAgICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIGNhbGxiYWNrKG1vZGVsLCBjZCk7XG4gICAgICAgIH0pKTtcblxuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGFjdGl2ZVNvbHV0aW9uKCkge1xuICAgICAgICByZXR1cm4gU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uO1xuICAgIH1cblxuICAgIHB1YmxpYyBzd2l0Y2hBY3RpdmVTb2x1dGlvbihjYWxsYmFjazogKHNvbHV0aW9uOiBTb2x1dGlvbiwgY2Q6IENvbXBvc2l0ZURpc3Bvc2FibGUpID0+IHZvaWQpOiBJRGlzcG9zYWJsZSB7XG4gICAgICAgIGNvbnN0IG91dGVyQ2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBvdXRlckNkLmFkZCh0aGlzLmFjdGl2ZVNvbHV0aW9uLmZpbHRlcih6ID0+ICEheikuc3Vic2NyaWJlKHNvbHV0aW9uID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgICAgIG91dGVyQ2QuYWRkKGNkKTtcblxuICAgICAgICAgICAgY2QuYWRkKHRoaXMuYWN0aXZlU29sdXRpb24uZmlsdGVyKGFjdGl2ZSA9PiBhY3RpdmUgIT09IHNvbHV0aW9uKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBvdXRlckNkLnJlbW92ZShjZCk7XG4gICAgICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIGNhbGxiYWNrKHNvbHV0aW9uLCBjZCk7XG4gICAgICAgIH0pKTtcblxuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGFjdGl2ZUVkaXRvcigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZUVkaXRvcjtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3dpdGNoQWN0aXZlRWRpdG9yKGNhbGxiYWNrOiAoZWRpdG9yOiBPbW5pc2hhcnBUZXh0RWRpdG9yLCBjZDogQ29tcG9zaXRlRGlzcG9zYWJsZSkgPT4gdm9pZCk6IElEaXNwb3NhYmxlIHtcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuYWN0aXZlRWRpdG9yLmZpbHRlcih6ID0+ICEheikuc3Vic2NyaWJlKGVkaXRvciA9PiB7XG4gICAgICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgICAgICBvdXRlckNkLmFkZChjZCk7XG5cbiAgICAgICAgICAgIGNkLmFkZCh0aGlzLmFjdGl2ZUVkaXRvci5maWx0ZXIoYWN0aXZlID0+IGFjdGl2ZSAhPT0gZWRpdG9yKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBvdXRlckNkLnJlbW92ZShjZCk7XG4gICAgICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIGNhbGxiYWNrKGVkaXRvciwgY2QpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XG4gICAgfVxuXG4gICAgcHVibGljIHdoZW5FZGl0b3JDb25uZWN0ZWQoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcbiAgICAgICAgaWYgKGlzT21uaXNoYXJwVGV4dEVkaXRvcihlZGl0b3IpKSB7XG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvblxuICAgICAgICAgICAgICAgIC53aGVuQ29ubmVjdGVkKClcbiAgICAgICAgICAgICAgICAubWFwKHogPT4gZWRpdG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKVxuICAgICAgICAgICAgLmZsYXRNYXAoc29sdXRpb24gPT4gc29sdXRpb24ud2hlbkNvbm5lY3RlZCgpLCAoKSA9PiA8T21uaXNoYXJwVGV4dEVkaXRvcj5lZGl0b3IpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgYWN0aXZlQ29uZmlnRWRpdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlQ29uZmlnRWRpdG9yO1xuICAgIH1cblxuICAgIHB1YmxpYyBzd2l0Y2hBY3RpdmVDb25maWdFZGl0b3IoY2FsbGJhY2s6IChlZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3IsIGNkOiBDb21wb3NpdGVEaXNwb3NhYmxlKSA9PiB2b2lkKTogSURpc3Bvc2FibGUge1xuICAgICAgICBjb25zdCBvdXRlckNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgb3V0ZXJDZC5hZGQodGhpcy5hY3RpdmVDb25maWdFZGl0b3IuZmlsdGVyKHogPT4gISF6KS5zdWJzY3JpYmUoZWRpdG9yID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgICAgIG91dGVyQ2QuYWRkKGNkKTtcblxuICAgICAgICAgICAgY2QuYWRkKHRoaXMuYWN0aXZlQ29uZmlnRWRpdG9yLmZpbHRlcihhY3RpdmUgPT4gYWN0aXZlICE9PSBlZGl0b3IpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIG91dGVyQ2QucmVtb3ZlKGNkKTtcbiAgICAgICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgY2FsbGJhY2soZWRpdG9yLCBjZCk7XG4gICAgICAgIH0pKTtcblxuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGFjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3I7XG4gICAgfVxuXG4gICAgcHVibGljIHN3aXRjaEFjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yKGNhbGxiYWNrOiAoZWRpdG9yOiBPbW5pc2hhcnBUZXh0RWRpdG9yLCBjZDogQ29tcG9zaXRlRGlzcG9zYWJsZSkgPT4gdm9pZCk6IElEaXNwb3NhYmxlIHtcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3IuZmlsdGVyKHogPT4gISF6KS5zdWJzY3JpYmUoZWRpdG9yID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgICAgIG91dGVyQ2QuYWRkKGNkKTtcblxuICAgICAgICAgICAgY2QuYWRkKHRoaXMuYWN0aXZlRWRpdG9yT3JDb25maWdFZGl0b3IuZmlsdGVyKGFjdGl2ZSA9PiBhY3RpdmUgIT09IGVkaXRvcilcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgb3V0ZXJDZC5yZW1vdmUoY2QpO1xuICAgICAgICAgICAgICAgICAgICBjZC5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICBjYWxsYmFjayhlZGl0b3IsIGNkKTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHJldHVybiBvdXRlckNkO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgYWN0aXZlUHJvamVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVByb2plY3Q7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBhY3RpdmVGcmFtZXdvcmsoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVGcmFtZXdvcms7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBlZGl0b3JzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZWRpdG9ycztcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGNvbmZpZ0VkaXRvcnMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb25maWdFZGl0b3JzO1xuICAgIH1cblxuICAgIHB1YmxpYyBlYWNoRWRpdG9yKGNhbGxiYWNrOiAoZWRpdG9yOiBPbW5pc2hhcnBUZXh0RWRpdG9yLCBjZDogQ29tcG9zaXRlRGlzcG9zYWJsZSkgPT4gdm9pZCk6IElEaXNwb3NhYmxlIHtcbiAgICAgICAgY29uc3Qgb3V0ZXJDZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIG91dGVyQ2QuYWRkKHRoaXMuX2VkaXRvcnMuc3Vic2NyaWJlKGVkaXRvciA9PiB7XG4gICAgICAgICAgICBjb25zdCBjZCA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgICAgICBvdXRlckNkLmFkZChjZCk7XG5cbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgb3V0ZXJDZC5yZW1vdmUoY2QpO1xuICAgICAgICAgICAgICAgIGNkLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH0pKSk7XG5cbiAgICAgICAgICAgIGNhbGxiYWNrKGVkaXRvciwgY2QpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgcmV0dXJuIG91dGVyQ2Q7XG4gICAgfVxuXG4gICAgcHVibGljIGVhY2hDb25maWdFZGl0b3IoY2FsbGJhY2s6IChlZGl0b3I6IE9tbmlzaGFycFRleHRFZGl0b3IsIGNkOiBDb21wb3NpdGVEaXNwb3NhYmxlKSA9PiB2b2lkKTogSURpc3Bvc2FibGUge1xuICAgICAgICBjb25zdCBvdXRlckNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgb3V0ZXJDZC5hZGQodGhpcy5fY29uZmlnRWRpdG9ycy5zdWJzY3JpYmUoZWRpdG9yID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgICAgIG91dGVyQ2QuYWRkKGNkKTtcblxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZERlc3Ryb3koKCgpID0+IHtcbiAgICAgICAgICAgICAgICBvdXRlckNkLnJlbW92ZShjZCk7XG4gICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfSkpKTtcblxuICAgICAgICAgICAgY2FsbGJhY2soZWRpdG9yLCBjZCk7XG4gICAgICAgIH0pKTtcblxuICAgICAgICByZXR1cm4gb3V0ZXJDZDtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVnaXN0ZXJDb25maWd1cmF0aW9uKGNhbGxiYWNrOiAoc29sdXRpb246IFNvbHV0aW9uKSA9PiB2b2lkKSB7XG4gICAgICAgIFNvbHV0aW9uTWFuYWdlci5yZWdpc3RlckNvbmZpZ3VyYXRpb24oY2FsbGJhY2spO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0IF9raWNrX2luX3RoZV9wYW50c18oKSB7XG4gICAgICAgIHJldHVybiBTb2x1dGlvbk1hbmFnZXIuX2tpY2tfaW5fdGhlX3BhbnRzXztcbiAgICB9XG5cbiAgICBwcml2YXRlIF9zdXBwb3J0ZWRFeHRlbnNpb25zID0gW1wicHJvamVjdC5qc29uXCIsIFwiLmNzXCIsIFwiLmNzeFwiLCAvKlwiLmNha2VcIiovXTtcblxuICAgIHB1YmxpYyBnZXQgZ3JhbW1hcnMoKSB7XG4gICAgICAgIHJldHVybiBfLmZpbHRlcihhdG9tLmdyYW1tYXJzLmdldEdyYW1tYXJzKCksXG4gICAgICAgICAgICBncmFtbWFyID0+IF8uc29tZSh0aGlzLl9zdXBwb3J0ZWRFeHRlbnNpb25zLFxuICAgICAgICAgICAgICAgIGV4dCA9PiBfLnNvbWUoKDxhbnk+Z3JhbW1hcikuZmlsZVR5cGVzLFxuICAgICAgICAgICAgICAgICAgICBmdCA9PiBfLnRyaW1TdGFydChleHQsIFwiLlwiKSA9PT0gZnQpKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGlzVmFsaWRHcmFtbWFyKGdyYW1tYXI6IEZpcnN0TWF0ZS5HcmFtbWFyKSB7XG4gICAgICAgIHJldHVybiBfLnNvbWUodGhpcy5ncmFtbWFycywgeyBzY29wZU5hbWU6IChncmFtbWFyIGFzIGFueSkuc2NvcGVOYW1lIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3BhY2thZ2VEaXI6IHN0cmluZztcbiAgICBwdWJsaWMgZ2V0IHBhY2thZ2VEaXIoKSB7XG4gICAgICAgIGlmICghdGhpcy5fcGFja2FnZURpcikge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKGBnZXRQYWNrYWdlRGlyUGF0aHM6ICR7YXRvbS5wYWNrYWdlcy5nZXRQYWNrYWdlRGlyUGF0aHMoKX1gKTtcbiAgICAgICAgICAgIHRoaXMuX3BhY2thZ2VEaXIgPSBfLmZpbmQoYXRvbS5wYWNrYWdlcy5nZXRQYWNrYWdlRGlyUGF0aHMoKSwgZnVuY3Rpb24ocGFja2FnZVBhdGgpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYHBhY2thZ2VQYXRoICR7cGFja2FnZVBhdGh9IGV4aXN0czogJHtmcy5leGlzdHNTeW5jKHBhdGguam9pbihwYWNrYWdlUGF0aCwgXCJvbW5pc2hhcnAtYXRvbVwiKSl9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKHBhY2thZ2VQYXRoLCBcIm9tbmlzaGFycC1hdG9tXCIpKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBGYWxsYmFjaywgdGhpcyBpcyBmb3IgdW5pdCB0ZXN0aW5nIG9uIHRyYXZpcyBtYWlubHlcbiAgICAgICAgICAgIGlmICghdGhpcy5fcGFja2FnZURpcikge1xuICAgICAgICAgICAgICAgIHRoaXMuX3BhY2thZ2VEaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4uLy4uLy4uXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9wYWNrYWdlRGlyO1xuICAgIH1cbn1cblxuLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xuZXhwb3J0IGNvbnN0IE9tbmkgPSBuZXcgT21uaU1hbmFnZXI7XG4vKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

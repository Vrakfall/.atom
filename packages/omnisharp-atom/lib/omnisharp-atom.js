"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _path = require("path");

var path = _interopRequireWildcard(_path);

var _fs = require("fs");

var fs = _interopRequireWildcard(_fs);

var _omni = require("./server/omni");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var win32 = process.platform === "win32";

var OmniSharpAtom = function () {
    function OmniSharpAtom() {
        _classCallCheck(this, OmniSharpAtom);

        this.config = {
            autoStartOnCompatibleFile: {
                title: "Autostart Omnisharp Roslyn",
                description: "Automatically starts Omnisharp Roslyn when a compatible file is opened.",
                type: "boolean",
                default: true
            },
            developerMode: {
                title: "Developer Mode",
                description: "Outputs detailed server calls in console.log",
                type: "boolean",
                default: false
            },
            showDiagnosticsForAllSolutions: {
                title: "Show Diagnostics for all Solutions",
                description: "Advanced: This will show diagnostics for all open solutions.  NOTE: May take a restart or change to each server to take effect when turned on.",
                type: "boolean",
                default: false
            },
            enableAdvancedFileNew: {
                title: "Enable `Advanced File New`",
                description: "Enable `Advanced File New` when doing ctrl-n/cmd-n within a C# editor.",
                type: "boolean",
                default: false
            },
            useLeftLabelColumnForSuggestions: {
                title: "Use Left-Label column in Suggestions",
                description: "Shows return types in a right-aligned column to the left of the completion suggestion text.",
                type: "boolean",
                default: false
            },
            useIcons: {
                title: "Use unique icons for kind indicators in Suggestions",
                description: "Shows kinds with unique icons rather than autocomplete default styles.",
                type: "boolean",
                default: true
            },
            autoAdjustTreeView: {
                title: "Adjust the tree view to match the solution root.",
                descrption: "This will automatically adjust the treeview to be the root of the solution.",
                type: "boolean",
                default: false
            },
            nagAdjustTreeView: {
                title: "Show the notifications to Adjust the tree view",
                type: "boolean",
                default: true
            },
            autoAddExternalProjects: {
                title: "Add external projects to the tree view.",
                descrption: "This will automatically add external sources to the tree view.\n External sources are any projects that are loaded outside of the solution root.",
                type: "boolean",
                default: false
            },
            nagAddExternalProjects: {
                title: "Show the notifications to add or remove external projects",
                type: "boolean",
                default: true
            },
            hideLinterInterface: {
                title: "Hide the linter interface when using omnisharp-atom editors",
                type: "boolean",
                default: true
            },
            wantMetadata: {
                title: "Request metadata definition with Goto Definition",
                descrption: "Request symbol metadata from the server, when using go-to-definition.  This is disabled by default on Linux, due to issues with Roslyn on Mono.",
                type: "boolean",
                default: win32
            },
            altGotoDefinition: {
                title: "Alt Go To Definition",
                descrption: "Use the alt key instead of the ctrl/cmd key for goto defintion mouse over.",
                type: "boolean",
                default: false
            },
            showHiddenDiagnostics: {
                title: "Show 'Hidden' diagnostics in the linter",
                descrption: "Show or hide hidden diagnostics in the linter, this does not affect greying out of namespaces that are unused.",
                type: "boolean",
                default: true
            }
        };
    }

    _createClass(OmniSharpAtom, [{
        key: "activate",
        value: function activate(state) {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this._started = new _rxjs.AsyncSubject();
            this._activated = new _rxjs.AsyncSubject();
            this.configureKeybindings();
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:toggle", function () {
                return _this.toggle();
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:fix-usings", function () {
                return _omni.Omni.request(function (solution) {
                    return solution.fixusings({});
                });
            }));
            this.disposable.add(atom.commands.add("atom-workspace", "omnisharp-atom:settings", function () {
                return atom.workspace.open("atom://config/packages").then(function (tab) {
                    if (tab && tab.getURI && tab.getURI() !== "atom://config/packages/omnisharp-atom") {
                        atom.workspace.open("atom://config/packages/omnisharp-atom");
                    }
                });
            }));
            var grammars = atom.grammars;
            var grammarCb = function grammarCb(grammar) {
                if (_lodash2.default.find(_omni.Omni.grammars, function (gmr) {
                    return gmr.scopeName === grammar.scopeName;
                })) {
                    atom.grammars.startIdForScope(grammar.scopeName);
                    var omnisharpScopeName = grammar.scopeName + ".omnisharp";
                    var scopeId = grammars.idsByScope[grammar.scopeName];
                    grammars.idsByScope[omnisharpScopeName] = scopeId;
                    grammars.scopesById[scopeId] = omnisharpScopeName;
                    grammar.scopeName = omnisharpScopeName;
                }
            };
            _lodash2.default.each(grammars.grammars, grammarCb);
            this.disposable.add(atom.grammars.onDidAddGrammar(grammarCb));
            require("atom-package-deps").install("omnisharp-atom").then(function () {
                console.info("Activating omnisharp-atom solution tracking...");
                _omni.Omni.activate();
                _this.disposable.add(_omni.Omni);
                _this._started.next(true);
                _this._started.complete();
            }).then(function () {
                return _this.loadFeatures(_this.getFeatures("atom").delay(_omni.Omni["_kick_in_the_pants_"] ? 0 : 2000)).toPromise();
            }).then(function () {
                var startingObservable = _omni.Omni.activeSolution.filter(function (z) {
                    return !!z;
                }).take(1);
                if (_omni.Omni["_kick_in_the_pants_"]) {
                    startingObservable = _rxjs.Observable.of(null);
                }
                _this.disposable.add(startingObservable.flatMap(function () {
                    return _this.loadFeatures(_this.getFeatures("features"));
                }).subscribe({ complete: function complete() {
                        _this.disposable.add(atom.workspace.observeTextEditors(function (editor) {
                            _this.detectAutoToggleGrammar(editor);
                        }));
                        _this._activated.next(true);
                        _this._activated.complete();
                    } }));
            });
        }
    }, {
        key: "getFeatures",
        value: function getFeatures(folder) {
            var _this2 = this;

            var whiteList = atom.config.get("omnisharp-atom:feature-white-list");
            var featureList = atom.config.get("omnisharp-atom:feature-list");
            var whiteListUndefined = typeof whiteList === "undefined";
            console.info("Getting features for \"" + folder + "\"...");
            var packageDir = _omni.Omni.packageDir;
            var featureDir = packageDir + "/omnisharp-atom/lib/" + folder;
            function loadFeature(file) {
                var result = require("./" + folder + "/" + file);
                console.info("Loading feature \"" + folder + "/" + file + "\"...");
                return result;
            }
            return _rxjs.Observable.bindNodeCallback(fs.readdir)(featureDir).flatMap(function (files) {
                return files;
            }).filter(function (file) {
                return (/\.js$/.test(file)
                );
            }).flatMap(function (file) {
                return _rxjs.Observable.bindNodeCallback(fs.stat)(featureDir + "/" + file);
            }, function (file, stat) {
                return { file: file, stat: stat };
            }).filter(function (z) {
                return !z.stat.isDirectory();
            }).map(function (z) {
                return {
                    file: (folder + "/" + path.basename(z.file)).replace(/\.js$/, ""),
                    load: function load() {
                        var feature = loadFeature(z.file);
                        var features = [];
                        _lodash2.default.each(feature, function (value, key) {
                            if (!_lodash2.default.isFunction(value)) {
                                if (!value.required) {
                                    _this2.config[key] = {
                                        title: "" + value.title,
                                        description: value.description,
                                        type: "boolean",
                                        default: _lodash2.default.has(value, "default") ? value.default : true
                                    };
                                }
                                features.push({
                                    key: key, activate: function activate() {
                                        return _this2.activateFeature(whiteListUndefined, key, value);
                                    }
                                });
                            }
                        });
                        return _rxjs.Observable.from(features);
                    }
                };
            }).filter(function (l) {
                if (typeof whiteList === "undefined") {
                    return true;
                }
                if (whiteList) {
                    return _lodash2.default.includes(featureList, l.file);
                } else {
                    return !_lodash2.default.includes(featureList, l.file);
                }
            });
        }
    }, {
        key: "loadFeatures",
        value: function loadFeatures(features) {
            var _this3 = this;

            return features.concatMap(function (z) {
                return z.load();
            }).toArray().concatMap(function (x) {
                return x;
            }).map(function (f) {
                return f.activate();
            }).filter(function (x) {
                return !!x;
            }).toArray().do({ complete: function complete() {
                    atom.config.setSchema("omnisharp-atom", {
                        type: "object",
                        properties: _this3.config
                    });
                } }).concatMap(function (x) {
                return x;
            }).do(function (x) {
                return x();
            });
        }
    }, {
        key: "activateFeature",
        value: function activateFeature(whiteListUndefined, key, value) {
            var _this4 = this;

            var result = null;
            var firstRun = true;
            if (whiteListUndefined && _lodash2.default.has(this.config, key)) {
                (function () {
                    var configKey = "omnisharp-atom." + key;
                    var enableDisposable = void 0,
                        disableDisposable = void 0;
                    _this4.disposable.add(atom.config.observe(configKey, function (enabled) {
                        if (!enabled) {
                            if (disableDisposable) {
                                disableDisposable.dispose();
                                _this4.disposable.remove(disableDisposable);
                                disableDisposable = null;
                            }
                            try {
                                value.dispose();
                            } catch (ex) {}
                            enableDisposable = atom.commands.add("atom-workspace", "omnisharp-feature:enable-" + _lodash2.default.kebabCase(key), function () {
                                return atom.config.set(configKey, true);
                            });
                            _this4.disposable.add(enableDisposable);
                        } else {
                            if (enableDisposable) {
                                enableDisposable.dispose();
                                _this4.disposable.remove(disableDisposable);
                                enableDisposable = null;
                            }
                            console.info("Activating feature \"" + key + "\"...");
                            value.activate();
                            if (_lodash2.default.isFunction(value["attach"])) {
                                if (firstRun) {
                                    result = function result() {
                                        console.info("Attaching feature \"" + key + "\"...");
                                        value["attach"]();
                                    };
                                } else {
                                    console.info("Attaching feature \"" + key + "\"...");
                                    value["attach"]();
                                }
                            }
                            disableDisposable = atom.commands.add("atom-workspace", "omnisharp-feature:disable-" + _lodash2.default.kebabCase(key), function () {
                                return atom.config.set(configKey, false);
                            });
                            _this4.disposable.add(disableDisposable);
                        }
                        firstRun = false;
                    }));
                    _this4.disposable.add(atom.commands.add("atom-workspace", "omnisharp-feature:toggle-" + _lodash2.default.kebabCase(key), function () {
                        return atom.config.set(configKey, !atom.config.get(configKey));
                    }));
                })();
            } else {
                value.activate();
                if (_lodash2.default.isFunction(value["attach"])) {
                    result = function result() {
                        console.info("Attaching feature \"" + key + "\"...");
                        value["attach"]();
                    };
                }
            }
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
                try {
                    value.dispose();
                } catch (ex) {}
            }));
            return result;
        }
    }, {
        key: "detectAutoToggleGrammar",
        value: function detectAutoToggleGrammar(editor) {
            var _this5 = this;

            var grammar = editor.getGrammar();
            this.detectGrammar(editor, grammar);
            this.disposable.add(editor.onDidChangeGrammar(function (gmr) {
                return _this5.detectGrammar(editor, gmr);
            }));
        }
    }, {
        key: "detectGrammar",
        value: function detectGrammar(editor, grammar) {
            if (!atom.config.get("omnisharp-atom.autoStartOnCompatibleFile")) {
                return;
            }
            if (_omni.Omni.isValidGrammar(grammar)) {
                if (_omni.Omni.isOff) {
                    this.toggle();
                }
            } else if (grammar.name === "JSON") {
                if (path.basename(editor.getPath()) === "project.json") {
                    if (_omni.Omni.isOff) {
                        this.toggle();
                    }
                }
            }
        }
    }, {
        key: "toggle",
        value: function toggle() {
            if (_omni.Omni.isOff) {
                _omni.Omni.connect();
            } else if (_omni.Omni.isOn) {
                _omni.Omni.disconnect();
            }
        }
    }, {
        key: "deactivate",
        value: function deactivate() {
            this.disposable.dispose();
        }
    }, {
        key: "consumeStatusBar",
        value: function consumeStatusBar(statusBar) {
            var f = require("./atom/status-bar");
            f.statusBar.setup(statusBar);
            f = require("./atom/framework-selector");
            f.frameworkSelector.setup(statusBar);
            f = require("./atom/feature-buttons");
            f.featureEditorButtons.setup(statusBar);
        }
    }, {
        key: "consumeYeomanEnvironment",
        value: function consumeYeomanEnvironment(generatorService) {
            var _require = require("./atom/generator-aspnet");

            var generatorAspnet = _require.generatorAspnet;

            generatorAspnet.setup(generatorService);
        }
    }, {
        key: "provideAutocomplete",
        value: function provideAutocomplete() {
            return require("./services/completion-provider");
        }
    }, {
        key: "provideLinter",
        value: function provideLinter() {
            var LinterProvider = require("./services/linter-provider");
            return LinterProvider.provider;
        }
    }, {
        key: "provideProjectJson",
        value: function provideProjectJson() {
            return require("./services/project-provider").concat(require("./services/framework-provider"));
        }
    }, {
        key: "consumeLinter",
        value: function consumeLinter(linter) {
            var LinterProvider = require("./services/linter-provider");
            var linters = LinterProvider.provider;
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
                _lodash2.default.each(linters, function (l) {
                    linter.deleteLinter(l);
                });
            }));
            this.disposable.add(LinterProvider.init(linter));
        }
    }, {
        key: "configureKeybindings",
        value: function configureKeybindings() {
            var disposable = void 0;
            var omnisharpAdvancedFileNew = _omni.Omni.packageDir + "/omnisharp-atom/keymaps/omnisharp-file-new.cson";
            this.disposable.add(atom.config.observe("omnisharp-atom.enableAdvancedFileNew", function (enabled) {
                if (enabled) {
                    disposable = atom.keymaps.loadKeymap(omnisharpAdvancedFileNew);
                } else {
                    if (disposable) disposable.dispose();
                    atom.keymaps.removeBindingsFromSource(omnisharpAdvancedFileNew);
                }
            }));
        }
    }]);

    return OmniSharpAtom;
}();

module.exports = new OmniSharpAtom();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9vbW5pc2hhcnAtYXRvbS5qcyIsImxpYi9vbW5pc2hhcnAtYXRvbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7QUFDQTs7SUNBWSxJOztBRENaOztJQ0FZLEU7O0FEQ1o7Ozs7Ozs7O0FDR0EsSUFBTSxRQUFRLFFBQVEsUUFBUixLQUFxQixPQUFuQzs7SUFFQSxhO0FBQUEsNkJBQUE7QUFBQTs7QUF3VFcsYUFBQSxNQUFBLEdBQVM7QUFDWix1Q0FBMkI7QUFDdkIsdUJBQU8sNEJBRGdCO0FBRXZCLDZCQUFhLHlFQUZVO0FBR3ZCLHNCQUFNLFNBSGlCO0FBSXZCLHlCQUFTO0FBSmMsYUFEZjtBQU9aLDJCQUFlO0FBQ1gsdUJBQU8sZ0JBREk7QUFFWCw2QkFBYSw4Q0FGRjtBQUdYLHNCQUFNLFNBSEs7QUFJWCx5QkFBUztBQUpFLGFBUEg7QUFhWiw0Q0FBZ0M7QUFDNUIsdUJBQU8sb0NBRHFCO0FBRTVCLDZCQUFhLGdKQUZlO0FBRzVCLHNCQUFNLFNBSHNCO0FBSTVCLHlCQUFTO0FBSm1CLGFBYnBCO0FBbUJaLG1DQUF1QjtBQUNuQix1QkFBTyw0QkFEWTtBQUVuQiw2QkFBYSx3RUFGTTtBQUduQixzQkFBTSxTQUhhO0FBSW5CLHlCQUFTO0FBSlUsYUFuQlg7QUF5QlosOENBQWtDO0FBQzlCLHVCQUFPLHNDQUR1QjtBQUU5Qiw2QkFBYSw2RkFGaUI7QUFHOUIsc0JBQU0sU0FId0I7QUFJOUIseUJBQVM7QUFKcUIsYUF6QnRCO0FBK0JaLHNCQUFVO0FBQ04sdUJBQU8scURBREQ7QUFFTiw2QkFBYSx3RUFGUDtBQUdOLHNCQUFNLFNBSEE7QUFJTix5QkFBUztBQUpILGFBL0JFO0FBcUNaLGdDQUFvQjtBQUNoQix1QkFBTyxrREFEUztBQUVoQiw0QkFBWSw2RUFGSTtBQUdoQixzQkFBTSxTQUhVO0FBSWhCLHlCQUFTO0FBSk8sYUFyQ1I7QUEyQ1osK0JBQW1CO0FBQ2YsdUJBQU8sZ0RBRFE7QUFFZixzQkFBTSxTQUZTO0FBR2YseUJBQVM7QUFITSxhQTNDUDtBQWdEWixxQ0FBeUI7QUFDckIsdUJBQU8seUNBRGM7QUFFckIsNEJBQVksa0pBRlM7QUFHckIsc0JBQU0sU0FIZTtBQUlyQix5QkFBUztBQUpZLGFBaERiO0FBc0RaLG9DQUF3QjtBQUNwQix1QkFBTywyREFEYTtBQUVwQixzQkFBTSxTQUZjO0FBR3BCLHlCQUFTO0FBSFcsYUF0RFo7QUEyRFosaUNBQXFCO0FBQ2pCLHVCQUFPLDZEQURVO0FBRWpCLHNCQUFNLFNBRlc7QUFHakIseUJBQVM7QUFIUSxhQTNEVDtBQWdFWiwwQkFBYztBQUNWLHVCQUFPLGtEQURHO0FBRVYsNEJBQVksaUpBRkY7QUFHVixzQkFBTSxTQUhJO0FBSVYseUJBQVM7QUFKQyxhQWhFRjtBQXNFWiwrQkFBbUI7QUFDZix1QkFBTyxzQkFEUTtBQUVmLDRCQUFZLDRFQUZHO0FBR2Ysc0JBQU0sU0FIUztBQUlmLHlCQUFTO0FBSk0sYUF0RVA7QUE0RVosbUNBQXVCO0FBQ25CLHVCQUFPLHlDQURZO0FBRW5CLDRCQUFZLGdIQUZPO0FBR25CLHNCQUFNLFNBSGE7QUFJbkIseUJBQVM7QUFKVTtBQTVFWCxTQUFUO0FBbUZWOzs7O2lDQXJZbUIsSyxFQUFVO0FBQUE7O0FBQ3RCLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCO0FBQ0EsaUJBQUssUUFBTCxHQUFnQix3QkFBaEI7QUFDQSxpQkFBSyxVQUFMLEdBQWtCLHdCQUFsQjtBQUVBLGlCQUFLLG9CQUFMO0FBRUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQyx1QkFBcEMsRUFBNkQ7QUFBQSx1QkFBTSxNQUFLLE1BQUwsRUFBTjtBQUFBLGFBQTdELENBQXBCO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQywyQkFBcEMsRUFBaUU7QUFBQSx1QkFBTSxXQUFLLE9BQUwsQ0FBYTtBQUFBLDJCQUFZLFNBQVMsU0FBVCxDQUFtQixFQUFuQixDQUFaO0FBQUEsaUJBQWIsQ0FBTjtBQUFBLGFBQWpFLENBQXBCO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQWtCLGdCQUFsQixFQUFvQyx5QkFBcEMsRUFBK0Q7QUFBQSx1QkFBTSxLQUFLLFNBQUwsQ0FBZSxJQUFmLENBQW9CLHdCQUFwQixFQUNwRixJQURvRixDQUMvRSxlQUFHO0FBQ0wsd0JBQUksT0FBTyxJQUFJLE1BQVgsSUFBcUIsSUFBSSxNQUFKLE9BQWlCLHVDQUExQyxFQUFtRjtBQUMvRSw2QkFBSyxTQUFMLENBQWUsSUFBZixDQUFvQix1Q0FBcEI7QUFDSDtBQUNKLGlCQUxvRixDQUFOO0FBQUEsYUFBL0QsQ0FBcEI7QUFPQSxnQkFBTSxXQUFpQixLQUFLLFFBQTVCO0FBQ0EsZ0JBQU0sWUFBWSxTQUFaLFNBQVksQ0FBQyxPQUFELEVBQWdDO0FBQzlDLG9CQUFJLGlCQUFFLElBQUYsQ0FBTyxXQUFLLFFBQVosRUFBc0IsVUFBQyxHQUFEO0FBQUEsMkJBQWMsSUFBSSxTQUFKLEtBQWtCLFFBQVEsU0FBeEM7QUFBQSxpQkFBdEIsQ0FBSixFQUE4RTtBQUUxRSx5QkFBSyxRQUFMLENBQWMsZUFBZCxDQUE4QixRQUFRLFNBQXRDO0FBRUEsd0JBQU0scUJBQXdCLFFBQVEsU0FBaEMsZUFBTjtBQUNBLHdCQUFNLFVBQVUsU0FBUyxVQUFULENBQW9CLFFBQVEsU0FBNUIsQ0FBaEI7QUFDQSw2QkFBUyxVQUFULENBQW9CLGtCQUFwQixJQUEwQyxPQUExQztBQUNBLDZCQUFTLFVBQVQsQ0FBb0IsT0FBcEIsSUFBK0Isa0JBQS9CO0FBQ0EsNEJBQVEsU0FBUixHQUFvQixrQkFBcEI7QUFDSDtBQUNKLGFBWEQ7QUFZQSw2QkFBRSxJQUFGLENBQU8sU0FBUyxRQUFoQixFQUEwQixTQUExQjtBQUNBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxRQUFMLENBQWMsZUFBZCxDQUE4QixTQUE5QixDQUFwQjtBQUVBLG9CQUFRLG1CQUFSLEVBQTZCLE9BQTdCLENBQXFDLGdCQUFyQyxFQUNLLElBREwsQ0FDVSxZQUFBO0FBQ0Ysd0JBQVEsSUFBUixDQUFhLGdEQUFiO0FBQ0EsMkJBQUssUUFBTDtBQUNBLHNCQUFLLFVBQUwsQ0FBZ0IsR0FBaEI7QUFFQSxzQkFBSyxRQUFMLENBQWMsSUFBZCxDQUFtQixJQUFuQjtBQUNBLHNCQUFLLFFBQUwsQ0FBYyxRQUFkO0FBQ0gsYUFSTCxFQVVLLElBVkwsQ0FVVTtBQUFBLHVCQUFNLE1BQUssWUFBTCxDQUFrQixNQUFLLFdBQUwsQ0FBaUIsTUFBakIsRUFBeUIsS0FBekIsQ0FBK0IsV0FBSyxxQkFBTCxJQUE4QixDQUE5QixHQUFrQyxJQUFqRSxDQUFsQixFQUEwRixTQUExRixFQUFOO0FBQUEsYUFWVixFQVlLLElBWkwsQ0FZVSxZQUFBO0FBQ0Ysb0JBQUkscUJBQXFCLFdBQUssY0FBTCxDQUNwQixNQURvQixDQUNiO0FBQUEsMkJBQUssQ0FBQyxDQUFDLENBQVA7QUFBQSxpQkFEYSxFQUVwQixJQUZvQixDQUVmLENBRmUsQ0FBekI7QUFLQSxvQkFBSSxXQUFLLHFCQUFMLENBQUosRUFBaUM7QUFDN0IseUNBQXFCLGlCQUFXLEVBQVgsQ0FBYyxJQUFkLENBQXJCO0FBQ0g7QUFJRCxzQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLG1CQUNmLE9BRGUsQ0FDUDtBQUFBLDJCQUFNLE1BQUssWUFBTCxDQUFrQixNQUFLLFdBQUwsQ0FBaUIsVUFBakIsQ0FBbEIsQ0FBTjtBQUFBLGlCQURPLEVBRWYsU0FGZSxDQUVMLEVBQUUsVUFBVSxvQkFBQTtBQUNuQiw4QkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssU0FBTCxDQUFlLGtCQUFmLENBQWtDLFVBQUMsTUFBRCxFQUF3QjtBQUMxRSxrQ0FBSyx1QkFBTCxDQUE2QixNQUE3QjtBQUNILHlCQUZtQixDQUFwQjtBQUlBLDhCQUFLLFVBQUwsQ0FBZ0IsSUFBaEIsQ0FBcUIsSUFBckI7QUFDQSw4QkFBSyxVQUFMLENBQWdCLFFBQWhCO0FBQ0gscUJBUFUsRUFGSyxDQUFwQjtBQVdILGFBbkNMO0FBb0NIOzs7b0NBRWtCLE0sRUFBYztBQUFBOztBQUM3QixnQkFBTSxZQUFZLEtBQUssTUFBTCxDQUFZLEdBQVosQ0FBeUIsbUNBQXpCLENBQWxCO0FBQ0EsZ0JBQU0sY0FBYyxLQUFLLE1BQUwsQ0FBWSxHQUFaLENBQTBCLDZCQUExQixDQUFwQjtBQUNBLGdCQUFNLHFCQUFzQixPQUFPLFNBQVAsS0FBcUIsV0FBakQ7QUFFQSxvQkFBUSxJQUFSLDZCQUFzQyxNQUF0QztBQUVBLGdCQUFNLGFBQWEsV0FBSyxVQUF4QjtBQUNBLGdCQUFNLGFBQWdCLFVBQWhCLDRCQUFpRCxNQUF2RDtBQUVBLHFCQUFBLFdBQUEsQ0FBcUIsSUFBckIsRUFBaUM7QUFDN0Isb0JBQU0sU0FBUyxlQUFhLE1BQWIsU0FBdUIsSUFBdkIsQ0FBZjtBQUNBLHdCQUFRLElBQVIsd0JBQWlDLE1BQWpDLFNBQTJDLElBQTNDO0FBQ0EsdUJBQU8sTUFBUDtBQUNIO0FBRUQsbUJBQU8saUJBQVcsZ0JBQVgsQ0FBNEIsR0FBRyxPQUEvQixFQUF3QyxVQUF4QyxFQUNGLE9BREUsQ0FDTTtBQUFBLHVCQUFTLEtBQVQ7QUFBQSxhQUROLEVBRUYsTUFGRSxDQUVLO0FBQUEsdUJBQVEsU0FBUSxJQUFSLENBQWEsSUFBYjtBQUFSO0FBQUEsYUFGTCxFQUdGLE9BSEUsQ0FHTTtBQUFBLHVCQUFRLGlCQUFXLGdCQUFYLENBQTRCLEdBQUcsSUFBL0IsRUFBd0MsVUFBeEMsU0FBc0QsSUFBdEQsQ0FBUjtBQUFBLGFBSE4sRUFHNkUsVUFBQyxJQUFELEVBQU8sSUFBUDtBQUFBLHVCQUFpQixFQUFFLFVBQUYsRUFBUSxVQUFSLEVBQWpCO0FBQUEsYUFIN0UsRUFJRixNQUpFLENBSUs7QUFBQSx1QkFBSyxDQUFDLEVBQUUsSUFBRixDQUFPLFdBQVAsRUFBTjtBQUFBLGFBSkwsRUFLRixHQUxFLENBS0U7QUFBQSx1QkFBTTtBQUNQLDBCQUFNLENBQUcsTUFBSCxTQUFhLEtBQUssUUFBTCxDQUFjLEVBQUUsSUFBaEIsQ0FBYixFQUFxQyxPQUFyQyxDQUE2QyxPQUE3QyxFQUFzRCxFQUF0RCxDQURDO0FBRVAsMEJBQU0sZ0JBQUE7QUFDRiw0QkFBTSxVQUFVLFlBQVksRUFBRSxJQUFkLENBQWhCO0FBRUEsNEJBQU0sV0FBMEQsRUFBaEU7QUFDQSx5Q0FBRSxJQUFGLENBQU8sT0FBUCxFQUFnQixVQUFDLEtBQUQsRUFBa0IsR0FBbEIsRUFBNkI7QUFDekMsZ0NBQUksQ0FBQyxpQkFBRSxVQUFGLENBQWEsS0FBYixDQUFMLEVBQTBCO0FBQ3RCLG9DQUFJLENBQUMsTUFBTSxRQUFYLEVBQXFCO0FBQ2pCLDJDQUFLLE1BQUwsQ0FBWSxHQUFaLElBQW1CO0FBQ2Ysb0RBQVUsTUFBTSxLQUREO0FBRWYscURBQWEsTUFBTSxXQUZKO0FBR2YsOENBQU0sU0FIUztBQUlmLGlEQUFVLGlCQUFFLEdBQUYsQ0FBTSxLQUFOLEVBQWEsU0FBYixJQUEwQixNQUFNLE9BQWhDLEdBQTBDO0FBSnJDLHFDQUFuQjtBQU1IO0FBRUQseUNBQVMsSUFBVCxDQUFjO0FBQ1YsNENBRFUsRUFDTCxVQUFVLG9CQUFBO0FBQ1gsK0NBQU8sT0FBSyxlQUFMLENBQXFCLGtCQUFyQixFQUF5QyxHQUF6QyxFQUE4QyxLQUE5QyxDQUFQO0FBQ0g7QUFIUyxpQ0FBZDtBQUtIO0FBQ0oseUJBakJEO0FBbUJBLCtCQUFPLGlCQUFXLElBQVgsQ0FBNkQsUUFBN0QsQ0FBUDtBQUNIO0FBMUJNLGlCQUFOO0FBQUEsYUFMRixFQWlDRixNQWpDRSxDQWlDSyxhQUFDO0FBQ0wsb0JBQUksT0FBTyxTQUFQLEtBQXFCLFdBQXpCLEVBQXNDO0FBQ2xDLDJCQUFPLElBQVA7QUFDSDtBQUVELG9CQUFJLFNBQUosRUFBZTtBQUNYLDJCQUFPLGlCQUFFLFFBQUYsQ0FBVyxXQUFYLEVBQXdCLEVBQUUsSUFBMUIsQ0FBUDtBQUNILGlCQUZELE1BRU87QUFDSCwyQkFBTyxDQUFDLGlCQUFFLFFBQUYsQ0FBVyxXQUFYLEVBQXdCLEVBQUUsSUFBMUIsQ0FBUjtBQUNIO0FBQ0osYUEzQ0UsQ0FBUDtBQTRDSDs7O3FDQUVtQixRLEVBQTJHO0FBQUE7O0FBQzNILG1CQUFPLFNBQ0YsU0FERSxDQUNRO0FBQUEsdUJBQUssRUFBRSxJQUFGLEVBQUw7QUFBQSxhQURSLEVBRUYsT0FGRSxHQUdGLFNBSEUsQ0FHUTtBQUFBLHVCQUFLLENBQUw7QUFBQSxhQUhSLEVBSUYsR0FKRSxDQUlFO0FBQUEsdUJBQUssRUFBRSxRQUFGLEVBQUw7QUFBQSxhQUpGLEVBS0YsTUFMRSxDQUtLO0FBQUEsdUJBQUssQ0FBQyxDQUFDLENBQVA7QUFBQSxhQUxMLEVBTUYsT0FORSxHQU9GLEVBUEUsQ0FPQyxFQUFFLFVBQVUsb0JBQUE7QUFDTix5QkFBSyxNQUFMLENBQWEsU0FBYixDQUF1QixnQkFBdkIsRUFBeUM7QUFDM0MsOEJBQU0sUUFEcUM7QUFFM0Msb0NBQVksT0FBSztBQUYwQixxQkFBekM7QUFJVCxpQkFMRyxFQVBELEVBYUYsU0FiRSxDQWFRO0FBQUEsdUJBQUssQ0FBTDtBQUFBLGFBYlIsRUFjRixFQWRFLENBY0M7QUFBQSx1QkFBSyxHQUFMO0FBQUEsYUFkRCxDQUFQO0FBZUg7Ozt3Q0FFc0Isa0IsRUFBNkIsRyxFQUFhLEssRUFBZTtBQUFBOztBQUM1RSxnQkFBSSxTQUFxQixJQUF6QjtBQUNBLGdCQUFJLFdBQVcsSUFBZjtBQUdBLGdCQUFJLHNCQUFzQixpQkFBRSxHQUFGLENBQU0sS0FBSyxNQUFYLEVBQW1CLEdBQW5CLENBQTFCLEVBQW1EO0FBQUE7QUFDL0Msd0JBQU0sZ0NBQThCLEdBQXBDO0FBQ0Esd0JBQUkseUJBQUo7d0JBQW1DLDBCQUFuQztBQUNBLDJCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxNQUFMLENBQVksT0FBWixDQUFvQixTQUFwQixFQUErQixtQkFBTztBQUN0RCw0QkFBSSxDQUFDLE9BQUwsRUFBYztBQUNWLGdDQUFJLGlCQUFKLEVBQXVCO0FBQ25CLGtEQUFrQixPQUFsQjtBQUNBLHVDQUFLLFVBQUwsQ0FBZ0IsTUFBaEIsQ0FBdUIsaUJBQXZCO0FBQ0Esb0RBQW9CLElBQXBCO0FBQ0g7QUFFRCxnQ0FBSTtBQUFFLHNDQUFNLE9BQU47QUFBbUIsNkJBQXpCLENBQXlCLE9BQU8sRUFBUCxFQUFXLENBQVM7QUFFN0MsK0NBQW1CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsZ0JBQWxCLGdDQUFnRSxpQkFBRSxTQUFGLENBQVksR0FBWixDQUFoRSxFQUFvRjtBQUFBLHVDQUFNLEtBQUssTUFBTCxDQUFZLEdBQVosQ0FBZ0IsU0FBaEIsRUFBMkIsSUFBM0IsQ0FBTjtBQUFBLDZCQUFwRixDQUFuQjtBQUNBLG1DQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsZ0JBQXBCO0FBQ0gseUJBWEQsTUFXTztBQUNILGdDQUFJLGdCQUFKLEVBQXNCO0FBQ2xCLGlEQUFpQixPQUFqQjtBQUNBLHVDQUFLLFVBQUwsQ0FBZ0IsTUFBaEIsQ0FBdUIsaUJBQXZCO0FBQ0EsbURBQW1CLElBQW5CO0FBQ0g7QUFFRCxvQ0FBUSxJQUFSLDJCQUFvQyxHQUFwQztBQUNBLGtDQUFNLFFBQU47QUFFQSxnQ0FBSSxpQkFBRSxVQUFGLENBQWEsTUFBTSxRQUFOLENBQWIsQ0FBSixFQUFtQztBQUMvQixvQ0FBSSxRQUFKLEVBQWM7QUFDViw2Q0FBUyxrQkFBQTtBQUNMLGdEQUFRLElBQVIsMEJBQW1DLEdBQW5DO0FBQ0EsOENBQU0sUUFBTjtBQUNILHFDQUhEO0FBSUgsaUNBTEQsTUFLTztBQUNILDRDQUFRLElBQVIsMEJBQW1DLEdBQW5DO0FBQ0EsMENBQU0sUUFBTjtBQUNIO0FBQ0o7QUFFRCxnREFBb0IsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixnQkFBbEIsaUNBQWlFLGlCQUFFLFNBQUYsQ0FBWSxHQUFaLENBQWpFLEVBQXFGO0FBQUEsdUNBQU0sS0FBSyxNQUFMLENBQVksR0FBWixDQUFnQixTQUFoQixFQUEyQixLQUEzQixDQUFOO0FBQUEsNkJBQXJGLENBQXBCO0FBQ0EsbUNBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixpQkFBcEI7QUFDSDtBQUNELG1DQUFXLEtBQVg7QUFDSCxxQkF0Q21CLENBQXBCO0FBeUNBLDJCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixnQkFBbEIsZ0NBQWdFLGlCQUFFLFNBQUYsQ0FBWSxHQUFaLENBQWhFLEVBQW9GO0FBQUEsK0JBQU0sS0FBSyxNQUFMLENBQVksR0FBWixDQUFnQixTQUFoQixFQUEyQixDQUFDLEtBQUssTUFBTCxDQUFZLEdBQVosQ0FBZ0IsU0FBaEIsQ0FBNUIsQ0FBTjtBQUFBLHFCQUFwRixDQUFwQjtBQTVDK0M7QUE2Q2xELGFBN0NELE1BNkNPO0FBQ0gsc0JBQU0sUUFBTjtBQUVBLG9CQUFJLGlCQUFFLFVBQUYsQ0FBYSxNQUFNLFFBQU4sQ0FBYixDQUFKLEVBQW1DO0FBQy9CLDZCQUFTLGtCQUFBO0FBQ0wsZ0NBQVEsSUFBUiwwQkFBbUMsR0FBbkM7QUFDQSw4QkFBTSxRQUFOO0FBQ0gscUJBSEQ7QUFJSDtBQUNKO0FBRUQsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQiw0QkFBVyxNQUFYLENBQWtCLFlBQUE7QUFBUSxvQkFBSTtBQUFFLDBCQUFNLE9BQU47QUFBbUIsaUJBQXpCLENBQXlCLE9BQU8sRUFBUCxFQUFXLENBQVM7QUFBRSxhQUF6RSxDQUFwQjtBQUNBLG1CQUFPLE1BQVA7QUFDSDs7O2dEQUUrQixNLEVBQXVCO0FBQUE7O0FBQ25ELGdCQUFNLFVBQVUsT0FBTyxVQUFQLEVBQWhCO0FBQ0EsaUJBQUssYUFBTCxDQUFtQixNQUFuQixFQUEyQixPQUEzQjtBQUNBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsT0FBTyxrQkFBUCxDQUEwQixVQUFDLEdBQUQ7QUFBQSx1QkFBNEIsT0FBSyxhQUFMLENBQW1CLE1BQW5CLEVBQTJCLEdBQTNCLENBQTVCO0FBQUEsYUFBMUIsQ0FBcEI7QUFDSDs7O3NDQUVxQixNLEVBQXlCLE8sRUFBMEI7QUFDckUsZ0JBQUksQ0FBQyxLQUFLLE1BQUwsQ0FBWSxHQUFaLENBQWdCLDBDQUFoQixDQUFMLEVBQWtFO0FBQzlEO0FBQ0g7QUFFRCxnQkFBSSxXQUFLLGNBQUwsQ0FBb0IsT0FBcEIsQ0FBSixFQUFrQztBQUM5QixvQkFBSSxXQUFLLEtBQVQsRUFBZ0I7QUFDWix5QkFBSyxNQUFMO0FBQ0g7QUFDSixhQUpELE1BSU8sSUFBSSxRQUFRLElBQVIsS0FBaUIsTUFBckIsRUFBNkI7QUFDaEMsb0JBQUksS0FBSyxRQUFMLENBQWMsT0FBTyxPQUFQLEVBQWQsTUFBb0MsY0FBeEMsRUFBd0Q7QUFDcEQsd0JBQUksV0FBSyxLQUFULEVBQWdCO0FBQ1osNkJBQUssTUFBTDtBQUNIO0FBQ0o7QUFDSjtBQUNKOzs7aUNBRVk7QUFDVCxnQkFBSSxXQUFLLEtBQVQsRUFBZ0I7QUFDWiwyQkFBSyxPQUFMO0FBQ0gsYUFGRCxNQUVPLElBQUksV0FBSyxJQUFULEVBQWU7QUFDbEIsMkJBQUssVUFBTDtBQUNIO0FBQ0o7OztxQ0FFZ0I7QUFDYixpQkFBSyxVQUFMLENBQWdCLE9BQWhCO0FBQ0g7Ozt5Q0FFdUIsUyxFQUFjO0FBQ2xDLGdCQUFJLElBQUksUUFBUSxtQkFBUixDQUFSO0FBQ0EsY0FBRSxTQUFGLENBQVksS0FBWixDQUFrQixTQUFsQjtBQUNBLGdCQUFJLFFBQVEsMkJBQVIsQ0FBSjtBQUNBLGNBQUUsaUJBQUYsQ0FBb0IsS0FBcEIsQ0FBMEIsU0FBMUI7QUFDQSxnQkFBSSxRQUFRLHdCQUFSLENBQUo7QUFDQSxjQUFFLG9CQUFGLENBQXVCLEtBQXZCLENBQTZCLFNBQTdCO0FBQ0g7OztpREFHK0IsZ0IsRUFBcUI7QUFBQSwyQkFDdkIsUUFBUSx5QkFBUixDQUR1Qjs7QUFBQSxnQkFDMUMsZUFEMEMsWUFDMUMsZUFEMEM7O0FBRWpELDRCQUFnQixLQUFoQixDQUFzQixnQkFBdEI7QUFDSDs7OzhDQUV5QjtBQUN0QixtQkFBTyxRQUFRLGdDQUFSLENBQVA7QUFDSDs7O3dDQUVtQjtBQUNoQixnQkFBTSxpQkFBaUIsUUFBUSw0QkFBUixDQUF2QjtBQUNBLG1CQUFPLGVBQWUsUUFBdEI7QUFDSDs7OzZDQUV3QjtBQUNyQixtQkFBTyxRQUFRLDZCQUFSLEVBQXVDLE1BQXZDLENBQThDLFFBQVEsK0JBQVIsQ0FBOUMsQ0FBUDtBQUNIOzs7c0NBRW9CLE0sRUFBVztBQUM1QixnQkFBTSxpQkFBaUIsUUFBUSw0QkFBUixDQUF2QjtBQUNBLGdCQUFNLFVBQVUsZUFBZSxRQUEvQjtBQUVBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsNEJBQVcsTUFBWCxDQUFrQixZQUFBO0FBQ2xDLGlDQUFFLElBQUYsQ0FBTyxPQUFQLEVBQWdCLGFBQUM7QUFDYiwyQkFBTyxZQUFQLENBQW9CLENBQXBCO0FBQ0gsaUJBRkQ7QUFHSCxhQUptQixDQUFwQjtBQU1BLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsZUFBZSxJQUFmLENBQW9CLE1BQXBCLENBQXBCO0FBQ0g7OzsrQ0FHMkI7QUFDeEIsZ0JBQUksbUJBQUo7QUFDQSxnQkFBTSwyQkFBMkIsV0FBSyxVQUFMLEdBQWtCLGlEQUFuRDtBQUNBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxNQUFMLENBQVksT0FBWixDQUFvQixzQ0FBcEIsRUFBNEQsVUFBQyxPQUFELEVBQWlCO0FBQzdGLG9CQUFJLE9BQUosRUFBYTtBQUNULGlDQUFhLEtBQUssT0FBTCxDQUFhLFVBQWIsQ0FBd0Isd0JBQXhCLENBQWI7QUFDSCxpQkFGRCxNQUVPO0FBQ0gsd0JBQUksVUFBSixFQUFnQixXQUFXLE9BQVg7QUFDaEIseUJBQUssT0FBTCxDQUFhLHdCQUFiLENBQXNDLHdCQUF0QztBQUNIO0FBQ0osYUFQbUIsQ0FBcEI7QUFRSDs7Ozs7O0FBdUZMLE9BQU8sT0FBUCxHQUFpQixJQUFJLGFBQUosRUFBakIiLCJmaWxlIjoibGliL29tbmlzaGFycC1hdG9tLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgQXN5bmNTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4vc2VydmVyL29tbmlcIjtcbmNvbnN0IHdpbjMyID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gXCJ3aW4zMlwiO1xuY2xhc3MgT21uaVNoYXJwQXRvbSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuY29uZmlnID0ge1xuICAgICAgICAgICAgYXV0b1N0YXJ0T25Db21wYXRpYmxlRmlsZToge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIkF1dG9zdGFydCBPbW5pc2hhcnAgUm9zbHluXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQXV0b21hdGljYWxseSBzdGFydHMgT21uaXNoYXJwIFJvc2x5biB3aGVuIGEgY29tcGF0aWJsZSBmaWxlIGlzIG9wZW5lZC5cIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGV2ZWxvcGVyTW9kZToge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIkRldmVsb3BlciBNb2RlXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiT3V0cHV0cyBkZXRhaWxlZCBzZXJ2ZXIgY2FsbHMgaW4gY29uc29sZS5sb2dcIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNob3dEaWFnbm9zdGljc0ZvckFsbFNvbHV0aW9uczoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIlNob3cgRGlhZ25vc3RpY3MgZm9yIGFsbCBTb2x1dGlvbnNcIixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJBZHZhbmNlZDogVGhpcyB3aWxsIHNob3cgZGlhZ25vc3RpY3MgZm9yIGFsbCBvcGVuIHNvbHV0aW9ucy4gIE5PVEU6IE1heSB0YWtlIGEgcmVzdGFydCBvciBjaGFuZ2UgdG8gZWFjaCBzZXJ2ZXIgdG8gdGFrZSBlZmZlY3Qgd2hlbiB0dXJuZWQgb24uXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbmFibGVBZHZhbmNlZEZpbGVOZXc6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJFbmFibGUgYEFkdmFuY2VkIEZpbGUgTmV3YFwiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkVuYWJsZSBgQWR2YW5jZWQgRmlsZSBOZXdgIHdoZW4gZG9pbmcgY3RybC1uL2NtZC1uIHdpdGhpbiBhIEMjIGVkaXRvci5cIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVzZUxlZnRMYWJlbENvbHVtbkZvclN1Z2dlc3Rpb25zOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiVXNlIExlZnQtTGFiZWwgY29sdW1uIGluIFN1Z2dlc3Rpb25zXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2hvd3MgcmV0dXJuIHR5cGVzIGluIGEgcmlnaHQtYWxpZ25lZCBjb2x1bW4gdG8gdGhlIGxlZnQgb2YgdGhlIGNvbXBsZXRpb24gc3VnZ2VzdGlvbiB0ZXh0LlwiLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXNlSWNvbnM6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJVc2UgdW5pcXVlIGljb25zIGZvciBraW5kIGluZGljYXRvcnMgaW4gU3VnZ2VzdGlvbnNcIixcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTaG93cyBraW5kcyB3aXRoIHVuaXF1ZSBpY29ucyByYXRoZXIgdGhhbiBhdXRvY29tcGxldGUgZGVmYXVsdCBzdHlsZXMuXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGF1dG9BZGp1c3RUcmVlVmlldzoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIkFkanVzdCB0aGUgdHJlZSB2aWV3IHRvIG1hdGNoIHRoZSBzb2x1dGlvbiByb290LlwiLFxuICAgICAgICAgICAgICAgIGRlc2NycHRpb246IFwiVGhpcyB3aWxsIGF1dG9tYXRpY2FsbHkgYWRqdXN0IHRoZSB0cmVldmlldyB0byBiZSB0aGUgcm9vdCBvZiB0aGUgc29sdXRpb24uXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBuYWdBZGp1c3RUcmVlVmlldzoge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIlNob3cgdGhlIG5vdGlmaWNhdGlvbnMgdG8gQWRqdXN0IHRoZSB0cmVlIHZpZXdcIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXV0b0FkZEV4dGVybmFsUHJvamVjdHM6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJBZGQgZXh0ZXJuYWwgcHJvamVjdHMgdG8gdGhlIHRyZWUgdmlldy5cIixcbiAgICAgICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlRoaXMgd2lsbCBhdXRvbWF0aWNhbGx5IGFkZCBleHRlcm5hbCBzb3VyY2VzIHRvIHRoZSB0cmVlIHZpZXcuXFxuIEV4dGVybmFsIHNvdXJjZXMgYXJlIGFueSBwcm9qZWN0cyB0aGF0IGFyZSBsb2FkZWQgb3V0c2lkZSBvZiB0aGUgc29sdXRpb24gcm9vdC5cIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG5hZ0FkZEV4dGVybmFsUHJvamVjdHM6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJTaG93IHRoZSBub3RpZmljYXRpb25zIHRvIGFkZCBvciByZW1vdmUgZXh0ZXJuYWwgcHJvamVjdHNcIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaGlkZUxpbnRlckludGVyZmFjZToge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIkhpZGUgdGhlIGxpbnRlciBpbnRlcmZhY2Ugd2hlbiB1c2luZyBvbW5pc2hhcnAtYXRvbSBlZGl0b3JzXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHdhbnRNZXRhZGF0YToge1xuICAgICAgICAgICAgICAgIHRpdGxlOiBcIlJlcXVlc3QgbWV0YWRhdGEgZGVmaW5pdGlvbiB3aXRoIEdvdG8gRGVmaW5pdGlvblwiLFxuICAgICAgICAgICAgICAgIGRlc2NycHRpb246IFwiUmVxdWVzdCBzeW1ib2wgbWV0YWRhdGEgZnJvbSB0aGUgc2VydmVyLCB3aGVuIHVzaW5nIGdvLXRvLWRlZmluaXRpb24uICBUaGlzIGlzIGRpc2FibGVkIGJ5IGRlZmF1bHQgb24gTGludXgsIGR1ZSB0byBpc3N1ZXMgd2l0aCBSb3NseW4gb24gTW9uby5cIixcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiB3aW4zMlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGFsdEdvdG9EZWZpbml0aW9uOiB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiQWx0IEdvIFRvIERlZmluaXRpb25cIixcbiAgICAgICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlVzZSB0aGUgYWx0IGtleSBpbnN0ZWFkIG9mIHRoZSBjdHJsL2NtZCBrZXkgZm9yIGdvdG8gZGVmaW50aW9uIG1vdXNlIG92ZXIuXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzaG93SGlkZGVuRGlhZ25vc3RpY3M6IHtcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJTaG93ICdIaWRkZW4nIGRpYWdub3N0aWNzIGluIHRoZSBsaW50ZXJcIixcbiAgICAgICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlNob3cgb3IgaGlkZSBoaWRkZW4gZGlhZ25vc3RpY3MgaW4gdGhlIGxpbnRlciwgdGhpcyBkb2VzIG5vdCBhZmZlY3QgZ3JleWluZyBvdXQgb2YgbmFtZXNwYWNlcyB0aGF0IGFyZSB1bnVzZWQuXCIsXG4gICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBhY3RpdmF0ZShzdGF0ZSkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZTtcbiAgICAgICAgdGhpcy5fc3RhcnRlZCA9IG5ldyBBc3luY1N1YmplY3QoKTtcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVkID0gbmV3IEFzeW5jU3ViamVjdCgpO1xuICAgICAgICB0aGlzLmNvbmZpZ3VyZUtleWJpbmRpbmdzKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnRvZ2dsZVwiLCAoKSA9PiB0aGlzLnRvZ2dsZSgpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOmZpeC11c2luZ3NcIiwgKCkgPT4gT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmZpeHVzaW5ncyh7fSkpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBcIm9tbmlzaGFycC1hdG9tOnNldHRpbmdzXCIsICgpID0+IGF0b20ud29ya3NwYWNlLm9wZW4oXCJhdG9tOi8vY29uZmlnL3BhY2thZ2VzXCIpXG4gICAgICAgICAgICAudGhlbih0YWIgPT4ge1xuICAgICAgICAgICAgaWYgKHRhYiAmJiB0YWIuZ2V0VVJJICYmIHRhYi5nZXRVUkkoKSAhPT0gXCJhdG9tOi8vY29uZmlnL3BhY2thZ2VzL29tbmlzaGFycC1hdG9tXCIpIHtcbiAgICAgICAgICAgICAgICBhdG9tLndvcmtzcGFjZS5vcGVuKFwiYXRvbTovL2NvbmZpZy9wYWNrYWdlcy9vbW5pc2hhcnAtYXRvbVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpKTtcbiAgICAgICAgY29uc3QgZ3JhbW1hcnMgPSBhdG9tLmdyYW1tYXJzO1xuICAgICAgICBjb25zdCBncmFtbWFyQ2IgPSAoZ3JhbW1hcikgPT4ge1xuICAgICAgICAgICAgaWYgKF8uZmluZChPbW5pLmdyYW1tYXJzLCAoZ21yKSA9PiBnbXIuc2NvcGVOYW1lID09PSBncmFtbWFyLnNjb3BlTmFtZSkpIHtcbiAgICAgICAgICAgICAgICBhdG9tLmdyYW1tYXJzLnN0YXJ0SWRGb3JTY29wZShncmFtbWFyLnNjb3BlTmFtZSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgb21uaXNoYXJwU2NvcGVOYW1lID0gYCR7Z3JhbW1hci5zY29wZU5hbWV9Lm9tbmlzaGFycGA7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2NvcGVJZCA9IGdyYW1tYXJzLmlkc0J5U2NvcGVbZ3JhbW1hci5zY29wZU5hbWVdO1xuICAgICAgICAgICAgICAgIGdyYW1tYXJzLmlkc0J5U2NvcGVbb21uaXNoYXJwU2NvcGVOYW1lXSA9IHNjb3BlSWQ7XG4gICAgICAgICAgICAgICAgZ3JhbW1hcnMuc2NvcGVzQnlJZFtzY29wZUlkXSA9IG9tbmlzaGFycFNjb3BlTmFtZTtcbiAgICAgICAgICAgICAgICBncmFtbWFyLnNjb3BlTmFtZSA9IG9tbmlzaGFycFNjb3BlTmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgXy5lYWNoKGdyYW1tYXJzLmdyYW1tYXJzLCBncmFtbWFyQ2IpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uZ3JhbW1hcnMub25EaWRBZGRHcmFtbWFyKGdyYW1tYXJDYikpO1xuICAgICAgICByZXF1aXJlKFwiYXRvbS1wYWNrYWdlLWRlcHNcIikuaW5zdGFsbChcIm9tbmlzaGFycC1hdG9tXCIpXG4gICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCJBY3RpdmF0aW5nIG9tbmlzaGFycC1hdG9tIHNvbHV0aW9uIHRyYWNraW5nLi4uXCIpO1xuICAgICAgICAgICAgT21uaS5hY3RpdmF0ZSgpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pKTtcbiAgICAgICAgICAgIHRoaXMuX3N0YXJ0ZWQubmV4dCh0cnVlKTtcbiAgICAgICAgICAgIHRoaXMuX3N0YXJ0ZWQuY29tcGxldGUoKTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMubG9hZEZlYXR1cmVzKHRoaXMuZ2V0RmVhdHVyZXMoXCJhdG9tXCIpLmRlbGF5KE9tbmlbXCJfa2lja19pbl90aGVfcGFudHNfXCJdID8gMCA6IDIwMDApKS50b1Byb21pc2UoKSlcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGxldCBzdGFydGluZ09ic2VydmFibGUgPSBPbW5pLmFjdGl2ZVNvbHV0aW9uXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+ICEheilcbiAgICAgICAgICAgICAgICAudGFrZSgxKTtcbiAgICAgICAgICAgIGlmIChPbW5pW1wiX2tpY2tfaW5fdGhlX3BhbnRzX1wiXSkge1xuICAgICAgICAgICAgICAgIHN0YXJ0aW5nT2JzZXJ2YWJsZSA9IE9ic2VydmFibGUub2YobnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHN0YXJ0aW5nT2JzZXJ2YWJsZVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IHRoaXMubG9hZEZlYXR1cmVzKHRoaXMuZ2V0RmVhdHVyZXMoXCJmZWF0dXJlc1wiKSkpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSh7IGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS53b3Jrc3BhY2Uub2JzZXJ2ZVRleHRFZGl0b3JzKChlZGl0b3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGV0ZWN0QXV0b1RvZ2dsZUdyYW1tYXIoZWRpdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9hY3RpdmF0ZWQubmV4dCh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZhdGVkLmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgfSB9KSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXRGZWF0dXJlcyhmb2xkZXIpIHtcbiAgICAgICAgY29uc3Qgd2hpdGVMaXN0ID0gYXRvbS5jb25maWcuZ2V0KFwib21uaXNoYXJwLWF0b206ZmVhdHVyZS13aGl0ZS1saXN0XCIpO1xuICAgICAgICBjb25zdCBmZWF0dXJlTGlzdCA9IGF0b20uY29uZmlnLmdldChcIm9tbmlzaGFycC1hdG9tOmZlYXR1cmUtbGlzdFwiKTtcbiAgICAgICAgY29uc3Qgd2hpdGVMaXN0VW5kZWZpbmVkID0gKHR5cGVvZiB3aGl0ZUxpc3QgPT09IFwidW5kZWZpbmVkXCIpO1xuICAgICAgICBjb25zb2xlLmluZm8oYEdldHRpbmcgZmVhdHVyZXMgZm9yIFwiJHtmb2xkZXJ9XCIuLi5gKTtcbiAgICAgICAgY29uc3QgcGFja2FnZURpciA9IE9tbmkucGFja2FnZURpcjtcbiAgICAgICAgY29uc3QgZmVhdHVyZURpciA9IGAke3BhY2thZ2VEaXJ9L29tbmlzaGFycC1hdG9tL2xpYi8ke2ZvbGRlcn1gO1xuICAgICAgICBmdW5jdGlvbiBsb2FkRmVhdHVyZShmaWxlKSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSByZXF1aXJlKGAuLyR7Zm9sZGVyfS8ke2ZpbGV9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oYExvYWRpbmcgZmVhdHVyZSBcIiR7Zm9sZGVyfS8ke2ZpbGV9XCIuLi5gKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuYmluZE5vZGVDYWxsYmFjayhmcy5yZWFkZGlyKShmZWF0dXJlRGlyKVxuICAgICAgICAgICAgLmZsYXRNYXAoZmlsZXMgPT4gZmlsZXMpXG4gICAgICAgICAgICAuZmlsdGVyKGZpbGUgPT4gL1xcLmpzJC8udGVzdChmaWxlKSlcbiAgICAgICAgICAgIC5mbGF0TWFwKGZpbGUgPT4gT2JzZXJ2YWJsZS5iaW5kTm9kZUNhbGxiYWNrKGZzLnN0YXQpKGAke2ZlYXR1cmVEaXJ9LyR7ZmlsZX1gKSwgKGZpbGUsIHN0YXQpID0+ICh7IGZpbGUsIHN0YXQgfSkpXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXouc3RhdC5pc0RpcmVjdG9yeSgpKVxuICAgICAgICAgICAgLm1hcCh6ID0+ICh7XG4gICAgICAgICAgICBmaWxlOiBgJHtmb2xkZXJ9LyR7cGF0aC5iYXNlbmFtZSh6LmZpbGUpfWAucmVwbGFjZSgvXFwuanMkLywgXCJcIiksXG4gICAgICAgICAgICBsb2FkOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZmVhdHVyZSA9IGxvYWRGZWF0dXJlKHouZmlsZSk7XG4gICAgICAgICAgICAgICAgY29uc3QgZmVhdHVyZXMgPSBbXTtcbiAgICAgICAgICAgICAgICBfLmVhY2goZmVhdHVyZSwgKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFfLmlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXZhbHVlLnJlcXVpcmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25maWdba2V5XSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGAke3ZhbHVlLnRpdGxlfWAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiB2YWx1ZS5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6IChfLmhhcyh2YWx1ZSwgXCJkZWZhdWx0XCIpID8gdmFsdWUuZGVmYXVsdCA6IHRydWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGZlYXR1cmVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleSwgYWN0aXZhdGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZhdGVGZWF0dXJlKHdoaXRlTGlzdFVuZGVmaW5lZCwga2V5LCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tKGZlYXR1cmVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpXG4gICAgICAgICAgICAuZmlsdGVyKGwgPT4ge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB3aGl0ZUxpc3QgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh3aGl0ZUxpc3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXy5pbmNsdWRlcyhmZWF0dXJlTGlzdCwgbC5maWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiAhXy5pbmNsdWRlcyhmZWF0dXJlTGlzdCwgbC5maWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGxvYWRGZWF0dXJlcyhmZWF0dXJlcykge1xuICAgICAgICByZXR1cm4gZmVhdHVyZXNcbiAgICAgICAgICAgIC5jb25jYXRNYXAoeiA9PiB6LmxvYWQoKSlcbiAgICAgICAgICAgIC50b0FycmF5KClcbiAgICAgICAgICAgIC5jb25jYXRNYXAoeCA9PiB4KVxuICAgICAgICAgICAgLm1hcChmID0+IGYuYWN0aXZhdGUoKSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXG4gICAgICAgICAgICAudG9BcnJheSgpXG4gICAgICAgICAgICAuZG8oeyBjb21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGF0b20uY29uZmlnLnNldFNjaGVtYShcIm9tbmlzaGFycC1hdG9tXCIsIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvYmplY3RcIixcbiAgICAgICAgICAgICAgICAgICAgcHJvcGVydGllczogdGhpcy5jb25maWdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gfSlcbiAgICAgICAgICAgIC5jb25jYXRNYXAoeCA9PiB4KVxuICAgICAgICAgICAgLmRvKHggPT4geCgpKTtcbiAgICB9XG4gICAgYWN0aXZhdGVGZWF0dXJlKHdoaXRlTGlzdFVuZGVmaW5lZCwga2V5LCB2YWx1ZSkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gbnVsbDtcbiAgICAgICAgbGV0IGZpcnN0UnVuID0gdHJ1ZTtcbiAgICAgICAgaWYgKHdoaXRlTGlzdFVuZGVmaW5lZCAmJiBfLmhhcyh0aGlzLmNvbmZpZywga2V5KSkge1xuICAgICAgICAgICAgY29uc3QgY29uZmlnS2V5ID0gYG9tbmlzaGFycC1hdG9tLiR7a2V5fWA7XG4gICAgICAgICAgICBsZXQgZW5hYmxlRGlzcG9zYWJsZSwgZGlzYWJsZURpc3Bvc2FibGU7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoY29uZmlnS2V5LCBlbmFibGVkID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpc2FibGVEaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc2FibGVEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVEaXNwb3NhYmxlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNhdGNoIChleCkgeyB9XG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZURpc3Bvc2FibGUgPSBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtZmVhdHVyZTplbmFibGUtJHtfLmtlYmFiQ2FzZShrZXkpfWAsICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWdLZXksIHRydWUpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChlbmFibGVEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbmFibGVEaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbmFibGVEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUoZGlzYWJsZURpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlRGlzcG9zYWJsZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBY3RpdmF0aW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZS5hY3RpdmF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKHZhbHVlW1wiYXR0YWNoXCJdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZpcnN0UnVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYEF0dGFjaGluZyBmZWF0dXJlIFwiJHtrZXl9XCIuLi5gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVbXCJhdHRhY2hcIl0oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBdHRhY2hpbmcgZmVhdHVyZSBcIiR7a2V5fVwiLi4uYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVbXCJhdHRhY2hcIl0oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlRGlzcG9zYWJsZSA9IGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgYG9tbmlzaGFycC1mZWF0dXJlOmRpc2FibGUtJHtfLmtlYmFiQ2FzZShrZXkpfWAsICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWdLZXksIGZhbHNlKSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzYWJsZURpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaXJzdFJ1biA9IGZhbHNlO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtZmVhdHVyZTp0b2dnbGUtJHtfLmtlYmFiQ2FzZShrZXkpfWAsICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWdLZXksICFhdG9tLmNvbmZpZy5nZXQoY29uZmlnS2V5KSkpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlLmFjdGl2YXRlKCk7XG4gICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKHZhbHVlW1wiYXR0YWNoXCJdKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBdHRhY2hpbmcgZmVhdHVyZSBcIiR7a2V5fVwiLi4uYCk7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlW1wiYXR0YWNoXCJdKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHsgdHJ5IHtcbiAgICAgICAgICAgIHZhbHVlLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXgpIHsgfSB9KSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIGRldGVjdEF1dG9Ub2dnbGVHcmFtbWFyKGVkaXRvcikge1xuICAgICAgICBjb25zdCBncmFtbWFyID0gZWRpdG9yLmdldEdyYW1tYXIoKTtcbiAgICAgICAgdGhpcy5kZXRlY3RHcmFtbWFyKGVkaXRvciwgZ3JhbW1hcik7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkQ2hhbmdlR3JhbW1hcigoZ21yKSA9PiB0aGlzLmRldGVjdEdyYW1tYXIoZWRpdG9yLCBnbXIpKSk7XG4gICAgfVxuICAgIGRldGVjdEdyYW1tYXIoZWRpdG9yLCBncmFtbWFyKSB7XG4gICAgICAgIGlmICghYXRvbS5jb25maWcuZ2V0KFwib21uaXNoYXJwLWF0b20uYXV0b1N0YXJ0T25Db21wYXRpYmxlRmlsZVwiKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmIChPbW5pLmlzVmFsaWRHcmFtbWFyKGdyYW1tYXIpKSB7XG4gICAgICAgICAgICBpZiAoT21uaS5pc09mZikge1xuICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZ3JhbW1hci5uYW1lID09PSBcIkpTT05cIikge1xuICAgICAgICAgICAgaWYgKHBhdGguYmFzZW5hbWUoZWRpdG9yLmdldFBhdGgoKSkgPT09IFwicHJvamVjdC5qc29uXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAoT21uaS5pc09mZikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICB0b2dnbGUoKSB7XG4gICAgICAgIGlmIChPbW5pLmlzT2ZmKSB7XG4gICAgICAgICAgICBPbW5pLmNvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChPbW5pLmlzT24pIHtcbiAgICAgICAgICAgIE9tbmkuZGlzY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRlYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGNvbnN1bWVTdGF0dXNCYXIoc3RhdHVzQmFyKSB7XG4gICAgICAgIGxldCBmID0gcmVxdWlyZShcIi4vYXRvbS9zdGF0dXMtYmFyXCIpO1xuICAgICAgICBmLnN0YXR1c0Jhci5zZXR1cChzdGF0dXNCYXIpO1xuICAgICAgICBmID0gcmVxdWlyZShcIi4vYXRvbS9mcmFtZXdvcmstc2VsZWN0b3JcIik7XG4gICAgICAgIGYuZnJhbWV3b3JrU2VsZWN0b3Iuc2V0dXAoc3RhdHVzQmFyKTtcbiAgICAgICAgZiA9IHJlcXVpcmUoXCIuL2F0b20vZmVhdHVyZS1idXR0b25zXCIpO1xuICAgICAgICBmLmZlYXR1cmVFZGl0b3JCdXR0b25zLnNldHVwKHN0YXR1c0Jhcik7XG4gICAgfVxuICAgIGNvbnN1bWVZZW9tYW5FbnZpcm9ubWVudChnZW5lcmF0b3JTZXJ2aWNlKSB7XG4gICAgICAgIGNvbnN0IHsgZ2VuZXJhdG9yQXNwbmV0IH0gPSByZXF1aXJlKFwiLi9hdG9tL2dlbmVyYXRvci1hc3BuZXRcIik7XG4gICAgICAgIGdlbmVyYXRvckFzcG5ldC5zZXR1cChnZW5lcmF0b3JTZXJ2aWNlKTtcbiAgICB9XG4gICAgcHJvdmlkZUF1dG9jb21wbGV0ZSgpIHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoXCIuL3NlcnZpY2VzL2NvbXBsZXRpb24tcHJvdmlkZXJcIik7XG4gICAgfVxuICAgIHByb3ZpZGVMaW50ZXIoKSB7XG4gICAgICAgIGNvbnN0IExpbnRlclByb3ZpZGVyID0gcmVxdWlyZShcIi4vc2VydmljZXMvbGludGVyLXByb3ZpZGVyXCIpO1xuICAgICAgICByZXR1cm4gTGludGVyUHJvdmlkZXIucHJvdmlkZXI7XG4gICAgfVxuICAgIHByb3ZpZGVQcm9qZWN0SnNvbigpIHtcbiAgICAgICAgcmV0dXJuIHJlcXVpcmUoXCIuL3NlcnZpY2VzL3Byb2plY3QtcHJvdmlkZXJcIikuY29uY2F0KHJlcXVpcmUoXCIuL3NlcnZpY2VzL2ZyYW1ld29yay1wcm92aWRlclwiKSk7XG4gICAgfVxuICAgIGNvbnN1bWVMaW50ZXIobGludGVyKSB7XG4gICAgICAgIGNvbnN0IExpbnRlclByb3ZpZGVyID0gcmVxdWlyZShcIi4vc2VydmljZXMvbGludGVyLXByb3ZpZGVyXCIpO1xuICAgICAgICBjb25zdCBsaW50ZXJzID0gTGludGVyUHJvdmlkZXIucHJvdmlkZXI7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKGxpbnRlcnMsIGwgPT4ge1xuICAgICAgICAgICAgICAgIGxpbnRlci5kZWxldGVMaW50ZXIobCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKExpbnRlclByb3ZpZGVyLmluaXQobGludGVyKSk7XG4gICAgfVxuICAgIGNvbmZpZ3VyZUtleWJpbmRpbmdzKCkge1xuICAgICAgICBsZXQgZGlzcG9zYWJsZTtcbiAgICAgICAgY29uc3Qgb21uaXNoYXJwQWR2YW5jZWRGaWxlTmV3ID0gT21uaS5wYWNrYWdlRGlyICsgXCIvb21uaXNoYXJwLWF0b20va2V5bWFwcy9vbW5pc2hhcnAtZmlsZS1uZXcuY3NvblwiO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5lbmFibGVBZHZhbmNlZEZpbGVOZXdcIiwgKGVuYWJsZWQpID0+IHtcbiAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZSA9IGF0b20ua2V5bWFwcy5sb2FkS2V5bWFwKG9tbmlzaGFycEFkdmFuY2VkRmlsZU5ldyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoZGlzcG9zYWJsZSlcbiAgICAgICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgYXRvbS5rZXltYXBzLnJlbW92ZUJpbmRpbmdzRnJvbVNvdXJjZShvbW5pc2hhcnBBZHZhbmNlZEZpbGVOZXcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBuZXcgT21uaVNoYXJwQXRvbTtcbiIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7T2JzZXJ2YWJsZSwgQXN5bmNTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuXG4vLyBUT0RPOiBSZW1vdmUgdGhlc2UgYXQgc29tZSBwb2ludCB0byBzdHJlYW0gbGluZSBzdGFydHVwLlxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi9zZXJ2ZXIvb21uaVwiO1xuY29uc3Qgd2luMzIgPSBwcm9jZXNzLnBsYXRmb3JtID09PSBcIndpbjMyXCI7XG5cbmNsYXNzIE9tbmlTaGFycEF0b20ge1xuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcbiAgICAvLyBJbnRlcm5hbDogVXNlZCBieSB1bml0IHRlc3RpbmcgdG8gbWFrZSBzdXJlIHRoZSBwbHVnaW4gaXMgY29tcGxldGVseSBhY3RpdmF0ZWQuXG4gICAgcHJpdmF0ZSBfc3RhcnRlZDogQXN5bmNTdWJqZWN0PGJvb2xlYW4+O1xuICAgIHByaXZhdGUgX2FjdGl2YXRlZDogQXN5bmNTdWJqZWN0PGJvb2xlYW4+O1xuXG4gICAgcHVibGljIGFjdGl2YXRlKHN0YXRlOiBhbnkpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGU7XG4gICAgICAgIHRoaXMuX3N0YXJ0ZWQgPSBuZXcgQXN5bmNTdWJqZWN0PGJvb2xlYW4+KCk7XG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZCA9IG5ldyBBc3luY1N1YmplY3Q8Ym9vbGVhbj4oKTtcblxuICAgICAgICB0aGlzLmNvbmZpZ3VyZUtleWJpbmRpbmdzKCk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206dG9nZ2xlXCIsICgpID0+IHRoaXMudG9nZ2xlKCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206Zml4LXVzaW5nc1wiLCAoKSA9PiBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZml4dXNpbmdzKHt9KSkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIFwib21uaXNoYXJwLWF0b206c2V0dGluZ3NcIiwgKCkgPT4gYXRvbS53b3Jrc3BhY2Uub3BlbihcImF0b206Ly9jb25maWcvcGFja2FnZXNcIilcbiAgICAgICAgICAgIC50aGVuKHRhYiA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRhYiAmJiB0YWIuZ2V0VVJJICYmIHRhYi5nZXRVUkkoKSAhPT0gXCJhdG9tOi8vY29uZmlnL3BhY2thZ2VzL29tbmlzaGFycC1hdG9tXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2Uub3BlbihcImF0b206Ly9jb25maWcvcGFja2FnZXMvb21uaXNoYXJwLWF0b21cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpKTtcblxuICAgICAgICBjb25zdCBncmFtbWFycyA9ICg8YW55PmF0b20uZ3JhbW1hcnMpO1xuICAgICAgICBjb25zdCBncmFtbWFyQ2IgPSAoZ3JhbW1hcjogeyBzY29wZU5hbWU6IHN0cmluZzsgfSkgPT4ge1xuICAgICAgICAgICAgaWYgKF8uZmluZChPbW5pLmdyYW1tYXJzLCAoZ21yOiBhbnkpID0+IGdtci5zY29wZU5hbWUgPT09IGdyYW1tYXIuc2NvcGVOYW1lKSkge1xuICAgICAgICAgICAgICAgIC8vIGVuc3VyZSB0aGUgc2NvcGUgaGFzIGJlZW4gaW5pdGVkXG4gICAgICAgICAgICAgICAgYXRvbS5ncmFtbWFycy5zdGFydElkRm9yU2NvcGUoZ3JhbW1hci5zY29wZU5hbWUpO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgb21uaXNoYXJwU2NvcGVOYW1lID0gYCR7Z3JhbW1hci5zY29wZU5hbWV9Lm9tbmlzaGFycGA7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2NvcGVJZCA9IGdyYW1tYXJzLmlkc0J5U2NvcGVbZ3JhbW1hci5zY29wZU5hbWVdO1xuICAgICAgICAgICAgICAgIGdyYW1tYXJzLmlkc0J5U2NvcGVbb21uaXNoYXJwU2NvcGVOYW1lXSA9IHNjb3BlSWQ7XG4gICAgICAgICAgICAgICAgZ3JhbW1hcnMuc2NvcGVzQnlJZFtzY29wZUlkXSA9IG9tbmlzaGFycFNjb3BlTmFtZTtcbiAgICAgICAgICAgICAgICBncmFtbWFyLnNjb3BlTmFtZSA9IG9tbmlzaGFycFNjb3BlTmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgXy5lYWNoKGdyYW1tYXJzLmdyYW1tYXJzLCBncmFtbWFyQ2IpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uZ3JhbW1hcnMub25EaWRBZGRHcmFtbWFyKGdyYW1tYXJDYikpO1xuXG4gICAgICAgIHJlcXVpcmUoXCJhdG9tLXBhY2thZ2UtZGVwc1wiKS5pbnN0YWxsKFwib21uaXNoYXJwLWF0b21cIilcbiAgICAgICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oXCJBY3RpdmF0aW5nIG9tbmlzaGFycC1hdG9tIHNvbHV0aW9uIHRyYWNraW5nLi4uXCIpO1xuICAgICAgICAgICAgICAgIE9tbmkuYWN0aXZhdGUoKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fc3RhcnRlZC5uZXh0KHRydWUpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0ZWQuY29tcGxldGUoKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xuICAgICAgICAgICAgLnRoZW4oKCkgPT4gdGhpcy5sb2FkRmVhdHVyZXModGhpcy5nZXRGZWF0dXJlcyhcImF0b21cIikuZGVsYXkoT21uaVtcIl9raWNrX2luX3RoZV9wYW50c19cIl0gPyAwIDogMjAwMCkpLnRvUHJvbWlzZSgpKVxuICAgICAgICAgICAgLyogdHNsaW50OmVuYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBzdGFydGluZ09ic2VydmFibGUgPSBPbW5pLmFjdGl2ZVNvbHV0aW9uXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXG4gICAgICAgICAgICAgICAgICAgIC50YWtlKDEpO1xuXG4gICAgICAgICAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cbiAgICAgICAgICAgICAgICBpZiAoT21uaVtcIl9raWNrX2luX3RoZV9wYW50c19cIl0pIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRpbmdPYnNlcnZhYmxlID0gT2JzZXJ2YWJsZS5vZihudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cblxuICAgICAgICAgICAgICAgIC8vIE9ubHkgYWN0aXZhdGUgZmVhdHVyZXMgb25jZSB3ZSBoYXZlIGEgc29sdXRpb24hXG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzdGFydGluZ09ic2VydmFibGVcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gdGhpcy5sb2FkRmVhdHVyZXModGhpcy5nZXRGZWF0dXJlcyhcImZlYXR1cmVzXCIpKSlcbiAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZSh7IGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20ud29ya3NwYWNlLm9ic2VydmVUZXh0RWRpdG9ycygoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRldGVjdEF1dG9Ub2dnbGVHcmFtbWFyKGVkaXRvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2FjdGl2YXRlZC5uZXh0KHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZhdGVkLmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gfSkpO1xuXG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RmVhdHVyZXMoZm9sZGVyOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3Qgd2hpdGVMaXN0ID0gYXRvbS5jb25maWcuZ2V0PGJvb2xlYW4+KFwib21uaXNoYXJwLWF0b206ZmVhdHVyZS13aGl0ZS1saXN0XCIpO1xuICAgICAgICBjb25zdCBmZWF0dXJlTGlzdCA9IGF0b20uY29uZmlnLmdldDxzdHJpbmdbXT4oXCJvbW5pc2hhcnAtYXRvbTpmZWF0dXJlLWxpc3RcIik7XG4gICAgICAgIGNvbnN0IHdoaXRlTGlzdFVuZGVmaW5lZCA9ICh0eXBlb2Ygd2hpdGVMaXN0ID09PSBcInVuZGVmaW5lZFwiKTtcblxuICAgICAgICBjb25zb2xlLmluZm8oYEdldHRpbmcgZmVhdHVyZXMgZm9yIFwiJHtmb2xkZXJ9XCIuLi5gKTtcblxuICAgICAgICBjb25zdCBwYWNrYWdlRGlyID0gT21uaS5wYWNrYWdlRGlyO1xuICAgICAgICBjb25zdCBmZWF0dXJlRGlyID0gYCR7cGFja2FnZURpcn0vb21uaXNoYXJwLWF0b20vbGliLyR7Zm9sZGVyfWA7XG5cbiAgICAgICAgZnVuY3Rpb24gbG9hZEZlYXR1cmUoZmlsZTogc3RyaW5nKSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSByZXF1aXJlKGAuLyR7Zm9sZGVyfS8ke2ZpbGV9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oYExvYWRpbmcgZmVhdHVyZSBcIiR7Zm9sZGVyfS8ke2ZpbGV9XCIuLi5gKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7Ly9fLnZhbHVlcyhyZXN1bHQpLmZpbHRlcihmZWF0dXJlID0+ICFfLmlzRnVuY3Rpb24oZmVhdHVyZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuYmluZE5vZGVDYWxsYmFjayhmcy5yZWFkZGlyKShmZWF0dXJlRGlyKVxuICAgICAgICAgICAgLmZsYXRNYXAoZmlsZXMgPT4gZmlsZXMpXG4gICAgICAgICAgICAuZmlsdGVyKGZpbGUgPT4gL1xcLmpzJC8udGVzdChmaWxlKSlcbiAgICAgICAgICAgIC5mbGF0TWFwKGZpbGUgPT4gT2JzZXJ2YWJsZS5iaW5kTm9kZUNhbGxiYWNrKGZzLnN0YXQpKGAke2ZlYXR1cmVEaXJ9LyR7ZmlsZX1gKSwgKGZpbGUsIHN0YXQpID0+ICh7IGZpbGUsIHN0YXQgfSkpXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXouc3RhdC5pc0RpcmVjdG9yeSgpKVxuICAgICAgICAgICAgLm1hcCh6ID0+ICh7XG4gICAgICAgICAgICAgICAgZmlsZTogYCR7Zm9sZGVyfS8ke3BhdGguYmFzZW5hbWUoei5maWxlKX1gLnJlcGxhY2UoL1xcLmpzJC8sIFwiXCIpLFxuICAgICAgICAgICAgICAgIGxvYWQ6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmVhdHVyZSA9IGxvYWRGZWF0dXJlKHouZmlsZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmVhdHVyZXM6IHsga2V5OiBzdHJpbmcsIGFjdGl2YXRlOiAoKSA9PiAoKSA9PiB2b2lkIH1bXSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBfLmVhY2goZmVhdHVyZSwgKHZhbHVlOiBJRmVhdHVyZSwga2V5OiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghXy5pc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdmFsdWUucmVxdWlyZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25maWdba2V5XSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBgJHt2YWx1ZS50aXRsZX1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHZhbHVlLmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OiAoXy5oYXModmFsdWUsIFwiZGVmYXVsdFwiKSA/IHZhbHVlLmRlZmF1bHQgOiB0cnVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZlYXR1cmVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXksIGFjdGl2YXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hY3RpdmF0ZUZlYXR1cmUod2hpdGVMaXN0VW5kZWZpbmVkLCBrZXksIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tPHsga2V5OiBzdHJpbmcsIGFjdGl2YXRlOiAoKSA9PiAoKSA9PiB2b2lkIH0+KGZlYXR1cmVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSlcbiAgICAgICAgICAgIC5maWx0ZXIobCA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB3aGl0ZUxpc3QgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHdoaXRlTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXy5pbmNsdWRlcyhmZWF0dXJlTGlzdCwgbC5maWxlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gIV8uaW5jbHVkZXMoZmVhdHVyZUxpc3QsIGwuZmlsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGxvYWRGZWF0dXJlcyhmZWF0dXJlczogT2JzZXJ2YWJsZTx7IGZpbGU6IHN0cmluZzsgbG9hZDogKCkgPT4gT2JzZXJ2YWJsZTx7IGtleTogc3RyaW5nLCBhY3RpdmF0ZTogKCkgPT4gKCkgPT4gdm9pZCB9PiB9Pikge1xuICAgICAgICByZXR1cm4gZmVhdHVyZXNcbiAgICAgICAgICAgIC5jb25jYXRNYXAoeiA9PiB6LmxvYWQoKSlcbiAgICAgICAgICAgIC50b0FycmF5KClcbiAgICAgICAgICAgIC5jb25jYXRNYXAoeCA9PiB4KVxuICAgICAgICAgICAgLm1hcChmID0+IGYuYWN0aXZhdGUoKSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXgpXG4gICAgICAgICAgICAudG9BcnJheSgpXG4gICAgICAgICAgICAuZG8oeyBjb21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgICg8YW55PmF0b20uY29uZmlnKS5zZXRTY2hlbWEoXCJvbW5pc2hhcnAtYXRvbVwiLCB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2JqZWN0XCIsXG4gICAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHRoaXMuY29uZmlnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9fSlcbiAgICAgICAgICAgIC5jb25jYXRNYXAoeCA9PiB4KVxuICAgICAgICAgICAgLmRvKHggPT4geCgpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYWN0aXZhdGVGZWF0dXJlKHdoaXRlTGlzdFVuZGVmaW5lZDogYm9vbGVhbiwga2V5OiBzdHJpbmcsIHZhbHVlOiBJRmVhdHVyZSkge1xuICAgICAgICBsZXQgcmVzdWx0OiAoKSA9PiB2b2lkID0gbnVsbDtcbiAgICAgICAgbGV0IGZpcnN0UnVuID0gdHJ1ZTtcblxuICAgICAgICAvLyBXaGl0ZWxpc3QgaXMgdXNlZCBmb3IgdW5pdCB0ZXN0aW5nLCB3ZSBkb25cInQgd2FudCB0aGUgY29uZmlnIHRvIG1ha2UgY2hhbmdlcyBoZXJlXG4gICAgICAgIGlmICh3aGl0ZUxpc3RVbmRlZmluZWQgJiYgXy5oYXModGhpcy5jb25maWcsIGtleSkpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbmZpZ0tleSA9IGBvbW5pc2hhcnAtYXRvbS4ke2tleX1gO1xuICAgICAgICAgICAgbGV0IGVuYWJsZURpc3Bvc2FibGU6IElEaXNwb3NhYmxlLCBkaXNhYmxlRGlzcG9zYWJsZTogSURpc3Bvc2FibGU7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoY29uZmlnS2V5LCBlbmFibGVkID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRpc2FibGVEaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc2FibGVEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVEaXNwb3NhYmxlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7IHZhbHVlLmRpc3Bvc2UoKTsgfSBjYXRjaCAoZXgpIHsgLyogKi8gfVxuXG4gICAgICAgICAgICAgICAgICAgIGVuYWJsZURpc3Bvc2FibGUgPSBhdG9tLmNvbW1hbmRzLmFkZChcImF0b20td29ya3NwYWNlXCIsIGBvbW5pc2hhcnAtZmVhdHVyZTplbmFibGUtJHtfLmtlYmFiQ2FzZShrZXkpfWAsICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWdLZXksIHRydWUpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChlbmFibGVEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZW5hYmxlRGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGRpc2FibGVEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZURpc3Bvc2FibGUgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBY3RpdmF0aW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZS5hY3RpdmF0ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChfLmlzRnVuY3Rpb24odmFsdWVbXCJhdHRhY2hcIl0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmlyc3RSdW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQXR0YWNoaW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZVtcImF0dGFjaFwiXSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgQXR0YWNoaW5nIGZlYXR1cmUgXCIke2tleX1cIi4uLmApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlW1wiYXR0YWNoXCJdKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBkaXNhYmxlRGlzcG9zYWJsZSA9IGF0b20uY29tbWFuZHMuYWRkKFwiYXRvbS13b3Jrc3BhY2VcIiwgYG9tbmlzaGFycC1mZWF0dXJlOmRpc2FibGUtJHtfLmtlYmFiQ2FzZShrZXkpfWAsICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWdLZXksIGZhbHNlKSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZGlzYWJsZURpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmaXJzdFJ1biA9IGZhbHNlO1xuICAgICAgICAgICAgfSkpO1xuXG5cbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb21tYW5kcy5hZGQoXCJhdG9tLXdvcmtzcGFjZVwiLCBgb21uaXNoYXJwLWZlYXR1cmU6dG9nZ2xlLSR7Xy5rZWJhYkNhc2Uoa2V5KX1gLCAoKSA9PiBhdG9tLmNvbmZpZy5zZXQoY29uZmlnS2V5LCAhYXRvbS5jb25maWcuZ2V0KGNvbmZpZ0tleSkpKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZS5hY3RpdmF0ZSgpO1xuXG4gICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKHZhbHVlW1wiYXR0YWNoXCJdKSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBBdHRhY2hpbmcgZmVhdHVyZSBcIiR7a2V5fVwiLi4uYCk7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlW1wiYXR0YWNoXCJdKCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4geyB0cnkgeyB2YWx1ZS5kaXNwb3NlKCk7IH0gY2F0Y2ggKGV4KSB7IC8qICovIH0gfSkpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHByaXZhdGUgZGV0ZWN0QXV0b1RvZ2dsZUdyYW1tYXIoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcbiAgICAgICAgY29uc3QgZ3JhbW1hciA9IGVkaXRvci5nZXRHcmFtbWFyKCk7XG4gICAgICAgIHRoaXMuZGV0ZWN0R3JhbW1hcihlZGl0b3IsIGdyYW1tYXIpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGVkaXRvci5vbkRpZENoYW5nZUdyYW1tYXIoKGdtcjogRmlyc3RNYXRlLkdyYW1tYXIpID0+IHRoaXMuZGV0ZWN0R3JhbW1hcihlZGl0b3IsIGdtcikpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGRldGVjdEdyYW1tYXIoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGdyYW1tYXI6IEZpcnN0TWF0ZS5HcmFtbWFyKSB7XG4gICAgICAgIGlmICghYXRvbS5jb25maWcuZ2V0KFwib21uaXNoYXJwLWF0b20uYXV0b1N0YXJ0T25Db21wYXRpYmxlRmlsZVwiKSkge1xuICAgICAgICAgICAgcmV0dXJuOyAvL3Nob3J0IG91dCwgaWYgc2V0dGluZyB0byBub3QgYXV0byBzdGFydCBpcyBlbmFibGVkXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoT21uaS5pc1ZhbGlkR3JhbW1hcihncmFtbWFyKSkge1xuICAgICAgICAgICAgaWYgKE9tbmkuaXNPZmYpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGdyYW1tYXIubmFtZSA9PT0gXCJKU09OXCIpIHtcbiAgICAgICAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGVkaXRvci5nZXRQYXRoKCkpID09PSBcInByb2plY3QuanNvblwiKSB7XG4gICAgICAgICAgICAgICAgaWYgKE9tbmkuaXNPZmYpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgdG9nZ2xlKCkge1xuICAgICAgICBpZiAoT21uaS5pc09mZikge1xuICAgICAgICAgICAgT21uaS5jb25uZWN0KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoT21uaS5pc09uKSB7XG4gICAgICAgICAgICBPbW5pLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBkZWFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjb25zdW1lU3RhdHVzQmFyKHN0YXR1c0JhcjogYW55KSB7XG4gICAgICAgIGxldCBmID0gcmVxdWlyZShcIi4vYXRvbS9zdGF0dXMtYmFyXCIpO1xuICAgICAgICBmLnN0YXR1c0Jhci5zZXR1cChzdGF0dXNCYXIpO1xuICAgICAgICBmID0gcmVxdWlyZShcIi4vYXRvbS9mcmFtZXdvcmstc2VsZWN0b3JcIik7XG4gICAgICAgIGYuZnJhbWV3b3JrU2VsZWN0b3Iuc2V0dXAoc3RhdHVzQmFyKTtcbiAgICAgICAgZiA9IHJlcXVpcmUoXCIuL2F0b20vZmVhdHVyZS1idXR0b25zXCIpO1xuICAgICAgICBmLmZlYXR1cmVFZGl0b3JCdXR0b25zLnNldHVwKHN0YXR1c0Jhcik7XG4gICAgfVxuXG4gICAgLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xuICAgIHB1YmxpYyBjb25zdW1lWWVvbWFuRW52aXJvbm1lbnQoZ2VuZXJhdG9yU2VydmljZTogYW55KSB7XG4gICAgICAgIGNvbnN0IHtnZW5lcmF0b3JBc3BuZXR9ID0gcmVxdWlyZShcIi4vYXRvbS9nZW5lcmF0b3ItYXNwbmV0XCIpO1xuICAgICAgICBnZW5lcmF0b3JBc3BuZXQuc2V0dXAoZ2VuZXJhdG9yU2VydmljZSk7XG4gICAgfVxuXG4gICAgcHVibGljIHByb3ZpZGVBdXRvY29tcGxldGUoKSB7XG4gICAgICAgIHJldHVybiByZXF1aXJlKFwiLi9zZXJ2aWNlcy9jb21wbGV0aW9uLXByb3ZpZGVyXCIpO1xuICAgIH1cblxuICAgIHB1YmxpYyBwcm92aWRlTGludGVyKCkge1xuICAgICAgICBjb25zdCBMaW50ZXJQcm92aWRlciA9IHJlcXVpcmUoXCIuL3NlcnZpY2VzL2xpbnRlci1wcm92aWRlclwiKTtcbiAgICAgICAgcmV0dXJuIExpbnRlclByb3ZpZGVyLnByb3ZpZGVyO1xuICAgIH1cblxuICAgIHB1YmxpYyBwcm92aWRlUHJvamVjdEpzb24oKSB7XG4gICAgICAgIHJldHVybiByZXF1aXJlKFwiLi9zZXJ2aWNlcy9wcm9qZWN0LXByb3ZpZGVyXCIpLmNvbmNhdChyZXF1aXJlKFwiLi9zZXJ2aWNlcy9mcmFtZXdvcmstcHJvdmlkZXJcIikpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjb25zdW1lTGludGVyKGxpbnRlcjogYW55KSB7XG4gICAgICAgIGNvbnN0IExpbnRlclByb3ZpZGVyID0gcmVxdWlyZShcIi4vc2VydmljZXMvbGludGVyLXByb3ZpZGVyXCIpO1xuICAgICAgICBjb25zdCBsaW50ZXJzID0gTGludGVyUHJvdmlkZXIucHJvdmlkZXI7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBfLmVhY2gobGludGVycywgbCA9PiB7XG4gICAgICAgICAgICAgICAgbGludGVyLmRlbGV0ZUxpbnRlcihsKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChMaW50ZXJQcm92aWRlci5pbml0KGxpbnRlcikpO1xuICAgIH1cbiAgICAvKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cblxuICAgIHByaXZhdGUgY29uZmlndXJlS2V5YmluZGluZ3MoKSB7XG4gICAgICAgIGxldCBkaXNwb3NhYmxlOiBFdmVudEtpdC5EaXNwb3NhYmxlO1xuICAgICAgICBjb25zdCBvbW5pc2hhcnBBZHZhbmNlZEZpbGVOZXcgPSBPbW5pLnBhY2thZ2VEaXIgKyBcIi9vbW5pc2hhcnAtYXRvbS9rZXltYXBzL29tbmlzaGFycC1maWxlLW5ldy5jc29uXCI7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLmVuYWJsZUFkdmFuY2VkRmlsZU5ld1wiLCAoZW5hYmxlZDogYm9vbGVhbikgPT4ge1xuICAgICAgICAgICAgaWYgKGVuYWJsZWQpIHtcbiAgICAgICAgICAgICAgICBkaXNwb3NhYmxlID0gYXRvbS5rZXltYXBzLmxvYWRLZXltYXAob21uaXNoYXJwQWR2YW5jZWRGaWxlTmV3KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGRpc3Bvc2FibGUpIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIGF0b20ua2V5bWFwcy5yZW1vdmVCaW5kaW5nc0Zyb21Tb3VyY2Uob21uaXNoYXJwQWR2YW5jZWRGaWxlTmV3KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBjb25maWcgPSB7XG4gICAgICAgIGF1dG9TdGFydE9uQ29tcGF0aWJsZUZpbGU6IHtcbiAgICAgICAgICAgIHRpdGxlOiBcIkF1dG9zdGFydCBPbW5pc2hhcnAgUm9zbHluXCIsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJBdXRvbWF0aWNhbGx5IHN0YXJ0cyBPbW5pc2hhcnAgUm9zbHluIHdoZW4gYSBjb21wYXRpYmxlIGZpbGUgaXMgb3BlbmVkLlwiLFxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICBkZWZhdWx0OiB0cnVlXG4gICAgICAgIH0sXG4gICAgICAgIGRldmVsb3Blck1vZGU6IHtcbiAgICAgICAgICAgIHRpdGxlOiBcIkRldmVsb3BlciBNb2RlXCIsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJPdXRwdXRzIGRldGFpbGVkIHNlcnZlciBjYWxscyBpbiBjb25zb2xlLmxvZ1wiLFxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICBzaG93RGlhZ25vc3RpY3NGb3JBbGxTb2x1dGlvbnM6IHtcbiAgICAgICAgICAgIHRpdGxlOiBcIlNob3cgRGlhZ25vc3RpY3MgZm9yIGFsbCBTb2x1dGlvbnNcIixcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkFkdmFuY2VkOiBUaGlzIHdpbGwgc2hvdyBkaWFnbm9zdGljcyBmb3IgYWxsIG9wZW4gc29sdXRpb25zLiAgTk9URTogTWF5IHRha2UgYSByZXN0YXJ0IG9yIGNoYW5nZSB0byBlYWNoIHNlcnZlciB0byB0YWtlIGVmZmVjdCB3aGVuIHR1cm5lZCBvbi5cIixcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgZW5hYmxlQWR2YW5jZWRGaWxlTmV3OiB7XG4gICAgICAgICAgICB0aXRsZTogXCJFbmFibGUgYEFkdmFuY2VkIEZpbGUgTmV3YFwiLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRW5hYmxlIGBBZHZhbmNlZCBGaWxlIE5ld2Agd2hlbiBkb2luZyBjdHJsLW4vY21kLW4gd2l0aGluIGEgQyMgZWRpdG9yLlwiLFxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICBkZWZhdWx0OiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICB1c2VMZWZ0TGFiZWxDb2x1bW5Gb3JTdWdnZXN0aW9uczoge1xuICAgICAgICAgICAgdGl0bGU6IFwiVXNlIExlZnQtTGFiZWwgY29sdW1uIGluIFN1Z2dlc3Rpb25zXCIsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTaG93cyByZXR1cm4gdHlwZXMgaW4gYSByaWdodC1hbGlnbmVkIGNvbHVtbiB0byB0aGUgbGVmdCBvZiB0aGUgY29tcGxldGlvbiBzdWdnZXN0aW9uIHRleHQuXCIsXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgIGRlZmF1bHQ6IGZhbHNlXG4gICAgICAgIH0sXG4gICAgICAgIHVzZUljb25zOiB7XG4gICAgICAgICAgICB0aXRsZTogXCJVc2UgdW5pcXVlIGljb25zIGZvciBraW5kIGluZGljYXRvcnMgaW4gU3VnZ2VzdGlvbnNcIixcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlNob3dzIGtpbmRzIHdpdGggdW5pcXVlIGljb25zIHJhdGhlciB0aGFuIGF1dG9jb21wbGV0ZSBkZWZhdWx0IHN0eWxlcy5cIixcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBhdXRvQWRqdXN0VHJlZVZpZXc6IHtcbiAgICAgICAgICAgIHRpdGxlOiBcIkFkanVzdCB0aGUgdHJlZSB2aWV3IHRvIG1hdGNoIHRoZSBzb2x1dGlvbiByb290LlwiLFxuICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJUaGlzIHdpbGwgYXV0b21hdGljYWxseSBhZGp1c3QgdGhlIHRyZWV2aWV3IHRvIGJlIHRoZSByb290IG9mIHRoZSBzb2x1dGlvbi5cIixcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgbmFnQWRqdXN0VHJlZVZpZXc6IHtcbiAgICAgICAgICAgIHRpdGxlOiBcIlNob3cgdGhlIG5vdGlmaWNhdGlvbnMgdG8gQWRqdXN0IHRoZSB0cmVlIHZpZXdcIixcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICBhdXRvQWRkRXh0ZXJuYWxQcm9qZWN0czoge1xuICAgICAgICAgICAgdGl0bGU6IFwiQWRkIGV4dGVybmFsIHByb2plY3RzIHRvIHRoZSB0cmVlIHZpZXcuXCIsXG4gICAgICAgICAgICBkZXNjcnB0aW9uOiBcIlRoaXMgd2lsbCBhdXRvbWF0aWNhbGx5IGFkZCBleHRlcm5hbCBzb3VyY2VzIHRvIHRoZSB0cmVlIHZpZXcuXFxuIEV4dGVybmFsIHNvdXJjZXMgYXJlIGFueSBwcm9qZWN0cyB0aGF0IGFyZSBsb2FkZWQgb3V0c2lkZSBvZiB0aGUgc29sdXRpb24gcm9vdC5cIixcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgbmFnQWRkRXh0ZXJuYWxQcm9qZWN0czoge1xuICAgICAgICAgICAgdGl0bGU6IFwiU2hvdyB0aGUgbm90aWZpY2F0aW9ucyB0byBhZGQgb3IgcmVtb3ZlIGV4dGVybmFsIHByb2plY3RzXCIsXG4gICAgICAgICAgICB0eXBlOiBcImJvb2xlYW5cIixcbiAgICAgICAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICAgICAgfSxcbiAgICAgICAgaGlkZUxpbnRlckludGVyZmFjZToge1xuICAgICAgICAgICAgdGl0bGU6IFwiSGlkZSB0aGUgbGludGVyIGludGVyZmFjZSB3aGVuIHVzaW5nIG9tbmlzaGFycC1hdG9tIGVkaXRvcnNcIixcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICB9LFxuICAgICAgICB3YW50TWV0YWRhdGE6IHtcbiAgICAgICAgICAgIHRpdGxlOiBcIlJlcXVlc3QgbWV0YWRhdGEgZGVmaW5pdGlvbiB3aXRoIEdvdG8gRGVmaW5pdGlvblwiLFxuICAgICAgICAgICAgZGVzY3JwdGlvbjogXCJSZXF1ZXN0IHN5bWJvbCBtZXRhZGF0YSBmcm9tIHRoZSBzZXJ2ZXIsIHdoZW4gdXNpbmcgZ28tdG8tZGVmaW5pdGlvbi4gIFRoaXMgaXMgZGlzYWJsZWQgYnkgZGVmYXVsdCBvbiBMaW51eCwgZHVlIHRvIGlzc3VlcyB3aXRoIFJvc2x5biBvbiBNb25vLlwiLFxuICAgICAgICAgICAgdHlwZTogXCJib29sZWFuXCIsXG4gICAgICAgICAgICBkZWZhdWx0OiB3aW4zMlxuICAgICAgICB9LFxuICAgICAgICBhbHRHb3RvRGVmaW5pdGlvbjoge1xuICAgICAgICAgICAgdGl0bGU6IFwiQWx0IEdvIFRvIERlZmluaXRpb25cIixcbiAgICAgICAgICAgIGRlc2NycHRpb246IFwiVXNlIHRoZSBhbHQga2V5IGluc3RlYWQgb2YgdGhlIGN0cmwvY21kIGtleSBmb3IgZ290byBkZWZpbnRpb24gbW91c2Ugb3Zlci5cIixcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgZGVmYXVsdDogZmFsc2VcbiAgICAgICAgfSxcbiAgICAgICAgc2hvd0hpZGRlbkRpYWdub3N0aWNzOiB7XG4gICAgICAgICAgICB0aXRsZTogXCJTaG93ICdIaWRkZW4nIGRpYWdub3N0aWNzIGluIHRoZSBsaW50ZXJcIixcbiAgICAgICAgICAgIGRlc2NycHRpb246IFwiU2hvdyBvciBoaWRlIGhpZGRlbiBkaWFnbm9zdGljcyBpbiB0aGUgbGludGVyLCB0aGlzIGRvZXMgbm90IGFmZmVjdCBncmV5aW5nIG91dCBvZiBuYW1lc3BhY2VzIHRoYXQgYXJlIHVudXNlZC5cIixcbiAgICAgICAgICAgIHR5cGU6IFwiYm9vbGVhblwiLFxuICAgICAgICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgICAgICB9XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBuZXcgT21uaVNoYXJwQXRvbTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

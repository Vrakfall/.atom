"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SolutionManager = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require("path");

var path = _interopRequireWildcard(_path);

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _solution2 = require("./solution");

var _atomProjects = require("./atom-projects");

var _compositeSolution = require("./composite-solution");

var _genericListView = require("../views/generic-list-view");

var _omnisharpTextEditor = require("./omnisharp-text-editor");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var openSelectList = void 0;

var SolutionInstanceManager = function () {
    function SolutionInstanceManager() {
        _classCallCheck(this, SolutionInstanceManager);

        this._unitTestMode_ = false;
        this._kick_in_the_pants_ = false;
        this._configurations = new Set();
        this._solutions = new Map();
        this._solutionProjects = new Map();
        this._temporarySolutions = new WeakMap();
        this._disposableSolutionMap = new WeakMap();
        this._findSolutionCache = new Map();
        this._candidateFinderCache = new Set();
        this._activated = false;
        this._nextIndex = 0;
        this._specialCaseExtensions = [".csx"];
        this._activeSolutions = [];
        this._observation = new _compositeSolution.SolutionObserver();
        this._combination = new _compositeSolution.SolutionAggregateObserver();
        this._activeSolution = new _rxjs.BehaviorSubject(null);
        this._activeSolutionObserable = this._activeSolution.distinctUntilChanged().filter(function (z) {
            return !!z;
        }).publishReplay(1).refCount();
        this._activatedSubject = new _rxjs.Subject();
    }

    _createClass(SolutionInstanceManager, [{
        key: "activate",
        value: function activate(activeEditor) {
            var _this = this;

            if (this._activated) return;
            this._disposable = new _omnisharpClient.CompositeDisposable();
            this._solutionDisposable = new _omnisharpClient.CompositeDisposable();
            this._atomProjects = new _atomProjects.AtomProjectTracker();
            this._disposable.add(this._atomProjects);
            this._activeSearch = Promise.resolve(undefined);
            this._subscribeToAtomProjectTracker();
            this._disposable.add(activeEditor.filter(function (z) {
                return !!z;
            }).flatMap(function (z) {
                return _this.getSolutionForEditor(z);
            }).subscribe(function (x) {
                return _this._activeSolution.next(x);
            }));
            this._atomProjects.activate();
            this._activated = true;
            this.activatedSubject.next(true);
            this._disposable.add(this._solutionDisposable);
        }
    }, {
        key: "connect",
        value: function connect() {
            this._solutions.forEach(function (solution) {
                return solution.connect();
            });
        }
    }, {
        key: "disconnect",
        value: function disconnect() {
            this._solutions.forEach(function (solution) {
                return solution.dispose();
            });
        }
    }, {
        key: "deactivate",
        value: function deactivate() {
            this._activated = false;
            this._disposable.dispose();
            this.disconnect();
            this._solutions.clear();
            this._solutionProjects.clear();
            this._findSolutionCache.clear();
        }
    }, {
        key: "_subscribeToAtomProjectTracker",
        value: function _subscribeToAtomProjectTracker() {
            var _this2 = this;

            this._disposable.add(this._atomProjects.removed.filter(function (z) {
                return _this2._solutions.has(z);
            }).subscribe(function (project) {
                return _this2._removeSolution(project);
            }));
            this._disposable.add(this._atomProjects.added.filter(function (project) {
                return !_this2._solutionProjects.has(project);
            }).map(function (project) {
                return _this2._candidateFinder(project).flatMap(function (candidates) {
                    return _rxjs.Observable.from(candidates.map(function (x) {
                        return x.path;
                    })).flatMap(function (x) {
                        return _this2._findRepositoryForPath(x);
                    }, function (path, repo) {
                        return { path: path, repo: repo };
                    }).toArray().toPromise().then(function (repos) {
                        var newCandidates = _lodash2.default.difference(candidates.map(function (z) {
                            return z.path;
                        }), fromIterator(_this2._solutions.keys())).map(function (z) {
                            return _lodash2.default.find(candidates, { path: z });
                        }).map(function (_ref) {
                            var path = _ref.path;
                            var isProject = _ref.isProject;

                            var found = _lodash2.default.find(repos, function (x) {
                                return x.path === path;
                            });
                            var repo = found && found.repo;
                            return { path: path, isProject: isProject, repo: repo };
                        });
                        return addCandidatesInOrder(newCandidates, function (candidate, repo, isProject) {
                            return _this2._addSolution(candidate, repo, isProject, { project: project });
                        });
                    });
                });
            }).subscribe(function (candidateObservable) {
                _this2._activeSearch = _this2._activeSearch.then(function () {
                    return candidateObservable;
                });
            }));
        }
    }, {
        key: "_findRepositoryForPath",
        value: function _findRepositoryForPath(workingPath) {
            return _rxjs.Observable.from(atom.project.getRepositories() || []).filter(function (x) {
                return !!x;
            }).flatMap(function (repo) {
                return repo.async.getWorkingDirectory();
            }, function (repo, directory) {
                return { repo: repo, directory: directory };
            }).filter(function (_ref2) {
                var directory = _ref2.directory;
                return path.normalize(directory) === path.normalize(workingPath);
            }).take(1).map(function (x) {
                return x.repo.async;
            });
        }
    }, {
        key: "_addSolution",
        value: function _addSolution(candidate, repo, isProject, _ref3) {
            var _this3 = this;

            var _ref3$temporary = _ref3.temporary;
            var temporary = _ref3$temporary === undefined ? false : _ref3$temporary;
            var project = _ref3.project;

            var projectPath = candidate;
            if (_lodash2.default.endsWith(candidate, ".sln")) {
                candidate = path.dirname(candidate);
            }
            var solution = void 0;
            if (this._solutions.has(candidate)) {
                solution = this._solutions.get(candidate);
            } else if (project && this._solutionProjects.has(project)) {
                solution = this._solutionProjects.get(project);
            }
            if (solution && !solution.isDisposed) {
                return _rxjs.Observable.of(solution);
            } else if (solution && solution.isDisposed) {
                var disposer = this._disposableSolutionMap.get(solution);
                disposer.dispose();
            }
            solution = new _solution2.Solution({
                projectPath: projectPath,
                index: ++this._nextIndex,
                temporary: temporary,
                repository: repo
            });
            if (!isProject) {
                solution.isFolderPerFile = true;
            }
            var cd = new _omnisharpClient.CompositeDisposable();
            this._solutionDisposable.add(cd);
            this._disposableSolutionMap.set(solution, cd);
            solution.disposable.add(_omnisharpClient.Disposable.create(function () {
                solution.connect = function () {
                    return _this3._addSolution(candidate, repo, isProject, { temporary: temporary, project: project });
                };
            }));
            cd.add(_omnisharpClient.Disposable.create(function () {
                _this3._solutionDisposable.remove(cd);
                _lodash2.default.pull(_this3._activeSolutions, solution);
                _this3._solutions.delete(candidate);
                if (_this3._temporarySolutions.has(solution)) {
                    _this3._temporarySolutions.delete(solution);
                }
                if (_this3._activeSolution.getValue() === solution) {
                    _this3._activeSolution.next(_this3._activeSolutions.length ? _this3._activeSolutions[0] : null);
                }
            }));
            cd.add(solution);
            this._configurations.forEach(function (config) {
                return config(solution);
            });
            this._solutions.set(candidate, solution);
            cd.add(this._observation.add(solution));
            cd.add(this._combination.add(solution));
            if (temporary) {
                var tempD = _omnisharpClient.Disposable.create(function () {});
                tempD.dispose();
                this._temporarySolutions.set(solution, new _omnisharpClient.RefCountDisposable(tempD));
            }
            this._activeSolutions.push(solution);
            if (this._activeSolutions.length === 1) this._activeSolution.next(solution);
            var result = this._addSolutionSubscriptions(solution, cd);
            solution.connect();
            return result;
        }
    }, {
        key: "_addSolutionSubscriptions",
        value: function _addSolutionSubscriptions(solution, cd) {
            var _this4 = this;

            var result = new _rxjs.AsyncSubject();
            var errorResult = solution.state.filter(function (z) {
                return z === _omnisharpClient.DriverState.Error;
            }).delay(100).take(1);
            cd.add(errorResult.subscribe(function () {
                return result.complete();
            }));
            cd.add(solution.model.observe.projectAdded.subscribe(function (project) {
                return _this4._solutionProjects.set(project.path, solution);
            }));
            cd.add(solution.model.observe.projectRemoved.subscribe(function (project) {
                return _this4._solutionProjects.delete(project.path);
            }));
            cd.add(solution.model.observe.projects.debounceTime(100).take(1).map(function () {
                return solution;
            }).timeout(15000, _rxjs.Scheduler.queue).subscribe(function () {
                result.next(solution);
                result.complete();
            }, function () {
                result.complete();
            }));
            return result;
        }
    }, {
        key: "_removeSolution",
        value: function _removeSolution(candidate) {
            if (_lodash2.default.endsWith(candidate, ".sln")) {
                candidate = path.dirname(candidate);
            }
            var solution = this._solutions.get(candidate);
            var refCountDisposable = solution && this._temporarySolutions.has(solution) && this._temporarySolutions.get(solution);
            if (refCountDisposable) {
                refCountDisposable.dispose();
                if (!refCountDisposable.isDisposed) {
                    return;
                }
            }
            if (solution) {
                solution.dispose();
                var disposable = this._disposableSolutionMap.get(solution);
                if (disposable) disposable.dispose();
            }
        }
    }, {
        key: "getSolutionForPath",
        value: function getSolutionForPath(path) {
            if (!path) return _rxjs.Observable.empty();
            var isFolderPerFile = _lodash2.default.some(this.__specialCaseExtensions, function (ext) {
                return _lodash2.default.endsWith(path, ext);
            });
            var location = path;
            if (!location) {
                return _rxjs.Observable.empty();
            }
            var solutionValue = this._getSolutionForUnderlyingPath(location, isFolderPerFile);
            if (solutionValue) return _rxjs.Observable.of(solutionValue);
            return this._findSolutionForUnderlyingPath(location, isFolderPerFile);
        }
    }, {
        key: "getSolutionForEditor",
        value: function getSolutionForEditor(editor) {
            return this._getSolutionForEditor(editor).filter(function () {
                return !editor.isDestroyed();
            });
        }
    }, {
        key: "_setupEditorWithContext",
        value: function _setupEditorWithContext(editor, solution) {
            var _this5 = this;

            var context = new _omnisharpTextEditor.OmnisharpEditorContext(editor, solution);
            var result = editor;
            result.omnisharp = context;
            var view = atom.views.getView(editor);
            view.classList.add("omnisharp-editor");
            context.solution.disposable.add(_omnisharpClient.Disposable.create(function () {
                context.dispose();
                result.omnisharp = null;
                view.classList.remove("omnisharp-editor");
            }));
            if (solution && !context.temp && this._temporarySolutions.has(solution)) {
                (function () {
                    var refCountDisposable = _this5._temporarySolutions.get(solution);
                    var disposable = refCountDisposable.getDisposable();
                    context.temp = true;
                    context.solution.disposable.add(editor.onDidDestroy(function () {
                        disposable.dispose();
                        _this5._removeSolution(solution.path);
                    }));
                })();
            }
            if (this.setupContextCallback) {
                this.setupContextCallback(result);
            }
            return result;
        }
    }, {
        key: "_getSolutionForEditor",
        value: function _getSolutionForEditor(editor) {
            var _this6 = this;

            if (!editor) {
                return _rxjs.Observable.empty();
            }
            var location = editor.getPath();
            if (!location) {
                return _rxjs.Observable.empty();
            }
            if ((0, _omnisharpTextEditor.isOmnisharpTextEditor)(editor)) {
                if (editor.omnisharp.metadata) {
                    return _rxjs.Observable.empty();
                }
                var _solution = editor.omnisharp.solution;
                if (_solution.currentState === _omnisharpClient.DriverState.Disconnected && atom.config.get("omnisharp-atom.autoStartOnCompatibleFile")) _solution.connect();
                if (_solution.currentState === _omnisharpClient.DriverState.Error) {
                    return _rxjs.Observable.empty();
                }
                return _rxjs.Observable.of(_solution);
            }
            var isFolderPerFile = _lodash2.default.some(this.__specialCaseExtensions, function (ext) {
                return _lodash2.default.endsWith(editor.getPath(), ext);
            });
            var solution = this._getSolutionForUnderlyingPath(location, isFolderPerFile);
            if (solution) {
                this._setupEditorWithContext(editor, solution);
                return _rxjs.Observable.of(solution);
            }
            return this._findSolutionForUnderlyingPath(location, isFolderPerFile).do(function (sln) {
                return _this6._setupEditorWithContext(editor, sln);
            });
        }
    }, {
        key: "_isPartOfAnyActiveSolution",
        value: function _isPartOfAnyActiveSolution(location, cb) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this._activeSolutions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var solution = _step.value;

                    if (solution.isFolderPerFile) continue;
                    var paths = solution.model.projects.map(function (z) {
                        return z.path;
                    });
                    var intersect = this._intersectPathMethod(location, paths);
                    if (intersect) {
                        return cb(intersect, solution);
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }
    }, {
        key: "_getSolutionForUnderlyingPath",
        value: function _getSolutionForUnderlyingPath(location, isFolderPerFile) {
            if (location === undefined) {
                return null;
            }
            if (isFolderPerFile) {
                var directory = path.dirname(location);
                if (this._solutions.has(directory)) return this._solutions.get(directory);
                return null;
            } else {
                var intersect = this._intersectPath(location);
                if (intersect) {
                    return this._solutions.get(intersect);
                }
            }
            if (!isFolderPerFile) {
                return this._isPartOfAnyActiveSolution(location, function (intersect, solution) {
                    return solution;
                });
            }
            return null;
        }
    }, {
        key: "_findSolutionForUnderlyingPath",
        value: function _findSolutionForUnderlyingPath(location, isFolderPerFile) {
            var _this7 = this;

            var directory = path.dirname(location);
            var subject = new _rxjs.AsyncSubject();
            if (!this._activated) {
                return this.activatedSubject.take(1).flatMap(function () {
                    return _this7._findSolutionForUnderlyingPath(location, isFolderPerFile);
                });
            }
            if (this._findSolutionCache.has(location)) {
                return this._findSolutionCache.get(location);
            }
            this._findSolutionCache.set(location, subject);
            subject.do({ complete: function complete() {
                    return _this7._findSolutionCache.delete(location);
                } });
            var project = this._intersectAtomProjectPath(directory);
            var cb = function cb(candidates) {
                if (!_this7._activated) {
                    _lodash2.default.delay(cb, 5000);
                    return;
                }
                if (!isFolderPerFile) {
                    var r = _this7._isPartOfAnyActiveSolution(location, function (intersect, solution) {
                        subject.next(solution);
                        subject.complete();
                        return true;
                    });
                    if (r) return;
                }
                _this7._activeSearch.then(function () {
                    return _rxjs.Observable.from(candidates.map(function (x) {
                        return x.path;
                    })).flatMap(function (x) {
                        return _this7._findRepositoryForPath(x);
                    }, function (path, repo) {
                        return { path: path, repo: repo };
                    }).toArray().toPromise();
                }).then(function (repos) {
                    var newCandidates = _lodash2.default.difference(candidates.map(function (z) {
                        return z.path;
                    }), fromIterator(_this7._solutions.keys())).map(function (z) {
                        return _lodash2.default.find(candidates, { path: z });
                    }).map(function (_ref4) {
                        var path = _ref4.path;
                        var isProject = _ref4.isProject;

                        var found = _lodash2.default.find(repos, function (x) {
                            return x.path === path;
                        });
                        var repo = found && found.repo;
                        return { path: path, isProject: isProject, repo: repo };
                    });
                    addCandidatesInOrder(newCandidates, function (candidate, repo, isProject) {
                        return _this7._addSolution(candidate, repo, isProject, { temporary: !project });
                    }).then(function () {
                        if (!isFolderPerFile) {
                            var _r = _this7._isPartOfAnyActiveSolution(location, function (intersect, solution) {
                                subject.next(solution);
                                subject.complete();
                                return;
                            });
                            if (_r) return;
                        }
                        var intersect = _this7._intersectPath(location) || _this7._intersectAtomProjectPath(location);
                        if (intersect) {
                            if (_this7._solutions.has(intersect)) {
                                subject.next(_this7._solutions.get(intersect));
                            }
                        } else {
                            atom.notifications.addInfo("Could not find a solution for \"" + location + "\"");
                        }
                        subject.complete();
                    });
                });
            };
            this._candidateFinder(directory).subscribe(cb);
            return subject;
        }
    }, {
        key: "_candidateFinder",
        value: function _candidateFinder(directory) {
            var _this8 = this;

            return _omnisharpClient.findCandidates.withCandidates(directory, this.logger, {
                solutionIndependentSourceFilesToSearch: this.__specialCaseExtensions.map(function (z) {
                    return "*" + z;
                })
            }).flatMap(function (candidates) {
                var slns = _lodash2.default.filter(candidates, function (x) {
                    return _lodash2.default.endsWith(x.path, ".sln");
                });
                if (slns.length > 1) {
                    var _ret2 = function () {
                        var items = _lodash2.default.difference(candidates, slns);
                        var asyncResult = new _rxjs.AsyncSubject();
                        asyncResult.next(items);
                        var listView = new _genericListView.GenericSelectListView("", slns.map(function (x) {
                            return { displayName: x.path, name: x.path };
                        }), function (result) {
                            items.unshift.apply(items, _toConsumableArray(slns.filter(function (x) {
                                return x.path === result;
                            })));
                            _lodash2.default.each(candidates, function (x) {
                                return _this8._candidateFinderCache.add(x.path);
                            });
                            asyncResult.complete();
                        }, function () {
                            asyncResult.complete();
                        });
                        listView.message.text("Please select a solution to load.");
                        if (openSelectList) {
                            openSelectList.onClosed.subscribe(function () {
                                if (!_lodash2.default.some(slns, function (x) {
                                    return _this8._candidateFinderCache.has(x.path);
                                })) {
                                    _lodash2.default.defer(function () {
                                        return listView.toggle();
                                    });
                                } else {
                                    asyncResult.complete();
                                }
                            });
                        } else {
                            _lodash2.default.defer(function () {
                                return listView.toggle();
                            });
                        }
                        asyncResult.do({ complete: function complete() {
                                return openSelectList = null;
                            } });
                        openSelectList = listView;
                        return {
                            v: asyncResult
                        };
                    }();

                    if ((typeof _ret2 === "undefined" ? "undefined" : _typeof(_ret2)) === "object") return _ret2.v;
                } else {
                    return _rxjs.Observable.of(candidates);
                }
            });
        }
    }, {
        key: "registerConfiguration",
        value: function registerConfiguration(callback) {
            this._configurations.add(callback);
            this._solutions.forEach(function (solution) {
                return callback(solution);
            });
        }
    }, {
        key: "_intersectPathMethod",
        value: function _intersectPathMethod(location, paths) {
            var validSolutionPaths = paths;
            var segments = location.split(path.sep);
            var mappedLocations = segments.map(function (loc, index) {
                return _lodash2.default.take(segments, index + 1).join(path.sep);
            });
            mappedLocations.reverse();
            var intersect = _lodash2.default.intersection(mappedLocations, validSolutionPaths)[0];
            if (intersect) {
                return intersect;
            }
        }
    }, {
        key: "_intersectPath",
        value: function _intersectPath(location) {
            return this._intersectPathMethod(location, fromIterator(this._solutions.entries()).filter(function (z) {
                return !z[1].isFolderPerFile;
            }).map(function (z) {
                return z[0];
            }));
        }
    }, {
        key: "_intersectAtomProjectPath",
        value: function _intersectAtomProjectPath(location) {
            return this._intersectPathMethod(location, this._atomProjects.paths);
        }
    }, {
        key: "logger",
        get: function get() {
            if (this._unitTestMode_ || this._kick_in_the_pants_) {
                return {
                    log: function log() {},
                    error: function error() {}
                };
            }
            return console;
        }
    }, {
        key: "__specialCaseExtensions",
        get: function get() {
            return this._specialCaseExtensions;
        }
    }, {
        key: "activeSolutions",
        get: function get() {
            return this._activeSolutions;
        }
    }, {
        key: "solutionObserver",
        get: function get() {
            return this._observation;
        }
    }, {
        key: "solutionAggregateObserver",
        get: function get() {
            return this._combination;
        }
    }, {
        key: "activeSolution",
        get: function get() {
            return this._activeSolutionObserable;
        }
    }, {
        key: "activatedSubject",
        get: function get() {
            return this._activatedSubject;
        }
    }, {
        key: "connected",
        get: function get() {
            var iterator = this._solutions.values();
            var result = iterator.next();
            while (!result.done) {
                if (result.value.currentState === _omnisharpClient.DriverState.Connected) return true;
            }return false;
        }
    }]);

    return SolutionInstanceManager;
}();

function addCandidatesInOrder(candidates, cb) {
    var asyncSubject = new _rxjs.AsyncSubject();
    if (!candidates.length) {
        asyncSubject.next(candidates);
        asyncSubject.complete();
        return asyncSubject.toPromise();
    }
    var cds = candidates.slice();
    var candidate = cds.shift();
    var handleCandidate = function handleCandidate(cand) {
        cb(cand.path, cand.repo, cand.isProject).subscribe({ complete: function complete() {
                if (cds.length) {
                    cand = cds.shift();
                    handleCandidate(cand);
                } else {
                    asyncSubject.next(candidates);
                    asyncSubject.complete();
                }
            } });
    };
    handleCandidate(candidate);
    return asyncSubject.toPromise();
}
function fromIterator(iterator) {
    var items = [];
    var result = iterator.next();
    while (!result.done) {
        items.push(result.value);
        result = iterator.next();
    }
    return items;
}
var SolutionManager = exports.SolutionManager = new SolutionInstanceManager();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlci5qcyIsImxpYi9zZXJ2ZXIvc29sdXRpb24tbWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0lDQVksSTs7QURDWjs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFFQTs7QUFDQTs7Ozs7Ozs7OztBQ0tBLElBQUksdUJBQUo7O0lBQ0EsdUI7QUFBQSx1Q0FBQTtBQUFBOztBQUVXLGFBQUEsY0FBQSxHQUFpQixLQUFqQjtBQUNBLGFBQUEsbUJBQUEsR0FBc0IsS0FBdEI7QUFpQkMsYUFBQSxlQUFBLEdBQWtCLElBQUksR0FBSixFQUFsQjtBQUNBLGFBQUEsVUFBQSxHQUFhLElBQUksR0FBSixFQUFiO0FBQ0EsYUFBQSxpQkFBQSxHQUFvQixJQUFJLEdBQUosRUFBcEI7QUFDQSxhQUFBLG1CQUFBLEdBQXNCLElBQUksT0FBSixFQUF0QjtBQUNBLGFBQUEsc0JBQUEsR0FBeUIsSUFBSSxPQUFKLEVBQXpCO0FBQ0EsYUFBQSxrQkFBQSxHQUFxQixJQUFJLEdBQUosRUFBckI7QUFDQSxhQUFBLHFCQUFBLEdBQXdCLElBQUksR0FBSixFQUF4QjtBQUVBLGFBQUEsVUFBQSxHQUFhLEtBQWI7QUFDQSxhQUFBLFVBQUEsR0FBYSxDQUFiO0FBSUEsYUFBQSxzQkFBQSxHQUF5QixDQUFDLE1BQUQsQ0FBekI7QUFHQSxhQUFBLGdCQUFBLEdBQStCLEVBQS9CO0FBTUEsYUFBQSxZQUFBLEdBQWUseUNBQWY7QUFNQSxhQUFBLFlBQUEsR0FBZSxrREFBZjtBQUtBLGFBQUEsZUFBQSxHQUFrQiwwQkFBOEIsSUFBOUIsQ0FBbEI7QUFDQSxhQUFBLHdCQUFBLEdBQTJCLEtBQUssZUFBTCxDQUFxQixvQkFBckIsR0FBNEMsTUFBNUMsQ0FBbUQ7QUFBQSxtQkFBSyxDQUFDLENBQUMsQ0FBUDtBQUFBLFNBQW5ELEVBQTZELGFBQTdELENBQTJFLENBQTNFLEVBQThFLFFBQTlF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dmVyL3NvbHV0aW9uLW1hbmFnZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBBc3luY1N1YmplY3QsIEJlaGF2aW9yU3ViamVjdCwgU2NoZWR1bGVyLCBTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IFJlZkNvdW50RGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBTb2x1dGlvbiB9IGZyb20gXCIuL3NvbHV0aW9uXCI7XG5pbXBvcnQgeyBBdG9tUHJvamVjdFRyYWNrZXIgfSBmcm9tIFwiLi9hdG9tLXByb2plY3RzXCI7XG5pbXBvcnQgeyBTb2x1dGlvbk9ic2VydmVyLCBTb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyIH0gZnJvbSBcIi4vY29tcG9zaXRlLXNvbHV0aW9uXCI7XG5pbXBvcnQgeyBEcml2ZXJTdGF0ZSwgZmluZENhbmRpZGF0ZXMgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgR2VuZXJpY1NlbGVjdExpc3RWaWV3IH0gZnJvbSBcIi4uL3ZpZXdzL2dlbmVyaWMtbGlzdC12aWV3XCI7XG5pbXBvcnQgeyBpc09tbmlzaGFycFRleHRFZGl0b3IsIE9tbmlzaGFycEVkaXRvckNvbnRleHQgfSBmcm9tIFwiLi9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcbmxldCBvcGVuU2VsZWN0TGlzdDtcbmNsYXNzIFNvbHV0aW9uSW5zdGFuY2VNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fdW5pdFRlc3RNb2RlXyA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9raWNrX2luX3RoZV9wYW50c18gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fY29uZmlndXJhdGlvbnMgPSBuZXcgU2V0KCk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25Qcm9qZWN0cyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zID0gbmV3IFdlYWtNYXAoKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZVNvbHV0aW9uTWFwID0gbmV3IFdlYWtNYXAoKTtcbiAgICAgICAgdGhpcy5fZmluZFNvbHV0aW9uQ2FjaGUgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuX2NhbmRpZGF0ZUZpbmRlckNhY2hlID0gbmV3IFNldCgpO1xuICAgICAgICB0aGlzLl9hY3RpdmF0ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fbmV4dEluZGV4ID0gMDtcbiAgICAgICAgdGhpcy5fc3BlY2lhbENhc2VFeHRlbnNpb25zID0gW1wiLmNzeFwiLF07XG4gICAgICAgIHRoaXMuX2FjdGl2ZVNvbHV0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLl9vYnNlcnZhdGlvbiA9IG5ldyBTb2x1dGlvbk9ic2VydmVyKCk7XG4gICAgICAgIHRoaXMuX2NvbWJpbmF0aW9uID0gbmV3IFNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXIoKTtcbiAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb24gPSBuZXcgQmVoYXZpb3JTdWJqZWN0KG51bGwpO1xuICAgICAgICB0aGlzLl9hY3RpdmVTb2x1dGlvbk9ic2VyYWJsZSA9IHRoaXMuX2FjdGl2ZVNvbHV0aW9uLmRpc3RpbmN0VW50aWxDaGFuZ2VkKCkuZmlsdGVyKHogPT4gISF6KS5wdWJsaXNoUmVwbGF5KDEpLnJlZkNvdW50KCk7XG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZFN1YmplY3QgPSBuZXcgU3ViamVjdCgpO1xuICAgIH1cbiAgICBnZXQgbG9nZ2VyKCkge1xuICAgICAgICBpZiAodGhpcy5fdW5pdFRlc3RNb2RlXyB8fCB0aGlzLl9raWNrX2luX3RoZV9wYW50c18pIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgbG9nOiAoKSA9PiB7IH0sXG4gICAgICAgICAgICAgICAgZXJyb3I6ICgpID0+IHsgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY29uc29sZTtcbiAgICB9XG4gICAgZ2V0IF9fc3BlY2lhbENhc2VFeHRlbnNpb25zKCkgeyByZXR1cm4gdGhpcy5fc3BlY2lhbENhc2VFeHRlbnNpb25zOyB9XG4gICAgZ2V0IGFjdGl2ZVNvbHV0aW9ucygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZVNvbHV0aW9ucztcbiAgICB9XG4gICAgZ2V0IHNvbHV0aW9uT2JzZXJ2ZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9vYnNlcnZhdGlvbjtcbiAgICB9XG4gICAgZ2V0IHNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb21iaW5hdGlvbjtcbiAgICB9XG4gICAgZ2V0IGFjdGl2ZVNvbHV0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlU29sdXRpb25PYnNlcmFibGU7XG4gICAgfVxuICAgIGdldCBhY3RpdmF0ZWRTdWJqZWN0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZhdGVkU3ViamVjdDtcbiAgICB9XG4gICAgYWN0aXZhdGUoYWN0aXZlRWRpdG9yKSB7XG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmF0ZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9hdG9tUHJvamVjdHMgPSBuZXcgQXRvbVByb2plY3RUcmFja2VyKCk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX2F0b21Qcm9qZWN0cyk7XG4gICAgICAgIHRoaXMuX2FjdGl2ZVNlYXJjaCA9IFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICB0aGlzLl9zdWJzY3JpYmVUb0F0b21Qcm9qZWN0VHJhY2tlcigpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChhY3RpdmVFZGl0b3JcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXG4gICAgICAgICAgICAuZmxhdE1hcCh6ID0+IHRoaXMuZ2V0U29sdXRpb25Gb3JFZGl0b3IoeikpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHggPT4gdGhpcy5fYWN0aXZlU29sdXRpb24ubmV4dCh4KSkpO1xuICAgICAgICB0aGlzLl9hdG9tUHJvamVjdHMuYWN0aXZhdGUoKTtcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5hY3RpdmF0ZWRTdWJqZWN0Lm5leHQodHJ1ZSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZSk7XG4gICAgfVxuICAgIGNvbm5lY3QoKSB7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5mb3JFYWNoKHNvbHV0aW9uID0+IHNvbHV0aW9uLmNvbm5lY3QoKSk7XG4gICAgfVxuICAgIGRpc2Nvbm5lY3QoKSB7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5mb3JFYWNoKHNvbHV0aW9uID0+IHNvbHV0aW9uLmRpc3Bvc2UoKSk7XG4gICAgfVxuICAgIGRlYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuX2FjdGl2YXRlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5jbGVhcigpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvblByb2plY3RzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLmNsZWFyKCk7XG4gICAgfVxuICAgIGdldCBjb25uZWN0ZWQoKSB7XG4gICAgICAgIGNvbnN0IGl0ZXJhdG9yID0gdGhpcy5fc29sdXRpb25zLnZhbHVlcygpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgIHdoaWxlICghcmVzdWx0LmRvbmUpXG4gICAgICAgICAgICBpZiAocmVzdWx0LnZhbHVlLmN1cnJlbnRTdGF0ZSA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGVkKVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIF9zdWJzY3JpYmVUb0F0b21Qcm9qZWN0VHJhY2tlcigpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fYXRvbVByb2plY3RzLnJlbW92ZWRcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB0aGlzLl9zb2x1dGlvbnMuaGFzKHopKVxuICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuX3JlbW92ZVNvbHV0aW9uKHByb2plY3QpKSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHRoaXMuX2F0b21Qcm9qZWN0cy5hZGRlZFxuICAgICAgICAgICAgLmZpbHRlcihwcm9qZWN0ID0+ICF0aGlzLl9zb2x1dGlvblByb2plY3RzLmhhcyhwcm9qZWN0KSlcbiAgICAgICAgICAgIC5tYXAocHJvamVjdCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY2FuZGlkYXRlRmluZGVyKHByb2plY3QpXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoY2FuZGlkYXRlcyA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbShjYW5kaWRhdGVzLm1hcCh4ID0+IHgucGF0aCkpXG4gICAgICAgICAgICAgICAgICAgIC5mbGF0TWFwKHggPT4gdGhpcy5fZmluZFJlcG9zaXRvcnlGb3JQYXRoKHgpLCAocGF0aCwgcmVwbykgPT4gKHsgcGF0aCwgcmVwbyB9KSlcbiAgICAgICAgICAgICAgICAgICAgLnRvQXJyYXkoKVxuICAgICAgICAgICAgICAgICAgICAudG9Qcm9taXNlKClcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4ocmVwb3MgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdDYW5kaWRhdGVzID0gXy5kaWZmZXJlbmNlKGNhbmRpZGF0ZXMubWFwKHogPT4gei5wYXRoKSwgZnJvbUl0ZXJhdG9yKHRoaXMuX3NvbHV0aW9ucy5rZXlzKCkpKS5tYXAoeiA9PiBfLmZpbmQoY2FuZGlkYXRlcywgeyBwYXRoOiB6IH0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoeyBwYXRoLCBpc1Byb2plY3QgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZm91bmQgPSBfLmZpbmQocmVwb3MsIHggPT4geC5wYXRoID09PSBwYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlcG8gPSBmb3VuZCAmJiBmb3VuZC5yZXBvO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgcGF0aCwgaXNQcm9qZWN0LCByZXBvIH07XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWRkQ2FuZGlkYXRlc0luT3JkZXIobmV3Q2FuZGlkYXRlcywgKGNhbmRpZGF0ZSwgcmVwbywgaXNQcm9qZWN0KSA9PiB0aGlzLl9hZGRTb2x1dGlvbihjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgeyBwcm9qZWN0IH0pKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAgICAgLnN1YnNjcmliZShjYW5kaWRhdGVPYnNlcnZhYmxlID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVNlYXJjaCA9IHRoaXMuX2FjdGl2ZVNlYXJjaC50aGVuKCgpID0+IGNhbmRpZGF0ZU9ic2VydmFibGUpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIF9maW5kUmVwb3NpdG9yeUZvclBhdGgod29ya2luZ1BhdGgpIHtcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbShhdG9tLnByb2plY3QuZ2V0UmVwb3NpdG9yaWVzKCkgfHwgW10pXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4KVxuICAgICAgICAgICAgLmZsYXRNYXAocmVwbyA9PiByZXBvLmFzeW5jLmdldFdvcmtpbmdEaXJlY3RvcnkoKSwgKHJlcG8sIGRpcmVjdG9yeSkgPT4gKHsgcmVwbywgZGlyZWN0b3J5IH0pKVxuICAgICAgICAgICAgLmZpbHRlcigoeyBkaXJlY3RvcnkgfSkgPT4gcGF0aC5ub3JtYWxpemUoZGlyZWN0b3J5KSA9PT0gcGF0aC5ub3JtYWxpemUod29ya2luZ1BhdGgpKVxuICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgIC5tYXAoeCA9PiB4LnJlcG8uYXN5bmMpO1xuICAgIH1cbiAgICBfYWRkU29sdXRpb24oY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIHsgdGVtcG9yYXJ5ID0gZmFsc2UsIHByb2plY3QgfSkge1xuICAgICAgICBjb25zdCBwcm9qZWN0UGF0aCA9IGNhbmRpZGF0ZTtcbiAgICAgICAgaWYgKF8uZW5kc1dpdGgoY2FuZGlkYXRlLCBcIi5zbG5cIikpIHtcbiAgICAgICAgICAgIGNhbmRpZGF0ZSA9IHBhdGguZGlybmFtZShjYW5kaWRhdGUpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzb2x1dGlvbjtcbiAgICAgICAgaWYgKHRoaXMuX3NvbHV0aW9ucy5oYXMoY2FuZGlkYXRlKSkge1xuICAgICAgICAgICAgc29sdXRpb24gPSB0aGlzLl9zb2x1dGlvbnMuZ2V0KGNhbmRpZGF0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocHJvamVjdCAmJiB0aGlzLl9zb2x1dGlvblByb2plY3RzLmhhcyhwcm9qZWN0KSkge1xuICAgICAgICAgICAgc29sdXRpb24gPSB0aGlzLl9zb2x1dGlvblByb2plY3RzLmdldChwcm9qZWN0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc29sdXRpb24gJiYgIXNvbHV0aW9uLmlzRGlzcG9zZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHNvbHV0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzb2x1dGlvbiAmJiBzb2x1dGlvbi5pc0Rpc3Bvc2VkKSB7XG4gICAgICAgICAgICBjb25zdCBkaXNwb3NlciA9IHRoaXMuX2Rpc3Bvc2FibGVTb2x1dGlvbk1hcC5nZXQoc29sdXRpb24pO1xuICAgICAgICAgICAgZGlzcG9zZXIuZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIHNvbHV0aW9uID0gbmV3IFNvbHV0aW9uKHtcbiAgICAgICAgICAgIHByb2plY3RQYXRoOiBwcm9qZWN0UGF0aCxcbiAgICAgICAgICAgIGluZGV4OiArK3RoaXMuX25leHRJbmRleCxcbiAgICAgICAgICAgIHRlbXBvcmFyeTogdGVtcG9yYXJ5LFxuICAgICAgICAgICAgcmVwb3NpdG9yeTogcmVwb1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFpc1Byb2plY3QpIHtcbiAgICAgICAgICAgIHNvbHV0aW9uLmlzRm9sZGVyUGVyRmlsZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuYWRkKGNkKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZVNvbHV0aW9uTWFwLnNldChzb2x1dGlvbiwgY2QpO1xuICAgICAgICBzb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBzb2x1dGlvbi5jb25uZWN0ID0gKCkgPT4gdGhpcy5fYWRkU29sdXRpb24oY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIHsgdGVtcG9yYXJ5LCBwcm9qZWN0IH0pO1xuICAgICAgICB9KSk7XG4gICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUucmVtb3ZlKGNkKTtcbiAgICAgICAgICAgIF8ucHVsbCh0aGlzLl9hY3RpdmVTb2x1dGlvbnMsIHNvbHV0aW9uKTtcbiAgICAgICAgICAgIHRoaXMuX3NvbHV0aW9ucy5kZWxldGUoY2FuZGlkYXRlKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuaGFzKHNvbHV0aW9uKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5kZWxldGUoc29sdXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZVNvbHV0aW9uLmdldFZhbHVlKCkgPT09IHNvbHV0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb24ubmV4dCh0aGlzLl9hY3RpdmVTb2x1dGlvbnMubGVuZ3RoID8gdGhpcy5fYWN0aXZlU29sdXRpb25zWzBdIDogbnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICAgICAgY2QuYWRkKHNvbHV0aW9uKTtcbiAgICAgICAgdGhpcy5fY29uZmlndXJhdGlvbnMuZm9yRWFjaChjb25maWcgPT4gY29uZmlnKHNvbHV0aW9uKSk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5zZXQoY2FuZGlkYXRlLCBzb2x1dGlvbik7XG4gICAgICAgIGNkLmFkZCh0aGlzLl9vYnNlcnZhdGlvbi5hZGQoc29sdXRpb24pKTtcbiAgICAgICAgY2QuYWRkKHRoaXMuX2NvbWJpbmF0aW9uLmFkZChzb2x1dGlvbikpO1xuICAgICAgICBpZiAodGVtcG9yYXJ5KSB7XG4gICAgICAgICAgICBjb25zdCB0ZW1wRCA9IERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHsgfSk7XG4gICAgICAgICAgICB0ZW1wRC5kaXNwb3NlKCk7XG4gICAgICAgICAgICB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuc2V0KHNvbHV0aW9uLCBuZXcgUmVmQ291bnREaXNwb3NhYmxlKHRlbXBEKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb25zLnB1c2goc29sdXRpb24pO1xuICAgICAgICBpZiAodGhpcy5fYWN0aXZlU29sdXRpb25zLmxlbmd0aCA9PT0gMSlcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVNvbHV0aW9uLm5leHQoc29sdXRpb24pO1xuICAgICAgICBjb25zdCByZXN1bHQgPSB0aGlzLl9hZGRTb2x1dGlvblN1YnNjcmlwdGlvbnMoc29sdXRpb24sIGNkKTtcbiAgICAgICAgc29sdXRpb24uY29ubmVjdCgpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBfYWRkU29sdXRpb25TdWJzY3JpcHRpb25zKHNvbHV0aW9uLCBjZCkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgQXN5bmNTdWJqZWN0KCk7XG4gICAgICAgIGNvbnN0IGVycm9yUmVzdWx0ID0gc29sdXRpb24uc3RhdGVcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6ID09PSBEcml2ZXJTdGF0ZS5FcnJvcilcbiAgICAgICAgICAgIC5kZWxheSgxMDApXG4gICAgICAgICAgICAudGFrZSgxKTtcbiAgICAgICAgY2QuYWRkKGVycm9yUmVzdWx0LnN1YnNjcmliZSgoKSA9PiByZXN1bHQuY29tcGxldGUoKSkpO1xuICAgICAgICBjZC5hZGQoc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0QWRkZWQuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5zZXQocHJvamVjdC5wYXRoLCBzb2x1dGlvbikpKTtcbiAgICAgICAgY2QuYWRkKHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdFJlbW92ZWQuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5kZWxldGUocHJvamVjdC5wYXRoKSkpO1xuICAgICAgICBjZC5hZGQoc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0c1xuICAgICAgICAgICAgLmRlYm91bmNlVGltZSgxMDApXG4gICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgLm1hcCgoKSA9PiBzb2x1dGlvbilcbiAgICAgICAgICAgIC50aW1lb3V0KDE1MDAwLCBTY2hlZHVsZXIucXVldWUpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIHJlc3VsdC5uZXh0KHNvbHV0aW9uKTtcbiAgICAgICAgICAgIHJlc3VsdC5jb21wbGV0ZSgpO1xuICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICByZXN1bHQuY29tcGxldGUoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBfcmVtb3ZlU29sdXRpb24oY2FuZGlkYXRlKSB7XG4gICAgICAgIGlmIChfLmVuZHNXaXRoKGNhbmRpZGF0ZSwgXCIuc2xuXCIpKSB7XG4gICAgICAgICAgICBjYW5kaWRhdGUgPSBwYXRoLmRpcm5hbWUoY2FuZGlkYXRlKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzb2x1dGlvbiA9IHRoaXMuX3NvbHV0aW9ucy5nZXQoY2FuZGlkYXRlKTtcbiAgICAgICAgY29uc3QgcmVmQ291bnREaXNwb3NhYmxlID0gc29sdXRpb24gJiYgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmhhcyhzb2x1dGlvbikgJiYgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmdldChzb2x1dGlvbik7XG4gICAgICAgIGlmIChyZWZDb3VudERpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgIHJlZkNvdW50RGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICBpZiAoIXJlZkNvdW50RGlzcG9zYWJsZS5pc0Rpc3Bvc2VkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChzb2x1dGlvbikge1xuICAgICAgICAgICAgc29sdXRpb24uZGlzcG9zZSgpO1xuICAgICAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IHRoaXMuX2Rpc3Bvc2FibGVTb2x1dGlvbk1hcC5nZXQoc29sdXRpb24pO1xuICAgICAgICAgICAgaWYgKGRpc3Bvc2FibGUpXG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0U29sdXRpb25Gb3JQYXRoKHBhdGgpIHtcbiAgICAgICAgaWYgKCFwYXRoKVxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgY29uc3QgaXNGb2xkZXJQZXJGaWxlID0gXy5zb21lKHRoaXMuX19zcGVjaWFsQ2FzZUV4dGVuc2lvbnMsIGV4dCA9PiBfLmVuZHNXaXRoKHBhdGgsIGV4dCkpO1xuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IHBhdGg7XG4gICAgICAgIGlmICghbG9jYXRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc29sdXRpb25WYWx1ZSA9IHRoaXMuX2dldFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSk7XG4gICAgICAgIGlmIChzb2x1dGlvblZhbHVlKVxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2Yoc29sdXRpb25WYWx1ZSk7XG4gICAgICAgIHJldHVybiB0aGlzLl9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKTtcbiAgICB9XG4gICAgZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRTb2x1dGlvbkZvckVkaXRvcihlZGl0b3IpLmZpbHRlcigoKSA9PiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpO1xuICAgIH1cbiAgICBfc2V0dXBFZGl0b3JXaXRoQ29udGV4dChlZGl0b3IsIHNvbHV0aW9uKSB7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBuZXcgT21uaXNoYXJwRWRpdG9yQ29udGV4dChlZGl0b3IsIHNvbHV0aW9uKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gZWRpdG9yO1xuICAgICAgICByZXN1bHQub21uaXNoYXJwID0gY29udGV4dDtcbiAgICAgICAgY29uc3QgdmlldyA9IGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpO1xuICAgICAgICB2aWV3LmNsYXNzTGlzdC5hZGQoXCJvbW5pc2hhcnAtZWRpdG9yXCIpO1xuICAgICAgICBjb250ZXh0LnNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnRleHQuZGlzcG9zZSgpO1xuICAgICAgICAgICAgcmVzdWx0Lm9tbmlzaGFycCA9IG51bGw7XG4gICAgICAgICAgICB2aWV3LmNsYXNzTGlzdC5yZW1vdmUoXCJvbW5pc2hhcnAtZWRpdG9yXCIpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGlmIChzb2x1dGlvbiAmJiAhY29udGV4dC50ZW1wICYmIHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5oYXMoc29sdXRpb24pKSB7XG4gICAgICAgICAgICBjb25zdCByZWZDb3VudERpc3Bvc2FibGUgPSB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuZ2V0KHNvbHV0aW9uKTtcbiAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSByZWZDb3VudERpc3Bvc2FibGUuZ2V0RGlzcG9zYWJsZSgpO1xuICAgICAgICAgICAgY29udGV4dC50ZW1wID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnRleHQuc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoZWRpdG9yLm9uRGlkRGVzdHJveSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcmVtb3ZlU29sdXRpb24oc29sdXRpb24ucGF0aCk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuc2V0dXBDb250ZXh0Q2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMuc2V0dXBDb250ZXh0Q2FsbGJhY2socmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBfZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yKSB7XG4gICAgICAgIGlmICghZWRpdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eSgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxvY2F0aW9uID0gZWRpdG9yLmdldFBhdGgoKTtcbiAgICAgICAgaWYgKCFsb2NhdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikpIHtcbiAgICAgICAgICAgIGlmIChlZGl0b3Iub21uaXNoYXJwLm1ldGFkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHNvbHV0aW9uID0gZWRpdG9yLm9tbmlzaGFycC5zb2x1dGlvbjtcbiAgICAgICAgICAgIGlmIChzb2x1dGlvbi5jdXJyZW50U3RhdGUgPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZCAmJiBhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbS5hdXRvU3RhcnRPbkNvbXBhdGlibGVGaWxlXCIpKVxuICAgICAgICAgICAgICAgIHNvbHV0aW9uLmNvbm5lY3QoKTtcbiAgICAgICAgICAgIGlmIChzb2x1dGlvbi5jdXJyZW50U3RhdGUgPT09IERyaXZlclN0YXRlLkVycm9yKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHNvbHV0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpc0ZvbGRlclBlckZpbGUgPSBfLnNvbWUodGhpcy5fX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucywgZXh0ID0+IF8uZW5kc1dpdGgoZWRpdG9yLmdldFBhdGgoKSwgZXh0KSk7XG4gICAgICAgIGNvbnN0IHNvbHV0aW9uID0gdGhpcy5fZ2V0U29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKTtcbiAgICAgICAgaWYgKHNvbHV0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXR1cEVkaXRvcldpdGhDb250ZXh0KGVkaXRvciwgc29sdXRpb24pO1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2Yoc29sdXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKVxuICAgICAgICAgICAgLmRvKChzbG4pID0+IHRoaXMuX3NldHVwRWRpdG9yV2l0aENvbnRleHQoZWRpdG9yLCBzbG4pKTtcbiAgICB9XG4gICAgX2lzUGFydE9mQW55QWN0aXZlU29sdXRpb24obG9jYXRpb24sIGNiKSB7XG4gICAgICAgIGZvciAoY29uc3Qgc29sdXRpb24gb2YgdGhpcy5fYWN0aXZlU29sdXRpb25zKSB7XG4gICAgICAgICAgICBpZiAoc29sdXRpb24uaXNGb2xkZXJQZXJGaWxlKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgY29uc3QgcGF0aHMgPSBzb2x1dGlvbi5tb2RlbC5wcm9qZWN0cy5tYXAoeiA9PiB6LnBhdGgpO1xuICAgICAgICAgICAgY29uc3QgaW50ZXJzZWN0ID0gdGhpcy5faW50ZXJzZWN0UGF0aE1ldGhvZChsb2NhdGlvbiwgcGF0aHMpO1xuICAgICAgICAgICAgaWYgKGludGVyc2VjdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjYihpbnRlcnNlY3QsIHNvbHV0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBfZ2V0U29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKSB7XG4gICAgICAgIGlmIChsb2NhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNGb2xkZXJQZXJGaWxlKSB7XG4gICAgICAgICAgICBjb25zdCBkaXJlY3RvcnkgPSBwYXRoLmRpcm5hbWUobG9jYXRpb24pO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3NvbHV0aW9ucy5oYXMoZGlyZWN0b3J5KSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fc29sdXRpb25zLmdldChkaXJlY3RvcnkpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBpbnRlcnNlY3QgPSB0aGlzLl9pbnRlcnNlY3RQYXRoKGxvY2F0aW9uKTtcbiAgICAgICAgICAgIGlmIChpbnRlcnNlY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fc29sdXRpb25zLmdldChpbnRlcnNlY3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghaXNGb2xkZXJQZXJGaWxlKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXNQYXJ0T2ZBbnlBY3RpdmVTb2x1dGlvbihsb2NhdGlvbiwgKGludGVyc2VjdCwgc29sdXRpb24pID0+IHNvbHV0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgX2ZpbmRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpIHtcbiAgICAgICAgY29uc3QgZGlyZWN0b3J5ID0gcGF0aC5kaXJuYW1lKGxvY2F0aW9uKTtcbiAgICAgICAgY29uc3Qgc3ViamVjdCA9IG5ldyBBc3luY1N1YmplY3QoKTtcbiAgICAgICAgaWYgKCF0aGlzLl9hY3RpdmF0ZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFjdGl2YXRlZFN1YmplY3QudGFrZSgxKVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IHRoaXMuX2ZpbmRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fZmluZFNvbHV0aW9uQ2FjaGUuaGFzKGxvY2F0aW9uKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLmdldChsb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZmluZFNvbHV0aW9uQ2FjaGUuc2V0KGxvY2F0aW9uLCBzdWJqZWN0KTtcbiAgICAgICAgc3ViamVjdC5kbyh7IGNvbXBsZXRlOiAoKSA9PiB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5kZWxldGUobG9jYXRpb24pIH0pO1xuICAgICAgICBjb25zdCBwcm9qZWN0ID0gdGhpcy5faW50ZXJzZWN0QXRvbVByb2plY3RQYXRoKGRpcmVjdG9yeSk7XG4gICAgICAgIGNvbnN0IGNiID0gKGNhbmRpZGF0ZXMpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy5fYWN0aXZhdGVkKSB7XG4gICAgICAgICAgICAgICAgXy5kZWxheShjYiwgNTAwMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCFpc0ZvbGRlclBlckZpbGUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByID0gdGhpcy5faXNQYXJ0T2ZBbnlBY3RpdmVTb2x1dGlvbihsb2NhdGlvbiwgKGludGVyc2VjdCwgc29sdXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHNvbHV0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAocilcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fYWN0aXZlU2VhcmNoLnRoZW4oKCkgPT4gT2JzZXJ2YWJsZS5mcm9tKGNhbmRpZGF0ZXMubWFwKHggPT4geC5wYXRoKSlcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCh4ID0+IHRoaXMuX2ZpbmRSZXBvc2l0b3J5Rm9yUGF0aCh4KSwgKHBhdGgsIHJlcG8pID0+ICh7IHBhdGgsIHJlcG8gfSkpXG4gICAgICAgICAgICAgICAgLnRvQXJyYXkoKVxuICAgICAgICAgICAgICAgIC50b1Byb21pc2UoKSlcbiAgICAgICAgICAgICAgICAudGhlbihyZXBvcyA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3Q2FuZGlkYXRlcyA9IF8uZGlmZmVyZW5jZShjYW5kaWRhdGVzLm1hcCh6ID0+IHoucGF0aCksIGZyb21JdGVyYXRvcih0aGlzLl9zb2x1dGlvbnMua2V5cygpKSkubWFwKHogPT4gXy5maW5kKGNhbmRpZGF0ZXMsIHsgcGF0aDogeiB9KSlcbiAgICAgICAgICAgICAgICAgICAgLm1hcCgoeyBwYXRoLCBpc1Byb2plY3QgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmb3VuZCA9IF8uZmluZChyZXBvcywgeCA9PiB4LnBhdGggPT09IHBhdGgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCByZXBvID0gZm91bmQgJiYgZm91bmQucmVwbztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgcGF0aCwgaXNQcm9qZWN0LCByZXBvIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYWRkQ2FuZGlkYXRlc0luT3JkZXIobmV3Q2FuZGlkYXRlcywgKGNhbmRpZGF0ZSwgcmVwbywgaXNQcm9qZWN0KSA9PiB0aGlzLl9hZGRTb2x1dGlvbihjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgeyB0ZW1wb3Jhcnk6ICFwcm9qZWN0IH0pKVxuICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNGb2xkZXJQZXJGaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByID0gdGhpcy5faXNQYXJ0T2ZBbnlBY3RpdmVTb2x1dGlvbihsb2NhdGlvbiwgKGludGVyc2VjdCwgc29sdXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQoc29sdXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YmplY3QuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBpbnRlcnNlY3QgPSB0aGlzLl9pbnRlcnNlY3RQYXRoKGxvY2F0aW9uKSB8fCB0aGlzLl9pbnRlcnNlY3RBdG9tUHJvamVjdFBhdGgobG9jYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW50ZXJzZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fc29sdXRpb25zLmhhcyhpbnRlcnNlY3QpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHRoaXMuX3NvbHV0aW9ucy5nZXQoaW50ZXJzZWN0KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhgQ291bGQgbm90IGZpbmQgYSBzb2x1dGlvbiBmb3IgXCIke2xvY2F0aW9ufVwiYCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX2NhbmRpZGF0ZUZpbmRlcihkaXJlY3RvcnkpLnN1YnNjcmliZShjYik7XG4gICAgICAgIHJldHVybiBzdWJqZWN0O1xuICAgIH1cbiAgICBfY2FuZGlkYXRlRmluZGVyKGRpcmVjdG9yeSkge1xuICAgICAgICByZXR1cm4gZmluZENhbmRpZGF0ZXMud2l0aENhbmRpZGF0ZXMoZGlyZWN0b3J5LCB0aGlzLmxvZ2dlciwge1xuICAgICAgICAgICAgc29sdXRpb25JbmRlcGVuZGVudFNvdXJjZUZpbGVzVG9TZWFyY2g6IHRoaXMuX19zcGVjaWFsQ2FzZUV4dGVuc2lvbnMubWFwKHogPT4gXCIqXCIgKyB6KVxuICAgICAgICB9KVxuICAgICAgICAgICAgLmZsYXRNYXAoY2FuZGlkYXRlcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBzbG5zID0gXy5maWx0ZXIoY2FuZGlkYXRlcywgeCA9PiBfLmVuZHNXaXRoKHgucGF0aCwgXCIuc2xuXCIpKTtcbiAgICAgICAgICAgIGlmIChzbG5zLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtcyA9IF8uZGlmZmVyZW5jZShjYW5kaWRhdGVzLCBzbG5zKTtcbiAgICAgICAgICAgICAgICBjb25zdCBhc3luY1Jlc3VsdCA9IG5ldyBBc3luY1N1YmplY3QoKTtcbiAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5uZXh0KGl0ZW1zKTtcbiAgICAgICAgICAgICAgICBjb25zdCBsaXN0VmlldyA9IG5ldyBHZW5lcmljU2VsZWN0TGlzdFZpZXcoXCJcIiwgc2xucy5tYXAoeCA9PiAoeyBkaXNwbGF5TmFtZTogeC5wYXRoLCBuYW1lOiB4LnBhdGggfSkpLCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zLnVuc2hpZnQoLi4uc2xucy5maWx0ZXIoeCA9PiB4LnBhdGggPT09IHJlc3VsdCkpO1xuICAgICAgICAgICAgICAgICAgICBfLmVhY2goY2FuZGlkYXRlcywgeCA9PiB0aGlzLl9jYW5kaWRhdGVGaW5kZXJDYWNoZS5hZGQoeC5wYXRoKSk7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jUmVzdWx0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGxpc3RWaWV3Lm1lc3NhZ2UudGV4dChcIlBsZWFzZSBzZWxlY3QgYSBzb2x1dGlvbiB0byBsb2FkLlwiKTtcbiAgICAgICAgICAgICAgICBpZiAob3BlblNlbGVjdExpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgb3BlblNlbGVjdExpc3Qub25DbG9zZWQuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghXy5zb21lKHNsbnMsIHggPT4gdGhpcy5fY2FuZGlkYXRlRmluZGVyQ2FjaGUuaGFzKHgucGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXy5kZWZlcigoKSA9PiBsaXN0Vmlldy50b2dnbGUoKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIF8uZGVmZXIoKCkgPT4gbGlzdFZpZXcudG9nZ2xlKCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5kbyh7IGNvbXBsZXRlOiAoKSA9PiBvcGVuU2VsZWN0TGlzdCA9IG51bGwgfSk7XG4gICAgICAgICAgICAgICAgb3BlblNlbGVjdExpc3QgPSBsaXN0VmlldztcbiAgICAgICAgICAgICAgICByZXR1cm4gYXN5bmNSZXN1bHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihjYW5kaWRhdGVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJlZ2lzdGVyQ29uZmlndXJhdGlvbihjYWxsYmFjaykge1xuICAgICAgICB0aGlzLl9jb25maWd1cmF0aW9ucy5hZGQoY2FsbGJhY2spO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZm9yRWFjaChzb2x1dGlvbiA9PiBjYWxsYmFjayhzb2x1dGlvbikpO1xuICAgIH1cbiAgICBfaW50ZXJzZWN0UGF0aE1ldGhvZChsb2NhdGlvbiwgcGF0aHMpIHtcbiAgICAgICAgY29uc3QgdmFsaWRTb2x1dGlvblBhdGhzID0gcGF0aHM7XG4gICAgICAgIGNvbnN0IHNlZ21lbnRzID0gbG9jYXRpb24uc3BsaXQocGF0aC5zZXApO1xuICAgICAgICBjb25zdCBtYXBwZWRMb2NhdGlvbnMgPSBzZWdtZW50cy5tYXAoKGxvYywgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBfLnRha2Uoc2VnbWVudHMsIGluZGV4ICsgMSkuam9pbihwYXRoLnNlcCk7XG4gICAgICAgIH0pO1xuICAgICAgICBtYXBwZWRMb2NhdGlvbnMucmV2ZXJzZSgpO1xuICAgICAgICBjb25zdCBpbnRlcnNlY3QgPSBfLmludGVyc2VjdGlvbihtYXBwZWRMb2NhdGlvbnMsIHZhbGlkU29sdXRpb25QYXRocylbMF07XG4gICAgICAgIGlmIChpbnRlcnNlY3QpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnRlcnNlY3Q7XG4gICAgICAgIH1cbiAgICB9XG4gICAgX2ludGVyc2VjdFBhdGgobG9jYXRpb24pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ludGVyc2VjdFBhdGhNZXRob2QobG9jYXRpb24sIGZyb21JdGVyYXRvcih0aGlzLl9zb2x1dGlvbnMuZW50cmllcygpKVxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6WzFdLmlzRm9sZGVyUGVyRmlsZSkubWFwKHogPT4gelswXSkpO1xuICAgIH1cbiAgICBfaW50ZXJzZWN0QXRvbVByb2plY3RQYXRoKGxvY2F0aW9uKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pbnRlcnNlY3RQYXRoTWV0aG9kKGxvY2F0aW9uLCB0aGlzLl9hdG9tUHJvamVjdHMucGF0aHMpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFkZENhbmRpZGF0ZXNJbk9yZGVyKGNhbmRpZGF0ZXMsIGNiKSB7XG4gICAgY29uc3QgYXN5bmNTdWJqZWN0ID0gbmV3IEFzeW5jU3ViamVjdCgpO1xuICAgIGlmICghY2FuZGlkYXRlcy5sZW5ndGgpIHtcbiAgICAgICAgYXN5bmNTdWJqZWN0Lm5leHQoY2FuZGlkYXRlcyk7XG4gICAgICAgIGFzeW5jU3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgICByZXR1cm4gYXN5bmNTdWJqZWN0LnRvUHJvbWlzZSgpO1xuICAgIH1cbiAgICBjb25zdCBjZHMgPSBjYW5kaWRhdGVzLnNsaWNlKCk7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gY2RzLnNoaWZ0KCk7XG4gICAgY29uc3QgaGFuZGxlQ2FuZGlkYXRlID0gKGNhbmQpID0+IHtcbiAgICAgICAgY2IoY2FuZC5wYXRoLCBjYW5kLnJlcG8sIGNhbmQuaXNQcm9qZWN0KVxuICAgICAgICAgICAgLnN1YnNjcmliZSh7IGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGNkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FuZCA9IGNkcy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVDYW5kaWRhdGUoY2FuZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBhc3luY1N1YmplY3QubmV4dChjYW5kaWRhdGVzKTtcbiAgICAgICAgICAgICAgICAgICAgYXN5bmNTdWJqZWN0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSB9KTtcbiAgICB9O1xuICAgIGhhbmRsZUNhbmRpZGF0ZShjYW5kaWRhdGUpO1xuICAgIHJldHVybiBhc3luY1N1YmplY3QudG9Qcm9taXNlKCk7XG59XG5mdW5jdGlvbiBmcm9tSXRlcmF0b3IoaXRlcmF0b3IpIHtcbiAgICBjb25zdCBpdGVtcyA9IFtdO1xuICAgIGxldCByZXN1bHQgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgd2hpbGUgKCFyZXN1bHQuZG9uZSkge1xuICAgICAgICBpdGVtcy5wdXNoKHJlc3VsdC52YWx1ZSk7XG4gICAgICAgIHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICB9XG4gICAgcmV0dXJuIGl0ZW1zO1xufVxuZXhwb3J0IGNvbnN0IFNvbHV0aW9uTWFuYWdlciA9IG5ldyBTb2x1dGlvbkluc3RhbmNlTWFuYWdlcigpO1xuIiwiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBBc3luY1N1YmplY3QsIEJlaGF2aW9yU3ViamVjdCwgU2NoZWR1bGVyLCBTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHtSZWZDb3VudERpc3Bvc2FibGUsIElEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHtTb2x1dGlvbn0gZnJvbSBcIi4vc29sdXRpb25cIjtcbmltcG9ydCB7QXRvbVByb2plY3RUcmFja2VyfSBmcm9tIFwiLi9hdG9tLXByb2plY3RzXCI7XG5pbXBvcnQge1NvbHV0aW9uT2JzZXJ2ZXIsIFNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXJ9IGZyb20gXCIuL2NvbXBvc2l0ZS1zb2x1dGlvblwiO1xuaW1wb3J0IHtEcml2ZXJTdGF0ZSwgZmluZENhbmRpZGF0ZXN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQge0dlbmVyaWNTZWxlY3RMaXN0Vmlld30gZnJvbSBcIi4uL3ZpZXdzL2dlbmVyaWMtbGlzdC12aWV3XCI7XG5pbXBvcnQge09tbmlzaGFycFRleHRFZGl0b3IsIGlzT21uaXNoYXJwVGV4dEVkaXRvciwgT21uaXNoYXJwRWRpdG9yQ29udGV4dH0gZnJvbSBcIi4vb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XG5cbnR5cGUgQVNZTkNfUkVQT1NJVE9SWSA9IHsgZ2V0V29ya2luZ0RpcmVjdG9yeSgpOiBQcm9taXNlPHN0cmluZz47IH07XG50eXBlIFJFUE9TSVRPUlkgPSB7IGFzeW5jOiBBU1lOQ19SRVBPU0lUT1JZOyB9O1xuXG5sZXQgb3BlblNlbGVjdExpc3Q6IEdlbmVyaWNTZWxlY3RMaXN0VmlldztcbmNsYXNzIFNvbHV0aW9uSW5zdGFuY2VNYW5hZ2VyIHtcbiAgICAvKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXG4gICAgcHVibGljIF91bml0VGVzdE1vZGVfID0gZmFsc2U7XG4gICAgcHVibGljIF9raWNrX2luX3RoZV9wYW50c18gPSBmYWxzZTtcblxuICAgIHByaXZhdGUgZ2V0IGxvZ2dlcigpIHtcbiAgICAgICAgaWYgKHRoaXMuX3VuaXRUZXN0TW9kZV8gfHwgdGhpcy5fa2lja19pbl90aGVfcGFudHNfKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGxvZzogKCkgPT4gey8qICovIH0sXG4gICAgICAgICAgICAgICAgZXJyb3I6ICgpID0+IHsvKiAqLyB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNvbnNvbGU7XG4gICAgfVxuICAgIC8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSAqL1xuICAgIHByaXZhdGUgX2Rpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG4gICAgcHJpdmF0ZSBfc29sdXRpb25EaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuICAgIHByaXZhdGUgX2F0b21Qcm9qZWN0czogQXRvbVByb2plY3RUcmFja2VyO1xuXG4gICAgcHJpdmF0ZSBfY29uZmlndXJhdGlvbnMgPSBuZXcgU2V0PChzb2x1dGlvbjogU29sdXRpb24pID0+IHZvaWQ+KCk7XG4gICAgcHJpdmF0ZSBfc29sdXRpb25zID0gbmV3IE1hcDxzdHJpbmcsIFNvbHV0aW9uPigpO1xuICAgIHByaXZhdGUgX3NvbHV0aW9uUHJvamVjdHMgPSBuZXcgTWFwPHN0cmluZywgU29sdXRpb24+KCk7XG4gICAgcHJpdmF0ZSBfdGVtcG9yYXJ5U29sdXRpb25zID0gbmV3IFdlYWtNYXA8U29sdXRpb24sIFJlZkNvdW50RGlzcG9zYWJsZT4oKTtcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlU29sdXRpb25NYXAgPSBuZXcgV2Vha01hcDxTb2x1dGlvbiwgSURpc3Bvc2FibGU+KCk7XG4gICAgcHJpdmF0ZSBfZmluZFNvbHV0aW9uQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgT2JzZXJ2YWJsZTxTb2x1dGlvbj4+KCk7XG4gICAgcHJpdmF0ZSBfY2FuZGlkYXRlRmluZGVyQ2FjaGUgPSBuZXcgU2V0PHN0cmluZz4oKTtcblxuICAgIHByaXZhdGUgX2FjdGl2YXRlZCA9IGZhbHNlO1xuICAgIHByaXZhdGUgX25leHRJbmRleCA9IDA7XG4gICAgcHJpdmF0ZSBfYWN0aXZlU2VhcmNoOiBQcm9taXNlPGFueT47XG5cbiAgICAvLyBUaGVzZSBleHRlbnNpb25zIG9ubHkgc3VwcG9ydCBzZXJ2ZXIgcGVyIGZvbGRlciwgdW5saWtlIG5vcm1hbCBjcyBmaWxlcy5cbiAgICBwcml2YXRlIF9zcGVjaWFsQ2FzZUV4dGVuc2lvbnMgPSBbXCIuY3N4XCIsIC8qXCIuY2FrZVwiKi9dO1xuICAgIHB1YmxpYyBnZXQgX19zcGVjaWFsQ2FzZUV4dGVuc2lvbnMoKSB7IHJldHVybiB0aGlzLl9zcGVjaWFsQ2FzZUV4dGVuc2lvbnM7IH1cblxuICAgIHByaXZhdGUgX2FjdGl2ZVNvbHV0aW9uczogU29sdXRpb25bXSA9IFtdO1xuICAgIHB1YmxpYyBnZXQgYWN0aXZlU29sdXRpb25zKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlU29sdXRpb25zO1xuICAgIH1cblxuICAgIC8vIHRoaXMgc29sdXRpb24gY2FuIGJlIHVzZWQgdG8gb2JzZXJ2ZSBiZWhhdmlvciBhY3Jvc3MgYWxsIHNvbHV0aW9uLlxuICAgIHByaXZhdGUgX29ic2VydmF0aW9uID0gbmV3IFNvbHV0aW9uT2JzZXJ2ZXIoKTtcbiAgICBwdWJsaWMgZ2V0IHNvbHV0aW9uT2JzZXJ2ZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9vYnNlcnZhdGlvbjtcbiAgICB9XG5cbiAgICAvLyB0aGlzIHNvbHV0aW9uIGNhbiBiZSB1c2VkIHRvIGFnZ3JlZ2F0ZSBiZWhhdmlvciBhY3Jvc3MgYWxsIHNvbHV0aW9uc1xuICAgIHByaXZhdGUgX2NvbWJpbmF0aW9uID0gbmV3IFNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXIoKTtcbiAgICBwdWJsaWMgZ2V0IHNvbHV0aW9uQWdncmVnYXRlT2JzZXJ2ZXIoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jb21iaW5hdGlvbjtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9hY3RpdmVTb2x1dGlvbiA9IG5ldyBCZWhhdmlvclN1YmplY3Q8U29sdXRpb24+KG51bGwpO1xuICAgIHByaXZhdGUgX2FjdGl2ZVNvbHV0aW9uT2JzZXJhYmxlID0gdGhpcy5fYWN0aXZlU29sdXRpb24uZGlzdGluY3RVbnRpbENoYW5nZWQoKS5maWx0ZXIoeiA9PiAhIXopLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcbiAgICBwdWJsaWMgZ2V0IGFjdGl2ZVNvbHV0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlU29sdXRpb25PYnNlcmFibGU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfYWN0aXZhdGVkU3ViamVjdCA9IG5ldyBTdWJqZWN0PGJvb2xlYW4+KCk7XG4gICAgcHJpdmF0ZSBnZXQgYWN0aXZhdGVkU3ViamVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2YXRlZFN1YmplY3Q7XG4gICAgfVxuXG4gICAgcHVibGljIGFjdGl2YXRlKGFjdGl2ZUVkaXRvcjogT2JzZXJ2YWJsZTxPbW5pc2hhcnBUZXh0RWRpdG9yPikge1xuICAgICAgICBpZiAodGhpcy5fYWN0aXZhdGVkKSByZXR1cm47XG5cbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuX2F0b21Qcm9qZWN0cyA9IG5ldyBBdG9tUHJvamVjdFRyYWNrZXIoKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fYXRvbVByb2plY3RzKTtcblxuICAgICAgICB0aGlzLl9hY3RpdmVTZWFyY2ggPSBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcblxuICAgICAgICAvLyBtb25pdG9yIGF0b20gcHJvamVjdCBwYXRoc1xuICAgICAgICB0aGlzLl9zdWJzY3JpYmVUb0F0b21Qcm9qZWN0VHJhY2tlcigpO1xuXG4gICAgICAgIC8vIFdlIHVzZSB0aGUgYWN0aXZlIGVkaXRvciBvbiBvbW5pc2hhcnBBdG9tIHRvXG4gICAgICAgIC8vIGNyZWF0ZSBhbm90aGVyIG9ic2VydmFibGUgdGhhdCBjaG5hZ2VzIHdoZW4gd2UgZ2V0IGEgbmV3IHNvbHV0aW9uLlxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChhY3RpdmVFZGl0b3JcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXG4gICAgICAgICAgICAuZmxhdE1hcCh6ID0+IHRoaXMuZ2V0U29sdXRpb25Gb3JFZGl0b3IoeikpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHggPT4gdGhpcy5fYWN0aXZlU29sdXRpb24ubmV4dCh4KSkpO1xuXG4gICAgICAgIHRoaXMuX2F0b21Qcm9qZWN0cy5hY3RpdmF0ZSgpO1xuICAgICAgICB0aGlzLl9hY3RpdmF0ZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLmFjdGl2YXRlZFN1YmplY3QubmV4dCh0cnVlKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fc29sdXRpb25EaXNwb3NhYmxlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY29ubmVjdCgpIHtcbiAgICAgICAgdGhpcy5fc29sdXRpb25zLmZvckVhY2goc29sdXRpb24gPT4gc29sdXRpb24uY29ubmVjdCgpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGlzY29ubmVjdCgpIHtcbiAgICAgICAgdGhpcy5fc29sdXRpb25zLmZvckVhY2goc29sdXRpb24gPT4gc29sdXRpb24uZGlzcG9zZSgpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZhdGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICB0aGlzLmRpc2Nvbm5lY3QoKTtcblxuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5jbGVhcigpO1xuICAgICAgICB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5jbGVhcigpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgY29ubmVjdGVkKCkge1xuICAgICAgICBjb25zdCBpdGVyYXRvciA9IHRoaXMuX3NvbHV0aW9ucy52YWx1ZXMoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICB3aGlsZSAoIXJlc3VsdC5kb25lKVxuICAgICAgICAgICAgaWYgKHJlc3VsdC52YWx1ZS5jdXJyZW50U3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZClcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3N1YnNjcmliZVRvQXRvbVByb2plY3RUcmFja2VyKCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9hdG9tUHJvamVjdHMucmVtb3ZlZFxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHRoaXMuX3NvbHV0aW9ucy5oYXMoeikpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHByb2plY3QgPT4gdGhpcy5fcmVtb3ZlU29sdXRpb24ocHJvamVjdCkpKTtcblxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9hdG9tUHJvamVjdHMuYWRkZWRcbiAgICAgICAgICAgIC5maWx0ZXIocHJvamVjdCA9PiAhdGhpcy5fc29sdXRpb25Qcm9qZWN0cy5oYXMocHJvamVjdCkpXG4gICAgICAgICAgICAubWFwKHByb2plY3QgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jYW5kaWRhdGVGaW5kZXIocHJvamVjdClcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoY2FuZGlkYXRlcyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tPHN0cmluZz4oY2FuZGlkYXRlcy5tYXAoeCA9PiB4LnBhdGgpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5mbGF0TWFwKHggPT4gdGhpcy5fZmluZFJlcG9zaXRvcnlGb3JQYXRoKHgpLCAocGF0aCwgcmVwbykgPT4gKHsgcGF0aCwgcmVwbyB9KSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAudG9BcnJheSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRvUHJvbWlzZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4ocmVwb3MgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdDYW5kaWRhdGVzID0gXy5kaWZmZXJlbmNlKGNhbmRpZGF0ZXMubWFwKHogPT4gei5wYXRoKSwgZnJvbUl0ZXJhdG9yKHRoaXMuX3NvbHV0aW9ucy5rZXlzKCkpKS5tYXAoeiA9PiBfLmZpbmQoY2FuZGlkYXRlcywgeyBwYXRoOiB6IH0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoeyBwYXRoLCBpc1Byb2plY3QgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gXy5maW5kKHJlcG9zLCB4ID0+IHgucGF0aCA9PT0gcGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVwbyA9IGZvdW5kICYmIGZvdW5kLnJlcG87XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgcGF0aCwgaXNQcm9qZWN0LCByZXBvIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFkZENhbmRpZGF0ZXNJbk9yZGVyKG5ld0NhbmRpZGF0ZXMsIChjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCkgPT4gdGhpcy5fYWRkU29sdXRpb24oY2FuZGlkYXRlLCByZXBvLCBpc1Byb2plY3QsIHsgcHJvamVjdCB9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoY2FuZGlkYXRlT2JzZXJ2YWJsZSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWN0aXZlU2VhcmNoID0gdGhpcy5fYWN0aXZlU2VhcmNoLnRoZW4oKCkgPT4gY2FuZGlkYXRlT2JzZXJ2YWJsZSk7XG4gICAgICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZmluZFJlcG9zaXRvcnlGb3JQYXRoKHdvcmtpbmdQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZnJvbTxSRVBPU0lUT1JZPihhdG9tLnByb2plY3QuZ2V0UmVwb3NpdG9yaWVzKCkgfHwgW10pXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gISF4KVxuICAgICAgICAgICAgLmZsYXRNYXAocmVwbyA9PiByZXBvLmFzeW5jLmdldFdvcmtpbmdEaXJlY3RvcnkoKSwgKHJlcG8sIGRpcmVjdG9yeSkgPT4gKHsgcmVwbywgZGlyZWN0b3J5IH0pKVxuICAgICAgICAgICAgLmZpbHRlcigoe2RpcmVjdG9yeX0pID0+IHBhdGgubm9ybWFsaXplKGRpcmVjdG9yeSkgPT09IHBhdGgubm9ybWFsaXplKHdvcmtpbmdQYXRoKSlcbiAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAubWFwKHggPT4geC5yZXBvLmFzeW5jKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9hZGRTb2x1dGlvbihjYW5kaWRhdGU6IHN0cmluZywgcmVwbzogQVNZTkNfUkVQT1NJVE9SWSwgaXNQcm9qZWN0OiBib29sZWFuLCB7dGVtcG9yYXJ5ID0gZmFsc2UsIHByb2plY3R9OiB7IGRlbGF5PzogbnVtYmVyOyB0ZW1wb3Jhcnk/OiBib29sZWFuOyBwcm9qZWN0Pzogc3RyaW5nOyB9KSB7XG4gICAgICAgIGNvbnN0IHByb2plY3RQYXRoID0gY2FuZGlkYXRlO1xuICAgICAgICBpZiAoXy5lbmRzV2l0aChjYW5kaWRhdGUsIFwiLnNsblwiKSkge1xuICAgICAgICAgICAgY2FuZGlkYXRlID0gcGF0aC5kaXJuYW1lKGNhbmRpZGF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgc29sdXRpb246IFNvbHV0aW9uO1xuICAgICAgICBpZiAodGhpcy5fc29sdXRpb25zLmhhcyhjYW5kaWRhdGUpKSB7XG4gICAgICAgICAgICBzb2x1dGlvbiA9IHRoaXMuX3NvbHV0aW9ucy5nZXQoY2FuZGlkYXRlKTtcbiAgICAgICAgfSBlbHNlIGlmIChwcm9qZWN0ICYmIHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuaGFzKHByb2plY3QpKSB7XG4gICAgICAgICAgICBzb2x1dGlvbiA9IHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuZ2V0KHByb2plY3QpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNvbHV0aW9uICYmICFzb2x1dGlvbi5pc0Rpc3Bvc2VkKSB7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoc29sdXRpb24gJiYgc29sdXRpb24uaXNEaXNwb3NlZCkge1xuICAgICAgICAgICAgY29uc3QgZGlzcG9zZXIgPSB0aGlzLl9kaXNwb3NhYmxlU29sdXRpb25NYXAuZ2V0KHNvbHV0aW9uKTtcbiAgICAgICAgICAgIGRpc3Bvc2VyLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNvbHV0aW9uID0gbmV3IFNvbHV0aW9uKHtcbiAgICAgICAgICAgIHByb2plY3RQYXRoOiBwcm9qZWN0UGF0aCxcbiAgICAgICAgICAgIGluZGV4OiArK3RoaXMuX25leHRJbmRleCxcbiAgICAgICAgICAgIHRlbXBvcmFyeTogdGVtcG9yYXJ5LFxuICAgICAgICAgICAgcmVwb3NpdG9yeTogPGFueT5yZXBvXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICghaXNQcm9qZWN0KSB7XG4gICAgICAgICAgICBzb2x1dGlvbi5pc0ZvbGRlclBlckZpbGUgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQoY2QpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlU29sdXRpb25NYXAuc2V0KHNvbHV0aW9uLCBjZCk7XG5cbiAgICAgICAgc29sdXRpb24uZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgc29sdXRpb24uY29ubmVjdCA9ICgpID0+IHRoaXMuX2FkZFNvbHV0aW9uKGNhbmRpZGF0ZSwgcmVwbywgaXNQcm9qZWN0LCB7IHRlbXBvcmFyeSwgcHJvamVjdCB9KTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIGNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUucmVtb3ZlKGNkKTtcbiAgICAgICAgICAgIF8ucHVsbCh0aGlzLl9hY3RpdmVTb2x1dGlvbnMsIHNvbHV0aW9uKTtcbiAgICAgICAgICAgIHRoaXMuX3NvbHV0aW9ucy5kZWxldGUoY2FuZGlkYXRlKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5oYXMoc29sdXRpb24pKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmRlbGV0ZShzb2x1dGlvbik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9hY3RpdmVTb2x1dGlvbi5nZXRWYWx1ZSgpID09PSBzb2x1dGlvbikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVNvbHV0aW9uLm5leHQodGhpcy5fYWN0aXZlU29sdXRpb25zLmxlbmd0aCA/IHRoaXMuX2FjdGl2ZVNvbHV0aW9uc1swXSA6IG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgICAgIGNkLmFkZChzb2x1dGlvbik7XG5cbiAgICAgICAgdGhpcy5fY29uZmlndXJhdGlvbnMuZm9yRWFjaChjb25maWcgPT4gY29uZmlnKHNvbHV0aW9uKSk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9ucy5zZXQoY2FuZGlkYXRlLCBzb2x1dGlvbik7XG5cbiAgICAgICAgLy8ga2VlcCB0cmFjayBvZiB0aGUgYWN0aXZlIHNvbHV0aW9uc1xuICAgICAgICBjZC5hZGQodGhpcy5fb2JzZXJ2YXRpb24uYWRkKHNvbHV0aW9uKSk7XG4gICAgICAgIGNkLmFkZCh0aGlzLl9jb21iaW5hdGlvbi5hZGQoc29sdXRpb24pKTtcblxuICAgICAgICBpZiAodGVtcG9yYXJ5KSB7XG4gICAgICAgICAgICBjb25zdCB0ZW1wRCA9IERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHsgLyogKi8gfSk7XG4gICAgICAgICAgICB0ZW1wRC5kaXNwb3NlKCk7XG4gICAgICAgICAgICB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuc2V0KHNvbHV0aW9uLCBuZXcgUmVmQ291bnREaXNwb3NhYmxlKHRlbXBEKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9hY3RpdmVTb2x1dGlvbnMucHVzaChzb2x1dGlvbik7XG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmVTb2x1dGlvbnMubGVuZ3RoID09PSAxKVxuICAgICAgICAgICAgdGhpcy5fYWN0aXZlU29sdXRpb24ubmV4dChzb2x1dGlvbik7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gdGhpcy5fYWRkU29sdXRpb25TdWJzY3JpcHRpb25zKHNvbHV0aW9uLCBjZCk7XG4gICAgICAgIHNvbHV0aW9uLmNvbm5lY3QoKTtcbiAgICAgICAgcmV0dXJuIDxPYnNlcnZhYmxlPFNvbHV0aW9uPj48YW55PnJlc3VsdDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9hZGRTb2x1dGlvblN1YnNjcmlwdGlvbnMoc29sdXRpb246IFNvbHV0aW9uLCBjZDogQ29tcG9zaXRlRGlzcG9zYWJsZSkge1xuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgQXN5bmNTdWJqZWN0PFNvbHV0aW9uPigpO1xuICAgICAgICBjb25zdCBlcnJvclJlc3VsdCA9IHNvbHV0aW9uLnN0YXRlXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4geiA9PT0gRHJpdmVyU3RhdGUuRXJyb3IpXG4gICAgICAgICAgICAuZGVsYXkoMTAwKVxuICAgICAgICAgICAgLnRha2UoMSk7XG5cbiAgICAgICAgY2QuYWRkKGVycm9yUmVzdWx0LnN1YnNjcmliZSgoKSA9PiByZXN1bHQuY29tcGxldGUoKSkpOyAvLyBJZiB0aGlzIHNvbHV0aW9uIGVycm9ycyBtb3ZlIG9uIHRvIHRoZSBuZXh0XG5cbiAgICAgICAgY2QuYWRkKHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdEFkZGVkLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuc2V0KHByb2plY3QucGF0aCwgc29sdXRpb24pKSk7XG4gICAgICAgIGNkLmFkZChzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RSZW1vdmVkLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuX3NvbHV0aW9uUHJvamVjdHMuZGVsZXRlKHByb2plY3QucGF0aCkpKTtcblxuICAgICAgICAvLyBXYWl0IGZvciB0aGUgcHJvamVjdHMgdG8gcmV0dXJuIGZyb20gdGhlIHNvbHV0aW9uXG4gICAgICAgIGNkLmFkZChzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RzXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDEwMClcbiAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAubWFwKCgpID0+IHNvbHV0aW9uKVxuICAgICAgICAgICAgLnRpbWVvdXQoMTUwMDAsIFNjaGVkdWxlci5xdWV1ZSkgLy8gV2FpdCAzMCBzZWNvbmRzIGZvciB0aGUgcHJvamVjdCB0byBsb2FkLlxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gV2UgbG9hZGVkIHN1Y2Nlc3NmdWxseSByZXR1cm4gdGhlIHNvbHV0aW9uXG4gICAgICAgICAgICAgICAgcmVzdWx0Lm5leHQoc29sdXRpb24pO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIE1vdmUgYWxvbmcuXG4gICAgICAgICAgICAgICAgcmVzdWx0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZW1vdmVTb2x1dGlvbihjYW5kaWRhdGU6IHN0cmluZykge1xuICAgICAgICBpZiAoXy5lbmRzV2l0aChjYW5kaWRhdGUsIFwiLnNsblwiKSkge1xuICAgICAgICAgICAgY2FuZGlkYXRlID0gcGF0aC5kaXJuYW1lKGNhbmRpZGF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzb2x1dGlvbiA9IHRoaXMuX3NvbHV0aW9ucy5nZXQoY2FuZGlkYXRlKTtcblxuICAgICAgICBjb25zdCByZWZDb3VudERpc3Bvc2FibGUgPSBzb2x1dGlvbiAmJiB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuaGFzKHNvbHV0aW9uKSAmJiB0aGlzLl90ZW1wb3JhcnlTb2x1dGlvbnMuZ2V0KHNvbHV0aW9uKTtcbiAgICAgICAgaWYgKHJlZkNvdW50RGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgcmVmQ291bnREaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIGlmICghcmVmQ291bnREaXNwb3NhYmxlLmlzRGlzcG9zZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBrZWVwIHRyYWNrIG9mIHRoZSByZW1vdmVkIHNvbHV0aW9uc1xuICAgICAgICBpZiAoc29sdXRpb24pIHtcbiAgICAgICAgICAgIHNvbHV0aW9uLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSB0aGlzLl9kaXNwb3NhYmxlU29sdXRpb25NYXAuZ2V0KHNvbHV0aW9uKTtcbiAgICAgICAgICAgIGlmIChkaXNwb3NhYmxlKSBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBnZXRTb2x1dGlvbkZvclBhdGgocGF0aDogc3RyaW5nKSB7XG4gICAgICAgIGlmICghcGF0aClcbiAgICAgICAgICAgIC8vIE5vIHRleHQgZWRpdG9yIGZvdW5kXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxTb2x1dGlvbj4oKTtcblxuICAgICAgICBjb25zdCBpc0ZvbGRlclBlckZpbGUgPSBfLnNvbWUodGhpcy5fX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucywgZXh0ID0+IF8uZW5kc1dpdGgocGF0aCwgZXh0KSk7XG5cbiAgICAgICAgY29uc3QgbG9jYXRpb24gPSBwYXRoO1xuICAgICAgICBpZiAoIWxvY2F0aW9uKSB7XG4gICAgICAgICAgICAvLyBUZXh0IGVkaXRvciBub3Qgc2F2ZWQgeWV0P1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8U29sdXRpb24+KCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzb2x1dGlvblZhbHVlID0gdGhpcy5fZ2V0U29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKTtcblxuICAgICAgICBpZiAoc29sdXRpb25WYWx1ZSlcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHNvbHV0aW9uVmFsdWUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9maW5kU29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0U29sdXRpb25Gb3JFZGl0b3IoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvcikuZmlsdGVyKCgpID0+ICFlZGl0b3IuaXNEZXN0cm95ZWQoKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfc2V0dXBFZGl0b3JXaXRoQ29udGV4dChlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgc29sdXRpb246IFNvbHV0aW9uKSB7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBuZXcgT21uaXNoYXJwRWRpdG9yQ29udGV4dChlZGl0b3IsIHNvbHV0aW9uKTtcbiAgICAgICAgY29uc3QgcmVzdWx0OiBPbW5pc2hhcnBUZXh0RWRpdG9yID0gPGFueT5lZGl0b3I7XG4gICAgICAgIHJlc3VsdC5vbW5pc2hhcnAgPSBjb250ZXh0O1xuXG4gICAgICAgIGNvbnN0IHZpZXc6IEhUTUxFbGVtZW50ID0gPGFueT5hdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKTtcbiAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwib21uaXNoYXJwLWVkaXRvclwiKTtcblxuICAgICAgICBjb250ZXh0LnNvbHV0aW9uLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnRleHQuZGlzcG9zZSgpO1xuICAgICAgICAgICAgcmVzdWx0Lm9tbmlzaGFycCA9IG51bGw7XG4gICAgICAgICAgICB2aWV3LmNsYXNzTGlzdC5yZW1vdmUoXCJvbW5pc2hhcnAtZWRpdG9yXCIpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgaWYgKHNvbHV0aW9uICYmICFjb250ZXh0LnRlbXAgJiYgdGhpcy5fdGVtcG9yYXJ5U29sdXRpb25zLmhhcyhzb2x1dGlvbikpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZkNvdW50RGlzcG9zYWJsZSA9IHRoaXMuX3RlbXBvcmFyeVNvbHV0aW9ucy5nZXQoc29sdXRpb24pO1xuICAgICAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IHJlZkNvdW50RGlzcG9zYWJsZS5nZXREaXNwb3NhYmxlKCk7XG4gICAgICAgICAgICBjb250ZXh0LnRlbXAgPSB0cnVlO1xuICAgICAgICAgICAgY29udGV4dC5zb2x1dGlvbi5kaXNwb3NhYmxlLmFkZChlZGl0b3Iub25EaWREZXN0cm95KCgpID0+IHtcbiAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW1vdmVTb2x1dGlvbihzb2x1dGlvbi5wYXRoKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnNldHVwQ29udGV4dENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLnNldHVwQ29udGV4dENhbGxiYWNrKHJlc3VsdCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXR1cENvbnRleHRDYWxsYmFjazogKGVkaXRvcjogT21uaXNoYXJwVGV4dEVkaXRvcikgPT4gdm9pZDtcblxuICAgIHByaXZhdGUgX2dldFNvbHV0aW9uRm9yRWRpdG9yKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XG4gICAgICAgIGlmICghZWRpdG9yKSB7XG4gICAgICAgICAgICAvLyBObyB0ZXh0IGVkaXRvciBmb3VuZFxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8U29sdXRpb24+KCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsb2NhdGlvbiA9IGVkaXRvci5nZXRQYXRoKCk7XG4gICAgICAgIGlmICghbG9jYXRpb24pIHtcbiAgICAgICAgICAgIC8vIFRleHQgZWRpdG9yIG5vdCBzYXZlZCB5ZXQ/XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxTb2x1dGlvbj4oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc09tbmlzaGFycFRleHRFZGl0b3IoZWRpdG9yKSkge1xuICAgICAgICAgICAgaWYgKGVkaXRvci5vbW5pc2hhcnAubWV0YWRhdGEpIHtcbiAgICAgICAgICAgICAgICAvLyBjbGllbnQgLyBzZXJ2ZXIgZG9lc25cInQgd29yayBjdXJyZW50bHkgZm9yIG1ldGFkYXRhIGRvY3VtZW50cy5cbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxTb2x1dGlvbj4oKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3Qgc29sdXRpb24gPSBlZGl0b3Iub21uaXNoYXJwLnNvbHV0aW9uO1xuXG4gICAgICAgICAgICAvLyBJZiB0aGUgc29sdXRpb24gaGFzIGRpc2Nvbm5lY3RlZCwgcmVjb25uZWN0IGl0XG4gICAgICAgICAgICBpZiAoc29sdXRpb24uY3VycmVudFN0YXRlID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQgJiYgYXRvbS5jb25maWcuZ2V0KFwib21uaXNoYXJwLWF0b20uYXV0b1N0YXJ0T25Db21wYXRpYmxlRmlsZVwiKSlcbiAgICAgICAgICAgICAgICBzb2x1dGlvbi5jb25uZWN0KCk7XG5cbiAgICAgICAgICAgIC8vIENsaWVudCBpcyBpbiBhbiBpbnZhbGlkIHN0YXRlXG4gICAgICAgICAgICBpZiAoc29sdXRpb24uY3VycmVudFN0YXRlID09PSBEcml2ZXJTdGF0ZS5FcnJvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5PFNvbHV0aW9uPigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihzb2x1dGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpc0ZvbGRlclBlckZpbGUgPSBfLnNvbWUodGhpcy5fX3NwZWNpYWxDYXNlRXh0ZW5zaW9ucywgZXh0ID0+IF8uZW5kc1dpdGgoZWRpdG9yLmdldFBhdGgoKSwgZXh0KSk7XG4gICAgICAgIGNvbnN0IHNvbHV0aW9uID0gdGhpcy5fZ2V0U29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbiwgaXNGb2xkZXJQZXJGaWxlKTtcbiAgICAgICAgaWYgKHNvbHV0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLl9zZXR1cEVkaXRvcldpdGhDb250ZXh0KGVkaXRvciwgc29sdXRpb24pO1xuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2Yoc29sdXRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbmRTb2x1dGlvbkZvclVuZGVybHlpbmdQYXRoKGxvY2F0aW9uLCBpc0ZvbGRlclBlckZpbGUpXG4gICAgICAgICAgICAuZG8oKHNsbikgPT4gdGhpcy5fc2V0dXBFZGl0b3JXaXRoQ29udGV4dChlZGl0b3IsIHNsbikpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2lzUGFydE9mQW55QWN0aXZlU29sdXRpb248VD4obG9jYXRpb246IHN0cmluZywgY2I6IChpbnRlcnNlY3Q6IHN0cmluZywgc29sdXRpb246IFNvbHV0aW9uKSA9PiBUKSB7XG4gICAgICAgIGZvciAoY29uc3Qgc29sdXRpb24gb2YgdGhpcy5fYWN0aXZlU29sdXRpb25zKSB7XG4gICAgICAgICAgICAvLyBXZSBkb25cInQgY2hlY2sgZm9yIGZvbGRlciBiYXNlZCBzb2x1dGlvbnNcbiAgICAgICAgICAgIGlmIChzb2x1dGlvbi5pc0ZvbGRlclBlckZpbGUpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBjb25zdCBwYXRocyA9IHNvbHV0aW9uLm1vZGVsLnByb2plY3RzLm1hcCh6ID0+IHoucGF0aCk7XG4gICAgICAgICAgICBjb25zdCBpbnRlcnNlY3QgPSB0aGlzLl9pbnRlcnNlY3RQYXRoTWV0aG9kKGxvY2F0aW9uLCBwYXRocyk7XG4gICAgICAgICAgICBpZiAoaW50ZXJzZWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNiKGludGVyc2VjdCwgc29sdXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0U29sdXRpb25Gb3JVbmRlcmx5aW5nUGF0aChsb2NhdGlvbjogc3RyaW5nLCBpc0ZvbGRlclBlckZpbGU6IGJvb2xlYW4pOiBTb2x1dGlvbiB7XG4gICAgICAgIGlmIChsb2NhdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0ZvbGRlclBlckZpbGUpIHtcbiAgICAgICAgICAgIC8vIENTWCBhcmUgc3BlY2lhbCwgYW5kIG5lZWQgYSBzb2x1dGlvbiBwZXIgZGlyZWN0b3J5LlxuICAgICAgICAgICAgY29uc3QgZGlyZWN0b3J5ID0gcGF0aC5kaXJuYW1lKGxvY2F0aW9uKTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zb2x1dGlvbnMuaGFzKGRpcmVjdG9yeSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3NvbHV0aW9ucy5nZXQoZGlyZWN0b3J5KTtcblxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBpbnRlcnNlY3QgPSB0aGlzLl9pbnRlcnNlY3RQYXRoKGxvY2F0aW9uKTtcbiAgICAgICAgICAgIGlmIChpbnRlcnNlY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fc29sdXRpb25zLmdldChpbnRlcnNlY3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpc0ZvbGRlclBlckZpbGUpIHtcbiAgICAgICAgICAgIC8vIEF0dGVtcHQgdG8gc2VlIGlmIHRoaXMgZmlsZSBpcyBwYXJ0IGEgc29sdXRpb25cbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9pc1BhcnRPZkFueUFjdGl2ZVNvbHV0aW9uKGxvY2F0aW9uLCAoaW50ZXJzZWN0LCBzb2x1dGlvbikgPT4gc29sdXRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZmluZFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb246IHN0cmluZywgaXNGb2xkZXJQZXJGaWxlOiBib29sZWFuKTogT2JzZXJ2YWJsZTxTb2x1dGlvbj4ge1xuICAgICAgICBjb25zdCBkaXJlY3RvcnkgPSBwYXRoLmRpcm5hbWUobG9jYXRpb24pO1xuICAgICAgICBjb25zdCBzdWJqZWN0ID0gbmV3IEFzeW5jU3ViamVjdDxTb2x1dGlvbj4oKTtcblxuICAgICAgICBpZiAoIXRoaXMuX2FjdGl2YXRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZhdGVkU3ViamVjdC50YWtlKDEpXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gdGhpcy5fZmluZFNvbHV0aW9uRm9yVW5kZXJseWluZ1BhdGgobG9jYXRpb24sIGlzRm9sZGVyUGVyRmlsZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2ZpbmRTb2x1dGlvbkNhY2hlLmhhcyhsb2NhdGlvbikpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5nZXQobG9jYXRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fZmluZFNvbHV0aW9uQ2FjaGUuc2V0KGxvY2F0aW9uLCA8T2JzZXJ2YWJsZTxTb2x1dGlvbj4+PGFueT5zdWJqZWN0KTtcbiAgICAgICAgc3ViamVjdC5kbyh7IGNvbXBsZXRlOiAoKSA9PiB0aGlzLl9maW5kU29sdXRpb25DYWNoZS5kZWxldGUobG9jYXRpb24pIH0pO1xuXG4gICAgICAgIGNvbnN0IHByb2plY3QgPSB0aGlzLl9pbnRlcnNlY3RBdG9tUHJvamVjdFBhdGgoZGlyZWN0b3J5KTtcbiAgICAgICAgY29uc3QgY2IgPSAoY2FuZGlkYXRlczogeyBwYXRoOiBzdHJpbmc7IGlzUHJvamVjdDogYm9vbGVhbiB9W10pID0+IHtcbiAgICAgICAgICAgIC8vIFdlIG9ubHkgd2FudCB0byBzZWFyY2ggZm9yIHNvbHV0aW9ucyBhZnRlciB0aGUgbWFpbiBzb2x1dGlvbnMgaGF2ZSBiZWVuIHByb2Nlc3NlZC5cbiAgICAgICAgICAgIC8vIFdlIGNhbiBnZXQgaW50byB0aGlzIHJhY2UgY29uZGl0aW9uIGlmIHRoZSB1c2VyIGhhcyB3aW5kb3dzIHRoYXQgd2VyZSBvcGVuZWQgcHJldmlvdXNseS5cbiAgICAgICAgICAgIGlmICghdGhpcy5fYWN0aXZhdGVkKSB7XG4gICAgICAgICAgICAgICAgXy5kZWxheShjYiwgNTAwMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIWlzRm9sZGVyUGVyRmlsZSkge1xuICAgICAgICAgICAgICAgIC8vIEF0dGVtcHQgdG8gc2VlIGlmIHRoaXMgZmlsZSBpcyBwYXJ0IGEgc29sdXRpb25cbiAgICAgICAgICAgICAgICBjb25zdCByID0gdGhpcy5faXNQYXJ0T2ZBbnlBY3RpdmVTb2x1dGlvbihsb2NhdGlvbiwgKGludGVyc2VjdCwgc29sdXRpb24pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHNvbHV0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAocikgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVTZWFyY2gudGhlbigoKSA9PiBPYnNlcnZhYmxlLmZyb208c3RyaW5nPihjYW5kaWRhdGVzLm1hcCh4ID0+IHgucGF0aCkpXG4gICAgICAgICAgICAgICAgLmZsYXRNYXAoeCA9PiB0aGlzLl9maW5kUmVwb3NpdG9yeUZvclBhdGgoeCksIChwYXRoLCByZXBvKSA9PiAoeyBwYXRoLCByZXBvIH0pKVxuICAgICAgICAgICAgICAgIC50b0FycmF5KClcbiAgICAgICAgICAgICAgICAudG9Qcm9taXNlKCkpXG4gICAgICAgICAgICAgICAgLnRoZW4ocmVwb3MgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBuZXdDYW5kaWRhdGVzID0gXy5kaWZmZXJlbmNlKGNhbmRpZGF0ZXMubWFwKHogPT4gei5wYXRoKSwgZnJvbUl0ZXJhdG9yKHRoaXMuX3NvbHV0aW9ucy5rZXlzKCkpKS5tYXAoeiA9PiBfLmZpbmQoY2FuZGlkYXRlcywgeyBwYXRoOiB6IH0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgLm1hcCgoeyBwYXRoLCBpc1Byb2plY3QgfSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gXy5maW5kKHJlcG9zLCB4ID0+IHgucGF0aCA9PT0gcGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVwbyA9IGZvdW5kICYmIGZvdW5kLnJlcG87XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsgcGF0aCwgaXNQcm9qZWN0LCByZXBvIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYWRkQ2FuZGlkYXRlc0luT3JkZXIobmV3Q2FuZGlkYXRlcywgKGNhbmRpZGF0ZSwgcmVwbywgaXNQcm9qZWN0KSA9PiB0aGlzLl9hZGRTb2x1dGlvbihjYW5kaWRhdGUsIHJlcG8sIGlzUHJvamVjdCwgeyB0ZW1wb3Jhcnk6ICFwcm9qZWN0IH0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghaXNGb2xkZXJQZXJGaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF0dGVtcHQgdG8gc2VlIGlmIHRoaXMgZmlsZSBpcyBwYXJ0IGEgc29sdXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgciA9IHRoaXMuX2lzUGFydE9mQW55QWN0aXZlU29sdXRpb24obG9jYXRpb24sIChpbnRlcnNlY3QsIHNvbHV0aW9uKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJqZWN0Lm5leHQoc29sdXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHIpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpbnRlcnNlY3QgPSB0aGlzLl9pbnRlcnNlY3RQYXRoKGxvY2F0aW9uKSB8fCB0aGlzLl9pbnRlcnNlY3RBdG9tUHJvamVjdFBhdGgobG9jYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbnRlcnNlY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuX3NvbHV0aW9ucy5oYXMoaW50ZXJzZWN0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ViamVjdC5uZXh0KHRoaXMuX3NvbHV0aW9ucy5nZXQoaW50ZXJzZWN0KSk7IC8vIFRoZSBib29sZWFuIG1lYW5zIHRoaXMgc29sdXRpb24gaXMgdGVtcG9yYXJ5LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oYENvdWxkIG5vdCBmaW5kIGEgc29sdXRpb24gZm9yIFwiJHtsb2NhdGlvbn1cImApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJqZWN0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLl9jYW5kaWRhdGVGaW5kZXIoZGlyZWN0b3J5KS5zdWJzY3JpYmUoY2IpO1xuXG4gICAgICAgIHJldHVybiA8T2JzZXJ2YWJsZTxTb2x1dGlvbj4+PGFueT5zdWJqZWN0O1xuICAgIH1cblxuICAgIHByaXZhdGUgX2NhbmRpZGF0ZUZpbmRlcihkaXJlY3Rvcnk6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gZmluZENhbmRpZGF0ZXMud2l0aENhbmRpZGF0ZXMoZGlyZWN0b3J5LCB0aGlzLmxvZ2dlciwge1xuICAgICAgICAgICAgc29sdXRpb25JbmRlcGVuZGVudFNvdXJjZUZpbGVzVG9TZWFyY2g6IHRoaXMuX19zcGVjaWFsQ2FzZUV4dGVuc2lvbnMubWFwKHogPT4gXCIqXCIgKyB6KVxuICAgICAgICB9KVxuICAgICAgICAgICAgLmZsYXRNYXAoY2FuZGlkYXRlcyA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2xucyA9IF8uZmlsdGVyKGNhbmRpZGF0ZXMsIHggPT4gXy5lbmRzV2l0aCh4LnBhdGgsIFwiLnNsblwiKSk7XG4gICAgICAgICAgICAgICAgaWYgKHNsbnMubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtcyA9IF8uZGlmZmVyZW5jZShjYW5kaWRhdGVzLCBzbG5zKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXN5bmNSZXN1bHQgPSBuZXcgQXN5bmNTdWJqZWN0PHR5cGVvZiBjYW5kaWRhdGVzPigpO1xuICAgICAgICAgICAgICAgICAgICBhc3luY1Jlc3VsdC5uZXh0KGl0ZW1zKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBoYW5kbGUgbXVsdGlwbGUgc29sdXRpb25zLlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBsaXN0VmlldyA9IG5ldyBHZW5lcmljU2VsZWN0TGlzdFZpZXcoXCJcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHNsbnMubWFwKHggPT4gKHsgZGlzcGxheU5hbWU6IHgucGF0aCwgbmFtZTogeC5wYXRoIH0pKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zLnVuc2hpZnQoLi4uc2xucy5maWx0ZXIoeCA9PiB4LnBhdGggPT09IHJlc3VsdCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uZWFjaChjYW5kaWRhdGVzLCB4ID0+IHRoaXMuX2NhbmRpZGF0ZUZpbmRlckNhY2hlLmFkZCh4LnBhdGgpKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jUmVzdWx0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jUmVzdWx0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgICAgbGlzdFZpZXcubWVzc2FnZS50ZXh0KFwiUGxlYXNlIHNlbGVjdCBhIHNvbHV0aW9uIHRvIGxvYWQuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFNob3cgdGhlIHZpZXdcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wZW5TZWxlY3RMaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVuU2VsZWN0TGlzdC5vbkNsb3NlZC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghXy5zb21lKHNsbnMsIHggPT4gdGhpcy5fY2FuZGlkYXRlRmluZGVyQ2FjaGUuaGFzKHgucGF0aCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF8uZGVmZXIoKCkgPT4gbGlzdFZpZXcudG9nZ2xlKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzeW5jUmVzdWx0LmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfLmRlZmVyKCgpID0+IGxpc3RWaWV3LnRvZ2dsZSgpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGFzeW5jUmVzdWx0LmRvKHsgY29tcGxldGU6ICgpID0+IG9wZW5TZWxlY3RMaXN0ID0gbnVsbCB9KTtcbiAgICAgICAgICAgICAgICAgICAgb3BlblNlbGVjdExpc3QgPSBsaXN0VmlldztcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gPE9ic2VydmFibGU8dHlwZW9mIGNhbmRpZGF0ZXM+Pjxhbnk+YXN5bmNSZXN1bHQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YoY2FuZGlkYXRlcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlZ2lzdGVyQ29uZmlndXJhdGlvbihjYWxsYmFjazogKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gdm9pZCkge1xuICAgICAgICB0aGlzLl9jb25maWd1cmF0aW9ucy5hZGQoY2FsbGJhY2spO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbnMuZm9yRWFjaChzb2x1dGlvbiA9PiBjYWxsYmFjayhzb2x1dGlvbikpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2ludGVyc2VjdFBhdGhNZXRob2QobG9jYXRpb246IHN0cmluZywgcGF0aHM/OiBzdHJpbmdbXSkge1xuICAgICAgICBjb25zdCB2YWxpZFNvbHV0aW9uUGF0aHMgPSBwYXRocztcblxuICAgICAgICBjb25zdCBzZWdtZW50cyA9IGxvY2F0aW9uLnNwbGl0KHBhdGguc2VwKTtcbiAgICAgICAgY29uc3QgbWFwcGVkTG9jYXRpb25zID0gc2VnbWVudHMubWFwKChsb2MsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gXy50YWtlKHNlZ21lbnRzLCBpbmRleCArIDEpLmpvaW4ocGF0aC5zZXApO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBMb29rIGZvciB0aGUgY2xvc2VzdCBtYXRjaCBmaXJzdC5cbiAgICAgICAgbWFwcGVkTG9jYXRpb25zLnJldmVyc2UoKTtcblxuICAgICAgICBjb25zdCBpbnRlcnNlY3Q6IHN0cmluZyA9IF8uaW50ZXJzZWN0aW9uKG1hcHBlZExvY2F0aW9ucywgdmFsaWRTb2x1dGlvblBhdGhzKVswXTtcbiAgICAgICAgaWYgKGludGVyc2VjdCkge1xuICAgICAgICAgICAgcmV0dXJuIGludGVyc2VjdDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX2ludGVyc2VjdFBhdGgobG9jYXRpb246IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5faW50ZXJzZWN0UGF0aE1ldGhvZChsb2NhdGlvbiwgZnJvbUl0ZXJhdG9yKHRoaXMuX3NvbHV0aW9ucy5lbnRyaWVzKCkpXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXpbMV0uaXNGb2xkZXJQZXJGaWxlKS5tYXAoeiA9PiB6WzBdKSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfaW50ZXJzZWN0QXRvbVByb2plY3RQYXRoKGxvY2F0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2ludGVyc2VjdFBhdGhNZXRob2QobG9jYXRpb24sIHRoaXMuX2F0b21Qcm9qZWN0cy5wYXRocyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhZGRDYW5kaWRhdGVzSW5PcmRlcihjYW5kaWRhdGVzOiB7IHBhdGg6IHN0cmluZzsgcmVwbzogQVNZTkNfUkVQT1NJVE9SWTsgaXNQcm9qZWN0OiBib29sZWFuOyB9W10sIGNiOiAoY2FuZGlkYXRlOiBzdHJpbmcsIHJlcG86IEFTWU5DX1JFUE9TSVRPUlksIGlzUHJvamVjdDogYm9vbGVhbikgPT4gT2JzZXJ2YWJsZTxTb2x1dGlvbj4pIHtcbiAgICBjb25zdCBhc3luY1N1YmplY3QgPSBuZXcgQXN5bmNTdWJqZWN0KCk7XG5cbiAgICBpZiAoIWNhbmRpZGF0ZXMubGVuZ3RoKSB7XG4gICAgICAgIGFzeW5jU3ViamVjdC5uZXh0KGNhbmRpZGF0ZXMpO1xuICAgICAgICBhc3luY1N1YmplY3QuY29tcGxldGUoKTtcbiAgICAgICAgcmV0dXJuIGFzeW5jU3ViamVjdC50b1Byb21pc2UoKTtcbiAgICB9XG5cbiAgICBjb25zdCBjZHMgPSBjYW5kaWRhdGVzLnNsaWNlKCk7XG4gICAgY29uc3QgY2FuZGlkYXRlID0gY2RzLnNoaWZ0KCk7XG4gICAgY29uc3QgaGFuZGxlQ2FuZGlkYXRlID0gKGNhbmQ6IHsgcGF0aDogc3RyaW5nOyByZXBvOiBBU1lOQ19SRVBPU0lUT1JZOyBpc1Byb2plY3Q6IGJvb2xlYW47IH0pID0+IHtcbiAgICAgICAgY2IoY2FuZC5wYXRoLCBjYW5kLnJlcG8sIGNhbmQuaXNQcm9qZWN0KVxuICAgICAgICAgICAgLnN1YnNjcmliZSh7IGNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGNkcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FuZCA9IGNkcy5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVDYW5kaWRhdGUoY2FuZCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXN5bmNTdWJqZWN0Lm5leHQoY2FuZGlkYXRlcyk7XG4gICAgICAgICAgICAgICAgICAgIGFzeW5jU3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gfSk7XG4gICAgfTtcbiAgICBoYW5kbGVDYW5kaWRhdGUoY2FuZGlkYXRlKTtcbiAgICByZXR1cm4gYXN5bmNTdWJqZWN0LnRvUHJvbWlzZSgpO1xufVxuXG5mdW5jdGlvbiBmcm9tSXRlcmF0b3I8VD4oaXRlcmF0b3I6IEl0ZXJhYmxlSXRlcmF0b3I8VD4pIHtcbiAgICBjb25zdCBpdGVtczogVFtdID0gW107XG4gICAgbGV0IHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICB3aGlsZSAoIXJlc3VsdC5kb25lKSB7XG4gICAgICAgIGl0ZW1zLnB1c2gocmVzdWx0LnZhbHVlKTtcblxuICAgICAgICByZXN1bHQgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGl0ZW1zO1xufVxuXG4vKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lICovXG5leHBvcnQgY29uc3QgU29sdXRpb25NYW5hZ2VyID0gbmV3IFNvbHV0aW9uSW5zdGFuY2VNYW5hZ2VyKCk7XG4vKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

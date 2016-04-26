"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ViewModel = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _omnisharpClient = require("omnisharp-client");

var _rxjs = require("rxjs");

var _path = require("path");

var _projectViewModel = require("./project-view-model");

var _outputMessageElement = require("../views/output-message-element");

var _bufferFor = require("../operators/bufferFor");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var fastdom = require("fastdom");

var ViewModel = exports.ViewModel = function () {
    function ViewModel(_solution) {
        var _this = this;

        _classCallCheck(this, ViewModel);

        this._solution = _solution;
        this._disposable = new _omnisharpClient.CompositeDisposable();
        this.output = [];
        this.outputElement = document.createElement("div");
        this.diagnostics = [];
        this.packageSources = [];
        this.projects = [];
        this._projectAddedStream = new _rxjs.Subject();
        this._projectRemovedStream = new _rxjs.Subject();
        this._projectChangedStream = new _rxjs.Subject();
        this._stateStream = new _rxjs.ReplaySubject(1);
        this._uniqueId = _solution.uniqueId;
        this._updateState(_solution.currentState);
        this.outputElement.classList.add("messages-container");
        this._disposable.add(_solution.logs.subscribe(function (event) {
            _this.output.push(event);
            if (_this.output.length > 1000) {
                _this.output.shift();
            }
        }));
        this._disposable.add((0, _bufferFor.bufferFor)(_solution.logs, 100).subscribe(function (items) {
            var removals = [];
            if (_this.outputElement.children.length === 1000) {
                for (var i = 0; i < items.length; i++) {
                    removals.push(_this.outputElement.children[i]);
                }
            }
            fastdom.mutate(function () {
                _lodash2.default.each(removals, function (x) {
                    return x.remove();
                });
                _lodash2.default.each(items, function (event) {
                    _this.outputElement.appendChild(_outputMessageElement.OutputMessageElement.create(event));
                });
            });
        }));
        this._disposable.add(_solution.state.filter(function (z) {
            return z === _omnisharpClient.DriverState.Disconnected;
        }).subscribe(function () {
            _lodash2.default.each(_this.projects.slice(), function (project) {
                return _this._projectRemovedStream.next(project);
            });
            _this.projects = [];
            _this.diagnostics = [];
        }));

        var _setupCodecheck2 = this._setupCodecheck(_solution);

        var codecheck = _setupCodecheck2.codecheck;

        var status = this._setupStatus(_solution);
        var output = this.output;
        var _projectAddedStream = this._projectAddedStream.share();
        var _projectRemovedStream = this._projectRemovedStream.share();
        var _projectChangedStream = this._projectChangedStream.share();
        var projects = _rxjs.Observable.merge(_projectAddedStream, _projectRemovedStream, _projectChangedStream).startWith([]).debounceTime(200).map(function (z) {
            return _this.projects;
        }).publishReplay(1).refCount();
        var outputObservable = _solution.logs.auditTime(100).map(function () {
            return output;
        });
        var state = this._stateStream;
        this.observe = {
            get codecheck() {
                return codecheck;
            },
            get output() {
                return outputObservable;
            },
            get status() {
                return status;
            },
            get state() {
                return state;
            },
            get projects() {
                return projects;
            },
            get projectAdded() {
                return _projectAddedStream;
            },
            get projectRemoved() {
                return _projectRemovedStream;
            },
            get projectChanged() {
                return _projectChangedStream;
            }
        };
        this._disposable.add(_solution.state.subscribe(_lodash2.default.bind(this._updateState, this)));
        (window["clients"] || (window["clients"] = [])).push(this);
        this._disposable.add(_solution.state.filter(function (z) {
            return z === _omnisharpClient.DriverState.Connected;
        }).subscribe(function () {
            _solution.projects({ ExcludeSourceFiles: false });
            _solution.packagesource({ ProjectPath: _solution.path }).subscribe(function (response) {
                _this.packageSources = response.Sources;
            });
        }));
        this._disposable.add(_solution.state.filter(function (z) {
            return z === _omnisharpClient.DriverState.Disconnected;
        }).subscribe(function () {
            _lodash2.default.each(_this.projects.slice(), function (project) {
                return _this._projectRemovedStream.next(project);
            });
        }));
        this._disposable.add(_solution.observe.projectAdded.subscribe(function (projectInformation) {
            _lodash2.default.each((0, _projectViewModel.projectViewModelFactory)(projectInformation, _solution.projectPath), function (project) {
                if (!_lodash2.default.some(_this.projects, { path: project.path })) {
                    _this.projects.push(project);
                    _this._projectAddedStream.next(project);
                }
            });
        }));
        this._disposable.add(_solution.observe.projectRemoved.subscribe(function (projectInformation) {
            _lodash2.default.each((0, _projectViewModel.projectViewModelFactory)(projectInformation, _solution.projectPath), function (project) {
                var found = _lodash2.default.find(_this.projects, { path: project.path });
                if (found) {
                    _lodash2.default.pull(_this.projects, found);
                    _this._projectRemovedStream.next(project);
                }
            });
        }));
        this._disposable.add(_solution.observe.projectChanged.subscribe(function (projectInformation) {
            _lodash2.default.each((0, _projectViewModel.projectViewModelFactory)(projectInformation, _solution.projectPath), function (project) {
                var found = _lodash2.default.find(_this.projects, { path: project.path });
                if (found) {
                    found.update(project);
                    _this._projectChangedStream.next(project);
                }
            });
        }));
        this._disposable.add(_solution.observe.projects.subscribe(function (context) {
            _lodash2.default.each((0, _projectViewModel.workspaceViewModelFactory)(context.response, _solution.projectPath), function (project) {
                var found = _lodash2.default.find(_this.projects, { path: project.path });
                if (found) {
                    found.update(project);
                    _this._projectChangedStream.next(project);
                } else {
                    _this.projects.push(project);
                    _this._projectAddedStream.next(project);
                }
            });
        }));
        this._disposable.add(this._projectAddedStream);
        this._disposable.add(this._projectChangedStream);
        this._disposable.add(this._projectRemovedStream);
        this._disposable.add(_omnisharpClient.Disposable.create(function () {
            _lodash2.default.each(_this.projects, function (x) {
                return x.dispose();
            });
        }));
    }

    _createClass(ViewModel, [{
        key: "dispose",
        value: function dispose() {
            this._disposable.dispose();
        }
    }, {
        key: "getProjectForEditor",
        value: function getProjectForEditor(editor) {
            return this.getProjectForPath(editor.getPath()).filter(function () {
                return !editor.isDestroyed();
            });
        }
    }, {
        key: "getProjectForPath",
        value: function getProjectForPath(path) {
            if (this.isOn && this.projects.length) {
                var project = _lodash2.default.find(this.projects, function (x) {
                    return x.filesSet.has(path);
                });
                if (project) {
                    return _rxjs.Observable.of(project);
                }
            }
            return this.observe.projectAdded.filter(function (x) {
                return _lodash2.default.startsWith(path, x.path);
            }).take(1);
        }
    }, {
        key: "getProjectContainingEditor",
        value: function getProjectContainingEditor(editor) {
            return this.getProjectContainingFile(editor.getPath());
        }
    }, {
        key: "getProjectContainingFile",
        value: function getProjectContainingFile(path) {
            if (this.isOn && this.projects.length) {
                var project = _lodash2.default.find(this.projects, function (x) {
                    return _lodash2.default.includes(x.sourceFiles, (0, _path.normalize)(path));
                });
                if (project) {
                    return _rxjs.Observable.of(project);
                }
                return _rxjs.Observable.of(null);
            } else {
                return this.observe.projectAdded.filter(function (x) {
                    return _lodash2.default.includes(x.sourceFiles, (0, _path.normalize)(path));
                }).take(1).defaultIfEmpty(null);
            }
        }
    }, {
        key: "_updateState",
        value: function _updateState(state) {
            this.isOn = state === _omnisharpClient.DriverState.Connecting || state === _omnisharpClient.DriverState.Connected;
            this.isOff = state === _omnisharpClient.DriverState.Disconnected;
            this.isConnecting = state === _omnisharpClient.DriverState.Connecting;
            this.isReady = state === _omnisharpClient.DriverState.Connected;
            this.isError = state === _omnisharpClient.DriverState.Error;
            this._stateStream.next(this);
        }
    }, {
        key: "_setupCodecheck",
        value: function _setupCodecheck(_solution) {
            var _this2 = this;

            var codecheck = _rxjs.Observable.merge(_solution.observe.codecheck.filter(function (z) {
                return !z.request.FileName;
            }).map(function (z) {
                return z.response || {};
            }).map(function (z) {
                return z.QuickFixes || [];
            }), _solution.observe.codecheck.filter(function (z) {
                return !!z.request.FileName;
            }).map(function (ctx) {
                var request = ctx.request;
                var response = ctx.response;

                if (!response) response = {};
                var results = _lodash2.default.filter(_this2.diagnostics, function (fix) {
                    return request.FileName !== fix.FileName;
                });
                results.unshift.apply(results, _toConsumableArray(response.QuickFixes || []));
                return results;
            })).map(function (data) {
                return _lodash2.default.sortBy(data, function (quickFix) {
                    return quickFix.LogLevel;
                });
            }).startWith([]).publishReplay(1).refCount();
            this._disposable.add(codecheck.subscribe(function (data) {
                return _this2.diagnostics = data;
            }));
            return { codecheck: codecheck };
        }
    }, {
        key: "_setupStatus",
        value: function _setupStatus(_solution) {
            var status = _solution.status.startWith({}).share();
            return status;
        }
    }, {
        key: "uniqueId",
        get: function get() {
            return this._solution.uniqueId;
        }
    }, {
        key: "index",
        get: function get() {
            return this._solution.index;
        }
    }, {
        key: "path",
        get: function get() {
            return this._solution.path;
        }
    }, {
        key: "state",
        get: function get() {
            return this._solution.currentState;
        }
    }]);

    return ViewModel;
}();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvdmlldy1tb2RlbC5qcyIsImxpYi9zZXJ2ZXIvdmlldy1tb2RlbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOztBQUVBOztBQUNBOztBQUNBOztBQUVBOzs7Ozs7OztBQ0FBLElBQUksVUFBMEIsUUFBUSxTQUFSLENBQTlCOztJQVdBLFMsV0FBQSxTO0FBb0NJLHVCQUFvQixTQUFwQixFQUF1QztBQUFBOztBQUFBOztBQUFuQixhQUFBLFNBQUEsR0FBQSxTQUFBO0FBNUJaLGFBQUEsV0FBQSxHQUFjLDBDQUFkO0FBS0QsYUFBQSxNQUFBLEdBQTBCLEVBQTFCO0FBQ0EsYUFBQSxhQUFBLEdBQWdCLFNBQVMsYUFBVCxDQUF1QixLQUF2QixDQUFoQjtBQUNBLGFBQUEsV0FBQSxHQUEyQyxFQUEzQztBQUdBLGFBQUEsY0FBQSxHQUEyQixFQUEzQjtBQUNBLGFBQUEsUUFBQSxHQUFvQyxFQUFwQztBQUNDLGFBQUEsbUJBQUEsR0FBc0IsbUJBQXRCO0FBQ0EsYUFBQSxxQkFBQSxHQUF3QixtQkFBeEI7QUFDQSxhQUFBLHFCQUFBLEdBQXdCLG1CQUF4QjtBQUNBLGFBQUEsWUFBQSxHQUFlLHdCQUE2QixDQUE3QixDQUFmO0FBY0osYUFBSyxTQUFMLEdBQWlCLFVBQVUsUUFBM0I7QUFDQSxhQUFLLFlBQUwsQ0FBa0IsVUFBVSxZQUE1QjtBQUVBLGFBQUssYUFBTCxDQUFtQixTQUFuQixDQUE2QixHQUE3QixDQUFpQyxvQkFBakM7QUFHQSxhQUFLLFdBQUwsQ0FBaUIsR0FBakIsQ0FBcUIsVUFBVSxJQUFWLENBQWUsU0FBZixDQUF5QixpQkFBSztBQUMvQyxrQkFBSyxNQUFMLENBQVksSUFBWixDQUFpQixLQUFqQjtBQUVBLGdCQUFJLE1BQUssTUFBTCxDQUFZLE1BQVosR0FBcUIsSUFBekIsRUFBK0I7QUFDM0Isc0JBQUssTUFBTCxDQUFZLEtBQVo7QUFDSDtBQUNKLFNBTm9CLENBQXJCO0FB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IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgRHJpdmVyU3RhdGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU3ViamVjdCwgUmVwbGF5U3ViamVjdCB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IG5vcm1hbGl6ZSB9IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBwcm9qZWN0Vmlld01vZGVsRmFjdG9yeSwgd29ya3NwYWNlVmlld01vZGVsRmFjdG9yeSB9IGZyb20gXCIuL3Byb2plY3Qtdmlldy1tb2RlbFwiO1xuaW1wb3J0IHsgT3V0cHV0TWVzc2FnZUVsZW1lbnQgfSBmcm9tIFwiLi4vdmlld3Mvb3V0cHV0LW1lc3NhZ2UtZWxlbWVudFwiO1xubGV0IGZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcbmltcG9ydCB7IGJ1ZmZlckZvciB9IGZyb20gXCIuLi9vcGVyYXRvcnMvYnVmZmVyRm9yXCI7XG5leHBvcnQgY2xhc3MgVmlld01vZGVsIHtcbiAgICBjb25zdHJ1Y3Rvcihfc29sdXRpb24pIHtcbiAgICAgICAgdGhpcy5fc29sdXRpb24gPSBfc29sdXRpb247XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLm91dHB1dCA9IFtdO1xuICAgICAgICB0aGlzLm91dHB1dEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB0aGlzLmRpYWdub3N0aWNzID0gW107XG4gICAgICAgIHRoaXMucGFja2FnZVNvdXJjZXMgPSBbXTtcbiAgICAgICAgdGhpcy5wcm9qZWN0cyA9IFtdO1xuICAgICAgICB0aGlzLl9wcm9qZWN0QWRkZWRTdHJlYW0gPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICB0aGlzLl9wcm9qZWN0UmVtb3ZlZFN0cmVhbSA9IG5ldyBTdWJqZWN0KCk7XG4gICAgICAgIHRoaXMuX3Byb2plY3RDaGFuZ2VkU3RyZWFtID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgdGhpcy5fc3RhdGVTdHJlYW0gPSBuZXcgUmVwbGF5U3ViamVjdCgxKTtcbiAgICAgICAgdGhpcy5fdW5pcXVlSWQgPSBfc29sdXRpb24udW5pcXVlSWQ7XG4gICAgICAgIHRoaXMuX3VwZGF0ZVN0YXRlKF9zb2x1dGlvbi5jdXJyZW50U3RhdGUpO1xuICAgICAgICB0aGlzLm91dHB1dEVsZW1lbnQuY2xhc3NMaXN0LmFkZChcIm1lc3NhZ2VzLWNvbnRhaW5lclwiKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLmxvZ3Muc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0LnB1c2goZXZlbnQpO1xuICAgICAgICAgICAgaWYgKHRoaXMub3V0cHV0Lmxlbmd0aCA+IDEwMDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLm91dHB1dC5zaGlmdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKGJ1ZmZlckZvcihfc29sdXRpb24ubG9ncywgMTAwKVxuICAgICAgICAgICAgLnN1YnNjcmliZShpdGVtcyA9PiB7XG4gICAgICAgICAgICBsZXQgcmVtb3ZhbHMgPSBbXTtcbiAgICAgICAgICAgIGlmICh0aGlzLm91dHB1dEVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoID09PSAxMDAwKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICByZW1vdmFscy5wdXNoKHRoaXMub3V0cHV0RWxlbWVudC5jaGlsZHJlbltpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIF8uZWFjaChyZW1vdmFscywgeCA9PiB4LnJlbW92ZSgpKTtcbiAgICAgICAgICAgICAgICBfLmVhY2goaXRlbXMsIGV2ZW50ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vdXRwdXRFbGVtZW50LmFwcGVuZENoaWxkKE91dHB1dE1lc3NhZ2VFbGVtZW50LmNyZWF0ZShldmVudCkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLnN0YXRlLmZpbHRlcih6ID0+IHogPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZCkuc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLnByb2plY3RzLnNsaWNlKCksIHByb2plY3QgPT4gdGhpcy5fcHJvamVjdFJlbW92ZWRTdHJlYW0ubmV4dChwcm9qZWN0KSk7XG4gICAgICAgICAgICB0aGlzLnByb2plY3RzID0gW107XG4gICAgICAgICAgICB0aGlzLmRpYWdub3N0aWNzID0gW107XG4gICAgICAgIH0pKTtcbiAgICAgICAgY29uc3QgeyBjb2RlY2hlY2sgfSA9IHRoaXMuX3NldHVwQ29kZWNoZWNrKF9zb2x1dGlvbik7XG4gICAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMuX3NldHVwU3RhdHVzKF9zb2x1dGlvbik7XG4gICAgICAgIGNvbnN0IG91dHB1dCA9IHRoaXMub3V0cHV0O1xuICAgICAgICBjb25zdCBfcHJvamVjdEFkZGVkU3RyZWFtID0gdGhpcy5fcHJvamVjdEFkZGVkU3RyZWFtLnNoYXJlKCk7XG4gICAgICAgIGNvbnN0IF9wcm9qZWN0UmVtb3ZlZFN0cmVhbSA9IHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtLnNoYXJlKCk7XG4gICAgICAgIGNvbnN0IF9wcm9qZWN0Q2hhbmdlZFN0cmVhbSA9IHRoaXMuX3Byb2plY3RDaGFuZ2VkU3RyZWFtLnNoYXJlKCk7XG4gICAgICAgIGNvbnN0IHByb2plY3RzID0gT2JzZXJ2YWJsZS5tZXJnZShfcHJvamVjdEFkZGVkU3RyZWFtLCBfcHJvamVjdFJlbW92ZWRTdHJlYW0sIF9wcm9qZWN0Q2hhbmdlZFN0cmVhbSlcbiAgICAgICAgICAgIC5zdGFydFdpdGgoW10pXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDIwMClcbiAgICAgICAgICAgIC5tYXAoeiA9PiB0aGlzLnByb2plY3RzKVxuICAgICAgICAgICAgLnB1Ymxpc2hSZXBsYXkoMSkucmVmQ291bnQoKTtcbiAgICAgICAgY29uc3Qgb3V0cHV0T2JzZXJ2YWJsZSA9IF9zb2x1dGlvbi5sb2dzXG4gICAgICAgICAgICAuYXVkaXRUaW1lKDEwMClcbiAgICAgICAgICAgIC5tYXAoKCkgPT4gb3V0cHV0KTtcbiAgICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzLl9zdGF0ZVN0cmVhbTtcbiAgICAgICAgdGhpcy5vYnNlcnZlID0ge1xuICAgICAgICAgICAgZ2V0IGNvZGVjaGVjaygpIHsgcmV0dXJuIGNvZGVjaGVjazsgfSxcbiAgICAgICAgICAgIGdldCBvdXRwdXQoKSB7IHJldHVybiBvdXRwdXRPYnNlcnZhYmxlOyB9LFxuICAgICAgICAgICAgZ2V0IHN0YXR1cygpIHsgcmV0dXJuIHN0YXR1czsgfSxcbiAgICAgICAgICAgIGdldCBzdGF0ZSgpIHsgcmV0dXJuIHN0YXRlOyB9LFxuICAgICAgICAgICAgZ2V0IHByb2plY3RzKCkgeyByZXR1cm4gcHJvamVjdHM7IH0sXG4gICAgICAgICAgICBnZXQgcHJvamVjdEFkZGVkKCkgeyByZXR1cm4gX3Byb2plY3RBZGRlZFN0cmVhbTsgfSxcbiAgICAgICAgICAgIGdldCBwcm9qZWN0UmVtb3ZlZCgpIHsgcmV0dXJuIF9wcm9qZWN0UmVtb3ZlZFN0cmVhbTsgfSxcbiAgICAgICAgICAgIGdldCBwcm9qZWN0Q2hhbmdlZCgpIHsgcmV0dXJuIF9wcm9qZWN0Q2hhbmdlZFN0cmVhbTsgfSxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLnN0YXRlLnN1YnNjcmliZShfLmJpbmQodGhpcy5fdXBkYXRlU3RhdGUsIHRoaXMpKSk7XG4gICAgICAgICh3aW5kb3dbXCJjbGllbnRzXCJdIHx8ICh3aW5kb3dbXCJjbGllbnRzXCJdID0gW10pKS5wdXNoKHRoaXMpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChfc29sdXRpb24uc3RhdGUuZmlsdGVyKHogPT4geiA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGVkKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICBfc29sdXRpb24ucHJvamVjdHMoeyBFeGNsdWRlU291cmNlRmlsZXM6IGZhbHNlIH0pO1xuICAgICAgICAgICAgX3NvbHV0aW9uLnBhY2thZ2Vzb3VyY2UoeyBQcm9qZWN0UGF0aDogX3NvbHV0aW9uLnBhdGggfSlcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnBhY2thZ2VTb3VyY2VzID0gcmVzcG9uc2UuU291cmNlcztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5zdGF0ZS5maWx0ZXIoeiA9PiB6ID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICBfLmVhY2godGhpcy5wcm9qZWN0cy5zbGljZSgpLCBwcm9qZWN0ID0+IHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtLm5leHQocHJvamVjdCkpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5vYnNlcnZlLnByb2plY3RBZGRlZC5zdWJzY3JpYmUocHJvamVjdEluZm9ybWF0aW9uID0+IHtcbiAgICAgICAgICAgIF8uZWFjaChwcm9qZWN0Vmlld01vZGVsRmFjdG9yeShwcm9qZWN0SW5mb3JtYXRpb24sIF9zb2x1dGlvbi5wcm9qZWN0UGF0aCksIHByb2plY3QgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghXy5zb21lKHRoaXMucHJvamVjdHMsIHsgcGF0aDogcHJvamVjdC5wYXRoIH0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdHMucHVzaChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdEFkZGVkU3RyZWFtLm5leHQocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLm9ic2VydmUucHJvamVjdFJlbW92ZWQuc3Vic2NyaWJlKHByb2plY3RJbmZvcm1hdGlvbiA9PiB7XG4gICAgICAgICAgICBfLmVhY2gocHJvamVjdFZpZXdNb2RlbEZhY3RvcnkocHJvamVjdEluZm9ybWF0aW9uLCBfc29sdXRpb24ucHJvamVjdFBhdGgpLCBwcm9qZWN0ID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBmb3VuZCA9IF8uZmluZCh0aGlzLnByb2plY3RzLCB7IHBhdGg6IHByb2plY3QucGF0aCB9KTtcbiAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHtcbiAgICAgICAgICAgICAgICAgICAgXy5wdWxsKHRoaXMucHJvamVjdHMsIGZvdW5kKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdFJlbW92ZWRTdHJlYW0ubmV4dChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChfc29sdXRpb24ub2JzZXJ2ZS5wcm9qZWN0Q2hhbmdlZC5zdWJzY3JpYmUocHJvamVjdEluZm9ybWF0aW9uID0+IHtcbiAgICAgICAgICAgIF8uZWFjaChwcm9qZWN0Vmlld01vZGVsRmFjdG9yeShwcm9qZWN0SW5mb3JtYXRpb24sIF9zb2x1dGlvbi5wcm9qZWN0UGF0aCksIHByb2plY3QgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gXy5maW5kKHRoaXMucHJvamVjdHMsIHsgcGF0aDogcHJvamVjdC5wYXRoIH0pO1xuICAgICAgICAgICAgICAgIGlmIChmb3VuZCkge1xuICAgICAgICAgICAgICAgICAgICBmb3VuZC51cGRhdGUocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RDaGFuZ2VkU3RyZWFtLm5leHQocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLm9ic2VydmUucHJvamVjdHMuc3Vic2NyaWJlKGNvbnRleHQgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKHdvcmtzcGFjZVZpZXdNb2RlbEZhY3RvcnkoY29udGV4dC5yZXNwb25zZSwgX3NvbHV0aW9uLnByb2plY3RQYXRoKSwgcHJvamVjdCA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgZm91bmQgPSBfLmZpbmQodGhpcy5wcm9qZWN0cywgeyBwYXRoOiBwcm9qZWN0LnBhdGggfSk7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kLnVwZGF0ZShwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdENoYW5nZWRTdHJlYW0ubmV4dChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdHMucHVzaChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdEFkZGVkU3RyZWFtLm5leHQocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fcHJvamVjdEFkZGVkU3RyZWFtKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fcHJvamVjdENoYW5nZWRTdHJlYW0pO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9wcm9qZWN0UmVtb3ZlZFN0cmVhbSk7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLnByb2plY3RzLCB4ID0+IHguZGlzcG9zZSgpKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBnZXQgdW5pcXVlSWQoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvbi51bmlxdWVJZDsgfVxuICAgIGdldCBpbmRleCgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uLmluZGV4OyB9XG4gICAgZ2V0IHBhdGgoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvbi5wYXRoOyB9XG4gICAgZ2V0IHN0YXRlKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb24uY3VycmVudFN0YXRlOyB9XG4gICAgO1xuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBnZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRQcm9qZWN0Rm9yUGF0aChlZGl0b3IuZ2V0UGF0aCgpKVxuICAgICAgICAgICAgLmZpbHRlcigoKSA9PiAhZWRpdG9yLmlzRGVzdHJveWVkKCkpO1xuICAgIH1cbiAgICBnZXRQcm9qZWN0Rm9yUGF0aChwYXRoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzT24gJiYgdGhpcy5wcm9qZWN0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb2plY3QgPSBfLmZpbmQodGhpcy5wcm9qZWN0cywgeCA9PiB4LmZpbGVzU2V0LmhhcyhwYXRoKSk7XG4gICAgICAgICAgICBpZiAocHJvamVjdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHByb2plY3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm9ic2VydmUucHJvamVjdEFkZGVkLmZpbHRlcih4ID0+IF8uc3RhcnRzV2l0aChwYXRoLCB4LnBhdGgpKS50YWtlKDEpO1xuICAgIH1cbiAgICBnZXRQcm9qZWN0Q29udGFpbmluZ0VkaXRvcihlZGl0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0UHJvamVjdENvbnRhaW5pbmdGaWxlKGVkaXRvci5nZXRQYXRoKCkpO1xuICAgIH1cbiAgICBnZXRQcm9qZWN0Q29udGFpbmluZ0ZpbGUocGF0aCkge1xuICAgICAgICBpZiAodGhpcy5pc09uICYmIHRoaXMucHJvamVjdHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0ID0gXy5maW5kKHRoaXMucHJvamVjdHMsIHggPT4gXy5pbmNsdWRlcyh4LnNvdXJjZUZpbGVzLCBub3JtYWxpemUocGF0aCkpKTtcbiAgICAgICAgICAgIGlmIChwcm9qZWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YocHJvamVjdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9ic2VydmUucHJvamVjdEFkZGVkXG4gICAgICAgICAgICAgICAgLmZpbHRlcih4ID0+IF8uaW5jbHVkZXMoeC5zb3VyY2VGaWxlcywgbm9ybWFsaXplKHBhdGgpKSlcbiAgICAgICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgICAgIC5kZWZhdWx0SWZFbXB0eShudWxsKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBfdXBkYXRlU3RhdGUoc3RhdGUpIHtcbiAgICAgICAgdGhpcy5pc09uID0gc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RpbmcgfHwgc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZDtcbiAgICAgICAgdGhpcy5pc09mZiA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQ7XG4gICAgICAgIHRoaXMuaXNDb25uZWN0aW5nID0gc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3Rpbmc7XG4gICAgICAgIHRoaXMuaXNSZWFkeSA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQ7XG4gICAgICAgIHRoaXMuaXNFcnJvciA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5FcnJvcjtcbiAgICAgICAgdGhpcy5fc3RhdGVTdHJlYW0ubmV4dCh0aGlzKTtcbiAgICB9XG4gICAgX3NldHVwQ29kZWNoZWNrKF9zb2x1dGlvbikge1xuICAgICAgICBjb25zdCBjb2RlY2hlY2sgPSBPYnNlcnZhYmxlLm1lcmdlKF9zb2x1dGlvbi5vYnNlcnZlLmNvZGVjaGVja1xuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6LnJlcXVlc3QuRmlsZU5hbWUpXG4gICAgICAgICAgICAubWFwKHogPT4gei5yZXNwb25zZSB8fCB7fSlcbiAgICAgICAgICAgIC5tYXAoeiA9PiB6LlF1aWNrRml4ZXMgfHwgW10pLCBfc29sdXRpb24ub2JzZXJ2ZS5jb2RlY2hlY2tcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXoucmVxdWVzdC5GaWxlTmFtZSlcbiAgICAgICAgICAgIC5tYXAoKGN0eCkgPT4ge1xuICAgICAgICAgICAgbGV0IHsgcmVxdWVzdCwgcmVzcG9uc2UgfSA9IGN0eDtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2UpXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UgPSB7fTtcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBfLmZpbHRlcih0aGlzLmRpYWdub3N0aWNzLCAoZml4KSA9PiByZXF1ZXN0LkZpbGVOYW1lICE9PSBmaXguRmlsZU5hbWUpO1xuICAgICAgICAgICAgcmVzdWx0cy51bnNoaWZ0KC4uLnJlc3BvbnNlLlF1aWNrRml4ZXMgfHwgW10pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgIH0pKVxuICAgICAgICAgICAgLm1hcChkYXRhID0+IF8uc29ydEJ5KGRhdGEsIHF1aWNrRml4ID0+IHF1aWNrRml4LkxvZ0xldmVsKSlcbiAgICAgICAgICAgIC5zdGFydFdpdGgoW10pXG4gICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChjb2RlY2hlY2suc3Vic2NyaWJlKChkYXRhKSA9PiB0aGlzLmRpYWdub3N0aWNzID0gZGF0YSkpO1xuICAgICAgICByZXR1cm4geyBjb2RlY2hlY2sgfTtcbiAgICB9XG4gICAgX3NldHVwU3RhdHVzKF9zb2x1dGlvbikge1xuICAgICAgICBjb25zdCBzdGF0dXMgPSBfc29sdXRpb24uc3RhdHVzXG4gICAgICAgICAgICAuc3RhcnRXaXRoKHt9KVxuICAgICAgICAgICAgLnNoYXJlKCk7XG4gICAgICAgIHJldHVybiBzdGF0dXM7XG4gICAgfVxufVxuIiwiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHtTb2x1dGlvbn0gZnJvbSBcIi4vc29sdXRpb25cIjtcbmltcG9ydCB7TW9kZWxzLCBEcml2ZXJTdGF0ZSwgT21uaXNoYXJwQ2xpZW50U3RhdHVzfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0LCBSZXBsYXlTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7bm9ybWFsaXplfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHtQcm9qZWN0Vmlld01vZGVsLCBwcm9qZWN0Vmlld01vZGVsRmFjdG9yeSwgd29ya3NwYWNlVmlld01vZGVsRmFjdG9yeX0gZnJvbSBcIi4vcHJvamVjdC12aWV3LW1vZGVsXCI7XG5pbXBvcnQge091dHB1dE1lc3NhZ2VFbGVtZW50fSBmcm9tIFwiLi4vdmlld3Mvb3V0cHV0LW1lc3NhZ2UtZWxlbWVudFwiO1xubGV0IGZhc3Rkb206IHR5cGVvZiBGYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XG5pbXBvcnQge2J1ZmZlckZvcn0gZnJvbSBcIi4uL29wZXJhdG9ycy9idWZmZXJGb3JcIjtcblxuZXhwb3J0IGludGVyZmFjZSBWTVZpZXdTdGF0ZSB7XG4gICAgaXNPZmY6IGJvb2xlYW47XG4gICAgaXNDb25uZWN0aW5nOiBib29sZWFuO1xuICAgIGlzT246IGJvb2xlYW47XG4gICAgaXNSZWFkeTogYm9vbGVhbjtcbiAgICBpc0Vycm9yOiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgVmlld01vZGVsIGltcGxlbWVudHMgVk1WaWV3U3RhdGUsIElEaXNwb3NhYmxlIHtcbiAgICBwdWJsaWMgaXNPZmY6IGJvb2xlYW47XG4gICAgcHVibGljIGlzQ29ubmVjdGluZzogYm9vbGVhbjtcbiAgICBwdWJsaWMgaXNPbjogYm9vbGVhbjtcbiAgICBwdWJsaWMgaXNSZWFkeTogYm9vbGVhbjtcbiAgICBwdWJsaWMgaXNFcnJvcjogYm9vbGVhbjtcblxuICAgIHByaXZhdGUgX3VuaXF1ZUlkOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBfZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgcHVibGljIGdldCB1bmlxdWVJZCgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uLnVuaXF1ZUlkOyB9XG5cbiAgICBwdWJsaWMgZ2V0IGluZGV4KCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb24uaW5kZXg7IH1cbiAgICBwdWJsaWMgZ2V0IHBhdGgoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvbi5wYXRoOyB9XG4gICAgcHVibGljIG91dHB1dDogT3V0cHV0TWVzc2FnZVtdID0gW107XG4gICAgcHVibGljIG91dHB1dEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgIHB1YmxpYyBkaWFnbm9zdGljczogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbltdID0gW107XG5cbiAgICBwdWJsaWMgZ2V0IHN0YXRlKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb24uY3VycmVudFN0YXRlOyB9O1xuICAgIHB1YmxpYyBwYWNrYWdlU291cmNlczogc3RyaW5nW10gPSBbXTtcbiAgICBwdWJsaWMgcHJvamVjdHM6IFByb2plY3RWaWV3TW9kZWw8YW55PltdID0gW107XG4gICAgcHJpdmF0ZSBfcHJvamVjdEFkZGVkU3RyZWFtID0gbmV3IFN1YmplY3Q8UHJvamVjdFZpZXdNb2RlbDxhbnk+PigpO1xuICAgIHByaXZhdGUgX3Byb2plY3RSZW1vdmVkU3RyZWFtID0gbmV3IFN1YmplY3Q8UHJvamVjdFZpZXdNb2RlbDxhbnk+PigpO1xuICAgIHByaXZhdGUgX3Byb2plY3RDaGFuZ2VkU3RyZWFtID0gbmV3IFN1YmplY3Q8UHJvamVjdFZpZXdNb2RlbDxhbnk+PigpO1xuICAgIHByaXZhdGUgX3N0YXRlU3RyZWFtID0gbmV3IFJlcGxheVN1YmplY3Q8Vmlld01vZGVsPigxKTtcblxuICAgIHB1YmxpYyBvYnNlcnZlOiB7XG4gICAgICAgIGNvZGVjaGVjazogT2JzZXJ2YWJsZTxNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uW10+O1xuICAgICAgICBvdXRwdXQ6IE9ic2VydmFibGU8T3V0cHV0TWVzc2FnZVtdPjtcbiAgICAgICAgc3RhdHVzOiBPYnNlcnZhYmxlPE9tbmlzaGFycENsaWVudFN0YXR1cz47XG4gICAgICAgIHN0YXRlOiBPYnNlcnZhYmxlPFZpZXdNb2RlbD47XG4gICAgICAgIHByb2plY3RBZGRlZDogT2JzZXJ2YWJsZTxQcm9qZWN0Vmlld01vZGVsPGFueT4+O1xuICAgICAgICBwcm9qZWN0UmVtb3ZlZDogT2JzZXJ2YWJsZTxQcm9qZWN0Vmlld01vZGVsPGFueT4+O1xuICAgICAgICBwcm9qZWN0Q2hhbmdlZDogT2JzZXJ2YWJsZTxQcm9qZWN0Vmlld01vZGVsPGFueT4+O1xuICAgICAgICBwcm9qZWN0czogT2JzZXJ2YWJsZTxQcm9qZWN0Vmlld01vZGVsPGFueT5bXT47XG4gICAgfTtcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX3NvbHV0aW9uOiBTb2x1dGlvbikge1xuICAgICAgICB0aGlzLl91bmlxdWVJZCA9IF9zb2x1dGlvbi51bmlxdWVJZDtcbiAgICAgICAgdGhpcy5fdXBkYXRlU3RhdGUoX3NvbHV0aW9uLmN1cnJlbnRTdGF0ZSk7XG5cbiAgICAgICAgdGhpcy5vdXRwdXRFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJtZXNzYWdlcy1jb250YWluZXJcIik7XG5cbiAgICAgICAgLy8gTWFuYWdlIG91ciBidWlsZCBsb2cgZm9yIGRpc3BsYXlcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLmxvZ3Muc3Vic2NyaWJlKGV2ZW50ID0+IHtcbiAgICAgICAgICAgIHRoaXMub3V0cHV0LnB1c2goZXZlbnQpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5vdXRwdXQubGVuZ3RoID4gMTAwMCkge1xuICAgICAgICAgICAgICAgIHRoaXMub3V0cHV0LnNoaWZ0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcblxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChidWZmZXJGb3IoX3NvbHV0aW9uLmxvZ3MsIDEwMClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoaXRlbXMgPT4ge1xuICAgICAgICAgICAgICAgIGxldCByZW1vdmFsczogRWxlbWVudFtdID0gW107XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub3V0cHV0RWxlbWVudC5jaGlsZHJlbi5sZW5ndGggPT09IDEwMDApIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVtb3ZhbHMucHVzaCh0aGlzLm91dHB1dEVsZW1lbnQuY2hpbGRyZW5baV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBfLmVhY2gocmVtb3ZhbHMsIHggPT4geC5yZW1vdmUoKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgXy5lYWNoKGl0ZW1zLCBldmVudCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm91dHB1dEVsZW1lbnQuYXBwZW5kQ2hpbGQoT3V0cHV0TWVzc2FnZUVsZW1lbnQuY3JlYXRlKGV2ZW50KSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5zdGF0ZS5maWx0ZXIoeiA9PiB6ID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQpLnN1YnNjcmliZSgoKSA9PiB7XG4gICAgICAgICAgICBfLmVhY2godGhpcy5wcm9qZWN0cy5zbGljZSgpLCBwcm9qZWN0ID0+IHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtLm5leHQocHJvamVjdCkpO1xuICAgICAgICAgICAgdGhpcy5wcm9qZWN0cyA9IFtdO1xuICAgICAgICAgICAgdGhpcy5kaWFnbm9zdGljcyA9IFtdO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgY29uc3Qge2NvZGVjaGVja30gPSB0aGlzLl9zZXR1cENvZGVjaGVjayhfc29sdXRpb24pO1xuICAgICAgICBjb25zdCBzdGF0dXMgPSB0aGlzLl9zZXR1cFN0YXR1cyhfc29sdXRpb24pO1xuICAgICAgICBjb25zdCBvdXRwdXQgPSB0aGlzLm91dHB1dDtcblxuICAgICAgICBjb25zdCBfcHJvamVjdEFkZGVkU3RyZWFtID0gdGhpcy5fcHJvamVjdEFkZGVkU3RyZWFtLnNoYXJlKCk7XG4gICAgICAgIGNvbnN0IF9wcm9qZWN0UmVtb3ZlZFN0cmVhbSA9IHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtLnNoYXJlKCk7XG4gICAgICAgIGNvbnN0IF9wcm9qZWN0Q2hhbmdlZFN0cmVhbSA9IHRoaXMuX3Byb2plY3RDaGFuZ2VkU3RyZWFtLnNoYXJlKCk7XG4gICAgICAgIGNvbnN0IHByb2plY3RzID0gT2JzZXJ2YWJsZS5tZXJnZShfcHJvamVjdEFkZGVkU3RyZWFtLCBfcHJvamVjdFJlbW92ZWRTdHJlYW0sIF9wcm9qZWN0Q2hhbmdlZFN0cmVhbSlcbiAgICAgICAgICAgIC5zdGFydFdpdGgoPGFueT5bXSlcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoMjAwKVxuICAgICAgICAgICAgLm1hcCh6ID0+IHRoaXMucHJvamVjdHMpXG4gICAgICAgICAgICAucHVibGlzaFJlcGxheSgxKS5yZWZDb3VudCgpO1xuXG4gICAgICAgIGNvbnN0IG91dHB1dE9ic2VydmFibGUgPSBfc29sdXRpb24ubG9nc1xuICAgICAgICAgICAgLmF1ZGl0VGltZSgxMDApXG4gICAgICAgICAgICAubWFwKCgpID0+IG91dHB1dCk7XG5cbiAgICAgICAgY29uc3Qgc3RhdGUgPSB0aGlzLl9zdGF0ZVN0cmVhbTtcblxuICAgICAgICB0aGlzLm9ic2VydmUgPSB7XG4gICAgICAgICAgICBnZXQgY29kZWNoZWNrKCkgeyByZXR1cm4gY29kZWNoZWNrOyB9LFxuICAgICAgICAgICAgZ2V0IG91dHB1dCgpIHsgcmV0dXJuIG91dHB1dE9ic2VydmFibGU7IH0sXG4gICAgICAgICAgICBnZXQgc3RhdHVzKCkgeyByZXR1cm4gc3RhdHVzOyB9LFxuICAgICAgICAgICAgZ2V0IHN0YXRlKCkgeyByZXR1cm4gPE9ic2VydmFibGU8Vmlld01vZGVsPj48YW55PnN0YXRlOyB9LFxuICAgICAgICAgICAgZ2V0IHByb2plY3RzKCkgeyByZXR1cm4gcHJvamVjdHM7IH0sXG4gICAgICAgICAgICBnZXQgcHJvamVjdEFkZGVkKCkgeyByZXR1cm4gX3Byb2plY3RBZGRlZFN0cmVhbTsgfSxcbiAgICAgICAgICAgIGdldCBwcm9qZWN0UmVtb3ZlZCgpIHsgcmV0dXJuIF9wcm9qZWN0UmVtb3ZlZFN0cmVhbTsgfSxcbiAgICAgICAgICAgIGdldCBwcm9qZWN0Q2hhbmdlZCgpIHsgcmV0dXJuIF9wcm9qZWN0Q2hhbmdlZFN0cmVhbTsgfSxcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChfc29sdXRpb24uc3RhdGUuc3Vic2NyaWJlKF8uYmluZCh0aGlzLl91cGRhdGVTdGF0ZSwgdGhpcykpKTtcblxuICAgICAgICAvKiB0c2xpbnQ6ZGlzYWJsZSAqL1xuICAgICAgICAod2luZG93W1wiY2xpZW50c1wiXSB8fCAod2luZG93W1wiY2xpZW50c1wiXSA9IFtdKSkucHVzaCh0aGlzKTsgIC8vVEVNUFxuICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlICovXG5cbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoX3NvbHV0aW9uLnN0YXRlLmZpbHRlcih6ID0+IHogPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIF9zb2x1dGlvbi5wcm9qZWN0cyh7IEV4Y2x1ZGVTb3VyY2VGaWxlczogZmFsc2UgfSk7XG5cbiAgICAgICAgICAgICAgICBfc29sdXRpb24ucGFja2FnZXNvdXJjZSh7IFByb2plY3RQYXRoOiBfc29sdXRpb24ucGF0aCB9KVxuICAgICAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHJlc3BvbnNlID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFja2FnZVNvdXJjZXMgPSByZXNwb25zZS5Tb3VyY2VzO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChfc29sdXRpb24uc3RhdGUuZmlsdGVyKHogPT4geiA9PT0gRHJpdmVyU3RhdGUuRGlzY29ubmVjdGVkKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKHRoaXMucHJvamVjdHMuc2xpY2UoKSwgcHJvamVjdCA9PiB0aGlzLl9wcm9qZWN0UmVtb3ZlZFN0cmVhbS5uZXh0KHByb2plY3QpKTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5vYnNlcnZlLnByb2plY3RBZGRlZC5zdWJzY3JpYmUocHJvamVjdEluZm9ybWF0aW9uID0+IHtcbiAgICAgICAgICAgIF8uZWFjaChwcm9qZWN0Vmlld01vZGVsRmFjdG9yeShwcm9qZWN0SW5mb3JtYXRpb24sIF9zb2x1dGlvbi5wcm9qZWN0UGF0aCksIHByb2plY3QgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghXy5zb21lKHRoaXMucHJvamVjdHMsIHsgcGF0aDogcHJvamVjdC5wYXRoIH0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdHMucHVzaChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdEFkZGVkU3RyZWFtLm5leHQocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcblxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChfc29sdXRpb24ub2JzZXJ2ZS5wcm9qZWN0UmVtb3ZlZC5zdWJzY3JpYmUocHJvamVjdEluZm9ybWF0aW9uID0+IHtcbiAgICAgICAgICAgIF8uZWFjaChwcm9qZWN0Vmlld01vZGVsRmFjdG9yeShwcm9qZWN0SW5mb3JtYXRpb24sIF9zb2x1dGlvbi5wcm9qZWN0UGF0aCksIHByb2plY3QgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kOiBQcm9qZWN0Vmlld01vZGVsPGFueT4gPSBfLmZpbmQodGhpcy5wcm9qZWN0cywgeyBwYXRoOiBwcm9qZWN0LnBhdGggfSk7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIF8ucHVsbCh0aGlzLnByb2plY3RzLCBmb3VuZCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RSZW1vdmVkU3RyZWFtLm5leHQocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcblxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChfc29sdXRpb24ub2JzZXJ2ZS5wcm9qZWN0Q2hhbmdlZC5zdWJzY3JpYmUocHJvamVjdEluZm9ybWF0aW9uID0+IHtcbiAgICAgICAgICAgIF8uZWFjaChwcm9qZWN0Vmlld01vZGVsRmFjdG9yeShwcm9qZWN0SW5mb3JtYXRpb24sIF9zb2x1dGlvbi5wcm9qZWN0UGF0aCksIHByb2plY3QgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kOiBQcm9qZWN0Vmlld01vZGVsPGFueT4gPSBfLmZpbmQodGhpcy5wcm9qZWN0cywgeyBwYXRoOiBwcm9qZWN0LnBhdGggfSk7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kLnVwZGF0ZShwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdENoYW5nZWRTdHJlYW0ubmV4dChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKF9zb2x1dGlvbi5vYnNlcnZlLnByb2plY3RzLnN1YnNjcmliZShjb250ZXh0ID0+IHtcbiAgICAgICAgICAgIF8uZWFjaCh3b3Jrc3BhY2VWaWV3TW9kZWxGYWN0b3J5KGNvbnRleHQucmVzcG9uc2UsIF9zb2x1dGlvbi5wcm9qZWN0UGF0aCksIHByb2plY3QgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kOiBQcm9qZWN0Vmlld01vZGVsPGFueT4gPSBfLmZpbmQodGhpcy5wcm9qZWN0cywgeyBwYXRoOiBwcm9qZWN0LnBhdGggfSk7XG4gICAgICAgICAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvdW5kLnVwZGF0ZShwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdENoYW5nZWRTdHJlYW0ubmV4dChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2plY3RzLnB1c2gocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RBZGRlZFN0cmVhbS5uZXh0KHByb2plY3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgLyp0aGlzLl9kaXNwb3NhYmxlLmFkZChfc29sdXRpb24ub2JzZXJ2ZS5wcm9qZWN0c1xuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHoucmVzcG9uc2UgJiYgei5yZXNwb25zZS5Eb3ROZXQgJiYgei5yZXNwb25zZS5Eb3ROZXQuUHJvamVjdHMubGVuZ3RoID4gMClcbiAgICAgICAgICAgIC5tYXAoeiA9PiB6LnJlc3BvbnNlLkRvdE5ldClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoc3lzdGVtID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc3lzdGVtLlJ1bnRpbWVQYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucnVudGltZSA9IGJhc2VuYW1lKHN5c3RlbS5SdW50aW1lUGF0aCk7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IHBhdGggPSBub3JtYWxpemUoc3lzdGVtLlJ1bnRpbWVQYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpbjMyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBob21lID0gcHJvY2Vzcy5lbnYuSE9NRSB8fCBwcm9jZXNzLmVudi5VU0VSUFJPRklMRTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChob21lICYmIGhvbWUudHJpbSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvY2Vzc0hvbWUgPSBub3JtYWxpemUoaG9tZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSGFuZGxlcyB0aGUgY2FzZSB3aGVyZSBob21lIHBhdGggZG9lcyBub3QgaGF2ZSBhIHRyYWlsaW5nIHNsYXNoLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfLnN0YXJ0c1dpdGgocGF0aCwgcHJvY2Vzc0hvbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGggPSBwYXRoLnJlcGxhY2UocHJvY2Vzc0hvbWUsIFwiXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoID0gam9pbihwcm9jZXNzSG9tZSwgcGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucnVudGltZVBhdGggPSBwYXRoO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXRlU3RyZWFtLm5leHQodGhpcyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpOyovXG5cbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fcHJvamVjdEFkZGVkU3RyZWFtKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQodGhpcy5fcHJvamVjdENoYW5nZWRTdHJlYW0pO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZCh0aGlzLl9wcm9qZWN0UmVtb3ZlZFN0cmVhbSk7XG5cbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKHRoaXMucHJvamVjdHMsIHggPT4geC5kaXNwb3NlKCkpO1xuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFByb2plY3RGb3JQYXRoKGVkaXRvci5nZXRQYXRoKCkpXG4gICAgICAgICAgICAuZmlsdGVyKCgpID0+ICFlZGl0b3IuaXNEZXN0cm95ZWQoKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFByb2plY3RGb3JQYXRoKHBhdGg6IHN0cmluZykge1xuICAgICAgICBpZiAodGhpcy5pc09uICYmIHRoaXMucHJvamVjdHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9qZWN0ID0gXy5maW5kKHRoaXMucHJvamVjdHMsIHggPT4geC5maWxlc1NldC5oYXMocGF0aCkpO1xuICAgICAgICAgICAgaWYgKHByb2plY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihwcm9qZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLm9ic2VydmUucHJvamVjdEFkZGVkLmZpbHRlcih4ID0+IF8uc3RhcnRzV2l0aChwYXRoLCB4LnBhdGgpKS50YWtlKDEpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRQcm9qZWN0Q29udGFpbmluZ0VkaXRvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRQcm9qZWN0Q29udGFpbmluZ0ZpbGUoZWRpdG9yLmdldFBhdGgoKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFByb2plY3RDb250YWluaW5nRmlsZShwYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKHRoaXMuaXNPbiAmJiB0aGlzLnByb2plY3RzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgcHJvamVjdCA9IF8uZmluZCh0aGlzLnByb2plY3RzLCB4ID0+IF8uaW5jbHVkZXMoeC5zb3VyY2VGaWxlcywgbm9ybWFsaXplKHBhdGgpKSk7XG4gICAgICAgICAgICBpZiAocHJvamVjdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mKHByb2plY3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUub2YobnVsbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vYnNlcnZlLnByb2plY3RBZGRlZFxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeCA9PiBfLmluY2x1ZGVzKHguc291cmNlRmlsZXMsIG5vcm1hbGl6ZShwYXRoKSkpXG4gICAgICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgICAgICAuZGVmYXVsdElmRW1wdHkobnVsbCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF91cGRhdGVTdGF0ZShzdGF0ZTogRHJpdmVyU3RhdGUpIHtcbiAgICAgICAgdGhpcy5pc09uID0gc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RpbmcgfHwgc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZDtcbiAgICAgICAgdGhpcy5pc09mZiA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQ7XG4gICAgICAgIHRoaXMuaXNDb25uZWN0aW5nID0gc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3Rpbmc7XG4gICAgICAgIHRoaXMuaXNSZWFkeSA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQ7XG4gICAgICAgIHRoaXMuaXNFcnJvciA9IHN0YXRlID09PSBEcml2ZXJTdGF0ZS5FcnJvcjtcblxuICAgICAgICB0aGlzLl9zdGF0ZVN0cmVhbS5uZXh0KHRoaXMpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3NldHVwQ29kZWNoZWNrKF9zb2x1dGlvbjogU29sdXRpb24pIHtcbiAgICAgICAgY29uc3QgY29kZWNoZWNrID0gT2JzZXJ2YWJsZS5tZXJnZShcbiAgICAgICAgICAgIC8vIENhdGNoIGdsb2JhbCBjb2RlIGNoZWNrc1xuICAgICAgICAgICAgX3NvbHV0aW9uLm9ic2VydmUuY29kZWNoZWNrXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6LnJlcXVlc3QuRmlsZU5hbWUpXG4gICAgICAgICAgICAgICAgLm1hcCh6ID0+IHoucmVzcG9uc2UgfHwgPGFueT57fSlcbiAgICAgICAgICAgICAgICAubWFwKHogPT4gPE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT56LlF1aWNrRml4ZXMgfHwgW10pLFxuICAgICAgICAgICAgLy8gRXZpY3QgZGlhZ25vc3RpY3MgZnJvbSBhIGNvZGUgY2hlY2sgZm9yIHRoZSBnaXZlbiBmaWxlXG4gICAgICAgICAgICAvLyBUaGVuIGluc2VydCB0aGUgbmV3IGRpYWdub3N0aWNzXG4gICAgICAgICAgICBfc29sdXRpb24ub2JzZXJ2ZS5jb2RlY2hlY2tcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6LnJlcXVlc3QuRmlsZU5hbWUpXG4gICAgICAgICAgICAgICAgLm1hcCgoY3R4KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB7cmVxdWVzdCwgcmVzcG9uc2V9ID0gY3R4O1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc3BvbnNlKSByZXNwb25zZSA9IDxhbnk+e307XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdHMgPSBfLmZpbHRlcih0aGlzLmRpYWdub3N0aWNzLCAoZml4OiBNb2RlbHMuRGlhZ25vc3RpY0xvY2F0aW9uKSA9PiByZXF1ZXN0LkZpbGVOYW1lICE9PSBmaXguRmlsZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnVuc2hpZnQoLi4uPE1vZGVscy5EaWFnbm9zdGljTG9jYXRpb25bXT5yZXNwb25zZS5RdWlja0ZpeGVzIHx8IFtdKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgICAgICAgICAgfSkpXG4gICAgICAgICAgICAubWFwKGRhdGEgPT4gXy5zb3J0QnkoZGF0YSwgcXVpY2tGaXggPT4gcXVpY2tGaXguTG9nTGV2ZWwpKVxuICAgICAgICAgICAgLnN0YXJ0V2l0aChbXSlcbiAgICAgICAgICAgIC5wdWJsaXNoUmVwbGF5KDEpLnJlZkNvdW50KCk7XG5cbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoY29kZWNoZWNrLnN1YnNjcmliZSgoZGF0YSkgPT4gdGhpcy5kaWFnbm9zdGljcyA9IGRhdGEpKTtcbiAgICAgICAgcmV0dXJuIHsgY29kZWNoZWNrIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfc2V0dXBTdGF0dXMoX3NvbHV0aW9uOiBTb2x1dGlvbikge1xuICAgICAgICBjb25zdCBzdGF0dXMgPSBfc29sdXRpb24uc3RhdHVzXG4gICAgICAgICAgICAuc3RhcnRXaXRoKDxhbnk+e30pXG4gICAgICAgICAgICAuc2hhcmUoKTtcblxuICAgICAgICByZXR1cm4gc3RhdHVzO1xuICAgIH1cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.fileMonitor = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require("path");

var path = _interopRequireWildcard(_path);

var _fs = require("fs");

var fs = _interopRequireWildcard(_fs);

var _omni = require("../server/omni");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _atom = require("atom");

var _bufferFor = require("../operators/bufferFor");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function projectLock(solution, project, filePath) {
    var disposable = new _omnisharpClient.CompositeDisposable();
    var subject = new _rxjs.Subject();
    var file = new _atom.File(filePath),
        onDidChange = file.onDidChange(function () {
        return subject.next(filePath);
    }),
        onWillThrowWatchError = file.onWillThrowWatchError(function () {
        subject.next(filePath);
        disposable.remove(onDidChange);
        onDidChange.dispose();
        _lodash2.default.delay(function () {
            onDidChange = file.onDidChange(function () {
                return subject.next(filePath);
            });
            disposable.add(onDidChange);
        }, 5000);
    });
    disposable.add(onDidChange);
    disposable.add(onWillThrowWatchError);
    return {
        observable: subject.throttleTime(30000),
        dispose: function dispose() {
            return disposable.dispose();
        }
    };
}

var FileMonitor = function () {
    function FileMonitor() {
        _classCallCheck(this, FileMonitor);

        this.filesMap = new WeakMap();
        this.required = false;
        this.title = "Project Monitor";
        this.description = "Monitors project.lock.json files for changes outside of atom, and keeps the running solution in sync";
    }

    _createClass(FileMonitor, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            var changes = (0, _bufferFor.bufferFor)(_rxjs.Observable.merge(_omni.Omni.listener.model.projectAdded, _omni.Omni.listener.model.projectChanged).map(function (project) {
                return { project: project, filePath: path.join(project.path, "project.lock.json") };
            }).filter(function (_ref) {
                var filePath = _ref.filePath;
                return fs.existsSync(filePath);
            }).flatMap(function (_ref2) {
                var project = _ref2.project;
                var filePath = _ref2.filePath;
                return _omni.Omni.getSolutionForProject(project).map(function (solution) {
                    return { solution: solution, project: project, filePath: filePath };
                });
            }).filter(function (x) {
                return !!x.solution;
            }).flatMap(function (_ref3) {
                var solution = _ref3.solution;
                var project = _ref3.project;
                var filePath = _ref3.filePath;

                if (_this.filesMap.has(project)) {
                    var v = _this.filesMap.get(project);
                    v.dispose();
                }
                var lock = projectLock(solution, project, filePath);
                _this.disposable.add(lock);
                _this.filesMap.set(project, lock);
                return lock.observable.map(function (path) {
                    return { solution: solution, filePath: filePath };
                });
            }).share(), 30000);
            this.disposable.add(changes.subscribe(function (changs) {
                _lodash2.default.each(_lodash2.default.groupBy(changs, function (x) {
                    return x.solution.uniqueId;
                }), function (chang) {
                    var solution = chang[0].solution;
                    var paths = _lodash2.default.uniq(chang.map(function (x) {
                        return x.filePath;
                    }));
                    solution.filesChanged(paths.map(function (z) {
                        return { FileName: z };
                    }));
                });
            }));
            this.disposable.add(_omni.Omni.listener.model.projectRemoved.subscribe(function (project) {
                var removedItem = _this.filesMap.get(project);
                if (removedItem) {
                    _this.filesMap.delete(project);
                    removedItem.dispose();
                }
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return FileMonitor;
}();

var fileMonitor = exports.fileMonitor = new FileMonitor();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9wcm9qZWN0LWxvY2suanMiLCJsaWIvZmVhdHVyZXMvcHJvamVjdC1sb2NrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztJQ0FZLEk7O0FEQ1o7O0lDQVksRTs7QURDWjs7QUFDQTs7OztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7OztBQ0lBLFNBQUEsV0FBQSxDQUFxQixRQUFyQixFQUF5QyxPQUF6QyxFQUF5RSxRQUF6RSxFQUF5RjtBQUNyRixRQUFNLGFBQWEsMENBQW5CO0FBQ0EsUUFBTSxVQUFVLG1CQUFoQjtBQUNBLFFBQUksT0FBTyxlQUFTLFFBQVQsQ0FBWDtRQUNJLGNBQWMsS0FBSyxXQUFMLENBQWlCO0FBQUEsZUFBTSxRQUFRLElBQVIsQ0FBYSxRQUFiLENBQU47QUFBQSxLQUFqQixDQURsQjtRQUVJLHdCQUF3QixLQUFLLHFCQUFMLENBQTJCLFlBQUE7QUFDL0MsZ0JBQVEsSUFBUixDQUFhLFFBQWI7QUFDQSxtQkFBVyxNQUFYLENBQWtCLFdBQWxCO0FBQ0Esb0JBQVksT0FBWjtBQUNBLHlCQUFFLEtBQUYsQ0FBUSxZQUFBO0FBQ0osMEJBQWMsS0FBSyxXQUFMLENBQWlCO0FBQUEsdUJBQU0sUUFBUSxJQUFSLENBQWEsUUFBYixDQUFOO0FBQUEsYUFBakIsQ0FBZDtBQUNBLHVCQUFXLEdBQVgsQ0FBZSxXQUFmO0FBQ0gsU0FIRCxFQUdHLElBSEg7QUFJSCxLQVJ1QixDQUY1QjtBQVlBLGVBQVcsR0FBWCxDQUFlLFdBQWY7QUFDQSxlQUFXLEdBQVgsQ0FBZSxxQkFBZjtBQUVBLFdBQU87QUFDSCxvQkFBWSxRQUFRLFlBQVIsQ0FBcUIsS0FBckIsQ0FEVDtBQUVILGlCQUFTO0FBQUEsbUJBQU0sV0FBVyxPQUFYLEVBQU47QUFBQTtBQUZOLEtBQVA7QUFJSDs7SUFFRCxXO0FBQUEsMkJBQUE7QUFBQTs7QUFFWSxhQUFBLFFBQUEsR0FBVyxJQUFJLE9BQUosRUFBWDtBQStDRCxhQUFB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QUFjLE1BQWQsQ0FBcUIsT0FBckI7QUFDQSxnQ0FBWSxPQUFaO0FBQ0g7QUFDSixhQVBlLENBQXBCO0FBUUg7OztrQ0FFYTtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEI7QUFDSDs7Ozs7O0FBT0UsSUFBTSxvQ0FBYyxJQUFJLFdBQUosRUFBcEIiLCJmaWxlIjoibGliL2ZlYXR1cmVzL3Byb2plY3QtbG9jay5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCAqIGFzIGZzIGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU3ViamVjdCB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IEZpbGUgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IHsgYnVmZmVyRm9yIH0gZnJvbSBcIi4uL29wZXJhdG9ycy9idWZmZXJGb3JcIjtcbmZ1bmN0aW9uIHByb2plY3RMb2NrKHNvbHV0aW9uLCBwcm9qZWN0LCBmaWxlUGF0aCkge1xuICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIGNvbnN0IHN1YmplY3QgPSBuZXcgU3ViamVjdCgpO1xuICAgIGxldCBmaWxlID0gbmV3IEZpbGUoZmlsZVBhdGgpLCBvbkRpZENoYW5nZSA9IGZpbGUub25EaWRDaGFuZ2UoKCkgPT4gc3ViamVjdC5uZXh0KGZpbGVQYXRoKSksIG9uV2lsbFRocm93V2F0Y2hFcnJvciA9IGZpbGUub25XaWxsVGhyb3dXYXRjaEVycm9yKCgpID0+IHtcbiAgICAgICAgc3ViamVjdC5uZXh0KGZpbGVQYXRoKTtcbiAgICAgICAgZGlzcG9zYWJsZS5yZW1vdmUob25EaWRDaGFuZ2UpO1xuICAgICAgICBvbkRpZENoYW5nZS5kaXNwb3NlKCk7XG4gICAgICAgIF8uZGVsYXkoKCkgPT4ge1xuICAgICAgICAgICAgb25EaWRDaGFuZ2UgPSBmaWxlLm9uRGlkQ2hhbmdlKCgpID0+IHN1YmplY3QubmV4dChmaWxlUGF0aCkpO1xuICAgICAgICAgICAgZGlzcG9zYWJsZS5hZGQob25EaWRDaGFuZ2UpO1xuICAgICAgICB9LCA1MDAwKTtcbiAgICB9KTtcbiAgICBkaXNwb3NhYmxlLmFkZChvbkRpZENoYW5nZSk7XG4gICAgZGlzcG9zYWJsZS5hZGQob25XaWxsVGhyb3dXYXRjaEVycm9yKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBvYnNlcnZhYmxlOiBzdWJqZWN0LnRocm90dGxlVGltZSgzMDAwMCksXG4gICAgICAgIGRpc3Bvc2U6ICgpID0+IGRpc3Bvc2FibGUuZGlzcG9zZSgpXG4gICAgfTtcbn1cbmNsYXNzIEZpbGVNb25pdG9yIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5maWxlc01hcCA9IG5ldyBXZWFrTWFwKCk7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiUHJvamVjdCBNb25pdG9yXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIk1vbml0b3JzIHByb2plY3QubG9jay5qc29uIGZpbGVzIGZvciBjaGFuZ2VzIG91dHNpZGUgb2YgYXRvbSwgYW5kIGtlZXBzIHRoZSBydW5uaW5nIHNvbHV0aW9uIGluIHN5bmNcIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGNvbnN0IGNoYW5nZXMgPSBidWZmZXJGb3IoT2JzZXJ2YWJsZS5tZXJnZShPbW5pLmxpc3RlbmVyLm1vZGVsLnByb2plY3RBZGRlZCwgT21uaS5saXN0ZW5lci5tb2RlbC5wcm9qZWN0Q2hhbmdlZClcbiAgICAgICAgICAgIC5tYXAocHJvamVjdCA9PiAoeyBwcm9qZWN0LCBmaWxlUGF0aDogcGF0aC5qb2luKHByb2plY3QucGF0aCwgXCJwcm9qZWN0LmxvY2suanNvblwiKSB9KSlcbiAgICAgICAgICAgIC5maWx0ZXIoKHsgZmlsZVBhdGggfSkgPT4gZnMuZXhpc3RzU3luYyhmaWxlUGF0aCkpXG4gICAgICAgICAgICAuZmxhdE1hcCgoeyBwcm9qZWN0LCBmaWxlUGF0aCB9KSA9PiBPbW5pLmdldFNvbHV0aW9uRm9yUHJvamVjdChwcm9qZWN0KS5tYXAoc29sdXRpb24gPT4gKHsgc29sdXRpb24sIHByb2plY3QsIGZpbGVQYXRoIH0pKSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiAhIXguc29sdXRpb24pXG4gICAgICAgICAgICAuZmxhdE1hcCgoeyBzb2x1dGlvbiwgcHJvamVjdCwgZmlsZVBhdGggfSkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuZmlsZXNNYXAuaGFzKHByb2plY3QpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdiA9IHRoaXMuZmlsZXNNYXAuZ2V0KHByb2plY3QpO1xuICAgICAgICAgICAgICAgIHYuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbG9jayA9IHByb2plY3RMb2NrKHNvbHV0aW9uLCBwcm9qZWN0LCBmaWxlUGF0aCk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGxvY2spO1xuICAgICAgICAgICAgdGhpcy5maWxlc01hcC5zZXQocHJvamVjdCwgbG9jayk7XG4gICAgICAgICAgICByZXR1cm4gbG9jay5vYnNlcnZhYmxlLm1hcChwYXRoID0+ICh7IHNvbHV0aW9uLCBmaWxlUGF0aCB9KSk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuc2hhcmUoKSwgMzAwMDApO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGNoYW5nZXNcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoY2hhbmdzID0+IHtcbiAgICAgICAgICAgIF8uZWFjaChfLmdyb3VwQnkoY2hhbmdzLCB4ID0+IHguc29sdXRpb24udW5pcXVlSWQpLCBjaGFuZyA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc29sdXRpb24gPSBjaGFuZ1swXS5zb2x1dGlvbjtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXRocyA9IF8udW5pcShjaGFuZy5tYXAoeCA9PiB4LmZpbGVQYXRoKSk7XG4gICAgICAgICAgICAgICAgc29sdXRpb24uZmlsZXNDaGFuZ2VkKHBhdGhzLm1hcCh6ID0+ICh7IEZpbGVOYW1lOiB6IH0pKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIubW9kZWwucHJvamVjdFJlbW92ZWRcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdCA9PiB7XG4gICAgICAgICAgICBjb25zdCByZW1vdmVkSXRlbSA9IHRoaXMuZmlsZXNNYXAuZ2V0KHByb2plY3QpO1xuICAgICAgICAgICAgaWYgKHJlbW92ZWRJdGVtKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5maWxlc01hcC5kZWxldGUocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgcmVtb3ZlZEl0ZW0uZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGZpbGVNb25pdG9yID0gbmV3IEZpbGVNb25pdG9yO1xuIiwiaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHtPYnNlcnZhYmxlLCBTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7RmlsZX0gZnJvbSBcImF0b21cIjtcbmltcG9ydCB7UHJvamVjdFZpZXdNb2RlbH0gZnJvbSBcIi4uL3NlcnZlci9wcm9qZWN0LXZpZXctbW9kZWxcIjtcbmltcG9ydCB7U29sdXRpb259IGZyb20gXCIuLi9zZXJ2ZXIvc29sdXRpb25cIjtcbmltcG9ydCB7YnVmZmVyRm9yfSBmcm9tIFwiLi4vb3BlcmF0b3JzL2J1ZmZlckZvclwiO1xuXG5mdW5jdGlvbiBwcm9qZWN0TG9jayhzb2x1dGlvbjogU29sdXRpb24sIHByb2plY3Q6IFByb2plY3RWaWV3TW9kZWw8YW55PiwgZmlsZVBhdGg6IHN0cmluZykge1xuICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIGNvbnN0IHN1YmplY3QgPSBuZXcgU3ViamVjdDxzdHJpbmc+KCk7XG4gICAgbGV0IGZpbGUgPSBuZXcgRmlsZShmaWxlUGF0aCksXG4gICAgICAgIG9uRGlkQ2hhbmdlID0gZmlsZS5vbkRpZENoYW5nZSgoKSA9PiBzdWJqZWN0Lm5leHQoZmlsZVBhdGgpKSxcbiAgICAgICAgb25XaWxsVGhyb3dXYXRjaEVycm9yID0gZmlsZS5vbldpbGxUaHJvd1dhdGNoRXJyb3IoKCkgPT4ge1xuICAgICAgICAgICAgc3ViamVjdC5uZXh0KGZpbGVQYXRoKTtcbiAgICAgICAgICAgIGRpc3Bvc2FibGUucmVtb3ZlKG9uRGlkQ2hhbmdlKTtcbiAgICAgICAgICAgIG9uRGlkQ2hhbmdlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIF8uZGVsYXkoKCkgPT4ge1xuICAgICAgICAgICAgICAgIG9uRGlkQ2hhbmdlID0gZmlsZS5vbkRpZENoYW5nZSgoKSA9PiBzdWJqZWN0Lm5leHQoZmlsZVBhdGgpKTtcbiAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLmFkZChvbkRpZENoYW5nZSk7XG4gICAgICAgICAgICB9LCA1MDAwKTtcbiAgICAgICAgfSk7XG5cbiAgICBkaXNwb3NhYmxlLmFkZChvbkRpZENoYW5nZSk7XG4gICAgZGlzcG9zYWJsZS5hZGQob25XaWxsVGhyb3dXYXRjaEVycm9yKTtcblxuICAgIHJldHVybiB7XG4gICAgICAgIG9ic2VydmFibGU6IHN1YmplY3QudGhyb3R0bGVUaW1lKDMwMDAwKSxcbiAgICAgICAgZGlzcG9zZTogKCkgPT4gZGlzcG9zYWJsZS5kaXNwb3NlKClcbiAgICB9O1xufVxuXG5jbGFzcyBGaWxlTW9uaXRvciBpbXBsZW1lbnRzIElGZWF0dXJlIHtcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG4gICAgcHJpdmF0ZSBmaWxlc01hcCA9IG5ldyBXZWFrTWFwPFByb2plY3RWaWV3TW9kZWw8YW55PiwgSURpc3Bvc2FibGU+KCk7XG5cbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgICAgICAgY29uc3QgY2hhbmdlcyA9IGJ1ZmZlckZvcihPYnNlcnZhYmxlLm1lcmdlKE9tbmkubGlzdGVuZXIubW9kZWwucHJvamVjdEFkZGVkLCBPbW5pLmxpc3RlbmVyLm1vZGVsLnByb2plY3RDaGFuZ2VkKVxuICAgICAgICAgICAgLm1hcChwcm9qZWN0ID0+ICh7IHByb2plY3QsIGZpbGVQYXRoOiBwYXRoLmpvaW4ocHJvamVjdC5wYXRoLCBcInByb2plY3QubG9jay5qc29uXCIpIH0pKVxuICAgICAgICAgICAgLmZpbHRlcigoeyBmaWxlUGF0aH0pID0+IGZzLmV4aXN0c1N5bmMoZmlsZVBhdGgpKVxuICAgICAgICAgICAgLmZsYXRNYXAoKHsgcHJvamVjdCwgZmlsZVBhdGh9KSA9PlxuICAgICAgICAgICAgICAgIE9tbmkuZ2V0U29sdXRpb25Gb3JQcm9qZWN0KHByb2plY3QpLm1hcChzb2x1dGlvbiA9PiAoeyBzb2x1dGlvbiwgcHJvamVjdCwgZmlsZVBhdGggfSkpKVxuICAgICAgICAgICAgLmZpbHRlcih4ID0+ICEheC5zb2x1dGlvbilcbiAgICAgICAgICAgIC5mbGF0TWFwKCh7IHNvbHV0aW9uLCBwcm9qZWN0LCBmaWxlUGF0aCB9KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZmlsZXNNYXAuaGFzKHByb2plY3QpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHYgPSB0aGlzLmZpbGVzTWFwLmdldChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgdi5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc3QgbG9jayA9IHByb2plY3RMb2NrKHNvbHV0aW9uLCBwcm9qZWN0LCBmaWxlUGF0aCk7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChsb2NrKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGVzTWFwLnNldChwcm9qZWN0LCBsb2NrKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbG9jay5vYnNlcnZhYmxlLm1hcChwYXRoID0+ICh7IHNvbHV0aW9uLCBmaWxlUGF0aCB9KSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnNoYXJlKCksIDMwMDAwKTtcblxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGNoYW5nZXNcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoY2hhbmdzID0+IHtcbiAgICAgICAgICAgICAgICBfLmVhY2goXy5ncm91cEJ5KGNoYW5ncywgeCA9PiB4LnNvbHV0aW9uLnVuaXF1ZUlkKSwgY2hhbmcgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzb2x1dGlvbiA9IGNoYW5nWzBdLnNvbHV0aW9uO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXRocyA9IF8udW5pcShjaGFuZy5tYXAoeCA9PiB4LmZpbGVQYXRoKSk7XG4gICAgICAgICAgICAgICAgICAgIHNvbHV0aW9uLmZpbGVzQ2hhbmdlZChwYXRocy5tYXAoeiA9PiAoeyBGaWxlTmFtZTogeiB9KSkpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5tb2RlbC5wcm9qZWN0UmVtb3ZlZFxuICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0ID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZW1vdmVkSXRlbSA9IHRoaXMuZmlsZXNNYXAuZ2V0KHByb2plY3QpO1xuICAgICAgICAgICAgICAgIGlmIChyZW1vdmVkSXRlbSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZpbGVzTWFwLmRlbGV0ZShwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgcmVtb3ZlZEl0ZW0uZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVxdWlyZWQgPSBmYWxzZTtcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlByb2plY3QgTW9uaXRvclwiO1xuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiTW9uaXRvcnMgcHJvamVjdC5sb2NrLmpzb24gZmlsZXMgZm9yIGNoYW5nZXMgb3V0c2lkZSBvZiBhdG9tLCBhbmQga2VlcHMgdGhlIHJ1bm5pbmcgc29sdXRpb24gaW4gc3luY1wiO1xufVxuXG5leHBvcnQgY29uc3QgZmlsZU1vbml0b3IgPSBuZXcgRmlsZU1vbml0b3I7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

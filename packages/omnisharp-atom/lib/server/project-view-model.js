"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.EmptyProjectViewModel = exports.ProjectViewModel = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.projectViewModelFactory = projectViewModelFactory;
exports.workspaceViewModelFactory = workspaceViewModelFactory;

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var projectFactories = {
    MsBuildProject: MsBuildProjectViewModel,
    DotNetProject: DotNetProjectViewModel
};
var supportedProjectTypes = _lodash2.default.keys(projectFactories);
function projectViewModelFactory(omnisharpProject, solutionPath) {
    var projectTypes = _lodash2.default.filter(supportedProjectTypes, function (type) {
        return _lodash2.default.has(omnisharpProject, type);
    });
    var missing = _lodash2.default.difference(_lodash2.default.keys(omnisharpProject), supportedProjectTypes);
    if (missing.length) {
        console.log("Missing factory for project type " + missing);
    }
    var results = [];
    var skipDnx = false;
    if (projectTypes["DotNetProject"] && projectTypes["DnxProject"]) skipDnx = true;
    _lodash2.default.each(projectTypes, function (projectType) {
        if (skipDnx && _lodash2.default.startsWith(projectType, "Dnx")) return;
        if (projectType && projectFactories[projectType]) {
            results.push(new projectFactories[projectType](omnisharpProject[projectType], solutionPath));
        }
    });
    return results;
}
var workspaceFactories = {
    MsBuild: function MsBuild(workspace, solutionPath) {
        return _lodash2.default.map(workspace.Projects, function (projectInformation) {
            return new MsBuildProjectViewModel(projectInformation, solutionPath);
        });
    },
    DotNet: function DotNet(workspace, solutionPath) {
        return _lodash2.default.map(workspace.Projects, function (projectInformation) {
            return new DotNetProjectViewModel(projectInformation, solutionPath);
        });
    },
    ScriptCs: function ScriptCs(workspace, solutionPath) {
        if (workspace.CsxFiles.length > 0) return [new ScriptCsProjectViewModel(workspace, solutionPath)];
        return [];
    }
};
function workspaceViewModelFactory(omnisharpWorkspace, solutionPath) {
    var projects = [];
    var skipDnx = false;
    if (omnisharpWorkspace["DotNet"] && omnisharpWorkspace["Dnx"]) skipDnx = true;
    _lodash2.default.forIn(omnisharpWorkspace, function (item, key) {
        var factory = workspaceFactories[key];
        if (skipDnx && _lodash2.default.startsWith(key, "Dnx")) return;
        if (factory) {
            projects.push.apply(projects, _toConsumableArray(factory(item, solutionPath)));
        }
    });
    return projects;
}

var ProjectViewModel = exports.ProjectViewModel = function () {
    function ProjectViewModel(project, solutionPath) {
        _classCallCheck(this, ProjectViewModel);

        this._sourceFiles = [];
        this._subjectActiveFramework = new _rxjs.ReplaySubject(1);
        this._frameworks = [{ FriendlyName: "All", Name: "all", ShortName: "all" }];
        this._configurations = [];
        this.solutionPath = solutionPath;
        this.init(project);
        this.observe = { activeFramework: this._subjectActiveFramework };
        this._subjectActiveFramework.next(this._frameworks[0]);
    }

    _createClass(ProjectViewModel, [{
        key: "update",
        value: function update(other) {
            this.name = other.name;
            this.path = other.path;
            this.solutionPath = other.solutionPath;
            this.sourceFiles = other.sourceFiles;
            this.frameworks = other.frameworks;
            this.activeFramework = this._activeFramework;
            this.configurations = other.configurations;
        }
    }, {
        key: "toJSON",
        value: function toJSON() {
            var name = this.name;
            var path = this.path;
            var solutionPath = this.solutionPath;
            var sourceFiles = this.sourceFiles;
            var frameworks = this.frameworks;
            var configurations = this.configurations;

            return { name: name, path: path, solutionPath: solutionPath, sourceFiles: sourceFiles, frameworks: frameworks, configurations: configurations };
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this._subjectActiveFramework.unsubscribe();
        }
    }, {
        key: "name",
        get: function get() {
            return this._name;
        },
        set: function set(value) {
            this._name = value;
        }
    }, {
        key: "path",
        get: function get() {
            return this._path;
        },
        set: function set(value) {
            this._path = value;
        }
    }, {
        key: "solutionPath",
        get: function get() {
            return this._solutionPath;
        },
        set: function set(value) {
            this._solutionPath = value;
        }
    }, {
        key: "sourceFiles",
        get: function get() {
            return this._sourceFiles;
        },
        set: function set(value) {
            this._sourceFiles = value || [];
            if (this._filesSet) this._filesSet = null;
        }
    }, {
        key: "filesSet",
        get: function get() {
            var _this = this;

            if (!this._filesSet) {
                this._filesSet = new Set();
                _lodash2.default.each(this._sourceFiles, function (file) {
                    return _this._filesSet.add(file);
                });
            }
            return this._filesSet;
        }
    }, {
        key: "activeFramework",
        get: function get() {
            if (!this._activeFramework) {
                this._activeFramework = this.frameworks[0];
            }
            return this._activeFramework;
        },
        set: function set(value) {
            this._activeFramework = value;
            if (!this._subjectActiveFramework.isUnsubscribed) {
                this._subjectActiveFramework.next(this._activeFramework);
            }
        }
    }, {
        key: "frameworks",
        get: function get() {
            return this._frameworks;
        },
        set: function set(value) {
            this._frameworks = [{ FriendlyName: "All", Name: "all", ShortName: "all" }].concat(value);
            if (!this.activeFramework) {
                this.activeFramework = this._frameworks[0];
            }
        }
    }, {
        key: "configurations",
        get: function get() {
            return this._configurations;
        },
        set: function set(value) {
            this._configurations = value || [];
        }
    }]);

    return ProjectViewModel;
}();

var EmptyProjectViewModel = exports.EmptyProjectViewModel = function (_ProjectViewModel) {
    _inherits(EmptyProjectViewModel, _ProjectViewModel);

    function EmptyProjectViewModel() {
        _classCallCheck(this, EmptyProjectViewModel);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(EmptyProjectViewModel).apply(this, arguments));
    }

    _createClass(EmptyProjectViewModel, [{
        key: "init",
        value: function init(project) {}
    }]);

    return EmptyProjectViewModel;
}(ProjectViewModel);

var ProxyProjectViewModel = function (_ProjectViewModel2) {
    _inherits(ProxyProjectViewModel, _ProjectViewModel2);

    function ProxyProjectViewModel() {
        _classCallCheck(this, ProxyProjectViewModel);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(ProxyProjectViewModel).apply(this, arguments));
    }

    _createClass(ProxyProjectViewModel, [{
        key: "init",
        value: function init(project) {
            this.update(project);
        }
    }]);

    return ProxyProjectViewModel;
}(ProjectViewModel);

var MsBuildProjectViewModel = function (_ProjectViewModel3) {
    _inherits(MsBuildProjectViewModel, _ProjectViewModel3);

    function MsBuildProjectViewModel() {
        _classCallCheck(this, MsBuildProjectViewModel);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(MsBuildProjectViewModel).apply(this, arguments));
    }

    _createClass(MsBuildProjectViewModel, [{
        key: "init",
        value: function init(project) {
            var frameworks = [{
                FriendlyName: project.TargetFramework,
                Name: project.TargetFramework,
                ShortName: project.TargetFramework
            }];
            this.name = project.AssemblyName;
            this.path = project.Path;
            this.frameworks = frameworks;
            this.sourceFiles = project.SourceFiles;
        }
    }]);

    return MsBuildProjectViewModel;
}(ProjectViewModel);

var DotNetProjectViewModel = function (_ProjectViewModel4) {
    _inherits(DotNetProjectViewModel, _ProjectViewModel4);

    function DotNetProjectViewModel() {
        _classCallCheck(this, DotNetProjectViewModel);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(DotNetProjectViewModel).apply(this, arguments));
    }

    _createClass(DotNetProjectViewModel, [{
        key: "init",
        value: function init(project) {
            this.name = project.Name;
            this.path = project.Path;
            this.frameworks = project.Frameworks || [];
            this.configurations = (project.Configurations || []).map(function (x) {
                return x.Name;
            });
            this.sourceFiles = project.SourceFiles || [];
        }
    }]);

    return DotNetProjectViewModel;
}(ProjectViewModel);

var ScriptCsProjectViewModel = function (_ProjectViewModel5) {
    _inherits(ScriptCsProjectViewModel, _ProjectViewModel5);

    function ScriptCsProjectViewModel() {
        _classCallCheck(this, ScriptCsProjectViewModel);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(ScriptCsProjectViewModel).apply(this, arguments));
    }

    _createClass(ScriptCsProjectViewModel, [{
        key: "init",
        value: function init(project) {
            this.name = "ScriptCs";
            this.path = project.Path;
            this.sourceFiles = project.CsxFiles;
        }
    }]);

    return ScriptCsProjectViewModel;
}(ProjectViewModel);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvcHJvamVjdC12aWV3LW1vZGVsLnRzIiwibGliL3NlcnZlci9wcm9qZWN0LXZpZXctbW9kZWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O1FBV0EsdUIsR0FBQSx1QjtRQWlDQSx5QixHQUFBLHlCOztBQzVDQTs7OztBQUNBOzs7Ozs7Ozs7Ozs7QURJQSxJQUFNLG1CQUEyRjtBQUM3RixvQkFBcUIsdUJBRHdFO0FBRTdGLG1CQUFvQjtBQUZ5RSxDQUFqRztBQUtBLElBQU0sd0JBQXdCLGlCQUFFLElBQUYsQ0FBTyxnQkFBUCxDQUE5QjtBQUNBLFNBQUEsdUJBQUEsQ0FBd0MsZ0JBQXhDLEVBQTZGLFlBQTdGLEVBQWlIO0FBQzdHLFFBQU0sZUFBZSxpQkFBRSxNQUFGLENBQVMscUJBQVQsRUFBZ0M7QUFBQSxlQUFRLGlCQUFFLEdBQUYsQ0FBTSxnQkFBTixFQUF3QixJQUF4QixDQUFSO0FBQUEsS0FBaEMsQ0FBckI7QUFDQSxRQUFNLFVBQVUsaUJBQUUsVUFBRixDQUFhLGlCQUFFLElBQUYsQ0FBTyxnQkFBUCxDQUFiLEVBQXVDLHFCQUF2QyxDQUFoQjtBQUNBLFFBQUksUUFBUSxNQUFaLEVBQW9CO0FBQ2hCLGdCQUFRLEdBQVIsdUNBQWdELE9BQWhEO0FBQ0g7QUFFRCxRQUFNLFVBQW1DLEVBQXpDO0FBQ0EsUUFBSSxVQUFVLEtBQWQ7QUFDQSxRQUFJLGFBQWEsZUFBYixLQUFpQyxhQUFhLFlBQWIsQ0FBckMsRUFBaUUsVUFBVSxJQUFWO0FBQ2pFLHFCQUFFLElBQUYsQ0FBTyxZQUFQLEVBQXFCLHVCQUFXO0FBQzVCLFlBQUksV0FBVyxpQkFBRSxVQUFGLENBQWEsV0FBYixFQUEwQixLQUExQixDQUFmLEVBQWlEO0FBQ2pELFlBQUksZUFBZSxpQkFBaUIsV0FBakIsQ0FBbkIsRUFBa0Q7QUFDOUMsb0JBQVEsSUFBUixDQUFhLElBQUksaUJBQWlCLFdBQWpCLENBQUosQ0FBa0MsaUJBQWlCLFdBQWpCLENBQWxDLEVB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USxJQUFwQjtBQUNBLGlCQUFLLFVBQUwsR0FBa0IsVUFBbEI7QUFDQSxpQkFBSyxXQUFMLEdBQW1CLFFBQVEsV0FBM0I7QUFDSDs7OztFQVppQyxnQjs7SUFldEMsc0I7Ozs7Ozs7Ozs7OzZCQUNnQixPLEVBQXdDO0FBQ2hELGlCQUFLLElBQUwsR0FBWSxRQUFRLElBQXBCO0FBQ0EsaUJBQUssSUFBTCxHQUFZLFFBQVEsSUFBcEI7QUFDQSxpQkFBSyxVQUFMLEdBQWtCLFFBQVEsVUFBUixJQUFzQixFQUF4QztBQUNBLGlCQUFLLGNBQUwsR0FBc0IsQ0FBQyxRQUFRLGNBQVIsSUFBMEIsRUFBM0IsRUFBK0IsR0FBL0IsQ0FBbUM7QUFBQSx1QkFBSyxFQUFFLElBQVA7QUFBQSxhQUFuQyxDQUF0QjtBQUNBLGlCQUFLLFdBQUwsR0FBbUIsUUFBUSxXQUFSLElBQXVCLEVBQTFDO0FBQ0g7Ozs7RUFQZ0MsZ0I7O0lBVXJDLHdCOzs7Ozs7Ozs7Ozs2QkFDZ0IsTyxFQUFpQztBQUN6QyxpQkFBSyxJQUFMLEdBQVksVUFBWjtBQUNBLGlCQUFLLElBQUwsR0FBWSxRQUFRLElBQXBCO0FBQ0EsaUJBQUssV0FBTCxHQUFtQixRQUFRLFFBQTNCO0FBQ0g7Ozs7RUFMa0MsZ0IiLCJmaWxlIjoibGliL3NlcnZlci9wcm9qZWN0LXZpZXctbW9kZWwuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0lQcm9qZWN0Vmlld01vZGVsfSBmcm9tIFwiLi4vb21uaXNoYXJwXCI7XG5pbXBvcnQge01vZGVscywgU2NyaXB0Q3N9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQge09ic2VydmFibGUsIFJlcGxheVN1YmplY3R9IGZyb20gXCJyeGpzXCI7XG5cbmNvbnN0IHByb2plY3RGYWN0b3JpZXM6IHsgW2tleTogc3RyaW5nXTogeyBuZXcgKHByb2plY3Q6IGFueSwgc29sdXRpb25QYXRoOiBzdHJpbmcpOiBhbnk7IH07IH0gPSB7XG4gICAgTXNCdWlsZFByb2plY3Q6IDxhbnk+TXNCdWlsZFByb2plY3RWaWV3TW9kZWwsXG4gICAgRG90TmV0UHJvamVjdDogPGFueT5Eb3ROZXRQcm9qZWN0Vmlld01vZGVsXG59O1xuXG5jb25zdCBzdXBwb3J0ZWRQcm9qZWN0VHlwZXMgPSBfLmtleXMocHJvamVjdEZhY3Rvcmllcyk7XG5leHBvcnQgZnVuY3Rpb24gcHJvamVjdFZpZXdNb2RlbEZhY3Rvcnkob21uaXNoYXJwUHJvamVjdDogTW9kZWxzLlByb2plY3RJbmZvcm1hdGlvblJlc3BvbnNlLCBzb2x1dGlvblBhdGg6IHN0cmluZykge1xuICAgIGNvbnN0IHByb2plY3RUeXBlcyA9IF8uZmlsdGVyKHN1cHBvcnRlZFByb2plY3RUeXBlcywgdHlwZSA9PiBfLmhhcyhvbW5pc2hhcnBQcm9qZWN0LCB0eXBlKSk7XG4gICAgY29uc3QgbWlzc2luZyA9IF8uZGlmZmVyZW5jZShfLmtleXMob21uaXNoYXJwUHJvamVjdCksIHN1cHBvcnRlZFByb2plY3RUeXBlcyk7XG4gICAgaWYgKG1pc3NpbmcubGVuZ3RoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBNaXNzaW5nIGZhY3RvcnkgZm9yIHByb2plY3QgdHlwZSAke21pc3Npbmd9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVzdWx0czogUHJvamVjdFZpZXdNb2RlbDxhbnk+W10gPSBbXTtcbiAgICBsZXQgc2tpcERueCA9IGZhbHNlO1xuICAgIGlmIChwcm9qZWN0VHlwZXNbXCJEb3ROZXRQcm9qZWN0XCJdICYmIHByb2plY3RUeXBlc1tcIkRueFByb2plY3RcIl0pIHNraXBEbnggPSB0cnVlO1xuICAgIF8uZWFjaChwcm9qZWN0VHlwZXMsIHByb2plY3RUeXBlID0+IHtcbiAgICAgICAgaWYgKHNraXBEbnggJiYgXy5zdGFydHNXaXRoKHByb2plY3RUeXBlLCBcIkRueFwiKSkgcmV0dXJuO1xuICAgICAgICBpZiAocHJvamVjdFR5cGUgJiYgcHJvamVjdEZhY3Rvcmllc1twcm9qZWN0VHlwZV0pIHtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaChuZXcgcHJvamVjdEZhY3Rvcmllc1twcm9qZWN0VHlwZV0ob21uaXNoYXJwUHJvamVjdFtwcm9qZWN0VHlwZV0sIHNvbHV0aW9uUGF0aCkpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3VsdHM7XG59XG5cbmNvbnN0IHdvcmtzcGFjZUZhY3RvcmllczogeyBba2V5OiBzdHJpbmddOiAod29ya3NwYWNlOiBhbnksIHNvbHV0aW9uUGF0aDogc3RyaW5nKSA9PiBQcm9qZWN0Vmlld01vZGVsPGFueT5bXSB9ID0ge1xuICAgIE1zQnVpbGQ6ICh3b3Jrc3BhY2U6IE1vZGVscy5Nc0J1aWxkV29ya3NwYWNlSW5mb3JtYXRpb24sIHNvbHV0aW9uUGF0aDogc3RyaW5nKSA9PiB7XG4gICAgICAgIHJldHVybiBfLm1hcCh3b3Jrc3BhY2UuUHJvamVjdHMsIHByb2plY3RJbmZvcm1hdGlvbiA9PiBuZXcgTXNCdWlsZFByb2plY3RWaWV3TW9kZWwocHJvamVjdEluZm9ybWF0aW9uLCBzb2x1dGlvblBhdGgpKTtcbiAgICB9LFxuICAgIERvdE5ldDogKHdvcmtzcGFjZTogTW9kZWxzLkRvdE5ldFdvcmtzcGFjZUluZm9ybWF0aW9uLCBzb2x1dGlvblBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgICByZXR1cm4gXy5tYXAod29ya3NwYWNlLlByb2plY3RzLCBwcm9qZWN0SW5mb3JtYXRpb24gPT4gbmV3IERvdE5ldFByb2plY3RWaWV3TW9kZWwocHJvamVjdEluZm9ybWF0aW9uLCBzb2x1dGlvblBhdGgpKTtcbiAgICB9LFxuICAgIFNjcmlwdENzOiAod29ya3NwYWNlOiBTY3JpcHRDcy5TY3JpcHRDc0NvbnRleHQsIHNvbHV0aW9uUGF0aDogc3RyaW5nKSA9PiB7XG4gICAgICAgIGlmICh3b3Jrc3BhY2UuQ3N4RmlsZXMubGVuZ3RoID4gMClcbiAgICAgICAgICAgIHJldHVybiBbbmV3IFNjcmlwdENzUHJvamVjdFZpZXdNb2RlbCh3b3Jrc3BhY2UsIHNvbHV0aW9uUGF0aCldO1xuICAgICAgICByZXR1cm4gW107XG4gICAgfSxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiB3b3Jrc3BhY2VWaWV3TW9kZWxGYWN0b3J5KG9tbmlzaGFycFdvcmtzcGFjZTogTW9kZWxzLldvcmtzcGFjZUluZm9ybWF0aW9uUmVzcG9uc2UsIHNvbHV0aW9uUGF0aDogc3RyaW5nKSB7XG4gICAgY29uc3QgcHJvamVjdHM6IGFueVtdID0gW107XG4gICAgbGV0IHNraXBEbnggPSBmYWxzZTtcbiAgICBpZiAob21uaXNoYXJwV29ya3NwYWNlW1wiRG90TmV0XCJdICYmIG9tbmlzaGFycFdvcmtzcGFjZVtcIkRueFwiXSkgc2tpcERueCA9IHRydWU7XG4gICAgXy5mb3JJbihvbW5pc2hhcnBXb3Jrc3BhY2UsIChpdGVtLCBrZXkpID0+IHtcbiAgICAgICAgY29uc3QgZmFjdG9yeSA9IHdvcmtzcGFjZUZhY3Rvcmllc1trZXldO1xuICAgICAgICBpZiAoc2tpcERueCAmJiBfLnN0YXJ0c1dpdGgoa2V5LCBcIkRueFwiKSkgcmV0dXJuO1xuICAgICAgICBpZiAoZmFjdG9yeSkge1xuICAgICAgICAgICAgcHJvamVjdHMucHVzaCguLi5mYWN0b3J5KGl0ZW0sIHNvbHV0aW9uUGF0aCkpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcHJvamVjdHM7XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBQcm9qZWN0Vmlld01vZGVsPFQ+IGltcGxlbWVudHMgSVByb2plY3RWaWV3TW9kZWwge1xuICAgIGNvbnN0cnVjdG9yKHByb2plY3Q6IFQsIHNvbHV0aW9uUGF0aDogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuc29sdXRpb25QYXRoID0gc29sdXRpb25QYXRoO1xuICAgICAgICB0aGlzLmluaXQocHJvamVjdCk7XG4gICAgICAgIHRoaXMub2JzZXJ2ZSA9IHsgYWN0aXZlRnJhbWV3b3JrOiA8T2JzZXJ2YWJsZTxNb2RlbHMuRG90TmV0RnJhbWV3b3JrPj48YW55PnRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsgfTtcbiAgICAgICAgdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay5uZXh0KHRoaXMuX2ZyYW1ld29ya3NbMF0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX25hbWU6IHN0cmluZztcbiAgICBwdWJsaWMgZ2V0IG5hbWUoKSB7IHJldHVybiB0aGlzLl9uYW1lOyB9XG4gICAgcHVibGljIHNldCBuYW1lKHZhbHVlKSB7IHRoaXMuX25hbWUgPSB2YWx1ZTsgfVxuXG4gICAgcHJpdmF0ZSBfcGF0aDogc3RyaW5nO1xuICAgIHB1YmxpYyBnZXQgcGF0aCgpIHsgcmV0dXJuIHRoaXMuX3BhdGg7IH1cbiAgICBwdWJsaWMgc2V0IHBhdGgodmFsdWUpIHsgdGhpcy5fcGF0aCA9IHZhbHVlOyB9XG5cbiAgICBwcml2YXRlIF9zb2x1dGlvblBhdGg6IHN0cmluZztcbiAgICBwdWJsaWMgZ2V0IHNvbHV0aW9uUGF0aCgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uUGF0aDsgfVxuICAgIHB1YmxpYyBzZXQgc29sdXRpb25QYXRoKHZhbHVlKSB7IHRoaXMuX3NvbHV0aW9uUGF0aCA9IHZhbHVlOyB9XG5cbiAgICBwcml2YXRlIF9zb3VyY2VGaWxlczogc3RyaW5nW10gPSBbXTtcbiAgICBwdWJsaWMgZ2V0IHNvdXJjZUZpbGVzKCkgeyByZXR1cm4gdGhpcy5fc291cmNlRmlsZXM7IH1cbiAgICBwdWJsaWMgc2V0IHNvdXJjZUZpbGVzKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3NvdXJjZUZpbGVzID0gdmFsdWUgfHwgW107XG4gICAgICAgIGlmICh0aGlzLl9maWxlc1NldCkgdGhpcy5fZmlsZXNTZXQgPSBudWxsO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2ZpbGVzU2V0OiBTZXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgZ2V0IGZpbGVzU2V0KCkge1xuICAgICAgICBpZiAoIXRoaXMuX2ZpbGVzU2V0KSB7XG4gICAgICAgICAgICB0aGlzLl9maWxlc1NldCA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgICAgICAgXy5lYWNoKHRoaXMuX3NvdXJjZUZpbGVzLCBmaWxlID0+IHRoaXMuX2ZpbGVzU2V0LmFkZChmaWxlKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2ZpbGVzU2V0O1xuICAgIH1cblxuICAgIHByaXZhdGUgX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsgPSBuZXcgUmVwbGF5U3ViamVjdDxNb2RlbHMuRG90TmV0RnJhbWV3b3JrPigxKTtcbiAgICBwcml2YXRlIF9hY3RpdmVGcmFtZXdvcms6IE1vZGVscy5Eb3ROZXRGcmFtZXdvcms7XG4gICAgcHVibGljIGdldCBhY3RpdmVGcmFtZXdvcmsoKSB7XG4gICAgICAgIGlmICghdGhpcy5fYWN0aXZlRnJhbWV3b3JrKSB7XG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVGcmFtZXdvcmsgPSB0aGlzLmZyYW1ld29ya3NbMF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2FjdGl2ZUZyYW1ld29yaztcbiAgICB9XG4gICAgcHVibGljIHNldCBhY3RpdmVGcmFtZXdvcmsodmFsdWUpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZlRnJhbWV3b3JrID0gdmFsdWU7XG4gICAgICAgIGlmICghdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay5pc1Vuc3Vic2NyaWJlZCkge1xuICAgICAgICAgICAgdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay5uZXh0KHRoaXMuX2FjdGl2ZUZyYW1ld29yayk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9mcmFtZXdvcmtzOiBNb2RlbHMuRG90TmV0RnJhbWV3b3JrW10gPSBbeyBGcmllbmRseU5hbWU6IFwiQWxsXCIsIE5hbWU6IFwiYWxsXCIsIFNob3J0TmFtZTogXCJhbGxcIiB9XTtcbiAgICBwdWJsaWMgZ2V0IGZyYW1ld29ya3MoKSB7IHJldHVybiB0aGlzLl9mcmFtZXdvcmtzOyB9XG4gICAgcHVibGljIHNldCBmcmFtZXdvcmtzKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX2ZyYW1ld29ya3MgPSBbeyBGcmllbmRseU5hbWU6IFwiQWxsXCIsIE5hbWU6IFwiYWxsXCIsIFNob3J0TmFtZTogXCJhbGxcIiB9XS5jb25jYXQodmFsdWUpO1xuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlRnJhbWV3b3JrKSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUZyYW1ld29yayA9IHRoaXMuX2ZyYW1ld29ya3NbMF07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9jb25maWd1cmF0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgICBwdWJsaWMgZ2V0IGNvbmZpZ3VyYXRpb25zKCkgeyByZXR1cm4gdGhpcy5fY29uZmlndXJhdGlvbnM7IH1cbiAgICBwdWJsaWMgc2V0IGNvbmZpZ3VyYXRpb25zKHZhbHVlKSB7IHRoaXMuX2NvbmZpZ3VyYXRpb25zID0gdmFsdWUgfHwgW107IH1cblxuICAgIHB1YmxpYyBvYnNlcnZlOiB7XG4gICAgICAgIGFjdGl2ZUZyYW1ld29yazogT2JzZXJ2YWJsZTxNb2RlbHMuRG90TmV0RnJhbWV3b3JrPjtcbiAgICB9O1xuXG4gICAgcHVibGljIGFic3RyYWN0IGluaXQodmFsdWU6IFQpOiB2b2lkO1xuICAgIHB1YmxpYyB1cGRhdGUob3RoZXI6IFByb2plY3RWaWV3TW9kZWw8VD4pIHtcbiAgICAgICAgdGhpcy5uYW1lID0gb3RoZXIubmFtZTtcbiAgICAgICAgdGhpcy5wYXRoID0gb3RoZXIucGF0aDtcbiAgICAgICAgdGhpcy5zb2x1dGlvblBhdGggPSBvdGhlci5zb2x1dGlvblBhdGg7XG4gICAgICAgIHRoaXMuc291cmNlRmlsZXMgPSBvdGhlci5zb3VyY2VGaWxlcztcbiAgICAgICAgdGhpcy5mcmFtZXdvcmtzID0gb3RoZXIuZnJhbWV3b3JrcztcbiAgICAgICAgdGhpcy5hY3RpdmVGcmFtZXdvcmsgPSB0aGlzLl9hY3RpdmVGcmFtZXdvcms7XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbnMgPSBvdGhlci5jb25maWd1cmF0aW9ucztcbiAgICB9XG5cbiAgICBwdWJsaWMgdG9KU09OKCkge1xuICAgICAgICBjb25zdCB7bmFtZSwgcGF0aCwgc29sdXRpb25QYXRoLCBzb3VyY2VGaWxlcywgZnJhbWV3b3JrcywgY29uZmlndXJhdGlvbnN9ID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHsgbmFtZSwgcGF0aCwgc29sdXRpb25QYXRoLCBzb3VyY2VGaWxlcywgZnJhbWV3b3JrcywgY29uZmlndXJhdGlvbnMgfTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay51bnN1YnNjcmliZSgpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVtcHR5UHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWw8UHJvamVjdFZpZXdNb2RlbDxhbnk+PiB7XG4gICAgcHVibGljIGluaXQocHJvamVjdDogUHJvamVjdFZpZXdNb2RlbDxhbnk+KSB7IC8qICovIH1cbn1cblxuY2xhc3MgUHJveHlQcm9qZWN0Vmlld01vZGVsIGV4dGVuZHMgUHJvamVjdFZpZXdNb2RlbDxQcm9qZWN0Vmlld01vZGVsPGFueT4+IHtcbiAgICBwdWJsaWMgaW5pdChwcm9qZWN0OiBQcm9qZWN0Vmlld01vZGVsPGFueT4pIHtcbiAgICAgICAgdGhpcy51cGRhdGUocHJvamVjdCk7XG4gICAgfVxufVxuXG5jbGFzcyBNc0J1aWxkUHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWw8TW9kZWxzLk1TQnVpbGRQcm9qZWN0PiB7XG4gICAgcHVibGljIGluaXQocHJvamVjdDogTW9kZWxzLk1TQnVpbGRQcm9qZWN0KSB7XG4gICAgICAgIGNvbnN0IGZyYW1ld29ya3MgPSBbe1xuICAgICAgICAgICAgRnJpZW5kbHlOYW1lOiBwcm9qZWN0LlRhcmdldEZyYW1ld29yayxcbiAgICAgICAgICAgIE5hbWU6IHByb2plY3QuVGFyZ2V0RnJhbWV3b3JrLFxuICAgICAgICAgICAgU2hvcnROYW1lOiBwcm9qZWN0LlRhcmdldEZyYW1ld29ya1xuICAgICAgICB9XTtcblxuICAgICAgICB0aGlzLm5hbWUgPSBwcm9qZWN0LkFzc2VtYmx5TmFtZTtcbiAgICAgICAgdGhpcy5wYXRoID0gcHJvamVjdC5QYXRoO1xuICAgICAgICB0aGlzLmZyYW1ld29ya3MgPSBmcmFtZXdvcmtzO1xuICAgICAgICB0aGlzLnNvdXJjZUZpbGVzID0gcHJvamVjdC5Tb3VyY2VGaWxlcztcbiAgICB9XG59XG5cbmNsYXNzIERvdE5ldFByb2plY3RWaWV3TW9kZWwgZXh0ZW5kcyBQcm9qZWN0Vmlld01vZGVsPE1vZGVscy5Eb3ROZXRQcm9qZWN0SW5mb3JtYXRpb24+IHtcbiAgICBwdWJsaWMgaW5pdChwcm9qZWN0OiBNb2RlbHMuRG90TmV0UHJvamVjdEluZm9ybWF0aW9uKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IHByb2plY3QuTmFtZTtcbiAgICAgICAgdGhpcy5wYXRoID0gcHJvamVjdC5QYXRoO1xuICAgICAgICB0aGlzLmZyYW1ld29ya3MgPSBwcm9qZWN0LkZyYW1ld29ya3MgfHwgW107XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbnMgPSAocHJvamVjdC5Db25maWd1cmF0aW9ucyB8fCBbXSkubWFwKHggPT4geC5OYW1lKTtcbiAgICAgICAgdGhpcy5zb3VyY2VGaWxlcyA9IHByb2plY3QuU291cmNlRmlsZXMgfHwgW107XG4gICAgfVxufVxuXG5jbGFzcyBTY3JpcHRDc1Byb2plY3RWaWV3TW9kZWwgZXh0ZW5kcyBQcm9qZWN0Vmlld01vZGVsPFNjcmlwdENzLlNjcmlwdENzQ29udGV4dD4ge1xuICAgIHB1YmxpYyBpbml0KHByb2plY3Q6IFNjcmlwdENzLlNjcmlwdENzQ29udGV4dCkge1xuICAgICAgICB0aGlzLm5hbWUgPSBcIlNjcmlwdENzXCI7XG4gICAgICAgIHRoaXMucGF0aCA9IHByb2plY3QuUGF0aDtcbiAgICAgICAgdGhpcy5zb3VyY2VGaWxlcyA9IHByb2plY3QuQ3N4RmlsZXM7XG4gICAgfVxufVxuIiwiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgUmVwbGF5U3ViamVjdCB9IGZyb20gXCJyeGpzXCI7XG5jb25zdCBwcm9qZWN0RmFjdG9yaWVzID0ge1xuICAgIE1zQnVpbGRQcm9qZWN0OiBNc0J1aWxkUHJvamVjdFZpZXdNb2RlbCxcbiAgICBEb3ROZXRQcm9qZWN0OiBEb3ROZXRQcm9qZWN0Vmlld01vZGVsXG59O1xuY29uc3Qgc3VwcG9ydGVkUHJvamVjdFR5cGVzID0gXy5rZXlzKHByb2plY3RGYWN0b3JpZXMpO1xuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3RWaWV3TW9kZWxGYWN0b3J5KG9tbmlzaGFycFByb2plY3QsIHNvbHV0aW9uUGF0aCkge1xuICAgIGNvbnN0IHByb2plY3RUeXBlcyA9IF8uZmlsdGVyKHN1cHBvcnRlZFByb2plY3RUeXBlcywgdHlwZSA9PiBfLmhhcyhvbW5pc2hhcnBQcm9qZWN0LCB0eXBlKSk7XG4gICAgY29uc3QgbWlzc2luZyA9IF8uZGlmZmVyZW5jZShfLmtleXMob21uaXNoYXJwUHJvamVjdCksIHN1cHBvcnRlZFByb2plY3RUeXBlcyk7XG4gICAgaWYgKG1pc3NpbmcubGVuZ3RoKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBNaXNzaW5nIGZhY3RvcnkgZm9yIHByb2plY3QgdHlwZSAke21pc3Npbmd9YCk7XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdHMgPSBbXTtcbiAgICBsZXQgc2tpcERueCA9IGZhbHNlO1xuICAgIGlmIChwcm9qZWN0VHlwZXNbXCJEb3ROZXRQcm9qZWN0XCJdICYmIHByb2plY3RUeXBlc1tcIkRueFByb2plY3RcIl0pXG4gICAgICAgIHNraXBEbnggPSB0cnVlO1xuICAgIF8uZWFjaChwcm9qZWN0VHlwZXMsIHByb2plY3RUeXBlID0+IHtcbiAgICAgICAgaWYgKHNraXBEbnggJiYgXy5zdGFydHNXaXRoKHByb2plY3RUeXBlLCBcIkRueFwiKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKHByb2plY3RUeXBlICYmIHByb2plY3RGYWN0b3JpZXNbcHJvamVjdFR5cGVdKSB7XG4gICAgICAgICAgICByZXN1bHRzLnB1c2gobmV3IHByb2plY3RGYWN0b3JpZXNbcHJvamVjdFR5cGVdKG9tbmlzaGFycFByb2plY3RbcHJvamVjdFR5cGVdLCBzb2x1dGlvblBhdGgpKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXN1bHRzO1xufVxuY29uc3Qgd29ya3NwYWNlRmFjdG9yaWVzID0ge1xuICAgIE1zQnVpbGQ6ICh3b3Jrc3BhY2UsIHNvbHV0aW9uUGF0aCkgPT4ge1xuICAgICAgICByZXR1cm4gXy5tYXAod29ya3NwYWNlLlByb2plY3RzLCBwcm9qZWN0SW5mb3JtYXRpb24gPT4gbmV3IE1zQnVpbGRQcm9qZWN0Vmlld01vZGVsKHByb2plY3RJbmZvcm1hdGlvbiwgc29sdXRpb25QYXRoKSk7XG4gICAgfSxcbiAgICBEb3ROZXQ6ICh3b3Jrc3BhY2UsIHNvbHV0aW9uUGF0aCkgPT4ge1xuICAgICAgICByZXR1cm4gXy5tYXAod29ya3NwYWNlLlByb2plY3RzLCBwcm9qZWN0SW5mb3JtYXRpb24gPT4gbmV3IERvdE5ldFByb2plY3RWaWV3TW9kZWwocHJvamVjdEluZm9ybWF0aW9uLCBzb2x1dGlvblBhdGgpKTtcbiAgICB9LFxuICAgIFNjcmlwdENzOiAod29ya3NwYWNlLCBzb2x1dGlvblBhdGgpID0+IHtcbiAgICAgICAgaWYgKHdvcmtzcGFjZS5Dc3hGaWxlcy5sZW5ndGggPiAwKVxuICAgICAgICAgICAgcmV0dXJuIFtuZXcgU2NyaXB0Q3NQcm9qZWN0Vmlld01vZGVsKHdvcmtzcGFjZSwgc29sdXRpb25QYXRoKV07XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9LFxufTtcbmV4cG9ydCBmdW5jdGlvbiB3b3Jrc3BhY2VWaWV3TW9kZWxGYWN0b3J5KG9tbmlzaGFycFdvcmtzcGFjZSwgc29sdXRpb25QYXRoKSB7XG4gICAgY29uc3QgcHJvamVjdHMgPSBbXTtcbiAgICBsZXQgc2tpcERueCA9IGZhbHNlO1xuICAgIGlmIChvbW5pc2hhcnBXb3Jrc3BhY2VbXCJEb3ROZXRcIl0gJiYgb21uaXNoYXJwV29ya3NwYWNlW1wiRG54XCJdKVxuICAgICAgICBza2lwRG54ID0gdHJ1ZTtcbiAgICBfLmZvckluKG9tbmlzaGFycFdvcmtzcGFjZSwgKGl0ZW0sIGtleSkgPT4ge1xuICAgICAgICBjb25zdCBmYWN0b3J5ID0gd29ya3NwYWNlRmFjdG9yaWVzW2tleV07XG4gICAgICAgIGlmIChza2lwRG54ICYmIF8uc3RhcnRzV2l0aChrZXksIFwiRG54XCIpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAoZmFjdG9yeSkge1xuICAgICAgICAgICAgcHJvamVjdHMucHVzaCguLi5mYWN0b3J5KGl0ZW0sIHNvbHV0aW9uUGF0aCkpO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHByb2plY3RzO1xufVxuZXhwb3J0IGNsYXNzIFByb2plY3RWaWV3TW9kZWwge1xuICAgIGNvbnN0cnVjdG9yKHByb2plY3QsIHNvbHV0aW9uUGF0aCkge1xuICAgICAgICB0aGlzLl9zb3VyY2VGaWxlcyA9IFtdO1xuICAgICAgICB0aGlzLl9zdWJqZWN0QWN0aXZlRnJhbWV3b3JrID0gbmV3IFJlcGxheVN1YmplY3QoMSk7XG4gICAgICAgIHRoaXMuX2ZyYW1ld29ya3MgPSBbeyBGcmllbmRseU5hbWU6IFwiQWxsXCIsIE5hbWU6IFwiYWxsXCIsIFNob3J0TmFtZTogXCJhbGxcIiB9XTtcbiAgICAgICAgdGhpcy5fY29uZmlndXJhdGlvbnMgPSBbXTtcbiAgICAgICAgdGhpcy5zb2x1dGlvblBhdGggPSBzb2x1dGlvblBhdGg7XG4gICAgICAgIHRoaXMuaW5pdChwcm9qZWN0KTtcbiAgICAgICAgdGhpcy5vYnNlcnZlID0geyBhY3RpdmVGcmFtZXdvcms6IHRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsgfTtcbiAgICAgICAgdGhpcy5fc3ViamVjdEFjdGl2ZUZyYW1ld29yay5uZXh0KHRoaXMuX2ZyYW1ld29ya3NbMF0pO1xuICAgIH1cbiAgICBnZXQgbmFtZSgpIHsgcmV0dXJuIHRoaXMuX25hbWU7IH1cbiAgICBzZXQgbmFtZSh2YWx1ZSkgeyB0aGlzLl9uYW1lID0gdmFsdWU7IH1cbiAgICBnZXQgcGF0aCgpIHsgcmV0dXJuIHRoaXMuX3BhdGg7IH1cbiAgICBzZXQgcGF0aCh2YWx1ZSkgeyB0aGlzLl9wYXRoID0gdmFsdWU7IH1cbiAgICBnZXQgc29sdXRpb25QYXRoKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb25QYXRoOyB9XG4gICAgc2V0IHNvbHV0aW9uUGF0aCh2YWx1ZSkgeyB0aGlzLl9zb2x1dGlvblBhdGggPSB2YWx1ZTsgfVxuICAgIGdldCBzb3VyY2VGaWxlcygpIHsgcmV0dXJuIHRoaXMuX3NvdXJjZUZpbGVzOyB9XG4gICAgc2V0IHNvdXJjZUZpbGVzKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3NvdXJjZUZpbGVzID0gdmFsdWUgfHwgW107XG4gICAgICAgIGlmICh0aGlzLl9maWxlc1NldClcbiAgICAgICAgICAgIHRoaXMuX2ZpbGVzU2V0ID0gbnVsbDtcbiAgICB9XG4gICAgZ2V0IGZpbGVzU2V0KCkge1xuICAgICAgICBpZiAoIXRoaXMuX2ZpbGVzU2V0KSB7XG4gICAgICAgICAgICB0aGlzLl9maWxlc1NldCA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLl9zb3VyY2VGaWxlcywgZmlsZSA9PiB0aGlzLl9maWxlc1NldC5hZGQoZmlsZSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9maWxlc1NldDtcbiAgICB9XG4gICAgZ2V0IGFjdGl2ZUZyYW1ld29yaygpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9hY3RpdmVGcmFtZXdvcmspIHtcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZUZyYW1ld29yayA9IHRoaXMuZnJhbWV3b3Jrc1swXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlRnJhbWV3b3JrO1xuICAgIH1cbiAgICBzZXQgYWN0aXZlRnJhbWV3b3JrKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX2FjdGl2ZUZyYW1ld29yayA9IHZhbHVlO1xuICAgICAgICBpZiAoIXRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsuaXNVbnN1YnNjcmliZWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsubmV4dCh0aGlzLl9hY3RpdmVGcmFtZXdvcmspO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldCBmcmFtZXdvcmtzKCkgeyByZXR1cm4gdGhpcy5fZnJhbWV3b3JrczsgfVxuICAgIHNldCBmcmFtZXdvcmtzKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX2ZyYW1ld29ya3MgPSBbeyBGcmllbmRseU5hbWU6IFwiQWxsXCIsIE5hbWU6IFwiYWxsXCIsIFNob3J0TmFtZTogXCJhbGxcIiB9XS5jb25jYXQodmFsdWUpO1xuICAgICAgICBpZiAoIXRoaXMuYWN0aXZlRnJhbWV3b3JrKSB7XG4gICAgICAgICAgICB0aGlzLmFjdGl2ZUZyYW1ld29yayA9IHRoaXMuX2ZyYW1ld29ya3NbMF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0IGNvbmZpZ3VyYXRpb25zKCkgeyByZXR1cm4gdGhpcy5fY29uZmlndXJhdGlvbnM7IH1cbiAgICBzZXQgY29uZmlndXJhdGlvbnModmFsdWUpIHsgdGhpcy5fY29uZmlndXJhdGlvbnMgPSB2YWx1ZSB8fCBbXTsgfVxuICAgIHVwZGF0ZShvdGhlcikge1xuICAgICAgICB0aGlzLm5hbWUgPSBvdGhlci5uYW1lO1xuICAgICAgICB0aGlzLnBhdGggPSBvdGhlci5wYXRoO1xuICAgICAgICB0aGlzLnNvbHV0aW9uUGF0aCA9IG90aGVyLnNvbHV0aW9uUGF0aDtcbiAgICAgICAgdGhpcy5zb3VyY2VGaWxlcyA9IG90aGVyLnNvdXJjZUZpbGVzO1xuICAgICAgICB0aGlzLmZyYW1ld29ya3MgPSBvdGhlci5mcmFtZXdvcmtzO1xuICAgICAgICB0aGlzLmFjdGl2ZUZyYW1ld29yayA9IHRoaXMuX2FjdGl2ZUZyYW1ld29yaztcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9ucyA9IG90aGVyLmNvbmZpZ3VyYXRpb25zO1xuICAgIH1cbiAgICB0b0pTT04oKSB7XG4gICAgICAgIGNvbnN0IHsgbmFtZSwgcGF0aCwgc29sdXRpb25QYXRoLCBzb3VyY2VGaWxlcywgZnJhbWV3b3JrcywgY29uZmlndXJhdGlvbnMgfSA9IHRoaXM7XG4gICAgICAgIHJldHVybiB7IG5hbWUsIHBhdGgsIHNvbHV0aW9uUGF0aCwgc291cmNlRmlsZXMsIGZyYW1ld29ya3MsIGNvbmZpZ3VyYXRpb25zIH07XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuX3N1YmplY3RBY3RpdmVGcmFtZXdvcmsudW5zdWJzY3JpYmUoKTtcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgRW1wdHlQcm9qZWN0Vmlld01vZGVsIGV4dGVuZHMgUHJvamVjdFZpZXdNb2RlbCB7XG4gICAgaW5pdChwcm9qZWN0KSB7IH1cbn1cbmNsYXNzIFByb3h5UHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWwge1xuICAgIGluaXQocHJvamVjdCkge1xuICAgICAgICB0aGlzLnVwZGF0ZShwcm9qZWN0KTtcbiAgICB9XG59XG5jbGFzcyBNc0J1aWxkUHJvamVjdFZpZXdNb2RlbCBleHRlbmRzIFByb2plY3RWaWV3TW9kZWwge1xuICAgIGluaXQocHJvamVjdCkge1xuICAgICAgICBjb25zdCBmcmFtZXdvcmtzID0gW3tcbiAgICAgICAgICAgICAgICBGcmllbmRseU5hbWU6IHByb2plY3QuVGFyZ2V0RnJhbWV3b3JrLFxuICAgICAgICAgICAgICAgIE5hbWU6IHByb2plY3QuVGFyZ2V0RnJhbWV3b3JrLFxuICAgICAgICAgICAgICAgIFNob3J0TmFtZTogcHJvamVjdC5UYXJnZXRGcmFtZXdvcmtcbiAgICAgICAgICAgIH1dO1xuICAgICAgICB0aGlzLm5hbWUgPSBwcm9qZWN0LkFzc2VtYmx5TmFtZTtcbiAgICAgICAgdGhpcy5wYXRoID0gcHJvamVjdC5QYXRoO1xuICAgICAgICB0aGlzLmZyYW1ld29ya3MgPSBmcmFtZXdvcmtzO1xuICAgICAgICB0aGlzLnNvdXJjZUZpbGVzID0gcHJvamVjdC5Tb3VyY2VGaWxlcztcbiAgICB9XG59XG5jbGFzcyBEb3ROZXRQcm9qZWN0Vmlld01vZGVsIGV4dGVuZHMgUHJvamVjdFZpZXdNb2RlbCB7XG4gICAgaW5pdChwcm9qZWN0KSB7XG4gICAgICAgIHRoaXMubmFtZSA9IHByb2plY3QuTmFtZTtcbiAgICAgICAgdGhpcy5wYXRoID0gcHJvamVjdC5QYXRoO1xuICAgICAgICB0aGlzLmZyYW1ld29ya3MgPSBwcm9qZWN0LkZyYW1ld29ya3MgfHwgW107XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbnMgPSAocHJvamVjdC5Db25maWd1cmF0aW9ucyB8fCBbXSkubWFwKHggPT4geC5OYW1lKTtcbiAgICAgICAgdGhpcy5zb3VyY2VGaWxlcyA9IHByb2plY3QuU291cmNlRmlsZXMgfHwgW107XG4gICAgfVxufVxuY2xhc3MgU2NyaXB0Q3NQcm9qZWN0Vmlld01vZGVsIGV4dGVuZHMgUHJvamVjdFZpZXdNb2RlbCB7XG4gICAgaW5pdChwcm9qZWN0KSB7XG4gICAgICAgIHRoaXMubmFtZSA9IFwiU2NyaXB0Q3NcIjtcbiAgICAgICAgdGhpcy5wYXRoID0gcHJvamVjdC5QYXRoO1xuICAgICAgICB0aGlzLnNvdXJjZUZpbGVzID0gcHJvamVjdC5Dc3hGaWxlcztcbiAgICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

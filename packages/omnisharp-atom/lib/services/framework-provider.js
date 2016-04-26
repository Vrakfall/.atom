"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _jquery = require("jquery");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var filter = require("fuzzaldrin").filter;
var frameworkCache = new Map();
function fetchFrameworkFromGithub(framework) {
    if (frameworkCache.has(framework)) {
        return _rxjs.Observable.of(frameworkCache.get(framework));
    }
    var result = (0, _jquery.ajax)("https://raw.githubusercontent.com/OmniSharp/omnisharp-nuget/resources/frameworks/" + framework.toLowerCase() + ".json").then(function (res) {
        return JSON.parse(res);
    });
    return _rxjs.Observable.fromPromise(result);
}
function makeSuggestion(item, replacementPrefix) {
    var type = "package";
    return {
        _search: item,
        text: item,
        snippet: item,
        type: type,
        displayText: item,
        replacementPrefix: replacementPrefix,
        className: "autocomplete-project-json"
    };
}
var nameRegex = /\/((?:dnx|net)[0-9]{2,3})\/frameworkAssemblies$/;
var versionRegex = /\/((?:dnx|net)[0-9]{2,3})\/frameworkAssemblies\/([a-zA-Z0-9\._]*?)(?:\/version)?$/;

var NugetNameProvider = function () {
    function NugetNameProvider() {
        _classCallCheck(this, NugetNameProvider);

        this.fileMatchs = ["project.json"];
    }

    _createClass(NugetNameProvider, [{
        key: "getSuggestions",
        value: function getSuggestions(options) {
            var framework = options.path.match(nameRegex)[1];
            return fetchFrameworkFromGithub(framework).map(_lodash2.default.keys).map(function (z) {
                return z.map(function (x) {
                    return makeSuggestion(x, options.replacementPrefix);
                });
            }).map(function (s) {
                return filter(s, options.prefix, { key: "_search" });
            }).toPromise();
        }
    }, {
        key: "pathMatch",
        value: function pathMatch(path) {
            return path && !!path.match(nameRegex);
        }
    }, {
        key: "dispose",
        value: function dispose() {}
    }]);

    return NugetNameProvider;
}();

var NugetVersionProvider = function () {
    function NugetVersionProvider() {
        _classCallCheck(this, NugetVersionProvider);

        this.fileMatchs = ["project.json"];
    }

    _createClass(NugetVersionProvider, [{
        key: "getSuggestions",
        value: function getSuggestions(options) {
            var match = options.path.match(versionRegex);
            var framework = match[1];
            var name = match[2];
            return fetchFrameworkFromGithub(framework).map(function (x) {
                return [makeSuggestion(x[name], options.replacementPrefix)];
            }).toPromise();
        }
    }, {
        key: "pathMatch",
        value: function pathMatch(path) {
            return path && !!path.match(versionRegex);
        }
    }, {
        key: "dispose",
        value: function dispose() {}
    }]);

    return NugetVersionProvider;
}();

var providers = [new NugetNameProvider(), new NugetVersionProvider()];
module.exports = providers;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9mcmFtZXdvcmstcHJvdmlkZXIuanMiLCJsaWIvc2VydmljZXMvZnJhbWV3b3JrLXByb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7OztBQUNBOztBQUNBOzs7Ozs7QUNDQSxJQUFNLFNBQVMsUUFBUSxZQUFSLEVBQXNCLE1BQXJDO0FBRUEsSUFBTSxpQkFBaUIsSUFBSSxHQUFKLEVBQXZCO0FBRUEsU0FBQSx3QkFBQSxDQUFrQyxTQUFsQyxFQUFtRDtBQUMvQyxRQUFJLGVBQWUsR0FBZixDQUFtQixTQUFuQixDQUFKLEVBQW1DO0FBQy9CLGVBQU8saUJBQVcsRUFBWCxDQUF5QyxlQUFlLEdBQWYsQ0FBbUIsU0FBbkIsQ0FBekMsQ0FBUDtBQUNIO0FBR0QsUUFBTSxTQUFTLHdHQUF5RixVQUFVLFdBQVYsRUFBekYsWUFBeUgsSUFBekgsQ0FBOEg7QUFBQSxlQUFPLEtBQUssS0FBTCxDQUFXLEdBQVgsQ0FBUDtBQUFBLEtBQTlILENBQWY7QUFFQSxXQUFPLGlCQUFXLFdBQVgsQ0FBdUQsTUFBdkQsQ0FBUDtBQUNIO0FBbUJELFNBQUEsY0FBQSxDQUF3QixJQUF4QixFQUFzQyxpQkFBdEMsRUFBK0Q7QUFDM0QsUUFBTSxPQUFPLFNBQWI7QUFFQSxXQUFPO0FBQ0gsaUJBQVMsSUFETjtBQUVILGNBQU0sSUFGSDtBQUdILGlCQUFTLElBSE47QUFJSCxjQUFNLElBSkg7QUFLSCxxQkFBYSxJQUxWO0FBTUgsNENBTkc7QUFPSCxtQkFBVztBQVBSLEtBQVA7QUFTSDtBQUVELElBQU0sWUFBWSxpREFBbEI7QUFDQSxJQUFNLGVBQWUsbUZBQXJCOztJQUVBLGlCO0FBQUEsaUNBQUE7QUFBQTs7QUFVVyxhQUFBLFVBQUEsR0FBYSxDQUFDLGNBQUQsQ0FBYjtBQUtWOzs7O3VDQWR5QixPLEVBQXFDO0FBQ3ZELGdCQUFNLFlBQVksUUFBUSxJQUFSLENBQWEsS0FBYixDQUFtQixTQUFuQixFQUE4QixDQUE5QixDQUFsQjtBQUVBLG1CQUFPLHlCQUF5QixTQUF6QixFQUNGLEdBREUsQ0FDRSxpQkFBRSxJQURKLEVBRUYsR0FGRSxDQUVFO0FBQUEsdUJBQUssRUFBRSxHQUFGLENBQU07QUFBQSwyQkFBSyxlQUFlLENBQWYsRUFBa0IsUUFBUSxpQkFBMUIsQ0FBTDtBQUFBLGlCQUFOLENBQUw7QUFBQSxhQUZGLEVBR0YsR0FIRSxDQUdFO0FBQUEsdUJBQUssT0FBTyxDQUFQLEVBQVUsUUFBUSxNQUFsQixFQUEwQixFQUFFLEtBQUssU0FBUCxFQUExQixDQUFMO0FBQUEsYUFIRixFQUlGLFNBSkUsRUFBUDtBQUtIOzs7a0NBRWdCLEksRUFBWTtBQUN6QixtQkFBTyxRQUFRLENBQUMsQ0FBQyxLQUFLLEtBQUwsQ0FBVyxTQUFYLENBQWpCO0FBQ0g7OztrQ0FDYSxDQUFZOzs7Ozs7SUFHOUIsb0I7QUFBQSxvQ0FBQTtBQUFBOztBQVVXLGFBQUEsVUFBQSxHQUFhLENBQUMsY0FBRCxDQUFiO0FBS1Y7Ozs7dUNBZHlCLE8sRUFBcUM7QUFDdkQsZ0JBQU0sUUFBUSxRQUFRLElBQVIsQ0FBYSxLQUFiLENBQW1CLFlBQW5CLENBQWQ7QUFDQSxnQkFBTSxZQUFZLE1BQU0sQ0FBTixDQUFsQjtBQUNBLGdCQUFNLE9BQU8sTUFBTSxDQUFOLENBQWI7QUFFQSxtQkFBTyx5QkFBeUIsU0FBekIsRUFDRixHQURFLENBQ0U7QUFBQSx1QkFBSyxDQUFDLGVBQWUsRUFBRSxJQUFGLENBQWYsRUFBd0IsUUFBUSxpQkFBaEMsQ0FBRCxDQUFMO0FBQUEsYUFERixFQUVGLFNBRkUsRUFBUDtBQUdIOzs7a0NBRWdCLEksRUFBWTtBQUN6QixtQkFBTyxRQUFRLENBQUMsQ0FBQyxLQUFLLEtBQUwsQ0FBVyxZQUFYLENBQWpCO0FBQ0g7OztrQ0FDYSxDQUFZOzs7Ozs7QUFHOUIsSUFBTSxZQUFZLENBQUMsSUFBSSxpQkFBSixFQUFELEVBQXdCLElBQUksb0JBQUosRUFBeEIsQ0FBbEI7QUFDQSxPQUFPLE9BQVAsR0FBaUIsU0FBakIiLCJmaWxlIjoibGliL3NlcnZpY2VzL2ZyYW1ld29yay1wcm92aWRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9ic2VydmFibGUgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgYWpheCB9IGZyb20gXCJqcXVlcnlcIjtcbmNvbnN0IGZpbHRlciA9IHJlcXVpcmUoXCJmdXp6YWxkcmluXCIpLmZpbHRlcjtcbmNvbnN0IGZyYW1ld29ya0NhY2hlID0gbmV3IE1hcCgpO1xuZnVuY3Rpb24gZmV0Y2hGcmFtZXdvcmtGcm9tR2l0aHViKGZyYW1ld29yaykge1xuICAgIGlmIChmcmFtZXdvcmtDYWNoZS5oYXMoZnJhbWV3b3JrKSkge1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5vZihmcmFtZXdvcmtDYWNoZS5nZXQoZnJhbWV3b3JrKSk7XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdCA9IGFqYXgoYGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9PbW5pU2hhcnAvb21uaXNoYXJwLW51Z2V0L3Jlc291cmNlcy9mcmFtZXdvcmtzLyR7ZnJhbWV3b3JrLnRvTG93ZXJDYXNlKCl9Lmpzb25gKS50aGVuKHJlcyA9PiBKU09OLnBhcnNlKHJlcykpO1xuICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb21Qcm9taXNlKHJlc3VsdCk7XG59XG5mdW5jdGlvbiBtYWtlU3VnZ2VzdGlvbihpdGVtLCByZXBsYWNlbWVudFByZWZpeCkge1xuICAgIGNvbnN0IHR5cGUgPSBcInBhY2thZ2VcIjtcbiAgICByZXR1cm4ge1xuICAgICAgICBfc2VhcmNoOiBpdGVtLFxuICAgICAgICB0ZXh0OiBpdGVtLFxuICAgICAgICBzbmlwcGV0OiBpdGVtLFxuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICBkaXNwbGF5VGV4dDogaXRlbSxcbiAgICAgICAgcmVwbGFjZW1lbnRQcmVmaXgsXG4gICAgICAgIGNsYXNzTmFtZTogXCJhdXRvY29tcGxldGUtcHJvamVjdC1qc29uXCIsXG4gICAgfTtcbn1cbmNvbnN0IG5hbWVSZWdleCA9IC9cXC8oKD86ZG54fG5ldClbMC05XXsyLDN9KVxcL2ZyYW1ld29ya0Fzc2VtYmxpZXMkLztcbmNvbnN0IHZlcnNpb25SZWdleCA9IC9cXC8oKD86ZG54fG5ldClbMC05XXsyLDN9KVxcL2ZyYW1ld29ya0Fzc2VtYmxpZXNcXC8oW2EtekEtWjAtOVxcLl9dKj8pKD86XFwvdmVyc2lvbik/JC87XG5jbGFzcyBOdWdldE5hbWVQcm92aWRlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuZmlsZU1hdGNocyA9IFtcInByb2plY3QuanNvblwiXTtcbiAgICB9XG4gICAgZ2V0U3VnZ2VzdGlvbnMob3B0aW9ucykge1xuICAgICAgICBjb25zdCBmcmFtZXdvcmsgPSBvcHRpb25zLnBhdGgubWF0Y2gobmFtZVJlZ2V4KVsxXTtcbiAgICAgICAgcmV0dXJuIGZldGNoRnJhbWV3b3JrRnJvbUdpdGh1YihmcmFtZXdvcmspXG4gICAgICAgICAgICAubWFwKF8ua2V5cylcbiAgICAgICAgICAgIC5tYXAoeiA9PiB6Lm1hcCh4ID0+IG1ha2VTdWdnZXN0aW9uKHgsIG9wdGlvbnMucmVwbGFjZW1lbnRQcmVmaXgpKSlcbiAgICAgICAgICAgIC5tYXAocyA9PiBmaWx0ZXIocywgb3B0aW9ucy5wcmVmaXgsIHsga2V5OiBcIl9zZWFyY2hcIiB9KSlcbiAgICAgICAgICAgIC50b1Byb21pc2UoKTtcbiAgICB9XG4gICAgcGF0aE1hdGNoKHBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHBhdGggJiYgISFwYXRoLm1hdGNoKG5hbWVSZWdleCk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7IH1cbn1cbmNsYXNzIE51Z2V0VmVyc2lvblByb3ZpZGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5maWxlTWF0Y2hzID0gW1wicHJvamVjdC5qc29uXCJdO1xuICAgIH1cbiAgICBnZXRTdWdnZXN0aW9ucyhvcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gb3B0aW9ucy5wYXRoLm1hdGNoKHZlcnNpb25SZWdleCk7XG4gICAgICAgIGNvbnN0IGZyYW1ld29yayA9IG1hdGNoWzFdO1xuICAgICAgICBjb25zdCBuYW1lID0gbWF0Y2hbMl07XG4gICAgICAgIHJldHVybiBmZXRjaEZyYW1ld29ya0Zyb21HaXRodWIoZnJhbWV3b3JrKVxuICAgICAgICAgICAgLm1hcCh4ID0+IFttYWtlU3VnZ2VzdGlvbih4W25hbWVdLCBvcHRpb25zLnJlcGxhY2VtZW50UHJlZml4KV0pXG4gICAgICAgICAgICAudG9Qcm9taXNlKCk7XG4gICAgfVxuICAgIHBhdGhNYXRjaChwYXRoKSB7XG4gICAgICAgIHJldHVybiBwYXRoICYmICEhcGF0aC5tYXRjaCh2ZXJzaW9uUmVnZXgpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkgeyB9XG59XG5jb25zdCBwcm92aWRlcnMgPSBbbmV3IE51Z2V0TmFtZVByb3ZpZGVyLCBuZXcgTnVnZXRWZXJzaW9uUHJvdmlkZXJdO1xubW9kdWxlLmV4cG9ydHMgPSBwcm92aWRlcnM7XG4iLCJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQge09ic2VydmFibGV9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQge2FqYXh9IGZyb20gXCJqcXVlcnlcIjtcbmNvbnN0IGZpbHRlciA9IHJlcXVpcmUoXCJmdXp6YWxkcmluXCIpLmZpbHRlcjtcblxuY29uc3QgZnJhbWV3b3JrQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT4oKTtcblxuZnVuY3Rpb24gZmV0Y2hGcmFtZXdvcmtGcm9tR2l0aHViKGZyYW1ld29yazogc3RyaW5nKSB7XG4gICAgaWYgKGZyYW1ld29ya0NhY2hlLmhhcyhmcmFtZXdvcmspKSB7XG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLm9mPHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+KGZyYW1ld29ya0NhY2hlLmdldChmcmFtZXdvcmspKTtcbiAgICB9XG5cbiAgICAvLyBHZXQgdGhlIGZpbGUgZnJvbSBnaXRodWJcbiAgICBjb25zdCByZXN1bHQgPSBhamF4KGBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vT21uaVNoYXJwL29tbmlzaGFycC1udWdldC9yZXNvdXJjZXMvZnJhbWV3b3Jrcy8ke2ZyYW1ld29yay50b0xvd2VyQ2FzZSgpfS5qc29uYCkudGhlbihyZXMgPT4gSlNPTi5wYXJzZShyZXMpKTtcblxuICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb21Qcm9taXNlPHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+KDxhbnk+cmVzdWx0KTtcbn1cblxuaW50ZXJmYWNlIElBdXRvY29tcGxldGVQcm92aWRlck9wdGlvbnMge1xuICAgIGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yO1xuICAgIGJ1ZmZlclBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyAvLyB0aGUgcG9zaXRpb24gb2YgdGhlIGN1cnNvclxuICAgIHByZWZpeDogc3RyaW5nO1xuICAgIHNjb3BlRGVzY3JpcHRvcjogeyBzY29wZXM6IHN0cmluZ1tdIH07XG4gICAgYWN0aXZhdGVkTWFudWFsbHk6IGJvb2xlYW47XG4gICAgcGF0aDogc3RyaW5nO1xuICAgIHJlcGxhY2VtZW50UHJlZml4OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBJQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xuICAgIGZpbGVNYXRjaHM6IHN0cmluZ1tdO1xuICAgIHBhdGhNYXRjaDogKHBhdGg6IHN0cmluZykgPT4gYm9vbGVhbjtcbiAgICBnZXRTdWdnZXN0aW9uczogKG9wdGlvbnM6IElBdXRvY29tcGxldGVQcm92aWRlck9wdGlvbnMpID0+IFByb21pc2U8YW55W10+O1xuICAgIGRpc3Bvc2UoKTogdm9pZDtcbn1cblxuZnVuY3Rpb24gbWFrZVN1Z2dlc3Rpb24oaXRlbTogc3RyaW5nLCByZXBsYWNlbWVudFByZWZpeDogc3RyaW5nKSB7XG4gICAgY29uc3QgdHlwZSA9IFwicGFja2FnZVwiO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgX3NlYXJjaDogaXRlbSxcbiAgICAgICAgdGV4dDogaXRlbSxcbiAgICAgICAgc25pcHBldDogaXRlbSxcbiAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgZGlzcGxheVRleHQ6IGl0ZW0sXG4gICAgICAgIHJlcGxhY2VtZW50UHJlZml4LFxuICAgICAgICBjbGFzc05hbWU6IFwiYXV0b2NvbXBsZXRlLXByb2plY3QtanNvblwiLFxuICAgIH07XG59XG5cbmNvbnN0IG5hbWVSZWdleCA9IC9cXC8oKD86ZG54fG5ldClbMC05XXsyLDN9KVxcL2ZyYW1ld29ya0Fzc2VtYmxpZXMkLztcbmNvbnN0IHZlcnNpb25SZWdleCA9IC9cXC8oKD86ZG54fG5ldClbMC05XXsyLDN9KVxcL2ZyYW1ld29ya0Fzc2VtYmxpZXNcXC8oW2EtekEtWjAtOVxcLl9dKj8pKD86XFwvdmVyc2lvbik/JC87XG5cbmNsYXNzIE51Z2V0TmFtZVByb3ZpZGVyIGltcGxlbWVudHMgSUF1dG9jb21wbGV0ZVByb3ZpZGVyIHtcbiAgICBwdWJsaWMgZ2V0U3VnZ2VzdGlvbnMob3B0aW9uczogSUF1dG9jb21wbGV0ZVByb3ZpZGVyT3B0aW9ucykge1xuICAgICAgICBjb25zdCBmcmFtZXdvcmsgPSBvcHRpb25zLnBhdGgubWF0Y2gobmFtZVJlZ2V4KVsxXTtcblxuICAgICAgICByZXR1cm4gZmV0Y2hGcmFtZXdvcmtGcm9tR2l0aHViKGZyYW1ld29yaylcbiAgICAgICAgICAgIC5tYXAoXy5rZXlzKVxuICAgICAgICAgICAgLm1hcCh6ID0+IHoubWFwKHggPT4gbWFrZVN1Z2dlc3Rpb24oeCwgb3B0aW9ucy5yZXBsYWNlbWVudFByZWZpeCkpKVxuICAgICAgICAgICAgLm1hcChzID0+IGZpbHRlcihzLCBvcHRpb25zLnByZWZpeCwgeyBrZXk6IFwiX3NlYXJjaFwiIH0pKVxuICAgICAgICAgICAgLnRvUHJvbWlzZSgpO1xuICAgIH1cbiAgICBwdWJsaWMgZmlsZU1hdGNocyA9IFtcInByb2plY3QuanNvblwiXTtcbiAgICBwdWJsaWMgcGF0aE1hdGNoKHBhdGg6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gcGF0aCAmJiAhIXBhdGgubWF0Y2gobmFtZVJlZ2V4KTtcbiAgICB9XG4gICAgcHVibGljIGRpc3Bvc2UoKSB7IC8qICovIH1cbn1cblxuY2xhc3MgTnVnZXRWZXJzaW9uUHJvdmlkZXIgaW1wbGVtZW50cyBJQXV0b2NvbXBsZXRlUHJvdmlkZXIge1xuICAgIHB1YmxpYyBnZXRTdWdnZXN0aW9ucyhvcHRpb25zOiBJQXV0b2NvbXBsZXRlUHJvdmlkZXJPcHRpb25zKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gb3B0aW9ucy5wYXRoLm1hdGNoKHZlcnNpb25SZWdleCk7XG4gICAgICAgIGNvbnN0IGZyYW1ld29yayA9IG1hdGNoWzFdO1xuICAgICAgICBjb25zdCBuYW1lID0gbWF0Y2hbMl07XG5cbiAgICAgICAgcmV0dXJuIGZldGNoRnJhbWV3b3JrRnJvbUdpdGh1YihmcmFtZXdvcmspXG4gICAgICAgICAgICAubWFwKHggPT4gW21ha2VTdWdnZXN0aW9uKHhbbmFtZV0sIG9wdGlvbnMucmVwbGFjZW1lbnRQcmVmaXgpXSlcbiAgICAgICAgICAgIC50b1Byb21pc2UoKTtcbiAgICB9XG4gICAgcHVibGljIGZpbGVNYXRjaHMgPSBbXCJwcm9qZWN0Lmpzb25cIl07XG4gICAgcHVibGljIHBhdGhNYXRjaChwYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgcmV0dXJuIHBhdGggJiYgISFwYXRoLm1hdGNoKHZlcnNpb25SZWdleCk7XG4gICAgfVxuICAgIHB1YmxpYyBkaXNwb3NlKCkgeyAvKiAqLyB9XG59XG5cbmNvbnN0IHByb3ZpZGVycyA9IFtuZXcgTnVnZXROYW1lUHJvdmlkZXIsIG5ldyBOdWdldFZlcnNpb25Qcm92aWRlcl07XG5tb2R1bGUuZXhwb3J0cyA9IHByb3ZpZGVycztcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

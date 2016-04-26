"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.reloadWorkspace = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

var _fs = require("fs");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var oexists = _rxjs.Observable.bindCallback(_fs.exists);

var ReloadWorkspace = function () {
    function ReloadWorkspace() {
        _classCallCheck(this, ReloadWorkspace);

        this.required = true;
        this.title = "Reload Workspace";
        this.description = "Reloads the workspace, to make sure all the files are in sync.";
    }

    _createClass(ReloadWorkspace, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add(atom.commands.add(atom.views.getView(atom.workspace), "omnisharp-atom:reload-workspace", function () {
                return _this.reloadWorkspace().toPromise();
            }));
        }
    }, {
        key: "reloadWorkspace",
        value: function reloadWorkspace() {
            return _omni.Omni.solutions.flatMap(function (solution) {
                return _rxjs.Observable.from(solution.model.projects).flatMap(function (x) {
                    return x.sourceFiles;
                }).observeOn(_rxjs.Scheduler.queue).concatMap(function (file) {
                    return oexists(file).filter(function (x) {
                        return !x;
                    }).flatMap(function () {
                        return solution.updatebuffer({ FileName: file, Buffer: "" });
                    });
                });
            });
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return ReloadWorkspace;
}();

var reloadWorkspace = exports.reloadWorkspace = new ReloadWorkspace();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9yZWxvYWQtd29ya3NwYWNlLmpzIiwibGliL2ZlYXR1cmVzL3JlbG9hZC13b3Jrc3BhY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUNFQSxJQUFNLFVBQVUsaUJBQVcsWUFBWCxZQUFoQjs7SUFFQSxlO0FBQUEsK0JBQUE7QUFBQTs7QUF3QlcsYUFBQSxRQUFBLEdBQVcsSUFBWDtBQUNBLGFBQUEsS0FBQSxHQUFRLGtCQUFSO0FBQ0EsYUFBQSxXQUFBLEdBQWMsZ0VBQWQ7QUFDVjs7OzttQ0F4QmtCO0FBQUE7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEI7QUFFQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsS0FBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixLQUFLLFNBQXhCLENBQWxCLEVBQXNELGlDQUF0RCxFQUF5RjtBQUFBLHVCQUFNLE1BQUssZUFBTCxHQUF1QixTQUF2QixFQUFOO0FBQUEsYUFBekYsQ0FBcEI7QUFDSDs7OzBDQUVxQjtBQUNsQixtQkFBTyxXQUFLLFNBQUwsQ0FDRixPQURFLENBQ00sb0JBQVE7QUFDYix1QkFBTyxpQkFBVyxJQUFYLENBQXVDLFNBQVMsS0FBVCxDQUFlLFFBQXRELEVBQ0YsT0FERSxDQUNNO0FBQUEsMkJBQUssRUFBRSxXQUFQO0FBQUEsaUJBRE4sRUFFRixTQUZFLENBRVEsZ0JBQVUsS0FGbEIsRUFHRixTQUhFLENBR1E7QUFBQSwyQkFBUSxRQUFRLElBQVIsRUFBYyxNQUFkLENBQXFCO0FBQUEsK0JBQUssQ0FBQyxDQUFOO0FBQUEscUJBQXJCLEVBQ2QsT0FEYyxDQUNOO0FBQUEsK0JBQU0sU0FBUyxZQUFULENBQXNCLEVBQUUsVUFBVSxJQUFaLEVBQWtCLFFBQVEsRUFBMUIsRUFBdEIsQ0FBTjtBQUFBLHFCQURNLENBQVI7QUFBQSxpQkFIUixDQUFQO0FBS0gsYUFQRSxDQUFQO0FBUUg7OztrQ0FFYTtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEI7QUFDSDs7Ozs7O0FBT0UsSUFBTSw0Q0FBa0IsSUFBSSxlQUFKLEVBQXhCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9yZWxvYWQtd29ya3NwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZSwgU2NoZWR1bGVyIH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgZXhpc3RzIH0gZnJvbSBcImZzXCI7XG5jb25zdCBvZXhpc3RzID0gT2JzZXJ2YWJsZS5iaW5kQ2FsbGJhY2soZXhpc3RzKTtcbmNsYXNzIFJlbG9hZFdvcmtzcGFjZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJSZWxvYWQgV29ya3NwYWNlXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIlJlbG9hZHMgdGhlIHdvcmtzcGFjZSwgdG8gbWFrZSBzdXJlIGFsbCB0aGUgZmlsZXMgYXJlIGluIHN5bmMuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMuYWRkKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206cmVsb2FkLXdvcmtzcGFjZVwiLCAoKSA9PiB0aGlzLnJlbG9hZFdvcmtzcGFjZSgpLnRvUHJvbWlzZSgpKSk7XG4gICAgfVxuICAgIHJlbG9hZFdvcmtzcGFjZSgpIHtcbiAgICAgICAgcmV0dXJuIE9tbmkuc29sdXRpb25zXG4gICAgICAgICAgICAuZmxhdE1hcChzb2x1dGlvbiA9PiB7XG4gICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tKHNvbHV0aW9uLm1vZGVsLnByb2plY3RzKVxuICAgICAgICAgICAgICAgIC5mbGF0TWFwKHggPT4geC5zb3VyY2VGaWxlcylcbiAgICAgICAgICAgICAgICAub2JzZXJ2ZU9uKFNjaGVkdWxlci5xdWV1ZSlcbiAgICAgICAgICAgICAgICAuY29uY2F0TWFwKGZpbGUgPT4gb2V4aXN0cyhmaWxlKS5maWx0ZXIoeCA9PiAheClcbiAgICAgICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiBzb2x1dGlvbi51cGRhdGVidWZmZXIoeyBGaWxlTmFtZTogZmlsZSwgQnVmZmVyOiBcIlwiIH0pKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCByZWxvYWRXb3Jrc3BhY2UgPSBuZXcgUmVsb2FkV29ya3NwYWNlO1xuIiwiaW1wb3J0IHtPYnNlcnZhYmxlLCBTY2hlZHVsZXJ9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHtleGlzdHN9IGZyb20gXCJmc1wiO1xuaW1wb3J0IHtQcm9qZWN0Vmlld01vZGVsfSBmcm9tIFwiLi4vc2VydmVyL3Byb2plY3Qtdmlldy1tb2RlbFwiO1xuY29uc3Qgb2V4aXN0cyA9IE9ic2VydmFibGUuYmluZENhbGxiYWNrKGV4aXN0cyk7XG5cbmNsYXNzIFJlbG9hZFdvcmtzcGFjZSBpbXBsZW1lbnRzIElGZWF0dXJlIHtcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG5cbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLmFkZChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnJlbG9hZC13b3Jrc3BhY2VcIiwgKCkgPT4gdGhpcy5yZWxvYWRXb3Jrc3BhY2UoKS50b1Byb21pc2UoKSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZWxvYWRXb3Jrc3BhY2UoKSB7XG4gICAgICAgIHJldHVybiBPbW5pLnNvbHV0aW9uc1xuICAgICAgICAgICAgLmZsYXRNYXAoc29sdXRpb24gPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb208UHJvamVjdFZpZXdNb2RlbDxhbnk+Pihzb2x1dGlvbi5tb2RlbC5wcm9qZWN0cylcbiAgICAgICAgICAgICAgICAgICAgLmZsYXRNYXAoeCA9PiB4LnNvdXJjZUZpbGVzKVxuICAgICAgICAgICAgICAgICAgICAub2JzZXJ2ZU9uKFNjaGVkdWxlci5xdWV1ZSlcbiAgICAgICAgICAgICAgICAgICAgLmNvbmNhdE1hcChmaWxlID0+IG9leGlzdHMoZmlsZSkuZmlsdGVyKHggPT4gIXgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiBzb2x1dGlvbi51cGRhdGVidWZmZXIoeyBGaWxlTmFtZTogZmlsZSwgQnVmZmVyOiBcIlwiIH0pKSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xuICAgIHB1YmxpYyB0aXRsZSA9IFwiUmVsb2FkIFdvcmtzcGFjZVwiO1xuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiUmVsb2FkcyB0aGUgd29ya3NwYWNlLCB0byBtYWtlIHN1cmUgYWxsIHRoZSBmaWxlcyBhcmUgaW4gc3luYy5cIjtcbn1cblxuZXhwb3J0IGNvbnN0IHJlbG9hZFdvcmtzcGFjZSA9IG5ldyBSZWxvYWRXb3Jrc3BhY2U7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

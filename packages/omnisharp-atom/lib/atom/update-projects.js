"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.updateProject = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _omni = require("../server/omni");

var _fs = require("fs");

var fs = _interopRequireWildcard(_fs);

var _path = require("path");

var _bufferFor = require("../operators/bufferFor");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var stat = _rxjs.Observable.bindNodeCallback(fs.stat);

var UpdateProject = function () {
    function UpdateProject() {
        _classCallCheck(this, UpdateProject);

        this.required = true;
        this.title = "Atom Project Updater";
        this.description = "Adds support for detecting external projects and if atom is looking at the wrong project folder.";
    }

    _createClass(UpdateProject, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            atom.config.observe("omnisharp-atom.autoAdjustTreeView", function (value) {
                return _this._autoAdjustTreeView = value;
            });
            atom.config.observe("omnisharp-atom.nagAdjustTreeView", function (value) {
                return _this._nagAdjustTreeView = value;
            });
            atom.config.observe("omnisharp-atom.autoAddExternalProjects", function (value) {
                return _this._autoAddExternalProjects = value;
            });
            atom.config.observe("omnisharp-atom.nagAddExternalProjects", function (value) {
                return _this._nagAddExternalProjects = value;
            });
            this._paths = atom.project.getPaths();
            atom.project.onDidChangePaths(function (paths) {
                return _this._paths = paths;
            });
            this.disposable.add((0, _bufferFor.bufferFor)(_omni.Omni.listener.model.projectAdded.filter(function (z) {
                return _this._autoAddExternalProjects || _this._nagAddExternalProjects;
            }).filter(function (z) {
                return !_lodash2.default.startsWith(z.path, z.solutionPath);
            }).filter(function (z) {
                return !_lodash2.default.some(_this._paths, function (x) {
                    return _lodash2.default.startsWith(z.path, x);
                });
            }), 1000).filter(function (z) {
                return z.length > 0;
            }).subscribe(function (project) {
                return _this.handleProjectAdded(project);
            }));
            this.disposable.add((0, _bufferFor.bufferFor)(_omni.Omni.listener.model.projectRemoved.filter(function (z) {
                return _this._autoAddExternalProjects || _this._nagAddExternalProjects;
            }).filter(function (z) {
                return !_lodash2.default.startsWith(z.path, z.solutionPath);
            }).filter(function (z) {
                return _lodash2.default.some(_this._paths, function (x) {
                    return _lodash2.default.startsWith(z.path, x);
                });
            }), 1000).filter(function (z) {
                return z.length > 0;
            }).subscribe(function (project) {
                return _this.handleProjectRemoved(project);
            }));
            _omni.Omni.registerConfiguration(function (solution) {
                if (!solution.temporary) {
                    (function () {
                        var path = _lodash2.default.find(_this._paths, function (x) {
                            return _lodash2.default.startsWith(x, solution.path) && x !== solution.path;
                        });
                        if (path) {
                            if (_this._autoAdjustTreeView) {
                                _this.adjustTreeView(path, solution.path);
                            } else if (_this._nagAdjustTreeView) {
                                (function () {
                                    var notification = atom.notifications.addInfo("Show solution root?", {
                                        detail: path + "\n-> " + solution.path,
                                        description: "It appears the solution root is not displayed in the treeview.  Would you like to show the entire solution in the tree view?",
                                        buttons: [{
                                            text: "Okay",
                                            className: "btn-success",
                                            onDidClick: function onDidClick() {
                                                _this.adjustTreeView(path, solution.path);
                                                notification.dismiss();
                                            }
                                        }, {
                                            text: "Dismiss",
                                            onDidClick: function onDidClick() {
                                                notification.dismiss();
                                            }
                                        }],
                                        dismissable: true
                                    });
                                })();
                            }
                        }
                    })();
                }
            });
        }
    }, {
        key: "adjustTreeView",
        value: function adjustTreeView(oldPath, newPath) {
            var newPaths = this._paths.slice();
            newPaths.splice(_lodash2.default.findIndex(this._paths, oldPath), 1, newPath);
            atom.project.setPaths(newPaths);
        }
    }, {
        key: "getProjectDirectories",
        value: function getProjectDirectories(projects) {
            return _rxjs.Observable.from(_lodash2.default.uniq(projects.map(function (z) {
                return z.path;
            }))).flatMap(function (project) {
                return stat(project);
            }, function (project, st) {
                if (st.isDirectory()) {
                    return project;
                } else {
                    return (0, _path.dirname)(project);
                }
            }).toArray();
        }
    }, {
        key: "handleProjectAdded",
        value: function handleProjectAdded(projects) {
            var _this2 = this;

            this.getProjectDirectories(projects).subscribe(function (paths) {
                if (_this2._autoAddExternalProjects) {
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = paths[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var project = _step.value;

                            atom.project.addPath(project);
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
                } else if (_this2._nagAddExternalProjects) {
                    (function () {
                        var notification = atom.notifications.addInfo("Add external projects?", {
                            detail: paths.join("\n"),
                            description: "We have detected external projects would you like to add them to the treeview?",
                            buttons: [{
                                text: "Okay",
                                className: "btn-success",
                                onDidClick: function onDidClick() {
                                    var _iteratorNormalCompletion2 = true;
                                    var _didIteratorError2 = false;
                                    var _iteratorError2 = undefined;

                                    try {
                                        for (var _iterator2 = paths[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                            var _project = _step2.value;

                                            atom.project.addPath(_project);
                                        }
                                    } catch (err) {
                                        _didIteratorError2 = true;
                                        _iteratorError2 = err;
                                    } finally {
                                        try {
                                            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                                _iterator2.return();
                                            }
                                        } finally {
                                            if (_didIteratorError2) {
                                                throw _iteratorError2;
                                            }
                                        }
                                    }

                                    notification.dismiss();
                                }
                            }, {
                                text: "Dismiss",
                                onDidClick: function onDidClick() {
                                    notification.dismiss();
                                }
                            }],
                            dismissable: true
                        });
                    })();
                }
            });
        }
    }, {
        key: "handleProjectRemoved",
        value: function handleProjectRemoved(projects) {
            var _this3 = this;

            this.getProjectDirectories(projects).subscribe(function (paths) {
                if (_this3._autoAddExternalProjects) {
                    var _iteratorNormalCompletion3 = true;
                    var _didIteratorError3 = false;
                    var _iteratorError3 = undefined;

                    try {
                        for (var _iterator3 = paths[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var project = _step3.value;

                            atom.project.removePath(project);
                        }
                    } catch (err) {
                        _didIteratorError3 = true;
                        _iteratorError3 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                                _iterator3.return();
                            }
                        } finally {
                            if (_didIteratorError3) {
                                throw _iteratorError3;
                            }
                        }
                    }
                } else if (_this3._nagAddExternalProjects) {
                    (function () {
                        var notification = atom.notifications.addInfo("Remove external projects?", {
                            detail: paths.join("\n"),
                            description: "We have detected external projects have been removed, would you like to remove them from the treeview?",
                            buttons: [{
                                text: "Okay",
                                className: "btn-success",
                                onDidClick: function onDidClick() {
                                    var _iteratorNormalCompletion4 = true;
                                    var _didIteratorError4 = false;
                                    var _iteratorError4 = undefined;

                                    try {
                                        for (var _iterator4 = paths[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                            var _project2 = _step4.value;

                                            atom.project.removePath(_project2);
                                        }
                                    } catch (err) {
                                        _didIteratorError4 = true;
                                        _iteratorError4 = err;
                                    } finally {
                                        try {
                                            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                                _iterator4.return();
                                            }
                                        } finally {
                                            if (_didIteratorError4) {
                                                throw _iteratorError4;
                                            }
                                        }
                                    }

                                    notification.dismiss();
                                }
                            }, {
                                text: "Dismiss",
                                onDidClick: function onDidClick() {
                                    notification.dismiss();
                                }
                            }],
                            dismissable: true
                        });
                    })();
                }
            });
        }
    }, {
        key: "attach",
        value: function attach() {}
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return UpdateProject;
}();

var updateProject = exports.updateProject = new UpdateProject();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3VwZGF0ZS1wcm9qZWN0cy5qcyIsImxpYi9hdG9tL3VwZGF0ZS1wcm9qZWN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztBQUNBOztBQUNBOztJQ0NZLEU7O0FEQ1o7O0FBQ0E7Ozs7Ozs7O0FDREEsSUFBTSxPQUFPLGlCQUFXLGdCQUFYLENBQTRCLEdBQUcsSUFBL0IsQ0FBYjs7SUFJQSxhO0FBQUEsNkJBQUE7QUFBQTs7QUEyS1csYUFBQSxRQUFBLEdBQVcsSUFBWDtBQUNBLGFBQUEsS0FBQSxHQUFRLHNCQUFSO0FBQ0EsYUFBQSxXQUFBLEdBQWMsa0dBQWQ7QUFDVjs7OzttQ0FyS2tCO0FBQUE7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEI7QUFFQSxpQkFBSyxNQUFMLENBQVksT0FBWixDQUFvQixtQ0FBcEIsRUFBeUQsVUFBQyxLQUFEO0FBQUEsdUJBQW9CLE1BQUssbUJBQUwsR0FBMkIsS0FBL0M7QUFBQSxhQUF6RDtBQUNBLGlCQUFLLE1BQUwsQ0FBWSxPQUFaLENBQW9CLGtDQUFwQixFQUF3RCxVQUFDLEtBQUQ7QUFBQSx1QkFBb0IsTUFBSyxrQkFBTCxHQUEwQixLQUE5QztBQUFBLGFBQXhEO0FBRUEsaUJBQUssTUFBTCxDQUFZLE9BQVosQ0FBb0Isd0NBQXBCLEVBQThELFVBQUMsS0FBRDtBQUFBLHVCQUFvQixNQUFLLHdCQUFMLEdBQWdDLEtBQXBEO0FBQUEsYUFBOUQ7QUFDQSxpQkFBSyxNQUFMLENBQVksT0FBWixDQUFvQix1Q0FBcEIsRUFBNkQsVUFBQyxLQUFEO0FBQUEsdUJBQW9CLE1BQUssdUJBQUwsR0FBK0IsS0FBbkQ7QUFBQSxhQUE3RDtBQUdBLGlCQUFLLE1BQUwsR0FBYyxLQUFLLE9BQUwsQ0FBYSxRQUFiLEVBQWQ7QUFDQSxpQkFBSyxPQUFMLENBQWEsZ0JBQWIsQ0FBOEIsVUFBQyxLQUFEO0FBQUEsdUJBQWtCLE1BQUssTUFBTCxHQUFjLEtB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LHNDQUFNLE1BRFY7QUFFSSwyQ0FBVyxhQUZmO0FBR0ksNENBQVksc0JBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFDUiw4REFBc0IsS0FBdEIsbUlBQTZCO0FBQUEsZ0RBQWxCLFNBQWtCOztBQUN6QixpREFBSyxPQUFMLENBQWEsVUFBYixDQUF3QixTQUF4QjtBQUNIO0FBSE87QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFJUixpREFBYSxPQUFiO0FBQ0g7QUFSTCw2QkFESyxFQVVGO0FBQ0Msc0NBQU0sU0FEUDtBQUVDLDRDQUFZLHNCQUFBO0FBQ1IsaURBQWEsT0FBYjtBQUNIO0FBSkYsNkJBVkUsQ0FIbUU7QUFvQjVFLHlDQUFhO0FBcEIrRCx5QkFBN0QsQ0FBbkI7QUFEcUM7QUF1QnhDO0FBQ0osYUE5Qkw7QUErQkg7OztpQ0FFWSxDQUFZOzs7a0NBRVg7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCO0FBQ0g7Ozs7OztBQU9FLElBQU0sd0NBQWdCLElBQUksYUFBSixFQUF0QiIsImZpbGUiOiJsaWIvYXRvbS91cGRhdGUtcHJvamVjdHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5jb25zdCBzdGF0ID0gT2JzZXJ2YWJsZS5iaW5kTm9kZUNhbGxiYWNrKGZzLnN0YXQpO1xuaW1wb3J0IHsgZGlybmFtZSB9IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBidWZmZXJGb3IgfSBmcm9tIFwiLi4vb3BlcmF0b3JzL2J1ZmZlckZvclwiO1xuY2xhc3MgVXBkYXRlUHJvamVjdCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJBdG9tIFByb2plY3QgVXBkYXRlclwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJBZGRzIHN1cHBvcnQgZm9yIGRldGVjdGluZyBleHRlcm5hbCBwcm9qZWN0cyBhbmQgaWYgYXRvbSBpcyBsb29raW5nIGF0IHRoZSB3cm9uZyBwcm9qZWN0IGZvbGRlci5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5hdXRvQWRqdXN0VHJlZVZpZXdcIiwgKHZhbHVlKSA9PiB0aGlzLl9hdXRvQWRqdXN0VHJlZVZpZXcgPSB2YWx1ZSk7XG4gICAgICAgIGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5uYWdBZGp1c3RUcmVlVmlld1wiLCAodmFsdWUpID0+IHRoaXMuX25hZ0FkanVzdFRyZWVWaWV3ID0gdmFsdWUpO1xuICAgICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20uYXV0b0FkZEV4dGVybmFsUHJvamVjdHNcIiwgKHZhbHVlKSA9PiB0aGlzLl9hdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cyA9IHZhbHVlKTtcbiAgICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLm5hZ0FkZEV4dGVybmFsUHJvamVjdHNcIiwgKHZhbHVlKSA9PiB0aGlzLl9uYWdBZGRFeHRlcm5hbFByb2plY3RzID0gdmFsdWUpO1xuICAgICAgICB0aGlzLl9wYXRocyA9IGF0b20ucHJvamVjdC5nZXRQYXRocygpO1xuICAgICAgICBhdG9tLnByb2plY3Qub25EaWRDaGFuZ2VQYXRocygocGF0aHMpID0+IHRoaXMuX3BhdGhzID0gcGF0aHMpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGJ1ZmZlckZvcihPbW5pLmxpc3RlbmVyLm1vZGVsLnByb2plY3RBZGRlZFxuICAgICAgICAgICAgLmZpbHRlcih6ID0+IHRoaXMuX2F1dG9BZGRFeHRlcm5hbFByb2plY3RzIHx8IHRoaXMuX25hZ0FkZEV4dGVybmFsUHJvamVjdHMpXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIV8uc3RhcnRzV2l0aCh6LnBhdGgsIHouc29sdXRpb25QYXRoKSlcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhXy5zb21lKHRoaXMuX3BhdGhzLCB4ID0+IF8uc3RhcnRzV2l0aCh6LnBhdGgsIHgpKSksIDEwMDApXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gei5sZW5ndGggPiAwKVxuICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuaGFuZGxlUHJvamVjdEFkZGVkKHByb2plY3QpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYnVmZmVyRm9yKE9tbmkubGlzdGVuZXIubW9kZWwucHJvamVjdFJlbW92ZWRcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB0aGlzLl9hdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cyB8fCB0aGlzLl9uYWdBZGRFeHRlcm5hbFByb2plY3RzKVxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICFfLnN0YXJ0c1dpdGgoei5wYXRoLCB6LnNvbHV0aW9uUGF0aCkpXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gXy5zb21lKHRoaXMuX3BhdGhzLCB4ID0+IF8uc3RhcnRzV2l0aCh6LnBhdGgsIHgpKSksIDEwMDApXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gei5sZW5ndGggPiAwKVxuICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuaGFuZGxlUHJvamVjdFJlbW92ZWQocHJvamVjdCkpKTtcbiAgICAgICAgT21uaS5yZWdpc3RlckNvbmZpZ3VyYXRpb24oc29sdXRpb24gPT4ge1xuICAgICAgICAgICAgaWYgKCFzb2x1dGlvbi50ZW1wb3JhcnkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gXy5maW5kKHRoaXMuX3BhdGhzLCB4ID0+IF8uc3RhcnRzV2l0aCh4LCBzb2x1dGlvbi5wYXRoKSAmJiB4ICE9PSBzb2x1dGlvbi5wYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYXV0b0FkanVzdFRyZWVWaWV3KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkanVzdFRyZWVWaWV3KHBhdGgsIHNvbHV0aW9uLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuX25hZ0FkanVzdFRyZWVWaWV3KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oXCJTaG93IHNvbHV0aW9uIHJvb3Q/XCIsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IGAke3BhdGh9XFxuLT4gJHtzb2x1dGlvbi5wYXRofWAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiSXQgYXBwZWFycyB0aGUgc29sdXRpb24gcm9vdCBpcyBub3QgZGlzcGxheWVkIGluIHRoZSB0cmVldmlldy4gIFdvdWxkIHlvdSBsaWtlIHRvIHNob3cgdGhlIGVudGlyZSBzb2x1dGlvbiBpbiB0aGUgdHJlZSB2aWV3P1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJPa2F5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6IFwiYnRuLXN1Y2Nlc3NcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkanVzdFRyZWVWaWV3KHBhdGgsIHNvbHV0aW9uLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiRGlzbWlzc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGFkanVzdFRyZWVWaWV3KG9sZFBhdGgsIG5ld1BhdGgpIHtcbiAgICAgICAgY29uc3QgbmV3UGF0aHMgPSB0aGlzLl9wYXRocy5zbGljZSgpO1xuICAgICAgICBuZXdQYXRocy5zcGxpY2UoXy5maW5kSW5kZXgodGhpcy5fcGF0aHMsIG9sZFBhdGgpLCAxLCBuZXdQYXRoKTtcbiAgICAgICAgYXRvbS5wcm9qZWN0LnNldFBhdGhzKG5ld1BhdGhzKTtcbiAgICB9XG4gICAgZ2V0UHJvamVjdERpcmVjdG9yaWVzKHByb2plY3RzKSB7XG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmZyb20oXy51bmlxKHByb2plY3RzLm1hcCh6ID0+IHoucGF0aCkpKVxuICAgICAgICAgICAgLmZsYXRNYXAocHJvamVjdCA9PiBzdGF0KHByb2plY3QpLCAocHJvamVjdCwgc3QpID0+IHtcbiAgICAgICAgICAgIGlmIChzdC5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb2plY3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGlybmFtZShwcm9qZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgICAgIC50b0FycmF5KCk7XG4gICAgfVxuICAgIGhhbmRsZVByb2plY3RBZGRlZChwcm9qZWN0cykge1xuICAgICAgICB0aGlzLmdldFByb2plY3REaXJlY3Rvcmllcyhwcm9qZWN0cylcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocGF0aHMgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2F1dG9BZGRFeHRlcm5hbFByb2plY3RzKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHBhdGhzKSB7XG4gICAgICAgICAgICAgICAgICAgIGF0b20ucHJvamVjdC5hZGRQYXRoKHByb2plY3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuX25hZ0FkZEV4dGVybmFsUHJvamVjdHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oYEFkZCBleHRlcm5hbCBwcm9qZWN0cz9gLCB7XG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogcGF0aHMuam9pbihcIlxcblwiKSxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGBXZSBoYXZlIGRldGVjdGVkIGV4dGVybmFsIHByb2plY3RzIHdvdWxkIHlvdSBsaWtlIHRvIGFkZCB0aGVtIHRvIHRoZSB0cmVldmlldz9gLFxuICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJPa2F5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBcImJ0bi1zdWNjZXNzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb2plY3Qgb2YgcGF0aHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ucHJvamVjdC5hZGRQYXRoKHByb2plY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiRGlzbWlzc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBoYW5kbGVQcm9qZWN0UmVtb3ZlZChwcm9qZWN0cykge1xuICAgICAgICB0aGlzLmdldFByb2plY3REaXJlY3Rvcmllcyhwcm9qZWN0cylcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocGF0aHMgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2F1dG9BZGRFeHRlcm5hbFByb2plY3RzKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHBhdGhzKSB7XG4gICAgICAgICAgICAgICAgICAgIGF0b20ucHJvamVjdC5yZW1vdmVQYXRoKHByb2plY3QpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMuX25hZ0FkZEV4dGVybmFsUHJvamVjdHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oYFJlbW92ZSBleHRlcm5hbCBwcm9qZWN0cz9gLCB7XG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogcGF0aHMuam9pbihcIlxcblwiKSxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGBXZSBoYXZlIGRldGVjdGVkIGV4dGVybmFsIHByb2plY3RzIGhhdmUgYmVlbiByZW1vdmVkLCB3b3VsZCB5b3UgbGlrZSB0byByZW1vdmUgdGhlbSBmcm9tIHRoZSB0cmVldmlldz9gLFxuICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJPa2F5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBcImJ0bi1zdWNjZXNzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb2plY3Qgb2YgcGF0aHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ucHJvamVjdC5yZW1vdmVQYXRoKHByb2plY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiRGlzbWlzc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBhdHRhY2goKSB7IH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCB1cGRhdGVQcm9qZWN0ID0gbmV3IFVwZGF0ZVByb2plY3Q7XG4iLCJpbXBvcnQge09ic2VydmFibGV9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHtQcm9qZWN0Vmlld01vZGVsfSBmcm9tIFwiLi4vc2VydmVyL3Byb2plY3Qtdmlldy1tb2RlbFwiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5jb25zdCBzdGF0ID0gT2JzZXJ2YWJsZS5iaW5kTm9kZUNhbGxiYWNrKGZzLnN0YXQpO1xuaW1wb3J0IHtkaXJuYW1lfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHtidWZmZXJGb3J9IGZyb20gXCIuLi9vcGVyYXRvcnMvYnVmZmVyRm9yXCI7XG5cbmNsYXNzIFVwZGF0ZVByb2plY3QgaW1wbGVtZW50cyBJQXRvbUZlYXR1cmUge1xuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcbiAgICBwcml2YXRlIF9wYXRoczogc3RyaW5nW107XG5cbiAgICBwcml2YXRlIF9hdXRvQWRqdXN0VHJlZVZpZXc6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSBfbmFnQWRqdXN0VHJlZVZpZXc6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSBfYXV0b0FkZEV4dGVybmFsUHJvamVjdHM6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSBfbmFnQWRkRXh0ZXJuYWxQcm9qZWN0czogYm9vbGVhbjtcblxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcblxuICAgICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20uYXV0b0FkanVzdFRyZWVWaWV3XCIsICh2YWx1ZTogYm9vbGVhbikgPT4gdGhpcy5fYXV0b0FkanVzdFRyZWVWaWV3ID0gdmFsdWUpO1xuICAgICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20ubmFnQWRqdXN0VHJlZVZpZXdcIiwgKHZhbHVlOiBib29sZWFuKSA9PiB0aGlzLl9uYWdBZGp1c3RUcmVlVmlldyA9IHZhbHVlKTtcblxuICAgICAgICBhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20uYXV0b0FkZEV4dGVybmFsUHJvamVjdHNcIiwgKHZhbHVlOiBib29sZWFuKSA9PiB0aGlzLl9hdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cyA9IHZhbHVlKTtcbiAgICAgICAgYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLm5hZ0FkZEV4dGVybmFsUHJvamVjdHNcIiwgKHZhbHVlOiBib29sZWFuKSA9PiB0aGlzLl9uYWdBZGRFeHRlcm5hbFByb2plY3RzID0gdmFsdWUpO1xuXG4gICAgICAgIC8vIFdlXCJyZSBrZWVwaW5nIHRyYWNrIG9mIHBhdGhzLCBqdXN0IHNvIHdlIGhhdmUgYSBsb2NhbCByZWZlcmVuY2VcbiAgICAgICAgdGhpcy5fcGF0aHMgPSBhdG9tLnByb2plY3QuZ2V0UGF0aHMoKTtcbiAgICAgICAgYXRvbS5wcm9qZWN0Lm9uRGlkQ2hhbmdlUGF0aHMoKHBhdGhzOiBhbnlbXSkgPT4gdGhpcy5fcGF0aHMgPSBwYXRocyk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChcbiAgICAgICAgICAgIGJ1ZmZlckZvcihcbiAgICAgICAgICAgICAgICBPbW5pLmxpc3RlbmVyLm1vZGVsLnByb2plY3RBZGRlZFxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gdGhpcy5fYXV0b0FkZEV4dGVybmFsUHJvamVjdHMgfHwgdGhpcy5fbmFnQWRkRXh0ZXJuYWxQcm9qZWN0cylcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+ICFfLnN0YXJ0c1dpdGgoei5wYXRoLCB6LnNvbHV0aW9uUGF0aCkpXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhXy5zb21lKHRoaXMuX3BhdGhzLCB4ID0+IF8uc3RhcnRzV2l0aCh6LnBhdGgsIHgpKSksXG4gICAgICAgICAgICAgICAgMTAwMFxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6Lmxlbmd0aCA+IDApXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0ID0+IHRoaXMuaGFuZGxlUHJvamVjdEFkZGVkKHByb2plY3QpKSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChcbiAgICAgICAgICAgIGJ1ZmZlckZvcihcbiAgICAgICAgICAgICAgICBPbW5pLmxpc3RlbmVyLm1vZGVsLnByb2plY3RSZW1vdmVkXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB0aGlzLl9hdXRvQWRkRXh0ZXJuYWxQcm9qZWN0cyB8fCB0aGlzLl9uYWdBZGRFeHRlcm5hbFByb2plY3RzKVxuICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gIV8uc3RhcnRzV2l0aCh6LnBhdGgsIHouc29sdXRpb25QYXRoKSlcbiAgICAgICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+IF8uc29tZSh0aGlzLl9wYXRocywgeCA9PiBfLnN0YXJ0c1dpdGgoei5wYXRoLCB4KSkpLFxuICAgICAgICAgICAgICAgIDEwMDBcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuZmlsdGVyKHogPT4gei5sZW5ndGggPiAwKVxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdCA9PiB0aGlzLmhhbmRsZVByb2plY3RSZW1vdmVkKHByb2plY3QpKSk7XG5cbiAgICAgICAgT21uaS5yZWdpc3RlckNvbmZpZ3VyYXRpb24oc29sdXRpb24gPT4ge1xuICAgICAgICAgICAgaWYgKCFzb2x1dGlvbi50ZW1wb3JhcnkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXRoID0gXy5maW5kKHRoaXMuX3BhdGhzLCB4ID0+IF8uc3RhcnRzV2l0aCh4LCBzb2x1dGlvbi5wYXRoKSAmJiB4ICE9PSBzb2x1dGlvbi5wYXRoKTtcbiAgICAgICAgICAgICAgICBpZiAocGF0aCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYXV0b0FkanVzdFRyZWVWaWV3KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkanVzdFRyZWVWaWV3KHBhdGgsIHNvbHV0aW9uLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX25hZ0FkanVzdFRyZWVWaWV3KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBub3RpZnkgZm9yIGFkanVzdG1lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBub3RpZmljYXRpb24gPSBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhcIlNob3cgc29sdXRpb24gcm9vdD9cIiwgPGFueT57XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBgJHtwYXRofVxcbi0+ICR7c29sdXRpb24ucGF0aH1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkl0IGFwcGVhcnMgdGhlIHNvbHV0aW9uIHJvb3QgaXMgbm90IGRpc3BsYXllZCBpbiB0aGUgdHJlZXZpZXcuICBXb3VsZCB5b3UgbGlrZSB0byBzaG93IHRoZSBlbnRpcmUgc29sdXRpb24gaW4gdGhlIHRyZWUgdmlldz9cIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiT2theVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBcImJ0bi1zdWNjZXNzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGp1c3RUcmVlVmlldyhwYXRoLCBzb2x1dGlvbi5wYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIkRpc21pc3NcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNtaXNzYWJsZTogdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYWRqdXN0VHJlZVZpZXcob2xkUGF0aDogc3RyaW5nLCBuZXdQYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgbmV3UGF0aHMgPSB0aGlzLl9wYXRocy5zbGljZSgpO1xuICAgICAgICBuZXdQYXRocy5zcGxpY2UoXy5maW5kSW5kZXgodGhpcy5fcGF0aHMsIG9sZFBhdGgpLCAxLCBuZXdQYXRoKTtcbiAgICAgICAgYXRvbS5wcm9qZWN0LnNldFBhdGhzKDxhbnk+bmV3UGF0aHMpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0UHJvamVjdERpcmVjdG9yaWVzKHByb2plY3RzOiBQcm9qZWN0Vmlld01vZGVsPGFueT5bXSkge1xuICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5mcm9tPHN0cmluZz4oXy51bmlxKHByb2plY3RzLm1hcCh6ID0+IHoucGF0aCkpKVxuICAgICAgICAgICAgLmZsYXRNYXAocHJvamVjdCA9PiBzdGF0KHByb2plY3QpLCAocHJvamVjdCwgc3QpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc3QuaXNEaXJlY3RvcnkoKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJvamVjdDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGlybmFtZShwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRvQXJyYXkoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGhhbmRsZVByb2plY3RBZGRlZChwcm9qZWN0czogUHJvamVjdFZpZXdNb2RlbDxhbnk+W10pIHtcbiAgICAgICAgdGhpcy5nZXRQcm9qZWN0RGlyZWN0b3JpZXMocHJvamVjdHMpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHBhdGhzID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fYXV0b0FkZEV4dGVybmFsUHJvamVjdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHBhdGhzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdG9tLnByb2plY3QuYWRkUGF0aChwcm9qZWN0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fbmFnQWRkRXh0ZXJuYWxQcm9qZWN0cykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgbm90aWZpY2F0aW9uID0gYXRvbS5ub3RpZmljYXRpb25zLmFkZEluZm8oYEFkZCBleHRlcm5hbCBwcm9qZWN0cz9gLCA8YW55PntcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDogcGF0aHMuam9pbihcIlxcblwiKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgV2UgaGF2ZSBkZXRlY3RlZCBleHRlcm5hbCBwcm9qZWN0cyB3b3VsZCB5b3UgbGlrZSB0byBhZGQgdGhlbSB0byB0aGUgdHJlZXZpZXc/YCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJ1dHRvbnM6IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiT2theVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6IFwiYnRuLXN1Y2Nlc3NcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9qZWN0IG9mIHBhdGhzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS5wcm9qZWN0LmFkZFBhdGgocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiRGlzbWlzc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkRpZENsaWNrOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc21pc3NhYmxlOiB0cnVlXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgaGFuZGxlUHJvamVjdFJlbW92ZWQocHJvamVjdHM6IFByb2plY3RWaWV3TW9kZWw8YW55PltdKSB7XG4gICAgICAgIHRoaXMuZ2V0UHJvamVjdERpcmVjdG9yaWVzKHByb2plY3RzKVxuICAgICAgICAgICAgLnN1YnNjcmliZShwYXRocyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2F1dG9BZGRFeHRlcm5hbFByb2plY3RzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvamVjdCBvZiBwYXRocykge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXRvbS5wcm9qZWN0LnJlbW92ZVBhdGgocHJvamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX25hZ0FkZEV4dGVybmFsUHJvamVjdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IG5vdGlmaWNhdGlvbiA9IGF0b20ubm90aWZpY2F0aW9ucy5hZGRJbmZvKGBSZW1vdmUgZXh0ZXJuYWwgcHJvamVjdHM/YCwgPGFueT57XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IHBhdGhzLmpvaW4oXCJcXG5cIiksXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogYFdlIGhhdmUgZGV0ZWN0ZWQgZXh0ZXJuYWwgcHJvamVjdHMgaGF2ZSBiZWVuIHJlbW92ZWQsIHdvdWxkIHlvdSBsaWtlIHRvIHJlbW92ZSB0aGVtIGZyb20gdGhlIHRyZWV2aWV3P2AsXG4gICAgICAgICAgICAgICAgICAgICAgICBidXR0b25zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIk9rYXlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiBcImJ0bi1zdWNjZXNzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgcHJvamVjdCBvZiBwYXRocykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF0b20ucHJvamVjdC5yZW1vdmVQYXRoKHByb2plY3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJEaXNtaXNzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uRGlkQ2xpY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vdGlmaWNhdGlvbi5kaXNtaXNzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzbWlzc2FibGU6IHRydWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGF0dGFjaCgpIHsgLyogKi8gfVxuXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcbiAgICBwdWJsaWMgdGl0bGUgPSBcIkF0b20gUHJvamVjdCBVcGRhdGVyXCI7XG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIHN1cHBvcnQgZm9yIGRldGVjdGluZyBleHRlcm5hbCBwcm9qZWN0cyBhbmQgaWYgYXRvbSBpcyBsb29raW5nIGF0IHRoZSB3cm9uZyBwcm9qZWN0IGZvbGRlci5cIjtcbn1cblxuZXhwb3J0IGNvbnN0IHVwZGF0ZVByb2plY3QgPSBuZXcgVXBkYXRlUHJvamVjdDtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

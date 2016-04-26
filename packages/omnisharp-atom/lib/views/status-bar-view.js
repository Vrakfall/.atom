"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.StatusBarElement = exports.ProjectCountElement = exports.DiagnosticsElement = exports.FlameElement = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _omni = require("../server/omni");

var _serverInformation = require("../atom/server-information");

var _solutionManager = require("../server/solution-manager");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var fastdom = require("fastdom");
function addClassIfNotincludes(icon) {
    for (var _len = arguments.length, cls = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        cls[_key - 1] = arguments[_key];
    }

    if (icon) {
        fastdom.measure(function () {
            _lodash2.default.each(cls, function (c) {
                if (!icon.classList.contains(c)) fastdom.mutate(function () {
                    return icon.classList.add(c);
                });
            });
        });
    }
}
function removeClassIfincludes(icon) {
    for (var _len2 = arguments.length, cls = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        cls[_key2 - 1] = arguments[_key2];
    }

    if (icon) {
        fastdom.measure(function () {
            _lodash2.default.each(cls, function (c) {
                if (icon.classList.contains(c)) fastdom.mutate(function () {
                    return icon.classList.remove(c);
                });
            });
        });
    }
}
function _updateState(self, state) {
    _lodash2.default.each(_omni.Omni.viewModelStatefulProperties, function (x) {
        if (_lodash2.default.has(state, x)) {
            self[x] = state[x];
        }
    });
}

var FlameElement = exports.FlameElement = function (_HTMLAnchorElement) {
    _inherits(FlameElement, _HTMLAnchorElement);

    function FlameElement() {
        _classCallCheck(this, FlameElement);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(FlameElement).apply(this, arguments));
    }

    _createClass(FlameElement, [{
        key: "createdCallback",
        value: function createdCallback() {
            this.classList.add("omnisharp-atom-button");
            this._state = { status: {} };
            var icon = this._icon = document.createElement("span");
            icon.classList.add("icon", "icon-flame");
            this.appendChild(icon);
            var outgoing = this._outgoing = document.createElement("span");
            outgoing.classList.add("outgoing-requests");
            this.appendChild(outgoing);
        }
    }, {
        key: "updateState",
        value: function updateState(state) {
            _updateState(this._state, state);
            var icon = this._icon;
            if (this._state.isOff) {
                removeClassIfincludes(icon, "text-subtle");
            } else {
                addClassIfNotincludes(icon, "text-subtle");
            }
            if (this._state.isReady) {
                addClassIfNotincludes(icon, "text-success");
            } else {
                removeClassIfincludes(icon, "text-success");
            }
            if (this._state.isError) {
                addClassIfNotincludes(icon, "text-error");
            } else {
                removeClassIfincludes(icon, "text-error");
            }
            if (this._state.isConnecting) {
                addClassIfNotincludes(icon, "icon-flame-loading");
                removeClassIfincludes(icon, "icon-flame-processing");
                removeClassIfincludes(icon, "icon-flame-loading");
            } else if (this._state.status.hasOutgoingRequests) {
                addClassIfNotincludes(icon, "icon-flame-processing");
                removeClassIfincludes(icon, "icon-flame-loading");
            } else {
                removeClassIfincludes(icon, "icon-flame-processing");
                removeClassIfincludes(icon, "icon-flame-loading");
            }
        }
    }, {
        key: "updateOutgoing",
        value: function updateOutgoing(status) {
            var _this2 = this;

            if (status.hasOutgoingRequests && status.outgoingRequests > 0) {
                removeClassIfincludes(this._outgoing, "fade");
            } else {
                addClassIfNotincludes(this._outgoing, "fade");
            }
            if (status.outgoingRequests !== this._state.status.outgoingRequests) {
                fastdom.mutate(function () {
                    return _this2._outgoing.innerText = status.outgoingRequests && status.outgoingRequests.toString() || "0";
                });
            }
            this._state.status = status || {};
            this.updateState(this._state);
        }
    }]);

    return FlameElement;
}(HTMLAnchorElement);

exports.FlameElement = document.registerElement("omnisharp-flame", { prototype: FlameElement.prototype });

var DiagnosticsElement = exports.DiagnosticsElement = function (_HTMLAnchorElement2) {
    _inherits(DiagnosticsElement, _HTMLAnchorElement2);

    function DiagnosticsElement() {
        _classCallCheck(this, DiagnosticsElement);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(DiagnosticsElement).apply(this, arguments));
    }

    _createClass(DiagnosticsElement, [{
        key: "createdCallback",
        value: function createdCallback() {
            var _this4 = this;

            this.classList.add("inline-block", "error-warning-summary");
            var sync = this._sync = document.createElement("a");
            sync.classList.add("icon", "icon-sync", "text-subtle");
            this.appendChild(sync);
            sync.onclick = function () {
                return _this4.syncClick();
            };
            var s = document.createElement("span");
            this.appendChild(s);
            s.onclick = function () {
                return _this4.diagnosticClick();
            };
            var errorsIcon = document.createElement("span");
            errorsIcon.classList.add("icon", "icon-issue-opened");
            s.appendChild(errorsIcon);
            var errors = this._errors = document.createElement("span");
            errors.classList.add("error-summary");
            s.appendChild(errors);
            var warningsIcon = document.createElement("span");
            warningsIcon.classList.add("icon", "icon-alert");
            s.appendChild(warningsIcon);
            var warnings = this._warnings = document.createElement("span");
            warnings.classList.add("warning-summary");
            s.appendChild(warnings);
        }
    }, {
        key: "updateState",
        value: function updateState(state) {
            var _this5 = this;

            if (!_lodash2.default.isEqual(this._state, state)) {
                this._state = state;
                fastdom.mutate(function () {
                    if (_this5._state.errorCount) {
                        _this5._errors.innerText = _this5._state.errorCount.toString();
                    } else {
                        _this5._errors.innerText = "0";
                    }
                    if (_this5._state.warningCount) {
                        _this5._warnings.innerText = _this5._state.warningCount.toString();
                    } else {
                        _this5._warnings.innerText = "0";
                    }
                });
            }
        }
    }]);

    return DiagnosticsElement;
}(HTMLAnchorElement);

exports.DiagnosticsElement = document.registerElement("omnisharp-diagnostics", { prototype: DiagnosticsElement.prototype });

var ProjectCountElement = exports.ProjectCountElement = function (_HTMLAnchorElement3) {
    _inherits(ProjectCountElement, _HTMLAnchorElement3);

    function ProjectCountElement() {
        _classCallCheck(this, ProjectCountElement);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(ProjectCountElement).apply(this, arguments));
    }

    _createClass(ProjectCountElement, [{
        key: "createdCallback",
        value: function createdCallback() {
            this.classList.add("inline-block", "project-summary", "projects-icon");
            var icon = document.createElement("span");
            icon.classList.add("icon", "icon-pulse");
            this.appendChild(icon);
            var sub = this._solutionNunmber = document.createElement("sub");
            icon.appendChild(sub);
            var projects = this.projects = document.createElement("span");
            projects.classList.add("projects");
            projects.innerText = "0 Projects";
            this.appendChild(projects);
        }
    }, {
        key: "updateState",
        value: function updateState(state) {
            var _this7 = this;

            if (!_lodash2.default.isEqual(this._state, state)) {
                this._state = state;
                fastdom.mutate(function () {
                    return _this7.projects.innerText = _this7._state.projectCount + " Projects";
                });
            }
        }
    }, {
        key: "updateSolutionNumber",
        value: function updateSolutionNumber(solutionNumber) {
            var _this8 = this;

            fastdom.mutate(function () {
                return _this8._solutionNunmber.innerText = solutionNumber;
            });
        }
    }]);

    return ProjectCountElement;
}(HTMLAnchorElement);

exports.ProjectCountElement = document.registerElement("omnisharp-project-count", { prototype: ProjectCountElement.prototype });

var StatusBarElement = exports.StatusBarElement = function (_HTMLElement) {
    _inherits(StatusBarElement, _HTMLElement);

    function StatusBarElement() {
        var _Object$getPrototypeO;

        _classCallCheck(this, StatusBarElement);

        for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
            args[_key3] = arguments[_key3];
        }

        var _this9 = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(StatusBarElement)).call.apply(_Object$getPrototypeO, [this].concat(args)));

        _this9._hasValidEditor = false;
        return _this9;
    }

    _createClass(StatusBarElement, [{
        key: "createdCallback",
        value: function createdCallback() {
            var _this10 = this;

            this.classList.add("inline-block");
            var flameElement = this._flame = new exports.FlameElement();
            this.appendChild(flameElement);
            flameElement.onclick = function () {
                return _this10.toggle();
            };
            var projectCount = this._projectCount = new exports.ProjectCountElement();
            this.appendChild(projectCount);
            projectCount.onclick = function () {
                return _this10.toggleSolutionInformation();
            };
            projectCount.projects.style.display = "none";
            var diagnostics = this._diagnostics = new exports.DiagnosticsElement();
            this.appendChild(diagnostics);
            diagnostics.diagnosticClick = function () {
                return _this10.toggleErrorWarningPanel();
            };
            diagnostics.syncClick = function () {
                return _this10.doCodeCheck();
            };
            diagnostics.style.display = "none";
            this._disposable = new _omnisharpClient.CompositeDisposable();
            this._state = { status: {} };
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            var _this11 = this;

            this._disposable.add(_omni.Omni.diagnostics.subscribe(function (diagnostics) {
                var counts = _lodash2.default.countBy(diagnostics, function (quickFix) {
                    return quickFix.LogLevel;
                });
                _this11._diagnostics.updateState({
                    errorCount: counts["Error"] || 0,
                    warningCount: counts["Warning"] || 0
                });
            }));
            this._disposable.add(_rxjs.Observable.merge(_omni.Omni.activeModel, _omni.Omni.activeModel.flatMap(function (x) {
                return x.observe.state;
            })).subscribe(function (model) {
                _this11._flame.updateState(model);
                _updateState(_this11._state, model);
                _this11._updateVisible();
            }));
            this._disposable.add(_serverInformation.server.observe.projects.debounceTime(500).subscribe(function (projects) {
                return _this11._projectCount.updateState({ projectCount: projects.length });
            }));
            this._disposable.add(_serverInformation.server.observe.status.subscribe(function (status) {
                return _this11._flame.updateOutgoing(status || {});
            }));
            this._disposable.add(_serverInformation.server.observe.model.subscribe(function (model) {
                var solutionNumber = _solutionManager.SolutionManager.activeSolutions.length > 1 ? _lodash2.default.trim(_serverInformation.server.model && _serverInformation.server.model.index, "client") : "";
                _this11._projectCount.updateSolutionNumber(solutionNumber);
            }));
            this._disposable.add(_omni.Omni.activeEditorOrConfigEditor.subscribe(function (editor) {
                _this11._updateVisible(!!editor);
            }));
            this._disposable.add(_solutionManager.SolutionManager.activeSolution.subscribe(function (solutions) {
                var solutionNumber = _solutionManager.SolutionManager.activeSolutions.length > 1 ? _lodash2.default.trim(_serverInformation.server.model && _serverInformation.server.model.index, "client") : "";
                _this11._projectCount.updateSolutionNumber(solutionNumber);
            }));
        }
    }, {
        key: "_updateVisible",
        value: function _updateVisible(hasValidEditor) {
            if (typeof hasValidEditor !== "undefined") {
                this._hasValidEditor = hasValidEditor;
            }
            if (this._state.isOn && this._hasValidEditor) {
                this._showOnStateItems();
            } else {
                this._hideOnStateItems();
            }
        }
    }, {
        key: "_showOnStateItems",
        value: function _showOnStateItems() {
            var _this12 = this;

            fastdom.measure(function () {
                if (_this12._diagnostics.style.display === "none") {
                    fastdom.mutate(function () {
                        return _this12._diagnostics.style.display = "";
                    });
                }
                if (_this12._projectCount.projects.style.display === "none") {
                    fastdom.mutate(function () {
                        return _this12._projectCount.projects.style.display = "";
                    });
                }
            });
        }
    }, {
        key: "_hideOnStateItems",
        value: function _hideOnStateItems() {
            var _this13 = this;

            fastdom.measure(function () {
                if (_this13._diagnostics.style.display !== "none") {
                    fastdom.mutate(function () {
                        return _this13._diagnostics.style.display = "none";
                    });
                }
                if (_this13._projectCount.projects.style.display !== "none") {
                    fastdom.mutate(function () {
                        return _this13._projectCount.projects.style.display = "none";
                    });
                }
            });
        }
    }, {
        key: "detachedCallback",
        value: function detachedCallback() {
            this._disposable.dispose();
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this._disposable.dispose();
        }
    }, {
        key: "toggle",
        value: function toggle() {
            atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:toggle-dock");
        }
    }, {
        key: "toggleErrorWarningPanel",
        value: function toggleErrorWarningPanel() {
            atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:dock-toggle-errors");
        }
    }, {
        key: "toggleSolutionInformation",
        value: function toggleSolutionInformation() {
            atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:solution-status");
        }
    }, {
        key: "doCodeCheck",
        value: function doCodeCheck() {
            atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:code-check");
        }
    }]);

    return StatusBarElement;
}(HTMLElement);

exports.StatusBarElement = document.registerElement("omnisharp-status-bar", { prototype: StatusBarElement.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9zdGF0dXMtYmFyLXZpZXcuanMiLCJsaWIvdmlld3Mvc3RhdHVzLWJhci12aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7QUNHQSxJQUFJLFVBQTBCLFFBQVEsU0FBUixDQUE5QjtBQUVBLFNBQUEscUJBQUEsQ0FBK0IsSUFBL0IsRUFBa0U7QUFBQSxzQ0FBYixHQUFhO0FBQWIsV0FBYTtBQUFBOztBQUM5RCxRQUFJLElBQUosRUFBVTtBQUNOLGdCQUFRLE9BQVIsQ0FBZ0IsWUFBQTtBQUNaLDZCQUFFLElBQUYsQ0FBTyxHQUFQLEVBQVksYUFBQztBQUNULG9CQUFJLENBQUMsS0FBSyxTQUFMLENBQWUsUUFBZixDQUF3QixDQUF4QixDQUFMLEVBQ0ksUUFBUSxNQUFSLENBQWU7QUFBQSwyQkFBTSxLQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLENBQW5CLENBQU47QUFBQSxpQkFBZjtBQUNQLGFBSEQ7QUFJSCxTQUxEO0FBTUg7QUFDSjtBQUNELFNBQUEscUJBQUEsQ0FBK0IsSUFBL0IsRUFBa0U7QUFBQSx1Q0FBYixHQUFhO0FBQWIsV0FBYTtBQUFBOztBQUM5RCxRQUFJLElBQUosRUFBVTtBQUNOLGdCQUFRLE9BQVIsQ0FBZ0IsWUFBQTtBQUNaLDZCQUFFLElBQUYsQ0FBTyxHQUFQLEVBQVksYUFBQztBQUNULG9CQUFJLEtBQUssU0FBTCxDQUFlLFFBQWYsQ0FBd0IsQ0FBeEIsQ0FBSixFQUNJLFFBQVEsTUFBUixDQUFlO0FBQUEsMkJBQU0sS0FBSyxTQUFMLENBQWUsTUFBZixDQUFzQixDQUF0QixDQUFOO0FBQUEsaUJBQWY7QUFDUCxhQUhEO0FBSUgsU0FMRDtBQU1IO0FBQ0o7QUFXRCxTQUFBLFlBQUEsQ0FBcUIsSUFBckIsRUFBZ0MsS0FBaEMsRUFBMEM7QUFDdEMscUJBQUUsSUFBRixDQUFPLFdBQUssMkJBQVosRUFBeUMs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QUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLEtBQUssU0FBeEIsQ0FBdkIsRUFBMkQsMkJBQTNEO0FBQ0g7Ozs7RUF4SGlDLFc7O0FBMkhoQyxRQUFTLGdCQUFULEdBQWtDLFNBQVUsZUFBVixDQUEwQixzQkFBMUIsRUFBa0QsRUFBRSxXQUFXLGlCQUFpQixTQUE5QixFQUFsRCxDQUFsQyIsImZpbGUiOiJsaWIvdmlld3Mvc3RhdHVzLWJhci12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT2JzZXJ2YWJsZSB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IHNlcnZlciB9IGZyb20gXCIuLi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvblwiO1xuaW1wb3J0IHsgU29sdXRpb25NYW5hZ2VyIH0gZnJvbSBcIi4uL3NlcnZlci9zb2x1dGlvbi1tYW5hZ2VyXCI7XG5sZXQgZmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xuZnVuY3Rpb24gYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sIC4uLmNscykge1xuICAgIGlmIChpY29uKSB7XG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XG4gICAgICAgICAgICBfLmVhY2goY2xzLCBjID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWljb24uY2xhc3NMaXN0LmNvbnRhaW5zKGMpKVxuICAgICAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiBpY29uLmNsYXNzTGlzdC5hZGQoYykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCAuLi5jbHMpIHtcbiAgICBpZiAoaWNvbikge1xuICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKGNscywgYyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGljb24uY2xhc3NMaXN0LmNvbnRhaW5zKGMpKVxuICAgICAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiBpY29uLmNsYXNzTGlzdC5yZW1vdmUoYykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHVwZGF0ZVN0YXRlKHNlbGYsIHN0YXRlKSB7XG4gICAgXy5lYWNoKE9tbmkudmlld01vZGVsU3RhdGVmdWxQcm9wZXJ0aWVzLCB4ID0+IHtcbiAgICAgICAgaWYgKF8uaGFzKHN0YXRlLCB4KSkge1xuICAgICAgICAgICAgc2VsZlt4XSA9IHN0YXRlW3hdO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5leHBvcnQgY2xhc3MgRmxhbWVFbGVtZW50IGV4dGVuZHMgSFRNTEFuY2hvckVsZW1lbnQge1xuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwib21uaXNoYXJwLWF0b20tYnV0dG9uXCIpO1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IHsgc3RhdHVzOiB7fSB9O1xuICAgICAgICBjb25zdCBpY29uID0gdGhpcy5faWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBpY29uLmNsYXNzTGlzdC5hZGQoXCJpY29uXCIsIFwiaWNvbi1mbGFtZVwiKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChpY29uKTtcbiAgICAgICAgY29uc3Qgb3V0Z29pbmcgPSB0aGlzLl9vdXRnb2luZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBvdXRnb2luZy5jbGFzc0xpc3QuYWRkKFwib3V0Z29pbmctcmVxdWVzdHNcIik7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQob3V0Z29pbmcpO1xuICAgIH1cbiAgICB1cGRhdGVTdGF0ZShzdGF0ZSkge1xuICAgICAgICB1cGRhdGVTdGF0ZSh0aGlzLl9zdGF0ZSwgc3RhdGUpO1xuICAgICAgICBjb25zdCBpY29uID0gdGhpcy5faWNvbjtcbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmlzT2ZmKSB7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LXN1YnRsZVwiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uLCBcInRleHQtc3VidGxlXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZS5pc1JlYWR5KSB7XG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LXN1Y2Nlc3NcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LXN1Y2Nlc3NcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmlzRXJyb3IpIHtcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uLCBcInRleHQtZXJyb3JcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LWVycm9yXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZS5pc0Nvbm5lY3RpbmcpIHtcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uLCBcImljb24tZmxhbWUtbG9hZGluZ1wiKTtcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCBcImljb24tZmxhbWUtcHJvY2Vzc2luZ1wiKTtcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCBcImljb24tZmxhbWUtbG9hZGluZ1wiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLl9zdGF0ZS5zdGF0dXMuaGFzT3V0Z29pbmdSZXF1ZXN0cykge1xuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1wcm9jZXNzaW5nXCIpO1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1sb2FkaW5nXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1wcm9jZXNzaW5nXCIpO1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1sb2FkaW5nXCIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHVwZGF0ZU91dGdvaW5nKHN0YXR1cykge1xuICAgICAgICBpZiAoc3RhdHVzLmhhc091dGdvaW5nUmVxdWVzdHMgJiYgc3RhdHVzLm91dGdvaW5nUmVxdWVzdHMgPiAwKSB7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXModGhpcy5fb3V0Z29pbmcsIFwiZmFkZVwiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyh0aGlzLl9vdXRnb2luZywgXCJmYWRlXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdGF0dXMub3V0Z29pbmdSZXF1ZXN0cyAhPT0gdGhpcy5fc3RhdGUuc3RhdHVzLm91dGdvaW5nUmVxdWVzdHMpIHtcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX291dGdvaW5nLmlubmVyVGV4dCA9IHN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzICYmIHN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzLnRvU3RyaW5nKCkgfHwgXCIwXCIpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3N0YXRlLnN0YXR1cyA9IHN0YXR1cyB8fCB7fTtcbiAgICAgICAgdGhpcy51cGRhdGVTdGF0ZSh0aGlzLl9zdGF0ZSk7XG4gICAgfVxufVxuZXhwb3J0cy5GbGFtZUVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtZmxhbWVcIiwgeyBwcm90b3R5cGU6IEZsYW1lRWxlbWVudC5wcm90b3R5cGUgfSk7XG5leHBvcnQgY2xhc3MgRGlhZ25vc3RpY3NFbGVtZW50IGV4dGVuZHMgSFRNTEFuY2hvckVsZW1lbnQge1xuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIsIFwiZXJyb3Itd2FybmluZy1zdW1tYXJ5XCIpO1xuICAgICAgICBjb25zdCBzeW5jID0gdGhpcy5fc3luYyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgICAgICBzeW5jLmNsYXNzTGlzdC5hZGQoXCJpY29uXCIsIFwiaWNvbi1zeW5jXCIsIFwidGV4dC1zdWJ0bGVcIik7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoc3luYyk7XG4gICAgICAgIHN5bmMub25jbGljayA9ICgpID0+IHRoaXMuc3luY0NsaWNrKCk7XG4gICAgICAgIGNvbnN0IHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChzKTtcbiAgICAgICAgcy5vbmNsaWNrID0gKCkgPT4gdGhpcy5kaWFnbm9zdGljQ2xpY2soKTtcbiAgICAgICAgY29uc3QgZXJyb3JzSWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBlcnJvcnNJY29uLmNsYXNzTGlzdC5hZGQoXCJpY29uXCIsIFwiaWNvbi1pc3N1ZS1vcGVuZWRcIik7XG4gICAgICAgIHMuYXBwZW5kQ2hpbGQoZXJyb3JzSWNvbik7XG4gICAgICAgIGNvbnN0IGVycm9ycyA9IHRoaXMuX2Vycm9ycyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBlcnJvcnMuY2xhc3NMaXN0LmFkZChcImVycm9yLXN1bW1hcnlcIik7XG4gICAgICAgIHMuYXBwZW5kQ2hpbGQoZXJyb3JzKTtcbiAgICAgICAgY29uc3Qgd2FybmluZ3NJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHdhcm5pbmdzSWNvbi5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24tYWxlcnRcIik7XG4gICAgICAgIHMuYXBwZW5kQ2hpbGQod2FybmluZ3NJY29uKTtcbiAgICAgICAgY29uc3Qgd2FybmluZ3MgPSB0aGlzLl93YXJuaW5ncyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB3YXJuaW5ncy5jbGFzc0xpc3QuYWRkKFwid2FybmluZy1zdW1tYXJ5XCIpO1xuICAgICAgICBzLmFwcGVuZENoaWxkKHdhcm5pbmdzKTtcbiAgICB9XG4gICAgdXBkYXRlU3RhdGUoc3RhdGUpIHtcbiAgICAgICAgaWYgKCFfLmlzRXF1YWwodGhpcy5fc3RhdGUsIHN0YXRlKSkge1xuICAgICAgICAgICAgdGhpcy5fc3RhdGUgPSBzdGF0ZTtcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3RhdGUuZXJyb3JDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9lcnJvcnMuaW5uZXJUZXh0ID0gdGhpcy5fc3RhdGUuZXJyb3JDb3VudC50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXJyb3JzLmlubmVyVGV4dCA9IFwiMFwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fc3RhdGUud2FybmluZ0NvdW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3dhcm5pbmdzLmlubmVyVGV4dCA9IHRoaXMuX3N0YXRlLndhcm5pbmdDb3VudC50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fd2FybmluZ3MuaW5uZXJUZXh0ID0gXCIwXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLkRpYWdub3N0aWNzRWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1kaWFnbm9zdGljc1wiLCB7IHByb3RvdHlwZTogRGlhZ25vc3RpY3NFbGVtZW50LnByb3RvdHlwZSB9KTtcbmV4cG9ydCBjbGFzcyBQcm9qZWN0Q291bnRFbGVtZW50IGV4dGVuZHMgSFRNTEFuY2hvckVsZW1lbnQge1xuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIsIFwicHJvamVjdC1zdW1tYXJ5XCIsIFwicHJvamVjdHMtaWNvblwiKTtcbiAgICAgICAgY29uc3QgaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBpY29uLmNsYXNzTGlzdC5hZGQoXCJpY29uXCIsIFwiaWNvbi1wdWxzZVwiKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChpY29uKTtcbiAgICAgICAgY29uc3Qgc3ViID0gdGhpcy5fc29sdXRpb25OdW5tYmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN1YlwiKTtcbiAgICAgICAgaWNvbi5hcHBlbmRDaGlsZChzdWIpO1xuICAgICAgICBjb25zdCBwcm9qZWN0cyA9IHRoaXMucHJvamVjdHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgcHJvamVjdHMuY2xhc3NMaXN0LmFkZChcInByb2plY3RzXCIpO1xuICAgICAgICBwcm9qZWN0cy5pbm5lclRleHQgPSBcIjAgUHJvamVjdHNcIjtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChwcm9qZWN0cyk7XG4gICAgfVxuICAgIHVwZGF0ZVN0YXRlKHN0YXRlKSB7XG4gICAgICAgIGlmICghXy5pc0VxdWFsKHRoaXMuX3N0YXRlLCBzdGF0ZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGU7XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLnByb2plY3RzLmlubmVyVGV4dCA9IGAke3RoaXMuX3N0YXRlLnByb2plY3RDb3VudH0gUHJvamVjdHNgKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB1cGRhdGVTb2x1dGlvbk51bWJlcihzb2x1dGlvbk51bWJlcikge1xuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9zb2x1dGlvbk51bm1iZXIuaW5uZXJUZXh0ID0gc29sdXRpb25OdW1iZXIpO1xuICAgIH1cbn1cbmV4cG9ydHMuUHJvamVjdENvdW50RWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1wcm9qZWN0LWNvdW50XCIsIHsgcHJvdG90eXBlOiBQcm9qZWN0Q291bnRFbGVtZW50LnByb3RvdHlwZSB9KTtcbmV4cG9ydCBjbGFzcyBTdGF0dXNCYXJFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJncyk7XG4gICAgICAgIHRoaXMuX2hhc1ZhbGlkRWRpdG9yID0gZmFsc2U7XG4gICAgfVxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIpO1xuICAgICAgICBjb25zdCBmbGFtZUVsZW1lbnQgPSB0aGlzLl9mbGFtZSA9IG5ldyBleHBvcnRzLkZsYW1lRWxlbWVudCgpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGZsYW1lRWxlbWVudCk7XG4gICAgICAgIGZsYW1lRWxlbWVudC5vbmNsaWNrID0gKCkgPT4gdGhpcy50b2dnbGUoKTtcbiAgICAgICAgY29uc3QgcHJvamVjdENvdW50ID0gdGhpcy5fcHJvamVjdENvdW50ID0gbmV3IGV4cG9ydHMuUHJvamVjdENvdW50RWxlbWVudCgpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHByb2plY3RDb3VudCk7XG4gICAgICAgIHByb2plY3RDb3VudC5vbmNsaWNrID0gKCkgPT4gdGhpcy50b2dnbGVTb2x1dGlvbkluZm9ybWF0aW9uKCk7XG4gICAgICAgIHByb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGNvbnN0IGRpYWdub3N0aWNzID0gdGhpcy5fZGlhZ25vc3RpY3MgPSBuZXcgZXhwb3J0cy5EaWFnbm9zdGljc0VsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChkaWFnbm9zdGljcyk7XG4gICAgICAgIGRpYWdub3N0aWNzLmRpYWdub3N0aWNDbGljayA9ICgpID0+IHRoaXMudG9nZ2xlRXJyb3JXYXJuaW5nUGFuZWwoKTtcbiAgICAgICAgZGlhZ25vc3RpY3Muc3luY0NsaWNrID0gKCkgPT4gdGhpcy5kb0NvZGVDaGVjaygpO1xuICAgICAgICBkaWFnbm9zdGljcy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLl9zdGF0ZSA9IHsgc3RhdHVzOiB7fSB9O1xuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChPbW5pLmRpYWdub3N0aWNzLnN1YnNjcmliZShkaWFnbm9zdGljcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBjb3VudHMgPSBfLmNvdW50QnkoZGlhZ25vc3RpY3MsIHF1aWNrRml4ID0+IHF1aWNrRml4LkxvZ0xldmVsKTtcbiAgICAgICAgICAgIHRoaXMuX2RpYWdub3N0aWNzLnVwZGF0ZVN0YXRlKHtcbiAgICAgICAgICAgICAgICBlcnJvckNvdW50OiBjb3VudHNbXCJFcnJvclwiXSB8fCAwLFxuICAgICAgICAgICAgICAgIHdhcm5pbmdDb3VudDogY291bnRzW1wiV2FybmluZ1wiXSB8fCAwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChPYnNlcnZhYmxlLm1lcmdlKE9tbmkuYWN0aXZlTW9kZWwsIE9tbmkuYWN0aXZlTW9kZWwuZmxhdE1hcCh4ID0+IHgub2JzZXJ2ZS5zdGF0ZSkpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKG1vZGVsID0+IHtcbiAgICAgICAgICAgIHRoaXMuX2ZsYW1lLnVwZGF0ZVN0YXRlKG1vZGVsKTtcbiAgICAgICAgICAgIHVwZGF0ZVN0YXRlKHRoaXMuX3N0YXRlLCBtb2RlbCk7XG4gICAgICAgICAgICB0aGlzLl91cGRhdGVWaXNpYmxlKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUucHJvamVjdHNcbiAgICAgICAgICAgIC5kZWJvdW5jZVRpbWUoNTAwKVxuICAgICAgICAgICAgLnN1YnNjcmliZShwcm9qZWN0cyA9PiB0aGlzLl9wcm9qZWN0Q291bnQudXBkYXRlU3RhdGUoeyBwcm9qZWN0Q291bnQ6IHByb2plY3RzLmxlbmd0aCB9KSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5zdGF0dXNcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoc3RhdHVzID0+IHRoaXMuX2ZsYW1lLnVwZGF0ZU91dGdvaW5nKHN0YXR1cyB8fCB7fSkpKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUubW9kZWxcbiAgICAgICAgICAgIC5zdWJzY3JpYmUobW9kZWwgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc29sdXRpb25OdW1iZXIgPSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCA+IDEgPyBfLnRyaW0oc2VydmVyLm1vZGVsICYmIHNlcnZlci5tb2RlbC5pbmRleCwgXCJjbGllbnRcIikgOiBcIlwiO1xuICAgICAgICAgICAgdGhpcy5fcHJvamVjdENvdW50LnVwZGF0ZVNvbHV0aW9uTnVtYmVyKHNvbHV0aW9uTnVtYmVyKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZUVkaXRvck9yQ29uZmlnRWRpdG9yLnN1YnNjcmliZShlZGl0b3IgPT4ge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlVmlzaWJsZSghIWVkaXRvcik7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHNvbHV0aW9ucyA9PiB7XG4gICAgICAgICAgICBjb25zdCBzb2x1dGlvbk51bWJlciA9IFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMubGVuZ3RoID4gMSA/IF8udHJpbShzZXJ2ZXIubW9kZWwgJiYgc2VydmVyLm1vZGVsLmluZGV4LCBcImNsaWVudFwiKSA6IFwiXCI7XG4gICAgICAgICAgICB0aGlzLl9wcm9qZWN0Q291bnQudXBkYXRlU29sdXRpb25OdW1iZXIoc29sdXRpb25OdW1iZXIpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIF91cGRhdGVWaXNpYmxlKGhhc1ZhbGlkRWRpdG9yKSB7XG4gICAgICAgIGlmICh0eXBlb2YgaGFzVmFsaWRFZGl0b3IgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX2hhc1ZhbGlkRWRpdG9yID0gaGFzVmFsaWRFZGl0b3I7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmlzT24gJiYgdGhpcy5faGFzVmFsaWRFZGl0b3IpIHtcbiAgICAgICAgICAgIHRoaXMuX3Nob3dPblN0YXRlSXRlbXMoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2hpZGVPblN0YXRlSXRlbXMoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBfc2hvd09uU3RhdGVJdGVtcygpIHtcbiAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9kaWFnbm9zdGljcy5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2RpYWdub3N0aWNzLnN0eWxlLmRpc3BsYXkgPSBcIlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLl9wcm9qZWN0Q291bnQucHJvamVjdHMuc3R5bGUuZGlzcGxheSA9PT0gXCJub25lXCIpIHtcbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9wcm9qZWN0Q291bnQucHJvamVjdHMuc3R5bGUuZGlzcGxheSA9IFwiXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgX2hpZGVPblN0YXRlSXRlbXMoKSB7XG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5fZGlhZ25vc3RpY3Muc3R5bGUuZGlzcGxheSAhPT0gXCJub25lXCIpIHtcbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9kaWFnbm9zdGljcy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ICE9PSBcIm5vbmVcIikge1xuICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICB0b2dnbGUoKSB7XG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTp0b2dnbGUtZG9ja1wiKTtcbiAgICB9XG4gICAgdG9nZ2xlRXJyb3JXYXJuaW5nUGFuZWwoKSB7XG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpkb2NrLXRvZ2dsZS1lcnJvcnNcIik7XG4gICAgfVxuICAgIHRvZ2dsZVNvbHV0aW9uSW5mb3JtYXRpb24oKSB7XG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpzb2x1dGlvbi1zdGF0dXNcIik7XG4gICAgfVxuICAgIGRvQ29kZUNoZWNrKCkge1xuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206Y29kZS1jaGVja1wiKTtcbiAgICB9XG59XG5leHBvcnRzLlN0YXR1c0JhckVsZW1lbnQgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtc3RhdHVzLWJhclwiLCB7IHByb3RvdHlwZTogU3RhdHVzQmFyRWxlbWVudC5wcm90b3R5cGUgfSk7XG4iLCIvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQge09tbmlzaGFycENsaWVudFN0YXR1c30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7c2VydmVyfSBmcm9tIFwiLi4vYXRvbS9zZXJ2ZXItaW5mb3JtYXRpb25cIjtcbmltcG9ydCB7U29sdXRpb25NYW5hZ2VyfSBmcm9tIFwiLi4vc2VydmVyL3NvbHV0aW9uLW1hbmFnZXJcIjtcbmxldCBmYXN0ZG9tOiB0eXBlb2YgRmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xuXG5mdW5jdGlvbiBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbjogSFRNTEVsZW1lbnQsIC4uLmNsczogc3RyaW5nW10pIHtcbiAgICBpZiAoaWNvbikge1xuICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKGNscywgYyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCFpY29uLmNsYXNzTGlzdC5jb250YWlucyhjKSlcbiAgICAgICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gaWNvbi5jbGFzc0xpc3QuYWRkKGMpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5mdW5jdGlvbiByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbjogSFRNTEVsZW1lbnQsIC4uLmNsczogc3RyaW5nW10pIHtcbiAgICBpZiAoaWNvbikge1xuICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKGNscywgYyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGljb24uY2xhc3NMaXN0LmNvbnRhaW5zKGMpKVxuICAgICAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiBpY29uLmNsYXNzTGlzdC5yZW1vdmUoYykpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuaW50ZXJmYWNlIFN0YXR1c0JhclN0YXRlIHtcbiAgICBpc09mZj86IGJvb2xlYW47XG4gICAgaXNDb25uZWN0aW5nPzogYm9vbGVhbjtcbiAgICBpc09uPzogYm9vbGVhbjtcbiAgICBpc1JlYWR5PzogYm9vbGVhbjtcbiAgICBpc0Vycm9yPzogYm9vbGVhbjtcbiAgICBzdGF0dXM/OiBPbW5pc2hhcnBDbGllbnRTdGF0dXM7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVN0YXRlKHNlbGY6IGFueSwgc3RhdGU6IGFueSkge1xuICAgIF8uZWFjaChPbW5pLnZpZXdNb2RlbFN0YXRlZnVsUHJvcGVydGllcywgeCA9PiB7XG4gICAgICAgIGlmIChfLmhhcyhzdGF0ZSwgeCkpIHtcbiAgICAgICAgICAgIHNlbGZbeF0gPSBzdGF0ZVt4XTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5leHBvcnQgY2xhc3MgRmxhbWVFbGVtZW50IGV4dGVuZHMgSFRNTEFuY2hvckVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xuICAgIHByaXZhdGUgX3N0YXRlOiB7XG4gICAgICAgIGlzT2ZmPzogYm9vbGVhbjtcbiAgICAgICAgaXNDb25uZWN0aW5nPzogYm9vbGVhbjtcbiAgICAgICAgaXNPbj86IGJvb2xlYW47XG4gICAgICAgIGlzUmVhZHk/OiBib29sZWFuO1xuICAgICAgICBpc0Vycm9yPzogYm9vbGVhbjtcbiAgICAgICAgc3RhdHVzPzogT21uaXNoYXJwQ2xpZW50U3RhdHVzO1xuICAgIH07XG5cbiAgICBwcml2YXRlIF9pY29uOiBIVE1MU3BhbkVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBfb3V0Z29pbmc6IEhUTUxTcGFuRWxlbWVudDtcblxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1hdG9tLWJ1dHRvblwiKTtcbiAgICAgICAgdGhpcy5fc3RhdGUgPSB7IHN0YXR1czogPGFueT57fSB9O1xuXG4gICAgICAgIGNvbnN0IGljb24gPSB0aGlzLl9pY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIGljb24uY2xhc3NMaXN0LmFkZChcImljb25cIiwgXCJpY29uLWZsYW1lXCIpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGljb24pO1xuXG4gICAgICAgIGNvbnN0IG91dGdvaW5nID0gdGhpcy5fb3V0Z29pbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgb3V0Z29pbmcuY2xhc3NMaXN0LmFkZChcIm91dGdvaW5nLXJlcXVlc3RzXCIpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKG91dGdvaW5nKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlU3RhdGUoc3RhdGU6IHR5cGVvZiBGbGFtZUVsZW1lbnQucHJvdG90eXBlLl9zdGF0ZSkge1xuICAgICAgICB1cGRhdGVTdGF0ZSh0aGlzLl9zdGF0ZSwgc3RhdGUpO1xuICAgICAgICBjb25zdCBpY29uID0gdGhpcy5faWNvbjtcblxuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNPZmYpIHtcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyhpY29uLCBcInRleHQtc3VidGxlXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sIFwidGV4dC1zdWJ0bGVcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fc3RhdGUuaXNSZWFkeSkge1xuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sIFwidGV4dC1zdWNjZXNzXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwidGV4dC1zdWNjZXNzXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmlzRXJyb3IpIHtcbiAgICAgICAgICAgIGFkZENsYXNzSWZOb3RpbmNsdWRlcyhpY29uLCBcInRleHQtZXJyb3JcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJ0ZXh0LWVycm9yXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmlzQ29ubmVjdGluZykge1xuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1sb2FkaW5nXCIpO1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1wcm9jZXNzaW5nXCIpO1xuICAgICAgICAgICAgcmVtb3ZlQ2xhc3NJZmluY2x1ZGVzKGljb24sIFwiaWNvbi1mbGFtZS1sb2FkaW5nXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX3N0YXRlLnN0YXR1cy5oYXNPdXRnb2luZ1JlcXVlc3RzKSB7XG4gICAgICAgICAgICBhZGRDbGFzc0lmTm90aW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLXByb2Nlc3NpbmdcIik7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLWxvYWRpbmdcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLXByb2Nlc3NpbmdcIik7XG4gICAgICAgICAgICByZW1vdmVDbGFzc0lmaW5jbHVkZXMoaWNvbiwgXCJpY29uLWZsYW1lLWxvYWRpbmdcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlT3V0Z29pbmcoc3RhdHVzOiB0eXBlb2YgRmxhbWVFbGVtZW50LnByb3RvdHlwZS5fc3RhdGUuc3RhdHVzKSB7XG4gICAgICAgIGlmIChzdGF0dXMuaGFzT3V0Z29pbmdSZXF1ZXN0cyAmJiBzdGF0dXMub3V0Z29pbmdSZXF1ZXN0cyA+IDApIHtcbiAgICAgICAgICAgIHJlbW92ZUNsYXNzSWZpbmNsdWRlcyh0aGlzLl9vdXRnb2luZywgXCJmYWRlXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWRkQ2xhc3NJZk5vdGluY2x1ZGVzKHRoaXMuX291dGdvaW5nLCBcImZhZGVcIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3RhdHVzLm91dGdvaW5nUmVxdWVzdHMgIT09IHRoaXMuX3N0YXRlLnN0YXR1cy5vdXRnb2luZ1JlcXVlc3RzKSB7XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9vdXRnb2luZy5pbm5lclRleHQgPSBzdGF0dXMub3V0Z29pbmdSZXF1ZXN0cyAmJiBzdGF0dXMub3V0Z29pbmdSZXF1ZXN0cy50b1N0cmluZygpIHx8IFwiMFwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3N0YXRlLnN0YXR1cyA9IHN0YXR1cyB8fCA8YW55Pnt9O1xuICAgICAgICB0aGlzLnVwZGF0ZVN0YXRlKHRoaXMuX3N0YXRlKTtcbiAgICB9XG59XG5cbig8YW55PmV4cG9ydHMpLkZsYW1lRWxlbWVudCA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtZmxhbWVcIiwgeyBwcm90b3R5cGU6IEZsYW1lRWxlbWVudC5wcm90b3R5cGUgfSk7XG5cbmV4cG9ydCBjbGFzcyBEaWFnbm9zdGljc0VsZW1lbnQgZXh0ZW5kcyBIVE1MQW5jaG9yRWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XG4gICAgcHJpdmF0ZSBfc3RhdGU6IHtcbiAgICAgICAgZXJyb3JDb3VudDogbnVtYmVyO1xuICAgICAgICB3YXJuaW5nQ291bnQ6IG51bWJlcjtcbiAgICB9O1xuICAgIHByaXZhdGUgX2Vycm9yczogSFRNTFNwYW5FbGVtZW50O1xuICAgIHByaXZhdGUgX3dhcm5pbmdzOiBIVE1MU3BhbkVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBfc3luYzogSFRNTEFuY2hvckVsZW1lbnQ7XG5cbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIiwgXCJlcnJvci13YXJuaW5nLXN1bW1hcnlcIik7XG5cbiAgICAgICAgY29uc3Qgc3luYyA9IHRoaXMuX3N5bmMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICAgICAgc3luYy5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24tc3luY1wiLCBcInRleHQtc3VidGxlXCIpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHN5bmMpO1xuICAgICAgICBzeW5jLm9uY2xpY2sgPSAoKSA9PiB0aGlzLnN5bmNDbGljaygpO1xuXG4gICAgICAgIGNvbnN0IHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChzKTtcbiAgICAgICAgcy5vbmNsaWNrID0gKCkgPT4gdGhpcy5kaWFnbm9zdGljQ2xpY2soKTtcblxuICAgICAgICBjb25zdCBlcnJvcnNJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIGVycm9yc0ljb24uY2xhc3NMaXN0LmFkZChcImljb25cIiwgXCJpY29uLWlzc3VlLW9wZW5lZFwiKTtcbiAgICAgICAgcy5hcHBlbmRDaGlsZChlcnJvcnNJY29uKTtcblxuICAgICAgICBjb25zdCBlcnJvcnMgPSB0aGlzLl9lcnJvcnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgZXJyb3JzLmNsYXNzTGlzdC5hZGQoXCJlcnJvci1zdW1tYXJ5XCIpO1xuICAgICAgICBzLmFwcGVuZENoaWxkKGVycm9ycyk7XG5cbiAgICAgICAgY29uc3Qgd2FybmluZ3NJY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHdhcm5pbmdzSWNvbi5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24tYWxlcnRcIik7XG4gICAgICAgIHMuYXBwZW5kQ2hpbGQod2FybmluZ3NJY29uKTtcblxuICAgICAgICBjb25zdCB3YXJuaW5ncyA9IHRoaXMuX3dhcm5pbmdzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHdhcm5pbmdzLmNsYXNzTGlzdC5hZGQoXCJ3YXJuaW5nLXN1bW1hcnlcIik7XG4gICAgICAgIHMuYXBwZW5kQ2hpbGQod2FybmluZ3MpO1xuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGVTdGF0ZShzdGF0ZTogdHlwZW9mIERpYWdub3N0aWNzRWxlbWVudC5wcm90b3R5cGUuX3N0YXRlKSB7XG4gICAgICAgIGlmICghXy5pc0VxdWFsKHRoaXMuX3N0YXRlLCBzdGF0ZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX3N0YXRlID0gc3RhdGU7XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXRlLmVycm9yQ291bnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXJyb3JzLmlubmVyVGV4dCA9IHRoaXMuX3N0YXRlLmVycm9yQ291bnQudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9lcnJvcnMuaW5uZXJUZXh0ID0gXCIwXCI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX3N0YXRlLndhcm5pbmdDb3VudCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl93YXJuaW5ncy5pbm5lclRleHQgPSB0aGlzLl9zdGF0ZS53YXJuaW5nQ291bnQudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl93YXJuaW5ncy5pbm5lclRleHQgPSBcIjBcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBzeW5jQ2xpY2s6ICgpID0+IHZvaWQ7XG4gICAgcHVibGljIGRpYWdub3N0aWNDbGljazogKCkgPT4gdm9pZDtcbn1cblxuKDxhbnk+ZXhwb3J0cykuRGlhZ25vc3RpY3NFbGVtZW50ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1kaWFnbm9zdGljc1wiLCB7IHByb3RvdHlwZTogRGlhZ25vc3RpY3NFbGVtZW50LnByb3RvdHlwZSB9KTtcblxuZXhwb3J0IGNsYXNzIFByb2plY3RDb3VudEVsZW1lbnQgZXh0ZW5kcyBIVE1MQW5jaG9yRWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCB7XG4gICAgcHJpdmF0ZSBfc3RhdGU6IHsgcHJvamVjdENvdW50OiBudW1iZXIgfTtcbiAgICBwdWJsaWMgcHJvamVjdHM6IEhUTUxTcGFuRWxlbWVudDtcbiAgICBwcml2YXRlIF9zb2x1dGlvbk51bm1iZXI6IEhUTUxTcGFuRWxlbWVudDtcblxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcImlubGluZS1ibG9ja1wiLCBcInByb2plY3Qtc3VtbWFyeVwiLCBcInByb2plY3RzLWljb25cIik7XG5cbiAgICAgICAgY29uc3QgaWNvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBpY29uLmNsYXNzTGlzdC5hZGQoXCJpY29uXCIsIFwiaWNvbi1wdWxzZVwiKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChpY29uKTtcblxuICAgICAgICBjb25zdCBzdWIgPSB0aGlzLl9zb2x1dGlvbk51bm1iZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3ViXCIpO1xuICAgICAgICBpY29uLmFwcGVuZENoaWxkKHN1Yik7XG5cbiAgICAgICAgY29uc3QgcHJvamVjdHMgPSB0aGlzLnByb2plY3RzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHByb2plY3RzLmNsYXNzTGlzdC5hZGQoXCJwcm9qZWN0c1wiKTtcbiAgICAgICAgcHJvamVjdHMuaW5uZXJUZXh0ID0gXCIwIFByb2plY3RzXCI7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocHJvamVjdHMpO1xuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGVTdGF0ZShzdGF0ZTogdHlwZW9mIFByb2plY3RDb3VudEVsZW1lbnQucHJvdG90eXBlLl9zdGF0ZSkge1xuICAgICAgICBpZiAoIV8uaXNFcXVhbCh0aGlzLl9zdGF0ZSwgc3RhdGUpKSB7XG4gICAgICAgICAgICB0aGlzLl9zdGF0ZSA9IHN0YXRlO1xuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5wcm9qZWN0cy5pbm5lclRleHQgPSBgJHt0aGlzLl9zdGF0ZS5wcm9qZWN0Q291bnR9IFByb2plY3RzYCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlU29sdXRpb25OdW1iZXIoc29sdXRpb25OdW1iZXI6IHN0cmluZykge1xuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9zb2x1dGlvbk51bm1iZXIuaW5uZXJUZXh0ID0gc29sdXRpb25OdW1iZXIpO1xuICAgIH1cbn1cblxuKDxhbnk+ZXhwb3J0cykuUHJvamVjdENvdW50RWxlbWVudCA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtcHJvamVjdC1jb3VudFwiLCB7IHByb3RvdHlwZTogUHJvamVjdENvdW50RWxlbWVudC5wcm90b3R5cGUgfSk7XG5cblxuZXhwb3J0IGNsYXNzIFN0YXR1c0JhckVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCBpbXBsZW1lbnRzIFdlYkNvbXBvbmVudCwgSURpc3Bvc2FibGUge1xuICAgIHByaXZhdGUgX3N0YXRlOiBTdGF0dXNCYXJTdGF0ZTtcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuICAgIHByaXZhdGUgX2ZsYW1lOiBGbGFtZUVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBfZGlhZ25vc3RpY3M6IERpYWdub3N0aWNzRWxlbWVudDtcbiAgICBwcml2YXRlIF9wcm9qZWN0Q291bnQ6IFByb2plY3RDb3VudEVsZW1lbnQ7XG5cbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIik7XG5cbiAgICAgICAgY29uc3QgZmxhbWVFbGVtZW50ID0gdGhpcy5fZmxhbWUgPSA8RmxhbWVFbGVtZW50Pm5ldyBleHBvcnRzLkZsYW1lRWxlbWVudCgpO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGZsYW1lRWxlbWVudCk7XG4gICAgICAgIGZsYW1lRWxlbWVudC5vbmNsaWNrID0gKCkgPT4gdGhpcy50b2dnbGUoKTtcblxuICAgICAgICBjb25zdCBwcm9qZWN0Q291bnQgPSB0aGlzLl9wcm9qZWN0Q291bnQgPSA8UHJvamVjdENvdW50RWxlbWVudD5uZXcgZXhwb3J0cy5Qcm9qZWN0Q291bnRFbGVtZW50KCk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocHJvamVjdENvdW50KTtcbiAgICAgICAgcHJvamVjdENvdW50Lm9uY2xpY2sgPSAoKSA9PiB0aGlzLnRvZ2dsZVNvbHV0aW9uSW5mb3JtYXRpb24oKTtcbiAgICAgICAgcHJvamVjdENvdW50LnByb2plY3RzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcblxuICAgICAgICBjb25zdCBkaWFnbm9zdGljcyA9IHRoaXMuX2RpYWdub3N0aWNzID0gPERpYWdub3N0aWNzRWxlbWVudD5uZXcgZXhwb3J0cy5EaWFnbm9zdGljc0VsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChkaWFnbm9zdGljcyk7XG4gICAgICAgIGRpYWdub3N0aWNzLmRpYWdub3N0aWNDbGljayA9ICgpID0+IHRoaXMudG9nZ2xlRXJyb3JXYXJuaW5nUGFuZWwoKTtcbiAgICAgICAgZGlhZ25vc3RpY3Muc3luY0NsaWNrID0gKCkgPT4gdGhpcy5kb0NvZGVDaGVjaygpO1xuICAgICAgICBkaWFnbm9zdGljcy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG5cbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuX3N0YXRlID0geyBzdGF0dXM6IDxhbnk+e30gfTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoT21uaS5kaWFnbm9zdGljcy5zdWJzY3JpYmUoZGlhZ25vc3RpY3MgPT4ge1xuICAgICAgICAgICAgY29uc3QgY291bnRzID0gXy5jb3VudEJ5KGRpYWdub3N0aWNzLCBxdWlja0ZpeCA9PiBxdWlja0ZpeC5Mb2dMZXZlbCk7XG5cbiAgICAgICAgICAgIHRoaXMuX2RpYWdub3N0aWNzLnVwZGF0ZVN0YXRlKHtcbiAgICAgICAgICAgICAgICBlcnJvckNvdW50OiBjb3VudHNbXCJFcnJvclwiXSB8fCAwLFxuICAgICAgICAgICAgICAgIHdhcm5pbmdDb3VudDogY291bnRzW1wiV2FybmluZ1wiXSB8fCAwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKE9ic2VydmFibGUubWVyZ2UoT21uaS5hY3RpdmVNb2RlbCwgT21uaS5hY3RpdmVNb2RlbC5mbGF0TWFwKHggPT4geC5vYnNlcnZlLnN0YXRlKSlcbiAgICAgICAgICAgIC5zdWJzY3JpYmUobW9kZWwgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2ZsYW1lLnVwZGF0ZVN0YXRlKG1vZGVsKTtcbiAgICAgICAgICAgICAgICB1cGRhdGVTdGF0ZSh0aGlzLl9zdGF0ZSwgbW9kZWwpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fdXBkYXRlVmlzaWJsZSgpO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLnByb2plY3RzXG4gICAgICAgICAgICAuZGVib3VuY2VUaW1lKDUwMClcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdHMgPT4gdGhpcy5fcHJvamVjdENvdW50LnVwZGF0ZVN0YXRlKHsgcHJvamVjdENvdW50OiBwcm9qZWN0cy5sZW5ndGggfSkpKTtcblxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5zdGF0dXNcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoc3RhdHVzID0+IHRoaXMuX2ZsYW1lLnVwZGF0ZU91dGdvaW5nKHN0YXR1cyB8fCA8YW55Pnt9KSkpO1xuXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm1vZGVsXG4gICAgICAgICAgICAuc3Vic2NyaWJlKG1vZGVsID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzb2x1dGlvbk51bWJlciA9IFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvbnMubGVuZ3RoID4gMSA/IF8udHJpbShzZXJ2ZXIubW9kZWwgJiYgKDxhbnk+c2VydmVyLm1vZGVsKS5pbmRleCwgXCJjbGllbnRcIikgOiBcIlwiO1xuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RDb3VudC51cGRhdGVTb2x1dGlvbk51bWJlcihzb2x1dGlvbk51bWJlcik7XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVFZGl0b3JPckNvbmZpZ0VkaXRvci5zdWJzY3JpYmUoZWRpdG9yID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZVZpc2libGUoISFlZGl0b3IpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoU29sdXRpb25NYW5hZ2VyLmFjdGl2ZVNvbHV0aW9uXG4gICAgICAgICAgICAuc3Vic2NyaWJlKHNvbHV0aW9ucyA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc29sdXRpb25OdW1iZXIgPSBTb2x1dGlvbk1hbmFnZXIuYWN0aXZlU29sdXRpb25zLmxlbmd0aCA+IDEgPyBfLnRyaW0oc2VydmVyLm1vZGVsICYmICg8YW55PnNlcnZlci5tb2RlbCkuaW5kZXgsIFwiY2xpZW50XCIpIDogXCJcIjtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0Q291bnQudXBkYXRlU29sdXRpb25OdW1iZXIoc29sdXRpb25OdW1iZXIpO1xuICAgICAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2hhc1ZhbGlkRWRpdG9yOiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBfdXBkYXRlVmlzaWJsZShoYXNWYWxpZEVkaXRvcj86IGJvb2xlYW4pIHtcbiAgICAgICAgaWYgKHR5cGVvZiBoYXNWYWxpZEVkaXRvciAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgdGhpcy5faGFzVmFsaWRFZGl0b3IgPSBoYXNWYWxpZEVkaXRvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9zdGF0ZS5pc09uICYmIHRoaXMuX2hhc1ZhbGlkRWRpdG9yKSB7XG4gICAgICAgICAgICB0aGlzLl9zaG93T25TdGF0ZUl0ZW1zKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9oaWRlT25TdGF0ZUl0ZW1zKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9zaG93T25TdGF0ZUl0ZW1zKCkge1xuICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuX2RpYWdub3N0aWNzLnN0eWxlLmRpc3BsYXkgPT09IFwibm9uZVwiKSB7IGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2RpYWdub3N0aWNzLnN0eWxlLmRpc3BsYXkgPSBcIlwiKTsgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID09PSBcIm5vbmVcIikgeyBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9wcm9qZWN0Q291bnQucHJvamVjdHMuc3R5bGUuZGlzcGxheSA9IFwiXCIpOyB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2hpZGVPblN0YXRlSXRlbXMoKSB7XG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5fZGlhZ25vc3RpY3Muc3R5bGUuZGlzcGxheSAhPT0gXCJub25lXCIpIHsgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5fZGlhZ25vc3RpY3Muc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKTsgfVxuICAgICAgICAgICAgaWYgKHRoaXMuX3Byb2plY3RDb3VudC5wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ICE9PSBcIm5vbmVcIikgeyBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9wcm9qZWN0Q291bnQucHJvamVjdHMuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKTsgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyB0b2dnbGUoKSB7XG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTp0b2dnbGUtZG9ja1wiKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdG9nZ2xlRXJyb3JXYXJuaW5nUGFuZWwoKSB7XG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpkb2NrLXRvZ2dsZS1lcnJvcnNcIik7XG4gICAgfVxuXG4gICAgcHVibGljIHRvZ2dsZVNvbHV0aW9uSW5mb3JtYXRpb24oKSB7XG4gICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpzb2x1dGlvbi1zdGF0dXNcIik7XG4gICAgfVxuXG4gICAgcHVibGljIGRvQ29kZUNoZWNrKCkge1xuICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206Y29kZS1jaGVja1wiKTtcbiAgICB9XG59XG5cbig8YW55PmV4cG9ydHMpLlN0YXR1c0JhckVsZW1lbnQgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLXN0YXR1cy1iYXJcIiwgeyBwcm90b3R5cGU6IFN0YXR1c0JhckVsZW1lbnQucHJvdG90eXBlIH0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

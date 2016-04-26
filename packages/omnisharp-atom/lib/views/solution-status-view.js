"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SolutionStatusCard = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _omnisharpClient = require("omnisharp-client");

var _path = require("path");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var $ = require("jquery");
var fastdom = require("fastdom");

function truncateStringReverse(str) {
    var maxLength = arguments.length <= 1 || arguments[1] === undefined ? 55 : arguments[1];

    var reversedString = _lodash2.default.toArray(str).reverse().join("");
    return _lodash2.default.toArray(_lodash2.default.truncate(reversedString, maxLength)).reverse().join("");
}
var getMessageElement = function () {
    var projectProps = {
        get: function project() {
            return this._project;
        },
        set: function project(project) {
            this._project = project;
            this._key = project.path;
            var path = truncateStringReverse(project.path.replace(this.project.solutionPath, ""), 24);
            this.title = path + " [" + project.frameworks.filter(function (z) {
                return z.Name !== "all";
            }).map(function (x) {
                return x.FriendlyName;
            }) + "]";
            this.innerText = project.name;
        }
    };
    var keyProps = {
        get: function key() {
            return this._key;
        }
    };
    return function getMessageElement() {
        var element = document.createElement("div");
        element.classList.add("project", "name");
        Object.defineProperty(element, "project", projectProps);
        Object.defineProperty(element, "key", keyProps);
        return element;
    };
}();

var SolutionStatusCard = exports.SolutionStatusCard = function (_HTMLDivElement) {
    _inherits(SolutionStatusCard, _HTMLDivElement);

    function SolutionStatusCard() {
        var _Object$getPrototypeO;

        _classCallCheck(this, SolutionStatusCard);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(SolutionStatusCard)).call.apply(_Object$getPrototypeO, [this].concat(args)));

        _this.displayName = "Card";
        return _this;
    }

    _createClass(SolutionStatusCard, [{
        key: "_getMetaControls",
        value: function _getMetaControls() {
            this._stopBtn = document.createElement("button");
            this._stopBtn.classList.add("btn", "btn-xs", "btn-error");
            this._stopBtn.onclick = function () {
                return atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:stop-server");
            };
            var span = document.createElement("span");
            span.classList.add("fa", "fa-stop");
            this._stopBtn.appendChild(span);
            this._stopBtn.innerHTML += " Stop";
            this._startBtn = document.createElement("button");
            this._startBtn.classList.add("btn", "btn-xs", "btn-success");
            this._startBtn.onclick = function () {
                return atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:start-server");
            };
            span = document.createElement("span");
            span.classList.add("fa", "fa-play");
            this._startBtn.appendChild(span);
            this._startBtn.innerHTML += " Start";
            this._restartBtn = document.createElement("button");
            this._restartBtn.classList.add("btn", "btn-xs", "btn-info");
            this._restartBtn.onclick = function () {
                return atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:restart-server");
            };
            span = document.createElement("span");
            span.classList.add("fa", "fa-refresh");
            this._restartBtn.appendChild(span);
            this._restartBtn.innerHTML += " Restart";
            var metaControls = document.createElement("div");
            metaControls.classList.add("meta-controls");
            var buttonGroup = document.createElement("div");
            buttonGroup.classList.add("btn-group");
            metaControls.appendChild(buttonGroup);
            buttonGroup.appendChild(this._startBtn);
            buttonGroup.appendChild(this._stopBtn);
            buttonGroup.appendChild(this._restartBtn);
            return metaControls;
        }
    }, {
        key: "_getStatusItem",
        value: function _getStatusItem() {
            this._statusItem = document.createElement("span");
            this._statusItem.classList.add("pull-left", "stats-item");
            var statusContainer = document.createElement("span");
            this._statusItem.appendChild(statusContainer);
            var icon = document.createElement("span");
            statusContainer.appendChild(icon);
            icon.classList.add("icon", "icon-zap");
            this._statusText = document.createElement("span");
            statusContainer.appendChild(this._statusText);
            return this._statusItem;
        }
    }, {
        key: "_getVersions",
        value: function _getVersions() {
            var versions = document.createElement("span");
            versions.classList.add("pull-right", "stats-item");
            var spans = document.createElement("span");
            spans.classList.add("icon", "icon-versions");
            versions.appendChild(spans);
            this._runtimeText = document.createElement("span");
            versions.appendChild(this._runtimeText);
            return versions;
        }
    }, {
        key: "_getBody",
        value: function _getBody() {
            var body = document.createElement("div");
            this._body = body;
            body.classList.add("body");
            var header = document.createElement("h4");
            header.classList.add("name");
            body.appendChild(header);
            this._name = document.createElement("span");
            header.appendChild(this._name);
            var versions = this._getVersions();
            body.appendChild(versions);
            var statusItem = this._getStatusItem();
            body.appendChild(statusItem);
            var metaControls = this._getMetaControls();
            body.appendChild(metaControls);
            return body;
        }
    }, {
        key: "_getProjects",
        value: function _getProjects() {
            this._projects = document.createElement("div");
            this._projects.classList.add("meta", "meta-projects");
            var header = document.createElement("div");
            header.classList.add("header");
            header.innerText = "Projects";
            return this._projects;
        }
    }, {
        key: "_getButtons",
        value: function _getButtons() {
            this._buttons = document.createElement("div");
            this._buttons.classList.add("selector", "btn-group", "btn-group-xs");
            var left = document.createElement("div");
            left.classList.add("btn", "btn-xs", "icon", "icon-triangle-left");
            left.onclick = function (e) {
                return atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:previous-solution-status");
            };
            this._buttons.appendChild(left);
            var right = document.createElement("div");
            right.classList.add("btn", "btn-xs", "icon", "icon-triangle-right");
            right.onclick = function (e) {
                return atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:next-solution-status");
            };
            this._buttons.appendChild(right);
            return this._buttons;
        }
    }, {
        key: "createdCallback",
        value: function createdCallback() {
            this.modelDisposable = new _omnisharpClient.CompositeDisposable();
            this.classList.add("omnisharp-card");
            this._getButtons();
            var body = this._getBody();
            this.appendChild(body);
            var projects = this._getProjects();
            this.appendChild(projects);
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            this.verifyPosition();
        }
    }, {
        key: "updateCard",
        value: function updateCard(model, count) {
            this.model = model;
            this.count = count;
        }
    }, {
        key: "verifyPosition",
        value: function verifyPosition() {
            var offset = $(document.querySelectorAll(this.attachTo)).offset();
            if (offset) {
                $(this).css({
                    position: "fixed",
                    top: offset.top - this.clientHeight,
                    left: offset.left
                });
            }
        }
    }, {
        key: "count",
        get: function get() {
            return this._count;
        },
        set: function set(count) {
            if (this._count !== count) {
                this._count = count;
            }
            if (this._count > 1) {
                this._body.parentElement.insertBefore(this._buttons, this._body);
            } else {
                this._buttons.remove();
            }
        }
    }, {
        key: "model",
        get: function get() {
            return this._model;
        },
        set: function set(model) {
            var _this2 = this;

            this._model = model;
            this.modelDisposable.dispose();
            this.modelDisposable = new _omnisharpClient.CompositeDisposable();
            this.modelDisposable.add(this._model.observe.state.delay(10).subscribe(function (_ref) {
                var index = _ref.index;
                var path = _ref.path;
                var state = _ref.state;
                var isReady = _ref.isReady;
                var isOff = _ref.isOff;
                var isOn = _ref.isOn;

                fastdom.mutate(function () {
                    var name = (0, _path.basename)(path) + " (" + index + ")";
                    if (_this2._name.innerText !== name) {
                        _this2._name.innerText = name;
                    }
                    if (state === _omnisharpClient.DriverState.Connected) {
                        _this2._statusText.innerText = "Online";
                    } else if (state === _omnisharpClient.DriverState.Connecting) {
                        _this2._statusText.innerText = "Loading";
                    } else if (state === _omnisharpClient.DriverState.Disconnected) {
                        _this2._statusText.innerText = "Offline";
                    } else {
                        _this2._statusText.innerText = _omnisharpClient.DriverState[state];
                    }
                    if (isReady) {
                        _this2._startBtn.style.display = "none";
                        _this2._stopBtn.style.display = "";
                    } else if (isOff) {
                        _this2._startBtn.style.display = "";
                        _this2._stopBtn.style.display = "none";
                    } else {
                        _this2._startBtn.style.display = "none";
                        _this2._stopBtn.style.display = "none";
                    }
                    if (isOn) {
                        _this2._restartBtn.style.display = "";
                    } else {
                        _this2._restartBtn.style.display = "none";
                    }
                    if (isOff) {
                        _this2._projects.style.display = "none";
                    } else {
                        _this2._projects.style.display = "";
                    }
                    _this2._statusItem.className = "pull-left stats-item";
                    _this2._statusItem.classList.add(_omnisharpClient.DriverState[state].toLowerCase());
                    _this2.verifyPosition();
                    _this2._runtimeText.style.display = "none";
                    _this2._runtimeText.innerText = "";
                });
            }));
            this.modelDisposable.add(this._model.observe.projects.subscribe(function (projects) {
                fastdom.mutate(function () {
                    for (var i = 0, len = _this2._projects.children.length > projects.length ? _this2._projects.children.length : projects.length; i < len; i++) {
                        var item = projects[i];
                        var child = _this2._projects.children[i];
                        if (!item && child) {
                            child.remove();
                            continue;
                        } else if (item && !child) {
                            child = getMessageElement();
                            _this2._projects.appendChild(child);
                        }
                        if (child && child.key !== item.path) {
                            child.project = item;
                        }
                    }
                    _this2.verifyPosition();
                });
            }));
        }
    }]);

    return SolutionStatusCard;
}(HTMLDivElement);

exports.SolutionStatusCard = document.registerElement("omnisharp-solution-card", { prototype: SolutionStatusCard.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9zb2x1dGlvbi1zdGF0dXMtdmlldy5qcyIsImxpYi92aWV3cy9zb2x1dGlvbi1zdGF0dXMtdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUlBOzs7Ozs7Ozs7O0FDQUEsSUFBTSxJQUFrQixRQUFRLFFBQVIsQ0FBeEI7QUFDQSxJQUFJLFVBQTBCLFFBQVEsU0FBUixDQUE5Qjs7QUFHQSxTQUFBLHFCQUFBLENBQStCLEdBQS9CLEVBQTBEO0FBQUEsUUFBZCxTQUFjLHlEQUFGLEVBQUU7O0FBQ3RELFFBQU0saUJBQWlCLGlCQUFFLE9BQUYsQ0FBVSxHQUFWLEVBQWUsT0FBZixHQUF5QixJQUF6QixDQUE4QixFQUE5QixDQUF2QjtBQUNBLFdBQU8saUJBQUUsT0FBRixDQUFVLGlCQUFFLFFBQUYsQ0FBVyxjQUFYLEVBQTJCLFNBQTNCLENBQVYsRUFBaUQsT0FBakQsR0FBMkQsSUFBM0QsQ0FBZ0UsRUFBaEUsQ0FBUDtBQUNIO0FBUUQsSUFBTSxvQkFBcUIsWUFBQTtBQUN2QixRQUFNLGVBQWU7QUFDakIsYUFBSyxTQUFBLE9BQUEsR0FBQTtBQUFxQixtQkFBTyxLQUFLLFFBQVo7QUFBdUIsU0FEaEM7QUFFakIsYUFBSyxTQUFBLE9BQUEsQ0FBaUIsT0FBakIsRUFBK0M7QUFDaEQsaUJBQUssUUFBTCxHQUFnQixPQUFoQjtBQUNBLGlCQUFLLElBQUwsR0FBWSxRQUFRLElBQXBCO0FBRUEsZ0JBQU0sT0FBTyxzQkFBc0IsUUFBUSxJQUFSLENBQWEsT0FBYixDQUFxQixLQUFLLE9BQUwsQ0FBYSxZQUFsQyxFQUFnRCxFQUFoRCxDQUF0QixFQUEyRSxFQUEzRSxDQUFiO0FBQ0EsaUJBQUssS0FBTCxHQUFnQixJQUFoQixVQUF5QixRQUFRLFVBQVIsQ0FBbUIsTUFBbkIsQ0FBMEI7QUFBQSx1QkFBSyxFQUFFLElBQUYsS0FBVyxLQUFoQjtBQUFBLGFBQTFCLEVBQWlELEdBQWpELENBQXFEO0FB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TUFBTCxDQUFZLE9BQVosQ0FBb0IsUUFBcEIsQ0FBNkIsU0FBN0IsQ0FBdUMsb0JBQVE7QUFDcEUsd0JBQVEsTUFBUixDQUFlLFlBQUE7QUFDWCx5QkFBSyxJQUFJLElBQUksQ0FBUixFQUFXLE1BQU0sT0FBSyxTQUFMLENBQWUsUUFBZixDQUF3QixNQUF4QixHQUFpQyxTQUFTLE1BQTFDLEdBQW1ELE9BQUssU0FBTCxDQUFlLFFBQWYsQ0FBd0IsTUFBM0UsR0FBb0YsU0FBUyxNQUFuSCxFQUEySCxJQUFJLEdBQS9ILEVBQW9JLEdBQXBJLEVBQXlJO0FBQ3JJLDRCQUFNLE9BQU8sU0FBUyxDQUFULENBQWI7QUFDQSw0QkFBSSxRQUFvQyxPQUFLLFNBQUwsQ0FBZSxRQUFmLENBQXdCLENBQXhCLENBQXhDO0FBRUEsNEJBQUksQ0FBQyxJQUFELElBQVMsS0FBYixFQUFvQjtBQUNoQixrQ0FBTSxNQUFOO0FBQ0E7QUFDSCx5QkFIRCxNQUdPLElBQUksUUFBUSxDQUFDLEtBQWIsRUFBb0I7QUFDdkIsb0NBQVEsbUJBQVI7QUFDQSxtQ0FBSyxTQUFMLENBQWUsV0FBZixDQUEyQixLQUEzQjtBQUNIO0FBRUQsNEJBQUksU0FBUyxNQUFNLEdBQU4sS0FBYyxLQUFLLElBQWhDLEVBQXNDO0FBQ2xDLGtDQUFNLE9BQU4sR0FBZ0IsSUFBaEI7QUFDSDtBQUNKO0FBRUQsMkJBQUssY0FBTDtBQUNILGlCQW5CRDtBQW9CSCxhQXJCd0IsQ0FBekI7QUFzQkg7Ozs7RUFySG1DLGM7O0FBc1JsQyxRQUFTLGtCQUFULEdBQW9DLFNBQVUsZUFBVixDQUEwQix5QkFBMUIsRUFBcUQsRUFBRSxXQUFXLG1CQUFtQixTQUFoQyxFQUFyRCxDQUFwQyIsImZpbGUiOiJsaWIvdmlld3Mvc29sdXRpb24tc3RhdHVzLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBEcml2ZXJTdGF0ZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmNvbnN0ICQgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xubGV0IGZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcbmltcG9ydCB7IGJhc2VuYW1lIH0gZnJvbSBcInBhdGhcIjtcbmZ1bmN0aW9uIHRydW5jYXRlU3RyaW5nUmV2ZXJzZShzdHIsIG1heExlbmd0aCA9IDU1KSB7XG4gICAgY29uc3QgcmV2ZXJzZWRTdHJpbmcgPSBfLnRvQXJyYXkoc3RyKS5yZXZlcnNlKCkuam9pbihcIlwiKTtcbiAgICByZXR1cm4gXy50b0FycmF5KF8udHJ1bmNhdGUocmV2ZXJzZWRTdHJpbmcsIG1heExlbmd0aCkpLnJldmVyc2UoKS5qb2luKFwiXCIpO1xufVxuY29uc3QgZ2V0TWVzc2FnZUVsZW1lbnQgPSAoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHByb2plY3RQcm9wcyA9IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBwcm9qZWN0KCkgeyByZXR1cm4gdGhpcy5fcHJvamVjdDsgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiBwcm9qZWN0KHByb2plY3QpIHtcbiAgICAgICAgICAgIHRoaXMuX3Byb2plY3QgPSBwcm9qZWN0O1xuICAgICAgICAgICAgdGhpcy5fa2V5ID0gcHJvamVjdC5wYXRoO1xuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHRydW5jYXRlU3RyaW5nUmV2ZXJzZShwcm9qZWN0LnBhdGgucmVwbGFjZSh0aGlzLnByb2plY3Quc29sdXRpb25QYXRoLCBcIlwiKSwgMjQpO1xuICAgICAgICAgICAgdGhpcy50aXRsZSA9IGAke3BhdGh9IFske3Byb2plY3QuZnJhbWV3b3Jrcy5maWx0ZXIoeiA9PiB6Lk5hbWUgIT09IFwiYWxsXCIpLm1hcCh4ID0+IHguRnJpZW5kbHlOYW1lKX1dYDtcbiAgICAgICAgICAgIHRoaXMuaW5uZXJUZXh0ID0gcHJvamVjdC5uYW1lO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBjb25zdCBrZXlQcm9wcyA9IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiBrZXkoKSB7IHJldHVybiB0aGlzLl9rZXk7IH1cbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbiBnZXRNZXNzYWdlRWxlbWVudCgpIHtcbiAgICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LmFkZChcInByb2plY3RcIiwgXCJuYW1lXCIpO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudCwgXCJwcm9qZWN0XCIsIHByb2plY3RQcm9wcyk7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlbGVtZW50LCBcImtleVwiLCBrZXlQcm9wcyk7XG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH07XG59KSgpO1xuZXhwb3J0IGNsYXNzIFNvbHV0aW9uU3RhdHVzQ2FyZCBleHRlbmRzIEhUTUxEaXZFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3MpO1xuICAgICAgICB0aGlzLmRpc3BsYXlOYW1lID0gXCJDYXJkXCI7XG4gICAgfVxuICAgIGdldCBjb3VudCgpIHsgcmV0dXJuIHRoaXMuX2NvdW50OyB9XG4gICAgc2V0IGNvdW50KGNvdW50KSB7XG4gICAgICAgIGlmICh0aGlzLl9jb3VudCAhPT0gY291bnQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvdW50ID0gY291bnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2NvdW50ID4gMSkge1xuICAgICAgICAgICAgdGhpcy5fYm9keS5wYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZSh0aGlzLl9idXR0b25zLCB0aGlzLl9ib2R5KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2J1dHRvbnMucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0IG1vZGVsKCkgeyByZXR1cm4gdGhpcy5fbW9kZWw7IH1cbiAgICBzZXQgbW9kZWwobW9kZWwpIHtcbiAgICAgICAgdGhpcy5fbW9kZWwgPSBtb2RlbDtcbiAgICAgICAgdGhpcy5tb2RlbERpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICB0aGlzLm1vZGVsRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlLmFkZCh0aGlzLl9tb2RlbC5vYnNlcnZlLnN0YXRlLmRlbGF5KDEwKS5zdWJzY3JpYmUoKHsgaW5kZXgsIHBhdGgsIHN0YXRlLCBpc1JlYWR5LCBpc09mZiwgaXNPbiB9KSA9PiB7XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZSA9IGAke2Jhc2VuYW1lKHBhdGgpfSAoJHtpbmRleH0pYDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbmFtZS5pbm5lclRleHQgIT09IG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fbmFtZS5pbm5lclRleHQgPSBuYW1lO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9IFwiT25saW5lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN0YXRlID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0aW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c1RleHQuaW5uZXJUZXh0ID0gXCJMb2FkaW5nXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN0YXRlID09PSBEcml2ZXJTdGF0ZS5EaXNjb25uZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RhdHVzVGV4dC5pbm5lclRleHQgPSBcIk9mZmxpbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c1RleHQuaW5uZXJUZXh0ID0gRHJpdmVyU3RhdGVbc3RhdGVdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaXNSZWFkeSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BCdG4uc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGlzT2ZmKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChpc09uKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGlzT2ZmKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RzLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNJdGVtLmNsYXNzTmFtZSA9IFwicHVsbC1sZWZ0IHN0YXRzLWl0ZW1cIjtcbiAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNJdGVtLmNsYXNzTGlzdC5hZGQoRHJpdmVyU3RhdGVbc3RhdGVdLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgICAgICAgIHRoaXMudmVyaWZ5UG9zaXRpb24oKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9ydW50aW1lVGV4dC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgdGhpcy5fcnVudGltZVRleHQuaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlLmFkZCh0aGlzLl9tb2RlbC5vYnNlcnZlLnByb2plY3RzLnN1YnNjcmliZShwcm9qZWN0cyA9PiB7XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHRoaXMuX3Byb2plY3RzLmNoaWxkcmVuLmxlbmd0aCA+IHByb2plY3RzLmxlbmd0aCA/IHRoaXMuX3Byb2plY3RzLmNoaWxkcmVuLmxlbmd0aCA6IHByb2plY3RzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSBwcm9qZWN0c1tpXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNoaWxkID0gdGhpcy5fcHJvamVjdHMuY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXRlbSAmJiBjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChpdGVtICYmICFjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQgPSBnZXRNZXNzYWdlRWxlbWVudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdHMuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZCAmJiBjaGlsZC5rZXkgIT09IGl0ZW0ucGF0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQucHJvamVjdCA9IGl0ZW07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy52ZXJpZnlQb3NpdGlvbigpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgX2dldE1ldGFDb250cm9scygpIHtcbiAgICAgICAgdGhpcy5fc3RvcEJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgIHRoaXMuX3N0b3BCdG4uY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi14c1wiLCBcImJ0bi1lcnJvclwiKTtcbiAgICAgICAgdGhpcy5fc3RvcEJ0bi5vbmNsaWNrID0gKCkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnN0b3Atc2VydmVyXCIpO1xuICAgICAgICBsZXQgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBzcGFuLmNsYXNzTGlzdC5hZGQoXCJmYVwiLCBcImZhLXN0b3BcIik7XG4gICAgICAgIHRoaXMuX3N0b3BCdG4uYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgICAgIHRoaXMuX3N0b3BCdG4uaW5uZXJIVE1MICs9IFwiIFN0b3BcIjtcbiAgICAgICAgdGhpcy5fc3RhcnRCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgICB0aGlzLl9zdGFydEJ0bi5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIFwiYnRuLXhzXCIsIFwiYnRuLXN1Y2Nlc3NcIik7XG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206c3RhcnQtc2VydmVyXCIpO1xuICAgICAgICBzcGFuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHNwYW4uY2xhc3NMaXN0LmFkZChcImZhXCIsIFwiZmEtcGxheVwiKTtcbiAgICAgICAgdGhpcy5fc3RhcnRCdG4uYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuLmlubmVySFRNTCArPSBcIiBTdGFydFwiO1xuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgICAgdGhpcy5fcmVzdGFydEJ0bi5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIFwiYnRuLXhzXCIsIFwiYnRuLWluZm9cIik7XG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4ub25jbGljayA9ICgpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpyZXN0YXJ0LXNlcnZlclwiKTtcbiAgICAgICAgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBzcGFuLmNsYXNzTGlzdC5hZGQoXCJmYVwiLCBcImZhLXJlZnJlc2hcIik7XG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uaW5uZXJIVE1MICs9IFwiIFJlc3RhcnRcIjtcbiAgICAgICAgY29uc3QgbWV0YUNvbnRyb2xzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgbWV0YUNvbnRyb2xzLmNsYXNzTGlzdC5hZGQoXCJtZXRhLWNvbnRyb2xzXCIpO1xuICAgICAgICBjb25zdCBidXR0b25Hcm91cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIGJ1dHRvbkdyb3VwLmNsYXNzTGlzdC5hZGQoXCJidG4tZ3JvdXBcIik7XG4gICAgICAgIG1ldGFDb250cm9scy5hcHBlbmRDaGlsZChidXR0b25Hcm91cCk7XG4gICAgICAgIGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkKHRoaXMuX3N0YXJ0QnRuKTtcbiAgICAgICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQodGhpcy5fc3RvcEJ0bik7XG4gICAgICAgIGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkKHRoaXMuX3Jlc3RhcnRCdG4pO1xuICAgICAgICByZXR1cm4gbWV0YUNvbnRyb2xzO1xuICAgIH1cbiAgICBfZ2V0U3RhdHVzSXRlbSgpIHtcbiAgICAgICAgdGhpcy5fc3RhdHVzSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0aGlzLl9zdGF0dXNJdGVtLmNsYXNzTGlzdC5hZGQoXCJwdWxsLWxlZnRcIiwgXCJzdGF0cy1pdGVtXCIpO1xuICAgICAgICBjb25zdCBzdGF0dXNDb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5fc3RhdHVzSXRlbS5hcHBlbmRDaGlsZChzdGF0dXNDb250YWluZXIpO1xuICAgICAgICBjb25zdCBpY29uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHN0YXR1c0NvbnRhaW5lci5hcHBlbmRDaGlsZChpY29uKTtcbiAgICAgICAgaWNvbi5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24temFwXCIpO1xuICAgICAgICB0aGlzLl9zdGF0dXNUZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHN0YXR1c0NvbnRhaW5lci5hcHBlbmRDaGlsZCh0aGlzLl9zdGF0dXNUZXh0KTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXR1c0l0ZW07XG4gICAgfVxuICAgIF9nZXRWZXJzaW9ucygpIHtcbiAgICAgICAgY29uc3QgdmVyc2lvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdmVyc2lvbnMuY2xhc3NMaXN0LmFkZChcInB1bGwtcmlnaHRcIiwgXCJzdGF0cy1pdGVtXCIpO1xuICAgICAgICBjb25zdCBzcGFucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBzcGFucy5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24tdmVyc2lvbnNcIik7XG4gICAgICAgIHZlcnNpb25zLmFwcGVuZENoaWxkKHNwYW5zKTtcbiAgICAgICAgdGhpcy5fcnVudGltZVRleHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdmVyc2lvbnMuYXBwZW5kQ2hpbGQodGhpcy5fcnVudGltZVRleHQpO1xuICAgICAgICByZXR1cm4gdmVyc2lvbnM7XG4gICAgfVxuICAgIF9nZXRCb2R5KCkge1xuICAgICAgICBjb25zdCBib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5fYm9keSA9IGJvZHk7XG4gICAgICAgIGJvZHkuY2xhc3NMaXN0LmFkZChcImJvZHlcIik7XG4gICAgICAgIGNvbnN0IGhlYWRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJoNFwiKTtcbiAgICAgICAgaGVhZGVyLmNsYXNzTGlzdC5hZGQoXCJuYW1lXCIpO1xuICAgICAgICBib2R5LmFwcGVuZENoaWxkKGhlYWRlcik7XG4gICAgICAgIHRoaXMuX25hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgaGVhZGVyLmFwcGVuZENoaWxkKHRoaXMuX25hbWUpO1xuICAgICAgICBjb25zdCB2ZXJzaW9ucyA9IHRoaXMuX2dldFZlcnNpb25zKCk7XG4gICAgICAgIGJvZHkuYXBwZW5kQ2hpbGQodmVyc2lvbnMpO1xuICAgICAgICBjb25zdCBzdGF0dXNJdGVtID0gdGhpcy5fZ2V0U3RhdHVzSXRlbSgpO1xuICAgICAgICBib2R5LmFwcGVuZENoaWxkKHN0YXR1c0l0ZW0pO1xuICAgICAgICBjb25zdCBtZXRhQ29udHJvbHMgPSB0aGlzLl9nZXRNZXRhQ29udHJvbHMoKTtcbiAgICAgICAgYm9keS5hcHBlbmRDaGlsZChtZXRhQ29udHJvbHMpO1xuICAgICAgICByZXR1cm4gYm9keTtcbiAgICB9XG4gICAgX2dldFByb2plY3RzKCkge1xuICAgICAgICB0aGlzLl9wcm9qZWN0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX3Byb2plY3RzLmNsYXNzTGlzdC5hZGQoXCJtZXRhXCIsIFwibWV0YS1wcm9qZWN0c1wiKTtcbiAgICAgICAgY29uc3QgaGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgaGVhZGVyLmNsYXNzTGlzdC5hZGQoXCJoZWFkZXJcIik7XG4gICAgICAgIGhlYWRlci5pbm5lclRleHQgPSBcIlByb2plY3RzXCI7XG4gICAgICAgIHJldHVybiB0aGlzLl9wcm9qZWN0cztcbiAgICB9XG4gICAgX2dldEJ1dHRvbnMoKSB7XG4gICAgICAgIHRoaXMuX2J1dHRvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB0aGlzLl9idXR0b25zLmNsYXNzTGlzdC5hZGQoXCJzZWxlY3RvclwiLCBcImJ0bi1ncm91cFwiLCBcImJ0bi1ncm91cC14c1wiKTtcbiAgICAgICAgY29uc3QgbGVmdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIGxlZnQuY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi14c1wiLCBcImljb25cIiwgXCJpY29uLXRyaWFuZ2xlLWxlZnRcIik7XG4gICAgICAgIGxlZnQub25jbGljayA9IChlKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206cHJldmlvdXMtc29sdXRpb24tc3RhdHVzXCIpO1xuICAgICAgICB0aGlzLl9idXR0b25zLmFwcGVuZENoaWxkKGxlZnQpO1xuICAgICAgICBjb25zdCByaWdodCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHJpZ2h0LmNsYXNzTGlzdC5hZGQoXCJidG5cIiwgXCJidG4teHNcIiwgXCJpY29uXCIsIFwiaWNvbi10cmlhbmdsZS1yaWdodFwiKTtcbiAgICAgICAgcmlnaHQub25jbGljayA9IChlKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206bmV4dC1zb2x1dGlvbi1zdGF0dXNcIik7XG4gICAgICAgIHRoaXMuX2J1dHRvbnMuYXBwZW5kQ2hpbGQocmlnaHQpO1xuICAgICAgICByZXR1cm4gdGhpcy5fYnV0dG9ucztcbiAgICB9XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLm1vZGVsRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm9tbmlzaGFycC1jYXJkXCIpO1xuICAgICAgICB0aGlzLl9nZXRCdXR0b25zKCk7XG4gICAgICAgIGNvbnN0IGJvZHkgPSB0aGlzLl9nZXRCb2R5KCk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoYm9keSk7XG4gICAgICAgIGNvbnN0IHByb2plY3RzID0gdGhpcy5fZ2V0UHJvamVjdHMoKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChwcm9qZWN0cyk7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMudmVyaWZ5UG9zaXRpb24oKTtcbiAgICB9XG4gICAgdXBkYXRlQ2FyZChtb2RlbCwgY291bnQpIHtcbiAgICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsO1xuICAgICAgICB0aGlzLmNvdW50ID0gY291bnQ7XG4gICAgfVxuICAgIHZlcmlmeVBvc2l0aW9uKCkge1xuICAgICAgICBjb25zdCBvZmZzZXQgPSAkKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5hdHRhY2hUbykpLm9mZnNldCgpO1xuICAgICAgICBpZiAob2Zmc2V0KSB7XG4gICAgICAgICAgICAkKHRoaXMpLmNzcyh7XG4gICAgICAgICAgICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgLSB0aGlzLmNsaWVudEhlaWdodCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLlNvbHV0aW9uU3RhdHVzQ2FyZCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1zb2x1dGlvbi1jYXJkXCIsIHsgcHJvdG90eXBlOiBTb2x1dGlvblN0YXR1c0NhcmQucHJvdG90eXBlIH0pO1xuIiwiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHtWaWV3TW9kZWx9IGZyb20gXCIuLi9zZXJ2ZXIvdmlldy1tb2RlbFwiO1xuaW1wb3J0IHtQcm9qZWN0Vmlld01vZGVsfSBmcm9tIFwiLi4vc2VydmVyL3Byb2plY3Qtdmlldy1tb2RlbFwiO1xuaW1wb3J0IHtEcml2ZXJTdGF0ZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gIGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5jb25zdCAkOiBKUXVlcnlTdGF0aWMgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xubGV0IGZhc3Rkb206IHR5cGVvZiBGYXN0ZG9tID0gcmVxdWlyZShcImZhc3Rkb21cIik7XG5pbXBvcnQge2Jhc2VuYW1lfSBmcm9tIFwicGF0aFwiO1xuXG5mdW5jdGlvbiB0cnVuY2F0ZVN0cmluZ1JldmVyc2Uoc3RyOiBzdHJpbmcsIG1heExlbmd0aCA9IDU1KSB7XG4gICAgY29uc3QgcmV2ZXJzZWRTdHJpbmcgPSBfLnRvQXJyYXkoc3RyKS5yZXZlcnNlKCkuam9pbihcIlwiKTtcbiAgICByZXR1cm4gXy50b0FycmF5KF8udHJ1bmNhdGUocmV2ZXJzZWRTdHJpbmcsIG1heExlbmd0aCkpLnJldmVyc2UoKS5qb2luKFwiXCIpO1xufVxuXG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvamVjdERpc3BsYXlFbGVtZW50IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIHByb2plY3Q6IFByb2plY3RWaWV3TW9kZWw8YW55PjtcbiAgICBrZXk6IHN0cmluZztcbn1cblxuY29uc3QgZ2V0TWVzc2FnZUVsZW1lbnQgPSAoZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgcHJvamVjdFByb3BzID0ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIHByb2plY3QoKSB7IHJldHVybiB0aGlzLl9wcm9qZWN0OyB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIHByb2plY3QocHJvamVjdDogUHJvamVjdFZpZXdNb2RlbDxhbnk+KSB7XG4gICAgICAgICAgICB0aGlzLl9wcm9qZWN0ID0gcHJvamVjdDtcbiAgICAgICAgICAgIHRoaXMuX2tleSA9IHByb2plY3QucGF0aDtcblxuICAgICAgICAgICAgY29uc3QgcGF0aCA9IHRydW5jYXRlU3RyaW5nUmV2ZXJzZShwcm9qZWN0LnBhdGgucmVwbGFjZSh0aGlzLnByb2plY3Quc29sdXRpb25QYXRoLCBcIlwiKSwgMjQpO1xuICAgICAgICAgICAgdGhpcy50aXRsZSA9IGAke3BhdGh9IFske3Byb2plY3QuZnJhbWV3b3Jrcy5maWx0ZXIoeiA9PiB6Lk5hbWUgIT09IFwiYWxsXCIpLm1hcCh4ID0+IHguRnJpZW5kbHlOYW1lKX1dYDtcbiAgICAgICAgICAgIHRoaXMuaW5uZXJUZXh0ID0gcHJvamVjdC5uYW1lO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IGtleVByb3BzID0ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIGtleSgpIHsgcmV0dXJuIHRoaXMuX2tleTsgfVxuICAgIH07XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0TWVzc2FnZUVsZW1lbnQoKTogUHJvamVjdERpc3BsYXlFbGVtZW50IHtcbiAgICAgICAgY29uc3QgZWxlbWVudDogUHJvamVjdERpc3BsYXlFbGVtZW50ID0gPGFueT5kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJwcm9qZWN0XCIsIFwibmFtZVwiKTtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwicHJvamVjdFwiLCBwcm9qZWN0UHJvcHMpO1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudCwgXCJrZXlcIiwga2V5UHJvcHMpO1xuXG4gICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgIH07XG59KSgpO1xuXG5leHBvcnQgY2xhc3MgU29sdXRpb25TdGF0dXNDYXJkIGV4dGVuZHMgSFRNTERpdkVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xuICAgIHB1YmxpYyBkaXNwbGF5TmFtZSA9IFwiQ2FyZFwiO1xuXG4gICAgcHJpdmF0ZSBtb2RlbERpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG4gICAgcHVibGljIGF0dGFjaFRvOiBzdHJpbmc7XG5cbiAgICBwcml2YXRlIF9uYW1lOiBIVE1MU3BhbkVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBfcHJvamVjdHM6IEhUTUxEaXZFbGVtZW50O1xuICAgIHByaXZhdGUgX2J1dHRvbnM6IEhUTUxEaXZFbGVtZW50O1xuICAgIHByaXZhdGUgX2JvZHk6IEhUTUxFbGVtZW50O1xuXG4gICAgcHJpdmF0ZSBfc3RvcEJ0bjogSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBfc3RhcnRCdG46IEhUTUxCdXR0b25FbGVtZW50O1xuICAgIHByaXZhdGUgX3Jlc3RhcnRCdG46IEhUTUxCdXR0b25FbGVtZW50O1xuXG4gICAgcHJpdmF0ZSBfc3RhdHVzSXRlbTogSFRNTFNwYW5FbGVtZW50O1xuICAgIHByaXZhdGUgX3N0YXR1c1RleHQ6IEhUTUxTcGFuRWxlbWVudDtcbiAgICBwcml2YXRlIF9ydW50aW1lVGV4dDogSFRNTFNwYW5FbGVtZW50O1xuXG4gICAgcHJpdmF0ZSBfY291bnQ6IG51bWJlcjtcbiAgICBwdWJsaWMgZ2V0IGNvdW50KCkgeyByZXR1cm4gdGhpcy5fY291bnQ7IH1cbiAgICBwdWJsaWMgc2V0IGNvdW50KGNvdW50KSB7XG4gICAgICAgIGlmICh0aGlzLl9jb3VudCAhPT0gY291bnQpIHtcbiAgICAgICAgICAgIHRoaXMuX2NvdW50ID0gY291bnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX2NvdW50ID4gMSkge1xuICAgICAgICAgICAgdGhpcy5fYm9keS5wYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZSh0aGlzLl9idXR0b25zLCB0aGlzLl9ib2R5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2J1dHRvbnMucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9tb2RlbDogVmlld01vZGVsO1xuICAgIHB1YmxpYyBnZXQgbW9kZWwoKSB7IHJldHVybiB0aGlzLl9tb2RlbDsgfVxuICAgIHB1YmxpYyBzZXQgbW9kZWwobW9kZWwpIHtcbiAgICAgICAgdGhpcy5fbW9kZWwgPSBtb2RlbDtcbiAgICAgICAgdGhpcy5tb2RlbERpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICB0aGlzLm1vZGVsRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgICAgICAgdGhpcy5tb2RlbERpc3Bvc2FibGUuYWRkKHRoaXMuX21vZGVsLm9ic2VydmUuc3RhdGUuZGVsYXkoMTApLnN1YnNjcmliZSgoe2luZGV4LCBwYXRoLCAvKnJ1bnRpbWUsKi8gc3RhdGUsIGlzUmVhZHksIGlzT2ZmLCBpc09ufSkgPT4ge1xuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5hbWUgPSBgJHtiYXNlbmFtZShwYXRoKX0gKCR7aW5kZXh9KWA7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX25hbWUuaW5uZXJUZXh0ICE9PSBuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX25hbWUuaW5uZXJUZXh0ID0gbmFtZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT09IERyaXZlclN0YXRlLkNvbm5lY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9IFwiT25saW5lXCI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzdGF0ZSA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGluZykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9IFwiTG9hZGluZ1wiO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoc3RhdGUgPT09IERyaXZlclN0YXRlLkRpc2Nvbm5lY3RlZCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGF0dXNUZXh0LmlubmVyVGV4dCA9IFwiT2ZmbGluZVwiO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c1RleHQuaW5uZXJUZXh0ID0gRHJpdmVyU3RhdGVbc3RhdGVdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpc1JlYWR5KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fc3RvcEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGlzT2ZmKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0YXJ0QnRuLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdG9wQnRuLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9zdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3N0b3BCdG4uc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpc09uKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzdGFydEJ0bi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGlzT2ZmKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3Byb2plY3RzLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wcm9qZWN0cy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvL3RoaXMuX3N0YXR1c1RleHQuaW5uZXJUZXh0ID0gRHJpdmVyU3RhdGVbc3RhdGVdO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c0l0ZW0uY2xhc3NOYW1lID0gXCJwdWxsLWxlZnQgc3RhdHMtaXRlbVwiO1xuICAgICAgICAgICAgICAgIHRoaXMuX3N0YXR1c0l0ZW0uY2xhc3NMaXN0LmFkZChEcml2ZXJTdGF0ZVtzdGF0ZV0udG9Mb3dlckNhc2UoKSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnZlcmlmeVBvc2l0aW9uKCk7XG5cbiAgICAgICAgICAgICAgICAvKmlmIChydW50aW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3J1bnRpbWVUZXh0LnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ydW50aW1lVGV4dC5pbm5lclRleHQgPSBydW50aW1lO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7Ki9cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcnVudGltZVRleHQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ydW50aW1lVGV4dC5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgIC8qfSovXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlLmFkZCh0aGlzLl9tb2RlbC5vYnNlcnZlLnByb2plY3RzLnN1YnNjcmliZShwcm9qZWN0cyA9PiB7XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHRoaXMuX3Byb2plY3RzLmNoaWxkcmVuLmxlbmd0aCA+IHByb2plY3RzLmxlbmd0aCA/IHRoaXMuX3Byb2plY3RzLmNoaWxkcmVuLmxlbmd0aCA6IHByb2plY3RzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSBwcm9qZWN0c1tpXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNoaWxkOiBQcm9qZWN0RGlzcGxheUVsZW1lbnQgPSA8YW55PnRoaXMuX3Byb2plY3RzLmNoaWxkcmVuW2ldO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXRlbSAmJiBjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpdGVtICYmICFjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQgPSBnZXRNZXNzYWdlRWxlbWVudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fcHJvamVjdHMuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkICYmIGNoaWxkLmtleSAhPT0gaXRlbS5wYXRoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5wcm9qZWN0ID0gaXRlbTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMudmVyaWZ5UG9zaXRpb24oKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0TWV0YUNvbnRyb2xzKCkge1xuICAgICAgICB0aGlzLl9zdG9wQnRuID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgICAgdGhpcy5fc3RvcEJ0bi5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIFwiYnRuLXhzXCIsIFwiYnRuLWVycm9yXCIpO1xuICAgICAgICB0aGlzLl9zdG9wQnRuLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206c3RvcC1zZXJ2ZXJcIik7XG5cbiAgICAgICAgbGV0IHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgc3Bhbi5jbGFzc0xpc3QuYWRkKFwiZmFcIiwgXCJmYS1zdG9wXCIpO1xuICAgICAgICB0aGlzLl9zdG9wQnRuLmFwcGVuZENoaWxkKHNwYW4pO1xuICAgICAgICB0aGlzLl9zdG9wQnRuLmlubmVySFRNTCArPSBcIiBTdG9wXCI7XG5cbiAgICAgICAgdGhpcy5fc3RhcnRCdG4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYnV0dG9uXCIpO1xuICAgICAgICB0aGlzLl9zdGFydEJ0bi5jbGFzc0xpc3QuYWRkKFwiYnRuXCIsIFwiYnRuLXhzXCIsIFwiYnRuLXN1Y2Nlc3NcIik7XG4gICAgICAgIHRoaXMuX3N0YXJ0QnRuLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206c3RhcnQtc2VydmVyXCIpO1xuXG4gICAgICAgIHNwYW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgc3Bhbi5jbGFzc0xpc3QuYWRkKFwiZmFcIiwgXCJmYS1wbGF5XCIpO1xuICAgICAgICB0aGlzLl9zdGFydEJ0bi5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICAgICAgdGhpcy5fc3RhcnRCdG4uaW5uZXJIVE1MICs9IFwiIFN0YXJ0XCI7XG5cbiAgICAgICAgdGhpcy5fcmVzdGFydEJ0biA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJidXR0b25cIik7XG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImJ0bi14c1wiLCBcImJ0bi1pbmZvXCIpO1xuICAgICAgICB0aGlzLl9yZXN0YXJ0QnRuLm9uY2xpY2sgPSAoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206cmVzdGFydC1zZXJ2ZXJcIik7XG5cbiAgICAgICAgc3BhbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBzcGFuLmNsYXNzTGlzdC5hZGQoXCJmYVwiLCBcImZhLXJlZnJlc2hcIik7XG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uYXBwZW5kQ2hpbGQoc3Bhbik7XG4gICAgICAgIHRoaXMuX3Jlc3RhcnRCdG4uaW5uZXJIVE1MICs9IFwiIFJlc3RhcnRcIjtcblxuICAgICAgICBjb25zdCBtZXRhQ29udHJvbHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBtZXRhQ29udHJvbHMuY2xhc3NMaXN0LmFkZChcIm1ldGEtY29udHJvbHNcIik7XG5cbiAgICAgICAgY29uc3QgYnV0dG9uR3JvdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBidXR0b25Hcm91cC5jbGFzc0xpc3QuYWRkKFwiYnRuLWdyb3VwXCIpO1xuICAgICAgICBtZXRhQ29udHJvbHMuYXBwZW5kQ2hpbGQoYnV0dG9uR3JvdXApO1xuXG4gICAgICAgIGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkKHRoaXMuX3N0YXJ0QnRuKTtcbiAgICAgICAgYnV0dG9uR3JvdXAuYXBwZW5kQ2hpbGQodGhpcy5fc3RvcEJ0bik7XG4gICAgICAgIGJ1dHRvbkdyb3VwLmFwcGVuZENoaWxkKHRoaXMuX3Jlc3RhcnRCdG4pO1xuXG4gICAgICAgIHJldHVybiBtZXRhQ29udHJvbHM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0U3RhdHVzSXRlbSgpIHtcbiAgICAgICAgdGhpcy5fc3RhdHVzSXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0aGlzLl9zdGF0dXNJdGVtLmNsYXNzTGlzdC5hZGQoXCJwdWxsLWxlZnRcIiwgXCJzdGF0cy1pdGVtXCIpO1xuXG4gICAgICAgIGNvbnN0IHN0YXR1c0NvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0aGlzLl9zdGF0dXNJdGVtLmFwcGVuZENoaWxkKHN0YXR1c0NvbnRhaW5lcik7XG4gICAgICAgIGNvbnN0IGljb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgc3RhdHVzQ29udGFpbmVyLmFwcGVuZENoaWxkKGljb24pO1xuICAgICAgICBpY29uLmNsYXNzTGlzdC5hZGQoXCJpY29uXCIsIFwiaWNvbi16YXBcIik7XG5cbiAgICAgICAgdGhpcy5fc3RhdHVzVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBzdGF0dXNDb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5fc3RhdHVzVGV4dCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXR1c0l0ZW07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0VmVyc2lvbnMoKSB7XG4gICAgICAgIGNvbnN0IHZlcnNpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHZlcnNpb25zLmNsYXNzTGlzdC5hZGQoXCJwdWxsLXJpZ2h0XCIsIFwic3RhdHMtaXRlbVwiKTtcblxuICAgICAgICBjb25zdCBzcGFucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBzcGFucy5jbGFzc0xpc3QuYWRkKFwiaWNvblwiLCBcImljb24tdmVyc2lvbnNcIik7XG4gICAgICAgIHZlcnNpb25zLmFwcGVuZENoaWxkKHNwYW5zKTtcblxuICAgICAgICB0aGlzLl9ydW50aW1lVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB2ZXJzaW9ucy5hcHBlbmRDaGlsZCh0aGlzLl9ydW50aW1lVGV4dCk7XG5cbiAgICAgICAgcmV0dXJuIHZlcnNpb25zO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldEJvZHkoKSB7XG4gICAgICAgIGNvbnN0IGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB0aGlzLl9ib2R5ID0gYm9keTtcbiAgICAgICAgYm9keS5jbGFzc0xpc3QuYWRkKFwiYm9keVwiKTtcblxuICAgICAgICBjb25zdCBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaDRcIik7XG4gICAgICAgIGhlYWRlci5jbGFzc0xpc3QuYWRkKFwibmFtZVwiKTtcbiAgICAgICAgYm9keS5hcHBlbmRDaGlsZChoZWFkZXIpO1xuXG4gICAgICAgIHRoaXMuX25hbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgaGVhZGVyLmFwcGVuZENoaWxkKHRoaXMuX25hbWUpO1xuXG4gICAgICAgIGNvbnN0IHZlcnNpb25zID0gdGhpcy5fZ2V0VmVyc2lvbnMoKTtcbiAgICAgICAgYm9keS5hcHBlbmRDaGlsZCh2ZXJzaW9ucyk7XG5cbiAgICAgICAgY29uc3Qgc3RhdHVzSXRlbSA9IHRoaXMuX2dldFN0YXR1c0l0ZW0oKTtcbiAgICAgICAgYm9keS5hcHBlbmRDaGlsZChzdGF0dXNJdGVtKTtcblxuICAgICAgICBjb25zdCBtZXRhQ29udHJvbHMgPSB0aGlzLl9nZXRNZXRhQ29udHJvbHMoKTtcbiAgICAgICAgYm9keS5hcHBlbmRDaGlsZChtZXRhQ29udHJvbHMpO1xuXG4gICAgICAgIHJldHVybiBib2R5O1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldFByb2plY3RzKCkge1xuICAgICAgICB0aGlzLl9wcm9qZWN0cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX3Byb2plY3RzLmNsYXNzTGlzdC5hZGQoXCJtZXRhXCIsIFwibWV0YS1wcm9qZWN0c1wiKTtcblxuICAgICAgICBjb25zdCBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBoZWFkZXIuY2xhc3NMaXN0LmFkZChcImhlYWRlclwiKTtcbiAgICAgICAgaGVhZGVyLmlubmVyVGV4dCA9IFwiUHJvamVjdHNcIjtcblxuICAgICAgICByZXR1cm4gdGhpcy5fcHJvamVjdHM7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0QnV0dG9ucygpIHtcbiAgICAgICAgdGhpcy5fYnV0dG9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX2J1dHRvbnMuY2xhc3NMaXN0LmFkZChcInNlbGVjdG9yXCIsIFwiYnRuLWdyb3VwXCIsIFwiYnRuLWdyb3VwLXhzXCIpO1xuXG4gICAgICAgIGNvbnN0IGxlZnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICBsZWZ0LmNsYXNzTGlzdC5hZGQoXCJidG5cIiwgXCJidG4teHNcIiwgXCJpY29uXCIsIFwiaWNvbi10cmlhbmdsZS1sZWZ0XCIpO1xuICAgICAgICBsZWZ0Lm9uY2xpY2sgPSAoZSkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnByZXZpb3VzLXNvbHV0aW9uLXN0YXR1c1wiKTtcbiAgICAgICAgdGhpcy5fYnV0dG9ucy5hcHBlbmRDaGlsZChsZWZ0KTtcblxuICAgICAgICBjb25zdCByaWdodCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHJpZ2h0LmNsYXNzTGlzdC5hZGQoXCJidG5cIiwgXCJidG4teHNcIiwgXCJpY29uXCIsIFwiaWNvbi10cmlhbmdsZS1yaWdodFwiKTtcbiAgICAgICAgcmlnaHQub25jbGljayA9IChlKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206bmV4dC1zb2x1dGlvbi1zdGF0dXNcIik7XG4gICAgICAgIHRoaXMuX2J1dHRvbnMuYXBwZW5kQ2hpbGQocmlnaHQpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9idXR0b25zO1xuICAgIH1cblxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMubW9kZWxEaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcblxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJvbW5pc2hhcnAtY2FyZFwiKTtcblxuICAgICAgICB0aGlzLl9nZXRCdXR0b25zKCk7XG5cbiAgICAgICAgY29uc3QgYm9keSA9IHRoaXMuX2dldEJvZHkoKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChib2R5KTtcblxuICAgICAgICBjb25zdCBwcm9qZWN0cyA9IHRoaXMuX2dldFByb2plY3RzKCk7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQocHJvamVjdHMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLnZlcmlmeVBvc2l0aW9uKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHVwZGF0ZUNhcmQobW9kZWw6IFZpZXdNb2RlbCwgY291bnQ6IG51bWJlcikge1xuICAgICAgICB0aGlzLm1vZGVsID0gbW9kZWw7XG4gICAgICAgIHRoaXMuY291bnQgPSBjb3VudDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHZlcmlmeVBvc2l0aW9uKCkge1xuICAgICAgICBjb25zdCBvZmZzZXQgPSAkKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwodGhpcy5hdHRhY2hUbykpLm9mZnNldCgpO1xuICAgICAgICBpZiAob2Zmc2V0KSB7XG4gICAgICAgICAgICAkKHRoaXMpLmNzcyh7XG4gICAgICAgICAgICAgICAgcG9zaXRpb246IFwiZml4ZWRcIixcbiAgICAgICAgICAgICAgICB0b3A6IG9mZnNldC50b3AgLSB0aGlzLmNsaWVudEhlaWdodCxcbiAgICAgICAgICAgICAgICBsZWZ0OiBvZmZzZXQubGVmdFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbig8YW55PmV4cG9ydHMpLlNvbHV0aW9uU3RhdHVzQ2FyZCA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtc29sdXRpb24tY2FyZFwiLCB7IHByb3RvdHlwZTogU29sdXRpb25TdGF0dXNDYXJkLnByb3RvdHlwZSB9KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

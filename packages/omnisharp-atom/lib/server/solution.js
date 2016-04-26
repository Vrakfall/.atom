"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Solution = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _viewModel = require("./view-model");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Solution = function (_ClientV) {
    _inherits(Solution, _ClientV);

    function Solution(options) {
        _classCallCheck(this, Solution);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Solution).call(this, options));

        _this.temporary = false;
        _this._solutionDisposable = new _omnisharpClient.CompositeDisposable();
        _this._isFolderPerFile = false;
        _this.configureSolution();
        _this.temporary = options.temporary;
        _this.model = new _viewModel.ViewModel(_this);
        _this.path = options.projectPath;
        _this.index = options.index;
        _this.repository = options.repository;
        _this.setupRepository();
        _this._solutionDisposable.add(_this.model);
        _this.registerFixup(function (action, request, opts) {
            return _this._fixupRequest(action, request);
        });
        return _this;
    }

    _createClass(Solution, [{
        key: "connect",
        value: function connect() {
            if (this.isDisposed) return;
            if (this.currentState >= _omnisharpClient.DriverState.Downloading && this.currentState <= _omnisharpClient.DriverState.Connected) return;
            _get(Object.getPrototypeOf(Solution.prototype), "connect", this).call(this);
            this.log("Starting OmniSharp server (pid:" + this.id + ")");
            this.log("OmniSharp Location: " + this.serverPath);
            this.log("Change the location that OmniSharp is loaded from by setting the OMNISHARP environment variable");
            this.log("OmniSharp Path: " + this.projectPath);
        }
    }, {
        key: "disconnect",
        value: function disconnect() {
            _get(Object.getPrototypeOf(Solution.prototype), "disconnect", this).call(this);
            this.log("Omnisharp server stopped.");
        }
    }, {
        key: "dispose",
        value: function dispose() {
            _get(Object.getPrototypeOf(Solution.prototype), "dispose", this).call(this);
            this._solutionDisposable.dispose();
        }
    }, {
        key: "configureSolution",
        value: function configureSolution() {
            this.logs = this.events.map(function (event) {
                return {
                    message: event.Body && event.Body.Message || event.Event || "",
                    logLevel: event.Body && event.Body.LogLevel || event.Type === "error" && "ERROR" || "INFORMATION"
                };
            });
            this._solutionDisposable.add(this.errors.subscribe(function (exception) {
                console.error(exception);
            }));
            this._solutionDisposable.add(this.responses.subscribe(function (data) {
                if (atom.config.get("omnisharp-atom.developerMode")) {
                    console.log("omni:" + data.command, data.request, data.response);
                }
            }));
        }
    }, {
        key: "withEditor",
        value: function withEditor(editor) {
            this._currentEditor = editor;
            return this;
        }
    }, {
        key: "_fixupRequest",
        value: function _fixupRequest(action, request) {
            if (this._currentEditor && _lodash2.default.isObject(request)) {
                var editor = this._currentEditor;
                var marker = editor.getCursorBufferPosition();
                _lodash2.default.defaults(request, { Column: marker.column, Line: marker.row, FileName: editor.getURI(), Buffer: editor.getBuffer().getLines().join("\n") });
            }
            if (request["Buffer"]) {
                request["Buffer"] = request["Buffer"].replace(Solution._regex, "");
            }
        }
    }, {
        key: "request",
        value: function request(action, _request, options) {
            if (this._currentEditor) {
                var editor = this._currentEditor;
                this._currentEditor = null;
                if (editor.isDestroyed()) {
                    return _rxjs.Observable.empty();
                }
            }
            var tempR = _request;
            if (tempR && _lodash2.default.endsWith(tempR.FileName, ".json")) {
                tempR.Buffer = null;
                tempR.Changes = null;
            }
            return _get(Object.getPrototypeOf(Solution.prototype), "request", this).call(this, action, _request, options);
        }
    }, {
        key: "setupRepository",
        value: function setupRepository() {
            var _this2 = this;

            if (this.repository) {
                (function () {
                    var branchSubject = new _rxjs.Subject();
                    _this2._solutionDisposable.add(branchSubject.distinctUntilChanged().subscribe(function () {
                        return atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:restart-server");
                    }));
                    _this2._solutionDisposable.add(_this2.repository.onDidChangeStatuses(function () {
                        branchSubject.next(_this2.repository.branch);
                    }));
                })();
            }
        }
    }, {
        key: "whenConnected",
        value: function whenConnected() {
            return this.state.startWith(this.currentState).filter(function (x) {
                return x === _omnisharpClient.DriverState.Connected;
            }).take(1);
        }
    }, {
        key: "disposable",
        get: function get() {
            return this._solutionDisposable;
        }
    }, {
        key: "isDisposed",
        get: function get() {
            return this._solutionDisposable.isDisposed;
        }
    }, {
        key: "isFolderPerFile",
        get: function get() {
            return this._isFolderPerFile;
        },
        set: function set(value) {
            this._isFolderPerFile = value;
        }
    }]);

    return Solution;
}(_omnisharpClient.ClientV2);

exports.Solution = Solution;

Solution._regex = new RegExp(String.fromCharCode(0xFFFD), "g");
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvc29sdXRpb24uanMiLCJsaWIvc2VydmVyL3NvbHV0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBQUE7Ozs7QUFDQTs7QUFDQTs7QUFFQTs7Ozs7Ozs7OztJQ1NBLFE7OztBQWtCSSxzQkFBWSxPQUFaLEVBQW9DO0FBQUE7O0FBQUEsZ0dBQzFCLE9BRDBCOztBQVg3QixjQUFBLFNBQUEsR0FBcUIsS0FBckI7QUFDQyxjQUFBLG1CQUFBLEdBQXNCLDBDQUF0QjtBQU1BLGNBQUEsZ0JBQUEsR0FBbUIsS0FBbkI7QUFNSixjQUFLLGlCQUFMO0FBQ0EsY0FBSyxTQUFMLEdBQWlCLFFBQVEsU0FBekI7QUFDQSxjQUFLLEtBQUwsR0FBYSwrQkFBYjtBQUNBLGNBQUssSUFBTCxHQUFZLFFBQVEsV0FBcEI7QUFDQSxjQUFLLEtBQUwsR0FBYSxRQUFRLEtBQXJCO0FBQ0EsY0FBSyxVQUFMLEdBQWtCLFFBQVEsVUFBMUI7QUFDQSxjQUFLLGVBQUw7QUFDQSxjQUFLLG1CQUFMLENBQXlCLEdBQXpCLENBQTZCLE1BQUssS0FBbEM7QUFFQSxjQUFLLGFBQUwsQ0FBbUIsVUFBQyxNQUFELEVBQWlCLE9BQWpCLEVBQStCLElBQS9CO0FBQUEsbUJBQXlELE1BQUssYUFBTCxDQUFtQixNQUFuQixFQUEyQixPQUEzQixDQUF6RDtBQUFBLFNBQW5CO0FBWGdDO0FBWW5DOzs7O2tDQUVhO0FBQ1YsZ0JBQUksS0FBSyxVQUFULEVBQXFCO0FBQ3JCLGdCQUFJLEtBQUssWUFBTCxJQUFxQiw2QkFBWSxXQUFqQyxJQUFnRCxLQUFLLFlBQUwsSUFBcUIsNkJBQVksU0FBckYsRUFBZ0c7QUFDaEc7QUFFQSxpQkFBSyxHQUFMLENBQVMsb0NBQW9DLEtBQUssRUFBekMsR0FBOEMsR0FBdkQ7QUFDQSxpQkFBSyxHQUFMLENBQVMseUJBQXlCLEtBQUssVUFBdkM7QUFDQSxpQkFBSyxHQUFMLENBQVMsaUdBQVQ7QUFDQSxpQkFBSyxHQUFMLENB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QVcsT0FBWCxDQUFtQixLQUFLLFNBQXhCLENBQXZCLEVBQTJELCtCQUEzRCxDQUFOO0FBQUEscUJBRmMsQ0FBN0I7QUFJQSwyQkFBSyxtQkFBTCxDQUF5QixHQUF6QixDQUE2QixPQUFLLFVBQUwsQ0FBZ0IsbUJBQWhCLENBQW9DLFlBQUE7QUFDN0Qsc0NBQWMsSUFBZCxDQUF5QixPQUFLLFVBQUwsQ0FBaUIsTUFBMUM7QUFDSCxxQkFGNEIsQ0FBN0I7QUFQaUI7QUFVcEI7QUFDSjs7O3dDQUVtQjtBQUNoQixtQkFBTyxLQUFLLEtBQUwsQ0FBVyxTQUFYLENBQXFCLEtBQUssWUFBMUIsRUFDRixNQURFLENBQ0s7QUFBQSx1QkFBSyxNQUFNLDZCQUFZLFNBQXZCO0FBQUEsYUFETCxFQUVGLElBRkUsQ0FFRyxDQUZILENBQVA7QUFHSDs7OzRCQTVJb0I7QUFBSyxtQkFBTyxLQUFLLG1CQUFaO0FBQWtDOzs7NEJBR3ZDO0FBQUssbUJBQU8sS0FBSyxtQkFBTCxDQUF5QixVQUFoQztBQUE2Qzs7OzRCQUc3QztBQUFLLG1CQUFPLEtBQUssZ0JBQVo7QUFBK0IsUzswQkFDbkMsSyxFQUFLO0FBQUksaUJBQUssZ0JBQUwsR0FBd0IsS0FBeEI7QUFBZ0M7Ozs7Ozs7O0FBZnJELFNBQUEsTUFBQSxHQUFTLElBQUksTUFBSixDQUFXLE9BQU8sWUFBUCxDQUFvQixNQUFwQixDQUFYLEVBQXdDLEdBQXhDLENBQVQiLCJmaWxlIjoibGliL3NlcnZlci9zb2x1dGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9ic2VydmFibGUsIFN1YmplY3QgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBDbGllbnRWMiwgRHJpdmVyU3RhdGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgVmlld01vZGVsIH0gZnJvbSBcIi4vdmlldy1tb2RlbFwiO1xuZXhwb3J0IGNsYXNzIFNvbHV0aW9uIGV4dGVuZHMgQ2xpZW50VjIge1xuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIob3B0aW9ucyk7XG4gICAgICAgIHRoaXMudGVtcG9yYXJ5ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuX2lzRm9sZGVyUGVyRmlsZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmNvbmZpZ3VyZVNvbHV0aW9uKCk7XG4gICAgICAgIHRoaXMudGVtcG9yYXJ5ID0gb3B0aW9ucy50ZW1wb3Jhcnk7XG4gICAgICAgIHRoaXMubW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMpO1xuICAgICAgICB0aGlzLnBhdGggPSBvcHRpb25zLnByb2plY3RQYXRoO1xuICAgICAgICB0aGlzLmluZGV4ID0gb3B0aW9ucy5pbmRleDtcbiAgICAgICAgdGhpcy5yZXBvc2l0b3J5ID0gb3B0aW9ucy5yZXBvc2l0b3J5O1xuICAgICAgICB0aGlzLnNldHVwUmVwb3NpdG9yeSgpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuYWRkKHRoaXMubW9kZWwpO1xuICAgICAgICB0aGlzLnJlZ2lzdGVyRml4dXAoKGFjdGlvbiwgcmVxdWVzdCwgb3B0cykgPT4gdGhpcy5fZml4dXBSZXF1ZXN0KGFjdGlvbiwgcmVxdWVzdCkpO1xuICAgIH1cbiAgICBnZXQgZGlzcG9zYWJsZSgpIHsgcmV0dXJuIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZTsgfVxuICAgIGdldCBpc0Rpc3Bvc2VkKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmlzRGlzcG9zZWQ7IH1cbiAgICBnZXQgaXNGb2xkZXJQZXJGaWxlKCkgeyByZXR1cm4gdGhpcy5faXNGb2xkZXJQZXJGaWxlOyB9XG4gICAgc2V0IGlzRm9sZGVyUGVyRmlsZSh2YWx1ZSkgeyB0aGlzLl9pc0ZvbGRlclBlckZpbGUgPSB2YWx1ZTsgfVxuICAgIGNvbm5lY3QoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzRGlzcG9zZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRTdGF0ZSA+PSBEcml2ZXJTdGF0ZS5Eb3dubG9hZGluZyAmJiB0aGlzLmN1cnJlbnRTdGF0ZSA8PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHN1cGVyLmNvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5sb2coXCJTdGFydGluZyBPbW5pU2hhcnAgc2VydmVyIChwaWQ6XCIgKyB0aGlzLmlkICsgXCIpXCIpO1xuICAgICAgICB0aGlzLmxvZyhcIk9tbmlTaGFycCBMb2NhdGlvbjogXCIgKyB0aGlzLnNlcnZlclBhdGgpO1xuICAgICAgICB0aGlzLmxvZyhcIkNoYW5nZSB0aGUgbG9jYXRpb24gdGhhdCBPbW5pU2hhcnAgaXMgbG9hZGVkIGZyb20gYnkgc2V0dGluZyB0aGUgT01OSVNIQVJQIGVudmlyb25tZW50IHZhcmlhYmxlXCIpO1xuICAgICAgICB0aGlzLmxvZyhcIk9tbmlTaGFycCBQYXRoOiBcIiArIHRoaXMucHJvamVjdFBhdGgpO1xuICAgIH1cbiAgICBkaXNjb25uZWN0KCkge1xuICAgICAgICBzdXBlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMubG9nKFwiT21uaXNoYXJwIHNlcnZlciBzdG9wcGVkLlwiKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgc3VwZXIuZGlzcG9zZSgpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBjb25maWd1cmVTb2x1dGlvbigpIHtcbiAgICAgICAgdGhpcy5sb2dzID0gdGhpcy5ldmVudHMubWFwKGV2ZW50ID0+ICh7XG4gICAgICAgICAgICBtZXNzYWdlOiBldmVudC5Cb2R5ICYmIGV2ZW50LkJvZHkuTWVzc2FnZSB8fCBldmVudC5FdmVudCB8fCBcIlwiLFxuICAgICAgICAgICAgbG9nTGV2ZWw6IGV2ZW50LkJvZHkgJiYgZXZlbnQuQm9keS5Mb2dMZXZlbCB8fCAoZXZlbnQuVHlwZSA9PT0gXCJlcnJvclwiICYmIFwiRVJST1JcIikgfHwgXCJJTkZPUk1BVElPTlwiXG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmFkZCh0aGlzLmVycm9ycy5zdWJzY3JpYmUoZXhjZXB0aW9uID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXhjZXB0aW9uKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuYWRkKHRoaXMucmVzcG9uc2VzLnN1YnNjcmliZShkYXRhID0+IHtcbiAgICAgICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoXCJvbW5pc2hhcnAtYXRvbS5kZXZlbG9wZXJNb2RlXCIpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJvbW5pOlwiICsgZGF0YS5jb21tYW5kLCBkYXRhLnJlcXVlc3QsIGRhdGEucmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfVxuICAgIHdpdGhFZGl0b3IoZWRpdG9yKSB7XG4gICAgICAgIHRoaXMuX2N1cnJlbnRFZGl0b3IgPSBlZGl0b3I7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBfZml4dXBSZXF1ZXN0KGFjdGlvbiwgcmVxdWVzdCkge1xuICAgICAgICBpZiAodGhpcy5fY3VycmVudEVkaXRvciAmJiBfLmlzT2JqZWN0KHJlcXVlc3QpKSB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLl9jdXJyZW50RWRpdG9yO1xuICAgICAgICAgICAgY29uc3QgbWFya2VyID0gZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XG4gICAgICAgICAgICBfLmRlZmF1bHRzKHJlcXVlc3QsIHsgQ29sdW1uOiBtYXJrZXIuY29sdW1uLCBMaW5lOiBtYXJrZXIucm93LCBGaWxlTmFtZTogZWRpdG9yLmdldFVSSSgpLCBCdWZmZXI6IGVkaXRvci5nZXRCdWZmZXIoKS5nZXRMaW5lcygpLmpvaW4oXCJcXG5cIikgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlcXVlc3RbXCJCdWZmZXJcIl0pIHtcbiAgICAgICAgICAgIHJlcXVlc3RbXCJCdWZmZXJcIl0gPSByZXF1ZXN0W1wiQnVmZmVyXCJdLnJlcGxhY2UoU29sdXRpb24uX3JlZ2V4LCBcIlwiKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXF1ZXN0KGFjdGlvbiwgcmVxdWVzdCwgb3B0aW9ucykge1xuICAgICAgICBpZiAodGhpcy5fY3VycmVudEVkaXRvcikge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gdGhpcy5fY3VycmVudEVkaXRvcjtcbiAgICAgICAgICAgIHRoaXMuX2N1cnJlbnRFZGl0b3IgPSBudWxsO1xuICAgICAgICAgICAgaWYgKGVkaXRvci5pc0Rlc3Ryb3llZCgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuZW1wdHkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0ZW1wUiA9IHJlcXVlc3Q7XG4gICAgICAgIGlmICh0ZW1wUiAmJiBfLmVuZHNXaXRoKHRlbXBSLkZpbGVOYW1lLCBcIi5qc29uXCIpKSB7XG4gICAgICAgICAgICB0ZW1wUi5CdWZmZXIgPSBudWxsO1xuICAgICAgICAgICAgdGVtcFIuQ2hhbmdlcyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN1cGVyLnJlcXVlc3QoYWN0aW9uLCByZXF1ZXN0LCBvcHRpb25zKTtcbiAgICB9XG4gICAgc2V0dXBSZXBvc2l0b3J5KCkge1xuICAgICAgICBpZiAodGhpcy5yZXBvc2l0b3J5KSB7XG4gICAgICAgICAgICBjb25zdCBicmFuY2hTdWJqZWN0ID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQoYnJhbmNoU3ViamVjdFxuICAgICAgICAgICAgICAgIC5kaXN0aW5jdFVudGlsQ2hhbmdlZCgpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIFwib21uaXNoYXJwLWF0b206cmVzdGFydC1zZXJ2ZXJcIikpKTtcbiAgICAgICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5hZGQodGhpcy5yZXBvc2l0b3J5Lm9uRGlkQ2hhbmdlU3RhdHVzZXMoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGJyYW5jaFN1YmplY3QubmV4dCh0aGlzLnJlcG9zaXRvcnkuYnJhbmNoKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB3aGVuQ29ubmVjdGVkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zdGF0ZS5zdGFydFdpdGgodGhpcy5jdXJyZW50U3RhdGUpXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4geCA9PT0gRHJpdmVyU3RhdGUuQ29ubmVjdGVkKVxuICAgICAgICAgICAgLnRha2UoMSk7XG4gICAgfVxufVxuU29sdXRpb24uX3JlZ2V4ID0gbmV3IFJlZ0V4cChTdHJpbmcuZnJvbUNoYXJDb2RlKDB4RkZGRCksIFwiZ1wiKTtcbiIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7TW9kZWxzLCBSZXF1ZXN0T3B0aW9ucywgQ2xpZW50VjIsIERyaXZlclN0YXRlLCBPbW5pc2hhcnBDbGllbnRPcHRpb25zfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuXG5pbnRlcmZhY2UgU29sdXRpb25PcHRpb25zIGV4dGVuZHMgT21uaXNoYXJwQ2xpZW50T3B0aW9ucyB7XG4gICAgdGVtcG9yYXJ5OiBib29sZWFuO1xuICAgIHJlcG9zaXRvcnk6IEF0b20uR2l0UmVwb3NpdG9yeTtcbiAgICBpbmRleDogbnVtYmVyO1xufVxuXG5pbXBvcnQge1ZpZXdNb2RlbH0gZnJvbSBcIi4vdmlldy1tb2RlbFwiO1xuXG5leHBvcnQgY2xhc3MgU29sdXRpb24gZXh0ZW5kcyBDbGllbnRWMiB7XG4gICAgcHJpdmF0ZSBzdGF0aWMgX3JlZ2V4ID0gbmV3IFJlZ0V4cChTdHJpbmcuZnJvbUNoYXJDb2RlKDB4RkZGRCksIFwiZ1wiKTtcblxuICAgIHB1YmxpYyBtb2RlbDogVmlld01vZGVsO1xuICAgIHB1YmxpYyBsb2dzOiBPYnNlcnZhYmxlPE91dHB1dE1lc3NhZ2U+O1xuICAgIHB1YmxpYyBwYXRoOiBzdHJpbmc7XG4gICAgcHVibGljIGluZGV4OiBudW1iZXI7XG4gICAgcHVibGljIHRlbXBvcmFyeTogYm9vbGVhbiA9IGZhbHNlO1xuICAgIHByaXZhdGUgX3NvbHV0aW9uRGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgcHVibGljIGdldCBkaXNwb3NhYmxlKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlOyB9XG5cbiAgICBwcml2YXRlIHJlcG9zaXRvcnk6IEF0b20uR2l0UmVwb3NpdG9yeTtcbiAgICBwdWJsaWMgZ2V0IGlzRGlzcG9zZWQoKSB7IHJldHVybiB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuaXNEaXNwb3NlZDsgfVxuXG4gICAgcHJpdmF0ZSBfaXNGb2xkZXJQZXJGaWxlID0gZmFsc2U7XG4gICAgcHVibGljIGdldCBpc0ZvbGRlclBlckZpbGUoKSB7IHJldHVybiB0aGlzLl9pc0ZvbGRlclBlckZpbGU7IH1cbiAgICBwdWJsaWMgc2V0IGlzRm9sZGVyUGVyRmlsZSh2YWx1ZSkgeyB0aGlzLl9pc0ZvbGRlclBlckZpbGUgPSB2YWx1ZTsgfVxuXG4gICAgY29uc3RydWN0b3Iob3B0aW9uczogU29sdXRpb25PcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmNvbmZpZ3VyZVNvbHV0aW9uKCk7XG4gICAgICAgIHRoaXMudGVtcG9yYXJ5ID0gb3B0aW9ucy50ZW1wb3Jhcnk7XG4gICAgICAgIHRoaXMubW9kZWwgPSBuZXcgVmlld01vZGVsKHRoaXMpO1xuICAgICAgICB0aGlzLnBhdGggPSBvcHRpb25zLnByb2plY3RQYXRoO1xuICAgICAgICB0aGlzLmluZGV4ID0gb3B0aW9ucy5pbmRleDtcbiAgICAgICAgdGhpcy5yZXBvc2l0b3J5ID0gb3B0aW9ucy5yZXBvc2l0b3J5O1xuICAgICAgICB0aGlzLnNldHVwUmVwb3NpdG9yeSgpO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuYWRkKHRoaXMubW9kZWwpO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJGaXh1cCgoYWN0aW9uOiBzdHJpbmcsIHJlcXVlc3Q6IGFueSwgb3B0cz86IFJlcXVlc3RPcHRpb25zKSA9PiB0aGlzLl9maXh1cFJlcXVlc3QoYWN0aW9uLCByZXF1ZXN0KSk7XG4gICAgfVxuXG4gICAgcHVibGljIGNvbm5lY3QoKSB7XG4gICAgICAgIGlmICh0aGlzLmlzRGlzcG9zZWQpIHJldHVybjtcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFN0YXRlID49IERyaXZlclN0YXRlLkRvd25sb2FkaW5nICYmIHRoaXMuY3VycmVudFN0YXRlIDw9IERyaXZlclN0YXRlLkNvbm5lY3RlZCkgcmV0dXJuO1xuICAgICAgICBzdXBlci5jb25uZWN0KCk7XG5cbiAgICAgICAgdGhpcy5sb2coXCJTdGFydGluZyBPbW5pU2hhcnAgc2VydmVyIChwaWQ6XCIgKyB0aGlzLmlkICsgXCIpXCIpO1xuICAgICAgICB0aGlzLmxvZyhcIk9tbmlTaGFycCBMb2NhdGlvbjogXCIgKyB0aGlzLnNlcnZlclBhdGgpO1xuICAgICAgICB0aGlzLmxvZyhcIkNoYW5nZSB0aGUgbG9jYXRpb24gdGhhdCBPbW5pU2hhcnAgaXMgbG9hZGVkIGZyb20gYnkgc2V0dGluZyB0aGUgT01OSVNIQVJQIGVudmlyb25tZW50IHZhcmlhYmxlXCIpO1xuICAgICAgICB0aGlzLmxvZyhcIk9tbmlTaGFycCBQYXRoOiBcIiArIHRoaXMucHJvamVjdFBhdGgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkaXNjb25uZWN0KCkge1xuICAgICAgICBzdXBlci5kaXNjb25uZWN0KCk7XG5cbiAgICAgICAgdGhpcy5sb2coXCJPbW5pc2hhcnAgc2VydmVyIHN0b3BwZWQuXCIpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xuICAgICAgICBzdXBlci5kaXNwb3NlKCk7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9uRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjb25maWd1cmVTb2x1dGlvbigpIHtcbiAgICAgICAgdGhpcy5sb2dzID0gdGhpcy5ldmVudHMubWFwKGV2ZW50ID0+ICh7XG4gICAgICAgICAgICBtZXNzYWdlOiBldmVudC5Cb2R5ICYmIGV2ZW50LkJvZHkuTWVzc2FnZSB8fCBldmVudC5FdmVudCB8fCBcIlwiLFxuICAgICAgICAgICAgbG9nTGV2ZWw6IGV2ZW50LkJvZHkgJiYgZXZlbnQuQm9keS5Mb2dMZXZlbCB8fCAoZXZlbnQuVHlwZSA9PT0gXCJlcnJvclwiICYmIFwiRVJST1JcIikgfHwgXCJJTkZPUk1BVElPTlwiXG4gICAgICAgIH0pKTtcblxuICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuYWRkKHRoaXMuZXJyb3JzLnN1YnNjcmliZShleGNlcHRpb24gPT4ge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihleGNlcHRpb24pO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmFkZCh0aGlzLnJlc3BvbnNlcy5zdWJzY3JpYmUoZGF0YSA9PiB7XG4gICAgICAgICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KFwib21uaXNoYXJwLWF0b20uZGV2ZWxvcGVyTW9kZVwiKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwib21uaTpcIiArIGRhdGEuY29tbWFuZCwgZGF0YS5yZXF1ZXN0LCBkYXRhLnJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2N1cnJlbnRFZGl0b3I6IEF0b20uVGV4dEVkaXRvcjtcbiAgICBwdWJsaWMgd2l0aEVkaXRvcihlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xuICAgICAgICB0aGlzLl9jdXJyZW50RWRpdG9yID0gZWRpdG9yO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcHJpdmF0ZSBfZml4dXBSZXF1ZXN0PFRSZXF1ZXN0LCBUUmVzcG9uc2U+KGFjdGlvbjogc3RyaW5nLCByZXF1ZXN0OiBUUmVxdWVzdCkge1xuICAgICAgICAvLyBPbmx5IHNlbmQgY2hhbmdlcyBmb3IgcmVxdWVzdHMgdGhhdCByZWFsbHkgbmVlZCB0aGVtLlxuICAgICAgICBpZiAodGhpcy5fY3VycmVudEVkaXRvciAmJiBfLmlzT2JqZWN0KHJlcXVlc3QpKSB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLl9jdXJyZW50RWRpdG9yO1xuXG4gICAgICAgICAgICBjb25zdCBtYXJrZXIgPSBlZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcbiAgICAgICAgICAgIF8uZGVmYXVsdHMocmVxdWVzdCwgeyBDb2x1bW46IG1hcmtlci5jb2x1bW4sIExpbmU6IG1hcmtlci5yb3csIEZpbGVOYW1lOiBlZGl0b3IuZ2V0VVJJKCksIEJ1ZmZlcjogZWRpdG9yLmdldEJ1ZmZlcigpLmdldExpbmVzKCkuam9pbihcIlxcblwiKSB9KTtcbiAgICAgICAgICAgIC8qXG4gICAgICAgICAgICBUT0RPOiBVcGRhdGUgb25jZSByZW5hbWUvY29kZSBhY3Rpb25zIGRvblwidCBhcHBseSBjaGFuZ2VzIHRvIHRoZSB3b3Jrc3BhY2VcbiAgICAgICAgICAgIGNvbnN0IG9tbmlDaGFuZ2VzOiB7IG9sZFJhbmdlOiB7IHN0YXJ0OiBUZXh0QnVmZmVyLlBvaW50LCBlbmQ6IFRleHRCdWZmZXIuUG9pbnQgfTsgbmV3UmFuZ2U6IHsgc3RhcnQ6IFRleHRCdWZmZXIuUG9pbnQsIGVuZDogVGV4dEJ1ZmZlci5Qb2ludCB9OyBvbGRUZXh0OiBzdHJpbmc7IG5ld1RleHQ6IHN0cmluZzsgfVtdID0gKDxhbnk+ZWRpdG9yKS5fX29tbmlDaGFuZ2VzX18gfHwgW107XG4gICAgICAgICAgICBjb25zdCBjb21wdXRlZENoYW5nZXM6IE1vZGVscy5MaW5lUG9zaXRpb25TcGFuVGV4dENoYW5nZVtdO1xuXG4gICAgICAgICAgICBpZiAoXy5zb21lKFtcImdvdG9cIiwgXCJuYXZpZ2F0ZVwiLCBcImZpbmRcIiwgXCJwYWNrYWdlXCJdLCB4ID0+IF8uc3RhcnRzV2l0aChhY3Rpb24sIHgpKSkge1xuICAgICAgICAgICAgICAgIGNvbXB1dGVkQ2hhbmdlcyA9IG51bGw7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbXB1dGVkQ2hhbmdlcyA9IG9tbmlDaGFuZ2VzLm1hcChjaGFuZ2UgPT4gPE1vZGVscy5MaW5lUG9zaXRpb25TcGFuVGV4dENoYW5nZT57XG4gICAgICAgICAgICAgICAgICAgIE5ld1RleHQ6IGNoYW5nZS5uZXdUZXh0LFxuICAgICAgICAgICAgICAgICAgICBTdGFydExpbmU6IGNoYW5nZS5vbGRSYW5nZS5zdGFydC5yb3csXG4gICAgICAgICAgICAgICAgICAgIFN0YXJ0Q29sdW1uOiBjaGFuZ2Uub2xkUmFuZ2Uuc3RhcnQuY29sdW1uLFxuICAgICAgICAgICAgICAgICAgICBFbmRMaW5lOiBjaGFuZ2Uub2xkUmFuZ2UuZW5kLnJvdyxcbiAgICAgICAgICAgICAgICAgICAgRW5kQ29sdW1uOiBjaGFuZ2Uub2xkUmFuZ2UuZW5kLmNvbHVtblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBvbW5pQ2hhbmdlcy5zcGxpY2UoMCwgb21uaUNoYW5nZXMubGVuZ3RoKTtcbiAgICAgICAgICAgIF8uZGVmYXVsdHMocmVxdWVzdCwgeyBDaGFuZ2VzOiBjb21wdXRlZENoYW5nZXMgfSk7XG4gICAgICAgICAgICAqL1xuICAgICAgICB9XG5cbiAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cbiAgICAgICAgaWYgKHJlcXVlc3RbXCJCdWZmZXJcIl0pIHtcbiAgICAgICAgICAgIHJlcXVlc3RbXCJCdWZmZXJcIl0gPSByZXF1ZXN0W1wiQnVmZmVyXCJdLnJlcGxhY2UoU29sdXRpb24uX3JlZ2V4LCBcIlwiKTtcbiAgICAgICAgfVxuICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLXN0cmluZy1saXRlcmFsICovXG4gICAgfVxuXG4gICAgcHVibGljIHJlcXVlc3Q8VFJlcXVlc3QsIFRSZXNwb25zZT4oYWN0aW9uOiBzdHJpbmcsIHJlcXVlc3Q/OiBUUmVxdWVzdCwgb3B0aW9ucz86IFJlcXVlc3RPcHRpb25zKTogT2JzZXJ2YWJsZTxUUmVzcG9uc2U+IHtcbiAgICAgICAgaWYgKHRoaXMuX2N1cnJlbnRFZGl0b3IpIHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuX2N1cnJlbnRFZGl0b3I7XG4gICAgICAgICAgICB0aGlzLl9jdXJyZW50RWRpdG9yID0gbnVsbDtcbiAgICAgICAgICAgIC8vIFRPRE86IHVwZGF0ZSBhbmQgYWRkIHRvIHR5cGluZ3MuXG4gICAgICAgICAgICBpZiAoZWRpdG9yLmlzRGVzdHJveWVkKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gT2JzZXJ2YWJsZS5lbXB0eTxUUmVzcG9uc2U+KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0ZW1wUjogTW9kZWxzLlJlcXVlc3QgPSByZXF1ZXN0O1xuICAgICAgICBpZiAodGVtcFIgJiYgXy5lbmRzV2l0aCh0ZW1wUi5GaWxlTmFtZSwgXCIuanNvblwiKSkge1xuICAgICAgICAgICAgdGVtcFIuQnVmZmVyID0gbnVsbDtcbiAgICAgICAgICAgIHRlbXBSLkNoYW5nZXMgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN1cGVyLnJlcXVlc3Q8VFJlcXVlc3QsIFRSZXNwb25zZT4oYWN0aW9uLCByZXF1ZXN0LCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldHVwUmVwb3NpdG9yeSgpIHtcbiAgICAgICAgaWYgKHRoaXMucmVwb3NpdG9yeSkge1xuICAgICAgICAgICAgY29uc3QgYnJhbmNoU3ViamVjdCA9IG5ldyBTdWJqZWN0PHN0cmluZz4oKTtcblxuICAgICAgICAgICAgdGhpcy5fc29sdXRpb25EaXNwb3NhYmxlLmFkZChicmFuY2hTdWJqZWN0XG4gICAgICAgICAgICAgICAgLmRpc3RpbmN0VW50aWxDaGFuZ2VkKClcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpyZXN0YXJ0LXNlcnZlclwiKSkpO1xuXG4gICAgICAgICAgICB0aGlzLl9zb2x1dGlvbkRpc3Bvc2FibGUuYWRkKHRoaXMucmVwb3NpdG9yeS5vbkRpZENoYW5nZVN0YXR1c2VzKCgpID0+IHtcbiAgICAgICAgICAgICAgICBicmFuY2hTdWJqZWN0Lm5leHQoKDxhbnk+dGhpcy5yZXBvc2l0b3J5KS5icmFuY2gpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHdoZW5Db25uZWN0ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXRlLnN0YXJ0V2l0aCh0aGlzLmN1cnJlbnRTdGF0ZSlcbiAgICAgICAgICAgIC5maWx0ZXIoeCA9PiB4ID09PSBEcml2ZXJTdGF0ZS5Db25uZWN0ZWQpXG4gICAgICAgICAgICAudGFrZSgxKTtcbiAgICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

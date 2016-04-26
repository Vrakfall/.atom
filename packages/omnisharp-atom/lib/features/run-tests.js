"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.runTests = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

var _dock = require("../atom/dock");

var _testResultsWindow = require("../views/test-results-window");

var _child_process = require("child_process");

var childProcess = _interopRequireWildcard(_child_process);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TestCommandType;
(function (TestCommandType) {
    TestCommandType[TestCommandType["All"] = 0] = "All";
    TestCommandType[TestCommandType["Fixture"] = 1] = "Fixture";
    TestCommandType[TestCommandType["Single"] = 2] = "Single";
})(TestCommandType || (TestCommandType = {}));

var RunTests = function () {
    function RunTests() {
        _classCallCheck(this, RunTests);

        this.testResults = [];
        this.required = true;
        this.title = "Test Runner";
        this.description = "Adds support for running tests within atom.";
    }

    _createClass(RunTests, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this._testWindow = new _testResultsWindow.TestResultsWindow();
            var output = new _rxjs.Subject();
            this.observe = {
                output: output
            };
            this.disposable.add(_omni.Omni.listener.gettestcontext.subscribe(function (data) {
                _this.ensureWindowIsCreated();
                _this.executeTests(data.response);
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:run-all-tests", function () {
                _this.makeRequest(TestCommandType.All);
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:run-fixture-tests", function () {
                _this.makeRequest(TestCommandType.Fixture);
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:run-single-test", function () {
                _this.makeRequest(TestCommandType.Single);
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:run-last-test", function () {
                _this.executeTests(_this.lastRun);
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "makeRequest",
        value: function makeRequest(type) {
            _omni.Omni.request(function (solution) {
                return solution.gettestcontext({ Type: type });
            });
        }
    }, {
        key: "executeTests",
        value: function executeTests(response) {
            var _this2 = this;

            this.testResults.length = 0;
            this.lastRun = response;
            this._testWindow.clear();
            var child = childProcess.exec(response.TestCommand, { cwd: response.Directory });
            child.stdout.on("data", function (data) {
                _this2._testWindow.addMessage({ message: data, logLevel: "" });
            });
            child.stderr.on("data", function (data) {
                _this2._testWindow.addMessage({ message: data, logLevel: "fail" });
            });
            _dock.dock.selectWindow("test-output");
        }
    }, {
        key: "ensureWindowIsCreated",
        value: function ensureWindowIsCreated() {
            var _this3 = this;

            if (!this.window) {
                this.window = new _omnisharpClient.CompositeDisposable();
                var windowDisposable = _dock.dock.addWindow("test-output", "Test output", this._testWindow, { priority: 2000, closeable: true }, this.window);
                this.window.add(windowDisposable);
                this.window.add(_omnisharpClient.Disposable.create(function () {
                    _this3.disposable.remove(_this3.window);
                    _this3.window = null;
                }));
                this.disposable.add(this.window);
            }
        }
    }]);

    return RunTests;
}();

var runTests = exports.runTests = new RunTests();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9ydW4tdGVzdHMuanMiLCJsaWIvZmVhdHVyZXMvcnVuLXRlc3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztJQ0NZLFk7Ozs7OztBQUdaLElBQUssZUFBTDtBQUFBLENBQUEsVUFBSyxlQUFMLEVBQW9CO0FBQ2hCLG9CQUFBLGdCQUFBLEtBQUEsSUFBQSxDQUFBLElBQUEsS0FBQTtBQUNBLG9CQUFBLGdCQUFBLFNBQUEsSUFBQSxDQUFBLElBQUEsU0FBQTtBQUNBLG9CQUFBLGdCQUFBLFFBQUEsSUFBQSxDQUFBLElBQUEsUUFBQTtBQUNILENBSkQsRUFBSyxvQkFBQSxrQkFBZSxFQUFmLENBQUw7O0lBTUEsUTtBQUFBLHdCQUFBO0FBQUE7O0FBR1csYUFBQSxXQUFBLEdBQStCLEVBQS9CO0FBZ0ZBLGFBQUEsUUFBQSxHQUFXLElBQVg7QUFDQSxhQUFBLEtBQUEsR0FBUSxhQUFSO0FBQ0EsYUFBQSxXQUFBLEdBQWMsNkNBQWQ7QUFDVjs7OzttQ0EzRWtCO0FBQUE7O0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEI7QUFDQSxpQkFBSyxXQUFMLEdBQW1CLDBDQUFuQjtBQUVBLGdCQUFNLFNBQVMsbUJBQWY7QUFDQSxpQkFBSyxPQUFMLEdBQWU7QUFDWCx3QkFBMEM7QUFEL0IsYUFBZjtBQUlBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxRQUFMLENBQWMsY0FBZCxDQUE2QixTQUE3QixDQUF1QyxVQUFDLElBQUQsRUFBSztBQUM1RCxzQkFBSyxxQkFBTDtBQUNBLHNCQUFLLFlBQUwsQ0FBa0IsS0FBSyxRQUF2QjtBQUNILGFBSG1CLENBQXBCO0FBS0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLG9CQUFMLENBQTBCLDhCQUExQixFQUEwRCxZQUFBO0FBQzFFLHNCQUFLLFdBQUwsQ0FBaUIsZ0JBQWdCLEdBQWpDO0FBQ0gsYUFGbUIsQ0FBcEI7QUFJQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssb0JBQUwsQ0FBMEIsa0NBQTFCLEVBQThELFlBQUE7QUFDOUUsc0JBQUssV0FBTCxDQUFpQixnQkFBZ0IsT0FBakM7QUFDSCxhQUZtQixDQUFwQjtBQUlBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxvQkFBTCxDQUEwQixnQ0FBMUIsRUFBNEQsWUFBQTtBQUM1RSxzQkFBSyxXQUFMLENBQWlCLGdCQUFnQixNQUFqQztBQUNILGFBRm1CLENBQXBCO0FBSUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLG9CQUFMLENBQTBCLDhCQUExQixFQUEwRCxZQUFBO0FBQzFFLHNCQUFLLFlBQUwsQ0FBa0IsTUFBSyxPQUF2QjtBQUNILGFBRm1CLENBQXBCO0FBR0g7OztrQ0FFYTtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEI7QUFDSDs7O29DQUVtQixJLEVBQXFCO0FBQ3JDLHVCQUFLLE9BQUwsQ0FBYTtBQUFBLHVCQUFZLFNBQVMsY0FBVCxDQUF3QixFQUFFLE1BQVcsSUFBYixFQUF4QixDQUFaO0FBQUEsYUFBYjtBQUNIOzs7cUNBRW9CLFEsRUFBdUM7QUFBQTs7QUFDeEQsaUJBQUssV0FBTCxDQUFpQixNQUFqQixHQUEwQixDQUExQjtBQUNBLGlCQUFLLE9BQUwsR0FBZSxRQUFmO0FBRUEsaUJBQUssV0FBTCxDQUFpQixLQUFqQjtBQUVBLGdCQUFNLFFBQVEsYUFBYSxJQUFiLENBQWtCLFNBQVMsV0FBM0IsRUFBd0MsRUFBRSxLQUFLLFNBQVMsU0FBaEIsRUFBeEMsQ0FBZDtBQUVBLGtCQUFNLE1BQU4sQ0FBYSxFQUFiLENBQWdCLE1BQWhCLEVBQXdCLFVBQUMsSUFBRCxFQUFVO0FBQzlCLHVCQUFLLFdBQUwsQ0FBaUIsVUFBakIsQ0FBNEIsRUFBRSxTQUFTLElBQVgsRUFBaUIsVUFBVSxFQUEzQixFQUE1QjtBQUNILGFBRkQ7QUFJQSxrQkFBTSxNQUFOLENBQWEsRUFBYixDQUFnQixNQUFoQixFQUF3QixVQUFDLElBQUQsRUFBVTtBQUM5Qix1QkFBSyxXQUFMLENBQWlCLFVBQWpCLENBQTRCLEVBQUUsU0FBUyxJQUFYLEVBQWlCLFVBQVUsTUFBM0IsRUFBNUI7QUFDSCxhQUZEO0FBSUEsdUJBQUssWUFBTCxDQUFrQixhQUFsQjtBQUNIOzs7Z0RBRTRCO0FBQUE7O0FBQ3pCLGdCQUFJLENBQUMsS0FBSyxNQUFWLEVBQWtCO0FBQ2QscUJBQUssTUFBTCxHQUFjLDBDQUFkO0FBRUEsb0JBQU0sbUJBQW1CLFdBQUssU0FBTCxDQUFlLGFBQWYsRUFBOEIsYUFBOUIsRUFBNkMsS0FBSyxXQUFsRCxFQUErRCxFQUFFLFVBQVUsSUFBWixFQUFrQixXQUFXLElBQTdCLEVBQS9ELEVBQW9HLEtBQUssTUFBekcsQ0FBekI7QUFDQSxxQkFBSyxNQUFMLENBQVksR0FBWixDQUFnQixnQkFBaEI7QUFDQSxxQkFBSyxNQUFMLENBQVksR0FBWixDQUFnQiw0QkFBVyxNQUFYLENBQWtCLFlBQUE7QUFDOUIsMkJBQUssVUFBTCxDQUFnQixNQUFoQixDQUF1QixPQUFLLE1BQTVCO0FBQ0EsMkJBQUssTUFBTCxHQUFjLElBQWQ7QUFDSCxpQkFIZSxDQUFoQjtBQUlBLHFCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsS0FBSyxNQUF6QjtBQUNIO0FBQ0o7Ozs7OztBQU9FLElBQU0sOEJBQVcsSUFBSSxRQUFKLEVBQWpCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9ydW4tdGVzdHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgZG9jayB9IGZyb20gXCIuLi9hdG9tL2RvY2tcIjtcbmltcG9ydCB7IFRlc3RSZXN1bHRzV2luZG93IH0gZnJvbSBcIi4uL3ZpZXdzL3Rlc3QtcmVzdWx0cy13aW5kb3dcIjtcbmltcG9ydCAqIGFzIGNoaWxkUHJvY2VzcyBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xudmFyIFRlc3RDb21tYW5kVHlwZTtcbihmdW5jdGlvbiAoVGVzdENvbW1hbmRUeXBlKSB7XG4gICAgVGVzdENvbW1hbmRUeXBlW1Rlc3RDb21tYW5kVHlwZVtcIkFsbFwiXSA9IDBdID0gXCJBbGxcIjtcbiAgICBUZXN0Q29tbWFuZFR5cGVbVGVzdENvbW1hbmRUeXBlW1wiRml4dHVyZVwiXSA9IDFdID0gXCJGaXh0dXJlXCI7XG4gICAgVGVzdENvbW1hbmRUeXBlW1Rlc3RDb21tYW5kVHlwZVtcIlNpbmdsZVwiXSA9IDJdID0gXCJTaW5nbGVcIjtcbn0pKFRlc3RDb21tYW5kVHlwZSB8fCAoVGVzdENvbW1hbmRUeXBlID0ge30pKTtcbmNsYXNzIFJ1blRlc3RzIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy50ZXN0UmVzdWx0cyA9IFtdO1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiVGVzdCBSdW5uZXJcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyBzdXBwb3J0IGZvciBydW5uaW5nIHRlc3RzIHdpdGhpbiBhdG9tLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fdGVzdFdpbmRvdyA9IG5ldyBUZXN0UmVzdWx0c1dpbmRvdztcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gbmV3IFN1YmplY3QoKTtcbiAgICAgICAgdGhpcy5vYnNlcnZlID0ge1xuICAgICAgICAgICAgb3V0cHV0OiBvdXRwdXRcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLmdldHRlc3Rjb250ZXh0LnN1YnNjcmliZSgoZGF0YSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5lbnN1cmVXaW5kb3dJc0NyZWF0ZWQoKTtcbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZVRlc3RzKGRhdGEucmVzcG9uc2UpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOnJ1bi1hbGwtdGVzdHNcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tYWtlUmVxdWVzdChUZXN0Q29tbWFuZFR5cGUuQWxsKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpydW4tZml4dHVyZS10ZXN0c1wiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1ha2VSZXF1ZXN0KFRlc3RDb21tYW5kVHlwZS5GaXh0dXJlKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpydW4tc2luZ2xlLXRlc3RcIiwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tYWtlUmVxdWVzdChUZXN0Q29tbWFuZFR5cGUuU2luZ2xlKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpydW4tbGFzdC10ZXN0XCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZVRlc3RzKHRoaXMubGFzdFJ1bik7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgbWFrZVJlcXVlc3QodHlwZSkge1xuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZ2V0dGVzdGNvbnRleHQoeyBUeXBlOiB0eXBlIH0pKTtcbiAgICB9XG4gICAgZXhlY3V0ZVRlc3RzKHJlc3BvbnNlKSB7XG4gICAgICAgIHRoaXMudGVzdFJlc3VsdHMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5sYXN0UnVuID0gcmVzcG9uc2U7XG4gICAgICAgIHRoaXMuX3Rlc3RXaW5kb3cuY2xlYXIoKTtcbiAgICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZFByb2Nlc3MuZXhlYyhyZXNwb25zZS5UZXN0Q29tbWFuZCwgeyBjd2Q6IHJlc3BvbnNlLkRpcmVjdG9yeSB9KTtcbiAgICAgICAgY2hpbGQuc3Rkb3V0Lm9uKFwiZGF0YVwiLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fdGVzdFdpbmRvdy5hZGRNZXNzYWdlKHsgbWVzc2FnZTogZGF0YSwgbG9nTGV2ZWw6IFwiXCIgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBjaGlsZC5zdGRlcnIub24oXCJkYXRhXCIsIChkYXRhKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl90ZXN0V2luZG93LmFkZE1lc3NhZ2UoeyBtZXNzYWdlOiBkYXRhLCBsb2dMZXZlbDogXCJmYWlsXCIgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBkb2NrLnNlbGVjdFdpbmRvdyhcInRlc3Qtb3V0cHV0XCIpO1xuICAgIH1cbiAgICBlbnN1cmVXaW5kb3dJc0NyZWF0ZWQoKSB7XG4gICAgICAgIGlmICghdGhpcy53aW5kb3cpIHtcbiAgICAgICAgICAgIHRoaXMud2luZG93ID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgICAgIGNvbnN0IHdpbmRvd0Rpc3Bvc2FibGUgPSBkb2NrLmFkZFdpbmRvdyhcInRlc3Qtb3V0cHV0XCIsIFwiVGVzdCBvdXRwdXRcIiwgdGhpcy5fdGVzdFdpbmRvdywgeyBwcmlvcml0eTogMjAwMCwgY2xvc2VhYmxlOiB0cnVlIH0sIHRoaXMud2luZG93KTtcbiAgICAgICAgICAgIHRoaXMud2luZG93LmFkZCh3aW5kb3dEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgIHRoaXMud2luZG93LmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0aGlzLndpbmRvdyk7XG4gICAgICAgICAgICAgICAgdGhpcy53aW5kb3cgPSBudWxsO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLndpbmRvdyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnQgY29uc3QgcnVuVGVzdHMgPSBuZXcgUnVuVGVzdHM7XG4iLCJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQge2RvY2t9IGZyb20gXCIuLi9hdG9tL2RvY2tcIjtcbmltcG9ydCB7VGVzdFJlc3VsdHNXaW5kb3d9IGZyb20gXCIuLi92aWV3cy90ZXN0LXJlc3VsdHMtd2luZG93XCI7XG5pbXBvcnQgKiBhcyBjaGlsZFByb2Nlc3MgZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcblxuLy8gVXNpbmcgdGhpcyBlbnVtIGFzIHRoZSBPbW5pc2hhcnAgb25lIGlzIGZyZWFraW5nIG91dC5cbmVudW0gVGVzdENvbW1hbmRUeXBlIHtcbiAgICBBbGwgPSAwLFxuICAgIEZpeHR1cmUgPSAxLFxuICAgIFNpbmdsZSA9IDJcbn1cblxuY2xhc3MgUnVuVGVzdHMgaW1wbGVtZW50cyBJRmVhdHVyZSB7XG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuICAgIHByaXZhdGUgd2luZG93OiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuICAgIHB1YmxpYyB0ZXN0UmVzdWx0czogT3V0cHV0TWVzc2FnZVtdID0gW107XG4gICAgcHJpdmF0ZSBsYXN0UnVuOiBNb2RlbHMuR2V0VGVzdENvbW1hbmRSZXNwb25zZTtcbiAgICBwcml2YXRlIF90ZXN0V2luZG93OiBUZXN0UmVzdWx0c1dpbmRvdztcblxuICAgIHB1YmxpYyBvYnNlcnZlOiB7XG4gICAgICAgIG91dHB1dDogT2JzZXJ2YWJsZTxPdXRwdXRNZXNzYWdlW10+O1xuICAgIH07XG5cbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuX3Rlc3RXaW5kb3cgPSBuZXcgVGVzdFJlc3VsdHNXaW5kb3c7XG5cbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gbmV3IFN1YmplY3Q8T3V0cHV0TWVzc2FnZVtdPigpO1xuICAgICAgICB0aGlzLm9ic2VydmUgPSB7XG4gICAgICAgICAgICBvdXRwdXQ6IDxPYnNlcnZhYmxlPE91dHB1dE1lc3NhZ2VbXT4+PGFueT5vdXRwdXRcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIuZ2V0dGVzdGNvbnRleHQuc3Vic2NyaWJlKChkYXRhKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmVuc3VyZVdpbmRvd0lzQ3JlYXRlZCgpO1xuICAgICAgICAgICAgdGhpcy5leGVjdXRlVGVzdHMoZGF0YS5yZXNwb25zZSk7XG4gICAgICAgIH0pKTtcblxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpydW4tYWxsLXRlc3RzXCIsICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWFrZVJlcXVlc3QoVGVzdENvbW1hbmRUeXBlLkFsbCk7XG4gICAgICAgIH0pKTtcblxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpydW4tZml4dHVyZS10ZXN0c1wiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1ha2VSZXF1ZXN0KFRlc3RDb21tYW5kVHlwZS5GaXh0dXJlKTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOnJ1bi1zaW5nbGUtdGVzdFwiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1ha2VSZXF1ZXN0KFRlc3RDb21tYW5kVHlwZS5TaW5nbGUpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206cnVuLWxhc3QtdGVzdFwiLCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmV4ZWN1dGVUZXN0cyh0aGlzLmxhc3RSdW4pO1xuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBtYWtlUmVxdWVzdCh0eXBlOiBUZXN0Q29tbWFuZFR5cGUpIHtcbiAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmdldHRlc3Rjb250ZXh0KHsgVHlwZTogPGFueT50eXBlIH0pKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGV4ZWN1dGVUZXN0cyhyZXNwb25zZTogTW9kZWxzLkdldFRlc3RDb21tYW5kUmVzcG9uc2UpIHtcbiAgICAgICAgdGhpcy50ZXN0UmVzdWx0cy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLmxhc3RSdW4gPSByZXNwb25zZTtcblxuICAgICAgICB0aGlzLl90ZXN0V2luZG93LmNsZWFyKCk7XG5cbiAgICAgICAgY29uc3QgY2hpbGQgPSBjaGlsZFByb2Nlc3MuZXhlYyhyZXNwb25zZS5UZXN0Q29tbWFuZCwgeyBjd2Q6IHJlc3BvbnNlLkRpcmVjdG9yeSB9KTtcblxuICAgICAgICBjaGlsZC5zdGRvdXQub24oXCJkYXRhXCIsIChkYXRhOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3Rlc3RXaW5kb3cuYWRkTWVzc2FnZSh7IG1lc3NhZ2U6IGRhdGEsIGxvZ0xldmVsOiBcIlwiIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBjaGlsZC5zdGRlcnIub24oXCJkYXRhXCIsIChkYXRhOiBhbnkpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3Rlc3RXaW5kb3cuYWRkTWVzc2FnZSh7IG1lc3NhZ2U6IGRhdGEsIGxvZ0xldmVsOiBcImZhaWxcIiB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZG9jay5zZWxlY3RXaW5kb3coXCJ0ZXN0LW91dHB1dFwiKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGVuc3VyZVdpbmRvd0lzQ3JlYXRlZCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLndpbmRvdykge1xuICAgICAgICAgICAgdGhpcy53aW5kb3cgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gICAgICAgICAgICBjb25zdCB3aW5kb3dEaXNwb3NhYmxlID0gZG9jay5hZGRXaW5kb3coXCJ0ZXN0LW91dHB1dFwiLCBcIlRlc3Qgb3V0cHV0XCIsIHRoaXMuX3Rlc3RXaW5kb3csIHsgcHJpb3JpdHk6IDIwMDAsIGNsb3NlYWJsZTogdHJ1ZSB9LCB0aGlzLndpbmRvdyk7XG4gICAgICAgICAgICB0aGlzLndpbmRvdy5hZGQod2luZG93RGlzcG9zYWJsZSk7XG4gICAgICAgICAgICB0aGlzLndpbmRvdy5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodGhpcy53aW5kb3cpO1xuICAgICAgICAgICAgICAgIHRoaXMud2luZG93ID0gbnVsbDtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodGhpcy53aW5kb3cpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlRlc3QgUnVubmVyXCI7XG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBZGRzIHN1cHBvcnQgZm9yIHJ1bm5pbmcgdGVzdHMgd2l0aGluIGF0b20uXCI7XG59XG5cbmV4cG9ydCBjb25zdCBydW5UZXN0cyA9IG5ldyBSdW5UZXN0cztcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

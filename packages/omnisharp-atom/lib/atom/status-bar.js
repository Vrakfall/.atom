"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.statusBar = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

var _statusBarView = require("../views/status-bar-view");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var StatusBar = function () {
    function StatusBar() {
        _classCallCheck(this, StatusBar);

        this._active = false;
        this.required = true;
        this.title = "Status Bar";
        this.description = "Adds the OmniSharp status icon to the status bar.";
    }

    _createClass(StatusBar, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
                return _this._active = false;
            }));
        }
    }, {
        key: "setup",
        value: function setup(statusBar) {
            this.statusBar = statusBar;
            if (this._active) {
                this._attach();
            }
        }
    }, {
        key: "attach",
        value: function attach() {
            if (this.statusBar) {
                this._attach();
            }
            this._active = true;
        }
    }, {
        key: "_attach",
        value: function _attach() {
            var _this2 = this;

            this.view = new _statusBarView.StatusBarElement();
            var tile = this.statusBar.addLeftTile({
                item: this.view,
                priority: -10000
            });
            this.disposable.add(this.view);
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
                tile.destroy();
                _this2.view.remove();
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return StatusBar;
}();

var statusBar = exports.statusBar = new StatusBar();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3N0YXR1cy1iYXIuanMiLCJsaWIvYXRvbS9zdGF0dXMtYmFyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7O0lDRUEsUztBQUFBLHlCQUFBO0FBQUE7O0FBSVksYUFBQSxPQUFBLEdBQVUsS0FBVjtBQXFDRCxhQUFBLFFBQUEsR0FBVyxJQUFYO0FBQ0EsYUFBQSxLQUFBLEdBQVEsWUFBUjtBQUNBLGFBQUEsV0FBQSxHQUFjLG1EQUFkO0FBQ1Y7Ozs7bUNBdENrQjtBQUFBOztBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQiw0QkFBVyxNQUFYLENBQWtCO0FBQUEsdUJBQU0sTUFBSyxPQUFMLEdBQWUsS0FBckI7QUFBQSxhQUFsQixDQUFwQjtBQUNIOzs7OEJBRVksUyxFQUFjO0FBQ3ZCLGlCQUFLLFNBQUwsR0FBaUIsU0FBakI7QUFFQSxnQkFBSSxLQUFLLE9BQVQsRUFBa0I7QUFDZCxxQkFBSyxPQUFMO0FBQ0g7QUFDSjs7O2lDQUVZO0FBQ1QsZ0JBQUksS0FBSyxTQUFULEVBQW9CO0FBQUUscUJBQUssT0FBTDtBQUFpQjtBQUN2QyxpQkFBSyxPQUFMLEdBQWUsSUFBZjtBQUNIOzs7a0NBRWM7QUFBQTs7QUFDWCxpQkFBSyxJQUFMLEdBQVkscUNBQVo7QUFDQSxnQkFBTSxPQUFPLEtBQUssU0FBTCxDQUFlLFdBQWYsQ0FBMkI7QUFDcEMsc0JBQU0sS0FBSyxJQUR5QjtBQUVwQywwQkFBVSxDQUFDO0FBRnlCLGFBQTNCLENBQWI7QUFJQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLEtBQUssSUFBekI7QUFDQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLDRCQUFXLE1BQVgsQ0FBa0IsWUFBQTtBQUNsQyxxQkFBSyxPQUFMO0FBQ0EsdUJBQUssSUFBTCxDQUFVLE1BQVY7QUFDSCxhQUhtQixDQUFwQjtBQUlIOzs7a0NBRWE7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCO0FBQ0g7Ozs7OztBQU9FLElBQU0sZ0NBQVksSUFBSSxTQUFKLEVBQWxCIiwiZmlsZSI6ImxpYi9hdG9tL3N0YXR1cy1iYXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IFN0YXR1c0JhckVsZW1lbnQgfSBmcm9tIFwiLi4vdmlld3Mvc3RhdHVzLWJhci12aWV3XCI7XG5jbGFzcyBTdGF0dXNCYXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLl9hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlN0YXR1cyBCYXJcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyB0aGUgT21uaVNoYXJwIHN0YXR1cyBpY29uIHRvIHRoZSBzdGF0dXMgYmFyLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB0aGlzLl9hY3RpdmUgPSBmYWxzZSkpO1xuICAgIH1cbiAgICBzZXR1cChzdGF0dXNCYXIpIHtcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIgPSBzdGF0dXNCYXI7XG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGF0dGFjaCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQmFyKSB7XG4gICAgICAgICAgICB0aGlzLl9hdHRhY2goKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hY3RpdmUgPSB0cnVlO1xuICAgIH1cbiAgICBfYXR0YWNoKCkge1xuICAgICAgICB0aGlzLnZpZXcgPSBuZXcgU3RhdHVzQmFyRWxlbWVudCgpO1xuICAgICAgICBjb25zdCB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkTGVmdFRpbGUoe1xuICAgICAgICAgICAgaXRlbTogdGhpcy52aWV3LFxuICAgICAgICAgICAgcHJpb3JpdHk6IC0xMDAwMFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLnZpZXcpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRpbGUuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZSgpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IHN0YXR1c0JhciA9IG5ldyBTdGF0dXNCYXI7XG4iLCJpbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQge1N0YXR1c0JhckVsZW1lbnR9IGZyb20gXCIuLi92aWV3cy9zdGF0dXMtYmFyLXZpZXdcIjtcblxuY2xhc3MgU3RhdHVzQmFyIGltcGxlbWVudHMgSUF0b21GZWF0dXJlIHtcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG4gICAgcHJpdmF0ZSB2aWV3OiBTdGF0dXNCYXJFbGVtZW50O1xuICAgIHByaXZhdGUgc3RhdHVzQmFyOiBhbnk7XG4gICAgcHJpdmF0ZSBfYWN0aXZlID0gZmFsc2U7XG5cbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4gdGhpcy5fYWN0aXZlID0gZmFsc2UpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0dXAoc3RhdHVzQmFyOiBhbnkpIHtcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIgPSBzdGF0dXNCYXI7XG5cbiAgICAgICAgaWYgKHRoaXMuX2FjdGl2ZSkge1xuICAgICAgICAgICAgdGhpcy5fYXR0YWNoKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYXR0YWNoKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0dXNCYXIpIHsgdGhpcy5fYXR0YWNoKCk7IH1cbiAgICAgICAgdGhpcy5fYWN0aXZlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9hdHRhY2goKSB7XG4gICAgICAgIHRoaXMudmlldyA9IG5ldyBTdGF0dXNCYXJFbGVtZW50KCk7XG4gICAgICAgIGNvbnN0IHRpbGUgPSB0aGlzLnN0YXR1c0Jhci5hZGRMZWZ0VGlsZSh7XG4gICAgICAgICAgICBpdGVtOiB0aGlzLnZpZXcsXG4gICAgICAgICAgICBwcmlvcml0eTogLTEwMDAwXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRoaXMudmlldyk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGlsZS5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLnZpZXcucmVtb3ZlKCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVxdWlyZWQgPSB0cnVlO1xuICAgIHB1YmxpYyB0aXRsZSA9IFwiU3RhdHVzIEJhclwiO1xuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiQWRkcyB0aGUgT21uaVNoYXJwIHN0YXR1cyBpY29uIHRvIHRoZSBzdGF0dXMgYmFyLlwiO1xufVxuXG5leHBvcnQgY29uc3Qgc3RhdHVzQmFyID0gbmV3IFN0YXR1c0JhcjtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

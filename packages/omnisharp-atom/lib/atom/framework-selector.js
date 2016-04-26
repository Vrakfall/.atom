"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.frameworkSelector = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

var _frameworkSelectorView = require("../views/framework-selector-view");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var FrameworkSelector = function () {
    function FrameworkSelector() {
        _classCallCheck(this, FrameworkSelector);

        this._active = false;
        this.required = true;
        this.title = "Framework Selector";
        this.description = "Lets you select the framework you\"re currently targeting.";
    }

    _createClass(FrameworkSelector, [{
        key: "activate",
        value: function activate() {
            this.disposable = new _omnisharpClient.CompositeDisposable();
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
            var _this = this;

            this.view = document.createElement("span");
            this.view.classList.add("inline-block");
            this.view.classList.add("framework-selector");
            this.view.style.display = "none";
            var tile = void 0;
            if (atom.config.get("grammar-selector.showOnRightSideOfStatusBar")) {
                tile = this.statusBar.addRightTile({
                    item: this.view,
                    priority: 9
                });
            } else {
                tile = this.statusBar.addLeftTile({
                    item: this.view,
                    priority: 11
                });
            }
            this._component = new _frameworkSelectorView.FrameworkSelectorComponent();
            this._component.alignLeft = !atom.config.get("grammar-selector.showOnRightSideOfStatusBar");
            this.view.appendChild(this._component);
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
                tile.destroy();
                _this.view.remove();
            }));
            this.disposable.add(_omni.Omni.activeEditor.filter(function (z) {
                return !z;
            }).subscribe(function () {
                return _this.view.style.display = "none";
            }));
            this.disposable.add(_omni.Omni.activeProject.filter(function (z) {
                return z.frameworks.length === 1;
            }).subscribe(function () {
                return _this.view.style.display = "none";
            }));
            this.disposable.add(_omni.Omni.activeProject.subscribe(function (project) {
                _this.view.style.display = "";
                var frameworks = project.frameworks;
                var activeFramework = project.activeFramework;

                _this.project = project;
                _this._component.frameworks = frameworks;
                _this._component.activeFramework = activeFramework;
            }));
            this.disposable.add(_omni.Omni.activeFramework.subscribe(function (ctx) {
                _this.view.style.display = "";
                var project = ctx.project;
                var framework = ctx.framework;

                _this.project = project;
                _this._component.frameworks = project.frameworks;
                _this._component.activeFramework = framework;
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "setActiveFramework",
        value: function setActiveFramework(framework) {
            if (this.project) {
                this.project.activeFramework = framework;
                this._component.activeFramework = framework;
            }
        }
    }]);

    return FrameworkSelector;
}();

var frameworkSelector = exports.frameworkSelector = new FrameworkSelector();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2ZyYW1ld29yay1zZWxlY3Rvci5qcyIsImxpYi9hdG9tL2ZyYW1ld29yay1zZWxlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztJQ0lBLGlCO0FBQUEsaUNBQUE7QUFBQTs7QUFJWSxhQUFBLE9BQUEsR0FBVSxLQUFWO0FBeUZELGFBQUEsUUFBQSxHQUFXLElBQVg7QUFDQSxhQUFBLEtBQUEsR0FBUSxvQkFBUjtBQUNBLGFBQUEsV0FBQSxHQUFjLDREQUFkO0FBQ1Y7Ozs7bUNBeEZrQjtBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCO0FBQ0g7Ozs4QkFFWSxTLEVBQWM7QUFDdkIsaUJBQUssU0FBTCxHQUFpQixTQUFqQjtBQUVBLGdCQUFJLEtBQUssT0FBVCxFQUFrQjtBQUNkLHFCQUFLLE9BQUw7QUFDSDtBQUNKOzs7aUNBRVk7QUFDVCxnQkFBSSxLQUFLLFNBQVQsRUFBb0I7QUFBRSxxQkFBSyxPQUFMO0FBQWlCO0FBQ3ZDLGlCQUFLLE9BQUwsR0FBZSxJQUFmO0FBQ0g7OztrQ0FFYztBQUFBOztBQUNYLGlCQUFLLElBQUwsR0FBWSxTQUFTLGFBQVQsQ0FBdUIsTUFBdkIsQ0FBWjtBQUNBLGlCQUFLLElBQUwsQ0FBVSxTQUFWLENBQW9CLEdBQXBCLENBQXdCLGNBQXhCO0FBQ0EsaUJBQUssSUFBTCxDQUFVLFNBQVYsQ0FBb0IsR0FBcEIsQ0FBd0Isb0JBQXhCO0FBQ0EsaUJBQUssSUFBTCxDQUFVLEtBQVYsQ0FBZ0IsT0FBaEIsR0FBMEIsTUFBMUI7QUFFQSxnQkFBSSxhQUFKO0FBQ0EsZ0JBQUksS0FBSyxNQUFMLENBQVksR0FBWixDQUFnQiw2Q0FBaEIsQ0FBSixFQUFvRTtBQUNoRSx1QkFBTyxLQUFLLFNBQUwsQ0FBZSxZQUFmLENBQTRCO0FBQy9CLDBCQUFNLEtBQUssSUFEb0I7QUFFL0IsOEJBQVU7QUFGcUIsaUJBQTVCLENBQVA7QUFJSCxhQUxELE1BS087QUFDSCx1QkFBTyxLQUFLLFNBQUwsQ0FBZSxXQUFmLENBQTJCO0FBQzlCLDBCQUFNLEtBQUssSUFEbUI7QUFFOUIsOEJBQVU7QUFGb0IsaUJBQTNCLENBQVA7QUFJSDtBQUVELGlCQUFLLFVBQUwsR0FBa0IsdURBQWxCO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixTQUFoQixHQUE0QixDQUFDLEtBQUssTUFBTCxDQUFZLEdBQVosQ0FBZ0IsNkNBQWhCLENBQTdCO0FBQ0EsaUJBQUssSUFBTCxDQUFVLFdBQVYsQ0FBc0IsS0FBSyxVQUEzQjtBQUVBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsNEJBQVcsTUFBWCxDQUFrQixZQUFBO0FBQ2xDLHFCQUFLLE9BQUw7QUFDQSxzQkFBSyxJQUFMLENBQVUsTUFBVjtBQUNILGFBSG1CLENBQXBCO0FBS0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLFlBQUwsQ0FDZixNQURlLENBQ1I7QUFBQSx1QkFBSyxDQUFDLENBQU47QUFBQSxhQURRLEVBRWYsU0FGZSxDQUVMO0FBQUEsdUJBQU0sTUFBSyxJQUFMLENBQVUsS0FBVixDQUFnQixPQUFoQixHQUEwQixNQUFoQztBQUFBLGFBRkssQ0FBcEI7QUFJQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssYUFBTCxDQUNmLE1BRGUsQ0FDUjtBQUFBLHVCQUFLLEVBQUUsVUFBRixDQUFhLE1BQWIsS0FBd0IsQ0FBN0I7QUFBQSxhQURRLEVBRWYsU0FGZSxDQUVMO0FBQUEsdUJBQU0sTUFBSyxJQUFMLENBQVUsS0FBVixDQUFnQixPQUFoQixHQUEwQixNQUFoQztBQUFBLGFBRkssQ0FBcEI7QUFJQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssYUFBTCxDQUNmLFNBRGUsQ0FDTCxtQkFBTztBQUNkLHNCQUFLLElBQUwsQ0FBVSxLQUFWLENBQWdCLE9BQWhCLEdBQTBCLEVBQTFCO0FBRGMsb0JBR1AsVUFITyxHQUd3QixPQUh4QixDQUdQLFVBSE87QUFBQSxvQkFHSyxlQUhMLEdBR3dCLE9BSHhCLENBR0ssZUFITDs7QUFJZCxzQkFBSyxPQUFMLEdBQWUsT0FBZjtBQUNBLHNCQUFLLFVBQUwsQ0FBZ0IsVUFBaEIsR0FBNkIsVUFBN0I7QUFDQSxzQkFBSyxVQUFMLENBQWdCLGVBQWhCLEdBQWtDLGVBQWxDO0FBQ0gsYUFSZSxDQUFwQjtBQVVBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxlQUFMLENBQ2YsU0FEZSxDQUNMLGVBQUc7QUFDVixzQkFBSyxJQUFMLENBQVUsS0FBVixDQUFnQixPQUFoQixHQUEwQixFQUExQjtBQURVLG9CQUdILE9BSEcsR0FHbUIsR0FIbkIsQ0FHSCxPQUhHO0FBQUEsb0JBR00sU0FITixHQUdtQixHQUhuQixDQUdNLFNBSE47O0FBSVYsc0JBQUssT0FBTCxHQUFlLE9BQWY7QUFDQSxzQkFBSyxVQUFMLENBQWdCLFVBQWhCLEdBQTZCLFFBQVEsVUFBckM7QUFDQSxzQkFBSyxVQUFMLENBQWdCLGVBQWhCLEdBQWtDLFNBQWxDO0FBQ0gsYUFSZSxDQUFwQjtBQVNIOzs7a0NBRWE7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCO0FBQ0g7OzsyQ0FFeUIsUyxFQUFpQztBQUN2RCxnQkFBSSxLQUFLLE9BQVQsRUFBa0I7QUFDZCxxQkFBSyxPQUFMLENBQWEsZUFBYixHQUErQixTQUEvQjtBQUNBLHFCQUFLLFVBQUwsQ0FBZ0IsZUFBaEIsR0FBa0MsU0FBbEM7QUFDSDtBQUNKOzs7Ozs7QUFPRSxJQUFNLGdEQUFvQixJQUFJLGlCQUFKLEVBQTFCIiwiZmlsZSI6ImxpYi9hdG9tL2ZyYW1ld29yay1zZWxlY3Rvci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgRnJhbWV3b3JrU2VsZWN0b3JDb21wb25lbnQgfSBmcm9tIFwiLi4vdmlld3MvZnJhbWV3b3JrLXNlbGVjdG9yLXZpZXdcIjtcbmNsYXNzIEZyYW1ld29ya1NlbGVjdG9yIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5fYWN0aXZlID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJGcmFtZXdvcmsgU2VsZWN0b3JcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiTGV0cyB5b3Ugc2VsZWN0IHRoZSBmcmFtZXdvcmsgeW91XFxcInJlIGN1cnJlbnRseSB0YXJnZXRpbmcuXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgIH1cbiAgICBzZXR1cChzdGF0dXNCYXIpIHtcbiAgICAgICAgdGhpcy5zdGF0dXNCYXIgPSBzdGF0dXNCYXI7XG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGF0dGFjaCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQmFyKSB7XG4gICAgICAgICAgICB0aGlzLl9hdHRhY2goKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9hY3RpdmUgPSB0cnVlO1xuICAgIH1cbiAgICBfYXR0YWNoKCkge1xuICAgICAgICB0aGlzLnZpZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy52aWV3LmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIik7XG4gICAgICAgIHRoaXMudmlldy5jbGFzc0xpc3QuYWRkKFwiZnJhbWV3b3JrLXNlbGVjdG9yXCIpO1xuICAgICAgICB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBsZXQgdGlsZTtcbiAgICAgICAgaWYgKGF0b20uY29uZmlnLmdldChcImdyYW1tYXItc2VsZWN0b3Iuc2hvd09uUmlnaHRTaWRlT2ZTdGF0dXNCYXJcIikpIHtcbiAgICAgICAgICAgIHRpbGUgPSB0aGlzLnN0YXR1c0Jhci5hZGRSaWdodFRpbGUoe1xuICAgICAgICAgICAgICAgIGl0ZW06IHRoaXMudmlldyxcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogOVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkTGVmdFRpbGUoe1xuICAgICAgICAgICAgICAgIGl0ZW06IHRoaXMudmlldyxcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogMTFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2NvbXBvbmVudCA9IG5ldyBGcmFtZXdvcmtTZWxlY3RvckNvbXBvbmVudDtcbiAgICAgICAgdGhpcy5fY29tcG9uZW50LmFsaWduTGVmdCA9ICFhdG9tLmNvbmZpZy5nZXQoXCJncmFtbWFyLXNlbGVjdG9yLnNob3dPblJpZ2h0U2lkZU9mU3RhdHVzQmFyXCIpO1xuICAgICAgICB0aGlzLnZpZXcuYXBwZW5kQ2hpbGQodGhpcy5fY29tcG9uZW50KTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aWxlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmUoKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlRWRpdG9yXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gIXopXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCgpID0+IHRoaXMudmlldy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCIpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZVByb2plY3RcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6LmZyYW1ld29ya3MubGVuZ3RoID09PSAxKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVQcm9qZWN0XG4gICAgICAgICAgICAuc3Vic2NyaWJlKHByb2plY3QgPT4ge1xuICAgICAgICAgICAgdGhpcy52aWV3LnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICAgICAgY29uc3QgeyBmcmFtZXdvcmtzLCBhY3RpdmVGcmFtZXdvcmsgfSA9IHByb2plY3Q7XG4gICAgICAgICAgICB0aGlzLnByb2plY3QgPSBwcm9qZWN0O1xuICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmZyYW1ld29ya3MgPSBmcmFtZXdvcmtzO1xuICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmFjdGl2ZUZyYW1ld29yayA9IGFjdGl2ZUZyYW1ld29yaztcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWN0aXZlRnJhbWV3b3JrXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGN0eCA9PiB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwiXCI7XG4gICAgICAgICAgICBjb25zdCB7IHByb2plY3QsIGZyYW1ld29yayB9ID0gY3R4O1xuICAgICAgICAgICAgdGhpcy5wcm9qZWN0ID0gcHJvamVjdDtcbiAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5mcmFtZXdvcmtzID0gcHJvamVjdC5mcmFtZXdvcmtzO1xuICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmFjdGl2ZUZyYW1ld29yayA9IGZyYW1ld29yaztcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbiAgICBzZXRBY3RpdmVGcmFtZXdvcmsoZnJhbWV3b3JrKSB7XG4gICAgICAgIGlmICh0aGlzLnByb2plY3QpIHtcbiAgICAgICAgICAgIHRoaXMucHJvamVjdC5hY3RpdmVGcmFtZXdvcmsgPSBmcmFtZXdvcms7XG4gICAgICAgICAgICB0aGlzLl9jb21wb25lbnQuYWN0aXZlRnJhbWV3b3JrID0gZnJhbWV3b3JrO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGZyYW1ld29ya1NlbGVjdG9yID0gbmV3IEZyYW1ld29ya1NlbGVjdG9yO1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQge1Byb2plY3RWaWV3TW9kZWx9IGZyb20gXCIuLi9zZXJ2ZXIvcHJvamVjdC12aWV3LW1vZGVsXCI7XG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHtGcmFtZXdvcmtTZWxlY3RvckNvbXBvbmVudH0gZnJvbSBcIi4uL3ZpZXdzL2ZyYW1ld29yay1zZWxlY3Rvci12aWV3XCI7XG5cbmNsYXNzIEZyYW1ld29ya1NlbGVjdG9yIGltcGxlbWVudHMgSUF0b21GZWF0dXJlIHtcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG4gICAgcHJpdmF0ZSB2aWV3OiBIVE1MU3BhbkVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBzdGF0dXNCYXI6IGFueTtcbiAgICBwcml2YXRlIF9hY3RpdmUgPSBmYWxzZTtcbiAgICBwdWJsaWMgcHJvamVjdDogUHJvamVjdFZpZXdNb2RlbDxhbnk+O1xuICAgIHByaXZhdGUgX2NvbXBvbmVudDogRnJhbWV3b3JrU2VsZWN0b3JDb21wb25lbnQ7XG5cbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHNldHVwKHN0YXR1c0JhcjogYW55KSB7XG4gICAgICAgIHRoaXMuc3RhdHVzQmFyID0gc3RhdHVzQmFyO1xuXG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGF0dGFjaCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQmFyKSB7IHRoaXMuX2F0dGFjaCgpOyB9XG4gICAgICAgIHRoaXMuX2FjdGl2ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfYXR0YWNoKCkge1xuICAgICAgICB0aGlzLnZpZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy52aWV3LmNsYXNzTGlzdC5hZGQoXCJpbmxpbmUtYmxvY2tcIik7XG4gICAgICAgIHRoaXMudmlldy5jbGFzc0xpc3QuYWRkKFwiZnJhbWV3b3JrLXNlbGVjdG9yXCIpO1xuICAgICAgICB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuXG4gICAgICAgIGxldCB0aWxlOiBhbnk7XG4gICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoXCJncmFtbWFyLXNlbGVjdG9yLnNob3dPblJpZ2h0U2lkZU9mU3RhdHVzQmFyXCIpKSB7XG4gICAgICAgICAgICB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkUmlnaHRUaWxlKHtcbiAgICAgICAgICAgICAgICBpdGVtOiB0aGlzLnZpZXcsXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IDlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZExlZnRUaWxlKHtcbiAgICAgICAgICAgICAgICBpdGVtOiB0aGlzLnZpZXcsXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IDExXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2NvbXBvbmVudCA9IG5ldyBGcmFtZXdvcmtTZWxlY3RvckNvbXBvbmVudDtcbiAgICAgICAgdGhpcy5fY29tcG9uZW50LmFsaWduTGVmdCA9ICFhdG9tLmNvbmZpZy5nZXQoXCJncmFtbWFyLXNlbGVjdG9yLnNob3dPblJpZ2h0U2lkZU9mU3RhdHVzQmFyXCIpO1xuICAgICAgICB0aGlzLnZpZXcuYXBwZW5kQ2hpbGQodGhpcy5fY29tcG9uZW50KTtcblxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRpbGUuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZSgpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZUVkaXRvclxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6KVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZVByb2plY3RcbiAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6LmZyYW1ld29ya3MubGVuZ3RoID09PSAxKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoKSA9PiB0aGlzLnZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZVByb2plY3RcbiAgICAgICAgICAgIC5zdWJzY3JpYmUocHJvamVjdCA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3LnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qge2ZyYW1ld29ya3MsIGFjdGl2ZUZyYW1ld29ya30gPSBwcm9qZWN0O1xuICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdCA9IHByb2plY3Q7XG4gICAgICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmZyYW1ld29ya3MgPSBmcmFtZXdvcmtzO1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvbXBvbmVudC5hY3RpdmVGcmFtZXdvcmsgPSBhY3RpdmVGcmFtZXdvcms7XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZUZyYW1ld29ya1xuICAgICAgICAgICAgLnN1YnNjcmliZShjdHggPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudmlldy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHtwcm9qZWN0LCBmcmFtZXdvcmt9ID0gY3R4O1xuICAgICAgICAgICAgICAgIHRoaXMucHJvamVjdCA9IHByb2plY3Q7XG4gICAgICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmZyYW1ld29ya3MgPSBwcm9qZWN0LmZyYW1ld29ya3M7XG4gICAgICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmFjdGl2ZUZyYW1ld29yayA9IGZyYW1ld29yaztcbiAgICAgICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0QWN0aXZlRnJhbWV3b3JrKGZyYW1ld29yazogTW9kZWxzLkRvdE5ldEZyYW1ld29yaykge1xuICAgICAgICBpZiAodGhpcy5wcm9qZWN0KSB7XG4gICAgICAgICAgICB0aGlzLnByb2plY3QuYWN0aXZlRnJhbWV3b3JrID0gZnJhbWV3b3JrO1xuICAgICAgICAgICAgdGhpcy5fY29tcG9uZW50LmFjdGl2ZUZyYW1ld29yayA9IGZyYW1ld29yaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XG4gICAgcHVibGljIHRpdGxlID0gXCJGcmFtZXdvcmsgU2VsZWN0b3JcIjtcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkxldHMgeW91IHNlbGVjdCB0aGUgZnJhbWV3b3JrIHlvdVxcXCJyZSBjdXJyZW50bHkgdGFyZ2V0aW5nLlwiO1xufVxuXG5leHBvcnQgY29uc3QgZnJhbWV3b3JrU2VsZWN0b3IgPSBuZXcgRnJhbWV3b3JrU2VsZWN0b3I7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

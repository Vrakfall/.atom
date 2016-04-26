"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.settingsButton = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

var _dock = require("../atom/dock");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SettingsButton = function () {
    function SettingsButton() {
        _classCallCheck(this, SettingsButton);

        this.required = true;
        this.title = "Show Settings button";
        this.tooltip = "Show Settings";
        this.description = "Shows the settings button on the OmniSharp Dock";
        this.default = true;
    }

    _createClass(SettingsButton, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            var tooltip = void 0;
            var htmlButton = document.createElement("a");
            htmlButton.classList.add("btn", "icon-gear");
            htmlButton.onclick = function () {
                return atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:settings");
            };
            htmlButton.onmouseenter = function (e) {
                tooltip = atom.tooltips.add(e.currentTarget, { title: _this.tooltip });
                _this.disposable.add(tooltip);
            };
            htmlButton.onmouseleave = function (e) {
                if (tooltip) {
                    _this.disposable.remove(tooltip);
                    tooltip.dispose();
                }
            };
            this.disposable.add(_dock.dock.addButton("settings-button", "Settings", htmlButton, { priority: 999 }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return SettingsButton;
}();

var settingsButton = exports.settingsButton = new SettingsButton();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL3NldHRpbmdzLWJ1dHRvbi5qcyIsImxpYi9hdG9tL3NldHRpbmdzLWJ1dHRvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7OztJQ0VBLGM7QUFBQSw4QkFBQTtBQUFBOztBQWtDVyxhQUFBLFFBQUEsR0FBVyxJQUFYO0FBQ0EsYUFBQSxLQUFBLEdBQVEsc0JBQVI7QUFDQSxhQUFBLE9BQUEsR0FBVSxlQUFWO0FBQ0EsYUFBQSxXQUFBLEdBQWMsaURBQWQ7QUFDQSxhQUFBLE9BQUEsR0FBVSxJQUFWO0FBQ1Y7Ozs7bUNBcENrQjtBQUFBOztBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCO0FBQ0EsZ0JBQUksZ0JBQUo7QUFFQSxnQkFBTSxhQUFhLFNBQVMsYUFBVCxDQUF1QixHQUF2QixDQUFuQjtBQUNBLHVCQUFXLFNBQVgsQ0FBcUIsR0FBckIsQ0FBeUIsS0FBekIsRUFBK0IsV0FBL0I7QUFFQSx1QkFBVyxPQUFYLEdBQXFCO0FBQUEsdUJBQU0sS0FBSyxRQUFMLENBQWMsUUFBZCxDQUF1QixLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLEtBQUssU0FBeEIsQ0FBdkIsRUFBMkQseUJBQTNELENBQU47QUFBQSxhQUFyQjtBQUNBLHVCQUFXLFlBQVgsR0FBMEIsVUFBQyxDQUFELEVBQUU7QUFDeEIsMEJBQVUsS0FBSyxRQUFMLENBQWMsR0FBZCxDQUF1QixFQUFFLGFBQXpCLEVBQXdDLEVBQUUsT0FBTyxNQUFLLE9BQWQsRUFBeEMsQ0FBVjtBQUNBLHNCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsT0FBcEI7QUFDSCxhQUhEO0FBSUEsdUJBQVcsWUFBWCxHQUEwQixVQUFDLENBQUQsRUFBRTtBQUN4QixvQkFBSSxPQUFKLEVBQWE7QUFDVCwwQkFBSyxVQUFMLENBQWdCLE1BQWhCLENBQXVCLE9BQXZCO0FBQ0EsNEJBQVEsT0FBUjtBQUNIO0FBQ0osYUFMRDtBQU9BLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxTQUFMLENBQ2hCLGlCQURnQixFQUVoQixVQUZnQixFQUdoQixVQUhnQixFQUloQixFQUFFLFVBQVUsR0FBWixFQUpnQixDQUFwQjtBQU1IOzs7a0NBRWE7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCO0FBQ0g7Ozs7OztBQVNFLElBQU0sMENBQWlCLElBQUksY0FBSixFQUF2QiIsImZpbGUiOiJsaWIvYXRvbS9zZXR0aW5ncy1idXR0b24uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IGRvY2sgfSBmcm9tIFwiLi4vYXRvbS9kb2NrXCI7XG5jbGFzcyBTZXR0aW5nc0J1dHRvbiB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJTaG93IFNldHRpbmdzIGJ1dHRvblwiO1xuICAgICAgICB0aGlzLnRvb2x0aXAgPSBcIlNob3cgU2V0dGluZ3NcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiU2hvd3MgdGhlIHNldHRpbmdzIGJ1dHRvbiBvbiB0aGUgT21uaVNoYXJwIERvY2tcIjtcbiAgICAgICAgdGhpcy5kZWZhdWx0ID0gdHJ1ZTtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGxldCB0b29sdGlwO1xuICAgICAgICBjb25zdCBodG1sQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgICAgIGh0bWxCdXR0b24uY2xhc3NMaXN0LmFkZChcImJ0blwiLCBcImljb24tZ2VhclwiKTtcbiAgICAgICAgaHRtbEJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpLCBcIm9tbmlzaGFycC1hdG9tOnNldHRpbmdzXCIpO1xuICAgICAgICBodG1sQnV0dG9uLm9ubW91c2VlbnRlciA9IChlKSA9PiB7XG4gICAgICAgICAgICB0b29sdGlwID0gYXRvbS50b29sdGlwcy5hZGQoZS5jdXJyZW50VGFyZ2V0LCB7IHRpdGxlOiB0aGlzLnRvb2x0aXAgfSk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRvb2x0aXApO1xuICAgICAgICB9O1xuICAgICAgICBodG1sQnV0dG9uLm9ubW91c2VsZWF2ZSA9IChlKSA9PiB7XG4gICAgICAgICAgICBpZiAodG9vbHRpcCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodG9vbHRpcCk7XG4gICAgICAgICAgICAgICAgdG9vbHRpcC5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoZG9jay5hZGRCdXR0b24oXCJzZXR0aW5ncy1idXR0b25cIiwgXCJTZXR0aW5nc1wiLCBodG1sQnV0dG9uLCB7IHByaW9yaXR5OiA5OTkgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCBzZXR0aW5nc0J1dHRvbiA9IG5ldyBTZXR0aW5nc0J1dHRvbigpO1xuIiwiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7ZG9ja30gZnJvbSBcIi4uL2F0b20vZG9ja1wiO1xuXG5jbGFzcyBTZXR0aW5nc0J1dHRvbiBpbXBsZW1lbnRzIElGZWF0dXJlIHtcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG5cbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGxldCB0b29sdGlwIDpJRGlzcG9zYWJsZTtcblxuICAgICAgICBjb25zdCBodG1sQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgICAgIGh0bWxCdXR0b24uY2xhc3NMaXN0LmFkZChcImJ0blwiLFwiaWNvbi1nZWFyXCIpO1xuXG4gICAgICAgIGh0bWxCdXR0b24ub25jbGljayA9ICgpID0+IGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgXCJvbW5pc2hhcnAtYXRvbTpzZXR0aW5nc1wiKTtcbiAgICAgICAgaHRtbEJ1dHRvbi5vbm1vdXNlZW50ZXIgPSAoZSkgPT4ge1xuICAgICAgICAgICAgdG9vbHRpcCA9IGF0b20udG9vbHRpcHMuYWRkKDxhbnk+ZS5jdXJyZW50VGFyZ2V0LCB7IHRpdGxlOiB0aGlzLnRvb2x0aXAgfSk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHRvb2x0aXApO1xuICAgICAgICB9O1xuICAgICAgICBodG1sQnV0dG9uLm9ubW91c2VsZWF2ZSA9IChlKSA9PiB7XG4gICAgICAgICAgICBpZiAodG9vbHRpcCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodG9vbHRpcCk7XG4gICAgICAgICAgICAgICAgdG9vbHRpcC5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChkb2NrLmFkZEJ1dHRvbihcbiAgICAgICAgICAgIFwic2V0dGluZ3MtYnV0dG9uXCIsXG4gICAgICAgICAgICBcIlNldHRpbmdzXCIsXG4gICAgICAgICAgICBodG1sQnV0dG9uLFxuICAgICAgICAgICAgeyBwcmlvcml0eTogOTk5IH1cbiAgICAgICAgKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlNob3cgU2V0dGluZ3MgYnV0dG9uXCI7XG4gICAgcHVibGljIHRvb2x0aXAgPSBcIlNob3cgU2V0dGluZ3NcIjtcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIlNob3dzIHRoZSBzZXR0aW5ncyBidXR0b24gb24gdGhlIE9tbmlTaGFycCBEb2NrXCI7XG4gICAgcHVibGljIGRlZmF1bHQgPSB0cnVlO1xufVxuXG5leHBvcnQgY29uc3Qgc2V0dGluZ3NCdXR0b24gPSBuZXcgU2V0dGluZ3NCdXR0b24oKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

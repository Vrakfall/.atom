"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.featureEditorButtons = exports.featureButtons = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

var _lodash = require("lodash");

var _omni = require("../server/omni");

var _dock = require("../atom/dock");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var buttons = [{
    name: "enhanced-highlighting",
    config: "omnisharp-atom.enhancedHighlighting",
    icon: "icon-pencil",
    tooltip: "Enable / Disable Enhanced Highlighting"
}, {
    name: "code-lens",
    config: "omnisharp-atom.codeLens",
    icon: "icon-telescope",
    tooltip: "Enable / Disable Code Lens"
}];

var FeatureEditorButtons = function () {
    function FeatureEditorButtons() {
        _classCallCheck(this, FeatureEditorButtons);

        this._active = false;
        this.required = false;
        this.title = "Show Editor Feature Buttons";
        this.description = "Shows feature toggle buttons in the editor.";
        this.default = true;
    }

    _createClass(FeatureEditorButtons, [{
        key: "activate",
        value: function activate() {
            this.disposable = new _omnisharpClient.CompositeDisposable();
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
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

            (0, _lodash.each)(buttons, function (button, index) {
                return _this._button(button, index);
            });
        }
    }, {
        key: "_button",
        value: function _button(button, index) {
            var _this2 = this;

            var name = button.name;
            var config = button.config;
            var icon = button.icon;
            var tooltip = button.tooltip;

            var view = document.createElement("span");
            view.classList.add("inline-block", name + "-button", icon);
            view.style.display = "none";
            view.onclick = function () {
                return atom.config.set(config, !atom.config.get(config));
            };
            var tooltipDisposable = void 0;
            view.onmouseenter = function () {
                tooltipDisposable = atom.tooltips.add(view, { title: tooltip });
                _this2.disposable.add(tooltipDisposable);
            };
            view.onmouseleave = function () {
                if (tooltipDisposable) {
                    _this2.disposable.remove(tooltipDisposable);
                    tooltipDisposable.dispose();
                }
            };
            var tile = void 0;
            if (atom.config.get("grammar-selector.showOnRightSideOfStatusBar")) {
                tile = this.statusBar.addRightTile({
                    item: view,
                    priority: 9 - index - 1
                });
            } else {
                tile = this.statusBar.addLeftTile({
                    item: view,
                    priority: 11 + index + 1
                });
            }
            this.disposable.add(atom.config.observe(config, function (value) {
                if (value) {
                    view.classList.add("text-success");
                } else {
                    view.classList.remove("text-success");
                }
            }));
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
                tile.destroy();
                view.remove();
            }));
            this.disposable.add(_omni.Omni.activeEditor.subscribe(function (editor) {
                return editor ? view.style.display = "" : view.style.display = "none";
            }));
        }
    }]);

    return FeatureEditorButtons;
}();

var FeatureButtons = function () {
    function FeatureButtons() {
        _classCallCheck(this, FeatureButtons);

        this.required = false;
        this.title = "Show Feature Toggles";
        this.description = "Shows feature toggle buttons in the omnisharp window.";
        this.default = true;
    }

    _createClass(FeatureButtons, [{
        key: "activate",
        value: function activate() {
            var _this3 = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            (0, _lodash.each)(buttons, function (button, index) {
                return _this3._button(button, index);
            });
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "_button",
        value: function _button(button, index) {
            var _this4 = this;

            var config = button.config;

            var buttonDisposable = void 0;
            this.disposable.add(atom.config.observe(config, function (value) {
                if (buttonDisposable) {
                    _this4.disposable.remove(buttonDisposable);
                    buttonDisposable.dispose();
                }
                buttonDisposable = _this4._makeButton(button, index, value);
                _this4.disposable.add(buttonDisposable);
            }));
            this.disposable.add(_omnisharpClient.Disposable.create(function () {
                buttonDisposable.dispose();
            }));
        }
    }, {
        key: "_makeButton",
        value: function _makeButton(button, index, enabled) {
            var _this5 = this;

            var name = button.name;
            var config = button.config;
            var icon = button.icon;
            var tooltip = button.tooltip;

            var tooltipDisposable = void 0;
            var htmlButton = document.createElement("a");
            htmlButton.id = icon + "-name";
            htmlButton.classList.add("btn", icon);
            if (enabled) {
                htmlButton.classList.add("btn-success");
            }
            htmlButton.onclick = function () {
                return atom.config.set(config, !atom.config.get(config));
            };
            htmlButton.onmouseenter = function (e) {
                tooltipDisposable = atom.tooltips.add(e.currentTarget, { title: tooltip });
                _this5.disposable.add(tooltipDisposable);
            };
            htmlButton.onmouseleave = function (e) {
                if (tooltipDisposable) {
                    _this5.disposable.remove(tooltipDisposable);
                    tooltipDisposable.dispose();
                }
            };
            var buttonDisposable = _dock.dock.addButton(name + "-button", tooltip, htmlButton, { priority: 500 + index });
            return buttonDisposable;
        }
    }]);

    return FeatureButtons;
}();

var featureButtons = exports.featureButtons = new FeatureButtons();
var featureEditorButtons = exports.featureEditorButtons = new FeatureEditorButtons();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL2ZlYXR1cmUtYnV0dG9ucy5qcyIsImxpYi9hdG9tL2ZlYXR1cmUtYnV0dG9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7QUFDQTs7OztBQ1NBLElBQU0sVUFBVSxDQUNaO0FBQ0ksVUFBTSx1QkFEVjtBQUVJLFlBQVEscUNBRlo7QUFHSSxVQUFNLGFBSFY7QUFJSSxhQUFTO0FBSmIsQ0FEWSxFQU1UO0FBQ0MsVUFBTSxXQURQO0FBRUMsWUFBUSx5QkFGVDtBQUdDLFVBQU0sZ0JBSFA7QUFJQyxhQUFTO0FBSlYsQ0FOUyxDQUFoQjs7SUFhQSxvQjtBQUFBLG9DQUFBO0FBQUE7O0FBR1ksYUFBQSxPQUFBLEdBQVUsS0FBVjtBQTRFRCxhQUFBLFFBQUEsR0FBVyxLQUFYO0FBQ0EsYUFBQSxLQUFBLEdBQVEsNkJBQVI7QUFDQSxhQUFBLFdBQUEsR0FBYyw2Q0FBZDtBQUNBLGFBQUEsT0FBQSxHQUFVLElBQVY7QUFDVjs7OzttQ0E5RWtCO0FBQ1gsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEI7QUFDSDs7O2tDQUVhO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQjtBQUNIOzs7OEJBRVksUyxFQUFjO0FBQ3ZCLGlCQUFLLFNBQUwsR0FBaUIsU0FBakI7QUFFQSxnQkFBSSxLQUFLLE9BQVQsRUFBa0I7QUFDZCxxQkFBSyxPQUFMO0FBQ0g7QUFDSjs7O2lDQUVZO0FBQ1QsZ0JBQUksS0FBSyxTQUFULEVBQW9CO0FBQUUscUJBQUssT0FBTDtBQUFpQjtBQUN2QyxpQkFBSyxPQUFMLEdBQWUsSUFBZjtBQUNIOzs7a0NBRWM7QUFBQTs7QUFDWCw4QkFBSyxPQUFMLEVBQWMsVUFBQyxNQUFELEVBQVMsS0FBVDtBQUFBLHVCQUFtQixNQUFLLE9BQUwsQ0FBYSxNQUFiLEVBQXFCLEtBQXJCLENBQW5CO0FBQUEsYUFBZDtBQUNIOzs7Z0NBRWUsTSxFQUFpQixLLEVBQWE7QUFBQTs7QUFBQSxnQkFDbkMs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LDJCQUFXLFNBQVgsQ0FBcUIsR0FBckIsQ0FBeUIsYUFBekI7QUFDSDtBQUVELHVCQUFXLE9BQVgsR0FBcUI7QUFBQSx1QkFBTSxLQUFLLE1BQUwsQ0FBWSxHQUFaLENBQWdCLE1BQWhCLEVBQXdCLENBQUMsS0FBSyxNQUFMLENBQVksR0FBWixDQUFnQixNQUFoQixDQUF6QixDQUFOO0FBQUEsYUFBckI7QUFDQSx1QkFBVyxZQUFYLEdBQTBCLFVBQUMsQ0FBRCxFQUFFO0FBQ3hCLG9DQUFvQixLQUFLLFFBQUwsQ0FBYyxHQUFkLENBQXVCLEVBQUUsYUFBekIsRUFBd0MsRUFBRSxPQUFPLE9BQVQsRUFBeEMsQ0FBcEI7QUFDQSx1QkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLGlCQUFwQjtBQUNILGFBSEQ7QUFJQSx1QkFBVyxZQUFYLEdBQTBCLFVBQUMsQ0FBRCxFQUFFO0FBQ3hCLG9CQUFJLGlCQUFKLEVBQXVCO0FBQ25CLDJCQUFLLFVBQUwsQ0FBZ0IsTUFBaEIsQ0FBdUIsaUJBQXZCO0FBQ0Esc0NBQWtCLE9BQWxCO0FBQ0g7QUFDSixhQUxEO0FBT0EsZ0JBQU0sbUJBQW1CLFdBQUssU0FBTCxDQUNsQixJQURrQixjQUVyQixPQUZxQixFQUdyQixVQUhxQixFQUlyQixFQUFFLFVBQVUsTUFBTSxLQUFsQixFQUpxQixDQUF6QjtBQU9BLG1CQUFPLGdCQUFQO0FBQ0g7Ozs7OztBQVFFLElBQU0sMENBQWlCLElBQUksY0FBSixFQUF2QjtBQUNBLElBQU0sc0RBQXVCLElBQUksb0JBQUosRUFBN0IiLCJmaWxlIjoibGliL2F0b20vZmVhdHVyZS1idXR0b25zLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBlYWNoIH0gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgZG9jayB9IGZyb20gXCIuLi9hdG9tL2RvY2tcIjtcbmNvbnN0IGJ1dHRvbnMgPSBbXG4gICAge1xuICAgICAgICBuYW1lOiBcImVuaGFuY2VkLWhpZ2hsaWdodGluZ1wiLFxuICAgICAgICBjb25maWc6IFwib21uaXNoYXJwLWF0b20uZW5oYW5jZWRIaWdobGlnaHRpbmdcIixcbiAgICAgICAgaWNvbjogXCJpY29uLXBlbmNpbFwiLFxuICAgICAgICB0b29sdGlwOiBcIkVuYWJsZSAvIERpc2FibGUgRW5oYW5jZWQgSGlnaGxpZ2h0aW5nXCJcbiAgICB9LCB7XG4gICAgICAgIG5hbWU6IFwiY29kZS1sZW5zXCIsXG4gICAgICAgIGNvbmZpZzogXCJvbW5pc2hhcnAtYXRvbS5jb2RlTGVuc1wiLFxuICAgICAgICBpY29uOiBcImljb24tdGVsZXNjb3BlXCIsXG4gICAgICAgIHRvb2x0aXA6IFwiRW5hYmxlIC8gRGlzYWJsZSBDb2RlIExlbnNcIlxuICAgIH1dO1xuY2xhc3MgRmVhdHVyZUVkaXRvckJ1dHRvbnMge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLl9hY3RpdmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJTaG93IEVkaXRvciBGZWF0dXJlIEJ1dHRvbnNcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiU2hvd3MgZmVhdHVyZSB0b2dnbGUgYnV0dG9ucyBpbiB0aGUgZWRpdG9yLlwiO1xuICAgICAgICB0aGlzLmRlZmF1bHQgPSB0cnVlO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgc2V0dXAoc3RhdHVzQmFyKSB7XG4gICAgICAgIHRoaXMuc3RhdHVzQmFyID0gc3RhdHVzQmFyO1xuICAgICAgICBpZiAodGhpcy5fYWN0aXZlKSB7XG4gICAgICAgICAgICB0aGlzLl9hdHRhY2goKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBhdHRhY2goKSB7XG4gICAgICAgIGlmICh0aGlzLnN0YXR1c0Jhcikge1xuICAgICAgICAgICAgdGhpcy5fYXR0YWNoKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fYWN0aXZlID0gdHJ1ZTtcbiAgICB9XG4gICAgX2F0dGFjaCgpIHtcbiAgICAgICAgZWFjaChidXR0b25zLCAoYnV0dG9uLCBpbmRleCkgPT4gdGhpcy5fYnV0dG9uKGJ1dHRvbiwgaW5kZXgpKTtcbiAgICB9XG4gICAgX2J1dHRvbihidXR0b24sIGluZGV4KSB7XG4gICAgICAgIGNvbnN0IHsgbmFtZSwgY29uZmlnLCBpY29uLCB0b29sdGlwIH0gPSBidXR0b247XG4gICAgICAgIGNvbnN0IHZpZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIsIGAke25hbWV9LWJ1dHRvbmAsIGljb24pO1xuICAgICAgICB2aWV3LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgdmlldy5vbmNsaWNrID0gKCkgPT4gYXRvbS5jb25maWcuc2V0KGNvbmZpZywgIWF0b20uY29uZmlnLmdldChjb25maWcpKTtcbiAgICAgICAgbGV0IHRvb2x0aXBEaXNwb3NhYmxlO1xuICAgICAgICB2aWV3Lm9ubW91c2VlbnRlciA9ICgpID0+IHtcbiAgICAgICAgICAgIHRvb2x0aXBEaXNwb3NhYmxlID0gYXRvbS50b29sdGlwcy5hZGQodmlldywgeyB0aXRsZTogdG9vbHRpcCB9KTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodG9vbHRpcERpc3Bvc2FibGUpO1xuICAgICAgICB9O1xuICAgICAgICB2aWV3Lm9ubW91c2VsZWF2ZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0b29sdGlwRGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodG9vbHRpcERpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgIHRvb2x0aXBEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHRpbGU7XG4gICAgICAgIGlmIChhdG9tLmNvbmZpZy5nZXQoXCJncmFtbWFyLXNlbGVjdG9yLnNob3dPblJpZ2h0U2lkZU9mU3RhdHVzQmFyXCIpKSB7XG4gICAgICAgICAgICB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkUmlnaHRUaWxlKHtcbiAgICAgICAgICAgICAgICBpdGVtOiB2aWV3LFxuICAgICAgICAgICAgICAgIHByaW9yaXR5OiA5IC0gaW5kZXggLSAxXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRpbGUgPSB0aGlzLnN0YXR1c0Jhci5hZGRMZWZ0VGlsZSh7XG4gICAgICAgICAgICAgICAgaXRlbTogdmlldyxcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogMTEgKyBpbmRleCArIDFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShjb25maWcsICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwidGV4dC1zdWNjZXNzXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmlldy5jbGFzc0xpc3QucmVtb3ZlKFwidGV4dC1zdWNjZXNzXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGlsZS5kZXN0cm95KCk7XG4gICAgICAgICAgICB2aWV3LnJlbW92ZSgpO1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVFZGl0b3JcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKGVkaXRvcikgPT4gZWRpdG9yID8gKHZpZXcuc3R5bGUuZGlzcGxheSA9IFwiXCIpIDogKHZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKSkpO1xuICAgIH1cbn1cbmNsYXNzIEZlYXR1cmVCdXR0b25zIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJTaG93IEZlYXR1cmUgVG9nZ2xlc1wiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJTaG93cyBmZWF0dXJlIHRvZ2dsZSBidXR0b25zIGluIHRoZSBvbW5pc2hhcnAgd2luZG93LlwiO1xuICAgICAgICB0aGlzLmRlZmF1bHQgPSB0cnVlO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgZWFjaChidXR0b25zLCAoYnV0dG9uLCBpbmRleCkgPT4gdGhpcy5fYnV0dG9uKGJ1dHRvbiwgaW5kZXgpKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgX2J1dHRvbihidXR0b24sIGluZGV4KSB7XG4gICAgICAgIGNvbnN0IHsgY29uZmlnIH0gPSBidXR0b247XG4gICAgICAgIGxldCBidXR0b25EaXNwb3NhYmxlO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoY29uZmlnLCAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIGlmIChidXR0b25EaXNwb3NhYmxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZShidXR0b25EaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICBidXR0b25EaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJ1dHRvbkRpc3Bvc2FibGUgPSB0aGlzLl9tYWtlQnV0dG9uKGJ1dHRvbiwgaW5kZXgsIHZhbHVlKTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYnV0dG9uRGlzcG9zYWJsZSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBidXR0b25EaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBfbWFrZUJ1dHRvbihidXR0b24sIGluZGV4LCBlbmFibGVkKSB7XG4gICAgICAgIGNvbnN0IHsgbmFtZSwgY29uZmlnLCBpY29uLCB0b29sdGlwIH0gPSBidXR0b247XG4gICAgICAgIGxldCB0b29sdGlwRGlzcG9zYWJsZTtcbiAgICAgICAgY29uc3QgaHRtbEJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgICAgICBodG1sQnV0dG9uLmlkID0gYCR7aWNvbn0tbmFtZWA7XG4gICAgICAgIGh0bWxCdXR0b24uY2xhc3NMaXN0LmFkZChcImJ0blwiLCBpY29uKTtcbiAgICAgICAgaWYgKGVuYWJsZWQpIHtcbiAgICAgICAgICAgIGh0bWxCdXR0b24uY2xhc3NMaXN0LmFkZChcImJ0bi1zdWNjZXNzXCIpO1xuICAgICAgICB9XG4gICAgICAgIGh0bWxCdXR0b24ub25jbGljayA9ICgpID0+IGF0b20uY29uZmlnLnNldChjb25maWcsICFhdG9tLmNvbmZpZy5nZXQoY29uZmlnKSk7XG4gICAgICAgIGh0bWxCdXR0b24ub25tb3VzZWVudGVyID0gKGUpID0+IHtcbiAgICAgICAgICAgIHRvb2x0aXBEaXNwb3NhYmxlID0gYXRvbS50b29sdGlwcy5hZGQoZS5jdXJyZW50VGFyZ2V0LCB7IHRpdGxlOiB0b29sdGlwIH0pO1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0b29sdGlwRGlzcG9zYWJsZSk7XG4gICAgICAgIH07XG4gICAgICAgIGh0bWxCdXR0b24ub25tb3VzZWxlYXZlID0gKGUpID0+IHtcbiAgICAgICAgICAgIGlmICh0b29sdGlwRGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodG9vbHRpcERpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgIHRvb2x0aXBEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgYnV0dG9uRGlzcG9zYWJsZSA9IGRvY2suYWRkQnV0dG9uKGAke25hbWV9LWJ1dHRvbmAsIHRvb2x0aXAsIGh0bWxCdXR0b24sIHsgcHJpb3JpdHk6IDUwMCArIGluZGV4IH0pO1xuICAgICAgICByZXR1cm4gYnV0dG9uRGlzcG9zYWJsZTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgZmVhdHVyZUJ1dHRvbnMgPSBuZXcgRmVhdHVyZUJ1dHRvbnMoKTtcbmV4cG9ydCBjb25zdCBmZWF0dXJlRWRpdG9yQnV0dG9ucyA9IG5ldyBGZWF0dXJlRWRpdG9yQnV0dG9ucygpO1xuIiwiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7ZWFjaH0gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7ZG9ja30gZnJvbSBcIi4uL2F0b20vZG9ja1wiO1xuXG5pbnRlcmZhY2UgSUJ1dHRvbiB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGNvbmZpZzogc3RyaW5nO1xuICAgIGljb246IHN0cmluZztcbiAgICB0b29sdGlwOiBzdHJpbmc7XG59XG5cbmNvbnN0IGJ1dHRvbnMgPSBbXG4gICAge1xuICAgICAgICBuYW1lOiBcImVuaGFuY2VkLWhpZ2hsaWdodGluZ1wiLFxuICAgICAgICBjb25maWc6IFwib21uaXNoYXJwLWF0b20uZW5oYW5jZWRIaWdobGlnaHRpbmdcIixcbiAgICAgICAgaWNvbjogXCJpY29uLXBlbmNpbFwiLFxuICAgICAgICB0b29sdGlwOiBcIkVuYWJsZSAvIERpc2FibGUgRW5oYW5jZWQgSGlnaGxpZ2h0aW5nXCJcbiAgICB9LCB7XG4gICAgICAgIG5hbWU6IFwiY29kZS1sZW5zXCIsXG4gICAgICAgIGNvbmZpZzogXCJvbW5pc2hhcnAtYXRvbS5jb2RlTGVuc1wiLFxuICAgICAgICBpY29uOiBcImljb24tdGVsZXNjb3BlXCIsXG4gICAgICAgIHRvb2x0aXA6IFwiRW5hYmxlIC8gRGlzYWJsZSBDb2RlIExlbnNcIlxuICAgIH1dO1xuXG5jbGFzcyBGZWF0dXJlRWRpdG9yQnV0dG9ucyBpbXBsZW1lbnRzIElBdG9tRmVhdHVyZSB7XG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuICAgIHByaXZhdGUgc3RhdHVzQmFyOiBhbnk7XG4gICAgcHJpdmF0ZSBfYWN0aXZlID0gZmFsc2U7XG5cbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHNldHVwKHN0YXR1c0JhcjogYW55KSB7XG4gICAgICAgIHRoaXMuc3RhdHVzQmFyID0gc3RhdHVzQmFyO1xuXG4gICAgICAgIGlmICh0aGlzLl9hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuX2F0dGFjaCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGF0dGFjaCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdHVzQmFyKSB7IHRoaXMuX2F0dGFjaCgpOyB9XG4gICAgICAgIHRoaXMuX2FjdGl2ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfYXR0YWNoKCkge1xuICAgICAgICBlYWNoKGJ1dHRvbnMsIChidXR0b24sIGluZGV4KSA9PiB0aGlzLl9idXR0b24oYnV0dG9uLCBpbmRleCkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2J1dHRvbihidXR0b246IElCdXR0b24sIGluZGV4OiBudW1iZXIpIHtcbiAgICAgICAgY29uc3Qge25hbWUsIGNvbmZpZywgaWNvbiwgdG9vbHRpcH0gPSBidXR0b247XG4gICAgICAgIGNvbnN0IHZpZXcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwiaW5saW5lLWJsb2NrXCIsIGAke25hbWV9LWJ1dHRvbmAsIGljb24pO1xuICAgICAgICB2aWV3LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgdmlldy5vbmNsaWNrID0gKCkgPT4gYXRvbS5jb25maWcuc2V0KGNvbmZpZywgIWF0b20uY29uZmlnLmdldChjb25maWcpKTtcblxuICAgICAgICBsZXQgdG9vbHRpcERpc3Bvc2FibGU6IElEaXNwb3NhYmxlO1xuICAgICAgICB2aWV3Lm9ubW91c2VlbnRlciA9ICgpID0+IHtcbiAgICAgICAgICAgIHRvb2x0aXBEaXNwb3NhYmxlID0gYXRvbS50b29sdGlwcy5hZGQodmlldywgeyB0aXRsZTogdG9vbHRpcCB9KTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodG9vbHRpcERpc3Bvc2FibGUpO1xuICAgICAgICB9O1xuICAgICAgICB2aWV3Lm9ubW91c2VsZWF2ZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0b29sdGlwRGlzcG9zYWJsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5yZW1vdmUodG9vbHRpcERpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgIHRvb2x0aXBEaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBsZXQgdGlsZTogYW55O1xuICAgICAgICBpZiAoYXRvbS5jb25maWcuZ2V0KFwiZ3JhbW1hci1zZWxlY3Rvci5zaG93T25SaWdodFNpZGVPZlN0YXR1c0JhclwiKSkge1xuICAgICAgICAgICAgdGlsZSA9IHRoaXMuc3RhdHVzQmFyLmFkZFJpZ2h0VGlsZSh7XG4gICAgICAgICAgICAgICAgaXRlbTogdmlldyxcbiAgICAgICAgICAgICAgICBwcmlvcml0eTogOSAtIGluZGV4IC0gMVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aWxlID0gdGhpcy5zdGF0dXNCYXIuYWRkTGVmdFRpbGUoe1xuICAgICAgICAgICAgICAgIGl0ZW06IHZpZXcsXG4gICAgICAgICAgICAgICAgcHJpb3JpdHk6IDExICsgaW5kZXggKyAxXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShjb25maWcsICh2YWx1ZTogYm9vbGVhbikgPT4ge1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmlldy5jbGFzc0xpc3QuYWRkKFwidGV4dC1zdWNjZXNzXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2aWV3LmNsYXNzTGlzdC5yZW1vdmUoXCJ0ZXh0LXN1Y2Nlc3NcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcblxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRpbGUuZGVzdHJveSgpO1xuICAgICAgICAgICAgdmlldy5yZW1vdmUoKTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hY3RpdmVFZGl0b3JcbiAgICAgICAgICAgIC5zdWJzY3JpYmUoKGVkaXRvcikgPT4gZWRpdG9yID8gKHZpZXcuc3R5bGUuZGlzcGxheSA9IFwiXCIpIDogKHZpZXcuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiKSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xuICAgIHB1YmxpYyB0aXRsZSA9IFwiU2hvdyBFZGl0b3IgRmVhdHVyZSBCdXR0b25zXCI7XG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJTaG93cyBmZWF0dXJlIHRvZ2dsZSBidXR0b25zIGluIHRoZSBlZGl0b3IuXCI7XG4gICAgcHVibGljIGRlZmF1bHQgPSB0cnVlO1xufVxuXG5jbGFzcyBGZWF0dXJlQnV0dG9ucyBpbXBsZW1lbnRzIElGZWF0dXJlIHtcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG5cbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGVhY2goYnV0dG9ucywgKGJ1dHRvbiwgaW5kZXgpID0+IHRoaXMuX2J1dHRvbihidXR0b24sIGluZGV4KSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfYnV0dG9uKGJ1dHRvbjogSUJ1dHRvbiwgaW5kZXg6IG51bWJlcikge1xuICAgICAgICBjb25zdCB7Y29uZmlnfSA9IGJ1dHRvbjtcblxuICAgICAgICBsZXQgYnV0dG9uRGlzcG9zYWJsZTogSURpc3Bvc2FibGU7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShjb25maWcsICh2YWx1ZTogYm9vbGVhbikgPT4ge1xuICAgICAgICAgICAgaWYgKGJ1dHRvbkRpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKGJ1dHRvbkRpc3Bvc2FibGUpO1xuICAgICAgICAgICAgICAgIGJ1dHRvbkRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBidXR0b25EaXNwb3NhYmxlID0gdGhpcy5fbWFrZUJ1dHRvbihidXR0b24sIGluZGV4LCB2YWx1ZSk7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKGJ1dHRvbkRpc3Bvc2FibGUpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBidXR0b25EaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX21ha2VCdXR0b24oYnV0dG9uOiBJQnV0dG9uLCBpbmRleDogbnVtYmVyLCBlbmFibGVkOiBib29sZWFuKSB7XG4gICAgICAgIGNvbnN0IHtuYW1lLCBjb25maWcsIGljb24sIHRvb2x0aXB9ID0gYnV0dG9uO1xuXG4gICAgICAgIGxldCB0b29sdGlwRGlzcG9zYWJsZTogSURpc3Bvc2FibGU7XG4gICAgICAgIGNvbnN0IGh0bWxCdXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICAgICAgaHRtbEJ1dHRvbi5pZCA9IGAke2ljb259LW5hbWVgO1xuICAgICAgICBodG1sQnV0dG9uLmNsYXNzTGlzdC5hZGQoXCJidG5cIixpY29uKTtcbiAgICAgICAgaWYgKGVuYWJsZWQpIHtcbiAgICAgICAgICAgIGh0bWxCdXR0b24uY2xhc3NMaXN0LmFkZChcImJ0bi1zdWNjZXNzXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaHRtbEJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gYXRvbS5jb25maWcuc2V0KGNvbmZpZywgIWF0b20uY29uZmlnLmdldChjb25maWcpKTtcbiAgICAgICAgaHRtbEJ1dHRvbi5vbm1vdXNlZW50ZXIgPSAoZSkgPT4ge1xuICAgICAgICAgICAgdG9vbHRpcERpc3Bvc2FibGUgPSBhdG9tLnRvb2x0aXBzLmFkZCg8YW55PmUuY3VycmVudFRhcmdldCwgeyB0aXRsZTogdG9vbHRpcCB9KTtcbiAgICAgICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQodG9vbHRpcERpc3Bvc2FibGUpO1xuICAgICAgICB9O1xuICAgICAgICBodG1sQnV0dG9uLm9ubW91c2VsZWF2ZSA9IChlKSA9PiB7XG4gICAgICAgICAgICBpZiAodG9vbHRpcERpc3Bvc2FibGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRvb2x0aXBEaXNwb3NhYmxlKTtcbiAgICAgICAgICAgICAgICB0b29sdGlwRGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgYnV0dG9uRGlzcG9zYWJsZSA9IGRvY2suYWRkQnV0dG9uKFxuICAgICAgICAgICAgYCR7bmFtZX0tYnV0dG9uYCxcbiAgICAgICAgICAgIHRvb2x0aXAsXG4gICAgICAgICAgICBodG1sQnV0dG9uLFxuICAgICAgICAgICAgeyBwcmlvcml0eTogNTAwICsgaW5kZXggfVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiBidXR0b25EaXNwb3NhYmxlO1xuICAgIH1cblxuICAgIHB1YmxpYyByZXF1aXJlZCA9IGZhbHNlO1xuICAgIHB1YmxpYyB0aXRsZSA9IFwiU2hvdyBGZWF0dXJlIFRvZ2dsZXNcIjtcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIlNob3dzIGZlYXR1cmUgdG9nZ2xlIGJ1dHRvbnMgaW4gdGhlIG9tbmlzaGFycCB3aW5kb3cuXCI7XG4gICAgcHVibGljIGRlZmF1bHQgPSB0cnVlO1xufVxuXG5leHBvcnQgY29uc3QgZmVhdHVyZUJ1dHRvbnMgPSBuZXcgRmVhdHVyZUJ1dHRvbnMoKTtcbmV4cG9ydCBjb25zdCBmZWF0dXJlRWRpdG9yQnV0dG9ucyA9IG5ldyBGZWF0dXJlRWRpdG9yQnV0dG9ucygpO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

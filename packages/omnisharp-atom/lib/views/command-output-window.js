"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CommandOutputWindow = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CommandOutputWindow = exports.CommandOutputWindow = function (_HTMLDivElement) {
    _inherits(CommandOutputWindow, _HTMLDivElement);

    function CommandOutputWindow() {
        var _Object$getPrototypeO;

        _classCallCheck(this, CommandOutputWindow);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(CommandOutputWindow)).call.apply(_Object$getPrototypeO, [this].concat(args)));

        _this.displayName = "CommandOutputWindow";
        return _this;
    }

    _createClass(CommandOutputWindow, [{
        key: "createdCallback",
        value: function createdCallback() {
            var _this2 = this;

            this.classList.add("omni-output-pane-view", "native-key-bindings");
            this.tabIndex = -1;
            this._container = document.createElement("div");
            this._container.classList.add("messages-container");
            this.appendChild(this._container);
            this._scrollToBottom = _lodash2.default.throttle(function () {
                var item = _this2.lastElementChild && _this2.lastElementChild.lastElementChild;
                if (item) item.scrollIntoViewIfNeeded();
            }, 100, { trailing: true });
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            _lodash2.default.defer(this._scrollToBottom, this);
        }
    }, {
        key: "addMessage",
        value: function addMessage(item) {
            var pre = document.createElement("pre");
            pre.innerText = item.message.trim();
            this._container.appendChild(pre);
            this._scrollToBottom();
        }
    }]);

    return CommandOutputWindow;
}(HTMLDivElement);

exports.CommandOutputWindow = document.registerElement("omnisharp-command-output", { prototype: CommandOutputWindow.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9jb21tYW5kLW91dHB1dC13aW5kb3cuanMiLCJsaWIvdmlld3MvY29tbWFuZC1vdXRwdXQtd2luZG93LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7Ozs7Ozs7Ozs7SUNHQSxtQixXQUFBLG1COzs7QUFBQSxtQ0FBQTtBQUFBOztBQUFBOztBQUFBLDBDQUFBLElBQUE7QUFBQSxnQkFBQTtBQUFBOztBQUFBLDBLQUF5QyxJQUF6Qzs7QUFDVyxjQUFBLFdBQUEsR0FBYyxxQkFBZDtBQURYO0FBOEJDOzs7OzBDQXpCeUI7QUFBQTs7QUFDbEIsaUJBQUssU0FBTCxDQUFlLEdBQWYsQ0FBbUIsdUJBQW5CLEVBQTJDLHFCQUEzQztBQUNBLGlCQUFLLFFBQUwsR0FBZ0IsQ0FBQyxDQUFqQjtBQUVBLGlCQUFLLFVBQUwsR0FBa0IsU0FBUyxhQUFULENBQXVCLEtBQXZCLENBQWxCO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixTQUFoQixDQUEwQixHQUExQixDQUE4QixvQkFBOUI7QUFDQSxpQkFBSyxXQUFMLENBQWlCLEtBQUssVUFBdEI7QUFFQSxpQkFBSyxlQUFMLEdBQXVCLGlCQUFFLFFBQUYsQ0FBVyxZQUFBO0FBQzlCLG9CQUFNLE9BQWEsT0FBSyxnQkFBTCxJQUF5QixPQUFLLGdCQUFMLENBQXNCLGdCQUFsRTtBQUNBLG9CQUFJLElBQUosRUFBVSxLQUFLLHNCQUFMO0FBQ2IsYUFIc0IsRUFHcEIsR0FIb0IsRUFHZixFQUFFLFVBQVUsSUFBWixFQUhlLENBQXZCO0FBSUg7OzsyQ0FFc0I7QUFDbkIsNkJBQUUsS0FBRixDQUFRLEtBQUssZUFBYixFQUE4QixJQUE5QjtBQUNIOzs7bUNBRWlCLEksRUFBeUI7QUFDdkMsZ0JBQU0sTUFBTSxTQUFTLGFBQVQsQ0FBdUIsS0FBdkIsQ0FBWjtBQUNBLGdCQUFJLFNBQUosR0FBZ0IsS0FBSyxPQUFMLENBQWEsSUFBYixFQUFoQjtBQUVBLGlCQUFLLFVBQUwsQ0FBZ0IsV0FBaEIsQ0FBNEIsR0FBNUI7QUFDQSxpQkFBSyxlQUFMO0FBQ0g7Ozs7RUE3Qm9DLGM7O0FBZ0NuQyxRQUFTLG1CQUFULEdBQXFDLFNBQVUsZUFBVixDQUEwQiwwQkFBMUIsRUFBc0QsRUFBRSxXQUFXLG9CQUFvQixTQUFqQyxFQUF0RCxDQUFyQyIsImZpbGUiOiJsaWIvdmlld3MvY29tbWFuZC1vdXRwdXQtd2luZG93LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuZXhwb3J0IGNsYXNzIENvbW1hbmRPdXRwdXRXaW5kb3cgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCB7XG4gICAgY29uc3RydWN0b3IoLi4uYXJncykge1xuICAgICAgICBzdXBlciguLi5hcmdzKTtcbiAgICAgICAgdGhpcy5kaXNwbGF5TmFtZSA9IFwiQ29tbWFuZE91dHB1dFdpbmRvd1wiO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm9tbmktb3V0cHV0LXBhbmUtdmlld1wiLCBcIm5hdGl2ZS1rZXktYmluZGluZ3NcIik7XG4gICAgICAgIHRoaXMudGFiSW5kZXggPSAtMTtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoXCJtZXNzYWdlcy1jb250YWluZXJcIik7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fY29udGFpbmVyKTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsVG9Cb3R0b20gPSBfLnRocm90dGxlKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSAodGhpcy5sYXN0RWxlbWVudENoaWxkICYmIHRoaXMubGFzdEVsZW1lbnRDaGlsZC5sYXN0RWxlbWVudENoaWxkKTtcbiAgICAgICAgICAgIGlmIChpdGVtKVxuICAgICAgICAgICAgICAgIGl0ZW0uc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpO1xuICAgICAgICB9LCAxMDAsIHsgdHJhaWxpbmc6IHRydWUgfSk7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIF8uZGVmZXIodGhpcy5fc2Nyb2xsVG9Cb3R0b20sIHRoaXMpO1xuICAgIH1cbiAgICBhZGRNZXNzYWdlKGl0ZW0pIHtcbiAgICAgICAgY29uc3QgcHJlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInByZVwiKTtcbiAgICAgICAgcHJlLmlubmVyVGV4dCA9IGl0ZW0ubWVzc2FnZS50cmltKCk7XG4gICAgICAgIHRoaXMuX2NvbnRhaW5lci5hcHBlbmRDaGlsZChwcmUpO1xuICAgICAgICB0aGlzLl9zY3JvbGxUb0JvdHRvbSgpO1xuICAgIH1cbn1cbmV4cG9ydHMuQ29tbWFuZE91dHB1dFdpbmRvdyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1jb21tYW5kLW91dHB1dFwiLCB7IHByb3RvdHlwZTogQ29tbWFuZE91dHB1dFdpbmRvdy5wcm90b3R5cGUgfSk7XG4iLCIvKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuXG5leHBvcnQgY2xhc3MgQ29tbWFuZE91dHB1dFdpbmRvdyBleHRlbmRzIEhUTUxEaXZFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcbiAgICBwdWJsaWMgZGlzcGxheU5hbWUgPSBcIkNvbW1hbmRPdXRwdXRXaW5kb3dcIjtcbiAgICBwcml2YXRlIF9jb250YWluZXI6IEhUTUxEaXZFbGVtZW50O1xuICAgIHByaXZhdGUgX3Njcm9sbFRvQm90dG9tOiAoKSA9PiB2b2lkO1xuXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwib21uaS1vdXRwdXQtcGFuZS12aWV3XCIsXCJuYXRpdmUta2V5LWJpbmRpbmdzXCIpO1xuICAgICAgICB0aGlzLnRhYkluZGV4ID0gLTE7XG5cbiAgICAgICAgdGhpcy5fY29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoXCJtZXNzYWdlcy1jb250YWluZXJcIik7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fY29udGFpbmVyKTtcblxuICAgICAgICB0aGlzLl9zY3JvbGxUb0JvdHRvbSA9IF8udGhyb3R0bGUoKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgaXRlbSA9IDxhbnk+KHRoaXMubGFzdEVsZW1lbnRDaGlsZCAmJiB0aGlzLmxhc3RFbGVtZW50Q2hpbGQubGFzdEVsZW1lbnRDaGlsZCk7XG4gICAgICAgICAgICBpZiAoaXRlbSkgaXRlbS5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKCk7XG4gICAgICAgIH0sIDEwMCwgeyB0cmFpbGluZzogdHJ1ZSB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgXy5kZWZlcih0aGlzLl9zY3JvbGxUb0JvdHRvbSwgdGhpcyk7XG4gICAgfVxuXG4gICAgcHVibGljIGFkZE1lc3NhZ2UoaXRlbTogeyBtZXNzYWdlOiBzdHJpbmcgfSkge1xuICAgICAgICBjb25zdCBwcmUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwicHJlXCIpO1xuICAgICAgICBwcmUuaW5uZXJUZXh0ID0gaXRlbS5tZXNzYWdlLnRyaW0oKTtcblxuICAgICAgICB0aGlzLl9jb250YWluZXIuYXBwZW5kQ2hpbGQocHJlKTtcbiAgICAgICAgdGhpcy5fc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICB9XG59XG5cbig8YW55PmV4cG9ydHMpLkNvbW1hbmRPdXRwdXRXaW5kb3cgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWNvbW1hbmQtb3V0cHV0XCIsIHsgcHJvdG90eXBlOiBDb21tYW5kT3V0cHV0V2luZG93LnByb3RvdHlwZSB9KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OutputWindow = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ansiToHtml = require("../services/ansi-to-html");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _serverInformation = require("../atom/server-information");

var _omnisharpClient = require("omnisharp-client");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var OutputWindow = exports.OutputWindow = function (_HTMLDivElement) {
    _inherits(OutputWindow, _HTMLDivElement);

    function OutputWindow() {
        var _Object$getPrototypeO;

        _classCallCheck(this, OutputWindow);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(OutputWindow)).call.apply(_Object$getPrototypeO, [this].concat(args)));

        _this.displayName = "OutputWindow";
        return _this;
    }

    _createClass(OutputWindow, [{
        key: "createdCallback",
        value: function createdCallback() {
            this._convert = new _ansiToHtml.Convert();
            this._output = [];
            this.classList.add("omni-output-pane-view", "native-key-bindings");
            this.tabIndex = -1;
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            var _this2 = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add(_serverInformation.server.observe.outputElement.subscribe(function (element) {
                _lodash2.default.each(_this2.children, function (child) {
                    return child.remove();
                });
                _this2.appendChild(element);
            }));
            this.disposable.add(_serverInformation.server.observe.output.delay(100).subscribe(function () {
                return _this2.scrollToBottom();
            }));
            this.scrollToBottom();
        }
    }, {
        key: "detachedCallback",
        value: function detachedCallback() {
            this.disposable.dispose();
        }
    }, {
        key: "scrollToBottom",
        value: function scrollToBottom() {
            var item = this.lastElementChild && this.lastElementChild.lastElementChild;
            if (item) item.scrollIntoViewIfNeeded();
        }
    }]);

    return OutputWindow;
}(HTMLDivElement);

exports.OutputWindow = document.registerElement("omnisharp-output-window", { prototype: OutputWindow.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9vbW5pLW91dHB1dC1wYW5lLXZpZXcuanMiLCJsaWIvdmlld3Mvb21uaS1vdXRwdXQtcGFuZS12aWV3LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7SUNHQSxZLFdBQUEsWTs7O0FBQUEsNEJBQUE7QUFBQTs7QUFBQTs7QUFBQSwwQ0FBQSxJQUFBO0FBQUEsZ0JBQUE7QUFBQTs7QUFBQSxtS0FBa0MsSUFBbEM7O0FBQ1csY0FBQSxXQUFBLEdBQWMsY0FBZDtBQURYO0FBZ0NDOzs7OzBDQTFCeUI7QUFDbEIsaUJBQUssUUFBTCxHQUFnQix5QkFBaEI7QUFDQSxpQkFBSyxPQUFMLEdBQWUsRUFBZjtBQUVBLGlCQUFLLFNBQUwsQ0FBZSxHQUFmLENBQW1CLHVCQUFuQixFQUE0QyxxQkFBNUM7QUFDQSxpQkFBSyxRQUFMLEdBQWdCLENBQUMsQ0FBakI7QUFDSDs7OzJDQUVzQjtBQUFBOztBQUNuQixpQkFBSyxVQUFMLEdBQWtCLDBDQUFsQjtBQUNBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsMEJBQU8sT0FBUCxDQUFlLGFBQWYsQ0FBNkIsU0FBN0IsQ0FBdUMsbUJBQU87QUFDOUQsaUNBQUUsSUFBRixDQUFPLE9BQUssUUFBWixFQUFzQjtBQUFBLDJCQUFTLE1BQU0sTUFBTixFQUFUO0FBQUEsaUJBQXRCO0FBQ0EsdUJBQUssV0FBTCxDQUFpQixPQUFqQjtBQUNILGFBSG1CLENBQXBCO0FBSUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQiwwQkFBTyxPQUFQLENBQWUsTUFBZixDQUFzQixLQUF0QixDQUE0QixHQUE1QixFQUFpQyxTQUFqQyxDQUEyQztBQUFBLHVCQUFNLE9BQUssY0FBTCxFQUFOO0FBQUEsYUFBM0MsQ0FBcEI7QUFDQSxpQkFBSyxjQUFMO0FBQ0g7OzsyQ0FFc0I7QUFDbkIsaUJBQUssVUFBTCxDQUFnQixPQUFoQjtBQUNIOzs7eUNBRXFCO0FBQ2xCLGdCQUFNLE9BQWEsS0FBSyxnQkFBTCxJQUF5QixLQUFLLGdCQUFMLENBQXNCLGdCQUFsRTtBQUNBLGdCQUFJLElBQUosRUFBVSxLQUFLLHNCQUFMO0FBQ2I7Ozs7RUEvQjZCLGM7O0FBa0M1QixRQUFTLFlBQVQsR0FBOEIsU0FBVSxlQUFWLENBQTBCLHlCQUExQixFQUFxRCxFQUFFLFdBQVcsYUFBYSxTQUExQixFQUFyRCxDQUE5QiIsImZpbGUiOiJsaWIvdmlld3Mvb21uaS1vdXRwdXQtcGFuZS12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29udmVydCB9IGZyb20gXCIuLi9zZXJ2aWNlcy9hbnNpLXRvLWh0bWxcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IHNlcnZlciB9IGZyb20gXCIuLi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvblwiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5leHBvcnQgY2xhc3MgT3V0cHV0V2luZG93IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICAgICAgc3VwZXIoLi4uYXJncyk7XG4gICAgICAgIHRoaXMuZGlzcGxheU5hbWUgPSBcIk91dHB1dFdpbmRvd1wiO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2NvbnZlcnQgPSBuZXcgQ29udmVydCgpO1xuICAgICAgICB0aGlzLl9vdXRwdXQgPSBbXTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwib21uaS1vdXRwdXQtcGFuZS12aWV3XCIsIFwibmF0aXZlLWtleS1iaW5kaW5nc1wiKTtcbiAgICAgICAgdGhpcy50YWJJbmRleCA9IC0xO1xuICAgIH1cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm91dHB1dEVsZW1lbnQuc3Vic2NyaWJlKGVsZW1lbnQgPT4ge1xuICAgICAgICAgICAgXy5lYWNoKHRoaXMuY2hpbGRyZW4sIGNoaWxkID0+IGNoaWxkLnJlbW92ZSgpKTtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoZWxlbWVudCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChzZXJ2ZXIub2JzZXJ2ZS5vdXRwdXQuZGVsYXkoMTAwKS5zdWJzY3JpYmUoKCkgPT4gdGhpcy5zY3JvbGxUb0JvdHRvbSgpKSk7XG4gICAgICAgIHRoaXMuc2Nyb2xsVG9Cb3R0b20oKTtcbiAgICB9XG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgc2Nyb2xsVG9Cb3R0b20oKSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSAodGhpcy5sYXN0RWxlbWVudENoaWxkICYmIHRoaXMubGFzdEVsZW1lbnRDaGlsZC5sYXN0RWxlbWVudENoaWxkKTtcbiAgICAgICAgaWYgKGl0ZW0pXG4gICAgICAgICAgICBpdGVtLnNjcm9sbEludG9WaWV3SWZOZWVkZWQoKTtcbiAgICB9XG59XG5leHBvcnRzLk91dHB1dFdpbmRvdyA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1vdXRwdXQtd2luZG93XCIsIHsgcHJvdG90eXBlOiBPdXRwdXRXaW5kb3cucHJvdG90eXBlIH0pO1xuIiwiLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cbmltcG9ydCB7Q29udmVydH0gZnJvbSBcIi4uL3NlcnZpY2VzL2Fuc2ktdG8taHRtbFwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHtzZXJ2ZXJ9IGZyb20gXCIuLi9hdG9tL3NlcnZlci1pbmZvcm1hdGlvblwiO1xuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuXG5leHBvcnQgY2xhc3MgT3V0cHV0V2luZG93IGV4dGVuZHMgSFRNTERpdkVsZW1lbnQgaW1wbGVtZW50cyBXZWJDb21wb25lbnQge1xuICAgIHB1YmxpYyBkaXNwbGF5TmFtZSA9IFwiT3V0cHV0V2luZG93XCI7XG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuICAgIHByaXZhdGUgX2NvbnZlcnQ6IGFueTtcbiAgICBwcml2YXRlIF9vdXRwdXQ6IE91dHB1dE1lc3NhZ2VbXTtcblxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX2NvbnZlcnQgPSBuZXcgQ29udmVydCgpO1xuICAgICAgICB0aGlzLl9vdXRwdXQgPSBbXTtcblxuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJvbW5pLW91dHB1dC1wYW5lLXZpZXdcIiwgXCJuYXRpdmUta2V5LWJpbmRpbmdzXCIpO1xuICAgICAgICB0aGlzLnRhYkluZGV4ID0gLTE7XG4gICAgfVxuXG4gICAgcHVibGljIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoc2VydmVyLm9ic2VydmUub3V0cHV0RWxlbWVudC5zdWJzY3JpYmUoZWxlbWVudCA9PiB7XG4gICAgICAgICAgICBfLmVhY2godGhpcy5jaGlsZHJlbiwgY2hpbGQgPT4gY2hpbGQucmVtb3ZlKCkpO1xuICAgICAgICAgICAgdGhpcy5hcHBlbmRDaGlsZChlbGVtZW50KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKHNlcnZlci5vYnNlcnZlLm91dHB1dC5kZWxheSgxMDApLnN1YnNjcmliZSgoKSA9PiB0aGlzLnNjcm9sbFRvQm90dG9tKCkpKTtcbiAgICAgICAgdGhpcy5zY3JvbGxUb0JvdHRvbSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZXRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2Nyb2xsVG9Cb3R0b20oKSB7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSA8YW55Pih0aGlzLmxhc3RFbGVtZW50Q2hpbGQgJiYgdGhpcy5sYXN0RWxlbWVudENoaWxkLmxhc3RFbGVtZW50Q2hpbGQpO1xuICAgICAgICBpZiAoaXRlbSkgaXRlbS5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKCk7XG4gICAgfVxufVxuXG4oPGFueT5leHBvcnRzKS5PdXRwdXRXaW5kb3cgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLW91dHB1dC13aW5kb3dcIiwgeyBwcm90b3R5cGU6IE91dHB1dFdpbmRvdy5wcm90b3R5cGUgfSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

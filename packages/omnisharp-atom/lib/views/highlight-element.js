"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.HighlightElement = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _textEditorPool = require("./text-editor-pool");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var HighlightElement = exports.HighlightElement = function (_HTMLElement) {
    _inherits(HighlightElement, _HTMLElement);

    function HighlightElement() {
        _classCallCheck(this, HighlightElement);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(HighlightElement).apply(this, arguments));
    }

    _createClass(HighlightElement, [{
        key: "createdCallback",
        value: function createdCallback() {
            this._editor = new _textEditorPool.EditorElement();
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            this.appendChild(this._editor);
        }
    }, {
        key: "detachedCallback",
        value: function detachedCallback() {
            this.removeChild(this._editor);
        }
    }, {
        key: "revert",
        value: function revert() {
            this._editor.revert();
        }
    }, {
        key: "enhance",
        value: function enhance() {
            this._editor.enhance();
        }
    }, {
        key: "usage",
        set: function set(usage) {
            this._editor.usage = usage;
        }
    }]);

    return HighlightElement;
}(HTMLElement);

exports.HighlightElement = document.registerElement("omnisharp-highlight-element", { prototype: HighlightElement.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9oaWdobGlnaHQtZWxlbWVudC5qcyIsImxpYi92aWV3cy9oaWdobGlnaHQtZWxlbWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7Ozs7Ozs7SUNHQSxnQixXQUFBLGdCOzs7Ozs7Ozs7OzswQ0FHMEI7QUFDbEIsaUJBQUssT0FBTCxHQUFlLG1DQUFmO0FBQ0g7OzsyQ0FFc0I7QUFDbkIsaUJBQUssV0FBTCxDQUFpQixLQUFLLE9BQXRCO0FBQ0g7OzsyQ0FFc0I7QUFDbkIsaUJBQUssV0FBTCxDQUFpQixLQUFLLE9BQXRCO0FBQ0g7OztpQ0FFWTtBQUNULGlCQUFLLE9BQUwsQ0FBYSxNQUFiO0FBQ0g7OztrQ0FFYTtBQUNWLGlCQUFLLE9BQUwsQ0FBYSxPQUFiO0FBQ0g7OzswQkFFZ0IsSyxFQUFzQjtBQUNuQyxpQkFBSyxPQUFMLENBQWEsS0FBYixHQUFxQixLQUFyQjtBQUNIOzs7O0VBekJpQyxXOztBQTRCaEMsUUFBUyxnQkFBVCxHQUFrQyxTQUFVLGVBQVYsQ0FBMEIsNkJBQTFCLEVBQXlELEVBQUUsV0FBVyxpQkFBaUIsU0FBOUIsRUFBekQsQ0FBbEMiLCJmaWxlIjoibGliL3ZpZXdzL2hpZ2hsaWdodC1lbGVtZW50LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRWRpdG9yRWxlbWVudCB9IGZyb20gXCIuL3RleHQtZWRpdG9yLXBvb2xcIjtcbmV4cG9ydCBjbGFzcyBIaWdobGlnaHRFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fZWRpdG9yID0gbmV3IEVkaXRvckVsZW1lbnQ7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQodGhpcy5fZWRpdG9yKTtcbiAgICB9XG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVDaGlsZCh0aGlzLl9lZGl0b3IpO1xuICAgIH1cbiAgICByZXZlcnQoKSB7XG4gICAgICAgIHRoaXMuX2VkaXRvci5yZXZlcnQoKTtcbiAgICB9XG4gICAgZW5oYW5jZSgpIHtcbiAgICAgICAgdGhpcy5fZWRpdG9yLmVuaGFuY2UoKTtcbiAgICB9XG4gICAgc2V0IHVzYWdlKHVzYWdlKSB7XG4gICAgICAgIHRoaXMuX2VkaXRvci51c2FnZSA9IHVzYWdlO1xuICAgIH1cbn1cbmV4cG9ydHMuSGlnaGxpZ2h0RWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1oaWdobGlnaHQtZWxlbWVudFwiLCB7IHByb3RvdHlwZTogSGlnaGxpZ2h0RWxlbWVudC5wcm90b3R5cGUgfSk7XG4iLCJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7RWRpdG9yRWxlbWVudH0gZnJvbSBcIi4vdGV4dC1lZGl0b3ItcG9vbFwiO1xuXG5leHBvcnQgY2xhc3MgSGlnaGxpZ2h0RWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcbiAgICBwcml2YXRlIF9lZGl0b3I6IEVkaXRvckVsZW1lbnQ7XG5cbiAgICBwdWJsaWMgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLl9lZGl0b3IgPSBuZXcgRWRpdG9yRWxlbWVudDtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9lZGl0b3IpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZXRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLnJlbW92ZUNoaWxkKHRoaXMuX2VkaXRvcik7XG4gICAgfVxuXG4gICAgcHVibGljIHJldmVydCgpIHtcbiAgICAgICAgdGhpcy5fZWRpdG9yLnJldmVydCgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBlbmhhbmNlKCkge1xuICAgICAgICB0aGlzLl9lZGl0b3IuZW5oYW5jZSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXQgdXNhZ2UodXNhZ2U6IE1vZGVscy5RdWlja0ZpeCkge1xuICAgICAgICB0aGlzLl9lZGl0b3IudXNhZ2UgPSB1c2FnZTtcbiAgICB9XG59XG5cbig8YW55PmV4cG9ydHMpLkhpZ2hsaWdodEVsZW1lbnQgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLWhpZ2hsaWdodC1lbGVtZW50XCIsIHsgcHJvdG90eXBlOiBIaWdobGlnaHRFbGVtZW50LnByb3RvdHlwZSB9KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

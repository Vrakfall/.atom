"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FindSymbolsView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omniSelectListView = require("../services/omni-select-list-view");

var _omni = require("../server/omni");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var FindSymbolsView = exports.FindSymbolsView = function (_OmniSelectListView) {
    _inherits(FindSymbolsView, _OmniSelectListView);

    function FindSymbolsView() {
        _classCallCheck(this, FindSymbolsView);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(FindSymbolsView).call(this, "Find Symbols"));

        _this.setMaxItems(50);
        return _this;
    }

    _createClass(FindSymbolsView, [{
        key: "viewForItem",
        value: function viewForItem(item) {
            return "<li>\n            <span>\n            <img style=\"margin-right: 0.75em;\" height=\"16px\" width=\"16px\" src=\"atom://omnisharp-atom/styles/icons/autocomplete_" + item.Kind.toLowerCase() + "@3x.png\" />\n            <span>" + item.Text + "</span>\n            </span>\n            <br/>\n            <span class=\"filename\">" + atom.project.relativizePath(item.FileName)[1] + ": " + item.Line + "</span>\n            </li>";
        }
    }, {
        key: "getFilterKey",
        value: function getFilterKey() {
            return "Text";
        }
    }, {
        key: "confirmed",
        value: function confirmed(item) {
            this.cancel();
            this.hide();
            _omni.Omni.navigateTo(item);
            return null;
        }
    }, {
        key: "onFilter",
        value: function onFilter(filter) {
            _omni.Omni.request(function (solution) {
                return solution.findsymbols({ Filter: filter });
            });
        }
    }, {
        key: "getMinQueryLength",
        value: function getMinQueryLength() {
            return 1;
        }
    }]);

    return FindSymbolsView;
}(_omniSelectListView.OmniSelectListView);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9maW5kLXN5bWJvbHMtdmlldy5qcyIsImxpYi92aWV3cy9maW5kLXN5bWJvbHMtdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7Ozs7Ozs7SUNHQSxlLFdBQUEsZTs7O0FBQ0ksK0JBQUE7QUFBQTs7QUFBQSx1R0FDVSxjQURWOztBQUdJLGNBQUssV0FBTCxDQUFpQixFQUFqQjtBQUhKO0FBSUM7Ozs7b0NBRWtCLEksRUFBMkI7QUFDMUMsd0xBRTBILEtBQUssSUFBTCxDQUFVLFdBQVYsRUFGMUgsd0NBR2EsS0FBSyxJQUhsQiw4RkFNOEIsS0FBSyxPQUFMLENBQWEsY0FBYixDQUE0QixLQUFLLFFBQWpDLEVBQTJDLENBQTNDLENBTjlCLFVBTWlGLEtBQUssSUFOdEY7QUFRSDs7O3VDQUVrQjtBQUNmLG1CQUFPLE1BQVA7QUFDSDs7O2tDQUVnQixJLEVBQVM7QUFDdEIsaUJBQUssTUFBTDtBQUNBLGlCQUFLLElBQUw7QUFFQSx1QkFBSyxVQUFMLENBQWdCLElBQWhCO0FBQ0EsbUJBQU8sSUFBUDtBQUNIOzs7aUNBRWUsTSxFQUFjO0FBQzFCLHVCQUFLLE9BQUwsQ0FBYTtBQUFBLHVCQUFhLFNBQVMsV0FBVCxDQUFxQixFQUFFLFFBQVEsTUFBVixFQUFyQixDQUFiO0FBQUEsYUFBYjtBQUNIOzs7NENBRXVCO0FBQ3BCLG1CQUFPLENBQVA7QUFDSCIsImZpbGUiOiJsaWIvdmlld3MvZmluZC1zeW1ib2xzLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPbW5pU2VsZWN0TGlzdFZpZXcgfSBmcm9tIFwiLi4vc2VydmljZXMvb21uaS1zZWxlY3QtbGlzdC12aWV3XCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5leHBvcnQgY2xhc3MgRmluZFN5bWJvbHNWaWV3IGV4dGVuZHMgT21uaVNlbGVjdExpc3RWaWV3IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJGaW5kIFN5bWJvbHNcIik7XG4gICAgICAgIHRoaXMuc2V0TWF4SXRlbXMoNTApO1xuICAgIH1cbiAgICB2aWV3Rm9ySXRlbShpdGVtKSB7XG4gICAgICAgIHJldHVybiBgPGxpPlxuICAgICAgICAgICAgPHNwYW4+XG4gICAgICAgICAgICA8aW1nIHN0eWxlPVwibWFyZ2luLXJpZ2h0OiAwLjc1ZW07XCIgaGVpZ2h0PVwiMTZweFwiIHdpZHRoPVwiMTZweFwiIHNyYz1cImF0b206Ly9vbW5pc2hhcnAtYXRvbS9zdHlsZXMvaWNvbnMvYXV0b2NvbXBsZXRlXyR7aXRlbS5LaW5kLnRvTG93ZXJDYXNlKCl9QDN4LnBuZ1wiIC8+XG4gICAgICAgICAgICA8c3Bhbj4ke2l0ZW0uVGV4dH08L3NwYW4+XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8YnIvPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJmaWxlbmFtZVwiPiR7YXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKGl0ZW0uRmlsZU5hbWUpWzFdfTogJHtpdGVtLkxpbmV9PC9zcGFuPlxuICAgICAgICAgICAgPC9saT5gO1xuICAgIH1cbiAgICBnZXRGaWx0ZXJLZXkoKSB7XG4gICAgICAgIHJldHVybiBcIlRleHRcIjtcbiAgICB9XG4gICAgY29uZmlybWVkKGl0ZW0pIHtcbiAgICAgICAgdGhpcy5jYW5jZWwoKTtcbiAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgICAgIE9tbmkubmF2aWdhdGVUbyhpdGVtKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIG9uRmlsdGVyKGZpbHRlcikge1xuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24uZmluZHN5bWJvbHMoeyBGaWx0ZXI6IGZpbHRlciB9KSk7XG4gICAgfVxuICAgIGdldE1pblF1ZXJ5TGVuZ3RoKCkge1xuICAgICAgICByZXR1cm4gMTtcbiAgICB9XG59XG4iLCJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7T21uaVNlbGVjdExpc3RWaWV3fSBmcm9tIFwiLi4vc2VydmljZXMvb21uaS1zZWxlY3QtbGlzdC12aWV3XCI7XG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuXG5leHBvcnQgY2xhc3MgRmluZFN5bWJvbHNWaWV3IGV4dGVuZHMgT21uaVNlbGVjdExpc3RWaWV3IHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJGaW5kIFN5bWJvbHNcIik7XG5cbiAgICAgICAgdGhpcy5zZXRNYXhJdGVtcyg1MCk7XG4gICAgfVxuXG4gICAgcHVibGljIHZpZXdGb3JJdGVtKGl0ZW06IE1vZGVscy5TeW1ib2xMb2NhdGlvbikge1xuICAgICAgICByZXR1cm4gYDxsaT5cbiAgICAgICAgICAgIDxzcGFuPlxuICAgICAgICAgICAgPGltZyBzdHlsZT1cIm1hcmdpbi1yaWdodDogMC43NWVtO1wiIGhlaWdodD1cIjE2cHhcIiB3aWR0aD1cIjE2cHhcIiBzcmM9XCJhdG9tOi8vb21uaXNoYXJwLWF0b20vc3R5bGVzL2ljb25zL2F1dG9jb21wbGV0ZV8keyBpdGVtLktpbmQudG9Mb3dlckNhc2UoKSB9QDN4LnBuZ1wiIC8+XG4gICAgICAgICAgICA8c3Bhbj4keyBpdGVtLlRleHQgfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIDxici8+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cImZpbGVuYW1lXCI+JHsgYXRvbS5wcm9qZWN0LnJlbGF0aXZpemVQYXRoKGl0ZW0uRmlsZU5hbWUpWzFdIH06ICR7aXRlbS5MaW5lfTwvc3Bhbj5cbiAgICAgICAgICAgIDwvbGk+YDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RmlsdGVyS2V5KCkge1xuICAgICAgICByZXR1cm4gXCJUZXh0XCI7XG4gICAgfVxuXG4gICAgcHVibGljIGNvbmZpcm1lZChpdGVtOiBhbnkpOiBhbnkge1xuICAgICAgICB0aGlzLmNhbmNlbCgpO1xuICAgICAgICB0aGlzLmhpZGUoKTtcblxuICAgICAgICBPbW5pLm5hdmlnYXRlVG8oaXRlbSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHB1YmxpYyBvbkZpbHRlcihmaWx0ZXI6IHN0cmluZykge1xuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gIHNvbHV0aW9uLmZpbmRzeW1ib2xzKHsgRmlsdGVyOiBmaWx0ZXIgfSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRNaW5RdWVyeUxlbmd0aCgpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

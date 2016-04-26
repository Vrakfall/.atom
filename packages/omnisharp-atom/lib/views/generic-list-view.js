"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.GenericSelectListView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _atomSpacePenViews = require("atom-space-pen-views");

var spacePen = _interopRequireWildcard(_atomSpacePenViews);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var GenericSelectListView = exports.GenericSelectListView = function (_spacePen$SelectListV) {
    _inherits(GenericSelectListView, _spacePen$SelectListV);

    function GenericSelectListView(messageText, _items, onConfirm, onCancel) {
        _classCallCheck(this, GenericSelectListView);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(GenericSelectListView).call(this));

        _this.messageText = messageText;
        _this._items = _items;
        _this.onConfirm = onConfirm;
        _this.onCancel = onCancel;
        _this._onClosed = new _rxjs.AsyncSubject();
        _this.keyBindings = null;
        return _this;
    }

    _createClass(GenericSelectListView, [{
        key: "initialize",
        value: function initialize() {
            spacePen.SelectListView.prototype.initialize.call(this);
            this.addClass("generic-list");
            this.message.text(this.messageText);
            return false;
        }
    }, {
        key: "getFilterKey",
        value: function getFilterKey() {
            return "displayName";
        }
    }, {
        key: "cancelled",
        value: function cancelled() {
            this.onCancel();
            return this.hide();
        }
    }, {
        key: "toggle",
        value: function toggle() {
            if (this.panel && this.panel.isVisible()) {
                this.cancel();
            } else {
                this.show();
            }
        }
    }, {
        key: "show",
        value: function show() {
            if (this.panel == null) {
                this.panel = atom.workspace.addModalPanel({ item: this });
            }
            this.panel.show();
            this.storeFocusedElement();
            if (this.previouslyFocusedElement[0] && this.previouslyFocusedElement[0] !== document.body) {
                this.eventElement = this.previouslyFocusedElement[0];
            } else {
                this.eventElement = atom.views.getView(atom.workspace);
            }
            this.keyBindings = atom.keymaps.findKeyBindings({
                target: this.eventElement
            });
            var commands = _lodash2.default.sortBy(this._items, "displayName");
            this.setItems(commands);
            this.focusFilterEditor();
        }
    }, {
        key: "hide",
        value: function hide() {
            this._onClosed.next(true);
            this._onClosed.complete();
            if (this.panel) {
                this.panel.hide();
            }
            this.panel.destroy();
            this.panel = null;
        }
    }, {
        key: "viewForItem",
        value: function viewForItem(item) {
            return spacePen.$$(function () {
                var _this2 = this;

                return this.li({
                    "class": "event",
                    "data-event-name": item.name
                }, function () {
                    return _this2.span(item.displayName, {
                        title: item.name
                    });
                });
            });
        }
    }, {
        key: "confirmed",
        value: function confirmed(item) {
            this.onConfirm(item.name);
            this.cancel();
            return null;
        }
    }, {
        key: "onClosed",
        get: function get() {
            return this._onClosed;
        }
    }], [{
        key: "content",
        value: function content() {
            var _this3 = this;

            return this.div({}, function () {
                _this3.p({
                    outlet: "message"
                }, "");
                spacePen.SelectListView.content.call(_this3);
            });
        }
    }]);

    return GenericSelectListView;
}(spacePen.SelectListView);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9nZW5lcmljLWxpc3Qtdmlldy5qcyIsImxpYi92aWV3cy9nZW5lcmljLWxpc3Qtdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUNBWSxROztBRENaOzs7O0FBQ0E7Ozs7Ozs7Ozs7OztJQ0VBLHFCLFdBQUEscUI7OztBQW1CSSxtQ0FBb0IsV0FBcEIsRUFBZ0QsTUFBaEQsRUFBeUcsU0FBekcsRUFBa0osUUFBbEosRUFBc0s7QUFBQTs7QUFBQTs7QUFBbEosY0FBQSxXQUFBLEdBQUEsV0FBQTtBQUE0QixjQUFBLE1BQUEsR0FBQSxNQUFBO0FBQXlELGNBQUEsU0FBQSxHQUFBLFNBQUE7QUFBeUMsY0FBQSxRQUFBLEdBQUEsUUFBQTtBQUwxSSxjQUFBLFNBQUEsR0FBWSx3QkFBWjtBQVNELGNBQUEsV0FBQSxHQUFtQixJQUFuQjtBQUorSjtBQUVySzs7OztxQ0FJZ0I7QUFDUCxxQkFBUyxjQUFULENBQXlCLFNBQXpCLENBQW1DLFVBQW5DLENBQThDLElBQTlDLENBQW1ELElBQW5EO0FBQ04saUJBQUssUUFBTCxDQUFjLGNBQWQ7QUFDQSxpQkFBSyxPQUFMLENBQWEsSUFBYixDQUFrQixLQUFLLFdBQXZCO0FBRUEsbUJBQU8sS0FBUDtBQUNIOzs7dUNBRWtCO0FBQ2YsbUJBQU8sYUFBUDtBQUNIOzs7b0NBRWU7QUFDWixpQkFBSyxRQUFMO0FBQ0EsbUJBQU8sS0FBSyxJQUFMLEVBQVA7QUFDSDs7O2lDQUVZO0FBQ1QsZ0JBQUksS0FBSyxLQUFMLElBQWMsS0FBSyxLQUFMLENBQVcsU0FBWCxFQUFsQixFQUEwQztBQUN0QyxxQkFBSyxNQUFMO0FBQ0gsYUFGRCxNQUVPO0FBQ0gscUJBQUssSUFBTDtBQUNIO0FBQ0o7OzsrQkFFVTtBQUNQLGdCQUFJLEtBQUssS0FBTCxJQUFjLElBQWxCLEVBQXdCO0FBQ3BCLHFCQUFLLEtBQUwsR0FBYSxLQUFLLFNBQUwsQ0FBZSxhQUFmLENBQTZCLEVBQUUsTUFBTSxJQUFSLEVBQTdCLENBQWI7QUFDSDtBQUNELGlCQUFLLEtBQUwsQ0FBVyxJQUFYO0FBQ0EsaUJBQUssbUJBQUw7QUFFQSxnQkFBSSxLQUFLLHdCQUFMLENBQThCLENBQTlCLEtBQW9DLEtBQUssd0JBQUwsQ0FBOEIsQ0FBOUIsTUFBcUMsU0FBUyxJQUF0RixFQUE0RjtBQUN4RixxQkFBSyxZQUFMLEdBQW9CLEtBQUssd0JBQUwsQ0FBOEIsQ0FBOUIsQ0FBcEI7QUFDSCxhQUZELE1BRU87QUFDSCxxQkFBSyxZQUFMLEdBQW9CLEtBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsS0FBSyxTQUF4QixDQUFwQjtBQUNIO0FBRUQsaUJBQUssV0FBTCxHQUFtQixLQUFLLE9BQUwsQ0FBYSxlQUFiLENBQTZCO0FBQzVDLHdCQUFRLEtBQUs7QUFEK0IsYUFBN0IsQ0FBbkI7QUFLQSxnQkFBTSxXQUFXLGlCQUFFLE1BQUYsQ0FBUyxLQUFLLE1BQWQsRUFBc0IsYUFBdEIsQ0FBakI7QUFDQSxpQkFBSyxRQUFMLENBQWMsUUFBZDtBQUNBLGlCQUFLLGlCQUFMO0FBQ0g7OzsrQkFFVTtBQUNQLGlCQUFLLFNBQUwsQ0FBZSxJQUFmLENBQW9CLElBQXBCO0FBQ0EsaUJBQUssU0FBTCxDQUFlLFFBQWY7QUFFQSxnQkFBSSxLQUFLLEtBQVQsRUFBZ0I7QUFDWixxQkFBSyxLQUFMLENBQVcsSUFBWDtBQUNIO0FBQ0QsaUJBQUssS0FBTCxDQUFXLE9BQVg7QUFDQSxpQkFBSyxLQUFMLEdBQWEsSUFBYjtBQUNIOzs7b0NBRWtCLEksRUFBNEM7QUFDM0QsbUJBQU8sU0FBUyxFQUFULENBQVksWUFBQTtBQUFBOztBQUNmLHVCQUFPLEtBQUssRUFBTCxDQUFRO0FBQ1gsNkJBQVMsT0FERTtBQUVYLHVDQUFtQixLQUFLO0FBRmIsaUJBQVIsRUFHSixZQUFBO0FBQ0MsMkJBQU8sT0FBSyxJQUFMLENBQVUsS0FBSyxXQUFmLEVBQTRCO0FBQy9CLCtCQUFPLEtBQUs7QUFEbUIscUJBQTVCLENBQVA7QUFHSCxpQkFQTSxDQUFQO0FBUUgsYUFUTSxDQUFQO0FBVUg7OztrQ0FFZ0IsSSxFQUFVO0FBQ3ZCLGlCQUFLLFNBQUwsQ0FBZSxLQUFLLElBQXBCO0FBQ0EsaUJBQUssTUFBTDtBQUVBLG1CQUFPLElBQVA7QUFDSDs7OzRCQXZGa0I7QUFBSyxtQkFBTyxLQUFLLFNBQVo7QUFBd0I7OztrQ0FkM0I7QUFBQTs7QUFDakIsbUJBQU8sS0FBSyxHQUFMLENBQVMsRUFBVCxFQUFhLFlBQUE7QUFDaEIsdUJBQUssQ0FBTCxDQUFPO0FBQ0gsNEJBQVE7QUFETCxpQkFBUCxFQUVHLEVBRkg7QUFJTSx5QkFBUyxjQUFULENBQXlCLE9BQXpCLENBQWlDLElBQWpDO0FBQ1QsYUFOTSxDQUFQO0FBT0g7Ozs7RUFUc0MsU0FBUyxjIiwiZmlsZSI6ImxpYi92aWV3cy9nZW5lcmljLWxpc3Qtdmlldy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHNwYWNlUGVuIGZyb20gXCJhdG9tLXNwYWNlLXBlbi12aWV3c1wiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgQXN5bmNTdWJqZWN0IH0gZnJvbSBcInJ4anNcIjtcbmV4cG9ydCBjbGFzcyBHZW5lcmljU2VsZWN0TGlzdFZpZXcgZXh0ZW5kcyBzcGFjZVBlbi5TZWxlY3RMaXN0VmlldyB7XG4gICAgY29uc3RydWN0b3IobWVzc2FnZVRleHQsIF9pdGVtcywgb25Db25maXJtLCBvbkNhbmNlbCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLm1lc3NhZ2VUZXh0ID0gbWVzc2FnZVRleHQ7XG4gICAgICAgIHRoaXMuX2l0ZW1zID0gX2l0ZW1zO1xuICAgICAgICB0aGlzLm9uQ29uZmlybSA9IG9uQ29uZmlybTtcbiAgICAgICAgdGhpcy5vbkNhbmNlbCA9IG9uQ2FuY2VsO1xuICAgICAgICB0aGlzLl9vbkNsb3NlZCA9IG5ldyBBc3luY1N1YmplY3QoKTtcbiAgICAgICAgdGhpcy5rZXlCaW5kaW5ncyA9IG51bGw7XG4gICAgfVxuICAgIHN0YXRpYyBjb250ZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaXYoe30sICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucCh7XG4gICAgICAgICAgICAgICAgb3V0bGV0OiBcIm1lc3NhZ2VcIlxuICAgICAgICAgICAgfSwgXCJcIik7XG4gICAgICAgICAgICBzcGFjZVBlbi5TZWxlY3RMaXN0Vmlldy5jb250ZW50LmNhbGwodGhpcyk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXQgb25DbG9zZWQoKSB7IHJldHVybiB0aGlzLl9vbkNsb3NlZDsgfVxuICAgIGluaXRpYWxpemUoKSB7XG4gICAgICAgIHNwYWNlUGVuLlNlbGVjdExpc3RWaWV3LnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcyk7XG4gICAgICAgIHRoaXMuYWRkQ2xhc3MoXCJnZW5lcmljLWxpc3RcIik7XG4gICAgICAgIHRoaXMubWVzc2FnZS50ZXh0KHRoaXMubWVzc2FnZVRleHQpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGdldEZpbHRlcktleSgpIHtcbiAgICAgICAgcmV0dXJuIFwiZGlzcGxheU5hbWVcIjtcbiAgICB9XG4gICAgY2FuY2VsbGVkKCkge1xuICAgICAgICB0aGlzLm9uQ2FuY2VsKCk7XG4gICAgICAgIHJldHVybiB0aGlzLmhpZGUoKTtcbiAgICB9XG4gICAgdG9nZ2xlKCkge1xuICAgICAgICBpZiAodGhpcy5wYW5lbCAmJiB0aGlzLnBhbmVsLmlzVmlzaWJsZSgpKSB7XG4gICAgICAgICAgICB0aGlzLmNhbmNlbCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5zaG93KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2hvdygpIHtcbiAgICAgICAgaWYgKHRoaXMucGFuZWwgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5wYW5lbCA9IGF0b20ud29ya3NwYWNlLmFkZE1vZGFsUGFuZWwoeyBpdGVtOiB0aGlzIH0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucGFuZWwuc2hvdygpO1xuICAgICAgICB0aGlzLnN0b3JlRm9jdXNlZEVsZW1lbnQoKTtcbiAgICAgICAgaWYgKHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50WzBdICYmIHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50WzBdICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50RWxlbWVudCA9IHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50WzBdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ldmVudEVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMua2V5QmluZGluZ3MgPSBhdG9tLmtleW1hcHMuZmluZEtleUJpbmRpbmdzKHtcbiAgICAgICAgICAgIHRhcmdldDogdGhpcy5ldmVudEVsZW1lbnRcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGNvbW1hbmRzID0gXy5zb3J0QnkodGhpcy5faXRlbXMsIFwiZGlzcGxheU5hbWVcIik7XG4gICAgICAgIHRoaXMuc2V0SXRlbXMoY29tbWFuZHMpO1xuICAgICAgICB0aGlzLmZvY3VzRmlsdGVyRWRpdG9yKCk7XG4gICAgfVxuICAgIGhpZGUoKSB7XG4gICAgICAgIHRoaXMuX29uQ2xvc2VkLm5leHQodHJ1ZSk7XG4gICAgICAgIHRoaXMuX29uQ2xvc2VkLmNvbXBsZXRlKCk7XG4gICAgICAgIGlmICh0aGlzLnBhbmVsKSB7XG4gICAgICAgICAgICB0aGlzLnBhbmVsLmhpZGUoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBhbmVsLmRlc3Ryb3koKTtcbiAgICAgICAgdGhpcy5wYW5lbCA9IG51bGw7XG4gICAgfVxuICAgIHZpZXdGb3JJdGVtKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIHNwYWNlUGVuLiQkKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxpKHtcbiAgICAgICAgICAgICAgICBcImNsYXNzXCI6IFwiZXZlbnRcIixcbiAgICAgICAgICAgICAgICBcImRhdGEtZXZlbnQtbmFtZVwiOiBpdGVtLm5hbWVcbiAgICAgICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zcGFuKGl0ZW0uZGlzcGxheU5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGl0ZW0ubmFtZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBjb25maXJtZWQoaXRlbSkge1xuICAgICAgICB0aGlzLm9uQ29uZmlybShpdGVtLm5hbWUpO1xuICAgICAgICB0aGlzLmNhbmNlbCgpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBzcGFjZVBlbiBmcm9tIFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIjtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7QXN5bmNTdWJqZWN0fSBmcm9tIFwicnhqc1wiO1xuXG5leHBvcnQgY2xhc3MgR2VuZXJpY1NlbGVjdExpc3RWaWV3IGV4dGVuZHMgc3BhY2VQZW4uU2VsZWN0TGlzdFZpZXcge1xuICAgIHB1YmxpYyBzdGF0aWMgY29udGVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGl2KHt9LCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnAoe1xuICAgICAgICAgICAgICAgIG91dGxldDogXCJtZXNzYWdlXCJcbiAgICAgICAgICAgIH0sIFwiXCIpO1xuXG4gICAgICAgICAgICAoPGFueT5zcGFjZVBlbi5TZWxlY3RMaXN0VmlldykuY29udGVudC5jYWxsKHRoaXMpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHBhbmVsOiBBdG9tLlBhbmVsO1xuICAgIHByaXZhdGUgcHJldmlvdXNseUZvY3VzZWRFbGVtZW50OiBOb2RlO1xuICAgIHByaXZhdGUgZXZlbnRFbGVtZW50OiBhbnk7XG4gICAgcHJpdmF0ZSBfb25DbG9zZWQgPSBuZXcgQXN5bmNTdWJqZWN0PGJvb2xlYW4+KCk7XG4gICAgcHVibGljIGdldCBvbkNsb3NlZCgpIHsgcmV0dXJuIHRoaXMuX29uQ2xvc2VkOyB9XG5cbiAgICBwdWJsaWMgbWVzc2FnZTogSlF1ZXJ5O1xuXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBtZXNzYWdlVGV4dDogc3RyaW5nLCBwdWJsaWMgX2l0ZW1zOiB7IGRpc3BsYXlOYW1lOiBzdHJpbmc7IG5hbWU6IHN0cmluZzsgfVtdLCBwdWJsaWMgb25Db25maXJtOiAocmVzdWx0OiBhbnkpID0+IHZvaWQsIHB1YmxpYyBvbkNhbmNlbDogKCkgPT4gdm9pZCkge1xuICAgICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIHB1YmxpYyBrZXlCaW5kaW5nczogYW55ID0gbnVsbDtcblxuICAgIHB1YmxpYyBpbml0aWFsaXplKCkge1xuICAgICAgICAoPGFueT5zcGFjZVBlbi5TZWxlY3RMaXN0VmlldykucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzKTtcbiAgICAgICAgdGhpcy5hZGRDbGFzcyhcImdlbmVyaWMtbGlzdFwiKTtcbiAgICAgICAgdGhpcy5tZXNzYWdlLnRleHQodGhpcy5tZXNzYWdlVGV4dCk7XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRGaWx0ZXJLZXkoKSB7XG4gICAgICAgIHJldHVybiBcImRpc3BsYXlOYW1lXCI7XG4gICAgfVxuXG4gICAgcHVibGljIGNhbmNlbGxlZCgpIHtcbiAgICAgICAgdGhpcy5vbkNhbmNlbCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5oaWRlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHRvZ2dsZSgpIHtcbiAgICAgICAgaWYgKHRoaXMucGFuZWwgJiYgdGhpcy5wYW5lbC5pc1Zpc2libGUoKSkge1xuICAgICAgICAgICAgdGhpcy5jYW5jZWwoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2hvdygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHNob3coKSB7XG4gICAgICAgIGlmICh0aGlzLnBhbmVsID09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMucGFuZWwgPSBhdG9tLndvcmtzcGFjZS5hZGRNb2RhbFBhbmVsKHsgaXRlbTogdGhpcyB9KTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnBhbmVsLnNob3coKTtcbiAgICAgICAgdGhpcy5zdG9yZUZvY3VzZWRFbGVtZW50KCk7XG5cbiAgICAgICAgaWYgKHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50WzBdICYmIHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50WzBdICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50RWxlbWVudCA9IHRoaXMucHJldmlvdXNseUZvY3VzZWRFbGVtZW50WzBdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ldmVudEVsZW1lbnQgPSBhdG9tLnZpZXdzLmdldFZpZXcoYXRvbS53b3Jrc3BhY2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5rZXlCaW5kaW5ncyA9IGF0b20ua2V5bWFwcy5maW5kS2V5QmluZGluZ3Moe1xuICAgICAgICAgICAgdGFyZ2V0OiB0aGlzLmV2ZW50RWxlbWVudFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBpbmZlciB0aGUgZ2VuZXJhdG9yIHNvbWVob3c/IGJhc2VkIG9uIHRoZSBwcm9qZWN0IGluZm9ybWF0aW9uPyAgc3RvcmUgaW4gdGhlIHByb2plY3Qgc3lzdGVtPz9cbiAgICAgICAgY29uc3QgY29tbWFuZHMgPSBfLnNvcnRCeSh0aGlzLl9pdGVtcywgXCJkaXNwbGF5TmFtZVwiKTtcbiAgICAgICAgdGhpcy5zZXRJdGVtcyhjb21tYW5kcyk7XG4gICAgICAgIHRoaXMuZm9jdXNGaWx0ZXJFZGl0b3IoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaGlkZSgpIHtcbiAgICAgICAgdGhpcy5fb25DbG9zZWQubmV4dCh0cnVlKTtcbiAgICAgICAgdGhpcy5fb25DbG9zZWQuY29tcGxldGUoKTtcblxuICAgICAgICBpZiAodGhpcy5wYW5lbCkge1xuICAgICAgICAgICAgdGhpcy5wYW5lbC5oaWRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wYW5lbC5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMucGFuZWwgPSBudWxsO1xuICAgIH1cblxuICAgIHB1YmxpYyB2aWV3Rm9ySXRlbShpdGVtOiB7IGRpc3BsYXlOYW1lOiBzdHJpbmc7IG5hbWU6IHN0cmluZzsgfSkge1xuICAgICAgICByZXR1cm4gc3BhY2VQZW4uJCQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5saSh7XG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiOiBcImV2ZW50XCIsXG4gICAgICAgICAgICAgICAgXCJkYXRhLWV2ZW50LW5hbWVcIjogaXRlbS5uYW1lXG4gICAgICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc3BhbihpdGVtLmRpc3BsYXlOYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBpdGVtLm5hbWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY29uZmlybWVkKGl0ZW0/OiBhbnkpOiBzcGFjZVBlbi5WaWV3IHtcbiAgICAgICAgdGhpcy5vbkNvbmZpcm0oaXRlbS5uYW1lKTtcbiAgICAgICAgdGhpcy5jYW5jZWwoKTtcblxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

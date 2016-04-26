"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = function (options, editor) {
    var codeActionView = editor.codeActionView;
    if (!codeActionView) {
        editor.codeActionView = codeActionView = new CodeActionsView(options, editor);
    } else {
        codeActionView.options = options;
    }
    codeActionView.setItems();
    codeActionView.show();
    return codeActionView;
};

var _atomSpacePenViews = require("atom-space-pen-views");

var SpacePen = _interopRequireWildcard(_atomSpacePenViews);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CodeActionsView = function (_SpacePen$SelectListV) {
    _inherits(CodeActionsView, _SpacePen$SelectListV);

    function CodeActionsView(options, editor) {
        _classCallCheck(this, CodeActionsView);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(CodeActionsView).call(this));

        _this.options = options;
        _this.editor = editor;
        _this._editorElement = atom.views.getView(editor);
        _this._vimMode = atom.packages.isPackageActive("vim-mode");
        _this.$.addClass("code-actions-overlay");
        _this.filterEditorView.model.placeholderText = "Filter list";
        return _this;
    }

    _createClass(CodeActionsView, [{
        key: "setItems",
        value: function setItems() {
            SpacePen.SelectListView.prototype.setItems.call(this, this.options.items);
        }
    }, {
        key: "confirmed",
        value: function confirmed(item) {
            this.cancel();
            this.options.confirmed(item);
            this.enableVimMode();
            return null;
        }
    }, {
        key: "show",
        value: function show() {
            var _this2 = this;

            this.storeFocusedElement();
            this.disableVimMode();
            this.destroyOverlay();
            this._overlayDecoration = this.editor.decorateMarker(this.editor.getLastCursor().getMarker(), { type: "overlay", position: "tail", item: this });
            setTimeout(function () {
                return _this2.focusFilterEditor();
            }, 100);
        }
    }, {
        key: "hide",
        value: function hide() {
            this.restoreFocus();
            this.enableVimMode();
            this.destroyOverlay();
        }
    }, {
        key: "destroyOverlay",
        value: function destroyOverlay() {
            if (this._overlayDecoration) this._overlayDecoration.destroy();
        }
    }, {
        key: "cancelled",
        value: function cancelled() {
            this.hide();
        }
    }, {
        key: "enableVimMode",
        value: function enableVimMode() {
            if (this._vimMode) {
                this._editorElement.classList.add("vim-mode");
            }
        }
    }, {
        key: "disableVimMode",
        value: function disableVimMode() {
            if (this._vimMode) {
                this._editorElement.classList.remove("vim-mode");
            }
        }
    }, {
        key: "getFilterKey",
        value: function getFilterKey() {
            return "Name";
        }
    }, {
        key: "viewForItem",
        value: function viewForItem(item) {
            return SpacePen.$$(function () {
                var _this3 = this;

                return this.li({
                    "class": "event",
                    "data-event-name": item.Name
                }, function () {
                    return _this3.span(item.Name, {
                        title: item.Name
                    });
                });
            });
        }
    }, {
        key: "$",
        get: function get() {
            return this;
        }
    }]);

    return CodeActionsView;
}(SpacePen.SelectListView);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9jb2RlLWFjdGlvbnMtdmlldy50cyIsImxpYi92aWV3cy9jb2RlLWFjdGlvbnMtdmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztrQkFPQSxVQUE0QixPQUE1QixFQUErRCxNQUEvRCxFQUFzRjtBQUNsRixRQUFJLGlCQUF1QixPQUFRLGNBQW5DO0FBQ0EsUUFBSSxDQUFDLGNBQUwsRUFBcUI7QUFDWCxlQUFRLGNBQVIsR0FBeUIsaUJBQWlCLElBQUksZUFBSixDQUF1QixPQUF2QixFQUFnQyxNQUFoQyxDQUExQztBQUNULEtBRkQsTUFFTztBQUNILHVCQUFlLE9BQWYsR0FBeUIsT0FBekI7QUFDSDtBQUVELG1CQUFlLFFBQWY7QUFDQSxtQkFBZSxJQUFmO0FBQ0EsV0FBTyxjQUFQO0FBQ0gsQzs7QUNsQkQ7O0lEQVksUTs7Ozs7Ozs7OztJQW9CWixlOzs7QUFNSSw2QkFBbUIsT0FBbkIsRUFBNkQsTUFBN0QsRUFBb0Y7QUFBQTs7QUFBQTs7QUFBakUsY0FBQSxPQUFBLEdBQUEsT0FBQTtBQUEwQyxjQUFBLE1BQUEsR0FBQSxNQUFBO0FBRXpELGNBQUssY0FBTCxHQUFzQixLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLE1BQW5CLENBQXRCO0FBQ0EsY0FBSyxRQUFMLEdBQWdCLEtBQUssUUFBTCxDQUFjLGVBQWQsQ0FBOEIsVUFBOUIsQ0FBaEI7QUFDQSxjQUFLLENBQUwsQ0FBTyxRQUFQLENBQWdCLHNCQUFoQjtBQUNNLGNBQU0sZ0JBQU4sQ0FBdUIsS0FBdkIsQ0FBNkIsZUFBN0IsR0FBK0MsYUFBL0M7QUFMMEU7QUFNbkY7Ozs7bUNBTWM7QUFFWCxxQkFBUyxjQUFULENBQXdCLFNBQXhCLENBQWtDLFFBQWxDLENBQTJDLElBQTNDLENBQWdELElBQWhELEVBQXNELEtBQUssT0FBTCxDQUFhLEtBQW5FO0FBQ0g7OztrQ0FFZ0IsSSxFQUFTO0FBQ3RCLGlCQUFLLE1BQUw7QUFFQSxpQkFBSyxPQUFMLENBQWEsU0FBYixDQUF1QixJQUF2QjtBQUVBLGlCQUFLLGFBQUw7QUFDQSxtQkFBTyxJQUFQO0FBQ0g7OzsrQkFFVTtBQUFBOztBQUNQLGlCQUFLLG1CQUFMO0FBQ0EsaUJBQUssY0FBTDtBQUNBLGlCQUFLLGNBQUw7QUFDQSxpQkFBSyxrQkFBTCxHQUEwQixLQUFLLE1BQUwsQ0FBWSxjQUFaLENBQTJCLEtBQUssTUFBTCxDQUFZLGFBQVosR0FBNEIsU0FBNUIsRUFBM0IsRUFDdEIsRUFBRSxNQUFNLFNBQVIsRUFBbUIsVUFBVSxNQUE3QixFQUFxQyxNQUFNLElBQTNDLEVBRHNCLENBQTFCO0FBR0EsdUJBQVc7QUFBQSx1QkFBTSxPQUFLLGlCQUFMLEVBQU47QUFBQSxhQUFYLEVBQTJDLEdBQTNDO0FBQ0g7OzsrQkFFVTtBQUNQLGlCQUFLLFlBQUw7QUFDQSxpQkFBSyxhQUFMO0FBQ0EsaUJBQUssY0FBTDtBQUNIOzs7eUNBRW9CO0FBQ2pCLGdCQUFJLEtBQUssa0JBQVQsRUFDSSxLQUFLLGtCQUFMLENBQXdCLE9BQXhCO0FBQ1A7OztvQ0FHZTtBQUNaLGlCQUFLLElBQUw7QUFDSDs7O3dDQUVtQjtBQUNoQixnQkFBSSxLQUFLLFFBQVQsRUFBbUI7QUFDZixxQkFBSyxjQUFMLENBQW9CLFNBQXBCLENBQThCLEdBQTlCLENBQWtDLFVBQWxDO0FBQ0g7QUFDSjs7O3lDQUVvQjtBQUNqQixnQkFBSSxLQUFLLFFBQVQsRUFBbUI7QUFDZixxQkFBSyxjQUFMLENBQW9CLFNBQXBCLENBQThCLE1BQTlCLENBQXFDLFVBQXJDO0FBQ0g7QUFDSjs7O3VDQUVrQjtBQUFLLG1CQUFPLE1BQVA7QUFBZ0I7OztvQ0FFckIsSSxFQUFTO0FBRXhCLG1CQUFPLFNBQVMsRUFBVCxDQUFZLFlBQUE7QUFBQTs7QUFDZix1QkFBTyxLQUFLLEVBQUwsQ0FBUTtBQUNYLDZCQUFTLE9BREU7QUFFWCx1Q0FBbUIsS0FBSztBQUZiLGlCQUFSLEVBR0osWUFBQTtBQUNDLDJCQUFPLE9BQUssSUFBTCxDQUFVLEtBQUssSUFBZixFQUFxQjtBQUN4QiwrQkFBTyxLQUFLO0FBRFkscUJBQXJCLENBQVA7QUFHSCxpQkFQTSxDQUFQO0FBUUgsYUFUTSxDQUFQO0FBVUg7Ozs0QkF0RUk7QUFDRCxtQkFBWSxJQUFaO0FBQ0g7Ozs7RUFoQjRCLFNBQVMsYyIsImZpbGUiOiJsaWIvdmlld3MvY29kZS1hY3Rpb25zLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBTcGFjZVBlbiBmcm9tIFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTZWxlY3RMaXN0Vmlld09wdGlvbnM8VD4ge1xuICAgIGl0ZW1zOiBUW107XG4gICAgY29uZmlybWVkOiAoaXRlbTogVCkgPT4gYW55O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiA8VD4ob3B0aW9uczogU2VsZWN0TGlzdFZpZXdPcHRpb25zPFQ+LCBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcik6IENvZGVBY3Rpb25zVmlldzxUPiB7XG4gICAgbGV0IGNvZGVBY3Rpb25WaWV3ID0gKDxhbnk+ZWRpdG9yKS5jb2RlQWN0aW9uVmlldztcbiAgICBpZiAoIWNvZGVBY3Rpb25WaWV3KSB7XG4gICAgICAgICg8YW55PmVkaXRvcikuY29kZUFjdGlvblZpZXcgPSBjb2RlQWN0aW9uVmlldyA9IG5ldyBDb2RlQWN0aW9uc1ZpZXc8VD4ob3B0aW9ucywgZWRpdG9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb2RlQWN0aW9uVmlldy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB9XG5cbiAgICBjb2RlQWN0aW9uVmlldy5zZXRJdGVtcygpO1xuICAgIGNvZGVBY3Rpb25WaWV3LnNob3coKTtcbiAgICByZXR1cm4gY29kZUFjdGlvblZpZXc7XG59XG5cbmNsYXNzIENvZGVBY3Rpb25zVmlldzxUPiBleHRlbmRzIFNwYWNlUGVuLlNlbGVjdExpc3RWaWV3IHtcblxuICAgIHByaXZhdGUgX292ZXJsYXlEZWNvcmF0aW9uOiBhbnk7XG4gICAgcHJpdmF0ZSBfdmltTW9kZTogYm9vbGVhbjtcbiAgICBwcml2YXRlIF9lZGl0b3JFbGVtZW50OiBhbnk7XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgb3B0aW9uczogU2VsZWN0TGlzdFZpZXdPcHRpb25zPFQ+LCBwdWJsaWMgZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5fZWRpdG9yRWxlbWVudCA9IGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpO1xuICAgICAgICB0aGlzLl92aW1Nb2RlID0gYXRvbS5wYWNrYWdlcy5pc1BhY2thZ2VBY3RpdmUoXCJ2aW0tbW9kZVwiKTtcbiAgICAgICAgdGhpcy4kLmFkZENsYXNzKFwiY29kZS1hY3Rpb25zLW92ZXJsYXlcIik7XG4gICAgICAgICg8YW55PnRoaXMpLmZpbHRlckVkaXRvclZpZXcubW9kZWwucGxhY2Vob2xkZXJUZXh0ID0gXCJGaWx0ZXIgbGlzdFwiO1xuICAgIH1cblxuICAgIGdldCAkKCk6IEpRdWVyeSB7XG4gICAgICAgIHJldHVybiA8YW55PnRoaXM7XG4gICAgfVxuXG4gICAgcHVibGljIHNldEl0ZW1zKCkge1xuICAgICAgICAvL3N1cGVyLnNldEl0ZW1zKHRoaXMub3B0aW9ucy5pdGVtcylcbiAgICAgICAgU3BhY2VQZW4uU2VsZWN0TGlzdFZpZXcucHJvdG90eXBlLnNldEl0ZW1zLmNhbGwodGhpcywgdGhpcy5vcHRpb25zLml0ZW1zKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgY29uZmlybWVkKGl0ZW06IGFueSk6IGFueSB7XG4gICAgICAgIHRoaXMuY2FuY2VsKCk7IC8vd2lsbCBjbG9zZSB0aGUgdmlld1xuXG4gICAgICAgIHRoaXMub3B0aW9ucy5jb25maXJtZWQoaXRlbSk7XG5cbiAgICAgICAgdGhpcy5lbmFibGVWaW1Nb2RlKCk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHB1YmxpYyBzaG93KCkge1xuICAgICAgICB0aGlzLnN0b3JlRm9jdXNlZEVsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5kaXNhYmxlVmltTW9kZSgpO1xuICAgICAgICB0aGlzLmRlc3Ryb3lPdmVybGF5KCk7XG4gICAgICAgIHRoaXMuX292ZXJsYXlEZWNvcmF0aW9uID0gdGhpcy5lZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5lZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldE1hcmtlcigpLFxuICAgICAgICAgICAgeyB0eXBlOiBcIm92ZXJsYXlcIiwgcG9zaXRpb246IFwidGFpbFwiLCBpdGVtOiB0aGlzIH0pO1xuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5mb2N1c0ZpbHRlckVkaXRvcigpLCAxMDApO1xuICAgIH1cblxuICAgIHB1YmxpYyBoaWRlKCkge1xuICAgICAgICB0aGlzLnJlc3RvcmVGb2N1cygpO1xuICAgICAgICB0aGlzLmVuYWJsZVZpbU1vZGUoKTtcbiAgICAgICAgdGhpcy5kZXN0cm95T3ZlcmxheSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZXN0cm95T3ZlcmxheSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX292ZXJsYXlEZWNvcmF0aW9uKVxuICAgICAgICAgICAgdGhpcy5fb3ZlcmxheURlY29yYXRpb24uZGVzdHJveSgpO1xuICAgIH1cblxuXG4gICAgcHVibGljIGNhbmNlbGxlZCgpIHtcbiAgICAgICAgdGhpcy5oaWRlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGVuYWJsZVZpbU1vZGUoKSB7XG4gICAgICAgIGlmICh0aGlzLl92aW1Nb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9lZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJ2aW0tbW9kZVwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBkaXNhYmxlVmltTW9kZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3ZpbU1vZGUpIHtcbiAgICAgICAgICAgIHRoaXMuX2VkaXRvckVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZShcInZpbS1tb2RlXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGdldEZpbHRlcktleSgpIHsgcmV0dXJuIFwiTmFtZVwiOyB9XG5cbiAgICBwdWJsaWMgdmlld0Zvckl0ZW0oaXRlbTogYW55KSB7XG5cbiAgICAgICAgcmV0dXJuIFNwYWNlUGVuLiQkKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGkoe1xuICAgICAgICAgICAgICAgIFwiY2xhc3NcIjogXCJldmVudFwiLFxuICAgICAgICAgICAgICAgIFwiZGF0YS1ldmVudC1uYW1lXCI6IGl0ZW0uTmFtZVxuICAgICAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnNwYW4oaXRlbS5OYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBpdGVtLk5hbWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBTcGFjZVBlbiBmcm9tIFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIjtcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChvcHRpb25zLCBlZGl0b3IpIHtcbiAgICBsZXQgY29kZUFjdGlvblZpZXcgPSBlZGl0b3IuY29kZUFjdGlvblZpZXc7XG4gICAgaWYgKCFjb2RlQWN0aW9uVmlldykge1xuICAgICAgICBlZGl0b3IuY29kZUFjdGlvblZpZXcgPSBjb2RlQWN0aW9uVmlldyA9IG5ldyBDb2RlQWN0aW9uc1ZpZXcob3B0aW9ucywgZWRpdG9yKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNvZGVBY3Rpb25WaWV3Lm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIH1cbiAgICBjb2RlQWN0aW9uVmlldy5zZXRJdGVtcygpO1xuICAgIGNvZGVBY3Rpb25WaWV3LnNob3coKTtcbiAgICByZXR1cm4gY29kZUFjdGlvblZpZXc7XG59XG5jbGFzcyBDb2RlQWN0aW9uc1ZpZXcgZXh0ZW5kcyBTcGFjZVBlbi5TZWxlY3RMaXN0VmlldyB7XG4gICAgY29uc3RydWN0b3Iob3B0aW9ucywgZWRpdG9yKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuZWRpdG9yID0gZWRpdG9yO1xuICAgICAgICB0aGlzLl9lZGl0b3JFbGVtZW50ID0gYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcik7XG4gICAgICAgIHRoaXMuX3ZpbU1vZGUgPSBhdG9tLnBhY2thZ2VzLmlzUGFja2FnZUFjdGl2ZShcInZpbS1tb2RlXCIpO1xuICAgICAgICB0aGlzLiQuYWRkQ2xhc3MoXCJjb2RlLWFjdGlvbnMtb3ZlcmxheVwiKTtcbiAgICAgICAgdGhpcy5maWx0ZXJFZGl0b3JWaWV3Lm1vZGVsLnBsYWNlaG9sZGVyVGV4dCA9IFwiRmlsdGVyIGxpc3RcIjtcbiAgICB9XG4gICAgZ2V0ICQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICBzZXRJdGVtcygpIHtcbiAgICAgICAgU3BhY2VQZW4uU2VsZWN0TGlzdFZpZXcucHJvdG90eXBlLnNldEl0ZW1zLmNhbGwodGhpcywgdGhpcy5vcHRpb25zLml0ZW1zKTtcbiAgICB9XG4gICAgY29uZmlybWVkKGl0ZW0pIHtcbiAgICAgICAgdGhpcy5jYW5jZWwoKTtcbiAgICAgICAgdGhpcy5vcHRpb25zLmNvbmZpcm1lZChpdGVtKTtcbiAgICAgICAgdGhpcy5lbmFibGVWaW1Nb2RlKCk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBzaG93KCkge1xuICAgICAgICB0aGlzLnN0b3JlRm9jdXNlZEVsZW1lbnQoKTtcbiAgICAgICAgdGhpcy5kaXNhYmxlVmltTW9kZSgpO1xuICAgICAgICB0aGlzLmRlc3Ryb3lPdmVybGF5KCk7XG4gICAgICAgIHRoaXMuX292ZXJsYXlEZWNvcmF0aW9uID0gdGhpcy5lZGl0b3IuZGVjb3JhdGVNYXJrZXIodGhpcy5lZGl0b3IuZ2V0TGFzdEN1cnNvcigpLmdldE1hcmtlcigpLCB7IHR5cGU6IFwib3ZlcmxheVwiLCBwb3NpdGlvbjogXCJ0YWlsXCIsIGl0ZW06IHRoaXMgfSk7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5mb2N1c0ZpbHRlckVkaXRvcigpLCAxMDApO1xuICAgIH1cbiAgICBoaWRlKCkge1xuICAgICAgICB0aGlzLnJlc3RvcmVGb2N1cygpO1xuICAgICAgICB0aGlzLmVuYWJsZVZpbU1vZGUoKTtcbiAgICAgICAgdGhpcy5kZXN0cm95T3ZlcmxheSgpO1xuICAgIH1cbiAgICBkZXN0cm95T3ZlcmxheSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX292ZXJsYXlEZWNvcmF0aW9uKVxuICAgICAgICAgICAgdGhpcy5fb3ZlcmxheURlY29yYXRpb24uZGVzdHJveSgpO1xuICAgIH1cbiAgICBjYW5jZWxsZWQoKSB7XG4gICAgICAgIHRoaXMuaGlkZSgpO1xuICAgIH1cbiAgICBlbmFibGVWaW1Nb2RlKCkge1xuICAgICAgICBpZiAodGhpcy5fdmltTW9kZSkge1xuICAgICAgICAgICAgdGhpcy5fZWRpdG9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKFwidmltLW1vZGVcIik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZGlzYWJsZVZpbU1vZGUoKSB7XG4gICAgICAgIGlmICh0aGlzLl92aW1Nb2RlKSB7XG4gICAgICAgICAgICB0aGlzLl9lZGl0b3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoXCJ2aW0tbW9kZVwiKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXRGaWx0ZXJLZXkoKSB7IHJldHVybiBcIk5hbWVcIjsgfVxuICAgIHZpZXdGb3JJdGVtKGl0ZW0pIHtcbiAgICAgICAgcmV0dXJuIFNwYWNlUGVuLiQkKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxpKHtcbiAgICAgICAgICAgICAgICBcImNsYXNzXCI6IFwiZXZlbnRcIixcbiAgICAgICAgICAgICAgICBcImRhdGEtZXZlbnQtbmFtZVwiOiBpdGVtLk5hbWVcbiAgICAgICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zcGFuKGl0ZW0uTmFtZSwge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZTogaXRlbS5OYW1lXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

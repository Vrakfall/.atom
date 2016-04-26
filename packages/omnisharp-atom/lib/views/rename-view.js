"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.RenameView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _atomSpacePenViews = require("atom-space-pen-views");

var spacePenViews = _interopRequireWildcard(_atomSpacePenViews);

var _omni = require("../server/omni");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var RenameView = exports.RenameView = function (_spacePenViews$View) {
    _inherits(RenameView, _spacePenViews$View);

    function RenameView() {
        _classCallCheck(this, RenameView);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(RenameView).apply(this, arguments));
    }

    _createClass(RenameView, [{
        key: "initialize",
        value: function initialize() {
            var _this2 = this;

            atom.commands.add(this[0], "core:confirm", function () {
                return _this2.rename();
            });
            atom.commands.add(this[0], "core:cancel", function () {
                return _this2.destroy();
            });
        }
    }, {
        key: "configure",
        value: function configure(wordToRename) {
            this.miniEditor.setText(wordToRename);
            return this.miniEditor.focus();
        }
    }, {
        key: "rename",
        value: function rename() {
            var _this3 = this;

            _omni.Omni.request(function (solution) {
                return solution.rename({
                    RenameTo: _this3.miniEditor.getText(),
                    WantsTextChanges: true
                });
            });
            return this.destroy();
        }
    }, {
        key: "destroy",
        value: function destroy() {
            this.miniEditor.setText("");
            return this.detach();
        }
    }], [{
        key: "content",
        value: function content() {
            var _this4 = this;

            return this.div({
                "class": "rename overlay from-top"
            }, function () {
                _this4.p({
                    outlet: "message",
                    "class": "icon icon-diff-renamed"
                }, "Rename to:");
                return _this4.subview("miniEditor", new spacePenViews.TextEditorView({
                    mini: true
                }));
            });
        }
    }]);

    return RenameView;
}(spacePenViews.View);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9yZW5hbWUtdmlldy5qcyIsImxpYi92aWV3cy9yZW5hbWUtdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7SUNBWSxhOztBRENaOzs7Ozs7Ozs7O0lDRUEsVSxXQUFBLFU7Ozs7Ozs7Ozs7O3FDQWtCcUI7QUFBQTs7QUFDYixpQkFBSyxRQUFMLENBQWMsR0FBZCxDQUFrQixLQUFLLENBQUwsQ0FBbEIsRUFBMkIsY0FBM0IsRUFBMkM7QUFBQSx1QkFBTSxPQUFLLE1BQUwsRUFBTjtBQUFBLGFBQTNDO0FBQ0EsaUJBQUssUUFBTCxDQUFjLEdBQWQsQ0FBa0IsS0FBSyxDQUFMLENBQWxCLEVBQTJCLGFBQTNCLEVBQTBDO0FBQUEsdUJBQU0sT0FBSyxPQUFMLEVBQU47QUFBQSxhQUExQztBQUNIOzs7a0NBRWdCLFksRUFBb0I7QUFDakMsaUJBQUssVUFBTCxDQUFnQixPQUFoQixDQUF3QixZQUF4QjtBQUNBLG1CQUFPLEtBQUssVUFBTCxDQUFnQixLQUFoQixFQUFQO0FBQ0g7OztpQ0FFWTtBQUFBOztBQUNULHVCQUFLLE9BQUwsQ0FBYTtBQUFBLHVCQUFZLFNBQVMsTUFBVCxDQUFnQjtBQUNyQyw4QkFBVSxPQUFLLFVBQUwsQ0FBZ0IsT0FBaEIsRUFEMkI7QUFFckMsc0NBQWtCO0FBRm1CLGlCQUFoQixDQUFaO0FBQUEsYUFBYjtBQUlBLG1CQUFPLEtBQUssT0FBTCxFQUFQO0FBQ0g7OztrQ0FFYTtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEIsQ0FBd0IsRUFBeEI7QUFDQSxtQkFBTyxLQUFLLE1BQUwsRUFBUDtBQUNIOzs7a0NBdENvQjtBQUFBOztBQUNqQixtQkFBTyxLQUFLLEdBQUwsQ0FBUztBQUNaLHlCQUFTO0FBREcsYUFBVCxFQUVKLFlBQUE7QUFDQyx1QkFBSyxDQUFMLENBQU87QUFDSCw0QkFBUSxTQURMO0FBRUgsNkJBQVM7QUFGTixpQkFBUCxFQUdHLFlBSEg7QUFJQSx1QkFBTyxPQUFLLE9BQUwsQ0FBYSxZQUFiLEVBQ0gsSUFBSSxjQUFjLGNBQWxCLENBQWlDO0FBQzdCLDBCQUFNO0FBRHVCLGlCQUFqQyxDQURHLENBQVA7QUFJSCxhQVhNLENBQVA7QUFZSDs7OztFQWQyQixjQUFjLEkiLCJmaWxlIjoibGliL3ZpZXdzL3JlbmFtZS12aWV3LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgc3BhY2VQZW5WaWV3cyBmcm9tIFwiYXRvbS1zcGFjZS1wZW4tdmlld3NcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmV4cG9ydCBjbGFzcyBSZW5hbWVWaWV3IGV4dGVuZHMgc3BhY2VQZW5WaWV3cy5WaWV3IHtcbiAgICBzdGF0aWMgY29udGVudCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGl2KHtcbiAgICAgICAgICAgIFwiY2xhc3NcIjogXCJyZW5hbWUgb3ZlcmxheSBmcm9tLXRvcFwiXG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucCh7XG4gICAgICAgICAgICAgICAgb3V0bGV0OiBcIm1lc3NhZ2VcIixcbiAgICAgICAgICAgICAgICBcImNsYXNzXCI6IFwiaWNvbiBpY29uLWRpZmYtcmVuYW1lZFwiXG4gICAgICAgICAgICB9LCBcIlJlbmFtZSB0bzpcIik7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5zdWJ2aWV3KFwibWluaUVkaXRvclwiLCBuZXcgc3BhY2VQZW5WaWV3cy5UZXh0RWRpdG9yVmlldyh7XG4gICAgICAgICAgICAgICAgbWluaTogdHJ1ZVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgaW5pdGlhbGl6ZSgpIHtcbiAgICAgICAgYXRvbS5jb21tYW5kcy5hZGQodGhpc1swXSwgXCJjb3JlOmNvbmZpcm1cIiwgKCkgPT4gdGhpcy5yZW5hbWUoKSk7XG4gICAgICAgIGF0b20uY29tbWFuZHMuYWRkKHRoaXNbMF0sIFwiY29yZTpjYW5jZWxcIiwgKCkgPT4gdGhpcy5kZXN0cm95KCkpO1xuICAgIH1cbiAgICBjb25maWd1cmUod29yZFRvUmVuYW1lKSB7XG4gICAgICAgIHRoaXMubWluaUVkaXRvci5zZXRUZXh0KHdvcmRUb1JlbmFtZSk7XG4gICAgICAgIHJldHVybiB0aGlzLm1pbmlFZGl0b3IuZm9jdXMoKTtcbiAgICB9XG4gICAgcmVuYW1lKCkge1xuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24ucmVuYW1lKHtcbiAgICAgICAgICAgIFJlbmFtZVRvOiB0aGlzLm1pbmlFZGl0b3IuZ2V0VGV4dCgpLFxuICAgICAgICAgICAgV2FudHNUZXh0Q2hhbmdlczogdHJ1ZVxuICAgICAgICB9KSk7XG4gICAgICAgIHJldHVybiB0aGlzLmRlc3Ryb3koKTtcbiAgICB9XG4gICAgZGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy5taW5pRWRpdG9yLnNldFRleHQoXCJcIik7XG4gICAgICAgIHJldHVybiB0aGlzLmRldGFjaCgpO1xuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIHNwYWNlUGVuVmlld3MgZnJvbSBcImF0b20tc3BhY2UtcGVuLXZpZXdzXCI7XG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuXG5leHBvcnQgY2xhc3MgUmVuYW1lVmlldyBleHRlbmRzIHNwYWNlUGVuVmlld3MuVmlldyB7XG4gICAgcHVibGljIHN0YXRpYyBjb250ZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaXYoe1xuICAgICAgICAgICAgXCJjbGFzc1wiOiBcInJlbmFtZSBvdmVybGF5IGZyb20tdG9wXCJcbiAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5wKHtcbiAgICAgICAgICAgICAgICBvdXRsZXQ6IFwibWVzc2FnZVwiLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIjogXCJpY29uIGljb24tZGlmZi1yZW5hbWVkXCJcbiAgICAgICAgICAgIH0sIFwiUmVuYW1lIHRvOlwiKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnN1YnZpZXcoXCJtaW5pRWRpdG9yXCIsXG4gICAgICAgICAgICAgICAgbmV3IHNwYWNlUGVuVmlld3MuVGV4dEVkaXRvclZpZXcoe1xuICAgICAgICAgICAgICAgICAgICBtaW5pOiB0cnVlXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgbWluaUVkaXRvcjogc3BhY2VQZW5WaWV3cy5UZXh0RWRpdG9yVmlldztcblxuICAgIHB1YmxpYyBpbml0aWFsaXplKCkge1xuICAgICAgICBhdG9tLmNvbW1hbmRzLmFkZCh0aGlzWzBdLCBcImNvcmU6Y29uZmlybVwiLCAoKSA9PiB0aGlzLnJlbmFtZSgpKTtcbiAgICAgICAgYXRvbS5jb21tYW5kcy5hZGQodGhpc1swXSwgXCJjb3JlOmNhbmNlbFwiLCAoKSA9PiB0aGlzLmRlc3Ryb3koKSk7XG4gICAgfVxuXG4gICAgcHVibGljIGNvbmZpZ3VyZSh3b3JkVG9SZW5hbWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLm1pbmlFZGl0b3Iuc2V0VGV4dCh3b3JkVG9SZW5hbWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5taW5pRWRpdG9yLmZvY3VzKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlbmFtZSgpIHtcbiAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLnJlbmFtZSh7XG4gICAgICAgICAgICBSZW5hbWVUbzogdGhpcy5taW5pRWRpdG9yLmdldFRleHQoKSxcbiAgICAgICAgICAgIFdhbnRzVGV4dENoYW5nZXM6IHRydWVcbiAgICAgICAgfSkpO1xuICAgICAgICByZXR1cm4gdGhpcy5kZXN0cm95KCk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3koKSB7XG4gICAgICAgIHRoaXMubWluaUVkaXRvci5zZXRUZXh0KFwiXCIpO1xuICAgICAgICByZXR1cm4gdGhpcy5kZXRhY2goKTtcbiAgICB9XG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

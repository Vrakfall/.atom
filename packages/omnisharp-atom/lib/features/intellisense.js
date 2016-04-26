"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.intellisense = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

var _lodash = require("lodash");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Intellisense = function () {
    function Intellisense() {
        _classCallCheck(this, Intellisense);

        this.required = false;
        this.default = true;
        this.title = "Intellisense";
        this.description = "Augments some of the issues with Atoms autocomplete-plus package";
    }

    _createClass(Intellisense, [{
        key: "activate",
        value: function activate() {
            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                cd.add(editor.onWillInsertText(function (event) {
                    if (event.text.length > 1) return;
                    if (event.text === ";" || event.text === ".") {
                        atom.commands.dispatch(atom.views.getView(editor), "autocomplete-plus:confirm");
                    }
                }));
                cd.add(editor.onDidInsertText(function (event) {
                    if (event.text.length > 1) return;
                    if (event.text === ".") {
                        (0, _lodash.defer)(function () {
                            return atom.commands.dispatch(atom.views.getView(editor), "autocomplete-plus:activate");
                        });
                    }
                }));
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return Intellisense;
}();

var intellisense = exports.intellisense = new Intellisense();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9pbnRlbGxpc2Vuc2UuanMiLCJsaWIvZmVhdHVyZXMvaW50ZWxsaXNlbnNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOzs7O0lDRUEsWTtBQUFBLDRCQUFBO0FBQUE7O0FBNkJXLGFBQUEsUUFBQSxHQUFXLEtBQVg7QUFDQSxhQUFBLE9BQUEsR0FBVSxJQUFWO0FBQ0EsYUFBQSxLQUFBLEdBQVEsY0FBUjtBQUNBLGFBQUEsV0FBQSxHQUFjLGtFQUFkO0FBQ1Y7Ozs7bUNBOUJrQjtBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCO0FBRUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLGtCQUFMLENBQXdCLFVBQUMsTUFBRCxFQUFTLEVBQVQsRUFBVztBQUNuRCxtQkFBRyxHQUFILENBQU8sT0FBTyxnQkFBUCxDQUF3QixpQkFBSztBQUNoQyx3QkFBSSxNQUFNLElBQU4sQ0FBVyxNQUFYLEdBQW9CLENBQXhCLEVBQTJCO0FBRTNCLHdCQUFJLE1BQU0sSUFBTixLQUFlLEdBQWYsSUFBc0IsTUFBTSxJQUFOLEtBQWUsR0FBekMsRUFBOEM7QUFDMUMsNkJBQUssUUFBTCxDQUFjLFFBQWQsQ0FBdUIsS0FBSyxLQUFMLENBQVcsT0FBWCxDQUFtQixNQUFuQixDQUF2QixFQUFtRCwyQkFBbkQ7QUFDSDtBQUNKLGlCQU5NLENBQVA7QUFRQSxtQkFBRyxHQUFILENBQU8sT0FBTyxlQUFQLENBQXVCLGlCQUFLO0FBQy9CLHdCQUFJLE1BQU0sSUFBTixDQUFXLE1BQVgsR0FBb0IsQ0FBeEIsRUFBMkI7QUFFM0Isd0JBQUksTUFBTSxJQUFOLEtBQWUsR0FBbkIsRUFBd0I7QUFDcEIsMkNBQU07QUFBQSxtQ0FBTSxLQUFLLFFBQUwsQ0FBYyxRQUFkLENBQXVCLEtBQUssS0FBTCxDQUFXLE9BQVgsQ0FBbUIsTUFBbkIsQ0FBdkIsRUFBbUQsNEJBQW5ELENBQU47QUFBQSx5QkFBTjtBQUNIO0FBQ0osaUJBTk0sQ0FBUDtBQU9ILGFBaEJtQixDQUFwQjtBQWlCSDs7O2tDQUVhO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQjtBQUNIOzs7Ozs7QUFPRSxJQUFNLHNDQUFlLElBQUksWUFBSixFQUFyQiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvaW50ZWxsaXNlbnNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBkZWZlciB9IGZyb20gXCJsb2Rhc2hcIjtcbmNsYXNzIEludGVsbGlzZW5zZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5kZWZhdWx0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiSW50ZWxsaXNlbnNlXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkF1Z21lbnRzIHNvbWUgb2YgdGhlIGlzc3VlcyB3aXRoIEF0b21zIGF1dG9jb21wbGV0ZS1wbHVzIHBhY2thZ2VcIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25XaWxsSW5zZXJ0VGV4dChldmVudCA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRleHQubGVuZ3RoID4gMSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0ID09PSBcIjtcIiB8fCBldmVudC50ZXh0ID09PSBcIi5cIikge1xuICAgICAgICAgICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhlZGl0b3IpLCBcImF1dG9jb21wbGV0ZS1wbHVzOmNvbmZpcm1cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZEluc2VydFRleHQoZXZlbnQgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0Lmxlbmd0aCA+IDEpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dCA9PT0gXCIuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXIoKCkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKSwgXCJhdXRvY29tcGxldGUtcGx1czphY3RpdmF0ZVwiKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IGludGVsbGlzZW5zZSA9IG5ldyBJbnRlbGxpc2Vuc2U7XG4iLCJpbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHtkZWZlcn0gZnJvbSBcImxvZGFzaFwiO1xuXG5jbGFzcyBJbnRlbGxpc2Vuc2UgaW1wbGVtZW50cyBJRmVhdHVyZSB7XG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25XaWxsSW5zZXJ0VGV4dChldmVudCA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRleHQubGVuZ3RoID4gMSkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgaWYgKGV2ZW50LnRleHQgPT09IFwiO1wiIHx8IGV2ZW50LnRleHQgPT09IFwiLlwiKSB7XG4gICAgICAgICAgICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvciksIFwiYXV0b2NvbXBsZXRlLXBsdXM6Y29uZmlybVwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRJbnNlcnRUZXh0KGV2ZW50ID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dC5sZW5ndGggPiAxKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dCA9PT0gXCIuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXIoKCkgPT4gYXRvbS5jb21tYW5kcy5kaXNwYXRjaChhdG9tLnZpZXdzLmdldFZpZXcoZWRpdG9yKSwgXCJhdXRvY29tcGxldGUtcGx1czphY3RpdmF0ZVwiKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XG4gICAgcHVibGljIGRlZmF1bHQgPSB0cnVlO1xuICAgIHB1YmxpYyB0aXRsZSA9IFwiSW50ZWxsaXNlbnNlXCI7XG4gICAgcHVibGljIGRlc2NyaXB0aW9uID0gXCJBdWdtZW50cyBzb21lIG9mIHRoZSBpc3N1ZXMgd2l0aCBBdG9tcyBhdXRvY29tcGxldGUtcGx1cyBwYWNrYWdlXCI7XG59XG5leHBvcnQgY29uc3QgaW50ZWxsaXNlbnNlID0gbmV3IEludGVsbGlzZW5zZTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

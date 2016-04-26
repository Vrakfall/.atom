"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.rename = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _omnisharpClient = require("omnisharp-client");

var _renameView = require("../views/rename-view");

var _omni = require("../server/omni");

var _applyChanges = require("../services/apply-changes");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Rename = function () {
    function Rename() {
        _classCallCheck(this, Rename);

        this.required = true;
        this.title = "Rename";
        this.description = "Adds command to rename symbols.";
    }

    _createClass(Rename, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.renameView = new _renameView.RenameView();
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:rename", function (e) {
                e.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault();
                _this.rename();
            }));
            this.disposable.add(_omni.Omni.listener.rename.subscribe(function (data) {
                (0, _applyChanges.applyAllChanges)(data.response.Changes);
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "rename",
        value: function rename() {
            var editor = atom.workspace.getActiveTextEditor();
            var wordToRename = void 0;
            if (editor) {
                wordToRename = editor.getWordUnderCursor();
                wordToRename = _lodash2.default.trimEnd(wordToRename, "(");
                atom.workspace.addTopPanel({
                    item: this.renameView
                });
            }
            return this.renameView.configure(wordToRename);
        }
    }]);

    return Rename;
}();

var rename = exports.rename = new Rename();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9yZW5hbWUuanMiLCJsaWIvZmVhdHVyZXMvcmVuYW1lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7OztJQ0VBLE07QUFBQSxzQkFBQTtBQUFBOztBQXFDVyxhQUFBLFFBQUEsR0FBVyxJQUFYO0FBQ0EsYUFBQSxLQUFBLEdBQVEsUUFBUjtBQUNBLGFBQUEsV0FBQSxHQUFjLGlDQUFkO0FBQ1Y7Ozs7bUNBcENrQjtBQUFBOztBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCO0FBQ0EsaUJBQUssVUFBTCxHQUFrQiw0QkFBbEI7QUFDQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssb0JBQUwsQ0FBMEIsdUJBQTFCLEVBQW1ELFVBQUMsQ0FBRCxFQUFFO0FBQ3JFLGtCQUFFLHdCQUFGO0FBQ0Esa0JBQUUsZUFBRjtBQUNBLGtCQUFFLGNBQUY7QUFDQSxzQkFBSyxNQUFMO0FBQ0gsYUFMbUIsQ0FBcEI7QUFPQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssUUFBTCxDQUFjLE1BQWQsQ0FBcUIsU0FBckIsQ0FBK0IsVUFBQyxJQUFELEVBQUs7QUFDcEQsbURBQWdCLEtBQUssUUFBTCxDQUFjLE9BQTlCO0FBQ0gsYUFGbUIsQ0FBcEI7QUFHSDs7O2tDQUVhO0FBQ1YsaUJBQUssVUFBTCxDQUFnQixPQUFoQjtBQUNIOzs7aUNBRVk7QUFDVCxnQkFBTSxTQUFTLEtBQUssU0FBTCxDQUFlLG1CQUFmLEVBQWY7QUFDQSxnQkFBSSxxQkFBSjtBQUNBLGdCQUFJLE1BQUosRUFBWTtBQUNSLCtCQUFvQixPQUFPLGtCQUFQLEVBQXBCO0FBRUEsK0JBQWUsaUJBQUUsT0FBRixDQUFVLFlBQVYsRUFBd0IsR0FBeEIsQ0FBZjtBQUNBLHFCQUFLLFNBQUwsQ0FBZSxXQUFmLENBQTJCO0FBQ3ZCLDBCQUFNLEtBQUs7QUFEWSxpQkFBM0I7QUFHSDtBQUNELG1CQUFPLEtBQUssVUFBTCxDQUFnQixTQUFoQixDQUEwQixZQUExQixDQUFQO0FBQ0g7Ozs7OztBQU1FLElBQU0sMEJBQVMsSUFBSSxNQUFKLEVBQWYiLCJmaWxlIjoibGliL2ZlYXR1cmVzL3JlbmFtZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgUmVuYW1lVmlldyB9IGZyb20gXCIuLi92aWV3cy9yZW5hbWUtdmlld1wiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgYXBwbHlBbGxDaGFuZ2VzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL2FwcGx5LWNoYW5nZXNcIjtcbmNsYXNzIFJlbmFtZSB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJSZW5hbWVcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyBjb21tYW5kIHRvIHJlbmFtZSBzeW1ib2xzLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5yZW5hbWVWaWV3ID0gbmV3IFJlbmFtZVZpZXcoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206cmVuYW1lXCIsIChlKSA9PiB7XG4gICAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMucmVuYW1lKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLnJlbmFtZS5zdWJzY3JpYmUoKGRhdGEpID0+IHtcbiAgICAgICAgICAgIGFwcGx5QWxsQ2hhbmdlcyhkYXRhLnJlc3BvbnNlLkNoYW5nZXMpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIHJlbmFtZSgpIHtcbiAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICBsZXQgd29yZFRvUmVuYW1lO1xuICAgICAgICBpZiAoZWRpdG9yKSB7XG4gICAgICAgICAgICB3b3JkVG9SZW5hbWUgPSBlZGl0b3IuZ2V0V29yZFVuZGVyQ3Vyc29yKCk7XG4gICAgICAgICAgICB3b3JkVG9SZW5hbWUgPSBfLnRyaW1FbmQod29yZFRvUmVuYW1lLCBcIihcIik7XG4gICAgICAgICAgICBhdG9tLndvcmtzcGFjZS5hZGRUb3BQYW5lbCh7XG4gICAgICAgICAgICAgICAgaXRlbTogdGhpcy5yZW5hbWVWaWV3XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5yZW5hbWVWaWV3LmNvbmZpZ3VyZSh3b3JkVG9SZW5hbWUpO1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCByZW5hbWUgPSBuZXcgUmVuYW1lO1xuIiwiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHtSZW5hbWVWaWV3fSBmcm9tIFwiLi4vdmlld3MvcmVuYW1lLXZpZXdcIjtcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQge2FwcGx5QWxsQ2hhbmdlc30gZnJvbSBcIi4uL3NlcnZpY2VzL2FwcGx5LWNoYW5nZXNcIjtcblxuY2xhc3MgUmVuYW1lIGltcGxlbWVudHMgSUZlYXR1cmUge1xuICAgIHByaXZhdGUgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcbiAgICBwcml2YXRlIHJlbmFtZVZpZXc6IFJlbmFtZVZpZXc7XG5cbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMucmVuYW1lVmlldyA9IG5ldyBSZW5hbWVWaWV3KCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOnJlbmFtZVwiLCAoZSkgPT4ge1xuICAgICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0aGlzLnJlbmFtZSgpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmxpc3RlbmVyLnJlbmFtZS5zdWJzY3JpYmUoKGRhdGEpID0+IHtcbiAgICAgICAgICAgIGFwcGx5QWxsQ2hhbmdlcyhkYXRhLnJlc3BvbnNlLkNoYW5nZXMpO1xuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlbmFtZSgpIHtcbiAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICBsZXQgd29yZFRvUmVuYW1lOiBzdHJpbmc7XG4gICAgICAgIGlmIChlZGl0b3IpIHtcbiAgICAgICAgICAgIHdvcmRUb1JlbmFtZSA9IDxhbnk+ZWRpdG9yLmdldFdvcmRVbmRlckN1cnNvcigpO1xuICAgICAgICAgICAgLy8gV29yZCB1bmRlciBjdXJzb3IgY2FuIHNvbWV0aW1lcyByZXR1cm4gdGhlIG9wZW4gYnJhY2tldCBpZiB0aGUgd29yZCBpcyBzZWxlY3RlZC5cbiAgICAgICAgICAgIHdvcmRUb1JlbmFtZSA9IF8udHJpbUVuZCh3b3JkVG9SZW5hbWUsIFwiKFwiKTtcbiAgICAgICAgICAgIGF0b20ud29ya3NwYWNlLmFkZFRvcFBhbmVsKHtcbiAgICAgICAgICAgICAgICBpdGVtOiB0aGlzLnJlbmFtZVZpZXdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnJlbmFtZVZpZXcuY29uZmlndXJlKHdvcmRUb1JlbmFtZSk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlcXVpcmVkID0gdHJ1ZTtcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlJlbmFtZVwiO1xuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiQWRkcyBjb21tYW5kIHRvIHJlbmFtZSBzeW1ib2xzLlwiO1xufVxuZXhwb3J0IGNvbnN0IHJlbmFtZSA9IG5ldyBSZW5hbWU7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

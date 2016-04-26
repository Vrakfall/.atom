"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.codeFormat = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

var _applyChanges = require("../services/apply-changes");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CodeFormat = function () {
    function CodeFormat() {
        _classCallCheck(this, CodeFormat);

        this.required = false;
        this.title = "Code Format";
        this.description = "Support for code formatting.";
    }

    _createClass(CodeFormat, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:code-format", function () {
                return _this.format();
            }));
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                cd.add(editor.onDidInsertText(function (event) {
                    if (event.text.length > 1) return;
                    if (event.text === ";" || event.text === "}" || event.text === "{" || event.text.charCodeAt(0) === 10) {
                        _omni.Omni.request(editor, function (solution) {
                            return solution.formatAfterKeystroke({ Character: event.text });
                        }).subscribe(function (data) {
                            return (0, _applyChanges.applyChanges)(editor, data);
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
    }, {
        key: "format",
        value: function format() {
            var editor = atom.workspace.getActiveTextEditor();
            if (editor) {
                (function () {
                    var buffer = editor.getBuffer();
                    _omni.Omni.request(editor, function (solution) {
                        var request = {
                            Line: 0,
                            Column: 0,
                            EndLine: buffer.getLineCount() - 1,
                            EndColumn: 0
                        };
                        return solution.formatRange(request).do(function (data) {
                            return (0, _applyChanges.applyChanges)(editor, data);
                        });
                    });
                })();
            }
        }
    }]);

    return CodeFormat;
}();

var codeFormat = exports.codeFormat = new CodeFormat();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWZvcm1hdC5qcyIsImxpYi9mZWF0dXJlcy9jb2RlLWZvcm1hdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7OztJQ0dBLFU7QUFBQSwwQkFBQTtBQUFBOztBQTBDVyxhQUFBLFFBQUEsR0FBVyxLQUFYO0FBQ0EsYUFBQSxLQUFBLEdBQVEsYUFBUjtBQUNBLGFBQUEsV0FBQSxHQUFjLDhCQUFkO0FBQ1Y7Ozs7bUNBMUNrQjtBQUFBOztBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLG9CQUFMLENBQTBCLDRCQUExQixFQUF3RDtBQUFBLHVCQUFNLE1BQUssTUFBTCxFQUFOO0FBQUEsYUFBeEQsQ0FBcEI7QUFFQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssa0JBQUwsQ0FBd0IsVUFBQyxNQUFELEVBQVMsRUFBVCxFQUFXO0FBQ25ELG1CQUFHLEdBQUgsQ0FBTyxPQUFPLGVBQVAsQ0FBdUIsaUJBQUs7QUFDL0Isd0JBQUksTUFBTSxJQUFOLENBQVcsTUFBWCxHQUFvQixDQUF4QixFQUEyQjtBQUUzQix3QkFBSSxNQUFNLElBQU4sS0FBZSxHQUFmLElBQXNCLE1BQU0sSUFBTixLQUFlLEdBQXJDLElBQTRDLE1BQU0sSUFBTixLQUFlLEdBQTNELElBQWtFLE1BQU0sSUFBTixDQUFXLFVBQVgsQ0FBc0IsQ0FBdEIsTUFBNkIsRUFBbkcsRUFBdUc7QUFDbkcsbUNBQUssT0FBTCxDQUFhLE1BQWIsRUFBcUI7QUFBQSxtQ0FBWSxTQUFTLG9CQUFULENBQThCLEVBQUUsV0FBVyxNQUFNLElBQW5CLEVBQTlCLENBQVo7QUFBQSx5QkFBckIsRUFDSyxTQURMLENBQ2U7QUFBQSxtQ0FBUSxnQ0FBYSxNQUFiLEVBQXFCLElBQXJCLENBQVI7QUFBQSx5QkFEZjtBQUVIO0FBQ0osaUJBUE0sQ0FBUDtBQVFILGFBVG1CLENBQXBCO0FBVUg7OztrQ0FFYTtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEI7QUFDSDs7O2lDQUVZO0FBQ1QsZ0JBQU0sU0FBUyxLQUFLLFNBQUwsQ0FBZSxtQkFBZixFQUFmO0FBQ0EsZ0JBQUksTUFBSixFQUFZO0FBQUE7QUFDUix3QkFBTSxTQUFTLE9BQU8sU0FBUCxFQUFmO0FBQ0EsK0JBQUssT0FBTCxDQUFhLE1BQWIsRUFBcUIsb0JBQVE7QUFDekIsNEJBQU0sVUFBcUM7QUFDdkMsa0NBQU0sQ0FEaUM7QUFFdkMsb0NBQVEsQ0FGK0I7QUFHdkMscUNBQVMsT0FBTyxZQUFQLEtBQXdCLENBSE07QUFJdkMsdUNBQVc7QUFKNEIseUJBQTNDO0FBT0EsK0JBQU8sU0FDRixXQURFLENBQ1UsT0FEVixFQUVGLEVBRkUsQ0FFQyxVQUFDLElBQUQ7QUFBQSxtQ0FBVSxnQ0FBYSxNQUFiLEVBQXFCLElBQXJCLENBQVY7QUFBQSx5QkFGRCxDQUFQO0FBR0gscUJBWEQ7QUFGUTtBQWNYO0FBQ0o7Ozs7OztBQU1FLElBQU0sa0NBQWEsSUFBSSxVQUFKLEVBQW5CIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9jb2RlLWZvcm1hdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgYXBwbHlDaGFuZ2VzIH0gZnJvbSBcIi4uL3NlcnZpY2VzL2FwcGx5LWNoYW5nZXNcIjtcbmNsYXNzIENvZGVGb3JtYXQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIkNvZGUgRm9ybWF0XCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIlN1cHBvcnQgZm9yIGNvZGUgZm9ybWF0dGluZy5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5hZGRUZXh0RWRpdG9yQ29tbWFuZChcIm9tbmlzaGFycC1hdG9tOmNvZGUtZm9ybWF0XCIsICgpID0+IHRoaXMuZm9ybWF0KCkpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZEluc2VydFRleHQoZXZlbnQgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0Lmxlbmd0aCA+IDEpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnQudGV4dCA9PT0gXCI7XCIgfHwgZXZlbnQudGV4dCA9PT0gXCJ9XCIgfHwgZXZlbnQudGV4dCA9PT0gXCJ7XCIgfHwgZXZlbnQudGV4dC5jaGFyQ29kZUF0KDApID09PSAxMCkge1xuICAgICAgICAgICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5mb3JtYXRBZnRlcktleXN0cm9rZSh7IENoYXJhY3RlcjogZXZlbnQudGV4dCB9KSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoZGF0YSA9PiBhcHBseUNoYW5nZXMoZWRpdG9yLCBkYXRhKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIGZvcm1hdCgpIHtcbiAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICBpZiAoZWRpdG9yKSB7XG4gICAgICAgICAgICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XG4gICAgICAgICAgICBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVxdWVzdCA9IHtcbiAgICAgICAgICAgICAgICAgICAgTGluZTogMCxcbiAgICAgICAgICAgICAgICAgICAgQ29sdW1uOiAwLFxuICAgICAgICAgICAgICAgICAgICBFbmRMaW5lOiBidWZmZXIuZ2V0TGluZUNvdW50KCkgLSAxLFxuICAgICAgICAgICAgICAgICAgICBFbmRDb2x1bW46IDAsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc29sdXRpb25cbiAgICAgICAgICAgICAgICAgICAgLmZvcm1hdFJhbmdlKHJlcXVlc3QpXG4gICAgICAgICAgICAgICAgICAgIC5kbygoZGF0YSkgPT4gYXBwbHlDaGFuZ2VzKGVkaXRvciwgZGF0YSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnQgY29uc3QgY29kZUZvcm1hdCA9IG5ldyBDb2RlRm9ybWF0O1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHthcHBseUNoYW5nZXN9IGZyb20gXCIuLi9zZXJ2aWNlcy9hcHBseS1jaGFuZ2VzXCI7XG5cbmNsYXNzIENvZGVGb3JtYXQgaW1wbGVtZW50cyBJRmVhdHVyZSB7XG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpjb2RlLWZvcm1hdFwiLCAoKSA9PiB0aGlzLmZvcm1hdCgpKSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZEluc2VydFRleHQoZXZlbnQgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0Lmxlbmd0aCA+IDEpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGlmIChldmVudC50ZXh0ID09PSBcIjtcIiB8fCBldmVudC50ZXh0ID09PSBcIn1cIiB8fCBldmVudC50ZXh0ID09PSBcIntcIiB8fCBldmVudC50ZXh0LmNoYXJDb2RlQXQoMCkgPT09IDEwKSB7XG4gICAgICAgICAgICAgICAgICAgIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmZvcm1hdEFmdGVyS2V5c3Ryb2tlKHsgQ2hhcmFjdGVyOiBldmVudC50ZXh0IH0pKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1YnNjcmliZShkYXRhID0+IGFwcGx5Q2hhbmdlcyhlZGl0b3IsIGRhdGEpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZm9ybWF0KCkge1xuICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgICAgIGlmIChlZGl0b3IpIHtcbiAgICAgICAgICAgIGNvbnN0IGJ1ZmZlciA9IGVkaXRvci5nZXRCdWZmZXIoKTtcbiAgICAgICAgICAgIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByZXF1ZXN0ID0gPE1vZGVscy5Gb3JtYXRSYW5nZVJlcXVlc3Q+e1xuICAgICAgICAgICAgICAgICAgICBMaW5lOiAwLFxuICAgICAgICAgICAgICAgICAgICBDb2x1bW46IDAsXG4gICAgICAgICAgICAgICAgICAgIEVuZExpbmU6IGJ1ZmZlci5nZXRMaW5lQ291bnQoKSAtIDEsXG4gICAgICAgICAgICAgICAgICAgIEVuZENvbHVtbjogMCxcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNvbHV0aW9uXG4gICAgICAgICAgICAgICAgICAgIC5mb3JtYXRSYW5nZShyZXF1ZXN0KVxuICAgICAgICAgICAgICAgICAgICAuZG8oKGRhdGEpID0+IGFwcGx5Q2hhbmdlcyhlZGl0b3IsIGRhdGEpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XG4gICAgcHVibGljIHRpdGxlID0gXCJDb2RlIEZvcm1hdFwiO1xuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiU3VwcG9ydCBmb3IgY29kZSBmb3JtYXR0aW5nLlwiO1xufVxuZXhwb3J0IGNvbnN0IGNvZGVGb3JtYXQgPSBuZXcgQ29kZUZvcm1hdDtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

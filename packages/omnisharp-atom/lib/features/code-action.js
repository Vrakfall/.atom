"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.codeAction = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

var _applyChanges = require("../services/apply-changes");

var _codeActionsView = require("../views/code-actions-view");

var _codeActionsView2 = _interopRequireDefault(_codeActionsView);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CodeAction = function () {
    function CodeAction() {
        _classCallCheck(this, CodeAction);

        this.required = true;
        this.title = "Code Actions";
        this.description = "Adds code action support to omnisharp-atom.";
    }

    _createClass(CodeAction, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:get-code-actions", function () {
                var editor = atom.workspace.getActiveTextEditor();
                _this.getCodeActionsRequest(editor).subscribe(function (_ref) {
                    var request = _ref.request;
                    var response = _ref.response;

                    _this.view = (0, _codeActionsView2.default)({
                        items: response.CodeActions,
                        confirmed: function confirmed(item) {
                            if (!editor || editor.isDestroyed()) return;
                            _this.runCodeActionRequest(editor, request, item.Identifier).subscribe(function (resp) {
                                return (0, _applyChanges.applyAllChanges)(resp.Changes);
                            });
                        }
                    }, editor);
                });
            }));
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                var word = void 0,
                    marker = void 0,
                    subscription = void 0;
                cd.add(_omni.Omni.listener.getcodeactions.filter(function (z) {
                    return z.request.FileName === editor.getPath();
                }).filter(function (ctx) {
                    return ctx.response.CodeActions.length > 0;
                }).subscribe(function (_ref2) {
                    var request = _ref2.request;

                    if (marker) {
                        marker.destroy();
                        marker = null;
                    }
                    var range = [[request.Line, 0], [request.Line, 0]];
                    marker = editor.markBufferRange(range);
                    editor.decorateMarker(marker, { type: "line-number", class: "quickfix" });
                }));
                var makeLightbulbRequest = function makeLightbulbRequest(position) {
                    if (subscription) subscription.dispose();
                    if (!editor || editor.isDestroyed()) return;
                    _this.getCodeActionsRequest(editor, true).subscribe(function (ctx) {
                        var response = ctx.response;

                        if (response.CodeActions.length > 0) {
                            if (marker) {
                                marker.destroy();
                                marker = null;
                            }
                            var rng = [[position.row, 0], [position.row, 0]];
                            marker = editor.markBufferRange(rng);
                            editor.decorateMarker(marker, { type: "line-number", class: "quickfix" });
                        }
                    });
                };
                var update = function update(pos) {
                    if (subscription) subscription.dispose();
                    makeLightbulbRequest(pos);
                };
                var onDidChangeCursorPosition = new _rxjs.Subject();
                cd.add(onDidChangeCursorPosition);
                var onDidStopChanging = new _rxjs.Subject();
                cd.add(_rxjs.Observable.combineLatest(onDidChangeCursorPosition, onDidStopChanging, function (cursor, changing) {
                    return cursor;
                }).observeOn(_rxjs.Scheduler.queue).debounceTime(1000).subscribe(function (cursor) {
                    return update(cursor.newBufferPosition);
                }));
                cd.add(editor.onDidStopChanging(_lodash2.default.debounce(function () {
                    return onDidStopChanging.next(true);
                }, 1000)));
                cd.add(editor.onDidChangeCursorPosition(_lodash2.default.debounce(function (e) {
                    var oldPos = e.oldBufferPosition;
                    var newPos = e.newBufferPosition;
                    var newWord = editor.getWordUnderCursor();
                    if (word !== newWord || oldPos.row !== newPos.row) {
                        word = newWord;
                        if (marker) {
                            marker.destroy();
                            marker = null;
                        }
                    }
                    if (!onDidChangeCursorPosition.isUnsubscribed) {
                        onDidChangeCursorPosition.next(e);
                    }
                }, 1000)));
            }));
        }
    }, {
        key: "getCodeActionsRequest",
        value: function getCodeActionsRequest(editor) {
            var silent = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

            if (!editor || editor.isDestroyed()) return _rxjs.Observable.empty();
            var request = this.getRequest(editor);
            return _omni.Omni.request(editor, function (solution) {
                return solution.getcodeactions(request);
            }).map(function (response) {
                return { request: request, response: response };
            });
        }
    }, {
        key: "runCodeActionRequest",
        value: function runCodeActionRequest(editor, getRequest, codeAction) {
            if (!editor || editor.isDestroyed()) return _rxjs.Observable.empty();
            var request = this.getRequest(editor, codeAction);
            request.Selection = getRequest.Selection;
            return _omni.Omni.request(editor, function (solution) {
                return solution.runcodeaction(request);
            });
        }
    }, {
        key: "getRequest",
        value: function getRequest(editor, codeAction) {
            var range = editor.getSelectedBufferRange();
            var request = {
                WantsTextChanges: true,
                Selection: {
                    Start: {
                        Line: range.start.row,
                        Column: range.start.column
                    },
                    End: {
                        Line: range.end.row,
                        Column: range.end.column
                    }
                }
            };
            if (codeAction !== undefined) {
                request.Identifier = codeAction;
            }
            return request;
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return CodeAction;
}();

var codeAction = exports.codeAction = new CodeAction();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9jb2RlLWFjdGlvbi5qcyIsImxpYi9mZWF0dXJlcy9jb2RlLWFjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7OztJQ0lBLFU7QUFBQSwwQkFBQTtBQUFBOztBQWtKVyxhQUFBLFFBQUEsR0FBVyxJQUFYO0FBQ0EsYUFBQSxLQUFBLEdBQVEsY0FBUjtBQUNBLGFBQUEsV0FBQSxHQUFjLDZDQUFkO0FBQ1Y7Ozs7bUNBaEprQjtBQUFBOztBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCO0FBRUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLG9CQUFMLENBQTBCLGlDQUExQixFQUE2RCxZQUFBO0FBRTdFLG9CQUFNLFNBQVMsS0FBSyxTQUFMLENBQWUsbUJBQWYsRUFBZjtBQUNBLHNCQUFLLHFCQUFMLENBQTJCLE1BQTNCLEVBQ0ssU0FETCxDQUNlLGdCQUFvQjtBQUFBLHdCQUFsQixPQUFrQixRQUFsQixPQUFrQjtBQUFBLHdCQUFULFFBQVMsUUFBVCxRQUFTOztBQUUzQiwwQkFBSyxJQUFMLEdBQVksK0JBQWdCO0FBQ3hCLCtCQUFPLFNBQVMsV0FEUTtBQUV4QixtQ0FBVyxtQkFBQyxJQUFELEVBQUs7QUFDWixnQ0FBSSxDQUFDLE1BQUQsSUFBVyxPQUFPLFdBQVAsRUFBZixFQUFxQztBQUVyQyxrQ0FBSyxvQkFBTCxDQUEwQixNQUExQixFQUFrQyxPQUFsQyxFQUEyQyxLQUFLLFVBQWhELEVBQ0ssU0FETCxDQUNlLFVBQUMsSUFBRDtBQUFBLHVDQUFVLG1DQUFnQixLQUFLLE9BQXJCLENBQVY7QUFBQSw2QkFEZjtBQUVIO0FBUHVCLHFCQUFoQixFQVFULE1BUlMsQ0FBWjtBQVNILGlCQVpMO0FBYUgsYUFoQm1CLENBQXBCO0FBa0JBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxrQkFBTCxDQUF3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LENBQXVCLE9BQXZCLENBQVo7QUFBQSxhQUFyQixDQUFQO0FBQ0g7OzttQ0FJa0IsTSxFQUF5QixVLEVBQW1CO0FBQzNELGdCQUFNLFFBQWEsT0FBTyxzQkFBUCxFQUFuQjtBQUNBLGdCQUFNLFVBQTBDO0FBQzVDLGtDQUFrQixJQUQwQjtBQUU1QywyQkFBVztBQUNQLDJCQUFPO0FBQ0gsOEJBQU0sTUFBTSxLQUFOLENBQVksR0FEZjtBQUVILGdDQUFRLE1BQU0sS0FBTixDQUFZO0FBRmpCLHFCQURBO0FBS1AseUJBQUs7QUFDRCw4QkFBTSxNQUFNLEdBQU4sQ0FBVSxHQURmO0FBRUQsZ0NBQVEsTUFBTSxHQUFOLENBQVU7QUFGakI7QUFMRTtBQUZpQyxhQUFoRDtBQWNBLGdCQUFJLGVBQWUsU0FBbkIsRUFBOEI7QUFDMUIsd0JBQVEsVUFBUixHQUFxQixVQUFyQjtBQUNIO0FBRUQsbUJBQU8sT0FBUDtBQUNIOzs7a0NBRWE7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCO0FBQ0g7Ozs7OztBQU9FLElBQU0sa0NBQWEsSUFBSSxVQUFKLEVBQW5CIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9jb2RlLWFjdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IFN1YmplY3QsIE9ic2VydmFibGUsIFNjaGVkdWxlciB9IGZyb20gXCJyeGpzXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7IGFwcGx5QWxsQ2hhbmdlcyB9IGZyb20gXCIuLi9zZXJ2aWNlcy9hcHBseS1jaGFuZ2VzXCI7XG5pbXBvcnQgY29kZUFjdGlvbnNWaWV3IGZyb20gXCIuLi92aWV3cy9jb2RlLWFjdGlvbnMtdmlld1wiO1xuY2xhc3MgQ29kZUFjdGlvbiB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMucmVxdWlyZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnRpdGxlID0gXCJDb2RlIEFjdGlvbnNcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyBjb2RlIGFjdGlvbiBzdXBwb3J0IHRvIG9tbmlzaGFycC1hdG9tLlwiO1xuICAgIH1cbiAgICBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206Z2V0LWNvZGUtYWN0aW9uc1wiLCAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3IgPSBhdG9tLndvcmtzcGFjZS5nZXRBY3RpdmVUZXh0RWRpdG9yKCk7XG4gICAgICAgICAgICB0aGlzLmdldENvZGVBY3Rpb25zUmVxdWVzdChlZGl0b3IpXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoeyByZXF1ZXN0LCByZXNwb25zZSB9KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3ID0gY29kZUFjdGlvbnNWaWV3KHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM6IHJlc3BvbnNlLkNvZGVBY3Rpb25zLFxuICAgICAgICAgICAgICAgICAgICBjb25maXJtZWQ6IChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJ1bkNvZGVBY3Rpb25SZXF1ZXN0KGVkaXRvciwgcmVxdWVzdCwgaXRlbS5JZGVudGlmaWVyKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKHJlc3ApID0+IGFwcGx5QWxsQ2hhbmdlcyhyZXNwLkNoYW5nZXMpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sIGVkaXRvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBsZXQgd29yZCwgbWFya2VyLCBzdWJzY3JpcHRpb247XG4gICAgICAgICAgICBjZC5hZGQoT21uaS5saXN0ZW5lci5nZXRjb2RlYWN0aW9uc1xuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiB6LnJlcXVlc3QuRmlsZU5hbWUgPT09IGVkaXRvci5nZXRQYXRoKCkpXG4gICAgICAgICAgICAgICAgLmZpbHRlcihjdHggPT4gY3R4LnJlc3BvbnNlLkNvZGVBY3Rpb25zLmxlbmd0aCA+IDApXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZSgoeyByZXF1ZXN0IH0pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobWFya2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtlci5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gW1tyZXF1ZXN0LkxpbmUsIDBdLCBbcmVxdWVzdC5MaW5lLCAwXV07XG4gICAgICAgICAgICAgICAgbWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShyYW5nZSk7XG4gICAgICAgICAgICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwgeyB0eXBlOiBcImxpbmUtbnVtYmVyXCIsIGNsYXNzOiBcInF1aWNrZml4XCIgfSk7XG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICBjb25zdCBtYWtlTGlnaHRidWxiUmVxdWVzdCA9IChwb3NpdGlvbikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzdWJzY3JpcHRpb24pXG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmlzRGVzdHJveWVkKCkpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB0aGlzLmdldENvZGVBY3Rpb25zUmVxdWVzdChlZGl0b3IsIHRydWUpXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoY3R4ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeyByZXNwb25zZSB9ID0gY3R4O1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuQ29kZUFjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1hcmtlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlci5kZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJuZyA9IFtbcG9zaXRpb24ucm93LCAwXSwgW3Bvc2l0aW9uLnJvdywgMF1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gZWRpdG9yLm1hcmtCdWZmZXJSYW5nZShybmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwgeyB0eXBlOiBcImxpbmUtbnVtYmVyXCIsIGNsYXNzOiBcInF1aWNrZml4XCIgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjb25zdCB1cGRhdGUgPSAocG9zKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHN1YnNjcmlwdGlvbilcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uLmRpc3Bvc2UoKTtcbiAgICAgICAgICAgICAgICBtYWtlTGlnaHRidWxiUmVxdWVzdChwb3MpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNvbnN0IG9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24gPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICAgICAgY2QuYWRkKG9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24pO1xuICAgICAgICAgICAgY29uc3Qgb25EaWRTdG9wQ2hhbmdpbmcgPSBuZXcgU3ViamVjdCgpO1xuICAgICAgICAgICAgY2QuYWRkKE9ic2VydmFibGUuY29tYmluZUxhdGVzdChvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uLCBvbkRpZFN0b3BDaGFuZ2luZywgKGN1cnNvciwgY2hhbmdpbmcpID0+IGN1cnNvcilcbiAgICAgICAgICAgICAgICAub2JzZXJ2ZU9uKFNjaGVkdWxlci5xdWV1ZSlcbiAgICAgICAgICAgICAgICAuZGVib3VuY2VUaW1lKDEwMDApXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShjdXJzb3IgPT4gdXBkYXRlKGN1cnNvci5uZXdCdWZmZXJQb3NpdGlvbikpKTtcbiAgICAgICAgICAgIGNkLmFkZChlZGl0b3Iub25EaWRTdG9wQ2hhbmdpbmcoXy5kZWJvdW5jZSgoKSA9PiBvbkRpZFN0b3BDaGFuZ2luZy5uZXh0KHRydWUpLCAxMDAwKSkpO1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKF8uZGVib3VuY2UoKGUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBvbGRQb3MgPSBlLm9sZEJ1ZmZlclBvc2l0aW9uO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld1BvcyA9IGUubmV3QnVmZmVyUG9zaXRpb247XG4gICAgICAgICAgICAgICAgY29uc3QgbmV3V29yZCA9IGVkaXRvci5nZXRXb3JkVW5kZXJDdXJzb3IoKTtcbiAgICAgICAgICAgICAgICBpZiAod29yZCAhPT0gbmV3V29yZCB8fCBvbGRQb3Mucm93ICE9PSBuZXdQb3Mucm93KSB7XG4gICAgICAgICAgICAgICAgICAgIHdvcmQgPSBuZXdXb3JkO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWFya2VyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIuZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIW9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24uaXNVbnN1YnNjcmliZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgb25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbi5uZXh0KGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDEwMDApKSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZ2V0Q29kZUFjdGlvbnNSZXF1ZXN0KGVkaXRvciwgc2lsZW50ID0gdHJ1ZSkge1xuICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSlcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLmdldFJlcXVlc3QoZWRpdG9yKTtcbiAgICAgICAgcmV0dXJuIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLmdldGNvZGVhY3Rpb25zKHJlcXVlc3QpKVxuICAgICAgICAgICAgLm1hcChyZXNwb25zZSA9PiAoeyByZXF1ZXN0LCByZXNwb25zZSB9KSk7XG4gICAgfVxuICAgIHJ1bkNvZGVBY3Rpb25SZXF1ZXN0KGVkaXRvciwgZ2V0UmVxdWVzdCwgY29kZUFjdGlvbikge1xuICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSlcbiAgICAgICAgICAgIHJldHVybiBPYnNlcnZhYmxlLmVtcHR5KCk7XG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB0aGlzLmdldFJlcXVlc3QoZWRpdG9yLCBjb2RlQWN0aW9uKTtcbiAgICAgICAgcmVxdWVzdC5TZWxlY3Rpb24gPSBnZXRSZXF1ZXN0LlNlbGVjdGlvbjtcbiAgICAgICAgcmV0dXJuIE9tbmkucmVxdWVzdChlZGl0b3IsIHNvbHV0aW9uID0+IHNvbHV0aW9uLnJ1bmNvZGVhY3Rpb24ocmVxdWVzdCkpO1xuICAgIH1cbiAgICBnZXRSZXF1ZXN0KGVkaXRvciwgY29kZUFjdGlvbikge1xuICAgICAgICBjb25zdCByYW5nZSA9IGVkaXRvci5nZXRTZWxlY3RlZEJ1ZmZlclJhbmdlKCk7XG4gICAgICAgIGNvbnN0IHJlcXVlc3QgPSB7XG4gICAgICAgICAgICBXYW50c1RleHRDaGFuZ2VzOiB0cnVlLFxuICAgICAgICAgICAgU2VsZWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgU3RhcnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgTGluZTogcmFuZ2Uuc3RhcnQucm93LFxuICAgICAgICAgICAgICAgICAgICBDb2x1bW46IHJhbmdlLnN0YXJ0LmNvbHVtblxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgRW5kOiB7XG4gICAgICAgICAgICAgICAgICAgIExpbmU6IHJhbmdlLmVuZC5yb3csXG4gICAgICAgICAgICAgICAgICAgIENvbHVtbjogcmFuZ2UuZW5kLmNvbHVtblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaWYgKGNvZGVBY3Rpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVxdWVzdC5JZGVudGlmaWVyID0gY29kZUFjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVxdWVzdDtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5leHBvcnQgY29uc3QgY29kZUFjdGlvbiA9IG5ldyBDb2RlQWN0aW9uO1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQge1N1YmplY3QsIE9ic2VydmFibGUsIFNjaGVkdWxlcn0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0ICogYXMgU3BhY2VQZW4gZnJvbSBcImF0b20tc3BhY2UtcGVuLXZpZXdzXCI7XG5pbXBvcnQge2FwcGx5QWxsQ2hhbmdlc30gZnJvbSBcIi4uL3NlcnZpY2VzL2FwcGx5LWNoYW5nZXNcIjtcbmltcG9ydCBjb2RlQWN0aW9uc1ZpZXcgZnJvbSBcIi4uL3ZpZXdzL2NvZGUtYWN0aW9ucy12aWV3XCI7XG5cbmNsYXNzIENvZGVBY3Rpb24gaW1wbGVtZW50cyBJRmVhdHVyZSB7XG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuXG4gICAgcHJpdmF0ZSB2aWV3OiBTcGFjZVBlbi5TZWxlY3RMaXN0VmlldztcblxuICAgIHB1YmxpYyBhY3RpdmF0ZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcblxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpnZXQtY29kZS1hY3Rpb25zXCIsICgpID0+IHtcbiAgICAgICAgICAgIC8vc3RvcmUgdGhlIGVkaXRvciB0aGF0IHRoaXMgd2FzIHRyaWdnZXJlZCBieS5cbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcbiAgICAgICAgICAgIHRoaXMuZ2V0Q29kZUFjdGlvbnNSZXF1ZXN0KGVkaXRvcilcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCh7cmVxdWVzdCwgcmVzcG9uc2V9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vcG9wIHVpIHRvIHVzZXIuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudmlldyA9IGNvZGVBY3Rpb25zVmlldyh7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtczogcmVzcG9uc2UuQ29kZUFjdGlvbnMsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtZWQ6IChpdGVtKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlZGl0b3IgfHwgZWRpdG9yLmlzRGVzdHJveWVkKCkpIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucnVuQ29kZUFjdGlvblJlcXVlc3QoZWRpdG9yLCByZXF1ZXN0LCBpdGVtLklkZW50aWZpZXIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoKHJlc3ApID0+IGFwcGx5QWxsQ2hhbmdlcyhyZXNwLkNoYW5nZXMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSwgZWRpdG9yKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5zd2l0Y2hBY3RpdmVFZGl0b3IoKGVkaXRvciwgY2QpID0+IHtcbiAgICAgICAgICAgIGxldCB3b3JkOiBzdHJpbmcsIG1hcmtlcjogQXRvbS5NYXJrZXIsIHN1YnNjcmlwdGlvbjogSURpc3Bvc2FibGU7XG5cbiAgICAgICAgICAgIGNkLmFkZChPbW5pLmxpc3RlbmVyLmdldGNvZGVhY3Rpb25zXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+IHoucmVxdWVzdC5GaWxlTmFtZSA9PT0gZWRpdG9yLmdldFBhdGgoKSlcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGN0eCA9PiBjdHgucmVzcG9uc2UuQ29kZUFjdGlvbnMubGVuZ3RoID4gMClcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKCh7cmVxdWVzdH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hcmtlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb25zdCByYW5nZSA9IFtbcmVxdWVzdC5MaW5lLCAwXSwgW3JlcXVlc3QuTGluZSwgMF1dO1xuICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHJhbmdlKTtcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwgeyB0eXBlOiBcImxpbmUtbnVtYmVyXCIsIGNsYXNzOiBcInF1aWNrZml4XCIgfSk7XG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgY29uc3QgbWFrZUxpZ2h0YnVsYlJlcXVlc3QgPSAocG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaXB0aW9uKSBzdWJzY3JpcHRpb24uZGlzcG9zZSgpO1xuICAgICAgICAgICAgICAgIGlmICghZWRpdG9yIHx8IGVkaXRvci5pc0Rlc3Ryb3llZCgpKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICB0aGlzLmdldENvZGVBY3Rpb25zUmVxdWVzdChlZGl0b3IsIHRydWUpXG4gICAgICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoY3R4ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHtyZXNwb25zZX0gPSBjdHg7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuQ29kZUFjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXJrZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBybmcgPSBbW3Bvc2l0aW9uLnJvdywgMF0sIFtwb3NpdGlvbi5yb3csIDBdXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJrZXIgPSBlZGl0b3IubWFya0J1ZmZlclJhbmdlKHJuZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmRlY29yYXRlTWFya2VyKG1hcmtlciwgeyB0eXBlOiBcImxpbmUtbnVtYmVyXCIsIGNsYXNzOiBcInF1aWNrZml4XCIgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgY29uc3QgdXBkYXRlID0gKHBvczogVGV4dEJ1ZmZlci5Qb2ludCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzdWJzY3JpcHRpb24pIHN1YnNjcmlwdGlvbi5kaXNwb3NlKCk7XG4gICAgICAgICAgICAgICAgbWFrZUxpZ2h0YnVsYlJlcXVlc3QocG9zKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNvbnN0IG9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24gPSBuZXcgU3ViamVjdDx7IG9sZEJ1ZmZlclBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyBvbGRTY3JlZW5Qb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgbmV3QnVmZmVyUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7IG5ld1NjcmVlblBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyB0ZXh0Q2hhbmdlZDogYm9vbGVhbjsgY3Vyc29yOiBBdG9tLkN1cnNvcjsgfT4oKTtcbiAgICAgICAgICAgIGNkLmFkZChvbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKTtcblxuICAgICAgICAgICAgY29uc3Qgb25EaWRTdG9wQ2hhbmdpbmcgPSBuZXcgU3ViamVjdDxhbnk+KCk7XG5cbiAgICAgICAgICAgIGNkLmFkZChPYnNlcnZhYmxlLmNvbWJpbmVMYXRlc3QoXG4gICAgICAgICAgICAgICAgPE9ic2VydmFibGU8eyBvbGRCdWZmZXJQb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgb2xkU2NyZWVuUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQ7IG5ld0J1ZmZlclBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyBuZXdTY3JlZW5Qb3NpdGlvbjogVGV4dEJ1ZmZlci5Qb2ludDsgdGV4dENoYW5nZWQ6IGJvb2xlYW47IGN1cnNvcjogQXRvbS5DdXJzb3I7IH0+Pjxhbnk+b25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbixcbiAgICAgICAgICAgICAgICA8T2JzZXJ2YWJsZTxhbnk+Pjxhbnk+b25EaWRTdG9wQ2hhbmdpbmcsXG4gICAgICAgICAgICAgICAgKGN1cnNvciwgY2hhbmdpbmcpID0+IGN1cnNvcilcbiAgICAgICAgICAgICAgICAub2JzZXJ2ZU9uKFNjaGVkdWxlci5xdWV1ZSlcbiAgICAgICAgICAgICAgICAuZGVib3VuY2VUaW1lKDEwMDApXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShjdXJzb3IgPT4gdXBkYXRlKGN1cnNvci5uZXdCdWZmZXJQb3NpdGlvbikpKTtcblxuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5vbkRpZFN0b3BDaGFuZ2luZyhfLmRlYm91bmNlKCgpID0+IG9uRGlkU3RvcENoYW5naW5nLm5leHQodHJ1ZSksIDEwMDApKSk7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24oXy5kZWJvdW5jZSgoZTogYW55KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkUG9zID0gZS5vbGRCdWZmZXJQb3NpdGlvbjtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdQb3MgPSBlLm5ld0J1ZmZlclBvc2l0aW9uO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgbmV3V29yZDogc3RyaW5nID0gPGFueT5lZGl0b3IuZ2V0V29yZFVuZGVyQ3Vyc29yKCk7XG4gICAgICAgICAgICAgICAgaWYgKHdvcmQgIT09IG5ld1dvcmQgfHwgb2xkUG9zLnJvdyAhPT0gbmV3UG9zLnJvdykge1xuICAgICAgICAgICAgICAgICAgICB3b3JkID0gbmV3V29yZDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hcmtlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFya2VyLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcmtlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIW9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24uaXNVbnN1YnNjcmliZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgb25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbi5uZXh0KGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDEwMDApKSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldENvZGVBY3Rpb25zUmVxdWVzdChlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgc2lsZW50ID0gdHJ1ZSkge1xuICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSkgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8eyByZXF1ZXN0OiBNb2RlbHMuVjIuR2V0Q29kZUFjdGlvbnNSZXF1ZXN0OyByZXNwb25zZTogTW9kZWxzLlYyLkdldENvZGVBY3Rpb25zUmVzcG9uc2UgfT4oKTtcblxuICAgICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5nZXRSZXF1ZXN0KGVkaXRvcik7XG4gICAgICAgIHJldHVybiBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5nZXRjb2RlYWN0aW9ucyhyZXF1ZXN0KSlcbiAgICAgICAgICAgIC5tYXAocmVzcG9uc2UgPT4gKHsgcmVxdWVzdCwgcmVzcG9uc2UgfSkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgcnVuQ29kZUFjdGlvblJlcXVlc3QoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IsIGdldFJlcXVlc3Q6IE1vZGVscy5WMi5HZXRDb2RlQWN0aW9uc1JlcXVlc3QsIGNvZGVBY3Rpb246IHN0cmluZykge1xuICAgICAgICBpZiAoIWVkaXRvciB8fCBlZGl0b3IuaXNEZXN0cm95ZWQoKSkgcmV0dXJuIE9ic2VydmFibGUuZW1wdHk8TW9kZWxzLlYyLlJ1bkNvZGVBY3Rpb25SZXNwb25zZT4oKTtcblxuICAgICAgICBjb25zdCByZXF1ZXN0ID0gdGhpcy5nZXRSZXF1ZXN0KGVkaXRvciwgY29kZUFjdGlvbik7XG4gICAgICAgIHJlcXVlc3QuU2VsZWN0aW9uID0gZ2V0UmVxdWVzdC5TZWxlY3Rpb247XG4gICAgICAgIHJldHVybiBPbW5pLnJlcXVlc3QoZWRpdG9yLCBzb2x1dGlvbiA9PiBzb2x1dGlvbi5ydW5jb2RlYWN0aW9uKHJlcXVlc3QpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldFJlcXVlc3QoZWRpdG9yOiBBdG9tLlRleHRFZGl0b3IpOiBNb2RlbHMuVjIuR2V0Q29kZUFjdGlvbnNSZXF1ZXN0O1xuICAgIHByaXZhdGUgZ2V0UmVxdWVzdChlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgY29kZUFjdGlvbjogc3RyaW5nKTogTW9kZWxzLlYyLlJ1bkNvZGVBY3Rpb25SZXF1ZXN0O1xuICAgIHByaXZhdGUgZ2V0UmVxdWVzdChlZGl0b3I6IEF0b20uVGV4dEVkaXRvciwgY29kZUFjdGlvbj86IHN0cmluZykge1xuICAgICAgICBjb25zdCByYW5nZSA9IDxhbnk+ZWRpdG9yLmdldFNlbGVjdGVkQnVmZmVyUmFuZ2UoKTtcbiAgICAgICAgY29uc3QgcmVxdWVzdDogTW9kZWxzLlYyLlJ1bkNvZGVBY3Rpb25SZXF1ZXN0ID0ge1xuICAgICAgICAgICAgV2FudHNUZXh0Q2hhbmdlczogdHJ1ZSxcbiAgICAgICAgICAgIFNlbGVjdGlvbjoge1xuICAgICAgICAgICAgICAgIFN0YXJ0OiB7XG4gICAgICAgICAgICAgICAgICAgIExpbmU6IHJhbmdlLnN0YXJ0LnJvdyxcbiAgICAgICAgICAgICAgICAgICAgQ29sdW1uOiByYW5nZS5zdGFydC5jb2x1bW5cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIEVuZDoge1xuICAgICAgICAgICAgICAgICAgICBMaW5lOiByYW5nZS5lbmQucm93LFxuICAgICAgICAgICAgICAgICAgICBDb2x1bW46IHJhbmdlLmVuZC5jb2x1bW5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGNvZGVBY3Rpb24gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVxdWVzdC5JZGVudGlmaWVyID0gY29kZUFjdGlvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXF1ZXN0O1xuICAgIH1cblxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XG4gICAgcHVibGljIHRpdGxlID0gXCJDb2RlIEFjdGlvbnNcIjtcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkFkZHMgY29kZSBhY3Rpb24gc3VwcG9ydCB0byBvbW5pc2hhcnAtYXRvbS5cIjtcbn1cblxuZXhwb3J0IGNvbnN0IGNvZGVBY3Rpb24gPSBuZXcgQ29kZUFjdGlvbjtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

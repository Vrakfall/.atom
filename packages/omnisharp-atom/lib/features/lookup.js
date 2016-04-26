"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.typeLookup = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _rxjs = require("rxjs");

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

var _tooltipView = require("../views/tooltip-view");

var _bufferFor = require("../operators/bufferFor");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var $ = require("jquery");
var escape = require("escape-html");

var TypeLookup = function () {
    function TypeLookup() {
        _classCallCheck(this, TypeLookup);

        this.required = false;
        this.title = "Tooltip Lookup";
        this.description = "Adds hover tooltips to the editor, also has a keybind";
    }

    _createClass(TypeLookup, [{
        key: "activate",
        value: function activate() {
            var tooltip = void 0;
            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add(_omni.Omni.switchActiveEditor(function (editor, cd) {
                var editorView = $(atom.views.getView(editor));
                tooltip = new Tooltip(editorView, editor);
                cd.add(tooltip);
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:type-lookup", function () {
                _omni.Omni.activeEditor.first().subscribe(function (editor) {
                    tooltip.showExpressionTypeOnCommand();
                });
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return TypeLookup;
}();

var Tooltip = function () {
    function Tooltip(editorView, editor) {
        var _this = this;

        _classCallCheck(this, Tooltip);

        this.editorView = editorView;
        this.editor = editor;
        this.exprTypeTooltip = null;
        this.rawView = editorView[0];
        var cd = this.disposable = new _omnisharpClient.CompositeDisposable();
        var scroll = this.getFromShadowDom(editorView, ".scroll-view");
        if (!scroll[0]) return;
        var lastExprTypeBufferPt = void 0;
        var mousemove = _rxjs.Observable.fromEvent(scroll[0], "mousemove");
        var mouseout = _rxjs.Observable.fromEvent(scroll[0], "mouseout");
        this.keydown = _rxjs.Observable.fromEvent(scroll[0], "keydown");
        cd.add((0, _bufferFor.bufferFor)(mousemove.observeOn(_rxjs.Scheduler.queue), 400).map(function (events) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = events.reverse()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var event = _step.value;

                    var pixelPt = _this.pixelPositionFromMouseEvent(editorView, event);
                    if (!pixelPt) continue;
                    var screenPt = editor.screenPositionForPixelPosition(pixelPt);
                    var bufferPt = editor.bufferPositionForScreenPosition(screenPt);
                    if (lastExprTypeBufferPt && lastExprTypeBufferPt.isEqual(bufferPt) && _this.exprTypeTooltip) continue;
                    lastExprTypeBufferPt = bufferPt;
                    return { bufferPt: bufferPt, event: event };
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        }).filter(function (z) {
            return !!z;
        }).do(function () {
            return _this.hideExpressionType();
        }).filter(function (x) {
            return _this.checkPosition(x.bufferPt);
        }).do(function () {
            return _this.subcribeKeyDown();
        }).subscribe(function (_ref) {
            var bufferPt = _ref.bufferPt;
            var event = _ref.event;

            _this.showExpressionTypeOnMouseOver(event, bufferPt);
        }));
        cd.add(mouseout.subscribe(function (e) {
            return _this.hideExpressionType();
        }));
        cd.add(_omni.Omni.switchActiveEditor(function (edit, innerCd) {
            innerCd.add(_omnisharpClient.Disposable.create(function () {
                return _this.hideExpressionType();
            }));
        }));
        cd.add(_omnisharpClient.Disposable.create(function () {
            _this.hideExpressionType();
        }));
    }

    _createClass(Tooltip, [{
        key: "subcribeKeyDown",
        value: function subcribeKeyDown() {
            var _this2 = this;

            this.keydownSubscription = this.keydown.subscribe(function (e) {
                return _this2.hideExpressionType();
            });
            this.disposable.add(this.keydownSubscription);
        }
    }, {
        key: "showExpressionTypeOnCommand",
        value: function showExpressionTypeOnCommand() {
            if (this.editor.cursors.length < 1) return;
            var bufferPt = this.editor.getCursorBufferPosition();
            if (!this.checkPosition(bufferPt)) return;
            var offset = this.rawView.component.getFontSize() * bufferPt.column * 0.7;
            var shadow = this.getFromShadowDom(this.editorView, ".cursor-line")[0];
            if (!shadow) return;
            var rect = shadow.getBoundingClientRect();
            var tooltipRect = {
                left: rect.left - offset,
                right: rect.left + offset,
                top: rect.bottom,
                bottom: rect.bottom
            };
            this.hideExpressionType();
            this.subcribeKeyDown();
            this.showToolTip(bufferPt, tooltipRect);
        }
    }, {
        key: "showExpressionTypeOnMouseOver",
        value: function showExpressionTypeOnMouseOver(e, bufferPt) {
            if (!_omni.Omni.isOn) {
                return;
            }
            if (this.exprTypeTooltip) return;
            var offset = this.editor.getLineHeightInPixels() * 0.7;
            var tooltipRect = {
                left: e.clientX,
                right: e.clientX,
                top: e.clientY - offset,
                bottom: e.clientY + offset
            };
            this.showToolTip(bufferPt, tooltipRect);
        }
    }, {
        key: "checkPosition",
        value: function checkPosition(bufferPt) {
            var curCharPixelPt = this.rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column]);
            var nextCharPixelPt = this.rawView.pixelPositionForBufferPosition([bufferPt.row, bufferPt.column + 1]);
            if (curCharPixelPt.left >= nextCharPixelPt.left) {
                return false;
            } else {
                return true;
            }
        }
    }, {
        key: "showToolTip",
        value: function showToolTip(bufferPt, tooltipRect) {
            var _this3 = this;

            this.exprTypeTooltip = new _tooltipView.TooltipView(tooltipRect);
            _omni.Omni.request(function (solution) {
                return solution.typelookup({
                    IncludeDocumentation: true,
                    Line: bufferPt.row,
                    Column: bufferPt.column
                });
            }).subscribe(function (response) {
                if (response.Type === null) {
                    return;
                }
                var message = "<b>" + escape(response.Type) + "</b>";
                if (response.Documentation) {
                    message = message + ("<br/><i>" + escape(response.Documentation) + "</i>");
                }
                if (_this3.exprTypeTooltip) {
                    _this3.exprTypeTooltip.updateText(message);
                }
            });
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "hideExpressionType",
        value: function hideExpressionType() {
            if (!this.exprTypeTooltip) return;
            this.exprTypeTooltip.remove();
            this.exprTypeTooltip = null;
            if (this.keydownSubscription) {
                this.disposable.remove(this.keydownSubscription);
                this.keydownSubscription.unsubscribe();
                this.keydownSubscription = null;
            }
        }
    }, {
        key: "getFromShadowDom",
        value: function getFromShadowDom(element, selector) {
            var el = element[0];
            if (!el.rootElement) return $(el);
            var found = el.rootElement.querySelectorAll(selector);
            return $(found[0]);
        }
    }, {
        key: "pixelPositionFromMouseEvent",
        value: function pixelPositionFromMouseEvent(editorView, event) {
            var clientX = event.clientX,
                clientY = event.clientY;
            var shadow = this.getFromShadowDom(editorView, ".lines")[0];
            if (!shadow) return;
            var linesClientRect = shadow.getBoundingClientRect();
            var top = clientY - linesClientRect.top;
            var left = clientX - linesClientRect.left;
            top += this.editor.getScrollTop();
            left += this.editor.getScrollLeft();
            return { top: top, left: left };
        }
    }]);

    return Tooltip;
}();

var typeLookup = exports.typeLookup = new TypeLookup();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9sb29rdXAuanMiLCJsaWIvZmVhdHVyZXMvbG9va3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOztBQUdBOzs7O0FDRUEsSUFBTSxJQUFrQixRQUFRLFFBQVIsQ0FBeEI7QUFDQSxJQUFNLFNBQVMsUUFBUSxhQUFSLENBQWY7O0lBR0EsVTtBQUFBLDBCQUFBO0FBQUE7O0FBMkJXLGFBQUEsUUFBQSxHQUFXLEtBQVg7QUFDQSxhQUFBLEtBQUEsR0FBUSxnQkFBUjtBQUNBLGFBQUEsV0FBQSxHQUFjLHVEQUFkO0FBQ1Y7Ozs7bUNBM0JrQjtBQUNYLGdCQUFJLGdCQUFKO0FBRUEsaUJBQUssVUFBTCxHQUFrQiwwQ0FBbEI7QUFDQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssa0JBQUwsQ0FBd0IsVUFBQyxNQUFELEVBQVMsRUFBVCxFQUFXO0FBR25ELG9CQUFNLGFBQWEsRUFBRSxLQUFLLEtBQUwsQ0FBVyxPQUFYLENBQW1CLE1BQW5CLENBQUYsQ0FBbkI7QUFDQSwwQkFBVSxJQUFJLE9BQUosQ0FBWSxVQUFaLEVBQXdCLE1BQXhCLENBQVY7QUFDQSxtQkFBRyxHQUFILENBQU8sT0FBUDtBQUNILGFBTm1CLENBQXBCO0FBUUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLG9CQUFMLENBQTBCLDRCQUExQixFQUF3RCxZQUFBO0FBQ3hFLDJCQUFLLFlBQUwsQ0FBa0IsS0FBbEIsR0FBMEIsU0FBMUIsQ0FBb0Msa0JBQU07QUFDdEMsNEJBQVEsMkJBQVI7QUFDSCxpQkFGRDtBQUdILGFBSm1CLENBQXBCO0FBTUg7OztrQ0FFYTtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEI7QUFDSDs7Ozs7O0lBT0wsTztBQU9JLHFCQUFvQixVQUFwQixFQUFnRCxNQUFoRCxFQUF1RTtBQUFBOztBQUFBOztBQUFuRCxhQUFBLFVBQUEsR0FBQSxVQUFBO0FB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ZmlsZSI6ImxpYi9mZWF0dXJlcy9sb29rdXAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlLCBTY2hlZHVsZXIgfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgeyBUb29sdGlwVmlldyB9IGZyb20gXCIuLi92aWV3cy90b29sdGlwLXZpZXdcIjtcbmNvbnN0ICQgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xuY29uc3QgZXNjYXBlID0gcmVxdWlyZShcImVzY2FwZS1odG1sXCIpO1xuaW1wb3J0IHsgYnVmZmVyRm9yIH0gZnJvbSBcIi4uL29wZXJhdG9ycy9idWZmZXJGb3JcIjtcbmNsYXNzIFR5cGVMb29rdXAge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlRvb2x0aXAgTG9va3VwXCI7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBcIkFkZHMgaG92ZXIgdG9vbHRpcHMgdG8gdGhlIGVkaXRvciwgYWxzbyBoYXMgYSBrZXliaW5kXCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICBsZXQgdG9vbHRpcDtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yVmlldyA9ICQoYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcikpO1xuICAgICAgICAgICAgdG9vbHRpcCA9IG5ldyBUb29sdGlwKGVkaXRvclZpZXcsIGVkaXRvcik7XG4gICAgICAgICAgICBjZC5hZGQodG9vbHRpcCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206dHlwZS1sb29rdXBcIiwgKCkgPT4ge1xuICAgICAgICAgICAgT21uaS5hY3RpdmVFZGl0b3IuZmlyc3QoKS5zdWJzY3JpYmUoZWRpdG9yID0+IHtcbiAgICAgICAgICAgICAgICB0b29sdGlwLnNob3dFeHByZXNzaW9uVHlwZU9uQ29tbWFuZCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG59XG5jbGFzcyBUb29sdGlwIHtcbiAgICBjb25zdHJ1Y3RvcihlZGl0b3JWaWV3LCBlZGl0b3IpIHtcbiAgICAgICAgdGhpcy5lZGl0b3JWaWV3ID0gZWRpdG9yVmlldztcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBlZGl0b3I7XG4gICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwID0gbnVsbDtcbiAgICAgICAgdGhpcy5yYXdWaWV3ID0gZWRpdG9yVmlld1swXTtcbiAgICAgICAgY29uc3QgY2QgPSB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBjb25zdCBzY3JvbGwgPSB0aGlzLmdldEZyb21TaGFkb3dEb20oZWRpdG9yVmlldywgXCIuc2Nyb2xsLXZpZXdcIik7XG4gICAgICAgIGlmICghc2Nyb2xsWzBdKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBsZXQgbGFzdEV4cHJUeXBlQnVmZmVyUHQ7XG4gICAgICAgIGNvbnN0IG1vdXNlbW92ZSA9IE9ic2VydmFibGUuZnJvbUV2ZW50KHNjcm9sbFswXSwgXCJtb3VzZW1vdmVcIik7XG4gICAgICAgIGNvbnN0IG1vdXNlb3V0ID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQoc2Nyb2xsWzBdLCBcIm1vdXNlb3V0XCIpO1xuICAgICAgICB0aGlzLmtleWRvd24gPSBPYnNlcnZhYmxlLmZyb21FdmVudChzY3JvbGxbMF0sIFwia2V5ZG93blwiKTtcbiAgICAgICAgY2QuYWRkKGJ1ZmZlckZvcihtb3VzZW1vdmUub2JzZXJ2ZU9uKFNjaGVkdWxlci5xdWV1ZSksIDQwMClcbiAgICAgICAgICAgIC5tYXAoZXZlbnRzID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgZXZlbnQgb2YgZXZlbnRzLnJldmVyc2UoKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBpeGVsUHQgPSB0aGlzLnBpeGVsUG9zaXRpb25Gcm9tTW91c2VFdmVudChlZGl0b3JWaWV3LCBldmVudCk7XG4gICAgICAgICAgICAgICAgaWYgKCFwaXhlbFB0KVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBzY3JlZW5QdCA9IGVkaXRvci5zY3JlZW5Qb3NpdGlvbkZvclBpeGVsUG9zaXRpb24ocGl4ZWxQdCk7XG4gICAgICAgICAgICAgICAgY29uc3QgYnVmZmVyUHQgPSBlZGl0b3IuYnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5QdCk7XG4gICAgICAgICAgICAgICAgaWYgKGxhc3RFeHByVHlwZUJ1ZmZlclB0ICYmIGxhc3RFeHByVHlwZUJ1ZmZlclB0LmlzRXF1YWwoYnVmZmVyUHQpICYmIHRoaXMuZXhwclR5cGVUb29sdGlwKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBsYXN0RXhwclR5cGVCdWZmZXJQdCA9IGJ1ZmZlclB0O1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGJ1ZmZlclB0LCBldmVudCB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbHRlcih6ID0+ICEheilcbiAgICAgICAgICAgIC5kbygoKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKVxuICAgICAgICAgICAgLmZpbHRlcih4ID0+IHRoaXMuY2hlY2tQb3NpdGlvbih4LmJ1ZmZlclB0KSlcbiAgICAgICAgICAgIC5kbygoKSA9PiB0aGlzLnN1YmNyaWJlS2V5RG93bigpKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgoeyBidWZmZXJQdCwgZXZlbnQgfSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zaG93RXhwcmVzc2lvblR5cGVPbk1vdXNlT3ZlcihldmVudCwgYnVmZmVyUHQpO1xuICAgICAgICB9KSk7XG4gICAgICAgIGNkLmFkZChtb3VzZW91dC5zdWJzY3JpYmUoKGUpID0+IHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCkpKTtcbiAgICAgICAgY2QuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0LCBpbm5lckNkKSA9PiB7XG4gICAgICAgICAgICBpbm5lckNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKSk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgY2QuYWRkKERpc3Bvc2FibGUuY3JlYXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCk7XG4gICAgICAgIH0pKTtcbiAgICB9XG4gICAgc3ViY3JpYmVLZXlEb3duKCkge1xuICAgICAgICB0aGlzLmtleWRvd25TdWJzY3JpcHRpb24gPSB0aGlzLmtleWRvd24uc3Vic2NyaWJlKChlKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLmtleWRvd25TdWJzY3JpcHRpb24pO1xuICAgIH1cbiAgICBzaG93RXhwcmVzc2lvblR5cGVPbkNvbW1hbmQoKSB7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvci5jdXJzb3JzLmxlbmd0aCA8IDEpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNvbnN0IGJ1ZmZlclB0ID0gdGhpcy5lZGl0b3IuZ2V0Q3Vyc29yQnVmZmVyUG9zaXRpb24oKTtcbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrUG9zaXRpb24oYnVmZmVyUHQpKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBvZmZzZXQgPSAodGhpcy5yYXdWaWV3LmNvbXBvbmVudC5nZXRGb250U2l6ZSgpICogYnVmZmVyUHQuY29sdW1uKSAqIDAuNztcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKHRoaXMuZWRpdG9yVmlldywgXCIuY3Vyc29yLWxpbmVcIilbMF07XG4gICAgICAgIGlmICghc2hhZG93KVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCByZWN0ID0gc2hhZG93LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBjb25zdCB0b29sdGlwUmVjdCA9IHtcbiAgICAgICAgICAgIGxlZnQ6IHJlY3QubGVmdCAtIG9mZnNldCxcbiAgICAgICAgICAgIHJpZ2h0OiByZWN0LmxlZnQgKyBvZmZzZXQsXG4gICAgICAgICAgICB0b3A6IHJlY3QuYm90dG9tLFxuICAgICAgICAgICAgYm90dG9tOiByZWN0LmJvdHRvbVxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpO1xuICAgICAgICB0aGlzLnN1YmNyaWJlS2V5RG93bigpO1xuICAgICAgICB0aGlzLnNob3dUb29sVGlwKGJ1ZmZlclB0LCB0b29sdGlwUmVjdCk7XG4gICAgfVxuICAgIHNob3dFeHByZXNzaW9uVHlwZU9uTW91c2VPdmVyKGUsIGJ1ZmZlclB0KSB7XG4gICAgICAgIGlmICghT21uaS5pc09uKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuZXhwclR5cGVUb29sdGlwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBvZmZzZXQgPSB0aGlzLmVkaXRvci5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKSAqIDAuNztcbiAgICAgICAgY29uc3QgdG9vbHRpcFJlY3QgPSB7XG4gICAgICAgICAgICBsZWZ0OiBlLmNsaWVudFgsXG4gICAgICAgICAgICByaWdodDogZS5jbGllbnRYLFxuICAgICAgICAgICAgdG9wOiBlLmNsaWVudFkgLSBvZmZzZXQsXG4gICAgICAgICAgICBib3R0b206IGUuY2xpZW50WSArIG9mZnNldFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnNob3dUb29sVGlwKGJ1ZmZlclB0LCB0b29sdGlwUmVjdCk7XG4gICAgfVxuICAgIGNoZWNrUG9zaXRpb24oYnVmZmVyUHQpIHtcbiAgICAgICAgY29uc3QgY3VyQ2hhclBpeGVsUHQgPSB0aGlzLnJhd1ZpZXcucGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKFtidWZmZXJQdC5yb3csIGJ1ZmZlclB0LmNvbHVtbl0pO1xuICAgICAgICBjb25zdCBuZXh0Q2hhclBpeGVsUHQgPSB0aGlzLnJhd1ZpZXcucGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKFtidWZmZXJQdC5yb3csIGJ1ZmZlclB0LmNvbHVtbiArIDFdKTtcbiAgICAgICAgaWYgKGN1ckNoYXJQaXhlbFB0LmxlZnQgPj0gbmV4dENoYXJQaXhlbFB0LmxlZnQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHNob3dUb29sVGlwKGJ1ZmZlclB0LCB0b29sdGlwUmVjdCkge1xuICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcCA9IG5ldyBUb29sdGlwVmlldyh0b29sdGlwUmVjdCk7XG4gICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi50eXBlbG9va3VwKHtcbiAgICAgICAgICAgIEluY2x1ZGVEb2N1bWVudGF0aW9uOiB0cnVlLFxuICAgICAgICAgICAgTGluZTogYnVmZmVyUHQucm93LFxuICAgICAgICAgICAgQ29sdW1uOiBidWZmZXJQdC5jb2x1bW5cbiAgICAgICAgfSkpLnN1YnNjcmliZSgocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5UeXBlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSBgPGI+JHtlc2NhcGUocmVzcG9uc2UuVHlwZSl9PC9iPmA7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuRG9jdW1lbnRhdGlvbikge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlICsgYDxici8+PGk+JHtlc2NhcGUocmVzcG9uc2UuRG9jdW1lbnRhdGlvbil9PC9pPmA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5leHByVHlwZVRvb2x0aXApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcC51cGRhdGVUZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgaGlkZUV4cHJlc3Npb25UeXBlKCkge1xuICAgICAgICBpZiAoIXRoaXMuZXhwclR5cGVUb29sdGlwKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcC5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy5leHByVHlwZVRvb2x0aXAgPSBudWxsO1xuICAgICAgICBpZiAodGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmRpc3Bvc2FibGUucmVtb3ZlKHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbik7XG4gICAgICAgICAgICB0aGlzLmtleWRvd25TdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgIHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbiA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0RnJvbVNoYWRvd0RvbShlbGVtZW50LCBzZWxlY3Rvcikge1xuICAgICAgICBjb25zdCBlbCA9IGVsZW1lbnRbMF07XG4gICAgICAgIGlmICghZWwucm9vdEVsZW1lbnQpXG4gICAgICAgICAgICByZXR1cm4gJChlbCk7XG4gICAgICAgIGNvbnN0IGZvdW5kID0gZWwucm9vdEVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgICAgIHJldHVybiAkKGZvdW5kWzBdKTtcbiAgICB9XG4gICAgcGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvclZpZXcsIGV2ZW50KSB7XG4gICAgICAgIGNvbnN0IGNsaWVudFggPSBldmVudC5jbGllbnRYLCBjbGllbnRZID0gZXZlbnQuY2xpZW50WTtcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKGVkaXRvclZpZXcsIFwiLmxpbmVzXCIpWzBdO1xuICAgICAgICBpZiAoIXNoYWRvdylcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgbGluZXNDbGllbnRSZWN0ID0gc2hhZG93LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBsZXQgdG9wID0gY2xpZW50WSAtIGxpbmVzQ2xpZW50UmVjdC50b3A7XG4gICAgICAgIGxldCBsZWZ0ID0gY2xpZW50WCAtIGxpbmVzQ2xpZW50UmVjdC5sZWZ0O1xuICAgICAgICB0b3AgKz0gdGhpcy5lZGl0b3IuZ2V0U2Nyb2xsVG9wKCk7XG4gICAgICAgIGxlZnQgKz0gdGhpcy5lZGl0b3IuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xuICAgIH1cbn1cbmV4cG9ydCBjb25zdCB0eXBlTG9va3VwID0gbmV3IFR5cGVMb29rdXA7XG4iLCIvLyBJbnNwaXJhdGlvbiA6IGh0dHBzOi8vYXRvbS5pby9wYWNrYWdlcy9pZGUtaGFza2VsbFxuLy8gYW5kIGh0dHBzOi8vYXRvbS5pby9wYWNrYWdlcy9pZGUtZmxvd1xuLy8gaHR0cHM6Ly9hdG9tLmlvL3BhY2thZ2VzL2F0b20tdHlwZXNjcmlwdFxuaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQge09ic2VydmFibGUsIFNjaGVkdWxlciwgU3Vic2NyaXB0aW9ufSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlLCBEaXNwb3NhYmxlLCBJRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7T21uaX0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQge1Rvb2x0aXBWaWV3fSBmcm9tIFwiLi4vdmlld3MvdG9vbHRpcC12aWV3XCI7XG5jb25zdCAkOiBKUXVlcnlTdGF0aWMgPSByZXF1aXJlKFwianF1ZXJ5XCIpO1xuY29uc3QgZXNjYXBlID0gcmVxdWlyZShcImVzY2FwZS1odG1sXCIpO1xuaW1wb3J0IHtidWZmZXJGb3J9IGZyb20gXCIuLi9vcGVyYXRvcnMvYnVmZmVyRm9yXCI7XG5cbmNsYXNzIFR5cGVMb29rdXAgaW1wbGVtZW50cyBJRmVhdHVyZSB7XG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xuICAgICAgICBsZXQgdG9vbHRpcDogVG9vbHRpcDtcbiAgICAgICAgLyogdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWwgKi9cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLnN3aXRjaEFjdGl2ZUVkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgLy8gc3Vic2NyaWJlIGZvciB0b29sdGlwc1xuICAgICAgICAgICAgLy8gaW5zcGlyYXRpb24gOiBodHRwczovL2dpdGh1Yi5jb20vY2hhaWthMjAxMy9pZGUtaGFza2VsbFxuICAgICAgICAgICAgY29uc3QgZWRpdG9yVmlldyA9ICQoYXRvbS52aWV3cy5nZXRWaWV3KGVkaXRvcikpO1xuICAgICAgICAgICAgdG9vbHRpcCA9IG5ldyBUb29sdGlwKGVkaXRvclZpZXcsIGVkaXRvcik7XG4gICAgICAgICAgICBjZC5hZGQodG9vbHRpcCk7XG4gICAgICAgIH0pKTtcblxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTp0eXBlLWxvb2t1cFwiLCAoKSA9PiB7XG4gICAgICAgICAgICBPbW5pLmFjdGl2ZUVkaXRvci5maXJzdCgpLnN1YnNjcmliZShlZGl0b3IgPT4ge1xuICAgICAgICAgICAgICAgIHRvb2x0aXAuc2hvd0V4cHJlc3Npb25UeXBlT25Db21tYW5kKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkpO1xuICAgICAgICAvKiB0c2xpbnQ6ZW5hYmxlOm5vLXN0cmluZy1saXRlcmFsICovXG4gICAgfVxuXG4gICAgcHVibGljIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlcXVpcmVkID0gZmFsc2U7XG4gICAgcHVibGljIHRpdGxlID0gXCJUb29sdGlwIExvb2t1cFwiO1xuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiQWRkcyBob3ZlciB0b29sdGlwcyB0byB0aGUgZWRpdG9yLCBhbHNvIGhhcyBhIGtleWJpbmRcIjtcbn1cblxuY2xhc3MgVG9vbHRpcCBpbXBsZW1lbnRzIElEaXNwb3NhYmxlIHtcbiAgICBwcml2YXRlIGV4cHJUeXBlVG9vbHRpcDogVG9vbHRpcFZpZXcgPSBudWxsO1xuICAgIHByaXZhdGUga2V5ZG93bjogT2JzZXJ2YWJsZTxLZXlib2FyZEV2ZW50PjtcbiAgICBwcml2YXRlIGtleWRvd25TdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcbiAgICBwcml2YXRlIHJhd1ZpZXc6IGFueTtcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGVkaXRvclZpZXc6IEpRdWVyeSwgcHJpdmF0ZSBlZGl0b3I6IEF0b20uVGV4dEVkaXRvcikge1xuICAgICAgICB0aGlzLnJhd1ZpZXcgPSBlZGl0b3JWaWV3WzBdO1xuXG4gICAgICAgIGNvbnN0IGNkID0gdGhpcy5kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcblxuICAgICAgICBjb25zdCBzY3JvbGwgPSB0aGlzLmdldEZyb21TaGFkb3dEb20oZWRpdG9yVmlldywgXCIuc2Nyb2xsLXZpZXdcIik7XG4gICAgICAgIGlmICghc2Nyb2xsWzBdKSByZXR1cm47XG5cbiAgICAgICAgLy8gdG8gZGVib3VuY2UgbW91c2Vtb3ZlIGV2ZW50XCJzIGZpcmluZyBmb3Igc29tZSByZWFzb24gb24gc29tZSBtYWNoaW5lc1xuICAgICAgICBsZXQgbGFzdEV4cHJUeXBlQnVmZmVyUHQ6IGFueTtcblxuICAgICAgICBjb25zdCBtb3VzZW1vdmUgPSBPYnNlcnZhYmxlLmZyb21FdmVudDxNb3VzZUV2ZW50PihzY3JvbGxbMF0sIFwibW91c2Vtb3ZlXCIpO1xuICAgICAgICBjb25zdCBtb3VzZW91dCA9IE9ic2VydmFibGUuZnJvbUV2ZW50PE1vdXNlRXZlbnQ+KHNjcm9sbFswXSwgXCJtb3VzZW91dFwiKTtcbiAgICAgICAgdGhpcy5rZXlkb3duID0gT2JzZXJ2YWJsZS5mcm9tRXZlbnQ8S2V5Ym9hcmRFdmVudD4oc2Nyb2xsWzBdLCBcImtleWRvd25cIik7XG5cbiAgICAgICAgY2QuYWRkKGJ1ZmZlckZvcihtb3VzZW1vdmUub2JzZXJ2ZU9uKFNjaGVkdWxlci5xdWV1ZSksIDQwMClcbiAgICAgICAgICAgIC5tYXAoZXZlbnRzID0+IHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGV2ZW50IG9mIGV2ZW50cy5yZXZlcnNlKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxQdCA9IHRoaXMucGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvclZpZXcsIGV2ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwaXhlbFB0KVxuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNjcmVlblB0ID0gZWRpdG9yLnNjcmVlblBvc2l0aW9uRm9yUGl4ZWxQb3NpdGlvbihwaXhlbFB0KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYnVmZmVyUHQgPSBlZGl0b3IuYnVmZmVyUG9zaXRpb25Gb3JTY3JlZW5Qb3NpdGlvbihzY3JlZW5QdCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsYXN0RXhwclR5cGVCdWZmZXJQdCAmJiBsYXN0RXhwclR5cGVCdWZmZXJQdC5pc0VxdWFsKGJ1ZmZlclB0KSAmJiB0aGlzLmV4cHJUeXBlVG9vbHRpcClcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIGxhc3RFeHByVHlwZUJ1ZmZlclB0ID0gYnVmZmVyUHQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IGJ1ZmZlclB0LCBldmVudCB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZmlsdGVyKHogPT4gISF6KVxuICAgICAgICAgICAgLmRvKCgpID0+IHRoaXMuaGlkZUV4cHJlc3Npb25UeXBlKCkpXG4gICAgICAgICAgICAuZmlsdGVyKHggPT4gdGhpcy5jaGVja1Bvc2l0aW9uKHguYnVmZmVyUHQpKVxuICAgICAgICAgICAgLmRvKCgpID0+IHRoaXMuc3ViY3JpYmVLZXlEb3duKCkpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKCh7YnVmZmVyUHQsIGV2ZW50fSkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0V4cHJlc3Npb25UeXBlT25Nb3VzZU92ZXIoZXZlbnQsIGJ1ZmZlclB0KTtcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICBjZC5hZGQobW91c2VvdXQuc3Vic2NyaWJlKChlKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKSk7XG5cbiAgICAgICAgY2QuYWRkKE9tbmkuc3dpdGNoQWN0aXZlRWRpdG9yKChlZGl0LCBpbm5lckNkKSA9PiB7XG4gICAgICAgICAgICBpbm5lckNkLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKSk7XG4gICAgICAgIH0pKTtcblxuICAgICAgICBjZC5hZGQoRGlzcG9zYWJsZS5jcmVhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5oaWRlRXhwcmVzc2lvblR5cGUoKTtcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3ViY3JpYmVLZXlEb3duKCkge1xuICAgICAgICB0aGlzLmtleWRvd25TdWJzY3JpcHRpb24gPSB0aGlzLmtleWRvd24uc3Vic2NyaWJlKChlKSA9PiB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZCh0aGlzLmtleWRvd25TdWJzY3JpcHRpb24pO1xuICAgIH1cblxuICAgIHB1YmxpYyBzaG93RXhwcmVzc2lvblR5cGVPbkNvbW1hbmQoKSB7XG4gICAgICAgIGlmICh0aGlzLmVkaXRvci5jdXJzb3JzLmxlbmd0aCA8IDEpIHJldHVybjtcblxuICAgICAgICBjb25zdCBidWZmZXJQdCA9IHRoaXMuZWRpdG9yLmdldEN1cnNvckJ1ZmZlclBvc2l0aW9uKCk7XG5cbiAgICAgICAgaWYgKCF0aGlzLmNoZWNrUG9zaXRpb24oYnVmZmVyUHQpKSByZXR1cm47XG5cbiAgICAgICAgLy8gZmluZCBvdXQgc2hvdyBwb3NpdGlvblxuICAgICAgICBjb25zdCBvZmZzZXQgPSAodGhpcy5yYXdWaWV3LmNvbXBvbmVudC5nZXRGb250U2l6ZSgpICogYnVmZmVyUHQuY29sdW1uKSAqIDAuNztcbiAgICAgICAgY29uc3Qgc2hhZG93ID0gdGhpcy5nZXRGcm9tU2hhZG93RG9tKHRoaXMuZWRpdG9yVmlldywgXCIuY3Vyc29yLWxpbmVcIilbMF07XG4gICAgICAgIGlmICghc2hhZG93KSByZXR1cm47XG4gICAgICAgIGNvbnN0IHJlY3QgPSBzaGFkb3cuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgICAgICAgY29uc3QgdG9vbHRpcFJlY3QgPSB7XG4gICAgICAgICAgICBsZWZ0OiByZWN0LmxlZnQgLSBvZmZzZXQsXG4gICAgICAgICAgICByaWdodDogcmVjdC5sZWZ0ICsgb2Zmc2V0LFxuICAgICAgICAgICAgdG9wOiByZWN0LmJvdHRvbSxcbiAgICAgICAgICAgIGJvdHRvbTogcmVjdC5ib3R0b21cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmhpZGVFeHByZXNzaW9uVHlwZSgpO1xuICAgICAgICB0aGlzLnN1YmNyaWJlS2V5RG93bigpO1xuICAgICAgICB0aGlzLnNob3dUb29sVGlwKGJ1ZmZlclB0LCB0b29sdGlwUmVjdCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzaG93RXhwcmVzc2lvblR5cGVPbk1vdXNlT3ZlcihlOiBNb3VzZUV2ZW50LCBidWZmZXJQdDogVGV4dEJ1ZmZlci5Qb2ludCkge1xuICAgICAgICBpZiAoIU9tbmkuaXNPbikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgd2UgYXJlIGFscmVhZHkgc2hvd2luZyB3ZSBzaG91bGQgd2FpdCBmb3IgdGhhdCB0byBjbGVhclxuICAgICAgICBpZiAodGhpcy5leHByVHlwZVRvb2x0aXApIHJldHVybjtcblxuICAgICAgICAvLyBmaW5kIG91dCBzaG93IHBvc2l0aW9uXG4gICAgICAgIGNvbnN0IG9mZnNldCA9ICg8YW55PnRoaXMuZWRpdG9yKS5nZXRMaW5lSGVpZ2h0SW5QaXhlbHMoKSAqIDAuNztcbiAgICAgICAgY29uc3QgdG9vbHRpcFJlY3QgPSB7XG4gICAgICAgICAgICBsZWZ0OiBlLmNsaWVudFgsXG4gICAgICAgICAgICByaWdodDogZS5jbGllbnRYLFxuICAgICAgICAgICAgdG9wOiBlLmNsaWVudFkgLSBvZmZzZXQsXG4gICAgICAgICAgICBib3R0b206IGUuY2xpZW50WSArIG9mZnNldFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc2hvd1Rvb2xUaXAoYnVmZmVyUHQsIHRvb2x0aXBSZWN0KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNoZWNrUG9zaXRpb24oYnVmZmVyUHQ6IFRleHRCdWZmZXIuUG9pbnQpIHtcbiAgICAgICAgY29uc3QgY3VyQ2hhclBpeGVsUHQgPSB0aGlzLnJhd1ZpZXcucGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKFtidWZmZXJQdC5yb3csIGJ1ZmZlclB0LmNvbHVtbl0pO1xuICAgICAgICBjb25zdCBuZXh0Q2hhclBpeGVsUHQgPSB0aGlzLnJhd1ZpZXcucGl4ZWxQb3NpdGlvbkZvckJ1ZmZlclBvc2l0aW9uKFtidWZmZXJQdC5yb3csIGJ1ZmZlclB0LmNvbHVtbiArIDFdKTtcblxuICAgICAgICBpZiAoY3VyQ2hhclBpeGVsUHQubGVmdCA+PSBuZXh0Q2hhclBpeGVsUHQubGVmdCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHNob3dUb29sVGlwKGJ1ZmZlclB0OiBUZXh0QnVmZmVyLlBvaW50LCB0b29sdGlwUmVjdDogYW55KSB7XG4gICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwID0gbmV3IFRvb2x0aXBWaWV3KHRvb2x0aXBSZWN0KTtcblxuICAgICAgICAvLyBBY3R1YWxseSBtYWtlIHRoZSBwcm9ncmFtIG1hbmFnZXIgcXVlcnlcbiAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLnR5cGVsb29rdXAoe1xuICAgICAgICAgICAgSW5jbHVkZURvY3VtZW50YXRpb246IHRydWUsXG4gICAgICAgICAgICBMaW5lOiBidWZmZXJQdC5yb3csXG4gICAgICAgICAgICBDb2x1bW46IGJ1ZmZlclB0LmNvbHVtblxuICAgICAgICB9KSkuc3Vic2NyaWJlKChyZXNwb25zZTogTW9kZWxzLlR5cGVMb29rdXBSZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLlR5cGUgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZXQgbWVzc2FnZSA9IGA8Yj4ke2VzY2FwZShyZXNwb25zZS5UeXBlKX08L2I+YDtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5Eb2N1bWVudGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UgKyBgPGJyLz48aT4ke2VzY2FwZShyZXNwb25zZS5Eb2N1bWVudGF0aW9uKX08L2k+YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFNvcnJ5IGFib3V0IHRoaXMgXCJpZlwiLiBJdFwicyBpbiB0aGUgY29kZSBJIGNvcGllZCBzbyBJIGd1ZXNzIGl0cyB0aGVyZSBmb3IgYSByZWFzb25cbiAgICAgICAgICAgIGlmICh0aGlzLmV4cHJUeXBlVG9vbHRpcCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwLnVwZGF0ZVRleHQobWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgaGlkZUV4cHJlc3Npb25UeXBlKCkge1xuICAgICAgICBpZiAoIXRoaXMuZXhwclR5cGVUb29sdGlwKSByZXR1cm47XG4gICAgICAgIHRoaXMuZXhwclR5cGVUb29sdGlwLnJlbW92ZSgpO1xuICAgICAgICB0aGlzLmV4cHJUeXBlVG9vbHRpcCA9IG51bGw7XG5cbiAgICAgICAgaWYgKHRoaXMua2V5ZG93blN1YnNjcmlwdGlvbikge1xuICAgICAgICAgICAgdGhpcy5kaXNwb3NhYmxlLnJlbW92ZSh0aGlzLmtleWRvd25TdWJzY3JpcHRpb24pO1xuICAgICAgICAgICAgdGhpcy5rZXlkb3duU3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICB0aGlzLmtleWRvd25TdWJzY3JpcHRpb24gPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRGcm9tU2hhZG93RG9tKGVsZW1lbnQ6IEpRdWVyeSwgc2VsZWN0b3I6IHN0cmluZyk6IEpRdWVyeSB7XG4gICAgICAgIGNvbnN0IGVsID0gZWxlbWVudFswXTtcbiAgICAgICAgaWYgKCEoPGFueT5lbCkucm9vdEVsZW1lbnQpIHJldHVybiAkKGVsKTtcblxuICAgICAgICBjb25zdCBmb3VuZCA9ICg8YW55PmVsKS5yb290RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICAgICAgcmV0dXJuICQoZm91bmRbMF0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgcGl4ZWxQb3NpdGlvbkZyb21Nb3VzZUV2ZW50KGVkaXRvclZpZXc6IGFueSwgZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICAgICAgY29uc3QgY2xpZW50WCA9IGV2ZW50LmNsaWVudFgsIGNsaWVudFkgPSBldmVudC5jbGllbnRZO1xuICAgICAgICBjb25zdCBzaGFkb3cgPSB0aGlzLmdldEZyb21TaGFkb3dEb20oZWRpdG9yVmlldywgXCIubGluZXNcIilbMF07XG4gICAgICAgIGlmICghc2hhZG93KSByZXR1cm47XG4gICAgICAgIGNvbnN0IGxpbmVzQ2xpZW50UmVjdCA9IHNoYWRvdy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgbGV0IHRvcCA9IGNsaWVudFkgLSBsaW5lc0NsaWVudFJlY3QudG9wO1xuICAgICAgICBsZXQgbGVmdCA9IGNsaWVudFggLSBsaW5lc0NsaWVudFJlY3QubGVmdDtcbiAgICAgICAgdG9wICs9ICg8YW55PnRoaXMuZWRpdG9yKS5nZXRTY3JvbGxUb3AoKTtcbiAgICAgICAgbGVmdCArPSAoPGFueT50aGlzLmVkaXRvcikuZ2V0U2Nyb2xsTGVmdCgpO1xuICAgICAgICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xuICAgIH1cbn1cblxuZXhwb3J0IGNvbnN0IHR5cGVMb29rdXAgPSBuZXcgVHlwZUxvb2t1cDtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

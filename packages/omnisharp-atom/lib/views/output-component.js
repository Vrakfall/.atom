"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OutputElement = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var fastdom = require("fastdom");

var $ = require("jquery");

var OutputElement = exports.OutputElement = function (_HTMLOListElement) {
    _inherits(OutputElement, _HTMLOListElement);

    function OutputElement() {
        _classCallCheck(this, OutputElement);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(OutputElement).apply(this, arguments));
    }

    _createClass(OutputElement, [{
        key: "createdCallback",
        value: function createdCallback() {
            var _this2 = this;

            this.output = [];
            this.classList.add("messages-container", "ol");
            var parent = this;
            var onclickHandler = function onclickHandler(e) {
                parent.selected = this.key;
                parent.handleClick(this.item);
            };
            this._update = _lodash2.default.throttle(function () {
                fastdom.measure(function () {
                    var _loop = function _loop(i, len) {
                        var item = _this2.output[i];
                        var child = _this2.children[i];
                        if (!item && child) {
                            _this2.removeChild(child);
                            return "continue";
                        }
                        fastdom.mutate(function () {
                            if (item && !child) {
                                child = _this2.elementFactory();
                                child.onclick = onclickHandler;
                                _this2.appendChild(child);
                            }
                            if (item && child) {
                                var key = _this2.getKey(item);
                                if (child.key !== key) {
                                    child.setMessage(key, item);
                                    child.item = item;
                                }
                            }
                            if (child) {
                                if (child.key === _this2._selectedKey && !child.selected) {
                                    child.selected = true;
                                } else if (child.selected) {
                                    child.selected = false;
                                }
                            }
                        });
                    };

                    for (var i = 0, len = _this2.children.length > _this2.output.length ? _this2.children.length : _this2.output.length; i < len; i++) {
                        var _ret = _loop(i, len);

                        if (_ret === "continue") continue;
                    }
                    fastdom.mutate(function () {
                        _this2.scrollToItemView();
                        _this2._calculateInview();
                    });
                });
            }, 100, { leading: true, trailing: true });
            this.onkeydown = function (e) {
                return _this2.keydownPane(e);
            };
            this._scroll = _lodash2.default.throttle(function (e) {
                return _this2._calculateInview();
            }, 100, { leading: true, trailing: true });
        }
    }, {
        key: "attachedCallback",
        value: function attachedCallback() {
            this.parentElement.addEventListener("scroll", this._scroll);
            this._calculateInview();
        }
    }, {
        key: "attached",
        value: function attached() {
            var _this3 = this;

            fastdom.mutate(function () {
                _this3._update();
                _lodash2.default.each(_this3.children, function (x) {
                    return x.attached();
                });
                _this3._calculateInview();
            });
        }
    }, {
        key: "detached",
        value: function detached() {
            var _this4 = this;

            fastdom.mutate(function () {
                _lodash2.default.each(_this4.children, function (x) {
                    return x.detached();
                });
            });
        }
    }, {
        key: "_calculateInview",
        value: function _calculateInview() {
            var _this5 = this;

            var self = $(this);
            fastdom.measure(function () {
                var top = self.scrollTop();
                var bottom = top + _this5.parentElement.clientHeight * 2;

                var _loop2 = function _loop2(i, len) {
                    var child = _this5.children[i];
                    var $child = $(child);
                    var position = $child.position();
                    var height = child.clientHeight;
                    var inview = position.top + height > top && position.top < bottom;
                    if (child.inview !== inview) {
                        fastdom.mutate(function () {
                            child.inview = inview;
                        });
                    }
                };

                for (var i = 0, len = _this5.children.length; i < len; i++) {
                    _loop2(i, len);
                }
            });
        }
    }, {
        key: "next",
        value: function next() {
            this.selectedIndex = this._selectedIndex + 1;
        }
    }, {
        key: "prev",
        value: function prev() {
            this.selectedIndex = this._selectedIndex - 1;
        }
    }, {
        key: "updateOutput",
        value: function updateOutput(output) {
            this.output = output.slice();
            this._update();
        }
    }, {
        key: "keydownPane",
        value: function keydownPane(e) {
            if (e.keyIdentifier === "Down") {
                atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:next-" + this.eventName);
            } else if (e.keyIdentifier === "Up") {
                atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:previous-" + this.eventName);
            } else if (e.keyIdentifier === "Enter") {
                atom.commands.dispatch(atom.views.getView(atom.workspace), "omnisharp-atom:go-to-" + this.eventName);
            }
        }
    }, {
        key: "scrollToItemView",
        value: function scrollToItemView() {
            var self = $(this);
            var item = self.find(".selected");
            if (!item || !item.position()) return;
            var pane = self;
            var scrollTop = pane.scrollTop();
            var desiredTop = item.position().top + scrollTop;
            var desiredBottom = desiredTop + item.outerHeight();
            if (desiredTop < scrollTop) {
                pane.scrollTop(desiredTop);
            } else if (desiredBottom > pane.scrollTop() + item.outerHeight()) {
                pane.scrollTop(desiredBottom + item.outerHeight());
            }
        }
    }, {
        key: "selected",
        get: function get() {
            return this._selectedKey;
        },
        set: function set(value) {
            var index = _lodash2.default.findIndex(this.children, function (e) {
                return e.key === value;
            });
            if (index) {
                var e = this.children[index];
                this._selectedKey = value;
                this._selectedIndex = index;
                if (this._selectedElement) {
                    this._selectedElement.selected = false;
                }
                this._selectedElement = e;
                e.selected = true;
            }
        }
    }, {
        key: "selectedIndex",
        get: function get() {
            return this._selectedIndex;
        },
        set: function set(index) {
            var e = this.children[index];
            if (e) {
                this.selected = e.key;
            }
        }
    }, {
        key: "current",
        get: function get() {
            return this.output[this._selectedIndex];
        }
    }]);

    return OutputElement;
}(HTMLOListElement);

exports.OutputElement = document.registerElement("omnisharp-output-list", { prototype: OutputElement.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9vdXRwdXQtY29tcG9uZW50LmpzIiwibGliL3ZpZXdzL291dHB1dC1jb21wb25lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0E7Ozs7Ozs7Ozs7OztBQ0RBLElBQUksVUFBMEIsUUFBUSxTQUFSLENBQTlCOztBQUVBLElBQU0sSUFBa0IsUUFBUSxRQUFSLENBQXhCOztJQVlBLGEsV0FBQSxhOzs7Ozs7Ozs7OzswQ0FRMEI7QUFBQTs7QUFDbEIsaUJBQUssTUFBTCxHQUFjLEVBQWQ7QUFDQSxpQkFBSyxTQUFMLENBQWUsR0FBZixDQUFtQixvQkFBbkIsRUFBeUMsSUFBekM7QUFDQSxnQkFBTSxTQUFTLElBQWY7QUFDQSxnQkFBTSxpQkFBaUIsU0FBakIsY0FBaUIsQ0FBUyxDQUFULEVBQW1CO0FBQ3RDLHVCQUFPLFFBQVAsR0FBa0IsS0FBSyxHQUF2QjtBQUNBLHVCQUFPLFdBQVAsQ0FBbUIsS0FBSyxJQUF4QjtBQUNILGFBSEQ7QUFLQSxpQkFBSyxPQUFMLEdBQWUsaUJBQUUsUUFBRixDQUFXLFlBQUE7QUFDdEIsd0JBQVEsT0FBUixDQUFnQixZQUFBO0FBQUEsK0NBQ0gsQ0FERyxFQUNJLEdBREo7QUFFUiw0QkFBTSxPQUFPLE9BQUssTUFBTCxDQUFZLENBQVosQ0FBYjtBQUNBLDRCQUFJLFFBQXVCLE9BQUssUUFBTCxDQUFjLENBQWQsQ0FBM0I7QUFDQSw0QkFBSSxDQUFDLElBQUQsSUFBUyxLQUFiLEVBQW9CO0FBQ2hCLG1DQUFLLFdBQUwsQ0FBaUIsS0FBakI7QUFDQTtBQUNIO0FBQ0QsZ0NBQVEsTUFBUixDQUFlLFlBQUE7QUFDWCxnQ0FBSSxRQUFRLENBQUMsS0FBYixFQUFvQjtBQUNoQix3Q0FBUSxPQUFLLGNBQUwsRUFBUjtBQUNBLHNDQUFNLE9BQU4sR0FBZ0IsY0FBaEI7QUFDQSx1Q0FBSyxXQUFMLENBQWlCLEtBQWpCO0FBQ0g7QUFFRCxnQ0FBSSxRQUFRLEtBQVosRUFBbUI7QUFDZixvQ0FB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UUFBTCxDQUFjLEtBQWQsQ0FBekI7QUFDQSxnQkFBSSxDQUFKLEVBQU87QUFDSCxxQkFBSyxRQUFMLEdBQWdCLEVBQUUsR0FBbEI7QUFDSDtBQUNKOzs7NEJBRWlCO0FBQUssbUJBQU8sS0FBSyxNQUFMLENBQVksS0FBSyxjQUFqQixDQUFQO0FBQTBDOzs7O0VBbklhLGdCOztBQThLNUUsUUFBUyxhQUFULEdBQStCLFNBQVUsZUFBVixDQUEwQix1QkFBMUIsRUFBbUQsRUFBRSxXQUFXLGNBQWMsU0FBM0IsRUFBbkQsQ0FBL0IiLCJmaWxlIjoibGliL3ZpZXdzL291dHB1dC1jb21wb25lbnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgZmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuY29uc3QgJCA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG5leHBvcnQgY2xhc3MgT3V0cHV0RWxlbWVudCBleHRlbmRzIEhUTUxPTGlzdEVsZW1lbnQge1xuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5vdXRwdXQgPSBbXTtcbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwibWVzc2FnZXMtY29udGFpbmVyXCIsIFwib2xcIik7XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHRoaXM7XG4gICAgICAgIGNvbnN0IG9uY2xpY2tIYW5kbGVyID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIHBhcmVudC5zZWxlY3RlZCA9IHRoaXMua2V5O1xuICAgICAgICAgICAgcGFyZW50LmhhbmRsZUNsaWNrKHRoaXMuaXRlbSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX3VwZGF0ZSA9IF8udGhyb3R0bGUoKCkgPT4ge1xuICAgICAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gdGhpcy5jaGlsZHJlbi5sZW5ndGggPiB0aGlzLm91dHB1dC5sZW5ndGggPyB0aGlzLmNoaWxkcmVuLmxlbmd0aCA6IHRoaXMub3V0cHV0Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLm91dHB1dFtpXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNoaWxkID0gdGhpcy5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpdGVtICYmIGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtICYmICFjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkID0gdGhpcy5lbGVtZW50RmFjdG9yeSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLm9uY2xpY2sgPSBvbmNsaWNrSGFuZGxlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpdGVtICYmIGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qga2V5ID0gdGhpcy5nZXRLZXkoaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkLmtleSAhPT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnNldE1lc3NhZ2Uoa2V5LCBpdGVtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuaXRlbSA9IGl0ZW07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkLmtleSA9PT0gdGhpcy5fc2VsZWN0ZWRLZXkgJiYgIWNoaWxkLnNlbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoY2hpbGQuc2VsZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuc2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9JdGVtVmlldygpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYWxjdWxhdGVJbnZpZXcoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCAxMDAsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSk7XG4gICAgICAgIHRoaXMub25rZXlkb3duID0gKGUpID0+IHRoaXMua2V5ZG93blBhbmUoZSk7XG4gICAgICAgIHRoaXMuX3Njcm9sbCA9IF8udGhyb3R0bGUoKGUpID0+IHRoaXMuX2NhbGN1bGF0ZUludmlldygpLCAxMDAsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSk7XG4gICAgfVxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMucGFyZW50RWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsIHRoaXMuX3Njcm9sbCk7XG4gICAgICAgIHRoaXMuX2NhbGN1bGF0ZUludmlldygpO1xuICAgIH1cbiAgICBhdHRhY2hlZCgpIHtcbiAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fdXBkYXRlKCk7XG4gICAgICAgICAgICBfLmVhY2godGhpcy5jaGlsZHJlbiwgKHgpID0+IHguYXR0YWNoZWQoKSk7XG4gICAgICAgICAgICB0aGlzLl9jYWxjdWxhdGVJbnZpZXcoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGRldGFjaGVkKCkge1xuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICBfLmVhY2godGhpcy5jaGlsZHJlbiwgKHgpID0+IHguZGV0YWNoZWQoKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBfY2FsY3VsYXRlSW52aWV3KCkge1xuICAgICAgICBjb25zdCBzZWxmID0gJCh0aGlzKTtcbiAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRvcCA9IHNlbGYuc2Nyb2xsVG9wKCk7XG4gICAgICAgICAgICBjb25zdCBib3R0b20gPSB0b3AgKyB0aGlzLnBhcmVudEVsZW1lbnQuY2xpZW50SGVpZ2h0ICogMjtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSB0aGlzLmNoaWxkcmVuLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGQgPSB0aGlzLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIGNvbnN0ICRjaGlsZCA9ICQoY2hpbGQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uID0gJGNoaWxkLnBvc2l0aW9uKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgaGVpZ2h0ID0gY2hpbGQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgICAgICAgIGNvbnN0IGludmlldyA9IHBvc2l0aW9uLnRvcCArIGhlaWdodCA+IHRvcCAmJiBwb3NpdGlvbi50b3AgPCBib3R0b207XG4gICAgICAgICAgICAgICAgaWYgKGNoaWxkLmludmlldyAhPT0gaW52aWV3KSB7XG4gICAgICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLmludmlldyA9IGludmlldztcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0IHNlbGVjdGVkKCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0ZWRLZXk7IH1cbiAgICBzZXQgc2VsZWN0ZWQodmFsdWUpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSBfLmZpbmRJbmRleCh0aGlzLmNoaWxkcmVuLCAoZSkgPT4gZS5rZXkgPT09IHZhbHVlKTtcbiAgICAgICAgaWYgKGluZGV4KSB7XG4gICAgICAgICAgICBjb25zdCBlID0gdGhpcy5jaGlsZHJlbltpbmRleF07XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEtleSA9IHZhbHVlO1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IGluZGV4O1xuICAgICAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkRWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkRWxlbWVudC5zZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRFbGVtZW50ID0gZTtcbiAgICAgICAgICAgIGUuc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGdldCBzZWxlY3RlZEluZGV4KCkgeyByZXR1cm4gdGhpcy5fc2VsZWN0ZWRJbmRleDsgfVxuICAgIHNldCBzZWxlY3RlZEluZGV4KGluZGV4KSB7XG4gICAgICAgIGNvbnN0IGUgPSB0aGlzLmNoaWxkcmVuW2luZGV4XTtcbiAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBlLmtleTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBnZXQgY3VycmVudCgpIHsgcmV0dXJuIHRoaXMub3V0cHV0W3RoaXMuX3NlbGVjdGVkSW5kZXhdOyB9XG4gICAgbmV4dCgpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gdGhpcy5fc2VsZWN0ZWRJbmRleCArIDE7XG4gICAgfVxuICAgIHByZXYoKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IHRoaXMuX3NlbGVjdGVkSW5kZXggLSAxO1xuICAgIH1cbiAgICB1cGRhdGVPdXRwdXQob3V0cHV0KSB7XG4gICAgICAgIHRoaXMub3V0cHV0ID0gb3V0cHV0LnNsaWNlKCk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xuICAgIH1cbiAgICBrZXlkb3duUGFuZShlKSB7XG4gICAgICAgIGlmIChlLmtleUlkZW50aWZpZXIgPT09IFwiRG93blwiKSB7XG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIGBvbW5pc2hhcnAtYXRvbTpuZXh0LSR7dGhpcy5ldmVudE5hbWV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZS5rZXlJZGVudGlmaWVyID09PSBcIlVwXCIpIHtcbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgYG9tbmlzaGFycC1hdG9tOnByZXZpb3VzLSR7dGhpcy5ldmVudE5hbWV9YCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZS5rZXlJZGVudGlmaWVyID09PSBcIkVudGVyXCIpIHtcbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgYG9tbmlzaGFycC1hdG9tOmdvLXRvLSR7dGhpcy5ldmVudE5hbWV9YCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc2Nyb2xsVG9JdGVtVmlldygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9ICQodGhpcyk7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSBzZWxmLmZpbmQoYC5zZWxlY3RlZGApO1xuICAgICAgICBpZiAoIWl0ZW0gfHwgIWl0ZW0ucG9zaXRpb24oKSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgcGFuZSA9IHNlbGY7XG4gICAgICAgIGNvbnN0IHNjcm9sbFRvcCA9IHBhbmUuc2Nyb2xsVG9wKCk7XG4gICAgICAgIGNvbnN0IGRlc2lyZWRUb3AgPSBpdGVtLnBvc2l0aW9uKCkudG9wICsgc2Nyb2xsVG9wO1xuICAgICAgICBjb25zdCBkZXNpcmVkQm90dG9tID0gZGVzaXJlZFRvcCArIGl0ZW0ub3V0ZXJIZWlnaHQoKTtcbiAgICAgICAgaWYgKGRlc2lyZWRUb3AgPCBzY3JvbGxUb3ApIHtcbiAgICAgICAgICAgIHBhbmUuc2Nyb2xsVG9wKGRlc2lyZWRUb3ApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRlc2lyZWRCb3R0b20gPiBwYW5lLnNjcm9sbFRvcCgpICsgaXRlbS5vdXRlckhlaWdodCgpKSB7XG4gICAgICAgICAgICBwYW5lLnNjcm9sbFRvcChkZXNpcmVkQm90dG9tICsgaXRlbS5vdXRlckhlaWdodCgpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuT3V0cHV0RWxlbWVudCA9IGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1vdXRwdXQtbGlzdFwiLCB7IHByb3RvdHlwZTogT3V0cHV0RWxlbWVudC5wcm90b3R5cGUgfSk7XG4iLCJsZXQgZmFzdGRvbTogdHlwZW9mIEZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmNvbnN0ICQ6IEpRdWVyeVN0YXRpYyA9IHJlcXVpcmUoXCJqcXVlcnlcIik7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWVzc2FnZUVsZW1lbnQ8VEl0ZW0+IGV4dGVuZHMgSFRNTExJRWxlbWVudCB7XG4gICAga2V5OiBzdHJpbmc7XG4gICAgc2VsZWN0ZWQ6IGJvb2xlYW47XG4gICAgaW52aWV3OiBib29sZWFuO1xuICAgIHNldE1lc3NhZ2Uoa2V5OiBzdHJpbmcsIGl0ZW06IFRJdGVtKTogdm9pZDtcbiAgICBpdGVtOiBUSXRlbTtcbiAgICBhdHRhY2hlZCgpOiB2b2lkO1xuICAgIGRldGFjaGVkKCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBjbGFzcyBPdXRwdXRFbGVtZW50PFRJdGVtLCBURWxlbWVudCBleHRlbmRzIE1lc3NhZ2VFbGVtZW50PFRJdGVtPj4gZXh0ZW5kcyBIVE1MT0xpc3RFbGVtZW50IGltcGxlbWVudHMgV2ViQ29tcG9uZW50IHtcbiAgICBwcml2YXRlIG91dHB1dDogVEl0ZW1bXTtcbiAgICBwcml2YXRlIF9zZWxlY3RlZEtleTogc3RyaW5nO1xuICAgIHByaXZhdGUgX3NlbGVjdGVkSW5kZXg6IG51bWJlcjtcbiAgICBwcml2YXRlIF9zZWxlY3RlZEVsZW1lbnQ6IFRFbGVtZW50O1xuICAgIHByaXZhdGUgX3VwZGF0ZTogKCkgPT4gdm9pZDtcbiAgICBwcml2YXRlIF9zY3JvbGw6IGFueTtcblxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMub3V0cHV0ID0gW107XG4gICAgICAgIHRoaXMuY2xhc3NMaXN0LmFkZChcIm1lc3NhZ2VzLWNvbnRhaW5lclwiLCBcIm9sXCIpO1xuICAgICAgICBjb25zdCBwYXJlbnQgPSB0aGlzO1xuICAgICAgICBjb25zdCBvbmNsaWNrSGFuZGxlciA9IGZ1bmN0aW9uKGU6IFVJRXZlbnQpIHtcbiAgICAgICAgICAgIHBhcmVudC5zZWxlY3RlZCA9IHRoaXMua2V5O1xuICAgICAgICAgICAgcGFyZW50LmhhbmRsZUNsaWNrKHRoaXMuaXRlbSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5fdXBkYXRlID0gXy50aHJvdHRsZSgoKSA9PiB7XG4gICAgICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSB0aGlzLmNoaWxkcmVuLmxlbmd0aCA+IHRoaXMub3V0cHV0Lmxlbmd0aCA/IHRoaXMuY2hpbGRyZW4ubGVuZ3RoIDogdGhpcy5vdXRwdXQubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMub3V0cHV0W2ldO1xuICAgICAgICAgICAgICAgICAgICBsZXQgY2hpbGQ6IFRFbGVtZW50ID0gPGFueT50aGlzLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWl0ZW0gJiYgY2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlQ2hpbGQoY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0gJiYgIWNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQgPSB0aGlzLmVsZW1lbnRGYWN0b3J5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQub25jbGljayA9IG9uY2xpY2tIYW5kbGVyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbSAmJiBjaGlsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGtleSA9IHRoaXMuZ2V0S2V5KGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjaGlsZC5rZXkgIT09IGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGlsZC5zZXRNZXNzYWdlKGtleSwgaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLml0ZW0gPSBpdGVtO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNoaWxkLmtleSA9PT0gdGhpcy5fc2VsZWN0ZWRLZXkgJiYgIWNoaWxkLnNlbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoaWxkLnNlbGVjdGVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoaWxkLnNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9JdGVtVmlldygpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYWxjdWxhdGVJbnZpZXcoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCAxMDAsIHsgbGVhZGluZzogdHJ1ZSwgdHJhaWxpbmc6IHRydWUgfSk7XG5cbiAgICAgICAgdGhpcy5vbmtleWRvd24gPSAoZTogYW55KSA9PiB0aGlzLmtleWRvd25QYW5lKGUpO1xuICAgICAgICB0aGlzLl9zY3JvbGwgPSBfLnRocm90dGxlKChlOiBVSUV2ZW50KSA9PiB0aGlzLl9jYWxjdWxhdGVJbnZpZXcoKSwgMTAwLCB7IGxlYWRpbmc6IHRydWUsIHRyYWlsaW5nOiB0cnVlIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICB0aGlzLnBhcmVudEVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInNjcm9sbFwiLCB0aGlzLl9zY3JvbGwpO1xuICAgICAgICB0aGlzLl9jYWxjdWxhdGVJbnZpZXcoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXR0YWNoZWQoKSB7XG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xuICAgICAgICAgICAgXy5lYWNoKHRoaXMuY2hpbGRyZW4sICh4OiBURWxlbWVudCkgPT4geC5hdHRhY2hlZCgpKTtcbiAgICAgICAgICAgIHRoaXMuX2NhbGN1bGF0ZUludmlldygpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGV0YWNoZWQoKSB7XG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgIF8uZWFjaCh0aGlzLmNoaWxkcmVuLCAoeDogVEVsZW1lbnQpID0+IHguZGV0YWNoZWQoKSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2NhbGN1bGF0ZUludmlldygpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9ICQodGhpcyk7XG4gICAgICAgIGZhc3Rkb20ubWVhc3VyZSgoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0b3AgPSBzZWxmLnNjcm9sbFRvcCgpO1xuICAgICAgICAgICAgY29uc3QgYm90dG9tID0gdG9wICsgdGhpcy5wYXJlbnRFbGVtZW50LmNsaWVudEhlaWdodCAqIDI7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gdGhpcy5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkOiBURWxlbWVudCA9IDxhbnk+dGhpcy5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICBjb25zdCAkY2hpbGQgPSAkKGNoaWxkKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwb3NpdGlvbiA9ICRjaGlsZC5wb3NpdGlvbigpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGhlaWdodCA9IGNoaWxkLmNsaWVudEhlaWdodDtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGludmlldyA9IHBvc2l0aW9uLnRvcCArIGhlaWdodCA+IHRvcCAmJiBwb3NpdGlvbi50b3AgPCBib3R0b207XG5cbiAgICAgICAgICAgICAgICBpZiAoY2hpbGQuaW52aWV3ICE9PSBpbnZpZXcpIHtcbiAgICAgICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQuaW52aWV3ID0gaW52aWV3O1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRLZXk6IChtZXNzYWdlOiBUSXRlbSkgPT4gc3RyaW5nO1xuICAgIHB1YmxpYyBldmVudE5hbWU6IHN0cmluZztcbiAgICBwdWJsaWMgaGFuZGxlQ2xpY2s6IChpdGVtOiBUSXRlbSkgPT4gdm9pZDtcbiAgICBwdWJsaWMgZWxlbWVudEZhY3Rvcnk6ICgpID0+IFRFbGVtZW50O1xuXG4gICAgcHVibGljIGdldCBzZWxlY3RlZCgpIHsgcmV0dXJuIHRoaXMuX3NlbGVjdGVkS2V5OyB9XG4gICAgcHVibGljIHNldCBzZWxlY3RlZCh2YWx1ZTogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gXy5maW5kSW5kZXgodGhpcy5jaGlsZHJlbiwgKGU6IFRFbGVtZW50KSA9PiBlLmtleSA9PT0gdmFsdWUpO1xuICAgICAgICBpZiAoaW5kZXgpIHtcbiAgICAgICAgICAgIGNvbnN0IGU6IFRFbGVtZW50ID0gPGFueT50aGlzLmNoaWxkcmVuW2luZGV4XTtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkS2V5ID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICBpZiAodGhpcy5fc2VsZWN0ZWRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRFbGVtZW50LnNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEVsZW1lbnQgPSBlO1xuICAgICAgICAgICAgZS5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IHNlbGVjdGVkSW5kZXgoKSB7IHJldHVybiB0aGlzLl9zZWxlY3RlZEluZGV4OyB9XG4gICAgcHVibGljIHNldCBzZWxlY3RlZEluZGV4KGluZGV4KSB7XG4gICAgICAgIGNvbnN0IGU6IFRFbGVtZW50ID0gPGFueT50aGlzLmNoaWxkcmVuW2luZGV4XTtcbiAgICAgICAgaWYgKGUpIHtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWQgPSBlLmtleTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgY3VycmVudCgpIHsgcmV0dXJuIHRoaXMub3V0cHV0W3RoaXMuX3NlbGVjdGVkSW5kZXhdOyB9XG5cbiAgICBwdWJsaWMgbmV4dCgpIHtcbiAgICAgICAgdGhpcy5zZWxlY3RlZEluZGV4ID0gdGhpcy5fc2VsZWN0ZWRJbmRleCArIDE7XG4gICAgfVxuXG4gICAgcHVibGljIHByZXYoKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0ZWRJbmRleCA9IHRoaXMuX3NlbGVjdGVkSW5kZXggLSAxO1xuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGVPdXRwdXQob3V0cHV0OiBUSXRlbVtdKSB7XG4gICAgICAgIHRoaXMub3V0cHV0ID0gb3V0cHV0LnNsaWNlKCk7XG4gICAgICAgIHRoaXMuX3VwZGF0ZSgpO1xuICAgIH1cblxuICAgIHByaXZhdGUga2V5ZG93blBhbmUoZTogYW55KSB7XG4gICAgICAgIGlmIChlLmtleUlkZW50aWZpZXIgPT09IFwiRG93blwiKSB7XG4gICAgICAgICAgICBhdG9tLmNvbW1hbmRzLmRpc3BhdGNoKGF0b20udmlld3MuZ2V0VmlldyhhdG9tLndvcmtzcGFjZSksIGBvbW5pc2hhcnAtYXRvbTpuZXh0LSR7dGhpcy5ldmVudE5hbWV9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZS5rZXlJZGVudGlmaWVyID09PSBcIlVwXCIpIHtcbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgYG9tbmlzaGFycC1hdG9tOnByZXZpb3VzLSR7dGhpcy5ldmVudE5hbWV9YCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZS5rZXlJZGVudGlmaWVyID09PSBcIkVudGVyXCIpIHtcbiAgICAgICAgICAgIGF0b20uY29tbWFuZHMuZGlzcGF0Y2goYXRvbS52aWV3cy5nZXRWaWV3KGF0b20ud29ya3NwYWNlKSwgYG9tbmlzaGFycC1hdG9tOmdvLXRvLSR7dGhpcy5ldmVudE5hbWV9YCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIHNjcm9sbFRvSXRlbVZpZXcoKSB7XG4gICAgICAgIGNvbnN0IHNlbGYgPSAkKHRoaXMpO1xuICAgICAgICBjb25zdCBpdGVtID0gc2VsZi5maW5kKGAuc2VsZWN0ZWRgKTtcbiAgICAgICAgaWYgKCFpdGVtIHx8ICFpdGVtLnBvc2l0aW9uKCkpIHJldHVybjtcblxuICAgICAgICBjb25zdCBwYW5lID0gc2VsZjtcbiAgICAgICAgY29uc3Qgc2Nyb2xsVG9wID0gcGFuZS5zY3JvbGxUb3AoKTtcbiAgICAgICAgY29uc3QgZGVzaXJlZFRvcCA9IGl0ZW0ucG9zaXRpb24oKS50b3AgKyBzY3JvbGxUb3A7XG4gICAgICAgIGNvbnN0IGRlc2lyZWRCb3R0b20gPSBkZXNpcmVkVG9wICsgaXRlbS5vdXRlckhlaWdodCgpO1xuXG4gICAgICAgIGlmIChkZXNpcmVkVG9wIDwgc2Nyb2xsVG9wKSB7XG4gICAgICAgICAgICBwYW5lLnNjcm9sbFRvcChkZXNpcmVkVG9wKTtcbiAgICAgICAgfSBlbHNlIGlmIChkZXNpcmVkQm90dG9tID4gcGFuZS5zY3JvbGxUb3AoKSArIGl0ZW0ub3V0ZXJIZWlnaHQoKSkge1xuICAgICAgICAgICAgcGFuZS5zY3JvbGxUb3AoZGVzaXJlZEJvdHRvbSArIGl0ZW0ub3V0ZXJIZWlnaHQoKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbig8YW55PmV4cG9ydHMpLk91dHB1dEVsZW1lbnQgPSAoPGFueT5kb2N1bWVudCkucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLW91dHB1dC1saXN0XCIsIHsgcHJvdG90eXBlOiBPdXRwdXRFbGVtZW50LnByb3RvdHlwZSB9KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

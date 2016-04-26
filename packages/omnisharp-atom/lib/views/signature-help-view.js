"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SignatureParameterView = exports.SignatureView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var fastdom = require("fastdom");

var parseString = function () {
    var parser = new DOMParser();
    return function (xml) {
        return parser.parseFromString(xml, "text/xml");
    };
}();

var SignatureView = exports.SignatureView = function (_HTMLDivElement) {
    _inherits(SignatureView, _HTMLDivElement);

    function SignatureView() {
        var _Object$getPrototypeO;

        _classCallCheck(this, SignatureView);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var _this = _possibleConstructorReturn(this, (_Object$getPrototypeO = Object.getPrototypeOf(SignatureView)).call.apply(_Object$getPrototypeO, [this].concat(args)));

        _this._parametersList = [];
        return _this;
    }

    _createClass(SignatureView, [{
        key: "createdCallback",
        value: function createdCallback() {
            this._selectedIndex = -1;
            this._lastIndex = -1;
            this._editorLineHeight = 0;
            this._inner = document.createElement("div");
            this._label = document.createElement("span");
            this._documentation = document.createElement("div");
            this._parameterDocumentation = document.createElement("div");
            this._parameterDocumentation.style.marginLeft = "2.4em";
            this._arrows = document.createElement("span");
            this._parameters = document.createElement("span");
            this._count = document.createElement("span");
            this._parametersList = [];
            this.classList.add("tooltip");
            this._inner.classList.add("tooltip-inner");
            this._setupArrows();
            var open = document.createElement("span");
            open.innerText = "(";
            var close = document.createElement("span");
            close.innerText = ")";
            this.appendChild(this._inner);
            this._inner.appendChild(this._documentation);
            this._inner.appendChild(this._arrows);
            this._inner.appendChild(this._label);
            this._inner.appendChild(open);
            this._inner.appendChild(this._parameters);
            this._inner.appendChild(close);
            open = document.createElement("span");
            open.innerText = " [";
            close = document.createElement("span");
            close.innerText = "]";
            this._inner.appendChild(open);
            this._inner.appendChild(this._count);
            this._inner.appendChild(close);
            this._inner.appendChild(this._parameterDocumentation);
        }
    }, {
        key: "moveIndex",
        value: function moveIndex(direction) {
            var _this2 = this;

            if (!this._member) return;
            this._selectedIndex += direction;
            if (this._selectedIndex < 0) {
                this._selectedIndex = this._member.Signatures.length - 1;
            }
            if (this._selectedIndex > this._member.Signatures.length - 1) {
                this._selectedIndex = 0;
            }
            fastdom.mutate(function () {
                return _this2._count.innerText = (_this2._selectedIndex + 1).toString();
            });
            this.updateMember(this._member);
        }
    }, {
        key: "_setupArrows",
        value: function _setupArrows() {
            var _this3 = this;

            var up = document.createElement("a");
            up.classList.add("icon-arrow-up");
            up.onclick = function () {
                return _this3.moveIndex(-1);
            };
            var down = document.createElement("a");
            down.classList.add("icon-arrow-down");
            down.onclick = function () {
                return _this3.moveIndex(1);
            };
            this._arrows.appendChild(up);
            this._arrows.appendChild(down);
        }
    }, {
        key: "setLineHeight",
        value: function setLineHeight(height) {
            this._editorLineHeight = height;
            if (this._member) this.updateMember(this._member);
        }
    }, {
        key: "updateMember",
        value: function updateMember(member) {
            var _this4 = this;

            this._member = member;
            if (this._selectedIndex === -1) {
                this._selectedIndex = member.ActiveSignature;
                if (member.ActiveSignature === -1) {
                    this._selectedIndex = 0;
                }
            }
            var signature = member.Signatures[this._selectedIndex];
            if (!signature) return;
            var docs = void 0;
            if (signature.Documentation) docs = parseString(signature.Documentation);
            if (this._lastIndex !== this._selectedIndex) {
                this._lastIndex = this._selectedIndex;
                fastdom.mutate(function () {
                    _this4._count.innerText = (_this4._selectedIndex + 1).toString();
                    _this4._label.innerText = signature.Name;
                    _this4._documentation.innerText = signature.Documentation;
                    if (docs && signature.Documentation) {
                        var s = docs.getElementsByTagName("summary");
                        if (s.length) {
                            var summary = _lodash2.default.trim(s[0].innerHTML);
                            _this4._documentation.innerText = summary;
                        } else {
                            _this4._documentation.innerText = "";
                            _this4._documentation.style.display = "none";
                        }
                        _this4._documentation.style.display = "";
                    } else {
                        _this4._documentation.innerText = "";
                        _this4._documentation.style.display = "none";
                    }
                    if (member.Signatures.length > 1) {
                        _this4._arrows.style.display = "";
                    } else {
                        _this4._arrows.style.display = "none";
                    }
                });
                this._parametersList = [];
                fastdom.mutate(function () {
                    var parameters = signature.Parameters;
                    var parametersElement = document.createElement("span");
                    _lodash2.default.each(parameters, function (parameter, i) {
                        var view = new exports.SignatureParameterView();
                        view.setMember(parameter);
                        view.setCurrent(i === member.ActiveParameter);
                        if (i > 0) {
                            var comma = document.createElement("span");
                            comma.innerText = ", ";
                            parametersElement.appendChild(comma);
                        }
                        parametersElement.appendChild(view);
                        _this4._parametersList.push(view);
                    });
                    var currentElement = _this4._parameters;
                    _this4._inner.insertBefore(parametersElement, currentElement);
                    _this4._inner.removeChild(currentElement);
                    _this4._parameters = parametersElement;
                });
            } else {
                fastdom.mutate(function () {
                    _lodash2.default.each(signature.Parameters, function (param, i) {
                        return _this4._parametersList[i] && _this4._parametersList[i].setCurrent(i === member.ActiveParameter);
                    });
                });
            }
            var currentParameter = signature.Parameters[member.ActiveParameter];
            fastdom.measure(function () {
                if (!currentParameter) return;
                var summary = void 0;
                if (currentParameter.Documentation) {
                    var paramDocs = parseString(currentParameter.Documentation);
                    if (paramDocs) {
                        var s = paramDocs.getElementsByTagName("summary");
                        if (s.length) {
                            var summaryElement = s[0];
                            if (summaryElement) summary = _lodash2.default.trim(summaryElement.innerHTML);
                        }
                    }
                }
                if (docs && !summary) {
                    var _s = docs.getElementsByTagName("param");
                    if (_s.length) {
                        var param = _lodash2.default.find(_s, function (x) {
                            return x.attributes["name"] && x.attributes["name"].value === currentParameter.Name;
                        });
                        if (param) {
                            summary = _lodash2.default.trim(param.innerHTML);
                        }
                    }
                }
                if (_this4._parameterDocumentation.innerText !== summary) {
                    if (summary) {
                        _this4._parameterDocumentation.innerText = summary;
                    } else {
                        _this4._parameterDocumentation.innerText = "";
                    }
                }
            });
            fastdom.mutate(function () {
                return _this4.style.bottom = _this4.clientHeight + _this4._editorLineHeight + "px";
            });
        }
    }, {
        key: "detachedCallback",
        value: function detachedCallback() {
            _lodash2.default.each(this._parametersList, function (parameter) {
                return parameter.remove();
            });
            this._parametersList = [];
        }
    }]);

    return SignatureView;
}(HTMLDivElement);

exports.SignatureView = document.registerElement("omnisharp-signature-help", { prototype: SignatureView.prototype });

var SignatureParameterView = exports.SignatureParameterView = function (_HTMLSpanElement) {
    _inherits(SignatureParameterView, _HTMLSpanElement);

    function SignatureParameterView() {
        _classCallCheck(this, SignatureParameterView);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(SignatureParameterView).apply(this, arguments));
    }

    _createClass(SignatureParameterView, [{
        key: "createdCallback",
        value: function createdCallback() {
            this._label = document.createElement("span");
            this.appendChild(this._label);
        }
    }, {
        key: "setMember",
        value: function setMember(member) {
            this._member = member;
            this._label.innerText = member.Label;
        }
    }, {
        key: "setCurrent",
        value: function setCurrent(current) {
            var _this6 = this;

            fastdom.measure(function () {
                if (!current && _this6.style.fontWeight === "bold") {
                    fastdom.mutate(function () {
                        return _this6.style.fontWeight = "";
                    });
                } else if (current && _this6.style.fontWeight !== "bold") {
                    fastdom.mutate(function () {
                        return _this6.style.fontWeight = "bold";
                    });
                }
            });
        }
    }]);

    return SignatureParameterView;
}(HTMLSpanElement);

exports.SignatureParameterView = document.registerElement("omnisharp-signature-parameter", { prototype: SignatureParameterView.prototype });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi92aWV3cy9zaWduYXR1cmUtaGVscC12aWV3LmpzIiwibGliL3ZpZXdzL3NpZ25hdHVyZS1oZWxwLXZpZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0E7Ozs7Ozs7Ozs7OztBQ0VBLElBQUksVUFBMEIsUUFBUSxTQUFSLENBQTlCOztBQUdBLElBQU0sY0FBZSxZQUFBO0FBQ2pCLFFBQU0sU0FBUyxJQUFJLFNBQUosRUFBZjtBQUVBLFdBQU8sVUFBUyxHQUFULEVBQW9CO0FBQ3ZCLGVBQU8sT0FBTyxlQUFQLENBQXVCLEdBQXZCLEVBQTRCLFVBQTVCLENBQVA7QUFDSCxLQUZEO0FBR0gsQ0FObUIsRUFBcEI7O0lBUUEsYSxXQUFBLGE7OztBQUFBLDZCQUFBO0FBQUE7O0FBQUE7O0FBQUEsMENBQUEsSUFBQTtBQUFBLGdCQUFBO0FBQUE7O0FBQUEsb0tBQW1DLElBQW5DOztBQU9ZLGNBQUEsZUFBQSxHQUE0QyxFQUE1QztBQVBaO0FBZ09DOzs7OzBDQWxOeUI7QUFDbEIsaUJBQUssY0FBTCxHQUFzQixDQUFDLENBQXZCO0FBQ0EsaUJBQUssVUFBTCxHQUFrQixDQUFDLENBQW5CO0FBQ0EsaUJBQUssaUJBQUwsR0FBeUIsQ0FBekI7QUFFQSxpQkFBSyxNQUFMLEdBQWMsU0FBUyxhQUFULENBQXVCLEtBQXZCLENBQWQ7QUFDQSxpQkFBSyxNQUFMLEdBQWMsU0FBUyxhQUFULENBQXVCLE1BQXZCLENBQWQ7QUFDQSxpQkFBSyxjQUFMLEdBQXNCLFNBQVMsYUFBVCxDQUF1QixLQUF2QixDQUF0QjtBQUNBLGlCQUFLLHVCQUFMLEdBQStCLFNBQVMsYUFBVCxDQUF1QixLQUF2QixDQUEvQjtBQUNBLGlCQUFLLHVCQUFMLENBQTZCLEtBQTdCLENBQW1DLFVBQW5DLEdBQWdELE9BQWhEO0FBQ0EsaUJBQUssT0FBTCxHQUFlLFNBQVMsYUFBVCxDQUF1QixNQUF2QixDQUFmO0FBQ0EsaUJBQUssV0FBTCxHQUFtQixTQUFTLGFBQVQsQ0FB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SyxXQUFMLENBQWlCLEtBQUssTUFBdEI7QUFDSDs7O2tDQUVnQixNLEVBQXFDO0FBQ2xELGlCQUFLLE9BQUwsR0FBZSxNQUFmO0FBQ0EsaUJBQUssTUFBTCxDQUFZLFNBQVosR0FBd0IsT0FBTyxLQUEvQjtBQUNIOzs7bUNBRWlCLE8sRUFBZ0I7QUFBQTs7QUFDOUIsb0JBQVEsT0FBUixDQUFnQixZQUFBO0FBQ1osb0JBQUksQ0FBQyxPQUFELElBQVksT0FBSyxLQUFMLENBQVcsVUFBWCxLQUEwQixNQUExQyxFQUFrRDtBQUM5Qyw0QkFBUSxNQUFSLENBQWU7QUFBQSwrQkFBTSxPQUFLLEtBQUwsQ0FBVyxVQUFYLEdBQXdCLEVBQTlCO0FBQUEscUJBQWY7QUFDSCxpQkFGRCxNQUVPLElBQUksV0FBVyxPQUFLLEtBQUwsQ0FBVyxVQUFYLEtBQTBCLE1BQXpDLEVBQWlEO0FBQ3BELDRCQUFRLE1BQVIsQ0FBZTtBQUFBLCtCQUFNLE9BQUssS0FBTCxDQUFXLFVBQVgsR0FBd0IsTUFBOUI7QUFBQSxxQkFBZjtBQUNIO0FBQ0osYUFORDtBQU9IOzs7O0VBdEJ1QyxlOztBQXlCdEMsUUFBUyxzQkFBVCxHQUF3QyxTQUFVLGVBQVYsQ0FBMEIsK0JBQTFCLEVBQTJELEVBQUUsV0FBVyx1QkFBdUIsU0FBcEMsRUFBM0QsQ0FBeEMiLCJmaWxlIjoibGliL3ZpZXdzL3NpZ25hdHVyZS1oZWxwLXZpZXcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgZmFzdGRvbSA9IHJlcXVpcmUoXCJmYXN0ZG9tXCIpO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuY29uc3QgcGFyc2VTdHJpbmcgPSAoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IHBhcnNlciA9IG5ldyBET01QYXJzZXIoKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHhtbCkge1xuICAgICAgICByZXR1cm4gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyh4bWwsIFwidGV4dC94bWxcIik7XG4gICAgfTtcbn0pKCk7XG5leHBvcnQgY2xhc3MgU2lnbmF0dXJlVmlldyBleHRlbmRzIEhUTUxEaXZFbGVtZW50IHtcbiAgICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3MpO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdCA9IFtdO1xuICAgIH1cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSAtMTtcbiAgICAgICAgdGhpcy5fbGFzdEluZGV4ID0gLTE7XG4gICAgICAgIHRoaXMuX2VkaXRvckxpbmVIZWlnaHQgPSAwO1xuICAgICAgICB0aGlzLl9pbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX2xhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbi5zdHlsZS5tYXJnaW5MZWZ0ID0gXCIyLjRlbVwiO1xuICAgICAgICB0aGlzLl9hcnJvd3MgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVycyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0aGlzLl9jb3VudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdCA9IFtdO1xuICAgICAgICB0aGlzLmNsYXNzTGlzdC5hZGQoXCJ0b29sdGlwXCIpO1xuICAgICAgICB0aGlzLl9pbm5lci5jbGFzc0xpc3QuYWRkKFwidG9vbHRpcC1pbm5lclwiKTtcbiAgICAgICAgdGhpcy5fc2V0dXBBcnJvd3MoKTtcbiAgICAgICAgbGV0IG9wZW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgb3Blbi5pbm5lclRleHQgPSBcIihcIjtcbiAgICAgICAgbGV0IGNsb3NlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIGNsb3NlLmlubmVyVGV4dCA9IFwiKVwiO1xuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2lubmVyKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fZG9jdW1lbnRhdGlvbik7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX2Fycm93cyk7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX2xhYmVsKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQob3Blbik7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX3BhcmFtZXRlcnMpO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZChjbG9zZSk7XG4gICAgICAgIG9wZW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgb3Blbi5pbm5lclRleHQgPSBcIiBbXCI7XG4gICAgICAgIGNsb3NlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIGNsb3NlLmlubmVyVGV4dCA9IFwiXVwiO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZChvcGVuKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fY291bnQpO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZChjbG9zZSk7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24pO1xuICAgIH1cbiAgICBtb3ZlSW5kZXgoZGlyZWN0aW9uKSB7XG4gICAgICAgIGlmICghdGhpcy5fbWVtYmVyKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ICs9IGRpcmVjdGlvbjtcbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkSW5kZXggPCAwKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gdGhpcy5fbWVtYmVyLlNpZ25hdHVyZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fc2VsZWN0ZWRJbmRleCA+IHRoaXMuX21lbWJlci5TaWduYXR1cmVzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSAwO1xuICAgICAgICB9XG4gICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuX2NvdW50LmlubmVyVGV4dCA9ICh0aGlzLl9zZWxlY3RlZEluZGV4ICsgMSkudG9TdHJpbmcoKSk7XG4gICAgICAgIHRoaXMudXBkYXRlTWVtYmVyKHRoaXMuX21lbWJlcik7XG4gICAgfVxuICAgIF9zZXR1cEFycm93cygpIHtcbiAgICAgICAgY29uc3QgdXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICAgICAgdXAuY2xhc3NMaXN0LmFkZChcImljb24tYXJyb3ctdXBcIik7XG4gICAgICAgIHVwLm9uY2xpY2sgPSAoKSA9PiB0aGlzLm1vdmVJbmRleCgtMSk7XG4gICAgICAgIGNvbnN0IGRvd24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcbiAgICAgICAgZG93bi5jbGFzc0xpc3QuYWRkKFwiaWNvbi1hcnJvdy1kb3duXCIpO1xuICAgICAgICBkb3duLm9uY2xpY2sgPSAoKSA9PiB0aGlzLm1vdmVJbmRleCgxKTtcbiAgICAgICAgdGhpcy5fYXJyb3dzLmFwcGVuZENoaWxkKHVwKTtcbiAgICAgICAgdGhpcy5fYXJyb3dzLmFwcGVuZENoaWxkKGRvd24pO1xuICAgIH1cbiAgICBzZXRMaW5lSGVpZ2h0KGhlaWdodCkge1xuICAgICAgICB0aGlzLl9lZGl0b3JMaW5lSGVpZ2h0ID0gaGVpZ2h0O1xuICAgICAgICBpZiAodGhpcy5fbWVtYmVyKVxuICAgICAgICAgICAgdGhpcy51cGRhdGVNZW1iZXIodGhpcy5fbWVtYmVyKTtcbiAgICB9XG4gICAgdXBkYXRlTWVtYmVyKG1lbWJlcikge1xuICAgICAgICB0aGlzLl9tZW1iZXIgPSBtZW1iZXI7XG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RlZEluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IG1lbWJlci5BY3RpdmVTaWduYXR1cmU7XG4gICAgICAgICAgICBpZiAobWVtYmVyLkFjdGl2ZVNpZ25hdHVyZSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzaWduYXR1cmUgPSBtZW1iZXIuU2lnbmF0dXJlc1t0aGlzLl9zZWxlY3RlZEluZGV4XTtcbiAgICAgICAgaWYgKCFzaWduYXR1cmUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGxldCBkb2NzO1xuICAgICAgICBpZiAoc2lnbmF0dXJlLkRvY3VtZW50YXRpb24pXG4gICAgICAgICAgICBkb2NzID0gcGFyc2VTdHJpbmcoc2lnbmF0dXJlLkRvY3VtZW50YXRpb24pO1xuICAgICAgICBpZiAodGhpcy5fbGFzdEluZGV4ICE9PSB0aGlzLl9zZWxlY3RlZEluZGV4KSB7XG4gICAgICAgICAgICB0aGlzLl9sYXN0SW5kZXggPSB0aGlzLl9zZWxlY3RlZEluZGV4O1xuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX2NvdW50LmlubmVyVGV4dCA9ICh0aGlzLl9zZWxlY3RlZEluZGV4ICsgMSkudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9sYWJlbC5pbm5lclRleHQgPSBzaWduYXR1cmUuTmFtZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9IHNpZ25hdHVyZS5Eb2N1bWVudGF0aW9uO1xuICAgICAgICAgICAgICAgIGlmIChkb2NzICYmIHNpZ25hdHVyZS5Eb2N1bWVudGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHMgPSBkb2NzLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3VtbWFyeVwiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdW1tYXJ5ID0gXy50cmltKChzWzBdKS5pbm5lckhUTUwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBzdW1tYXJ5O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChtZW1iZXIuU2lnbmF0dXJlcy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Fycm93cy5zdHlsZS5kaXNwbGF5ID0gXCJcIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Fycm93cy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdCA9IFtdO1xuICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtZXRlcnMgPSBzaWduYXR1cmUuUGFyYW1ldGVycztcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbWV0ZXJzRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgICAgICAgIF8uZWFjaChwYXJhbWV0ZXJzLCAocGFyYW1ldGVyLCBpKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZpZXcgPSBuZXcgZXhwb3J0cy5TaWduYXR1cmVQYXJhbWV0ZXJWaWV3KCk7XG4gICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0TWVtYmVyKHBhcmFtZXRlcik7XG4gICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0Q3VycmVudChpID09PSBtZW1iZXIuQWN0aXZlUGFyYW1ldGVyKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21tYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29tbWEuaW5uZXJUZXh0ID0gXCIsIFwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyc0VsZW1lbnQuYXBwZW5kQ2hpbGQoY29tbWEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtZXRlcnNFbGVtZW50LmFwcGVuZENoaWxkKHZpZXcpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdC5wdXNoKHZpZXcpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRFbGVtZW50ID0gdGhpcy5fcGFyYW1ldGVycztcbiAgICAgICAgICAgICAgICB0aGlzLl9pbm5lci5pbnNlcnRCZWZvcmUocGFyYW1ldGVyc0VsZW1lbnQsIGN1cnJlbnRFbGVtZW50KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9pbm5lci5yZW1vdmVDaGlsZChjdXJyZW50RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVycyA9IHBhcmFtZXRlcnNFbGVtZW50O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgXy5lYWNoKHNpZ25hdHVyZS5QYXJhbWV0ZXJzLCAocGFyYW0sIGkpID0+IHRoaXMuX3BhcmFtZXRlcnNMaXN0W2ldICYmIHRoaXMuX3BhcmFtZXRlcnNMaXN0W2ldLnNldEN1cnJlbnQoaSA9PT0gbWVtYmVyLkFjdGl2ZVBhcmFtZXRlcikpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY3VycmVudFBhcmFtZXRlciA9IHNpZ25hdHVyZS5QYXJhbWV0ZXJzW21lbWJlci5BY3RpdmVQYXJhbWV0ZXJdO1xuICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFjdXJyZW50UGFyYW1ldGVyKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGxldCBzdW1tYXJ5O1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRQYXJhbWV0ZXIuRG9jdW1lbnRhdGlvbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtRG9jcyA9IHBhcnNlU3RyaW5nKGN1cnJlbnRQYXJhbWV0ZXIuRG9jdW1lbnRhdGlvbik7XG4gICAgICAgICAgICAgICAgaWYgKHBhcmFtRG9jcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzID0gcGFyYW1Eb2NzLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3VtbWFyeVwiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdW1tYXJ5RWxlbWVudCA9IHNbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3VtbWFyeUVsZW1lbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VtbWFyeSA9IF8udHJpbShzdW1tYXJ5RWxlbWVudC5pbm5lckhUTUwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGRvY3MgJiYgIXN1bW1hcnkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzID0gZG9jcy5nZXRFbGVtZW50c0J5VGFnTmFtZShcInBhcmFtXCIpO1xuICAgICAgICAgICAgICAgIGlmIChzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJhbSA9IF8uZmluZChzLCB4ID0+IHguYXR0cmlidXRlc1tcIm5hbWVcIl0gJiYgeC5hdHRyaWJ1dGVzW1wibmFtZVwiXS52YWx1ZSA9PT0gY3VycmVudFBhcmFtZXRlci5OYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5ID0gXy50cmltKHBhcmFtLmlubmVySFRNTCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5fcGFyYW1ldGVyRG9jdW1lbnRhdGlvbi5pbm5lclRleHQgIT09IHN1bW1hcnkpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3VtbWFyeSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9IHN1bW1hcnk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5zdHlsZS5ib3R0b20gPSBgJHt0aGlzLmNsaWVudEhlaWdodCArIHRoaXMuX2VkaXRvckxpbmVIZWlnaHR9cHhgKTtcbiAgICB9XG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgICAgXy5lYWNoKHRoaXMuX3BhcmFtZXRlcnNMaXN0LCBwYXJhbWV0ZXIgPT4gcGFyYW1ldGVyLnJlbW92ZSgpKTtcbiAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0xpc3QgPSBbXTtcbiAgICB9XG59XG5leHBvcnRzLlNpZ25hdHVyZVZpZXcgPSBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtc2lnbmF0dXJlLWhlbHBcIiwgeyBwcm90b3R5cGU6IFNpZ25hdHVyZVZpZXcucHJvdG90eXBlIH0pO1xuZXhwb3J0IGNsYXNzIFNpZ25hdHVyZVBhcmFtZXRlclZpZXcgZXh0ZW5kcyBIVE1MU3BhbkVsZW1lbnQge1xuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9sYWJlbCk7XG4gICAgfVxuICAgIHNldE1lbWJlcihtZW1iZXIpIHtcbiAgICAgICAgdGhpcy5fbWVtYmVyID0gbWVtYmVyO1xuICAgICAgICB0aGlzLl9sYWJlbC5pbm5lclRleHQgPSBtZW1iZXIuTGFiZWw7XG4gICAgfVxuICAgIHNldEN1cnJlbnQoY3VycmVudCkge1xuICAgICAgICBmYXN0ZG9tLm1lYXN1cmUoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFjdXJyZW50ICYmIHRoaXMuc3R5bGUuZm9udFdlaWdodCA9PT0gXCJib2xkXCIpIHtcbiAgICAgICAgICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLnN0eWxlLmZvbnRXZWlnaHQgPSBcIlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGN1cnJlbnQgJiYgdGhpcy5zdHlsZS5mb250V2VpZ2h0ICE9PSBcImJvbGRcIikge1xuICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuc3R5bGUuZm9udFdlaWdodCA9IFwiYm9sZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuZXhwb3J0cy5TaWduYXR1cmVQYXJhbWV0ZXJWaWV3ID0gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwib21uaXNoYXJwLXNpZ25hdHVyZS1wYXJhbWV0ZXJcIiwgeyBwcm90b3R5cGU6IFNpZ25hdHVyZVBhcmFtZXRlclZpZXcucHJvdG90eXBlIH0pO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3R5cGluZ3MuZC50c1wiIC8+XG4vKiB0c2xpbnQ6ZGlzYWJsZTpuby1zdHJpbmctbGl0ZXJhbCAqL1xuaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5sZXQgZmFzdGRvbTogdHlwZW9mIEZhc3Rkb20gPSByZXF1aXJlKFwiZmFzdGRvbVwiKTtcbmltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcblxuY29uc3QgcGFyc2VTdHJpbmcgPSAoZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uKHhtbDogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKHhtbCwgXCJ0ZXh0L3htbFwiKTtcbiAgICB9O1xufSkoKTtcblxuZXhwb3J0IGNsYXNzIFNpZ25hdHVyZVZpZXcgZXh0ZW5kcyBIVE1MRGl2RWxlbWVudCB7IC8qIGltcGxlbWVudHMgV2ViQ29tcG9uZW50ICovXG4gICAgcHJpdmF0ZSBfbWVtYmVyOiBNb2RlbHMuU2lnbmF0dXJlSGVscDtcbiAgICBwcml2YXRlIF9pbm5lcjogSFRNTERpdkVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBfbGFiZWw6IEhUTUxTcGFuRWxlbWVudDtcbiAgICBwcml2YXRlIF9kb2N1bWVudGF0aW9uOiBIVE1MRGl2RWxlbWVudDtcbiAgICBwcml2YXRlIF9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uOiBIVE1MRGl2RWxlbWVudDtcbiAgICBwcml2YXRlIF9hcnJvd3M6IEhUTUxTcGFuRWxlbWVudDtcbiAgICBwcml2YXRlIF9wYXJhbWV0ZXJzTGlzdDogU2lnbmF0dXJlUGFyYW1ldGVyVmlld1tdID0gW107XG4gICAgcHJpdmF0ZSBfcGFyYW1ldGVyczogSFRNTFNwYW5FbGVtZW50O1xuICAgIHByaXZhdGUgX2NvdW50OiBIVE1MU3BhbkVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBfc2VsZWN0ZWRJbmRleDogbnVtYmVyO1xuICAgIHByaXZhdGUgX2xhc3RJbmRleDogbnVtYmVyO1xuICAgIHByaXZhdGUgX2VkaXRvckxpbmVIZWlnaHQ6IG51bWJlcjtcblxuICAgIHB1YmxpYyBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICAgIHRoaXMuX3NlbGVjdGVkSW5kZXggPSAtMTtcbiAgICAgICAgdGhpcy5fbGFzdEluZGV4ID0gLTE7XG4gICAgICAgIHRoaXMuX2VkaXRvckxpbmVIZWlnaHQgPSAwO1xuXG4gICAgICAgIHRoaXMuX2lubmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgdGhpcy5fbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICAgIHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uLnN0eWxlLm1hcmdpbkxlZnQgPSBcIjIuNGVtXCI7XG4gICAgICAgIHRoaXMuX2Fycm93cyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHRoaXMuX2NvdW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0ID0gW107XG5cbiAgICAgICAgdGhpcy5jbGFzc0xpc3QuYWRkKFwidG9vbHRpcFwiKTtcbiAgICAgICAgdGhpcy5faW5uZXIuY2xhc3NMaXN0LmFkZChcInRvb2x0aXAtaW5uZXJcIik7XG5cbiAgICAgICAgdGhpcy5fc2V0dXBBcnJvd3MoKTtcblxuICAgICAgICBsZXQgb3BlbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBvcGVuLmlubmVyVGV4dCA9IFwiKFwiO1xuXG4gICAgICAgIGxldCBjbG9zZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgICBjbG9zZS5pbm5lclRleHQgPSBcIilcIjtcblxuICAgICAgICB0aGlzLmFwcGVuZENoaWxkKHRoaXMuX2lubmVyKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fZG9jdW1lbnRhdGlvbik7XG5cbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQodGhpcy5fYXJyb3dzKTtcblxuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9sYWJlbCk7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKG9wZW4pO1xuICAgICAgICB0aGlzLl9pbm5lci5hcHBlbmRDaGlsZCh0aGlzLl9wYXJhbWV0ZXJzKTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQoY2xvc2UpO1xuXG4gICAgICAgIG9wZW4gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgb3Blbi5pbm5lclRleHQgPSBcIiBbXCI7XG5cbiAgICAgICAgY2xvc2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgY2xvc2UuaW5uZXJUZXh0ID0gXCJdXCI7XG5cbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQob3Blbik7XG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX2NvdW50KTtcbiAgICAgICAgdGhpcy5faW5uZXIuYXBwZW5kQ2hpbGQoY2xvc2UpO1xuXG4gICAgICAgIHRoaXMuX2lubmVyLmFwcGVuZENoaWxkKHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24pO1xuICAgIH1cblxuICAgIHB1YmxpYyBtb3ZlSW5kZXgoZGlyZWN0aW9uOiBudW1iZXIpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9tZW1iZXIpIHJldHVybjtcbiAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCArPSBkaXJlY3Rpb247XG5cbiAgICAgICAgaWYgKHRoaXMuX3NlbGVjdGVkSW5kZXggPCAwKSB7XG4gICAgICAgICAgICB0aGlzLl9zZWxlY3RlZEluZGV4ID0gdGhpcy5fbWVtYmVyLlNpZ25hdHVyZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RlZEluZGV4ID4gdGhpcy5fbWVtYmVyLlNpZ25hdHVyZXMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IDA7XG4gICAgICAgIH1cblxuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLl9jb3VudC5pbm5lclRleHQgPSAodGhpcy5fc2VsZWN0ZWRJbmRleCArIDEpLnRvU3RyaW5nKCkpO1xuICAgICAgICB0aGlzLnVwZGF0ZU1lbWJlcih0aGlzLl9tZW1iZXIpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3NldHVwQXJyb3dzKCkge1xuICAgICAgICBjb25zdCB1cCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgICAgICB1cC5jbGFzc0xpc3QuYWRkKFwiaWNvbi1hcnJvdy11cFwiKTtcbiAgICAgICAgdXAub25jbGljayA9ICgpID0+IHRoaXMubW92ZUluZGV4KC0xKTtcblxuICAgICAgICBjb25zdCBkb3duID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XG4gICAgICAgIGRvd24uY2xhc3NMaXN0LmFkZChcImljb24tYXJyb3ctZG93blwiKTtcbiAgICAgICAgZG93bi5vbmNsaWNrID0gKCkgPT4gdGhpcy5tb3ZlSW5kZXgoMSk7XG5cbiAgICAgICAgdGhpcy5fYXJyb3dzLmFwcGVuZENoaWxkKHVwKTtcbiAgICAgICAgdGhpcy5fYXJyb3dzLmFwcGVuZENoaWxkKGRvd24pO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRMaW5lSGVpZ2h0KGhlaWdodDogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuX2VkaXRvckxpbmVIZWlnaHQgPSBoZWlnaHQ7XG5cbiAgICAgICAgaWYgKHRoaXMuX21lbWJlcilcbiAgICAgICAgICAgIHRoaXMudXBkYXRlTWVtYmVyKHRoaXMuX21lbWJlcik7XG4gICAgfVxuXG4gICAgLy9AX2QobSA9PiBfLmRlYm91bmNlKG0sIDIwMCwgeyBsZWFkaW5nOiB0cnVlLCB0cmFpbGluZzogdHJ1ZSB9KSlcbiAgICBwdWJsaWMgdXBkYXRlTWVtYmVyKG1lbWJlcjogTW9kZWxzLlNpZ25hdHVyZUhlbHApIHtcbiAgICAgICAgdGhpcy5fbWVtYmVyID0gbWVtYmVyO1xuXG4gICAgICAgIGlmICh0aGlzLl9zZWxlY3RlZEluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IG1lbWJlci5BY3RpdmVTaWduYXR1cmU7XG4gICAgICAgICAgICBpZiAobWVtYmVyLkFjdGl2ZVNpZ25hdHVyZSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAvLyBUaGUgc2VydmVyIGJhc2ljYWxseSB0aHJldyB1cCBpdHMgYXJtcyBhbmQgc2FpZCBmdWNrIGl0Li4uXG4gICAgICAgICAgICAgICAgdGhpcy5fc2VsZWN0ZWRJbmRleCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzaWduYXR1cmUgPSBtZW1iZXIuU2lnbmF0dXJlc1t0aGlzLl9zZWxlY3RlZEluZGV4XTtcbiAgICAgICAgaWYgKCFzaWduYXR1cmUpIHJldHVybjtcblxuICAgICAgICBsZXQgZG9jczogRG9jdW1lbnQ7XG4gICAgICAgIGlmIChzaWduYXR1cmUuRG9jdW1lbnRhdGlvbilcbiAgICAgICAgICAgIGRvY3MgPSBwYXJzZVN0cmluZyhzaWduYXR1cmUuRG9jdW1lbnRhdGlvbik7XG5cbiAgICAgICAgaWYgKHRoaXMuX2xhc3RJbmRleCAhPT0gdGhpcy5fc2VsZWN0ZWRJbmRleCkge1xuICAgICAgICAgICAgdGhpcy5fbGFzdEluZGV4ID0gdGhpcy5fc2VsZWN0ZWRJbmRleDtcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9jb3VudC5pbm5lclRleHQgPSAodGhpcy5fc2VsZWN0ZWRJbmRleCArIDEpLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5fbGFiZWwuaW5uZXJUZXh0ID0gc2lnbmF0dXJlLk5hbWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBzaWduYXR1cmUuRG9jdW1lbnRhdGlvbjtcblxuICAgICAgICAgICAgICAgIGlmIChkb2NzICYmIHNpZ25hdHVyZS5Eb2N1bWVudGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHM6IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+ID0gPGFueT5kb2NzLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3VtbWFyeVwiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdW1tYXJ5ID0gXy50cmltKChzWzBdKS5pbm5lckhUTUwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBzdW1tYXJ5O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5pbm5lclRleHQgPSBcIlwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9kb2N1bWVudGF0aW9uLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2RvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZG9jdW1lbnRhdGlvbi5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKG1lbWJlci5TaWduYXR1cmVzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fYXJyb3dzLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2Fycm93cy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlcnNMaXN0ID0gW107XG5cbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbWV0ZXJzID0gc2lnbmF0dXJlLlBhcmFtZXRlcnM7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFyYW1ldGVyc0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgICAgICAgICBfLmVhY2gocGFyYW1ldGVycywgKHBhcmFtZXRlciwgaSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2aWV3OiBTaWduYXR1cmVQYXJhbWV0ZXJWaWV3ID0gPGFueT5uZXcgZXhwb3J0cy5TaWduYXR1cmVQYXJhbWV0ZXJWaWV3KCk7XG4gICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0TWVtYmVyKHBhcmFtZXRlcik7XG4gICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0Q3VycmVudChpID09PSBtZW1iZXIuQWN0aXZlUGFyYW1ldGVyKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbW1hID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tYS5pbm5lclRleHQgPSBcIiwgXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzRWxlbWVudC5hcHBlbmRDaGlsZChjb21tYSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzRWxlbWVudC5hcHBlbmRDaGlsZCh2aWV3KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0xpc3QucHVzaCh2aWV3KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRFbGVtZW50ID0gdGhpcy5fcGFyYW1ldGVycztcbiAgICAgICAgICAgICAgICB0aGlzLl9pbm5lci5pbnNlcnRCZWZvcmUocGFyYW1ldGVyc0VsZW1lbnQsIGN1cnJlbnRFbGVtZW50KTtcbiAgICAgICAgICAgICAgICB0aGlzLl9pbm5lci5yZW1vdmVDaGlsZChjdXJyZW50RWxlbWVudCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzID0gcGFyYW1ldGVyc0VsZW1lbnQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHtcbiAgICAgICAgICAgICAgICBfLmVhY2goc2lnbmF0dXJlLlBhcmFtZXRlcnMsIChwYXJhbSwgaSkgPT5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcGFyYW1ldGVyc0xpc3RbaV0gJiYgdGhpcy5fcGFyYW1ldGVyc0xpc3RbaV0uc2V0Q3VycmVudChpID09PSBtZW1iZXIuQWN0aXZlUGFyYW1ldGVyKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRQYXJhbWV0ZXIgPSBzaWduYXR1cmUuUGFyYW1ldGVyc1ttZW1iZXIuQWN0aXZlUGFyYW1ldGVyXTtcbiAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcbiAgICAgICAgICAgIGlmICghY3VycmVudFBhcmFtZXRlcikgcmV0dXJuO1xuICAgICAgICAgICAgbGV0IHN1bW1hcnk6IHN0cmluZztcbiAgICAgICAgICAgIGlmIChjdXJyZW50UGFyYW1ldGVyLkRvY3VtZW50YXRpb24pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbURvY3MgPSBwYXJzZVN0cmluZyhjdXJyZW50UGFyYW1ldGVyLkRvY3VtZW50YXRpb24pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHBhcmFtRG9jcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzOiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PiA9IDxhbnk+cGFyYW1Eb2NzLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwic3VtbWFyeVwiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzdW1tYXJ5RWxlbWVudCA9IHNbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc3VtbWFyeUVsZW1lbnQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VtbWFyeSA9IF8udHJpbShzdW1tYXJ5RWxlbWVudC5pbm5lckhUTUwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZG9jcyAmJiAhc3VtbWFyeSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHM6IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+ID0gPGFueT5kb2NzLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwicGFyYW1cIik7XG4gICAgICAgICAgICAgICAgaWYgKHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtID0gPEhUTUxFbGVtZW50Pl8uZmluZChzLCB4ID0+IHguYXR0cmlidXRlc1tcIm5hbWVcIl0gJiYgeC5hdHRyaWJ1dGVzW1wibmFtZVwiXS52YWx1ZSA9PT0gY3VycmVudFBhcmFtZXRlci5OYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHBhcmFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5ID0gXy50cmltKHBhcmFtLmlubmVySFRNTCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uLmlubmVyVGV4dCAhPT0gc3VtbWFyeSkge1xuICAgICAgICAgICAgICAgIGlmIChzdW1tYXJ5KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3BhcmFtZXRlckRvY3VtZW50YXRpb24uaW5uZXJUZXh0ID0gc3VtbWFyeTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9wYXJhbWV0ZXJEb2N1bWVudGF0aW9uLmlubmVyVGV4dCA9IFwiXCI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBmYXN0ZG9tLm11dGF0ZSgoKSA9PiB0aGlzLnN0eWxlLmJvdHRvbSA9IGAke3RoaXMuY2xpZW50SGVpZ2h0ICsgdGhpcy5fZWRpdG9yTGluZUhlaWdodH1weGApO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZXRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgICBfLmVhY2godGhpcy5fcGFyYW1ldGVyc0xpc3QsIHBhcmFtZXRlciA9PiBwYXJhbWV0ZXIucmVtb3ZlKCkpO1xuICAgICAgICB0aGlzLl9wYXJhbWV0ZXJzTGlzdCA9IFtdO1xuICAgIH1cbn1cblxuKDxhbnk+ZXhwb3J0cykuU2lnbmF0dXJlVmlldyA9ICg8YW55PmRvY3VtZW50KS5yZWdpc3RlckVsZW1lbnQoXCJvbW5pc2hhcnAtc2lnbmF0dXJlLWhlbHBcIiwgeyBwcm90b3R5cGU6IFNpZ25hdHVyZVZpZXcucHJvdG90eXBlIH0pO1xuXG5leHBvcnQgY2xhc3MgU2lnbmF0dXJlUGFyYW1ldGVyVmlldyBleHRlbmRzIEhUTUxTcGFuRWxlbWVudCB7IC8qIGltcGxlbWVudHMgV2ViQ29tcG9uZW50ICovXG4gICAgcHJpdmF0ZSBfbWVtYmVyOiBNb2RlbHMuU2lnbmF0dXJlSGVscFBhcmFtZXRlcjtcbiAgICBwcml2YXRlIF9sYWJlbDogSFRNTFNwYW5FbGVtZW50O1xuXG4gICAgcHVibGljIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgICAgdGhpcy5fbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgICAgdGhpcy5hcHBlbmRDaGlsZCh0aGlzLl9sYWJlbCk7XG4gICAgfVxuXG4gICAgcHVibGljIHNldE1lbWJlcihtZW1iZXI6IE1vZGVscy5TaWduYXR1cmVIZWxwUGFyYW1ldGVyKSB7XG4gICAgICAgIHRoaXMuX21lbWJlciA9IG1lbWJlcjtcbiAgICAgICAgdGhpcy5fbGFiZWwuaW5uZXJUZXh0ID0gbWVtYmVyLkxhYmVsO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRDdXJyZW50KGN1cnJlbnQ6IGJvb2xlYW4pIHtcbiAgICAgICAgZmFzdGRvbS5tZWFzdXJlKCgpID0+IHtcbiAgICAgICAgICAgIGlmICghY3VycmVudCAmJiB0aGlzLnN0eWxlLmZvbnRXZWlnaHQgPT09IFwiYm9sZFwiKSB7XG4gICAgICAgICAgICAgICAgZmFzdGRvbS5tdXRhdGUoKCkgPT4gdGhpcy5zdHlsZS5mb250V2VpZ2h0ID0gXCJcIik7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGN1cnJlbnQgJiYgdGhpcy5zdHlsZS5mb250V2VpZ2h0ICE9PSBcImJvbGRcIikge1xuICAgICAgICAgICAgICAgIGZhc3Rkb20ubXV0YXRlKCgpID0+IHRoaXMuc3R5bGUuZm9udFdlaWdodCA9IFwiYm9sZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG4oPGFueT5leHBvcnRzKS5TaWduYXR1cmVQYXJhbWV0ZXJWaWV3ID0gKDxhbnk+ZG9jdW1lbnQpLnJlZ2lzdGVyRWxlbWVudChcIm9tbmlzaGFycC1zaWduYXR1cmUtcGFyYW1ldGVyXCIsIHsgcHJvdG90eXBlOiBTaWduYXR1cmVQYXJhbWV0ZXJWaWV3LnByb3RvdHlwZSB9KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

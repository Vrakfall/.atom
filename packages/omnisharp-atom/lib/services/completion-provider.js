"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omni = require("../server/omni");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _omnisharpClient = require("omnisharp-client");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var filter = require("fuzzaldrin").filter;
function calcuateMovement(previous, current) {
    if (!current) return { reset: true, current: current, previous: null };
    var row = Math.abs(current.bufferPosition.row - previous.bufferPosition.row) > 0;
    var column = Math.abs(current.bufferPosition.column - previous.bufferPosition.column) > 3;
    return { reset: row || column || false, previous: previous, current: current };
}
var autoCompleteOptions = {
    WordToComplete: "",
    WantDocumentationForEveryCompletionResult: false,
    WantKind: true,
    WantSnippet: true,
    WantReturnType: true
};
function renderReturnType(returnType) {
    if (returnType === null) {
        return;
    }
    return "Returns: " + returnType;
}
function renderIcon(item) {
    return "<img height=\"16px\" width=\"16px\" src=\"atom://omnisharp-atom/styles/icons/autocomplete_" + item.Kind.toLowerCase() + "@3x.png\" />";
}

var CompletionProvider = function () {
    function CompletionProvider() {
        _classCallCheck(this, CompletionProvider);

        this._initialized = false;
        this.selector = ".source.omnisharp";
        this.disableForSelector = ".source.omnisharp .comment";
        this.inclusionPriority = 1;
        this.suggestionPriority = 10;
        this.excludeLowerPriority = false;
    }

    _createClass(CompletionProvider, [{
        key: "getSuggestions",
        value: function getSuggestions(options) {
            var _this = this;

            if (!this._initialized) this._setupSubscriptions();
            if (this.results && this.previous && calcuateMovement(this.previous, options).reset) {
                this.results = null;
            }
            if (this.results && options.prefix === "." || options.prefix && !_lodash2.default.trim(options.prefix) || !options.prefix || options.activatedManually) {
                this.results = null;
            }
            this.previous = options;
            var buffer = options.editor.getBuffer();
            var end = options.bufferPosition.column;
            var data = buffer.getLines()[options.bufferPosition.row].substring(0, end + 1);
            var lastCharacterTyped = data[end - 1];
            if (!/[A-Z_0-9.]+/i.test(lastCharacterTyped)) {
                return;
            }
            var search = options.prefix;
            if (search === ".") search = "";
            if (!this.results) this.results = _omni.Omni.request(function (solution) {
                return solution.autocomplete(_lodash2.default.clone(autoCompleteOptions));
            }).toPromise();
            var p = this.results;
            if (search) p = p.then(function (s) {
                return filter(s, search, { key: "CompletionText" });
            });
            return p.then(function (response) {
                return response.map(function (s) {
                    return _this._makeSuggestion(s);
                });
            });
        }
    }, {
        key: "onDidInsertSuggestion",
        value: function onDidInsertSuggestion(editor, triggerPosition, suggestion) {
            this.results = null;
        }
    }, {
        key: "dispose",
        value: function dispose() {
            if (this._disposable) this._disposable.dispose();
            this._disposable = null;
            this._initialized = false;
        }
    }, {
        key: "_setupSubscriptions",
        value: function _setupSubscriptions() {
            var _this2 = this;

            if (this._initialized) return;
            var disposable = this._disposable = new _omnisharpClient.CompositeDisposable();
            disposable.add(atom.commands.onWillDispatch(function (event) {
                if (event.type === "autocomplete-plus:activate" || event.type === "autocomplete-plus:confirm" || event.type === "autocomplete-plus:cancel") {
                    _this2.results = null;
                }
            }));
            disposable.add(atom.config.observe("omnisharp-atom.useIcons", function (value) {
                _this2._useIcons = value;
            }));
            disposable.add(atom.config.observe("omnisharp-atom.useLeftLabelColumnForSuggestions", function (value) {
                _this2._useLeftLabelColumnForSuggestions = value;
            }));
            this._initialized = true;
        }
    }, {
        key: "_makeSuggestion",
        value: function _makeSuggestion(item) {
            var description = void 0,
                leftLabel = void 0,
                iconHTML = void 0,
                type = void 0;
            if (this._useLeftLabelColumnForSuggestions === true) {
                description = item.RequiredNamespaceImport;
                leftLabel = item.ReturnType;
            } else {
                description = renderReturnType(item.ReturnType);
                leftLabel = "";
            }
            if (this._useIcons === true) {
                iconHTML = renderIcon(item);
                type = item.Kind;
            } else {
                iconHTML = null;
                type = item.Kind.toLowerCase();
            }
            return {
                _search: item.CompletionText,
                snippet: item.Snippet,
                type: type,
                iconHTML: iconHTML,
                displayText: item.DisplayText,
                className: "autocomplete-omnisharp-atom",
                description: description,
                leftLabel: leftLabel
            };
        }
    }]);

    return CompletionProvider;
}();

module.exports = [new CompletionProvider()];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9jb21wbGV0aW9uLXByb3ZpZGVyLmpzIiwibGliL3NlcnZpY2VzL2NvbXBsZXRpb24tcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBOztBQUNBOzs7O0FBQ0E7Ozs7OztBQ0VBLElBQU0sU0FBUyxRQUFRLFlBQVIsRUFBc0IsTUFBckM7QUEyQkEsU0FBQSxnQkFBQSxDQUEwQixRQUExQixFQUFvRCxPQUFwRCxFQUEyRTtBQUN2RSxRQUFJLENBQUMsT0FBTCxFQUFjLE9BQU8sRUFBRSxPQUFPLElBQVQsRUFBZSxTQUFTLE9BQXhCLEVBQWlDLFVBQVUsSUFBM0MsRUFBUDtBQUdkLFFBQU0sTUFBTSxLQUFLLEdBQUwsQ0FBUyxRQUFRLGNBQVIsQ0FBdUIsR0FBdkIsR0FBNkIsU0FBUyxjQUFULENBQXdCLEdBQTlELElBQXFFLENBQWpGO0FBRUEsUUFBTSxTQUFTLEtBQUssR0FBTCxDQUFTLFFBQVEsY0FBUixDQUF1QixNQUF2QixHQUFnQyxTQUFTLGNBQVQsQ0FBd0IsTUFBakUsSUFBMkUsQ0FBMUY7QUFDQSxXQUFPLEVBQUUsT0FBTyxPQUFPLE1BQVAsSUFBaUIsS0FBMUIsRUFBaUMsVUFBVSxRQUEzQyxFQUFxRCxTQUFTLE9BQTlELEVBQVA7QUFDSDtBQUVELElBQU0sc0JBQWtEO0FBQ3BELG9CQUFnQixFQURvQztBQUVwRCwrQ0FBMkMsS0FGUztBQUdwRCxjQUFVLElBSDBDO0FBSXBELGlCQUFhLElBSnVDO0FBS3BELG9CQUFnQjtBQUxvQyxDQUF4RDtBQVFBLFNBQUEsZ0JBQUEsQ0FBMEIsVUFBMUIsRUFBNEM7QUFDeEMsUUFBSSxlQUFlLElBQW5CLEVBQXlCO0FBQ3JCO0FBQ0g7QUFDRCx5QkFBbUIsVUFBbkI7QUFDSDtBQUVELFNBQUEsVUFBQSxDQUFvQixJQUFwQixFQUFxRDtBQUVqRCwwR0FBK0YsS0FBSyxJQUFMLENBQVUsV0FBVixFQUEvRjtBQUNIOztJQUVELGtCO0FBQUEsa0NBQUE7QUFB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IjoibGliL3NlcnZpY2VzL2NvbXBsZXRpb24tcHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmNvbnN0IGZpbHRlciA9IHJlcXVpcmUoXCJmdXp6YWxkcmluXCIpLmZpbHRlcjtcbmZ1bmN0aW9uIGNhbGN1YXRlTW92ZW1lbnQocHJldmlvdXMsIGN1cnJlbnQpIHtcbiAgICBpZiAoIWN1cnJlbnQpXG4gICAgICAgIHJldHVybiB7IHJlc2V0OiB0cnVlLCBjdXJyZW50OiBjdXJyZW50LCBwcmV2aW91czogbnVsbCB9O1xuICAgIGNvbnN0IHJvdyA9IE1hdGguYWJzKGN1cnJlbnQuYnVmZmVyUG9zaXRpb24ucm93IC0gcHJldmlvdXMuYnVmZmVyUG9zaXRpb24ucm93KSA+IDA7XG4gICAgY29uc3QgY29sdW1uID0gTWF0aC5hYnMoY3VycmVudC5idWZmZXJQb3NpdGlvbi5jb2x1bW4gLSBwcmV2aW91cy5idWZmZXJQb3NpdGlvbi5jb2x1bW4pID4gMztcbiAgICByZXR1cm4geyByZXNldDogcm93IHx8IGNvbHVtbiB8fCBmYWxzZSwgcHJldmlvdXM6IHByZXZpb3VzLCBjdXJyZW50OiBjdXJyZW50IH07XG59XG5jb25zdCBhdXRvQ29tcGxldGVPcHRpb25zID0ge1xuICAgIFdvcmRUb0NvbXBsZXRlOiBcIlwiLFxuICAgIFdhbnREb2N1bWVudGF0aW9uRm9yRXZlcnlDb21wbGV0aW9uUmVzdWx0OiBmYWxzZSxcbiAgICBXYW50S2luZDogdHJ1ZSxcbiAgICBXYW50U25pcHBldDogdHJ1ZSxcbiAgICBXYW50UmV0dXJuVHlwZTogdHJ1ZVxufTtcbmZ1bmN0aW9uIHJlbmRlclJldHVyblR5cGUocmV0dXJuVHlwZSkge1xuICAgIGlmIChyZXR1cm5UeXBlID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIGBSZXR1cm5zOiAke3JldHVyblR5cGV9YDtcbn1cbmZ1bmN0aW9uIHJlbmRlckljb24oaXRlbSkge1xuICAgIHJldHVybiBgPGltZyBoZWlnaHQ9XCIxNnB4XCIgd2lkdGg9XCIxNnB4XCIgc3JjPVwiYXRvbTovL29tbmlzaGFycC1hdG9tL3N0eWxlcy9pY29ucy9hdXRvY29tcGxldGVfJHtpdGVtLktpbmQudG9Mb3dlckNhc2UoKX1AM3gucG5nXCIgLz5gO1xufVxuY2xhc3MgQ29tcGxldGlvblByb3ZpZGVyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5zZWxlY3RvciA9IFwiLnNvdXJjZS5vbW5pc2hhcnBcIjtcbiAgICAgICAgdGhpcy5kaXNhYmxlRm9yU2VsZWN0b3IgPSBcIi5zb3VyY2Uub21uaXNoYXJwIC5jb21tZW50XCI7XG4gICAgICAgIHRoaXMuaW5jbHVzaW9uUHJpb3JpdHkgPSAxO1xuICAgICAgICB0aGlzLnN1Z2dlc3Rpb25Qcmlvcml0eSA9IDEwO1xuICAgICAgICB0aGlzLmV4Y2x1ZGVMb3dlclByaW9yaXR5ID0gZmFsc2U7XG4gICAgfVxuICAgIGdldFN1Z2dlc3Rpb25zKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pbml0aWFsaXplZClcbiAgICAgICAgICAgIHRoaXMuX3NldHVwU3Vic2NyaXB0aW9ucygpO1xuICAgICAgICBpZiAodGhpcy5yZXN1bHRzICYmIHRoaXMucHJldmlvdXMgJiYgY2FsY3VhdGVNb3ZlbWVudCh0aGlzLnByZXZpb3VzLCBvcHRpb25zKS5yZXNldCkge1xuICAgICAgICAgICAgdGhpcy5yZXN1bHRzID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5yZXN1bHRzICYmIG9wdGlvbnMucHJlZml4ID09PSBcIi5cIiB8fCAob3B0aW9ucy5wcmVmaXggJiYgIV8udHJpbShvcHRpb25zLnByZWZpeCkpIHx8ICFvcHRpb25zLnByZWZpeCB8fCBvcHRpb25zLmFjdGl2YXRlZE1hbnVhbGx5KSB7XG4gICAgICAgICAgICB0aGlzLnJlc3VsdHMgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucHJldmlvdXMgPSBvcHRpb25zO1xuICAgICAgICBjb25zdCBidWZmZXIgPSBvcHRpb25zLmVkaXRvci5nZXRCdWZmZXIoKTtcbiAgICAgICAgY29uc3QgZW5kID0gb3B0aW9ucy5idWZmZXJQb3NpdGlvbi5jb2x1bW47XG4gICAgICAgIGNvbnN0IGRhdGEgPSBidWZmZXIuZ2V0TGluZXMoKVtvcHRpb25zLmJ1ZmZlclBvc2l0aW9uLnJvd10uc3Vic3RyaW5nKDAsIGVuZCArIDEpO1xuICAgICAgICBjb25zdCBsYXN0Q2hhcmFjdGVyVHlwZWQgPSBkYXRhW2VuZCAtIDFdO1xuICAgICAgICBpZiAoIS9bQS1aXzAtOS5dKy9pLnRlc3QobGFzdENoYXJhY3RlclR5cGVkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCBzZWFyY2ggPSBvcHRpb25zLnByZWZpeDtcbiAgICAgICAgaWYgKHNlYXJjaCA9PT0gXCIuXCIpXG4gICAgICAgICAgICBzZWFyY2ggPSBcIlwiO1xuICAgICAgICBpZiAoIXRoaXMucmVzdWx0cylcbiAgICAgICAgICAgIHRoaXMucmVzdWx0cyA9IE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5hdXRvY29tcGxldGUoXy5jbG9uZShhdXRvQ29tcGxldGVPcHRpb25zKSkpLnRvUHJvbWlzZSgpO1xuICAgICAgICBsZXQgcCA9IHRoaXMucmVzdWx0cztcbiAgICAgICAgaWYgKHNlYXJjaClcbiAgICAgICAgICAgIHAgPSBwLnRoZW4ocyA9PiBmaWx0ZXIocywgc2VhcmNoLCB7IGtleTogXCJDb21wbGV0aW9uVGV4dFwiIH0pKTtcbiAgICAgICAgcmV0dXJuIHAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5tYXAocyA9PiB0aGlzLl9tYWtlU3VnZ2VzdGlvbihzKSkpO1xuICAgIH1cbiAgICBvbkRpZEluc2VydFN1Z2dlc3Rpb24oZWRpdG9yLCB0cmlnZ2VyUG9zaXRpb24sIHN1Z2dlc3Rpb24pIHtcbiAgICAgICAgdGhpcy5yZXN1bHRzID0gbnVsbDtcbiAgICB9XG4gICAgZGlzcG9zZSgpIHtcbiAgICAgICAgaWYgKHRoaXMuX2Rpc3Bvc2FibGUpXG4gICAgICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZSA9IG51bGw7XG4gICAgICAgIHRoaXMuX2luaXRpYWxpemVkID0gZmFsc2U7XG4gICAgfVxuICAgIF9zZXR1cFN1YnNjcmlwdGlvbnMoKSB7XG4gICAgICAgIGlmICh0aGlzLl9pbml0aWFsaXplZClcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChhdG9tLmNvbW1hbmRzLm9uV2lsbERpc3BhdGNoKChldmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnR5cGUgPT09IFwiYXV0b2NvbXBsZXRlLXBsdXM6YWN0aXZhdGVcIiB8fCBldmVudC50eXBlID09PSBcImF1dG9jb21wbGV0ZS1wbHVzOmNvbmZpcm1cIiB8fCBldmVudC50eXBlID09PSBcImF1dG9jb21wbGV0ZS1wbHVzOmNhbmNlbFwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXN1bHRzID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgICAgICBkaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20udXNlSWNvbnNcIiwgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl91c2VJY29ucyA9IHZhbHVlO1xuICAgICAgICB9KSk7XG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS51c2VMZWZ0TGFiZWxDb2x1bW5Gb3JTdWdnZXN0aW9uc1wiLCAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3VzZUxlZnRMYWJlbENvbHVtbkZvclN1Z2dlc3Rpb25zID0gdmFsdWU7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cbiAgICBfbWFrZVN1Z2dlc3Rpb24oaXRlbSkge1xuICAgICAgICBsZXQgZGVzY3JpcHRpb24sIGxlZnRMYWJlbCwgaWNvbkhUTUwsIHR5cGU7XG4gICAgICAgIGlmICh0aGlzLl91c2VMZWZ0TGFiZWxDb2x1bW5Gb3JTdWdnZXN0aW9ucyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgZGVzY3JpcHRpb24gPSBpdGVtLlJlcXVpcmVkTmFtZXNwYWNlSW1wb3J0O1xuICAgICAgICAgICAgbGVmdExhYmVsID0gaXRlbS5SZXR1cm5UeXBlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGVzY3JpcHRpb24gPSByZW5kZXJSZXR1cm5UeXBlKGl0ZW0uUmV0dXJuVHlwZSk7XG4gICAgICAgICAgICBsZWZ0TGFiZWwgPSBcIlwiO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl91c2VJY29ucyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgaWNvbkhUTUwgPSByZW5kZXJJY29uKGl0ZW0pO1xuICAgICAgICAgICAgdHlwZSA9IGl0ZW0uS2luZDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGljb25IVE1MID0gbnVsbDtcbiAgICAgICAgICAgIHR5cGUgPSBpdGVtLktpbmQudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgX3NlYXJjaDogaXRlbS5Db21wbGV0aW9uVGV4dCxcbiAgICAgICAgICAgIHNuaXBwZXQ6IGl0ZW0uU25pcHBldCxcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICBpY29uSFRNTDogaWNvbkhUTUwsXG4gICAgICAgICAgICBkaXNwbGF5VGV4dDogaXRlbS5EaXNwbGF5VGV4dCxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogXCJhdXRvY29tcGxldGUtb21uaXNoYXJwLWF0b21cIixcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvbixcbiAgICAgICAgICAgIGxlZnRMYWJlbDogbGVmdExhYmVsLFxuICAgICAgICB9O1xuICAgIH1cbn1cbm1vZHVsZS5leHBvcnRzID0gW25ldyBDb21wbGV0aW9uUHJvdmlkZXIoKV07XG4iLCJpbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGUsIElEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuY29uc3QgZmlsdGVyID0gcmVxdWlyZShcImZ1enphbGRyaW5cIikuZmlsdGVyO1xuXG5pbnRlcmZhY2UgUmVxdWVzdE9wdGlvbnMge1xuICAgIGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yO1xuICAgIGJ1ZmZlclBvc2l0aW9uOiBUZXh0QnVmZmVyLlBvaW50OyAvLyB0aGUgcG9zaXRpb24gb2YgdGhlIGN1cnNvclxuICAgIHByZWZpeDogc3RyaW5nO1xuICAgIHNjb3BlRGVzY3JpcHRvcjogeyBzY29wZXM6IHN0cmluZ1tdIH07XG4gICAgYWN0aXZhdGVkTWFudWFsbHk6IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBTdWdnZXN0aW9uIHtcbiAgICAvL0VpdGhlciB0ZXh0IG9yIHNuaXBwZXQgaXMgcmVxdWlyZWRcbiAgICB0ZXh0Pzogc3RyaW5nO1xuICAgIHNuaXBwZXQ/OiBzdHJpbmc7XG4gICAgZGlzcGxheVRleHQ/OiBzdHJpbmc7XG4gICAgcmVwbGFjZW1lbnRQcmVmaXg/OiBzdHJpbmc7XG4gICAgdHlwZTogc3RyaW5nO1xuICAgIGxlZnRMYWJlbD86IHN0cmluZztcbiAgICBsZWZ0TGFiZWxIVE1MPzogc3RyaW5nO1xuICAgIHJpZ2h0TGFiZWw/OiBzdHJpbmc7XG4gICAgcmlnaHRMYWJlbEhUTUw/OiBzdHJpbmc7XG4gICAgaWNvbkhUTUw/OiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb25Nb3JlVVJMPzogc3RyaW5nO1xuICAgIGNsYXNzTmFtZT86IHN0cmluZztcbn1cblxuZnVuY3Rpb24gY2FsY3VhdGVNb3ZlbWVudChwcmV2aW91czogUmVxdWVzdE9wdGlvbnMsIGN1cnJlbnQ6IFJlcXVlc3RPcHRpb25zKSB7XG4gICAgaWYgKCFjdXJyZW50KSByZXR1cm4geyByZXNldDogdHJ1ZSwgY3VycmVudDogY3VycmVudCwgcHJldmlvdXM6IG51bGwgfTtcbiAgICAvLyBJZiB0aGUgcm93IGNoYW5nZXMgd2UgbW92ZWQgbGluZXMsIHdlIHNob3VsZCByZWZldGNoIHRoZSBjb21wbGV0aW9uc1xuICAgIC8vIChJcyBpdCBwb3NzaWJsZSBpdCB3aWxsIGJlIHRoZSBzYW1lIHNldD8pXG4gICAgY29uc3Qgcm93ID0gTWF0aC5hYnMoY3VycmVudC5idWZmZXJQb3NpdGlvbi5yb3cgLSBwcmV2aW91cy5idWZmZXJQb3NpdGlvbi5yb3cpID4gMDtcbiAgICAvLyBJZiB0aGUgY29sdW1uIGp1bXBlZCwgbGV0cyBnZXQgdGhlbSBhZ2FpbiB0byBiZSBzYWZlLlxuICAgIGNvbnN0IGNvbHVtbiA9IE1hdGguYWJzKGN1cnJlbnQuYnVmZmVyUG9zaXRpb24uY29sdW1uIC0gcHJldmlvdXMuYnVmZmVyUG9zaXRpb24uY29sdW1uKSA+IDM7XG4gICAgcmV0dXJuIHsgcmVzZXQ6IHJvdyB8fCBjb2x1bW4gfHwgZmFsc2UsIHByZXZpb3VzOiBwcmV2aW91cywgY3VycmVudDogY3VycmVudCB9O1xufVxuXG5jb25zdCBhdXRvQ29tcGxldGVPcHRpb25zID0gPE1vZGVscy5BdXRvQ29tcGxldGVSZXF1ZXN0PntcbiAgICBXb3JkVG9Db21wbGV0ZTogXCJcIixcbiAgICBXYW50RG9jdW1lbnRhdGlvbkZvckV2ZXJ5Q29tcGxldGlvblJlc3VsdDogZmFsc2UsXG4gICAgV2FudEtpbmQ6IHRydWUsXG4gICAgV2FudFNuaXBwZXQ6IHRydWUsXG4gICAgV2FudFJldHVyblR5cGU6IHRydWVcbn07XG5cbmZ1bmN0aW9uIHJlbmRlclJldHVyblR5cGUocmV0dXJuVHlwZTogc3RyaW5nKSB7XG4gICAgaWYgKHJldHVyblR5cGUgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gYFJldHVybnM6ICR7cmV0dXJuVHlwZX1gO1xufVxuXG5mdW5jdGlvbiByZW5kZXJJY29uKGl0ZW06IE1vZGVscy5BdXRvQ29tcGxldGVSZXNwb25zZSkge1xuICAgIC8vIHRvZG86IG1vdmUgYWRkaXRpb25hbCBzdHlsaW5nIHRvIGNzc1xuICAgIHJldHVybiBgPGltZyBoZWlnaHQ9XCIxNnB4XCIgd2lkdGg9XCIxNnB4XCIgc3JjPVwiYXRvbTovL29tbmlzaGFycC1hdG9tL3N0eWxlcy9pY29ucy9hdXRvY29tcGxldGVfJHtpdGVtLktpbmQudG9Mb3dlckNhc2UoKX1AM3gucG5nXCIgLz5gO1xufVxuXG5jbGFzcyBDb21wbGV0aW9uUHJvdmlkZXIgaW1wbGVtZW50cyBJRGlzcG9zYWJsZSB7XG4gICAgcHJpdmF0ZSBfZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZTtcblxuICAgIHByaXZhdGUgX2luaXRpYWxpemVkID0gZmFsc2U7XG5cbiAgICBwcml2YXRlIF91c2VJY29uczogYm9vbGVhbjtcbiAgICBwcml2YXRlIF91c2VMZWZ0TGFiZWxDb2x1bW5Gb3JTdWdnZXN0aW9uczogYm9vbGVhbjtcblxuICAgIHByaXZhdGUgcHJldmlvdXM6IFJlcXVlc3RPcHRpb25zO1xuICAgIHByaXZhdGUgcmVzdWx0czogUHJvbWlzZTxNb2RlbHMuQXV0b0NvbXBsZXRlUmVzcG9uc2VbXT47XG5cbiAgICBwdWJsaWMgc2VsZWN0b3IgPSBcIi5zb3VyY2Uub21uaXNoYXJwXCI7XG4gICAgcHVibGljIGRpc2FibGVGb3JTZWxlY3RvciA9IFwiLnNvdXJjZS5vbW5pc2hhcnAgLmNvbW1lbnRcIjtcbiAgICBwdWJsaWMgaW5jbHVzaW9uUHJpb3JpdHkgPSAxO1xuICAgIHB1YmxpYyBzdWdnZXN0aW9uUHJpb3JpdHkgPSAxMDtcbiAgICBwdWJsaWMgZXhjbHVkZUxvd2VyUHJpb3JpdHkgPSBmYWxzZTtcblxuICAgIHB1YmxpYyBnZXRTdWdnZXN0aW9ucyhvcHRpb25zOiBSZXF1ZXN0T3B0aW9ucyk6IFByb21pc2U8U3VnZ2VzdGlvbltdPiB7XG4gICAgICAgIGlmICghdGhpcy5faW5pdGlhbGl6ZWQpIHRoaXMuX3NldHVwU3Vic2NyaXB0aW9ucygpO1xuXG4gICAgICAgIGlmICh0aGlzLnJlc3VsdHMgJiYgdGhpcy5wcmV2aW91cyAmJiBjYWxjdWF0ZU1vdmVtZW50KHRoaXMucHJldmlvdXMsIG9wdGlvbnMpLnJlc2V0KSB7XG4gICAgICAgICAgICB0aGlzLnJlc3VsdHMgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMucmVzdWx0cyAmJiBvcHRpb25zLnByZWZpeCA9PT0gXCIuXCIgfHwgKG9wdGlvbnMucHJlZml4ICYmICFfLnRyaW0ob3B0aW9ucy5wcmVmaXgpKSB8fCAhb3B0aW9ucy5wcmVmaXggfHwgb3B0aW9ucy5hY3RpdmF0ZWRNYW51YWxseSkge1xuICAgICAgICAgICAgdGhpcy5yZXN1bHRzID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucHJldmlvdXMgPSBvcHRpb25zO1xuXG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IG9wdGlvbnMuZWRpdG9yLmdldEJ1ZmZlcigpO1xuICAgICAgICBjb25zdCBlbmQgPSBvcHRpb25zLmJ1ZmZlclBvc2l0aW9uLmNvbHVtbjtcblxuICAgICAgICBjb25zdCBkYXRhID0gYnVmZmVyLmdldExpbmVzKClbb3B0aW9ucy5idWZmZXJQb3NpdGlvbi5yb3ddLnN1YnN0cmluZygwLCBlbmQgKyAxKTtcbiAgICAgICAgY29uc3QgbGFzdENoYXJhY3RlclR5cGVkID0gZGF0YVtlbmQgLSAxXTtcblxuICAgICAgICBpZiAoIS9bQS1aXzAtOS5dKy9pLnRlc3QobGFzdENoYXJhY3RlclR5cGVkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHNlYXJjaCA9IG9wdGlvbnMucHJlZml4O1xuICAgICAgICBpZiAoc2VhcmNoID09PSBcIi5cIilcbiAgICAgICAgICAgIHNlYXJjaCA9IFwiXCI7XG5cbiAgICAgICAgaWYgKCF0aGlzLnJlc3VsdHMpIHRoaXMucmVzdWx0cyA9IE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5hdXRvY29tcGxldGUoXy5jbG9uZShhdXRvQ29tcGxldGVPcHRpb25zKSkpLnRvUHJvbWlzZSgpO1xuXG4gICAgICAgIGxldCBwID0gdGhpcy5yZXN1bHRzO1xuICAgICAgICBpZiAoc2VhcmNoKVxuICAgICAgICAgICAgcCA9IHAudGhlbihzID0+IGZpbHRlcihzLCBzZWFyY2gsIHsga2V5OiBcIkNvbXBsZXRpb25UZXh0XCIgfSkpO1xuXG4gICAgICAgIHJldHVybiBwLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UubWFwKHMgPT4gdGhpcy5fbWFrZVN1Z2dlc3Rpb24ocykpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgb25EaWRJbnNlcnRTdWdnZXN0aW9uKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCB0cmlnZ2VyUG9zaXRpb246IFRleHRCdWZmZXIuUG9pbnQsIHN1Z2dlc3Rpb246IGFueSkge1xuICAgICAgICB0aGlzLnJlc3VsdHMgPSBudWxsO1xuICAgIH1cblxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xuICAgICAgICBpZiAodGhpcy5fZGlzcG9zYWJsZSlcbiAgICAgICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuZGlzcG9zZSgpO1xuXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSBudWxsO1xuICAgICAgICB0aGlzLl9pbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3NldHVwU3Vic2NyaXB0aW9ucygpIHtcbiAgICAgICAgaWYgKHRoaXMuX2luaXRpYWxpemVkKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IHRoaXMuX2Rpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gICAgICAgIC8vIENsZWFyIHdoZW4gYXV0by1jb21wbGV0ZSBpcyBvcGVuaW5nLlxuICAgICAgICAvLyBUT0RPOiBVcGRhdGUgYXRvbSB0eXBpbmdzXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGF0b20uY29tbWFuZHMub25XaWxsRGlzcGF0Y2goKGV2ZW50OiBFdmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKGV2ZW50LnR5cGUgPT09IFwiYXV0b2NvbXBsZXRlLXBsdXM6YWN0aXZhdGVcIiB8fCBldmVudC50eXBlID09PSBcImF1dG9jb21wbGV0ZS1wbHVzOmNvbmZpcm1cIiB8fCBldmVudC50eXBlID09PSBcImF1dG9jb21wbGV0ZS1wbHVzOmNhbmNlbFwiKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXN1bHRzID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuXG4gICAgICAgIC8vIFRPRE86IERpc3Bvc2Ugb2YgdGhlc2Ugd2hlbiBub3QgbmVlZGVkXG4gICAgICAgIGRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS51c2VJY29uc1wiLCAodmFsdWUpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3VzZUljb25zID0gdmFsdWU7XG4gICAgICAgIH0pKTtcblxuICAgICAgICBkaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20udXNlTGVmdExhYmVsQ29sdW1uRm9yU3VnZ2VzdGlvbnNcIiwgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl91c2VMZWZ0TGFiZWxDb2x1bW5Gb3JTdWdnZXN0aW9ucyA9IHZhbHVlO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIHByaXZhdGUgX21ha2VTdWdnZXN0aW9uKGl0ZW06IE1vZGVscy5BdXRvQ29tcGxldGVSZXNwb25zZSkge1xuICAgICAgICBsZXQgZGVzY3JpcHRpb246IGFueSwgbGVmdExhYmVsOiBhbnksIGljb25IVE1MOiBhbnksIHR5cGU6IGFueTtcblxuICAgICAgICBpZiAodGhpcy5fdXNlTGVmdExhYmVsQ29sdW1uRm9yU3VnZ2VzdGlvbnMgPT09IHRydWUpIHtcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uID0gaXRlbS5SZXF1aXJlZE5hbWVzcGFjZUltcG9ydDtcbiAgICAgICAgICAgIGxlZnRMYWJlbCA9IGl0ZW0uUmV0dXJuVHlwZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uID0gcmVuZGVyUmV0dXJuVHlwZShpdGVtLlJldHVyblR5cGUpO1xuICAgICAgICAgICAgbGVmdExhYmVsID0gXCJcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl91c2VJY29ucyA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgaWNvbkhUTUwgPSByZW5kZXJJY29uKGl0ZW0pO1xuICAgICAgICAgICAgdHlwZSA9IGl0ZW0uS2luZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGljb25IVE1MID0gbnVsbDtcbiAgICAgICAgICAgIHR5cGUgPSBpdGVtLktpbmQudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBfc2VhcmNoOiBpdGVtLkNvbXBsZXRpb25UZXh0LFxuICAgICAgICAgICAgc25pcHBldDogaXRlbS5TbmlwcGV0LFxuICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgIGljb25IVE1MOiBpY29uSFRNTCxcbiAgICAgICAgICAgIGRpc3BsYXlUZXh0OiBpdGVtLkRpc3BsYXlUZXh0LFxuICAgICAgICAgICAgY2xhc3NOYW1lOiBcImF1dG9jb21wbGV0ZS1vbW5pc2hhcnAtYXRvbVwiLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgbGVmdExhYmVsOiBsZWZ0TGFiZWwsXG4gICAgICAgIH07XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFtuZXcgQ29tcGxldGlvblByb3ZpZGVyKCldO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

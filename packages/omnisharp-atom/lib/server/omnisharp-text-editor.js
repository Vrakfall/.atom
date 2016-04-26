"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OmnisharpEditorContext = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.registerContextItem = registerContextItem;
exports.isOmnisharpTextEditor = isOmnisharpTextEditor;

var _omnisharpClient = require("omnisharp-client");

var _projectViewModel = require("./project-view-model");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var contextItems = new Map();
function registerContextItem(name, callback) {
    contextItems.set(name, callback);
    return _omnisharpClient.Disposable.create(function () {
        return contextItems.delete(name);
    });
}

var OmnisharpEditorContext = exports.OmnisharpEditorContext = function () {
    function OmnisharpEditorContext(editor, solution) {
        var _this = this;

        _classCallCheck(this, OmnisharpEditorContext);

        this._items = new Map();
        this._disposable = new _omnisharpClient.CompositeDisposable();
        this._editor = editor;
        this._solution = solution;
        this._project = new _projectViewModel.EmptyProjectViewModel(null, solution.path);
        this._disposable.add(solution.model.getProjectForEditor(editor).take(1).subscribe(function (project) {
            return _this._project.update(project);
        }));
        this._disposable.add(_omnisharpClient.Disposable.create(function () {
            _this._items.forEach(function (item) {
                return item.dispose && item.dispose();
            });
        }));
    }

    _createClass(OmnisharpEditorContext, [{
        key: "dispose",
        value: function dispose() {
            this._disposable.dispose();
        }
    }, {
        key: "set",
        value: function set(name, callback) {
            if (this._items.has(name)) return this._items.get(name);
            var result = callback(this, this._editor);
            this._items.set(name, result);
            return result;
        }
    }, {
        key: "get",
        value: function get(name) {
            if (!this._items.has(name) && contextItems.has(name)) {
                this.set(name, contextItems.get(name));
            }
            return this._items.get(name);
        }
    }, {
        key: "solution",
        get: function get() {
            return this._solution;
        }
    }, {
        key: "project",
        get: function get() {
            return this._project;
        }
    }, {
        key: "temp",
        get: function get() {
            return this._items.has("___TEMP___") && this._items.get("___TEMP___") || false;
        },
        set: function set(value) {
            if (!this._items.has("___TEMP___")) {
                this._items.set("___TEMP___", value);
            }
        }
    }, {
        key: "metadata",
        get: function get() {
            return this._metadata;
        },
        set: function set(value) {
            this._metadata = value;
        }
    }, {
        key: "config",
        get: function get() {
            return this._config;
        },
        set: function set(value) {
            this._config = value;
        }
    }]);

    return OmnisharpEditorContext;
}();

function isOmnisharpTextEditor(editor) {
    return editor && !!editor.omnisharp;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvb21uaXNoYXJwLXRleHQtZWRpdG9yLnRzIiwibGliL3NlcnZlci9vbW5pc2hhcnAtdGV4dC1lZGl0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O1FBS0EsbUIsR0FBQSxtQjtRQXNFQSxxQixHQUFBLHFCOztBQzNFQTs7QUFDQTs7OztBREdBLElBQU0sZUFBZSxJQUFJLEdBQUosRUFBckI7QUFDQSxTQUFBLG1CQUFBLENBQXVDLElBQXZDLEVBQXFELFFBQXJELEVBQWtJO0FBQzlILGlCQUFhLEdBQWIsQ0FBaUIsSUFBakIsRUFBdUIsUUFBdkI7QUFDQSxXQUFPLDRCQUFXLE1BQVgsQ0FBa0I7QUFBQSxlQUFNLGFBQWEsTUFBYixDQUFvQixJQUFwQixDQUFOO0FBQUEsS0FBbEIsQ0FBUDtBQUNIOztJQUVELHNCLFdBQUEsc0I7QUFTSSxvQ0FBWSxNQUFaLEVBQXFDLFFBQXJDLEVBQXVEO0FBQUE7O0FBQUE7O0FBSC9DLGFBQUEsTUFBQSxHQUFTLElBQUksR0FBSixFQUFUO0FBQ0EsYUFBQSxXQUFBLEdBQWMsMENBQWQ7QUFHSixhQUFLLE9BQUwsR0FBb0IsTUFBcEI7QUFDQSxhQUFLLFNBQUwsR0FBaUIsUUFBakI7QUFDQSxhQUFLLFFBQUwsR0FBZ0IsNENBQTBCLElBQTFCLEVBQWdDLFNBQVMsSUFBekMsQ0FBaEI7QUFFQSxhQUFLLFdBQUwsQ0FBaUIsR0FBakIsQ0FBcUIsU0FBUyxLQUFULENBQ2hCLG1CQURnQixDQUNJLE1BREosRUFFaEIsSUFGZ0IsQ0FFWCxDQUZXLEVBR2hCLFNBSGdCLENBR04sVUFBQyxPQUFEO0FBQUEsbUJBQWEsTUFBSyxRQUFMLENBQWMsTUFBZCxDQUFxQixPQUFyQixDQUFiO0FBQUEsU0FITSxDQUFyQjtBQUtBLGFBQUssV0FBTCxDQUFpQixHQUFqQixDQUFxQiw0QkFBVyxNQUFYLENBQWtCLFlBQUE7QUFDbkMsa0JBQUssTUFBTCxDQUFZLE9BQVosQ0FBb0I7QUFBQSx1QkFBUSxLQUFLLE9BQUwsSUFBZ0IsS0FBSyxPQUFMLEVBQXhCO0FBQUEsYUFBcEI7QUFDSCxTQUZvQixDQUFyQjtBQUdIOzs7O2tDQUVhO0FBQ1YsaUJBQUssV0FBTCxDQUFpQixPQUFqQjtBQUNIOzs7NEJBa0JhLEksRUFBYyxRLEVBQTZFO0FBQ3JHLGdCQUFJLEtBQUssTUFBTCxDQUFZLEdBQVosQ0FBZ0IsSUFBaEIsQ0FBSixFQUNJLE9BQU8sS0FBSyxNQUFMLENBQVksR0FBWixDQUFnQixJQUFoQixDQUFQO0FBRUosZ0JBQU0sU0FBUyxTQUFTLElBQVQsRUFBZSxLQUFLLE9BQXBCLENBQWY7QUFDQSxpQkFBSyxNQUFMLENBQVksR0FBWixDQUFnQixJQUFoQixFQUFzQixNQUF0QjtBQUNBLG1CQUFPLE1BQVA7QUFDSDs7OzRCQUVhLEksRUFBWTtBQUN0QixnQkFBSSxDQUFDLEtBQUssTUFBTCxDQUFZLEdBQVosQ0FBZ0IsSUFBaEIsQ0FBRCxJQUEwQixhQUFhLEdBQWIsQ0FBaUIsSUFBakIsQ0FBOUIsRUFBc0Q7QUFDbEQscUJBQUssR0FBTCxDQUFTLElBQVQsRUFBZSxhQUFhLEdBQWIsQ0FBaUIsSUFBakIsQ0FBZjtBQUNIO0FBQ0QsbUJBQVksS0FBSyxNQUFMLENBQVksR0FBWixDQUFnQixJQUFoQixDQUFaO0FBQ0g7Ozs0QkE5QmtCO0FBQUssbUJBQU8sS0FBSyxTQUFaO0FBQXdCOzs7NEJBQzlCO0FBQUssbUJBQU8sS0FBSyxRQUFaO0FBQXVCOzs7NEJBRS9CO0FBQUssbUJBQU8sS0FBSyxNQUFMLENBQVksR0FBWixDQUFnQixZQUFoQixLQUFpQyxLQUFLLE1BQUwsQ0FBWSxHQUFaLENBQWdCLFlBQWhCLENBQWpDLElBQWtFLEtBQXpFO0FBQWlGLFM7MEJBQ3JGLEssRUFBYztBQUMxQixnQkFBSSxDQUFDLEtBQUssTUFBTCxDQUFZLEdBQVosQ0FBZ0IsWUFBaEIsQ0FBTCxFQUFvQztBQUNoQyxxQkFBSyxNQUFMLENBQVksR0FBWixDQUFnQixZQUFoQixFQUE4QixLQUE5QjtBQUNIO0FBQ0o7Ozs0QkFFa0I7QUFBSyxtQkFBTyxLQUFLLFNBQVo7QUFBd0IsUzswQkFDNUIsSyxFQUFLO0FBQUksaUJBQUssU0FBTCxHQUFpQixLQUFqQjtBQUF5Qjs7OzRCQUVyQztBQUFLLG1CQUFPLEtBQUssT0FBWjtBQUFzQixTOzBCQUMxQixLLEVBQUs7QUFBSSxpQkFBSyxPQUFMLEdBQWUsS0FBZjtBQUF1Qjs7Ozs7O0FBdUJ0RCxTQUFBLHFCQUFBLENBQXNDLE1BQXRDLEVBQWlEO0FBQW1DLFdBQU8sVUFBVSxDQUFDLENBQU8sT0FBUSxTQUFqQztBQUE2QyIsImZpbGUiOiJsaWIvc2VydmVyL29tbmlzaGFycC10ZXh0LWVkaXRvci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZSwgRGlzcG9zYWJsZSwgSURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQge1NvbHV0aW9ufSBmcm9tIFwiLi9zb2x1dGlvblwiO1xuaW1wb3J0IHtQcm9qZWN0Vmlld01vZGVsLCBFbXB0eVByb2plY3RWaWV3TW9kZWx9IGZyb20gXCIuL3Byb2plY3Qtdmlldy1tb2RlbFwiO1xuXG5jb25zdCBjb250ZXh0SXRlbXMgPSBuZXcgTWFwPHN0cmluZywgKGNvbnRleHQ6IE9tbmlzaGFycEVkaXRvckNvbnRleHQsIGVkaXRvcjogT21uaXNoYXJwVGV4dEVkaXRvcikgPT4gYW55PigpO1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29udGV4dEl0ZW08VD4obmFtZTogc3RyaW5nLCBjYWxsYmFjazogKGNvbnRleHQ6IE9tbmlzaGFycEVkaXRvckNvbnRleHQsIGVkaXRvcjogT21uaXNoYXJwVGV4dEVkaXRvcikgPT4gVCkge1xuICAgIGNvbnRleHRJdGVtcy5zZXQobmFtZSwgY2FsbGJhY2spO1xuICAgIHJldHVybiBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiBjb250ZXh0SXRlbXMuZGVsZXRlKG5hbWUpKTtcbn1cblxuZXhwb3J0IGNsYXNzIE9tbmlzaGFycEVkaXRvckNvbnRleHQgaW1wbGVtZW50cyBJRGlzcG9zYWJsZSB7XG4gICAgcHJpdmF0ZSBfZWRpdG9yOiBPbW5pc2hhcnBUZXh0RWRpdG9yO1xuICAgIHByaXZhdGUgX3NvbHV0aW9uOiBTb2x1dGlvbjtcbiAgICBwcml2YXRlIF9tZXRhZGF0YTogYm9vbGVhbjtcbiAgICBwcml2YXRlIF9jb25maWc6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSBfcHJvamVjdDogUHJvamVjdFZpZXdNb2RlbDxhbnk+O1xuICAgIHByaXZhdGUgX2l0ZW1zID0gbmV3IE1hcDxzdHJpbmcsIGFueT4oKTtcbiAgICBwcml2YXRlIF9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcblxuICAgIGNvbnN0cnVjdG9yKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yLCBzb2x1dGlvbjogU29sdXRpb24pIHtcbiAgICAgICAgdGhpcy5fZWRpdG9yID0gPGFueT5lZGl0b3I7XG4gICAgICAgIHRoaXMuX3NvbHV0aW9uID0gc29sdXRpb247XG4gICAgICAgIHRoaXMuX3Byb2plY3QgPSBuZXcgRW1wdHlQcm9qZWN0Vmlld01vZGVsKG51bGwsIHNvbHV0aW9uLnBhdGgpO1xuXG4gICAgICAgIHRoaXMuX2Rpc3Bvc2FibGUuYWRkKHNvbHV0aW9uLm1vZGVsXG4gICAgICAgICAgICAuZ2V0UHJvamVjdEZvckVkaXRvcihlZGl0b3IpXG4gICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgLnN1YnNjcmliZSgocHJvamVjdCkgPT4gdGhpcy5fcHJvamVjdC51cGRhdGUocHJvamVjdCkpKTtcblxuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9pdGVtcy5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5kaXNwb3NlICYmIGl0ZW0uZGlzcG9zZSgpKTtcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IHNvbHV0aW9uKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb247IH1cbiAgICBwdWJsaWMgZ2V0IHByb2plY3QoKSB7IHJldHVybiB0aGlzLl9wcm9qZWN0OyB9XG5cbiAgICBwdWJsaWMgZ2V0IHRlbXAoKSB7IHJldHVybiB0aGlzLl9pdGVtcy5oYXMoXCJfX19URU1QX19fXCIpICYmIHRoaXMuX2l0ZW1zLmdldChcIl9fX1RFTVBfX19cIikgfHwgZmFsc2U7IH1cbiAgICBwdWJsaWMgc2V0IHRlbXAodmFsdWU6IGJvb2xlYW4pIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pdGVtcy5oYXMoXCJfX19URU1QX19fXCIpKSB7XG4gICAgICAgICAgICB0aGlzLl9pdGVtcy5zZXQoXCJfX19URU1QX19fXCIsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgbWV0YWRhdGEoKSB7IHJldHVybiB0aGlzLl9tZXRhZGF0YTsgfVxuICAgIHB1YmxpYyBzZXQgbWV0YWRhdGEodmFsdWUpIHsgdGhpcy5fbWV0YWRhdGEgPSB2YWx1ZTsgfVxuXG4gICAgcHVibGljIGdldCBjb25maWcoKSB7IHJldHVybiB0aGlzLl9jb25maWc7IH1cbiAgICBwdWJsaWMgc2V0IGNvbmZpZyh2YWx1ZSkgeyB0aGlzLl9jb25maWcgPSB2YWx1ZTsgfVxuXG4gICAgcHVibGljIHNldDxUPihuYW1lOiBzdHJpbmcsIGNhbGxiYWNrOiAoY29udGV4dDogT21uaXNoYXJwRWRpdG9yQ29udGV4dCwgZWRpdG9yOiBPbW5pc2hhcnBUZXh0RWRpdG9yKSA9PiBUKSB7XG4gICAgICAgIGlmICh0aGlzLl9pdGVtcy5oYXMobmFtZSkpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXRlbXMuZ2V0KG5hbWUpO1xuXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGNhbGxiYWNrKHRoaXMsIHRoaXMuX2VkaXRvcik7XG4gICAgICAgIHRoaXMuX2l0ZW1zLnNldChuYW1lLCByZXN1bHQpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQ8VD4obmFtZTogc3RyaW5nKTogVCB7XG4gICAgICAgIGlmICghdGhpcy5faXRlbXMuaGFzKG5hbWUpICYmIGNvbnRleHRJdGVtcy5oYXMobmFtZSkpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0KG5hbWUsIGNvbnRleHRJdGVtcy5nZXQobmFtZSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiA8YW55PnRoaXMuX2l0ZW1zLmdldChuYW1lKTtcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT21uaXNoYXJwVGV4dEVkaXRvciBleHRlbmRzIEF0b20uVGV4dEVkaXRvciB7XG4gICAgb21uaXNoYXJwOiBPbW5pc2hhcnBFZGl0b3JDb250ZXh0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcjogYW55KTogZWRpdG9yIGlzIE9tbmlzaGFycFRleHRFZGl0b3IgeyByZXR1cm4gZWRpdG9yICYmICEhKDxhbnk+ZWRpdG9yKS5vbW5pc2hhcnA7IH1cbiIsImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUsIERpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgRW1wdHlQcm9qZWN0Vmlld01vZGVsIH0gZnJvbSBcIi4vcHJvamVjdC12aWV3LW1vZGVsXCI7XG5jb25zdCBjb250ZXh0SXRlbXMgPSBuZXcgTWFwKCk7XG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb250ZXh0SXRlbShuYW1lLCBjYWxsYmFjaykge1xuICAgIGNvbnRleHRJdGVtcy5zZXQobmFtZSwgY2FsbGJhY2spO1xuICAgIHJldHVybiBEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiBjb250ZXh0SXRlbXMuZGVsZXRlKG5hbWUpKTtcbn1cbmV4cG9ydCBjbGFzcyBPbW5pc2hhcnBFZGl0b3JDb250ZXh0IHtcbiAgICBjb25zdHJ1Y3RvcihlZGl0b3IsIHNvbHV0aW9uKSB7XG4gICAgICAgIHRoaXMuX2l0ZW1zID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgdGhpcy5fZWRpdG9yID0gZWRpdG9yO1xuICAgICAgICB0aGlzLl9zb2x1dGlvbiA9IHNvbHV0aW9uO1xuICAgICAgICB0aGlzLl9wcm9qZWN0ID0gbmV3IEVtcHR5UHJvamVjdFZpZXdNb2RlbChudWxsLCBzb2x1dGlvbi5wYXRoKTtcbiAgICAgICAgdGhpcy5fZGlzcG9zYWJsZS5hZGQoc29sdXRpb24ubW9kZWxcbiAgICAgICAgICAgIC5nZXRQcm9qZWN0Rm9yRWRpdG9yKGVkaXRvcilcbiAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAuc3Vic2NyaWJlKChwcm9qZWN0KSA9PiB0aGlzLl9wcm9qZWN0LnVwZGF0ZShwcm9qZWN0KSkpO1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmFkZChEaXNwb3NhYmxlLmNyZWF0ZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9pdGVtcy5mb3JFYWNoKGl0ZW0gPT4gaXRlbS5kaXNwb3NlICYmIGl0ZW0uZGlzcG9zZSgpKTtcbiAgICAgICAgfSkpO1xuICAgIH1cbiAgICBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLl9kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG4gICAgZ2V0IHNvbHV0aW9uKCkgeyByZXR1cm4gdGhpcy5fc29sdXRpb247IH1cbiAgICBnZXQgcHJvamVjdCgpIHsgcmV0dXJuIHRoaXMuX3Byb2plY3Q7IH1cbiAgICBnZXQgdGVtcCgpIHsgcmV0dXJuIHRoaXMuX2l0ZW1zLmhhcyhcIl9fX1RFTVBfX19cIikgJiYgdGhpcy5faXRlbXMuZ2V0KFwiX19fVEVNUF9fX1wiKSB8fCBmYWxzZTsgfVxuICAgIHNldCB0ZW1wKHZhbHVlKSB7XG4gICAgICAgIGlmICghdGhpcy5faXRlbXMuaGFzKFwiX19fVEVNUF9fX1wiKSkge1xuICAgICAgICAgICAgdGhpcy5faXRlbXMuc2V0KFwiX19fVEVNUF9fX1wiLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZ2V0IG1ldGFkYXRhKCkgeyByZXR1cm4gdGhpcy5fbWV0YWRhdGE7IH1cbiAgICBzZXQgbWV0YWRhdGEodmFsdWUpIHsgdGhpcy5fbWV0YWRhdGEgPSB2YWx1ZTsgfVxuICAgIGdldCBjb25maWcoKSB7IHJldHVybiB0aGlzLl9jb25maWc7IH1cbiAgICBzZXQgY29uZmlnKHZhbHVlKSB7IHRoaXMuX2NvbmZpZyA9IHZhbHVlOyB9XG4gICAgc2V0KG5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmICh0aGlzLl9pdGVtcy5oYXMobmFtZSkpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5faXRlbXMuZ2V0KG5hbWUpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBjYWxsYmFjayh0aGlzLCB0aGlzLl9lZGl0b3IpO1xuICAgICAgICB0aGlzLl9pdGVtcy5zZXQobmFtZSwgcmVzdWx0KTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgZ2V0KG5hbWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9pdGVtcy5oYXMobmFtZSkgJiYgY29udGV4dEl0ZW1zLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgdGhpcy5zZXQobmFtZSwgY29udGV4dEl0ZW1zLmdldChuYW1lKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2l0ZW1zLmdldChuYW1lKTtcbiAgICB9XG59XG5leHBvcnQgZnVuY3Rpb24gaXNPbW5pc2hhcnBUZXh0RWRpdG9yKGVkaXRvcikgeyByZXR1cm4gZWRpdG9yICYmICEhZWRpdG9yLm9tbmlzaGFycDsgfVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

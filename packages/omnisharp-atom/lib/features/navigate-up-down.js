"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.navigate = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Navigate = function () {
    function Navigate() {
        _classCallCheck(this, Navigate);

        this.required = true;
        this.title = "Navigate";
        this.description = "Adds server based navigation support";
    }

    _createClass(Navigate, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:navigate-up", function () {
                return _this.navigateUp();
            }));
            this.disposable.add(_omni.Omni.addTextEditorCommand("omnisharp-atom:navigate-down", function () {
                return _this.navigateDown();
            }));
            this.disposable.add(_omni.Omni.listener.navigateup.subscribe(function (data) {
                return _this.navigateTo(data.response);
            }));
            this.disposable.add(_omni.Omni.listener.navigatedown.subscribe(function (data) {
                return _this.navigateTo(data.response);
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }, {
        key: "navigateUp",
        value: function navigateUp() {
            _omni.Omni.request(function (solution) {
                return solution.navigateup({});
            });
        }
    }, {
        key: "navigateDown",
        value: function navigateDown() {
            _omni.Omni.request(function (solution) {
                return solution.navigatedown({});
            });
        }
    }, {
        key: "navigateTo",
        value: function navigateTo(data) {
            var editor = atom.workspace.getActiveTextEditor();
            _omni.Omni.navigateTo({ FileName: editor.getURI(), Line: data.Line, Column: data.Column });
        }
    }]);

    return Navigate;
}();

var navigate = exports.navigate = new Navigate();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9uYXZpZ2F0ZS11cC1kb3duLmpzIiwibGliL2ZlYXR1cmVzL25hdmlnYXRlLXVwLWRvd24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7O0FBQ0E7Ozs7SUNHQSxRO0FBQUEsd0JBQUE7QUFBQTs7QUFtQ1csYUFBQSxRQUFBLEdBQVcsSUFBWDtBQUNBLGFBQUEsS0FBQSxHQUFRLFVBQVI7QUFDQSxhQUFBLFdBQUEsR0FBYyxzQ0FBZDtBQUNWOzs7O21DQW5Da0I7QUFBQTs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLDBDQUFsQjtBQUVBLGlCQUFLLFVBQUwsQ0FBZ0IsR0FBaEIsQ0FBb0IsV0FBSyxvQkFBTCxDQUEwQiw0QkFBMUIsRUFBd0QsWUFBQTtBQUN4RSx1QkFBTyxNQUFLLFVBQUwsRUFBUDtBQUNILGFBRm1CLENBQXBCO0FBSUEsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLG9CQUFMLENBQTBCLDhCQUExQixFQUEwRCxZQUFBO0FBQzFFLHVCQUFPLE1BQUssWUFBTCxFQUFQO0FBQ0gsYUFGbUIsQ0FBcEI7QUFJQSxpQkFBSyxVQUFMLENBQWdCLEdBQWhCLENBQW9CLFdBQUssUUFBTCxDQUFjLFVBQWQsQ0FBeUIsU0FBekIsQ0FBbUMsVUFBQyxJQUFEO0FBQUEsdUJBQVUsTUFBSyxVQUFMLENBQWdCLEtBQUssUUFBckIsQ0FBVjtBQUFBLGFBQW5DLENBQXBCO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLFFBQUwsQ0FBYyxZQUFkLENBQTJCLFNBQTNCLENBQXFDLFVBQUMsSUFBRDtBQUFBLHVCQUFVLE1BQUssVUFBTCxDQUFnQixLQUFLLFFBQXJCLENBQVY7QUFBQSxhQUFyQyxDQUFwQjtBQUNIOzs7a0NBRWE7QUFDVixpQkFBSyxVQUFMLENBQWdCLE9BQWhCO0FBQ0g7OztxQ0FFZ0I7QUFDYix1QkFBSyxPQUFMLENBQWE7QUFBQSx1QkFBWSxTQUFTLFVBQVQsQ0FBb0IsRUFBcEIsQ0FBWjtBQUFBLGFBQWI7QUFDSDs7O3VDQUVrQjtBQUNmLHVCQUFLLE9BQUwsQ0FBYTtBQUFBLHVCQUFZLFNBQVMsWUFBVCxDQUFzQixFQUF0QixDQUFaO0FBQUEsYUFBYjtBQUNIOzs7bUNBRWtCLEksRUFBNkI7QUFDNUMsZ0JBQU0sU0FBUyxLQUFLLFNBQUwsQ0FBZSxtQkFBZixFQUFmO0FBQ0EsdUJBQUssVUFBTCxDQUFnQixFQUFFLFVBQVUsT0FBTyxNQUFQLEVBQVosRUFBNkIsTUFBTSxLQUFLLElBQXhDLEVBQThDLFFBQVEsS0FBSyxNQUEzRCxFQUFoQjtBQUNIOzs7Ozs7QUFNRSxJQUFNLDhCQUFXLElBQUksUUFBSixFQUFqQiIsImZpbGUiOiJsaWIvZmVhdHVyZXMvbmF2aWdhdGUtdXAtZG93bi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuY2xhc3MgTmF2aWdhdGUge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50aXRsZSA9IFwiTmF2aWdhdGVcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiQWRkcyBzZXJ2ZXIgYmFzZWQgbmF2aWdhdGlvbiBzdXBwb3J0XCI7XG4gICAgfVxuICAgIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuYWRkVGV4dEVkaXRvckNvbW1hbmQoXCJvbW5pc2hhcnAtYXRvbTpuYXZpZ2F0ZS11cFwiLCAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uYXZpZ2F0ZVVwKCk7XG4gICAgICAgIH0pKTtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206bmF2aWdhdGUtZG93blwiLCAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uYXZpZ2F0ZURvd24oKTtcbiAgICAgICAgfSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIubmF2aWdhdGV1cC5zdWJzY3JpYmUoKGRhdGEpID0+IHRoaXMubmF2aWdhdGVUbyhkYXRhLnJlc3BvbnNlKSkpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkubGlzdGVuZXIubmF2aWdhdGVkb3duLnN1YnNjcmliZSgoZGF0YSkgPT4gdGhpcy5uYXZpZ2F0ZVRvKGRhdGEucmVzcG9uc2UpKSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxuICAgIG5hdmlnYXRlVXAoKSB7XG4gICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5uYXZpZ2F0ZXVwKHt9KSk7XG4gICAgfVxuICAgIG5hdmlnYXRlRG93bigpIHtcbiAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLm5hdmlnYXRlZG93bih7fSkpO1xuICAgIH1cbiAgICBuYXZpZ2F0ZVRvKGRhdGEpIHtcbiAgICAgICAgY29uc3QgZWRpdG9yID0gYXRvbS53b3Jrc3BhY2UuZ2V0QWN0aXZlVGV4dEVkaXRvcigpO1xuICAgICAgICBPbW5pLm5hdmlnYXRlVG8oeyBGaWxlTmFtZTogZWRpdG9yLmdldFVSSSgpLCBMaW5lOiBkYXRhLkxpbmUsIENvbHVtbjogZGF0YS5Db2x1bW4gfSk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IG5hdmlnYXRlID0gbmV3IE5hdmlnYXRlO1xuIiwiaW1wb3J0IHtNb2RlbHN9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQge09tbml9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuXG5jbGFzcyBOYXZpZ2F0ZSBpbXBsZW1lbnRzIElGZWF0dXJlIHtcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG5cbiAgICBwdWJsaWMgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206bmF2aWdhdGUtdXBcIiwgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMubmF2aWdhdGVVcCgpO1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmFkZChPbW5pLmFkZFRleHRFZGl0b3JDb21tYW5kKFwib21uaXNoYXJwLWF0b206bmF2aWdhdGUtZG93blwiLCAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5uYXZpZ2F0ZURvd24oKTtcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5uYXZpZ2F0ZXVwLnN1YnNjcmliZSgoZGF0YSkgPT4gdGhpcy5uYXZpZ2F0ZVRvKGRhdGEucmVzcG9uc2UpKSk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5saXN0ZW5lci5uYXZpZ2F0ZWRvd24uc3Vic2NyaWJlKChkYXRhKSA9PiB0aGlzLm5hdmlnYXRlVG8oZGF0YS5yZXNwb25zZSkpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgbmF2aWdhdGVVcCgpIHtcbiAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLm5hdmlnYXRldXAoe30pKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgbmF2aWdhdGVEb3duKCkge1xuICAgICAgICBPbW5pLnJlcXVlc3Qoc29sdXRpb24gPT4gc29sdXRpb24ubmF2aWdhdGVkb3duKHt9KSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBuYXZpZ2F0ZVRvKGRhdGE6IE1vZGVscy5OYXZpZ2F0ZVJlc3BvbnNlKSB7XG4gICAgICAgIGNvbnN0IGVkaXRvciA9IGF0b20ud29ya3NwYWNlLmdldEFjdGl2ZVRleHRFZGl0b3IoKTtcbiAgICAgICAgT21uaS5uYXZpZ2F0ZVRvKHsgRmlsZU5hbWU6IGVkaXRvci5nZXRVUkkoKSwgTGluZTogZGF0YS5MaW5lLCBDb2x1bW46IGRhdGEuQ29sdW1uIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XG4gICAgcHVibGljIHRpdGxlID0gXCJOYXZpZ2F0ZVwiO1xuICAgIHB1YmxpYyBkZXNjcmlwdGlvbiA9IFwiQWRkcyBzZXJ2ZXIgYmFzZWQgbmF2aWdhdGlvbiBzdXBwb3J0XCI7XG59XG5leHBvcnQgY29uc3QgbmF2aWdhdGUgPSBuZXcgTmF2aWdhdGU7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

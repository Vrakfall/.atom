"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.topMenu = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

var _fs = require("fs");

var _path = require("path");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Menu = function () {
    function Menu() {
        _classCallCheck(this, Menu);

        this.required = false;
        this.title = "Show OmniSharp Menu";
        this.description = "Shows the Omnisharp Menu at the top of the window.";
        this.default = true;
    }

    _createClass(Menu, [{
        key: "activate",
        value: function activate() {
            var _this = this;

            this.disposable = new _omnisharpClient.CompositeDisposable();
            if (!this._json) {
                var menuJsonFile = (0, _path.join)(_omni.Omni.packageDir, "omnisharp-atom/menus/omnisharp-menu.json");
                this._json = JSON.parse((0, _fs.readFileSync)(menuJsonFile, "utf8")).menu;
            }
            this.disposable.add(_omni.Omni.switchActiveSolution(function (solution, cd) {
                if (solution) {
                    cd.add(atom.menu.add(_this._json));
                }
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return Menu;
}();

var topMenu = exports.topMenu = new Menu();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9hdG9tL21lbnUuanMiLCJsaWIvYXRvbS9tZW51LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUNBOztBQUNBOzs7O0lDRUEsSTtBQUFBLG9CQUFBO0FBQUE7O0FBc0JXLGFBQUEsUUFBQSxHQUFXLEtBQVg7QUFDQSxhQUFBLEtBQUEsR0FBUSxxQkFBUjtBQUNBLGFBQUEsV0FBQSxHQUFjLG9EQUFkO0FBQ0EsYUFBQSxPQUFBLEdBQVUsSUFBVjtBQUNWOzs7O21DQXRCa0I7QUFBQTs7QUFDWCxpQkFBSyxVQUFMLEdBQWtCLDBDQUFsQjtBQUNBLGdCQUFJLENBQUMsS0FBSyxLQUFWLEVBQWlCO0FBQ2Isb0JBQU0sZUFBZSxnQkFBSyxXQUFLLFVBQVYsRUFBc0IsMENBQXRCLENBQXJCO0FBQ0EscUJBQUssS0FBTCxHQUFhLEtBQUssS0FBTCxDQUFXLHNCQUFhLFlBQWIsRUFBMkIsTUFBM0IsQ0FBWCxFQUErQyxJQUE1RDtBQUNIO0FBRUQsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLG9CQUFMLENBQTBCLFVBQUMsUUFBRCxFQUFXLEVBQVgsRUFBYTtBQUN2RCxvQkFBSSxRQUFKLEVBQWM7QUFDVix1QkFBRyxHQUFILENBQU8sS0FBSyxJQUFMLENBQVUsR0FBVixDQUFtQixNQUFLLEtBQXhCLENBQVA7QUFDSDtBQUNKLGFBSm1CLENBQXBCO0FBS0g7OztrQ0FFYTtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEI7QUFDSDs7Ozs7O0FBUUUsSUFBTSw0QkFBVSxJQUFJLElBQUosRUFBaEIiLCJmaWxlIjoibGliL2F0b20vbWVudS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvc2l0ZURpc3Bvc2FibGUgfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHsgT21uaSB9IGZyb20gXCIuLi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBqb2luIH0gZnJvbSBcInBhdGhcIjtcbmNsYXNzIE1lbnUge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnJlcXVpcmVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlNob3cgT21uaVNoYXJwIE1lbnVcIjtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IFwiU2hvd3MgdGhlIE9tbmlzaGFycCBNZW51IGF0IHRoZSB0b3Agb2YgdGhlIHdpbmRvdy5cIjtcbiAgICAgICAgdGhpcy5kZWZhdWx0ID0gdHJ1ZTtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGlmICghdGhpcy5fanNvbikge1xuICAgICAgICAgICAgY29uc3QgbWVudUpzb25GaWxlID0gam9pbihPbW5pLnBhY2thZ2VEaXIsIFwib21uaXNoYXJwLWF0b20vbWVudXMvb21uaXNoYXJwLW1lbnUuanNvblwiKTtcbiAgICAgICAgICAgIHRoaXMuX2pzb24gPSBKU09OLnBhcnNlKHJlYWRGaWxlU3luYyhtZW51SnNvbkZpbGUsIFwidXRmOFwiKSkubWVudTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlU29sdXRpb24oKHNvbHV0aW9uLCBjZCkgPT4ge1xuICAgICAgICAgICAgaWYgKHNvbHV0aW9uKSB7XG4gICAgICAgICAgICAgICAgY2QuYWRkKGF0b20ubWVudS5hZGQodGhpcy5fanNvbikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IHRvcE1lbnUgPSBuZXcgTWVudSgpO1xuIiwiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmltcG9ydCB7cmVhZEZpbGVTeW5jfSBmcm9tIFwiZnNcIjtcbmltcG9ydCB7am9pbn0gZnJvbSBcInBhdGhcIjtcblxuY2xhc3MgTWVudSBpbXBsZW1lbnRzIElGZWF0dXJlIHtcbiAgICBwcml2YXRlIGRpc3Bvc2FibGU6IENvbXBvc2l0ZURpc3Bvc2FibGU7XG4gICAgcHJpdmF0ZSBfanNvbjogc3RyaW5nO1xuXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICBpZiAoIXRoaXMuX2pzb24pIHtcbiAgICAgICAgICAgIGNvbnN0IG1lbnVKc29uRmlsZSA9IGpvaW4oT21uaS5wYWNrYWdlRGlyLCBcIm9tbmlzaGFycC1hdG9tL21lbnVzL29tbmlzaGFycC1tZW51Lmpzb25cIik7XG4gICAgICAgICAgICB0aGlzLl9qc29uID0gSlNPTi5wYXJzZShyZWFkRmlsZVN5bmMobWVudUpzb25GaWxlLCBcInV0ZjhcIikpLm1lbnU7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuc3dpdGNoQWN0aXZlU29sdXRpb24oKHNvbHV0aW9uLCBjZCkgPT4ge1xuICAgICAgICAgICAgaWYgKHNvbHV0aW9uKSB7XG4gICAgICAgICAgICAgICAgY2QuYWRkKGF0b20ubWVudS5hZGQoPGFueT50aGlzLl9qc29uKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGlzcG9zZSgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVxdWlyZWQgPSBmYWxzZTtcbiAgICBwdWJsaWMgdGl0bGUgPSBcIlNob3cgT21uaVNoYXJwIE1lbnVcIjtcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIlNob3dzIHRoZSBPbW5pc2hhcnAgTWVudSBhdCB0aGUgdG9wIG9mIHRoZSB3aW5kb3cuXCI7XG4gICAgcHVibGljIGRlZmF1bHQgPSB0cnVlO1xufVxuXG5leHBvcnQgY29uc3QgdG9wTWVudSA9IG5ldyBNZW51KCk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

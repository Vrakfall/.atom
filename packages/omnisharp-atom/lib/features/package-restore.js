"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.packageRestore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _omnisharpClient = require("omnisharp-client");

var _omni = require("../server/omni");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PackageRestore = function () {
    function PackageRestore() {
        _classCallCheck(this, PackageRestore);

        this.required = true;
        this.title = "Package Restore";
        this.description = "Initializes a package restore, when an project.json file is saved.";
    }

    _createClass(PackageRestore, [{
        key: "activate",
        value: function activate() {
            this.disposable = new _omnisharpClient.CompositeDisposable();
            this.disposable.add(_omni.Omni.eachConfigEditor(function (editor, cd) {
                cd.add(editor.getBuffer().onDidSave(function () {
                    _omni.Omni.request(function (solution) {
                        return solution.filesChanged([{ FileName: editor.getPath() }]);
                    });
                }));
            }));
        }
    }, {
        key: "dispose",
        value: function dispose() {
            this.disposable.dispose();
        }
    }]);

    return PackageRestore;
}();

var packageRestore = exports.packageRestore = new PackageRestore();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9mZWF0dXJlcy9wYWNrYWdlLXJlc3RvcmUuanMiLCJsaWIvZmVhdHVyZXMvcGFja2FnZS1yZXN0b3JlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOzs7O0lDRUEsYztBQUFBLDhCQUFBO0FBQUE7O0FBZ0JXLGFBQUEsUUFBQSxHQUFXLElBQVg7QUFDQSxhQUFBLEtBQUEsR0FBUSxpQkFBUjtBQUNBLGFBQUEsV0FBQSxHQUFjLG9FQUFkO0FBQ1Y7Ozs7bUNBaEJrQjtBQUNYLGlCQUFLLFVBQUwsR0FBa0IsMENBQWxCO0FBQ0EsaUJBQUssVUFBTCxDQUFnQixHQUFoQixDQUFvQixXQUFLLGdCQUFMLENBQXNCLFVBQUMsTUFBRCxFQUFTLEVBQVQsRUFBVztBQUNqRCxtQkFBRyxHQUFILENBQU8sT0FBTyxTQUFQLEdBQW1CLFNBQW5CLENBQTZCLFlBQUE7QUFDaEMsK0JBQUssT0FBTCxDQUFhO0FBQUEsK0JBQVksU0FBUyxZQUFULENBQXNCLENBQUMsRUFBRSxVQUFVLE9BQU8sT0FBUCxFQUFaLEVBQUQsQ0FBdEIsQ0FBWjtBQUFBLHFCQUFiO0FBQ0gsaUJBRk0sQ0FBUDtBQUdILGFBSm1CLENBQXBCO0FBS0g7OztrQ0FFYTtBQUNWLGlCQUFLLFVBQUwsQ0FBZ0IsT0FBaEI7QUFDSDs7Ozs7O0FBT0UsSUFBTSwwQ0FBaUIsSUFBSSxjQUFKLEVBQXZCIiwiZmlsZSI6ImxpYi9mZWF0dXJlcy9wYWNrYWdlLXJlc3RvcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21wb3NpdGVEaXNwb3NhYmxlIH0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7IE9tbmkgfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcbmNsYXNzIFBhY2thZ2VSZXN0b3JlIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgIHRoaXMudGl0bGUgPSBcIlBhY2thZ2UgUmVzdG9yZVwiO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gXCJJbml0aWFsaXplcyBhIHBhY2thZ2UgcmVzdG9yZSwgd2hlbiBhbiBwcm9qZWN0Lmpzb24gZmlsZSBpcyBzYXZlZC5cIjtcbiAgICB9XG4gICAgYWN0aXZhdGUoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5hZGQoT21uaS5lYWNoQ29uZmlnRWRpdG9yKChlZGl0b3IsIGNkKSA9PiB7XG4gICAgICAgICAgICBjZC5hZGQoZWRpdG9yLmdldEJ1ZmZlcigpLm9uRGlkU2F2ZSgoKSA9PiB7XG4gICAgICAgICAgICAgICAgT21uaS5yZXF1ZXN0KHNvbHV0aW9uID0+IHNvbHV0aW9uLmZpbGVzQ2hhbmdlZChbeyBGaWxlTmFtZTogZWRpdG9yLmdldFBhdGgoKSB9XSkpO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9KSk7XG4gICAgfVxuICAgIGRpc3Bvc2UoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfVxufVxuZXhwb3J0IGNvbnN0IHBhY2thZ2VSZXN0b3JlID0gbmV3IFBhY2thZ2VSZXN0b3JlO1xuIiwiaW1wb3J0IHtDb21wb3NpdGVEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcblxuY2xhc3MgUGFja2FnZVJlc3RvcmUgaW1wbGVtZW50cyBJRmVhdHVyZSB7XG4gICAgcHJpdmF0ZSBkaXNwb3NhYmxlOiBDb21wb3NpdGVEaXNwb3NhYmxlO1xuXG4gICAgcHVibGljIGFjdGl2YXRlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuYWRkKE9tbmkuZWFjaENvbmZpZ0VkaXRvcigoZWRpdG9yLCBjZCkgPT4ge1xuICAgICAgICAgICAgY2QuYWRkKGVkaXRvci5nZXRCdWZmZXIoKS5vbkRpZFNhdmUoKCkgPT4ge1xuICAgICAgICAgICAgICAgIE9tbmkucmVxdWVzdChzb2x1dGlvbiA9PiBzb2x1dGlvbi5maWxlc0NoYW5nZWQoW3sgRmlsZU5hbWU6IGVkaXRvci5nZXRQYXRoKCkgfV0pKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkaXNwb3NlKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZXF1aXJlZCA9IHRydWU7XG4gICAgcHVibGljIHRpdGxlID0gXCJQYWNrYWdlIFJlc3RvcmVcIjtcbiAgICBwdWJsaWMgZGVzY3JpcHRpb24gPSBcIkluaXRpYWxpemVzIGEgcGFja2FnZSByZXN0b3JlLCB3aGVuIGFuIHByb2plY3QuanNvbiBmaWxlIGlzIHNhdmVkLlwiO1xufVxuXG5leHBvcnQgY29uc3QgcGFja2FnZVJlc3RvcmUgPSBuZXcgUGFja2FnZVJlc3RvcmU7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=

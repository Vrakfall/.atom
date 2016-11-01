"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.init = init;
exports.registerIndie = registerIndie;

var _omni = require("../server/omni");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _tsDisposables = require("ts-disposables");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Range = require("atom").Range;

function mapIndieValues(error) {
    var level = error.LogLevel.toLowerCase();
    return {
        type: level,
        text: error.Text + " [" + _omni.Omni.getFrameworks(error.Projects) + "] ",
        filePath: error.FileName,
        range: new Range([error.Line, error.Column], [error.EndLine, error.EndColumn])
    };
}
function showLinter() {
    _lodash2.default.each(document.querySelectorAll("linter-bottom-tab"), function (element) {
        element.style.display = "";
    });
    _lodash2.default.each(document.querySelectorAll("linter-bottom-status"), function (element) {
        element.style.display = "";
    });
    var panel = document.querySelector("linter-panel");
    if (panel) panel.style.display = "";
}
function hideLinter() {
    _lodash2.default.each(document.querySelectorAll("linter-bottom-tab"), function (element) {
        element.style.display = "none";
    });
    _lodash2.default.each(document.querySelectorAll("linter-bottom-status"), function (element) {
        element.style.display = "none";
    });
    var panel = document.querySelector("linter-panel");
    if (panel) panel.style.display = "none";
}
var showHiddenDiagnostics = true;
function init(linter) {
    var disposable = new _tsDisposables.CompositeDisposable();
    var cd = void 0;
    disposable.add(atom.config.observe("omnisharp-atom.hideLinterInterface", function (hidden) {
        if (hidden) {
            cd = new _tsDisposables.CompositeDisposable();
            disposable.add(cd);
            cd.add(_omni.Omni.activeEditor.filter(function (z) {
                return !z;
            }).subscribe(showLinter));
            cd.add(_omni.Omni.activeEditor.filter(function (z) {
                return !!z;
            }).subscribe(hideLinter));
        } else {
            if (cd) {
                disposable.remove(cd);
                cd.dispose();
            }
            showLinter();
        }
    }));
    disposable.add(atom.config.observe("omnisharp-atom.showHiddenDiagnostics", function (show) {
        showHiddenDiagnostics = show;
        atom.workspace.getTextEditors().forEach(function (editor) {
            var editorLinter = linter.getEditorLinter(editor);
            if (editorLinter) {
                editorLinter.lint(true);
            }
        });
    }));
    disposable.add(_omni.Omni.activeEditor.filter(function (z) {
        return !!z;
    }).take(1).delay(1000).subscribe(function (e) {
        _omni.Omni.whenEditorConnected(e).subscribe(function () {
            atom.workspace.getTextEditors().forEach(function (editor) {
                var editorLinter = linter.getEditorLinter(editor);
                if (editorLinter) {
                    editorLinter.lint(true);
                }
            });
        });
    }));
    return disposable;
}
function registerIndie(registry, disposable) {
    var linter = registry.register({ name: "c#" });
    disposable.add(linter, _omni.Omni.diagnostics.subscribe(function (diagnostics) {
        var messages = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = diagnostics[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var item = _step.value;

                if (showHiddenDiagnostics || item.LogLevel !== "Hidden") {
                    messages.push(mapIndieValues(item));
                }
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

        linter.setMessages(messages);
    }));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2aWNlcy9saW50ZXItcHJvdmlkZXIudHMiLCJsaWIvc2VydmljZXMvbGludGVyLXByb3ZpZGVyLmpzIl0sIm5hbWVzIjpbImluaXQiLCJyZWdpc3RlckluZGllIiwiUmFuZ2UiLCJyZXF1aXJlIiwibWFwSW5kaWVWYWx1ZXMiLCJlcnJvciIsImxldmVsIiwiTG9nTGV2ZWwiLCJ0b0xvd2VyQ2FzZSIsInR5cGUiLCJ0ZXh0IiwiVGV4dCIsImdldEZyYW1ld29ya3MiLCJQcm9qZWN0cyIsImZpbGVQYXRoIiwiRmlsZU5hbWUiLCJyYW5nZSIsIkxpbmUiLCJDb2x1bW4iLCJFbmRMaW5lIiwiRW5kQ29sdW1uIiwic2hvd0xpbnRlciIsImVhY2giLCJkb2N1bWVudCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJlbGVtZW50Iiwic3R5bGUiLCJkaXNwbGF5IiwicGFuZWwiLCJxdWVyeVNlbGVjdG9yIiwiaGlkZUxpbnRlciIsInNob3dIaWRkZW5EaWFnbm9zdGljcyIsImxpbnRlciIsImRpc3Bvc2FibGUiLCJjZCIsImFkZCIsImF0b20iLCJjb25maWciLCJvYnNlcnZlIiwiaGlkZGVuIiwiYWN0aXZlRWRpdG9yIiwiZmlsdGVyIiwieiIsInN1YnNjcmliZSIsInJlbW92ZSIsImRpc3Bvc2UiLCJzaG93Iiwid29ya3NwYWNlIiwiZ2V0VGV4dEVkaXRvcnMiLCJmb3JFYWNoIiwiZWRpdG9yIiwiZWRpdG9yTGludGVyIiwiZ2V0RWRpdG9yTGludGVyIiwibGludCIsInRha2UiLCJkZWxheSIsImUiLCJ3aGVuRWRpdG9yQ29ubmVjdGVkIiwicmVnaXN0cnkiLCJyZWdpc3RlciIsIm5hbWUiLCJkaWFnbm9zdGljcyIsIm1lc3NhZ2VzIiwiaXRlbSIsInB1c2giLCJzZXRNZXNzYWdlcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7UUEwREFBLEksR0FBQUEsSTtRQWtEQUMsYSxHQUFBQSxhOztBQzVHQTs7QUFFQTs7OztBQUNBOzs7O0FEQUEsSUFBTUMsUUFBUUMsUUFBUSxN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V0FBakIsOEhBQThCO0FBQUEsb0JBQXJCRSxJQUFxQjs7QUFDMUIsb0JBQUloQyx5QkFBeUJnQyxLQUFLeEQsUUFBTCxLQUFrQixRQUEvQyxFQUF5RDtBQUNyRHVELDZCQUFTRSxJQUFULENBQWM1RCxlQUFlMkQsSUFBZixDQUFkO0FBQ0g7QUFDSjtBQU5pQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQVFsQi9CLGVBQU9pQyxXQUFQLENBQW1CSCxRQUFuQjtBQUNILEtBVkwsQ0FGSjtBQWNIIiwiZmlsZSI6ImxpYi9zZXJ2aWNlcy9saW50ZXItcHJvdmlkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge01vZGVsc30gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcclxuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vc2VydmVyL29tbmlcIjtcclxuLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSAqL1xyXG5jb25zdCBSYW5nZSA9IHJlcXVpcmUoXCJhdG9tXCIpLlJhbmdlO1xyXG4vKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgKi9cclxuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xyXG5pbXBvcnQge0NvbXBvc2l0ZURpc3Bvc2FibGV9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xyXG5cclxuaW50ZXJmYWNlIExpbnRlck1lc3NhZ2Uge1xyXG4gICAgdHlwZTogc3RyaW5nOyAvLyBcImVycm9yXCIgfCBcIndhcm5pbmdcIlxyXG4gICAgdGV4dD86IHN0cmluZztcclxuICAgIGh0bWw/OiBzdHJpbmc7XHJcbiAgICBmaWxlUGF0aD86IHN0cmluZztcclxuICAgIHJhbmdlPzogUmFuZ2U7XHJcbiAgICBba2V5OiBzdHJpbmddOiBhbnk7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJbmRpZVJlZ2lzdHJ5IHtcclxuICAgIHJlZ2lzdGVyKG9wdGlvbnM6IHsgbmFtZTogc3RyaW5nOyB9KTogSW5kaWU7XHJcbiAgICBoYXMoaW5kaWU6IGFueSk6IEJvb2xlYW47XHJcbiAgICB1bnJlZ2lzdGVyKGluZGllOiBhbnkpOiB2b2lkO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSW5kaWUge1xyXG4gICAgc2V0TWVzc2FnZXMobWVzc2FnZXM6IExpbnRlck1lc3NhZ2VbXSk6IHZvaWQ7XHJcbiAgICBkZWxldGVNZXNzYWdlcygpOiB2b2lkO1xyXG4gICAgZGlzcG9zZSgpOiB2b2lkO1xyXG59XHJcblxyXG5mdW5jdGlvbiBtYXBJbmRpZVZhbHVlcyhlcnJvcjogTW9kZWxzLkRpYWdub3N0aWNMb2NhdGlvbik6IExpbnRlck1lc3NhZ2Uge1xyXG4gICAgY29uc3QgbGV2ZWwgPSBlcnJvci5Mb2dMZXZlbC50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgdHlwZTogbGV2ZWwsXHJcbiAgICAgICAgdGV4dDogYCR7ZXJyb3IuVGV4dH0gWyR7T21uaS5nZXRGcmFtZXdvcmtzKGVycm9yLlByb2plY3RzKX1dIGAsXHJcbiAgICAgICAgZmlsZVBhdGg6IGVycm9yLkZpbGVOYW1lLFxyXG4gICAgICAgIHJhbmdlOiBuZXcgUmFuZ2UoW2Vycm9yLkxpbmUsIGVycm9yLkNvbHVtbl0sIFtlcnJvci5FbmRMaW5lLCBlcnJvci5FbmRDb2x1bW5dKVxyXG4gICAgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2hvd0xpbnRlcigpIHtcclxuICAgIF8uZWFjaChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwibGludGVyLWJvdHRvbS10YWJcIiksIChlbGVtZW50OiBIVE1MRWxlbWVudCkgPT4geyBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIlwiOyB9KTtcclxuICAgIF8uZWFjaChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwibGludGVyLWJvdHRvbS1zdGF0dXNcIiksIChlbGVtZW50OiBIVE1MRWxlbWVudCkgPT4geyBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIlwiOyB9KTtcclxuICAgIGNvbnN0IHBhbmVsID0gPEhUTUxFbGVtZW50PmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJsaW50ZXItcGFuZWxcIik7XHJcbiAgICBpZiAocGFuZWwpXHJcbiAgICAgICAgcGFuZWwuc3R5bGUuZGlzcGxheSA9IFwiXCI7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGhpZGVMaW50ZXIoKSB7XHJcbiAgICBfLmVhY2goZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcImxpbnRlci1ib3R0b20tdGFiXCIpLCAoZWxlbWVudDogSFRNTEVsZW1lbnQpID0+IHtlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjt9KTtcclxuICAgIF8uZWFjaChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwibGludGVyLWJvdHRvbS1zdGF0dXNcIiksIChlbGVtZW50OiBIVE1MRWxlbWVudCkgPT4ge2VsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO30pO1xyXG4gICAgY29uc3QgcGFuZWwgPSA8SFRNTEVsZW1lbnQ+ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImxpbnRlci1wYW5lbFwiKTtcclxuICAgIGlmIChwYW5lbClcclxuICAgICAgICBwYW5lbC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbn1cclxuXHJcbmxldCBzaG93SGlkZGVuRGlhZ25vc3RpY3MgPSB0cnVlO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGluaXQobGludGVyOiB7IGdldEVkaXRvckxpbnRlcjogKGVkaXRvcjogQXRvbS5UZXh0RWRpdG9yKSA9PiB7IGxpbnQ6IChzaG91bGRMaW50OiBib29sZWFuKSA9PiB2b2lkIH0gfSkge1xyXG4gICAgY29uc3QgZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XHJcbiAgICBsZXQgY2Q6IENvbXBvc2l0ZURpc3Bvc2FibGU7XHJcbiAgICBkaXNwb3NhYmxlLmFkZChhdG9tLmNvbmZpZy5vYnNlcnZlKFwib21uaXNoYXJwLWF0b20uaGlkZUxpbnRlckludGVyZmFjZVwiLCBoaWRkZW4gPT4ge1xyXG4gICAgICAgIGlmIChoaWRkZW4pIHtcclxuICAgICAgICAgICAgY2QgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xyXG4gICAgICAgICAgICBkaXNwb3NhYmxlLmFkZChjZCk7XHJcblxyXG4gICAgICAgICAgICAvLyBzaG93IGxpbnRlciBidXR0b25zXHJcbiAgICAgICAgICAgIGNkLmFkZChPbW5pLmFjdGl2ZUVkaXRvclxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+ICF6KVxyXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShzaG93TGludGVyKSk7XHJcblxyXG4gICAgICAgICAgICAvLyBoaWRlIGxpbnRlciBidXR0b25zXHJcbiAgICAgICAgICAgIGNkLmFkZChPbW5pLmFjdGl2ZUVkaXRvclxyXG4gICAgICAgICAgICAgICAgLmZpbHRlcih6ID0+ICEheilcclxuICAgICAgICAgICAgICAgIC5zdWJzY3JpYmUoaGlkZUxpbnRlcikpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGlmIChjZCkge1xyXG4gICAgICAgICAgICAgICAgZGlzcG9zYWJsZS5yZW1vdmUoY2QpO1xyXG4gICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHNob3dMaW50ZXIoKTtcclxuICAgICAgICB9XHJcbiAgICB9KSk7XHJcblxyXG4gICAgZGlzcG9zYWJsZS5hZGQoYXRvbS5jb25maWcub2JzZXJ2ZShcIm9tbmlzaGFycC1hdG9tLnNob3dIaWRkZW5EaWFnbm9zdGljc1wiLCBzaG93ID0+IHtcclxuICAgICAgICBzaG93SGlkZGVuRGlhZ25vc3RpY3MgPSBzaG93O1xyXG4gICAgICAgIGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCkuZm9yRWFjaCgoZWRpdG9yKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvckxpbnRlciA9IGxpbnRlci5nZXRFZGl0b3JMaW50ZXIoZWRpdG9yKTtcclxuICAgICAgICAgICAgaWYgKGVkaXRvckxpbnRlcikge1xyXG4gICAgICAgICAgICAgICAgZWRpdG9yTGludGVyLmxpbnQodHJ1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0pKTtcclxuXHJcbiAgICBkaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZUVkaXRvci5maWx0ZXIoeiA9PiAhIXopLnRha2UoMSkuZGVsYXkoMTAwMCkuc3Vic2NyaWJlKChlKSA9PiB7XHJcbiAgICAgICAgT21uaS53aGVuRWRpdG9yQ29ubmVjdGVkKGUpLnN1YnNjcmliZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCkuZm9yRWFjaCgoZWRpdG9yKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlZGl0b3JMaW50ZXIgPSBsaW50ZXIuZ2V0RWRpdG9yTGludGVyKGVkaXRvcik7XHJcbiAgICAgICAgICAgICAgICBpZiAoZWRpdG9yTGludGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yTGludGVyLmxpbnQodHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSkpO1xyXG5cclxuICAgIHJldHVybiBkaXNwb3NhYmxlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJJbmRpZShyZWdpc3RyeTogSW5kaWVSZWdpc3RyeSwgZGlzcG9zYWJsZTogQ29tcG9zaXRlRGlzcG9zYWJsZSkge1xyXG4gICAgY29uc3QgbGludGVyID0gcmVnaXN0cnkucmVnaXN0ZXIoeyBuYW1lOiBcImMjXCIgfSk7XHJcbiAgICBkaXNwb3NhYmxlLmFkZChcclxuICAgICAgICBsaW50ZXIsXHJcbiAgICAgICAgT21uaS5kaWFnbm9zdGljc1xyXG4gICAgICAgICAgICAuc3Vic2NyaWJlKGRpYWdub3N0aWNzID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2VzOiBMaW50ZXJNZXNzYWdlW10gPSBbXTtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGl0ZW0gb2YgZGlhZ25vc3RpY3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2hvd0hpZGRlbkRpYWdub3N0aWNzIHx8IGl0ZW0uTG9nTGV2ZWwgIT09IFwiSGlkZGVuXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZXMucHVzaChtYXBJbmRpZVZhbHVlcyhpdGVtKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxpbnRlci5zZXRNZXNzYWdlcyhtZXNzYWdlcyk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICApO1xyXG59XHJcblxyXG4iLCJpbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uL3NlcnZlci9vbW5pXCI7XG5jb25zdCBSYW5nZSA9IHJlcXVpcmUoXCJhdG9tXCIpLlJhbmdlO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJ0cy1kaXNwb3NhYmxlc1wiO1xuZnVuY3Rpb24gbWFwSW5kaWVWYWx1ZXMoZXJyb3IpIHtcbiAgICBjb25zdCBsZXZlbCA9IGVycm9yLkxvZ0xldmVsLnRvTG93ZXJDYXNlKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogbGV2ZWwsXG4gICAgICAgIHRleHQ6IGAke2Vycm9yLlRleHR9IFske09tbmkuZ2V0RnJhbWV3b3JrcyhlcnJvci5Qcm9qZWN0cyl9XSBgLFxuICAgICAgICBmaWxlUGF0aDogZXJyb3IuRmlsZU5hbWUsXG4gICAgICAgIHJhbmdlOiBuZXcgUmFuZ2UoW2Vycm9yLkxpbmUsIGVycm9yLkNvbHVtbl0sIFtlcnJvci5FbmRMaW5lLCBlcnJvci5FbmRDb2x1bW5dKVxuICAgIH07XG59XG5mdW5jdGlvbiBzaG93TGludGVyKCkge1xuICAgIF8uZWFjaChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwibGludGVyLWJvdHRvbS10YWJcIiksIChlbGVtZW50KSA9PiB7IGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwiXCI7IH0pO1xuICAgIF8uZWFjaChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwibGludGVyLWJvdHRvbS1zdGF0dXNcIiksIChlbGVtZW50KSA9PiB7IGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9IFwiXCI7IH0pO1xuICAgIGNvbnN0IHBhbmVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImxpbnRlci1wYW5lbFwiKTtcbiAgICBpZiAocGFuZWwpXG4gICAgICAgIHBhbmVsLnN0eWxlLmRpc3BsYXkgPSBcIlwiO1xufVxuZnVuY3Rpb24gaGlkZUxpbnRlcigpIHtcbiAgICBfLmVhY2goZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcImxpbnRlci1ib3R0b20tdGFiXCIpLCAoZWxlbWVudCkgPT4geyBlbGVtZW50LnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjsgfSk7XG4gICAgXy5lYWNoKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCJsaW50ZXItYm90dG9tLXN0YXR1c1wiKSwgKGVsZW1lbnQpID0+IHsgZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7IH0pO1xuICAgIGNvbnN0IHBhbmVsID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcImxpbnRlci1wYW5lbFwiKTtcbiAgICBpZiAocGFuZWwpXG4gICAgICAgIHBhbmVsLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbn1cbmxldCBzaG93SGlkZGVuRGlhZ25vc3RpY3MgPSB0cnVlO1xuZXhwb3J0IGZ1bmN0aW9uIGluaXQobGludGVyKSB7XG4gICAgY29uc3QgZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgbGV0IGNkO1xuICAgIGRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5oaWRlTGludGVySW50ZXJmYWNlXCIsIGhpZGRlbiA9PiB7XG4gICAgICAgIGlmIChoaWRkZW4pIHtcbiAgICAgICAgICAgIGNkID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgICAgIGRpc3Bvc2FibGUuYWRkKGNkKTtcbiAgICAgICAgICAgIGNkLmFkZChPbW5pLmFjdGl2ZUVkaXRvclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAheilcbiAgICAgICAgICAgICAgICAuc3Vic2NyaWJlKHNob3dMaW50ZXIpKTtcbiAgICAgICAgICAgIGNkLmFkZChPbW5pLmFjdGl2ZUVkaXRvclxuICAgICAgICAgICAgICAgIC5maWx0ZXIoeiA9PiAhIXopXG4gICAgICAgICAgICAgICAgLnN1YnNjcmliZShoaWRlTGludGVyKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoY2QpIHtcbiAgICAgICAgICAgICAgICBkaXNwb3NhYmxlLnJlbW92ZShjZCk7XG4gICAgICAgICAgICAgICAgY2QuZGlzcG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2hvd0xpbnRlcigpO1xuICAgICAgICB9XG4gICAgfSkpO1xuICAgIGRpc3Bvc2FibGUuYWRkKGF0b20uY29uZmlnLm9ic2VydmUoXCJvbW5pc2hhcnAtYXRvbS5zaG93SGlkZGVuRGlhZ25vc3RpY3NcIiwgc2hvdyA9PiB7XG4gICAgICAgIHNob3dIaWRkZW5EaWFnbm9zdGljcyA9IHNob3c7XG4gICAgICAgIGF0b20ud29ya3NwYWNlLmdldFRleHRFZGl0b3JzKCkuZm9yRWFjaCgoZWRpdG9yKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBlZGl0b3JMaW50ZXIgPSBsaW50ZXIuZ2V0RWRpdG9yTGludGVyKGVkaXRvcik7XG4gICAgICAgICAgICBpZiAoZWRpdG9yTGludGVyKSB7XG4gICAgICAgICAgICAgICAgZWRpdG9yTGludGVyLmxpbnQodHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pKTtcbiAgICBkaXNwb3NhYmxlLmFkZChPbW5pLmFjdGl2ZUVkaXRvci5maWx0ZXIoeiA9PiAhIXopLnRha2UoMSkuZGVsYXkoMTAwMCkuc3Vic2NyaWJlKChlKSA9PiB7XG4gICAgICAgIE9tbmkud2hlbkVkaXRvckNvbm5lY3RlZChlKS5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgICAgICAgYXRvbS53b3Jrc3BhY2UuZ2V0VGV4dEVkaXRvcnMoKS5mb3JFYWNoKChlZGl0b3IpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlZGl0b3JMaW50ZXIgPSBsaW50ZXIuZ2V0RWRpdG9yTGludGVyKGVkaXRvcik7XG4gICAgICAgICAgICAgICAgaWYgKGVkaXRvckxpbnRlcikge1xuICAgICAgICAgICAgICAgICAgICBlZGl0b3JMaW50ZXIubGludCh0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSkpO1xuICAgIHJldHVybiBkaXNwb3NhYmxlO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVySW5kaWUocmVnaXN0cnksIGRpc3Bvc2FibGUpIHtcbiAgICBjb25zdCBsaW50ZXIgPSByZWdpc3RyeS5yZWdpc3Rlcih7IG5hbWU6IFwiYyNcIiB9KTtcbiAgICBkaXNwb3NhYmxlLmFkZChsaW50ZXIsIE9tbmkuZGlhZ25vc3RpY3NcbiAgICAgICAgLnN1YnNjcmliZShkaWFnbm9zdGljcyA9PiB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2VzID0gW107XG4gICAgICAgIGZvciAobGV0IGl0ZW0gb2YgZGlhZ25vc3RpY3MpIHtcbiAgICAgICAgICAgIGlmIChzaG93SGlkZGVuRGlhZ25vc3RpY3MgfHwgaXRlbS5Mb2dMZXZlbCAhPT0gXCJIaWRkZW5cIikge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2VzLnB1c2gobWFwSW5kaWVWYWx1ZXMoaXRlbSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxpbnRlci5zZXRNZXNzYWdlcyhtZXNzYWdlcyk7XG4gICAgfSkpO1xufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

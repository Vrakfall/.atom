"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.metadataOpener = metadataOpener;

var _atom = require("atom");

var _solutionManager = require("./solution-manager");

var _lodash = require("lodash");

var _omnisharpTextEditor = require("./omnisharp-text-editor");

var metadataUri = "omnisharp://metadata/";
function metadataOpener() {
    function createEditorView(assemblyName, typeName) {
        function issueRequest(solution) {
            return solution.request("metadata", { AssemblyName: assemblyName, TypeName: typeName }).map(function (response) {
                return { source: response.Source, path: response.SourceName, solution: solution };
            });
        }
        function setupEditor(_ref) {
            var solution = _ref.solution;
            var path = _ref.path;
            var source = _ref.source;

            var editor = new _atom.TextEditor({});
            editor.setText(source);
            editor.onWillInsertText(function (e) {
                return e.cancel();
            });
            editor.getBuffer().setPath(path);
            var context = new _omnisharpTextEditor.OmnisharpEditorContext(editor, solution);
            context.metadata = true;
            var result = editor;
            result.omnisharp = context;
            editor.save = function () {};
            editor.saveAs = function () {};
            return editor;
        }
        return _solutionManager.SolutionManager.activeSolution.take(1).flatMap(issueRequest, function (_z, z) {
            return setupEditor(z);
        }).toPromise();
    }
    return atom.workspace.addOpener(function (uri) {
        if ((0, _lodash.startsWith)(uri, metadataUri)) {
            var url = uri.substr(metadataUri.length);

            var _url$split = url.split("/");

            var _url$split2 = _slicedToArray(_url$split, 2);

            var assemblyName = _url$split2[0];
            var typeName = _url$split2[1];

            return createEditorView(assemblyName, typeName);
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvbWV0YWRhdGEtZWRpdG9yLnRzIiwibGliL3NlcnZlci9tZXRhZGF0YS1lZGl0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7UUFRQSxjLEdBQUEsYzs7QUNSQTs7QUFDQTs7QUFDQTs7QUFDQTs7QURJQSxJQUFNLGNBQWMsdUJBQXBCO0FBQ0EsU0FBQSxjQUFBLEdBQUE7QUFDSSxhQUFBLGdCQUFBLENBQTBCLFlBQTFCLEVBQWdELFFBQWhELEVBQWdFO0FBQzVELGlCQUFBLFlBQUEsQ0FBc0IsUUFBdEIsRUFBd0M7QUFDcEMsbUJBQU8sU0FBUyxPQUFULENBQThELFVBQTlELEVBQTBFLEVBQUUsY0FBYyxZQUFoQixFQUE4QixVQUFVLFFBQXhDLEVBQTFFLEVBQ0YsR0FERSxDQUNFO0FBQUEsdUJBQWEsRUFBRSxRQUFRLFNBQVMsTUFBbkIsRUFBMkIsTUFBTSxTQUFTLFVBQTFDLEVBQXNELGtCQUF0RCxFQUFiO0FBQUEsYUFERixDQUFQO0FBRUg7QUFFRCxpQkFBQSxXQUFBLE9BQW1HO0FBQUEsZ0JBQTdFLFFBQTZFLFFBQTdFLFFBQTZFO0FBQUEsZ0JBQW5FLElBQW1FLFFBQW5FLElBQW1FO0FBQUEsZ0JBQTdELE1BQTZELFFBQTdELE1BQTZEOztBQUMvRixnQkFBTSxTQUFTLHFCQUFlLEVBQWYsQ0FBZjtBQUNBLG1CQUFPLE9BQVAsQ0FBZSxNQUFmO0FBQ0EsbUJBQU8sZ0JBQVAsQ0FBd0IsVUFBQyxDQUFEO0FBQUEsdUJBQU8sRUFBRSxNQUFGLEVBQVA7QUFBQSxhQUF4QjtBQUNBLG1CQUFPLFNBQVAsR0FBbUIsT0FBbkIsQ0FBMkIsSUFBM0I7QUFFQSxnQkFBTSxVQUFVLGdEQUEyQixNQUEzQixFQUFtQyxRQUFuQyxDQUFoQjtBQUNBLG9CQUFRLFFBQVIsR0FBbUIsSUFBbkI7QUFDQSxnQkFBTSxTQUFtQyxNQUF6QztBQUNBLG1CQUFPLFNBQVAsR0FBbUIsT0FBbkI7QUFFQSxtQkFBTyxJQUFQLEdBQWMsWUFBQSxDQUFvQixDQUFsQztBQUNBLG1CQUFPLE1BQVAsR0FBZ0IsWUFBQSxDQUFvQixDQUFwQztBQUVBLG1CQUFPLE1BQVA7QUFDSDtBQUVELGVBQU8saUNBQWdCLGNBQWhCLENBQ0YsSUFERSxDQUNHLENBREgsRUFFRixPQUZFLENBRU0sWUFGTixFQUVvQixVQUFDLEVBQUQsRUFBSyxDQUFMO0FBQUEsbUJBQVcsWUFBWSxDQUFaLENBQVg7QUFBQSxTQUZwQixFQUdGLFNBSEUsRUFBUDtBQUlIO0FBRUQsV0FBWSxLQUFLLFNBQUwsQ0FBZSxTQUFmLENBQXlCLFVBQUMsR0FBRCxFQUFZO0FBQzdDLFlBQUksd0JBQVcsR0FBWCxFQUFnQixXQUFoQixDQUFKLEVBQWtDO0FBQzlCLGdCQUFNLE1BQU0sSUFBSSxNQUFKLENBQVcsWUFBWSxNQUF2QixDQUFaOztBQUQ4Qiw2QkFFRyxJQUFJLEtBQUosQ0FBVSxHQUFWLENBRkg7O0FBQUE7O0FBQUEsZ0JBRXZCLFlBRnVCO0FBQUEsZ0JBRVQsUUFGUzs7QUFHOUIsbUJBQU8saUJBQWlCLFlBQWpCLEVBQStCLFFBQS9CLENBQVA7QUFDSDtBQUNKLEtBTlcsQ0FBWjtBQU9IIiwiZmlsZSI6ImxpYi9zZXJ2ZXIvbWV0YWRhdGEtZWRpdG9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtTb2x1dGlvbn0gZnJvbSBcIi4vc29sdXRpb25cIjtcbmltcG9ydCB7VGV4dEVkaXRvcn0gZnJvbSBcImF0b21cIjtcbmltcG9ydCB7U29sdXRpb25NYW5hZ2VyfSBmcm9tIFwiLi9zb2x1dGlvbi1tYW5hZ2VyXCI7XG5pbXBvcnQge3N0YXJ0c1dpdGh9IGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7T21uaXNoYXJwVGV4dEVkaXRvciwgT21uaXNoYXJwRWRpdG9yQ29udGV4dH0gZnJvbSBcIi4vb21uaXNoYXJwLXRleHQtZWRpdG9yXCI7XG5pbXBvcnQge0lEaXNwb3NhYmxlfSBmcm9tIFwib21uaXNoYXJwLWNsaWVudFwiO1xuXG5jb25zdCBtZXRhZGF0YVVyaSA9IFwib21uaXNoYXJwOi8vbWV0YWRhdGEvXCI7XG5leHBvcnQgZnVuY3Rpb24gbWV0YWRhdGFPcGVuZXIoKTogSURpc3Bvc2FibGUge1xuICAgIGZ1bmN0aW9uIGNyZWF0ZUVkaXRvclZpZXcoYXNzZW1ibHlOYW1lOiBzdHJpbmcsIHR5cGVOYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgZnVuY3Rpb24gaXNzdWVSZXF1ZXN0KHNvbHV0aW9uOiBTb2x1dGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHNvbHV0aW9uLnJlcXVlc3Q8YW55LCB7IFNvdXJjZTogc3RyaW5nOyBTb3VyY2VOYW1lOiBzdHJpbmcgfT4oXCJtZXRhZGF0YVwiLCB7IEFzc2VtYmx5TmFtZTogYXNzZW1ibHlOYW1lLCBUeXBlTmFtZTogdHlwZU5hbWUgfSlcbiAgICAgICAgICAgICAgICAubWFwKHJlc3BvbnNlID0+ICh7IHNvdXJjZTogcmVzcG9uc2UuU291cmNlLCBwYXRoOiByZXNwb25zZS5Tb3VyY2VOYW1lLCBzb2x1dGlvbiB9KSk7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBzZXR1cEVkaXRvcih7c29sdXRpb24sIHBhdGgsIHNvdXJjZX06IHsgc29sdXRpb246IFNvbHV0aW9uOyBzb3VyY2U6IHN0cmluZzsgcGF0aDogc3RyaW5nIH0pIHtcbiAgICAgICAgICAgIGNvbnN0IGVkaXRvciA9IG5ldyBUZXh0RWRpdG9yKHt9KTtcbiAgICAgICAgICAgIGVkaXRvci5zZXRUZXh0KHNvdXJjZSk7XG4gICAgICAgICAgICBlZGl0b3Iub25XaWxsSW5zZXJ0VGV4dCgoZSkgPT4gZS5jYW5jZWwoKSk7XG4gICAgICAgICAgICBlZGl0b3IuZ2V0QnVmZmVyKCkuc2V0UGF0aChwYXRoKTtcblxuICAgICAgICAgICAgY29uc3QgY29udGV4dCA9IG5ldyBPbW5pc2hhcnBFZGl0b3JDb250ZXh0KGVkaXRvciwgc29sdXRpb24pO1xuICAgICAgICAgICAgY29udGV4dC5tZXRhZGF0YSA9IHRydWU7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQ6IE9tbmlzaGFycFRleHRFZGl0b3IgPSA8YW55PmVkaXRvcjtcbiAgICAgICAgICAgIHJlc3VsdC5vbW5pc2hhcnAgPSBjb250ZXh0O1xuXG4gICAgICAgICAgICBlZGl0b3Iuc2F2ZSA9IGZ1bmN0aW9uKCkgeyAvKiAqLyB9O1xuICAgICAgICAgICAgZWRpdG9yLnNhdmVBcyA9IGZ1bmN0aW9uKCkgeyAvKiAqLyB9O1xuXG4gICAgICAgICAgICByZXR1cm4gZWRpdG9yO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvblxuICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgIC5mbGF0TWFwKGlzc3VlUmVxdWVzdCwgKF96LCB6KSA9PiBzZXR1cEVkaXRvcih6KSlcbiAgICAgICAgICAgIC50b1Byb21pc2UoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gPGFueT5hdG9tLndvcmtzcGFjZS5hZGRPcGVuZXIoKHVyaTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGlmIChzdGFydHNXaXRoKHVyaSwgbWV0YWRhdGFVcmkpKSB7XG4gICAgICAgICAgICBjb25zdCB1cmwgPSB1cmkuc3Vic3RyKG1ldGFkYXRhVXJpLmxlbmd0aCk7XG4gICAgICAgICAgICBjb25zdCBbYXNzZW1ibHlOYW1lLCB0eXBlTmFtZV0gPSB1cmwuc3BsaXQoXCIvXCIpO1xuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUVkaXRvclZpZXcoYXNzZW1ibHlOYW1lLCB0eXBlTmFtZSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbiIsImltcG9ydCB7IFRleHRFZGl0b3IgfSBmcm9tIFwiYXRvbVwiO1xuaW1wb3J0IHsgU29sdXRpb25NYW5hZ2VyIH0gZnJvbSBcIi4vc29sdXRpb24tbWFuYWdlclwiO1xuaW1wb3J0IHsgc3RhcnRzV2l0aCB9IGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCB7IE9tbmlzaGFycEVkaXRvckNvbnRleHQgfSBmcm9tIFwiLi9vbW5pc2hhcnAtdGV4dC1lZGl0b3JcIjtcbmNvbnN0IG1ldGFkYXRhVXJpID0gXCJvbW5pc2hhcnA6Ly9tZXRhZGF0YS9cIjtcbmV4cG9ydCBmdW5jdGlvbiBtZXRhZGF0YU9wZW5lcigpIHtcbiAgICBmdW5jdGlvbiBjcmVhdGVFZGl0b3JWaWV3KGFzc2VtYmx5TmFtZSwgdHlwZU5hbWUpIHtcbiAgICAgICAgZnVuY3Rpb24gaXNzdWVSZXF1ZXN0KHNvbHV0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gc29sdXRpb24ucmVxdWVzdChcIm1ldGFkYXRhXCIsIHsgQXNzZW1ibHlOYW1lOiBhc3NlbWJseU5hbWUsIFR5cGVOYW1lOiB0eXBlTmFtZSB9KVxuICAgICAgICAgICAgICAgIC5tYXAocmVzcG9uc2UgPT4gKHsgc291cmNlOiByZXNwb25zZS5Tb3VyY2UsIHBhdGg6IHJlc3BvbnNlLlNvdXJjZU5hbWUsIHNvbHV0aW9uIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBzZXR1cEVkaXRvcih7IHNvbHV0aW9uLCBwYXRoLCBzb3VyY2UgfSkge1xuICAgICAgICAgICAgY29uc3QgZWRpdG9yID0gbmV3IFRleHRFZGl0b3Ioe30pO1xuICAgICAgICAgICAgZWRpdG9yLnNldFRleHQoc291cmNlKTtcbiAgICAgICAgICAgIGVkaXRvci5vbldpbGxJbnNlcnRUZXh0KChlKSA9PiBlLmNhbmNlbCgpKTtcbiAgICAgICAgICAgIGVkaXRvci5nZXRCdWZmZXIoKS5zZXRQYXRoKHBhdGgpO1xuICAgICAgICAgICAgY29uc3QgY29udGV4dCA9IG5ldyBPbW5pc2hhcnBFZGl0b3JDb250ZXh0KGVkaXRvciwgc29sdXRpb24pO1xuICAgICAgICAgICAgY29udGV4dC5tZXRhZGF0YSA9IHRydWU7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBlZGl0b3I7XG4gICAgICAgICAgICByZXN1bHQub21uaXNoYXJwID0gY29udGV4dDtcbiAgICAgICAgICAgIGVkaXRvci5zYXZlID0gZnVuY3Rpb24gKCkgeyB9O1xuICAgICAgICAgICAgZWRpdG9yLnNhdmVBcyA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICAgICAgICAgIHJldHVybiBlZGl0b3I7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNvbHV0aW9uTWFuYWdlci5hY3RpdmVTb2x1dGlvblxuICAgICAgICAgICAgLnRha2UoMSlcbiAgICAgICAgICAgIC5mbGF0TWFwKGlzc3VlUmVxdWVzdCwgKF96LCB6KSA9PiBzZXR1cEVkaXRvcih6KSlcbiAgICAgICAgICAgIC50b1Byb21pc2UoKTtcbiAgICB9XG4gICAgcmV0dXJuIGF0b20ud29ya3NwYWNlLmFkZE9wZW5lcigodXJpKSA9PiB7XG4gICAgICAgIGlmIChzdGFydHNXaXRoKHVyaSwgbWV0YWRhdGFVcmkpKSB7XG4gICAgICAgICAgICBjb25zdCB1cmwgPSB1cmkuc3Vic3RyKG1ldGFkYXRhVXJpLmxlbmd0aCk7XG4gICAgICAgICAgICBjb25zdCBbYXNzZW1ibHlOYW1lLCB0eXBlTmFtZV0gPSB1cmwuc3BsaXQoXCIvXCIpO1xuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZUVkaXRvclZpZXcoYXNzZW1ibHlOYW1lLCB0eXBlTmFtZSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==

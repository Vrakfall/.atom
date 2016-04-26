"use strict";

var _rxjs = require("rxjs");

var _chai = require("chai");

var _omni = require("../../lib/server/omni");

var _testHelpers = require("../test-helpers");

var _codeLens = require("../../lib/features/code-lens");

describe("Code Lens", function () {
    (0, _testHelpers.setupFeature)(["features/code-lens"]);
    _codeLens.Lens.prototype._isVisible = function () {
        return true;
    };
    it("should add code lens", function () {
        return _rxjs.Observable.zip((0, _testHelpers.openEditor)("simple/code-lens/CodeLens.cs"), _omni.Omni.listener.currentfilemembersasflat, function (x, z) {
            return [x, z];
        }).take(1).delay(300).do(function (ctx) {
            (0, _chai.expect)(ctx[1].response.length).to.be.eql(15);
        }).toPromise();
    });
    xit("should handle editor switching", function () {
        return (0, _testHelpers.openEditor)("simple/code-lens/CodeLens.cs").flatMap(function (_ref) {
            var solution = _ref.solution;
            return solution.observe.currentfilemembersasflat.take(1);
        }).delay(300).flatMap(function () {
            return (0, _testHelpers.openEditor)("simple/code-lens/CodeLens2.cs");
        }).flatMap(function (_ref2) {
            var solution = _ref2.solution;
            return solution.observe.currentfilemembersasflat.take(1);
        }).delay(300).flatMap(function () {
            return (0, _testHelpers.openEditor)("simple/code-lens/CodeLens.cs");
        }).flatMap(function (_ref3) {
            var solution = _ref3.solution;
            return solution.observe.currentfilemembersasflat.take(1);
        }, function (_ref4) {
            var editor = _ref4.editor;
            return editor;
        }).delay(1000).do(function (editor) {
            (0, _chai.expect)(editor.getDecorations().length).to.be.greaterThan(9);
        }).toPromise();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNwZWMvZmVhdHVyZXMvY29kZS1sZW5zLXNwZWMuanMiLCJzcGVjL2ZlYXR1cmVzL2NvZGUtbGVucy1zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUE7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FDR0EsU0FBUyxXQUFULEVBQXNCLFlBQUE7QUFDbEIsbUNBQWEsQ0FBQyxvQkFBRCxDQUFiO0FBRU0sbUJBQUssU0FBTCxDQUFnQixVQUFoQixHQUE2QjtBQUFBLGVBQU0sSUFBTjtBQUFBLEtBQTdCO0FBRU4sT0FBRyxzQkFBSCxFQUEyQixZQUFBO0FBQ3ZCLGVBQU8saUJBQVcsR0FBWCxDQUNILDZCQUFXLDhCQUFYLENBREcsRUFFSCxXQUFLLFFBQUwsQ0FBYyx3QkFGWCxFQUdILFVBQUMsQ0FBRCxFQUFJLENBQUo7QUFBQSxtQkFBZ0MsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFoQztBQUFBLFNBSEcsRUFLRixJQUxFLENBS0csQ0FMSCxFQU1GLEtBTkUsQ0FNSSxHQU5KLEVBT0YsRUFQRSxDQU9DLFVBQUMsR0FBRCxFQUFJO0FBQ0osOEJBQU8sSUFBSSxDQUFKLEVBQU8sUUFBUCxDQUFnQixNQUF2QixFQUErQixFQUEvQixDQUFrQyxFQUFsQyxDQUFxQyxHQUFyQyxDQUF5QyxFQUF6QztBQUNILFNBVEUsRUFVRixTQVZFLEVBQVA7QUFXSCxLQVpEO0FBY0EsUUFBSSxnQ0FBSixFQUFzQyxZQUFBO0FBQ2xDLGVBQU8sNkJBQVcsOEJBQVgsRUFDRixPQURFLENBQ007QUFBQSxnQkFBRSxRQUFGLFFBQUUsUUFBRjtBQUFBLG1CQUFnQixTQUFTLE9BQVQsQ0FBaUIsd0JBQWpCLENBQTBDLElBQTFDLENBQStDLENBQS9DLENBQWhCO0FBQUEsU0FETixFQUVGLEtBRkUsQ0FFSSxHQUZKLEVBR0YsT0FIRSxDQUdNO0FBQUEsbUJBQU0sNkJBQVcsK0JBQVgsQ0FBTjtBQUFBLFNBSE4sRUFJRixPQUpFLENBSU07QUFBQSxnQkFBRSxRQUFGLFNBQUUsUUFBRjtBQUFBLG1CQUFnQixTQUFTLE9BQVQsQ0FBaUIsd0JBQWpCLENBQTBDLElBQTFDLENBQStDLENBQS9DLENBQWhCO0FBQUEsU0FKTixFQUtGLEtBTEUsQ0FLSSxHQUxKLEVBTUYsT0FORSxDQU1NO0FBQUEsbUJBQU0sNkJBQVcsOEJBQVgsQ0FBTjtBQUFBLFNBTk4sRUFPRixPQVBFLENBT007QUFBQSxnQkFBRSxRQUFGLFNBQUUsUUFBRjtBQUFBLG1CQUFnQixTQUFTLE9BQVQsQ0FBaUIsd0JBQWpCLENBQTBDLElBQTFDLENBQStDLENBQS9DLENBQWhCO0FBQUEsU0FQTixFQU95RTtBQUFBLGdCQUFFLE1BQUYsU0FBRSxNQUFGO0FBQUEsbUJBQWMsTUFBZDtBQUFBLFNBUHpFLEVBUUYsS0FSRSxDQVFJLElBUkosRUFTRixFQVRFLENBU0MsVUFBQyxNQUFELEVBQU87QUFDUCw4QkFBTyxPQUFPLGNBQVAsR0FBd0IsTUFBL0IsRUFBdUMsRUFBdkMsQ0FBMEMsRUFBMUMsQ0FBNkMsV0FBN0MsQ0FBeUQsQ0FBekQ7QUFDSCxTQVhFLEVBWUYsU0FaRSxFQUFQO0FBYUgsS0FkRDtBQWVILENBbENEIiwiZmlsZSI6InNwZWMvZmVhdHVyZXMvY29kZS1sZW5zLXNwZWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhYmxlIH0gZnJvbSBcInJ4anNcIjtcbmltcG9ydCB7IGV4cGVjdCB9IGZyb20gXCJjaGFpXCI7XG5pbXBvcnQgeyBPbW5pIH0gZnJvbSBcIi4uLy4uL2xpYi9zZXJ2ZXIvb21uaVwiO1xuaW1wb3J0IHsgc2V0dXBGZWF0dXJlLCBvcGVuRWRpdG9yIH0gZnJvbSBcIi4uL3Rlc3QtaGVscGVyc1wiO1xuaW1wb3J0IHsgTGVucyB9IGZyb20gXCIuLi8uLi9saWIvZmVhdHVyZXMvY29kZS1sZW5zXCI7XG5kZXNjcmliZShcIkNvZGUgTGVuc1wiLCAoKSA9PiB7XG4gICAgc2V0dXBGZWF0dXJlKFtcImZlYXR1cmVzL2NvZGUtbGVuc1wiXSk7XG4gICAgTGVucy5wcm90b3R5cGUuX2lzVmlzaWJsZSA9ICgpID0+IHRydWU7XG4gICAgaXQoXCJzaG91bGQgYWRkIGNvZGUgbGVuc1wiLCAoKSA9PiB7XG4gICAgICAgIHJldHVybiBPYnNlcnZhYmxlLnppcChvcGVuRWRpdG9yKFwic2ltcGxlL2NvZGUtbGVucy9Db2RlTGVucy5jc1wiKSwgT21uaS5saXN0ZW5lci5jdXJyZW50ZmlsZW1lbWJlcnNhc2ZsYXQsICh4LCB6KSA9PiBbeCwgel0pXG4gICAgICAgICAgICAudGFrZSgxKVxuICAgICAgICAgICAgLmRlbGF5KDMwMClcbiAgICAgICAgICAgIC5kbygoY3R4KSA9PiB7XG4gICAgICAgICAgICBleHBlY3QoY3R4WzFdLnJlc3BvbnNlLmxlbmd0aCkudG8uYmUuZXFsKDE1KTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC50b1Byb21pc2UoKTtcbiAgICB9KTtcbiAgICB4aXQoXCJzaG91bGQgaGFuZGxlIGVkaXRvciBzd2l0Y2hpbmdcIiwgKCkgPT4ge1xuICAgICAgICByZXR1cm4gb3BlbkVkaXRvcihcInNpbXBsZS9jb2RlLWxlbnMvQ29kZUxlbnMuY3NcIilcbiAgICAgICAgICAgIC5mbGF0TWFwKCh7IHNvbHV0aW9uIH0pID0+IHNvbHV0aW9uLm9ic2VydmUuY3VycmVudGZpbGVtZW1iZXJzYXNmbGF0LnRha2UoMSkpXG4gICAgICAgICAgICAuZGVsYXkoMzAwKVxuICAgICAgICAgICAgLmZsYXRNYXAoKCkgPT4gb3BlbkVkaXRvcihcInNpbXBsZS9jb2RlLWxlbnMvQ29kZUxlbnMyLmNzXCIpKVxuICAgICAgICAgICAgLmZsYXRNYXAoKHsgc29sdXRpb24gfSkgPT4gc29sdXRpb24ub2JzZXJ2ZS5jdXJyZW50ZmlsZW1lbWJlcnNhc2ZsYXQudGFrZSgxKSlcbiAgICAgICAgICAgIC5kZWxheSgzMDApXG4gICAgICAgICAgICAuZmxhdE1hcCgoKSA9PiBvcGVuRWRpdG9yKFwic2ltcGxlL2NvZGUtbGVucy9Db2RlTGVucy5jc1wiKSlcbiAgICAgICAgICAgIC5mbGF0TWFwKCh7IHNvbHV0aW9uIH0pID0+IHNvbHV0aW9uLm9ic2VydmUuY3VycmVudGZpbGVtZW1iZXJzYXNmbGF0LnRha2UoMSksICh7IGVkaXRvciB9KSA9PiBlZGl0b3IpXG4gICAgICAgICAgICAuZGVsYXkoMTAwMClcbiAgICAgICAgICAgIC5kbygoZWRpdG9yKSA9PiB7XG4gICAgICAgICAgICBleHBlY3QoZWRpdG9yLmdldERlY29yYXRpb25zKCkubGVuZ3RoKS50by5iZS5ncmVhdGVyVGhhbig5KTtcbiAgICAgICAgfSlcbiAgICAgICAgICAgIC50b1Byb21pc2UoKTtcbiAgICB9KTtcbn0pO1xuIiwiaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tIFwicnhqc1wiO1xuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL3RzZC5kLnRzXCIgLz5cbmltcG9ydCB7ZXhwZWN0fSBmcm9tIFwiY2hhaVwiO1xuaW1wb3J0IHtPbW5pfSBmcm9tIFwiLi4vLi4vbGliL3NlcnZlci9vbW5pXCI7XG5pbXBvcnQge3NldHVwRmVhdHVyZSwgb3BlbkVkaXRvcn0gZnJvbSBcIi4uL3Rlc3QtaGVscGVyc1wiO1xuaW1wb3J0IHtMZW5zfSBmcm9tIFwiLi4vLi4vbGliL2ZlYXR1cmVzL2NvZGUtbGVuc1wiO1xuXG5kZXNjcmliZShcIkNvZGUgTGVuc1wiLCAoKSA9PiB7XG4gICAgc2V0dXBGZWF0dXJlKFtcImZlYXR1cmVzL2NvZGUtbGVuc1wiXSk7XG5cbiAgICAoPGFueT5MZW5zLnByb3RvdHlwZSkuX2lzVmlzaWJsZSA9ICgpID0+IHRydWU7XG5cbiAgICBpdChcInNob3VsZCBhZGQgY29kZSBsZW5zXCIsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIE9ic2VydmFibGUuemlwKFxuICAgICAgICAgICAgb3BlbkVkaXRvcihcInNpbXBsZS9jb2RlLWxlbnMvQ29kZUxlbnMuY3NcIiksXG4gICAgICAgICAgICBPbW5pLmxpc3RlbmVyLmN1cnJlbnRmaWxlbWVtYmVyc2FzZmxhdCxcbiAgICAgICAgICAgICh4LCB6KSA9PiA8W3R5cGVvZiB4LCB0eXBlb2Ygel0+W3gsIHpdXG4gICAgICAgIClcbiAgICAgICAgICAgIC50YWtlKDEpXG4gICAgICAgICAgICAuZGVsYXkoMzAwKVxuICAgICAgICAgICAgLmRvKChjdHgpID0+IHtcbiAgICAgICAgICAgICAgICBleHBlY3QoY3R4WzFdLnJlc3BvbnNlLmxlbmd0aCkudG8uYmUuZXFsKDE1KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudG9Qcm9taXNlKCk7XG4gICAgfSk7XG5cbiAgICB4aXQoXCJzaG91bGQgaGFuZGxlIGVkaXRvciBzd2l0Y2hpbmdcIiwgKCkgPT4ge1xuICAgICAgICByZXR1cm4gb3BlbkVkaXRvcihcInNpbXBsZS9jb2RlLWxlbnMvQ29kZUxlbnMuY3NcIilcbiAgICAgICAgICAgIC5mbGF0TWFwKCh7c29sdXRpb259KSA9PiBzb2x1dGlvbi5vYnNlcnZlLmN1cnJlbnRmaWxlbWVtYmVyc2FzZmxhdC50YWtlKDEpKVxuICAgICAgICAgICAgLmRlbGF5KDMwMClcbiAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IG9wZW5FZGl0b3IoXCJzaW1wbGUvY29kZS1sZW5zL0NvZGVMZW5zMi5jc1wiKSlcbiAgICAgICAgICAgIC5mbGF0TWFwKCh7c29sdXRpb259KSA9PiBzb2x1dGlvbi5vYnNlcnZlLmN1cnJlbnRmaWxlbWVtYmVyc2FzZmxhdC50YWtlKDEpKVxuICAgICAgICAgICAgLmRlbGF5KDMwMClcbiAgICAgICAgICAgIC5mbGF0TWFwKCgpID0+IG9wZW5FZGl0b3IoXCJzaW1wbGUvY29kZS1sZW5zL0NvZGVMZW5zLmNzXCIpKVxuICAgICAgICAgICAgLmZsYXRNYXAoKHtzb2x1dGlvbn0pID0+IHNvbHV0aW9uLm9ic2VydmUuY3VycmVudGZpbGVtZW1iZXJzYXNmbGF0LnRha2UoMSksICh7ZWRpdG9yfSkgPT4gZWRpdG9yKVxuICAgICAgICAgICAgLmRlbGF5KDEwMDApXG4gICAgICAgICAgICAuZG8oKGVkaXRvcikgPT4ge1xuICAgICAgICAgICAgICAgIGV4cGVjdChlZGl0b3IuZ2V0RGVjb3JhdGlvbnMoKS5sZW5ndGgpLnRvLmJlLmdyZWF0ZXJUaGFuKDkpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50b1Byb21pc2UoKTtcbiAgICB9KTtcbn0pO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
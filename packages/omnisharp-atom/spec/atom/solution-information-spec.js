"use strict";

var _chai = require("chai");

var _omnisharpClient = require("omnisharp-client");

var _testHelpers = require("../test-helpers");

describe("Solution Information", function () {
    (0, _testHelpers.setupFeature)(["atom/solution-information"]);
    it("adds commands", function () {
        var disposable = new _omnisharpClient.CompositeDisposable();
        var commands = atom.commands;
        (0, _chai.expect)(commands.registeredCommands["omnisharp-atom:next-solution-status"]).to.be.true;
        (0, _chai.expect)(commands.registeredCommands["omnisharp-atom:solution-status"]).to.be.true;
        (0, _chai.expect)(commands.registeredCommands["omnisharp-atom:previous-solution-status"]).to.be.true;
        (0, _chai.expect)(commands.registeredCommands["omnisharp-atom:stop-server"]).to.be.true;
        (0, _chai.expect)(commands.registeredCommands["omnisharp-atom:start-server"]).to.be.true;
        (0, _chai.expect)(commands.registeredCommands["omnisharp-atom:restart-server"]).to.be.true;
        disposable.dispose();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNwZWMvYXRvbS9zb2x1dGlvbi1pbmZvcm1hdGlvbi1zcGVjLmpzIiwic3BlYy9hdG9tL3NvbHV0aW9uLWluZm9ybWF0aW9uLXNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFDQTs7QUFDQTs7QUNHQSxTQUFTLHNCQUFULEVBQWlDLFlBQUE7QUFDN0IsbUNBQWEsQ0FBQywyQkFBRCxDQUFiO0FBRUEsT0FBRyxlQUFILEVBQW9CLFlBQUE7QUFDaEIsWUFBTSxhQUFhLDBDQUFuQjtBQUVBLFlBQU0sV0FBZ0IsS0FBSyxRQUEzQjtBQUVBLDBCQUFPLFNBQVMsa0JBQVQsQ0FBNEIscUNBQTVCLENBQVAsRUFBMkUsRUFBM0UsQ0FBOEUsRUFBOUUsQ0FBaUYsSUFBakY7QUFDQSwwQkFBTyxTQUFTLGtCQUFULENBQTRCLGdDQUE1QixDQUFQLEVBQXNFLEVBQXRFLENBQXlFLEVBQXpFLENBQTRFLElBQTVFO0FBQ0EsMEJBQU8sU0FBUyxrQkFBVCxDQUE0Qix5Q0FBNUIsQ0FBUCxFQUErRSxFQUEvRSxDQUFrRixFQUFsRixDQUFxRixJQUFyRjtBQUNBLDBCQUFPLFNBQVMsa0JBQVQsQ0FBNEIsNEJBQTVCLENBQVAsRUFBa0UsRUFBbEUsQ0FBcUUsRUFBckUsQ0FBd0UsSUFBeEU7QUFDQSwwQkFBTyxTQUFTLGtCQUFULENBQTRCLDZCQUE1QixDQUFQLEVBQW1FLEVBQW5FLENBQXNFLEVBQXRFLENBQXlFLElBQXpFO0FBQ0EsMEJBQU8sU0FBUyxrQkFBVCxDQUE0QiwrQkFBNUIsQ0FBUCxFQUFxRSxFQUFyRSxDQUF3RSxFQUF4RSxDQUEyRSxJQUEzRTtBQUNBLG1CQUFXLE9BQVg7QUFDSCxLQVpEO0FBZUgsQ0FsQkQiLCJmaWxlIjoic3BlYy9hdG9tL3NvbHV0aW9uLWluZm9ybWF0aW9uLXNwZWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleHBlY3QgfSBmcm9tIFwiY2hhaVwiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBzZXR1cEZlYXR1cmUgfSBmcm9tIFwiLi4vdGVzdC1oZWxwZXJzXCI7XG5kZXNjcmliZShcIlNvbHV0aW9uIEluZm9ybWF0aW9uXCIsICgpID0+IHtcbiAgICBzZXR1cEZlYXR1cmUoW1wiYXRvbS9zb2x1dGlvbi1pbmZvcm1hdGlvblwiXSk7XG4gICAgaXQoXCJhZGRzIGNvbW1hbmRzXCIsICgpID0+IHtcbiAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGNvbnN0IGNvbW1hbmRzID0gYXRvbS5jb21tYW5kcztcbiAgICAgICAgZXhwZWN0KGNvbW1hbmRzLnJlZ2lzdGVyZWRDb21tYW5kc1tcIm9tbmlzaGFycC1hdG9tOm5leHQtc29sdXRpb24tc3RhdHVzXCJdKS50by5iZS50cnVlO1xuICAgICAgICBleHBlY3QoY29tbWFuZHMucmVnaXN0ZXJlZENvbW1hbmRzW1wib21uaXNoYXJwLWF0b206c29sdXRpb24tc3RhdHVzXCJdKS50by5iZS50cnVlO1xuICAgICAgICBleHBlY3QoY29tbWFuZHMucmVnaXN0ZXJlZENvbW1hbmRzW1wib21uaXNoYXJwLWF0b206cHJldmlvdXMtc29sdXRpb24tc3RhdHVzXCJdKS50by5iZS50cnVlO1xuICAgICAgICBleHBlY3QoY29tbWFuZHMucmVnaXN0ZXJlZENvbW1hbmRzW1wib21uaXNoYXJwLWF0b206c3RvcC1zZXJ2ZXJcIl0pLnRvLmJlLnRydWU7XG4gICAgICAgIGV4cGVjdChjb21tYW5kcy5yZWdpc3RlcmVkQ29tbWFuZHNbXCJvbW5pc2hhcnAtYXRvbTpzdGFydC1zZXJ2ZXJcIl0pLnRvLmJlLnRydWU7XG4gICAgICAgIGV4cGVjdChjb21tYW5kcy5yZWdpc3RlcmVkQ29tbWFuZHNbXCJvbW5pc2hhcnAtYXRvbTpyZXN0YXJ0LXNlcnZlclwiXSkudG8uYmUudHJ1ZTtcbiAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfSk7XG59KTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90c2QuZC50c1wiIC8+XG5pbXBvcnQge2V4cGVjdH0gZnJvbSBcImNoYWlcIjtcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7c2V0dXBGZWF0dXJlfSBmcm9tIFwiLi4vdGVzdC1oZWxwZXJzXCI7XG5cbmRlc2NyaWJlKFwiU29sdXRpb24gSW5mb3JtYXRpb25cIiwgKCkgPT4ge1xuICAgIHNldHVwRmVhdHVyZShbXCJhdG9tL3NvbHV0aW9uLWluZm9ybWF0aW9uXCJdKTtcblxuICAgIGl0KFwiYWRkcyBjb21tYW5kc1wiLCAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGRpc3Bvc2FibGUgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpO1xuXG4gICAgICAgIGNvbnN0IGNvbW1hbmRzOiBhbnkgPSBhdG9tLmNvbW1hbmRzO1xuXG4gICAgICAgIGV4cGVjdChjb21tYW5kcy5yZWdpc3RlcmVkQ29tbWFuZHNbXCJvbW5pc2hhcnAtYXRvbTpuZXh0LXNvbHV0aW9uLXN0YXR1c1wiXSkudG8uYmUudHJ1ZTtcbiAgICAgICAgZXhwZWN0KGNvbW1hbmRzLnJlZ2lzdGVyZWRDb21tYW5kc1tcIm9tbmlzaGFycC1hdG9tOnNvbHV0aW9uLXN0YXR1c1wiXSkudG8uYmUudHJ1ZTtcbiAgICAgICAgZXhwZWN0KGNvbW1hbmRzLnJlZ2lzdGVyZWRDb21tYW5kc1tcIm9tbmlzaGFycC1hdG9tOnByZXZpb3VzLXNvbHV0aW9uLXN0YXR1c1wiXSkudG8uYmUudHJ1ZTtcbiAgICAgICAgZXhwZWN0KGNvbW1hbmRzLnJlZ2lzdGVyZWRDb21tYW5kc1tcIm9tbmlzaGFycC1hdG9tOnN0b3Atc2VydmVyXCJdKS50by5iZS50cnVlO1xuICAgICAgICBleHBlY3QoY29tbWFuZHMucmVnaXN0ZXJlZENvbW1hbmRzW1wib21uaXNoYXJwLWF0b206c3RhcnQtc2VydmVyXCJdKS50by5iZS50cnVlO1xuICAgICAgICBleHBlY3QoY29tbWFuZHMucmVnaXN0ZXJlZENvbW1hbmRzW1wib21uaXNoYXJwLWF0b206cmVzdGFydC1zZXJ2ZXJcIl0pLnRvLmJlLnRydWU7XG4gICAgICAgIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICAgIH0pO1xuXG4gICAgLy8gVE9ETzogVGVzdCBmdW5jdGlvbmFsaXR5XG59KTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
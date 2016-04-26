"use strict";

var _chai = require("chai");

var _omnisharpClient = require("omnisharp-client");

var _testHelpers = require("../test-helpers");

describe("Go To Definition", function () {
    (0, _testHelpers.setupFeature)(["features/go-to-definition"]);
    it("adds commands", function () {
        var disposable = new _omnisharpClient.CompositeDisposable();
        var commands = atom.commands;
        (0, _chai.expect)(commands.registeredCommands["omnisharp-atom:go-to-definition"]).to.be.true;
        disposable.dispose();
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNwZWMvZmVhdHVyZXMvZ28tdG8tZGVmaW5pdGlvbi1zcGVjLmpzIiwic3BlYy9mZWF0dXJlcy9nby10by1kZWZpbml0aW9uLXNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7QUFDQTs7QUFDQTs7QUNHQSxTQUFTLGtCQUFULEVBQTZCLFlBQUE7QUFDekIsbUNBQWEsQ0FBQywyQkFBRCxDQUFiO0FBRUEsT0FBRyxlQUFILEVBQW9CLFlBQUE7QUFDaEIsWUFBTSxhQUFhLDBDQUFuQjtBQUNBLFlBQU0sV0FBZ0IsS0FBSyxRQUEzQjtBQUVBLDBCQUFPLFNBQVMsa0JBQVQsQ0FBNEIsaUNBQTVCLENBQVAsRUFBdUUsRUFBdkUsQ0FBMEUsRUFBMUUsQ0FBNkUsSUFBN0U7QUFDQSxtQkFBVyxPQUFYO0FBQ0gsS0FORDtBQVNILENBWkQiLCJmaWxlIjoic3BlYy9mZWF0dXJlcy9nby10by1kZWZpbml0aW9uLXNwZWMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleHBlY3QgfSBmcm9tIFwiY2hhaVwiO1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQgeyBzZXR1cEZlYXR1cmUgfSBmcm9tIFwiLi4vdGVzdC1oZWxwZXJzXCI7XG5kZXNjcmliZShcIkdvIFRvIERlZmluaXRpb25cIiwgKCkgPT4ge1xuICAgIHNldHVwRmVhdHVyZShbXCJmZWF0dXJlcy9nby10by1kZWZpbml0aW9uXCJdKTtcbiAgICBpdChcImFkZHMgY29tbWFuZHNcIiwgKCkgPT4ge1xuICAgICAgICBjb25zdCBkaXNwb3NhYmxlID0gbmV3IENvbXBvc2l0ZURpc3Bvc2FibGUoKTtcbiAgICAgICAgY29uc3QgY29tbWFuZHMgPSBhdG9tLmNvbW1hbmRzO1xuICAgICAgICBleHBlY3QoY29tbWFuZHMucmVnaXN0ZXJlZENvbW1hbmRzW1wib21uaXNoYXJwLWF0b206Z28tdG8tZGVmaW5pdGlvblwiXSkudG8uYmUudHJ1ZTtcbiAgICAgICAgZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gICAgfSk7XG59KTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi90c2QuZC50c1wiIC8+XG5pbXBvcnQge2V4cGVjdH0gZnJvbSBcImNoYWlcIjtcbmltcG9ydCB7Q29tcG9zaXRlRGlzcG9zYWJsZX0gZnJvbSBcIm9tbmlzaGFycC1jbGllbnRcIjtcbmltcG9ydCB7c2V0dXBGZWF0dXJlfSBmcm9tIFwiLi4vdGVzdC1oZWxwZXJzXCI7XG5cbmRlc2NyaWJlKFwiR28gVG8gRGVmaW5pdGlvblwiLCAoKSA9PiB7XG4gICAgc2V0dXBGZWF0dXJlKFtcImZlYXR1cmVzL2dvLXRvLWRlZmluaXRpb25cIl0pO1xuXG4gICAgaXQoXCJhZGRzIGNvbW1hbmRzXCIsICgpID0+IHtcbiAgICAgICAgY29uc3QgZGlzcG9zYWJsZSA9IG5ldyBDb21wb3NpdGVEaXNwb3NhYmxlKCk7XG4gICAgICAgIGNvbnN0IGNvbW1hbmRzOiBhbnkgPSBhdG9tLmNvbW1hbmRzO1xuXG4gICAgICAgIGV4cGVjdChjb21tYW5kcy5yZWdpc3RlcmVkQ29tbWFuZHNbXCJvbW5pc2hhcnAtYXRvbTpnby10by1kZWZpbml0aW9uXCJdKS50by5iZS50cnVlO1xuICAgICAgICBkaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgICB9KTtcblxuICAgIC8vIFRPRE86IFRlc3QgZnVuY3Rpb25hbGl0eVxufSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
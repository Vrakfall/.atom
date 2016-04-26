"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SolutionAggregateObserver = exports.SolutionObserver = undefined;

var _omnisharpClient = require("omnisharp-client");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SolutionObserver = exports.SolutionObserver = function (_ObservationClientV) {
    _inherits(SolutionObserver, _ObservationClientV);

    function SolutionObserver() {
        var solutions = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

        _classCallCheck(this, SolutionObserver);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(SolutionObserver).call(this, solutions));

        _this.model = {
            codecheck: _this.makeMergeObserable(function (solution) {
                return solution.model.observe.codecheck;
            }),
            output: _this.makeMergeObserable(function (solution) {
                return solution.model.observe.output;
            }),
            status: _this.makeMergeObserable(function (solution) {
                return solution.model.observe.status;
            }),
            state: _this.makeMergeObserable(function (solution) {
                return solution.model.observe.state;
            }),
            projectAdded: _this.makeMergeObserable(function (solution) {
                return solution.model.observe.projectAdded;
            }),
            projectRemoved: _this.makeMergeObserable(function (solution) {
                return solution.model.observe.projectRemoved;
            }),
            projectChanged: _this.makeMergeObserable(function (solution) {
                return solution.model.observe.projectChanged;
            }),
            projects: _this.makeMergeObserable(function (solution) {
                return solution.model.observe.projects;
            })
        };
        return _this;
    }

    return SolutionObserver;
}(_omnisharpClient.ObservationClientV2);

var SolutionAggregateObserver = exports.SolutionAggregateObserver = function (_AggregateClientV) {
    _inherits(SolutionAggregateObserver, _AggregateClientV);

    function SolutionAggregateObserver() {
        _classCallCheck(this, SolutionAggregateObserver);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(SolutionAggregateObserver).apply(this, arguments));
    }

    return SolutionAggregateObserver;
}(_omnisharpClient.AggregateClientV2);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9zZXJ2ZXIvY29tcG9zaXRlLXNvbHV0aW9uLmpzIiwibGliL3NlcnZlci9jb21wb3NpdGUtc29sdXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQUFBOzs7Ozs7OztJQ0lBLGdCLFdBQUEsZ0I7OztBQUdJLGdDQUFzQztBQUFBLFlBQTFCLFNBQTBCLHlEQUFGLEVBQUU7O0FBQUE7O0FBQUEsd0dBQzVCLFNBRDRCOztBQUdsQyxjQUFLLEtBQUwsR0FBYTtBQUNULHVCQUFXLE1BQUssa0JBQUwsQ0FBd0IsVUFBQyxRQUFEO0FBQUEsdUJBQXdCLFNBQVMsS0FBVCxDQUFlLE9BQWYsQ0FBdUIsU0FBL0M7QUFBQSxhQUF4QixDQURGO0FBRVQsb0JBQVEsTUFBSyxrQkFBTCxDQUF3QixVQUFDLFFBQUQ7QUFBQSx1QkFBd0IsU0FBUyxLQUFULENBQWUsT0FBZixDQUF1QixNQUEvQztBQUFBLGFBQXhCLENBRkM7QUFHVCxvQkFBUSxNQUFLLGtCQUFMLENBQXdCLFVBQUMsUUFBRDtBQUFBLHVCQUF3QixTQUFTLEtBQVQsQ0FBZSxPQUFmLENBQXVCLE1BQS9DO0FBQUEsYUFBeEIsQ0FIQztBQUlULG1CQUFPLE1BQUssa0JBQUwsQ0FBd0IsVUFBQyxRQUFEO0FBQUEsdUJBQXdCLFNBQVMsS0FBVCxDQUFlLE9BQWYsQ0FBdUIsS0FBL0M7QUFBQSxhQUF4QixDQUpFO0FBS1QsMEJBQWMsTUFBSyxrQkFBTCxDQUF3QixVQUFDLFFBQUQ7QUFBQSx1QkFBd0IsU0FBUyxLQUFULENBQWUsT0FBZixDQUF1QixZQUEvQztBQUFBLGFBQXhCLENBTEw7QUFNVCw0QkFBZ0IsTUFBSyxrQkFBTCxDQUF3QixVQUFDLFFBQUQ7QUFBQSx1QkFBd0IsU0FBUyxLQUFULENBQWUsT0FBZixDQUF1QixjQUEvQztBQUFBLGFBQXhCLENBTlA7QUFPVCw0QkFBZ0IsTUFBSyxrQkFBTCxDQUF3QixVQUFDLFFBQUQ7QUFBQSx1QkFBd0IsU0FBUyxLQUFULENBQWUsT0FBZixDQUF1QixjQUEvQztBQUFBLGFBQXhCLENBUFA7QUFRVCxzQkFBVSxNQUFLLGtCQUFMLENBQXdCLFVBQUMsUUFBRDtBQUFBLHVCQUF3QixTQUFTLEtBQVQsQ0FBZSxPQUFmLENBQXVCLFFBQS9DO0FBQUEsYUFBeEI7QUFSRCxTQUFiO0FBSGtDO0FBYXJDOzs7OztJQUdMLHlCLFdBQUEseUIiLCJmaWxlIjoibGliL3NlcnZlci9jb21wb3NpdGUtc29sdXRpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBPYnNlcnZhdGlvbkNsaWVudFYyLCBBZ2dyZWdhdGVDbGllbnRWMiB9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5leHBvcnQgY2xhc3MgU29sdXRpb25PYnNlcnZlciBleHRlbmRzIE9ic2VydmF0aW9uQ2xpZW50VjIge1xuICAgIGNvbnN0cnVjdG9yKHNvbHV0aW9ucyA9IFtdKSB7XG4gICAgICAgIHN1cGVyKHNvbHV0aW9ucyk7XG4gICAgICAgIHRoaXMubW9kZWwgPSB7XG4gICAgICAgICAgICBjb2RlY2hlY2s6IHRoaXMubWFrZU1lcmdlT2JzZXJhYmxlKChzb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5jb2RlY2hlY2spLFxuICAgICAgICAgICAgb3V0cHV0OiB0aGlzLm1ha2VNZXJnZU9ic2VyYWJsZSgoc29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUub3V0cHV0KSxcbiAgICAgICAgICAgIHN0YXR1czogdGhpcy5tYWtlTWVyZ2VPYnNlcmFibGUoKHNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnN0YXR1cyksXG4gICAgICAgICAgICBzdGF0ZTogdGhpcy5tYWtlTWVyZ2VPYnNlcmFibGUoKHNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnN0YXRlKSxcbiAgICAgICAgICAgIHByb2plY3RBZGRlZDogdGhpcy5tYWtlTWVyZ2VPYnNlcmFibGUoKHNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RBZGRlZCksXG4gICAgICAgICAgICBwcm9qZWN0UmVtb3ZlZDogdGhpcy5tYWtlTWVyZ2VPYnNlcmFibGUoKHNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RSZW1vdmVkKSxcbiAgICAgICAgICAgIHByb2plY3RDaGFuZ2VkOiB0aGlzLm1ha2VNZXJnZU9ic2VyYWJsZSgoc29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUucHJvamVjdENoYW5nZWQpLFxuICAgICAgICAgICAgcHJvamVjdHM6IHRoaXMubWFrZU1lcmdlT2JzZXJhYmxlKChzb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0cylcbiAgICAgICAgfTtcbiAgICB9XG59XG5leHBvcnQgY2xhc3MgU29sdXRpb25BZ2dyZWdhdGVPYnNlcnZlciBleHRlbmRzIEFnZ3JlZ2F0ZUNsaWVudFYyIHtcbn1cbiIsImltcG9ydCB7T2JzZXJ2YXRpb25DbGllbnRWMiwgQWdncmVnYXRlQ2xpZW50VjJ9IGZyb20gXCJvbW5pc2hhcnAtY2xpZW50XCI7XG5pbXBvcnQge1NvbHV0aW9ufSBmcm9tIFwiLi9zb2x1dGlvblwiO1xuaW1wb3J0IHtWaWV3TW9kZWx9IGZyb20gXCIuL3ZpZXctbW9kZWxcIjtcblxuZXhwb3J0IGNsYXNzIFNvbHV0aW9uT2JzZXJ2ZXIgZXh0ZW5kcyBPYnNlcnZhdGlvbkNsaWVudFYyPFNvbHV0aW9uPiB7XG4gICAgcHVibGljIG1vZGVsOiB0eXBlb2YgVmlld01vZGVsLnByb3RvdHlwZS5vYnNlcnZlO1xuXG4gICAgY29uc3RydWN0b3Ioc29sdXRpb25zOiBTb2x1dGlvbltdID0gW10pIHtcbiAgICAgICAgc3VwZXIoc29sdXRpb25zKTtcblxuICAgICAgICB0aGlzLm1vZGVsID0ge1xuICAgICAgICAgICAgY29kZWNoZWNrOiB0aGlzLm1ha2VNZXJnZU9ic2VyYWJsZSgoc29sdXRpb246IFNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLmNvZGVjaGVjayksXG4gICAgICAgICAgICBvdXRwdXQ6IHRoaXMubWFrZU1lcmdlT2JzZXJhYmxlKChzb2x1dGlvbjogU29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUub3V0cHV0KSxcbiAgICAgICAgICAgIHN0YXR1czogdGhpcy5tYWtlTWVyZ2VPYnNlcmFibGUoKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5zdGF0dXMpLFxuICAgICAgICAgICAgc3RhdGU6IHRoaXMubWFrZU1lcmdlT2JzZXJhYmxlKChzb2x1dGlvbjogU29sdXRpb24pID0+IHNvbHV0aW9uLm1vZGVsLm9ic2VydmUuc3RhdGUpLFxuICAgICAgICAgICAgcHJvamVjdEFkZGVkOiB0aGlzLm1ha2VNZXJnZU9ic2VyYWJsZSgoc29sdXRpb246IFNvbHV0aW9uKSA9PiBzb2x1dGlvbi5tb2RlbC5vYnNlcnZlLnByb2plY3RBZGRlZCksXG4gICAgICAgICAgICBwcm9qZWN0UmVtb3ZlZDogdGhpcy5tYWtlTWVyZ2VPYnNlcmFibGUoKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0UmVtb3ZlZCksXG4gICAgICAgICAgICBwcm9qZWN0Q2hhbmdlZDogdGhpcy5tYWtlTWVyZ2VPYnNlcmFibGUoKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0Q2hhbmdlZCksXG4gICAgICAgICAgICBwcm9qZWN0czogdGhpcy5tYWtlTWVyZ2VPYnNlcmFibGUoKHNvbHV0aW9uOiBTb2x1dGlvbikgPT4gc29sdXRpb24ubW9kZWwub2JzZXJ2ZS5wcm9qZWN0cylcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTb2x1dGlvbkFnZ3JlZ2F0ZU9ic2VydmVyIGV4dGVuZHMgQWdncmVnYXRlQ2xpZW50VjI8U29sdXRpb24+IHsgfVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

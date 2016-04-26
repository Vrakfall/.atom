"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.bufferFor = bufferFor;

var _Subscriber2 = require("rxjs/Subscriber");

var _async = require("rxjs/scheduler/async");

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function bufferFor(observable, bufferDuration) {
    var scheduler = arguments.length <= 2 || arguments[2] === undefined ? _async.async : arguments[2];

    return observable.lift(new BufferForOperator(bufferDuration, scheduler));
}

var BufferForOperator = function () {
    function BufferForOperator(bufferDuration, scheduler) {
        _classCallCheck(this, BufferForOperator);

        this.bufferDuration = bufferDuration;
        this.scheduler = scheduler;
    }

    _createClass(BufferForOperator, [{
        key: "call",
        value: function call(subscriber) {
            return new BufferForSubscriber(subscriber, this.bufferDuration, this.scheduler);
        }
    }]);

    return BufferForOperator;
}();

var BufferForSubscriber = function (_Subscriber) {
    _inherits(BufferForSubscriber, _Subscriber);

    function BufferForSubscriber(destination, bufferDuration, scheduler) {
        _classCallCheck(this, BufferForSubscriber);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(BufferForSubscriber).call(this, destination));

        _this.bufferDuration = bufferDuration;
        _this.scheduler = scheduler;
        _this.buffer = [];
        _this.open = false;
        return _this;
    }

    _createClass(BufferForSubscriber, [{
        key: "_next",
        value: function _next(value) {
            if (!this.open) {
                this.openBuffer();
            }
            this.buffer.push(value);
        }
    }, {
        key: "_complete",
        value: function _complete() {
            var buffer = this.buffer;
            if (buffer) {
                this.destination.next(buffer);
            }
            _get(Object.getPrototypeOf(BufferForSubscriber.prototype), "_complete", this).call(this);
        }
    }, {
        key: "_unsubscribe",
        value: function _unsubscribe() {
            this.buffer = null;
        }
    }, {
        key: "closeBuffer",
        value: function closeBuffer() {
            this.open = false;
            var buffer = this.buffer;
            if (this.buffer) {
                this.destination.next(buffer);
            }
            this.buffer = [];
        }
    }, {
        key: "openBuffer",
        value: function openBuffer() {
            var _this2 = this;

            var schedule = this.scheduler.schedule(function () {
                _this2.remove(schedule);
                _this2.closeBuffer();
            }, this.bufferDuration);
            this.add(schedule);
            this.open = true;
        }
    }]);

    return BufferForSubscriber;
}(_Subscriber2.Subscriber);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9vcGVyYXRvcnMvYnVmZmVyRm9yLnRzIiwibGliL29wZXJhdG9ycy9idWZmZXJGb3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztRQU1BLFMsR0FBQSxTOztBQ05BOztBQUNBOzs7Ozs7OztBREtBLFNBQUEsU0FBQSxDQUE2QixVQUE3QixFQUF3RCxjQUF4RCxFQUFpRztBQUFBLFFBQWpCLFNBQWlCOztBQUM3RixXQUFPLFdBQVcsSUFBWCxDQUFnQixJQUFJLGlCQUFKLENBQXlCLGNBQXpCLEVBQXlDLFNBQXpDLENBQWhCLENBQVA7QUFDSDs7SUFFRCxpQjtBQUNJLCtCQUFvQixjQUFwQixFQUFvRCxTQUFwRCxFQUF3RTtBQUFBOztBQUFwRCxhQUFBLGNBQUEsR0FBQSxjQUFBO0FBQWdDLGFBQUEsU0FBQSxHQUFBLFNBQUE7QUFDbkQ7Ozs7NkJBRVcsVSxFQUEyQjtBQUNuQyxtQkFBTyxJQUFJLG1CQUFKLENBQXdCLFVBQXhCLEVBQW9DLEtBQUssY0FBekMsRUFBeUQsS0FBSyxTQUE5RCxDQUFQO0FBQ0g7Ozs7OztJQUdMLG1COzs7QUFJSSxpQ0FBWSxXQUFaLEVBQWtELGNBQWxELEVBQWtGLFNBQWxGLEVBQXNHO0FBQUE7O0FBQUEsMkdBQzVGLFdBRDRGOztBQUFwRCxjQUFBLGNBQUEsR0FBQSxjQUFBO0FBQWdDLGNBQUEsU0FBQSxHQUFBLFNBQUE7QUFIMUUsY0FBQSxNQUFBLEdBQWMsRUFBZDtBQUNBLGNBQUEsSUFBQSxHQUFPLEtBQVA7QUFFOEY7QUFFckc7Ozs7OEJBRWUsSyxFQUFRO0FBQ3BCLGdCQUFJLENBQUMsS0FBSyxJQUFWLEVBQWdCO0FBQ1oscUJBQUssVUFBTDtBQUNIO0FBQ0QsaUJBQUssTUFBTCxDQUFZLElBQVosQ0FBaUIsS0FBakI7QUFDSDs7O29DQUVrQjtBQUNmLGdCQUFNLFNBQVMsS0FBSyxNQUFwQjtBQUNBLGdCQUFJLE1BQUosRUFBWTtBQUNSLHFCQUFLLFdBQUwsQ0FBaUIsSUFBakIsQ0FBc0IsTUFBdEI7QUFDSDtBQUNEO0FBQ0g7Ozt1Q0FFcUI7QUFDbEIsaUJBQUssTUFBTCxHQUFjLElBQWQ7QUFDSDs7O3NDQUVpQjtBQUNkLGlCQUFLLElBQUwsR0FBWSxLQUFaO0FBRUEsZ0JBQU0sU0FBUyxLQUFLLE1BQXBCO0FBQ0EsZ0JBQUksS0FBSyxNQUFULEVBQWlCO0FBQ2IscUJBQUssV0FBTCxDQUFpQixJQUFqQixDQUFzQixNQUF0QjtBQUNIO0FBRUQsaUJBQUssTUFBTCxHQUFjLEVBQWQ7QUFDSDs7O3FDQUVnQjtBQUFBOztBQUNiLGdCQUFNLFdBQVcsS0FBSyxTQUFMLENBQWUsUUFBZixDQUF3QixZQUFBO0FBQ3JDLHVCQUFLLE1BQUwsQ0FBWSxRQUFaO0FBQ0EsdUJBQUssV0FBTDtBQUNILGFBSGdCLEVBR2QsS0FBSyxjQUhTLENBQWpCO0FBSUEsaUJBQUssR0FBTCxDQUFTLFFBQVQ7QUFFQSxpQkFBSyxJQUFMLEdBQVksSUFBWjtBQUNIIiwiZmlsZSI6ImxpYi9vcGVyYXRvcnMvYnVmZmVyRm9yLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtPcGVyYXRvcn0gZnJvbSBcInJ4anMvT3BlcmF0b3JcIjtcbmltcG9ydCB7U3Vic2NyaWJlcn0gZnJvbSBcInJ4anMvU3Vic2NyaWJlclwiO1xuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tIFwicnhqcy9PYnNlcnZhYmxlXCI7XG5pbXBvcnQge1NjaGVkdWxlcn0gZnJvbSBcInJ4anMvU2NoZWR1bGVyXCI7XG5pbXBvcnQge2FzeW5jfSBmcm9tIFwicnhqcy9zY2hlZHVsZXIvYXN5bmNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGJ1ZmZlckZvcjxUPihvYnNlcnZhYmxlOiBPYnNlcnZhYmxlPFQ+LCBidWZmZXJEdXJhdGlvbjogbnVtYmVyLCBzY2hlZHVsZXIgPSBhc3luYyk6IE9ic2VydmFibGU8VFtdPiB7XG4gICAgcmV0dXJuIG9ic2VydmFibGUubGlmdChuZXcgQnVmZmVyRm9yT3BlcmF0b3I8VD4oYnVmZmVyRHVyYXRpb24sIHNjaGVkdWxlcikpO1xufVxuXG5jbGFzcyBCdWZmZXJGb3JPcGVyYXRvcjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFRbXT4ge1xuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYnVmZmVyRHVyYXRpb246IG51bWJlciwgcHJpdmF0ZSBzY2hlZHVsZXI6IFNjaGVkdWxlcikge1xuICAgIH1cblxuICAgIHB1YmxpYyBjYWxsKHN1YnNjcmliZXI6IFN1YnNjcmliZXI8VFtdPik6IFN1YnNjcmliZXI8VD4ge1xuICAgICAgICByZXR1cm4gbmV3IEJ1ZmZlckZvclN1YnNjcmliZXIoc3Vic2NyaWJlciwgdGhpcy5idWZmZXJEdXJhdGlvbiwgdGhpcy5zY2hlZHVsZXIpO1xuICAgIH1cbn1cblxuY2xhc3MgQnVmZmVyRm9yU3Vic2NyaWJlcjxUPiBleHRlbmRzIFN1YnNjcmliZXI8VD4ge1xuICAgIHByaXZhdGUgYnVmZmVyOiBUW10gPSBbXTtcbiAgICBwcml2YXRlIG9wZW4gPSBmYWxzZTtcblxuICAgIGNvbnN0cnVjdG9yKGRlc3RpbmF0aW9uOiBTdWJzY3JpYmVyPFRbXT4sIHByaXZhdGUgYnVmZmVyRHVyYXRpb246IG51bWJlciwgcHJpdmF0ZSBzY2hlZHVsZXI6IFNjaGVkdWxlcikge1xuICAgICAgICBzdXBlcihkZXN0aW5hdGlvbik7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF9uZXh0KHZhbHVlOiBUKSB7XG4gICAgICAgIGlmICghdGhpcy5vcGVuKSB7XG4gICAgICAgICAgICB0aGlzLm9wZW5CdWZmZXIoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmJ1ZmZlci5wdXNoKHZhbHVlKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgX2NvbXBsZXRlKCkge1xuICAgICAgICBjb25zdCBidWZmZXIgPSB0aGlzLmJ1ZmZlcjtcbiAgICAgICAgaWYgKGJ1ZmZlcikge1xuICAgICAgICAgICAgdGhpcy5kZXN0aW5hdGlvbi5uZXh0KGJ1ZmZlcik7XG4gICAgICAgIH1cbiAgICAgICAgc3VwZXIuX2NvbXBsZXRlKCk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIF91bnN1YnNjcmliZSgpIHtcbiAgICAgICAgdGhpcy5idWZmZXIgPSBudWxsO1xuICAgIH1cblxuICAgIHB1YmxpYyBjbG9zZUJ1ZmZlcigpIHtcbiAgICAgICAgdGhpcy5vcGVuID0gZmFsc2U7XG5cbiAgICAgICAgY29uc3QgYnVmZmVyID0gdGhpcy5idWZmZXI7XG4gICAgICAgIGlmICh0aGlzLmJ1ZmZlcikge1xuICAgICAgICAgICAgdGhpcy5kZXN0aW5hdGlvbi5uZXh0KGJ1ZmZlcik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmJ1ZmZlciA9IFtdO1xuICAgIH1cblxuICAgIHB1YmxpYyBvcGVuQnVmZmVyKCkge1xuICAgICAgICBjb25zdCBzY2hlZHVsZSA9IHRoaXMuc2NoZWR1bGVyLnNjaGVkdWxlKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlKHNjaGVkdWxlKTtcbiAgICAgICAgICAgIHRoaXMuY2xvc2VCdWZmZXIoKTtcbiAgICAgICAgfSwgdGhpcy5idWZmZXJEdXJhdGlvbik7XG4gICAgICAgIHRoaXMuYWRkKHNjaGVkdWxlKTtcblxuICAgICAgICB0aGlzLm9wZW4gPSB0cnVlO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IFN1YnNjcmliZXIgfSBmcm9tIFwicnhqcy9TdWJzY3JpYmVyXCI7XG5pbXBvcnQgeyBhc3luYyB9IGZyb20gXCJyeGpzL3NjaGVkdWxlci9hc3luY1wiO1xuZXhwb3J0IGZ1bmN0aW9uIGJ1ZmZlckZvcihvYnNlcnZhYmxlLCBidWZmZXJEdXJhdGlvbiwgc2NoZWR1bGVyID0gYXN5bmMpIHtcbiAgICByZXR1cm4gb2JzZXJ2YWJsZS5saWZ0KG5ldyBCdWZmZXJGb3JPcGVyYXRvcihidWZmZXJEdXJhdGlvbiwgc2NoZWR1bGVyKSk7XG59XG5jbGFzcyBCdWZmZXJGb3JPcGVyYXRvciB7XG4gICAgY29uc3RydWN0b3IoYnVmZmVyRHVyYXRpb24sIHNjaGVkdWxlcikge1xuICAgICAgICB0aGlzLmJ1ZmZlckR1cmF0aW9uID0gYnVmZmVyRHVyYXRpb247XG4gICAgICAgIHRoaXMuc2NoZWR1bGVyID0gc2NoZWR1bGVyO1xuICAgIH1cbiAgICBjYWxsKHN1YnNjcmliZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBCdWZmZXJGb3JTdWJzY3JpYmVyKHN1YnNjcmliZXIsIHRoaXMuYnVmZmVyRHVyYXRpb24sIHRoaXMuc2NoZWR1bGVyKTtcbiAgICB9XG59XG5jbGFzcyBCdWZmZXJGb3JTdWJzY3JpYmVyIGV4dGVuZHMgU3Vic2NyaWJlciB7XG4gICAgY29uc3RydWN0b3IoZGVzdGluYXRpb24sIGJ1ZmZlckR1cmF0aW9uLCBzY2hlZHVsZXIpIHtcbiAgICAgICAgc3VwZXIoZGVzdGluYXRpb24pO1xuICAgICAgICB0aGlzLmJ1ZmZlckR1cmF0aW9uID0gYnVmZmVyRHVyYXRpb247XG4gICAgICAgIHRoaXMuc2NoZWR1bGVyID0gc2NoZWR1bGVyO1xuICAgICAgICB0aGlzLmJ1ZmZlciA9IFtdO1xuICAgICAgICB0aGlzLm9wZW4gPSBmYWxzZTtcbiAgICB9XG4gICAgX25leHQodmFsdWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLm9wZW4pIHtcbiAgICAgICAgICAgIHRoaXMub3BlbkJ1ZmZlcigpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYnVmZmVyLnB1c2godmFsdWUpO1xuICAgIH1cbiAgICBfY29tcGxldGUoKSB7XG4gICAgICAgIGNvbnN0IGJ1ZmZlciA9IHRoaXMuYnVmZmVyO1xuICAgICAgICBpZiAoYnVmZmVyKSB7XG4gICAgICAgICAgICB0aGlzLmRlc3RpbmF0aW9uLm5leHQoYnVmZmVyKTtcbiAgICAgICAgfVxuICAgICAgICBzdXBlci5fY29tcGxldGUoKTtcbiAgICB9XG4gICAgX3Vuc3Vic2NyaWJlKCkge1xuICAgICAgICB0aGlzLmJ1ZmZlciA9IG51bGw7XG4gICAgfVxuICAgIGNsb3NlQnVmZmVyKCkge1xuICAgICAgICB0aGlzLm9wZW4gPSBmYWxzZTtcbiAgICAgICAgY29uc3QgYnVmZmVyID0gdGhpcy5idWZmZXI7XG4gICAgICAgIGlmICh0aGlzLmJ1ZmZlcikge1xuICAgICAgICAgICAgdGhpcy5kZXN0aW5hdGlvbi5uZXh0KGJ1ZmZlcik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5idWZmZXIgPSBbXTtcbiAgICB9XG4gICAgb3BlbkJ1ZmZlcigpIHtcbiAgICAgICAgY29uc3Qgc2NoZWR1bGUgPSB0aGlzLnNjaGVkdWxlci5zY2hlZHVsZSgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZShzY2hlZHVsZSk7XG4gICAgICAgICAgICB0aGlzLmNsb3NlQnVmZmVyKCk7XG4gICAgICAgIH0sIHRoaXMuYnVmZmVyRHVyYXRpb24pO1xuICAgICAgICB0aGlzLmFkZChzY2hlZHVsZSk7XG4gICAgICAgIHRoaXMub3BlbiA9IHRydWU7XG4gICAgfVxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9

$(function(){
  'use strict';
  
  var Breakpoint = function(){
    var _this = this;

    this.breakpoints = [480,768,1024];
    this.breakpointLabels = ['mobile', 'tablet-portrait', 'tablet-landscape', 'desktop'];
    this.lastBreakpoint;
    this.determineBreakpoint;

    this.lastBreakpoint = this.determineBreakpoint();

    $(window).bind('application-tick', function(){
      var newBreakpoint = _this.determineBreakpoint();
      if(_this.lastBreakpoint!==newBreakpoint){
        _this.lastBreakpoint = newBreakpoint;
        $(window).trigger('breakpoint-change', [_this.breakpointLabels[_this.lastBreakpoint]]);
      }
    });
  };

  Breakpoint.prototype = {
    determineBreakpoint: function(){
      var a,
          width;

      width = $(window).width();
      for(a=0;a<this.breakpoints.length;a++){
        if(width<this.breakpoints[a]){
          return a;
        }
      }
      return this.breakpoints.length;
    }
  };

  window.App.Breakpoint = Breakpoint;
});

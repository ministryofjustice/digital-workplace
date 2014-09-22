(function(){
  var breakpoints = [480,768,1024],
      breakpointLabels = ['mobile', 'tablet-portrait', 'tablet-landscape', 'desktop'],
      lastBreakpoint,
      determineBreakpoint;

  determineBreakpoint = function(){
    var a,
        width;

    width = $(window).width();
    for(a=0;a<breakpoints.length;a++){
      if(width<breakpoints[a]){
        return a;
      }
    }
    return breakpoints.length;
  };

  lastBreakpoint = determineBreakpoint();

  $(window).bind('application-tick', function(){
    var newBreakpoint = determineBreakpoint();
    if(lastBreakpoint!==newBreakpoint){
      lastBreakpoint = newBreakpoint;
      $(window).trigger('breakpointChange', [breakpointLabels[lastBreakpoint]]);
    }
  });
}());

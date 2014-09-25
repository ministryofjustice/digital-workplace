$(function(){
  'use strict';

  var HeaderMenu = function(){
    if(!$('.content').length){ return; }

    $('.mobile-menu').click(function(){
      $('.sub-header .tabs').slideToggle(100);
    });

    $(window).bind('breakpoint-change', function(e, breakpoint){
      if(breakpoint!=='mobile'){ //make sure the tabs are shown for other breakpoints
        $('.sub-header .tabs').show();
      }
    });
  };

  App.HeaderMenu = HeaderMenu;
});

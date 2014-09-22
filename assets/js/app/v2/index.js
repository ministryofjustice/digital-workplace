$(function(){
  App.headerMenu = function(){
    if(!$('.content').length){ return; }

    $('.mobile-menu').click(function(){
      $('.sub-header .tabs').slideToggle(100);
    });

    $(window).bind('breakpointChange', function(e, breakpoint){
      if(breakpoint!=='mobile'){
        $('.sub-header .tabs').get(0).style.display = '';
      }
    });
  };

  App.headerMenu();
}());

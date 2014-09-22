$(function(){
  App.headerMenu = function(){
    if(!$('.content').length){ return; }

    $('.mobile-menu').click(function(){
      $('.sub-header .tabs').slideToggle(100);
    });
  };

  App.headerMenu();
}());

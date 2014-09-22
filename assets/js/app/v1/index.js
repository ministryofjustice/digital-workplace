$(function(){
  App.formsAndTemplates = function(){
    if(!$('.content-forms-and-templates').length){ return; }

    $('.close-icon').click(function(){
      $('.sub-header').addClass('collapsed');
    });
  };

  App.formsAndTemplates();
}());

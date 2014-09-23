$(function(){
  var $topContainer = $('.sub-header');
  var SubHeader = function(){
    if($('.content-forms-and-templates').length){
      $topContainer.find('.close-icon').click(function(){
        $topContainer.addClass('collapsed');
      });
    };
  };

  SubHeader.prototype = {
  };

  window.App.SubHeader = SubHeader;
}());

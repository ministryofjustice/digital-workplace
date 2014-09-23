$(function(){
  var Tick = function(){
    var _this = this;
    this.config = {
      frequency: 10 //per second
    };

    window.setInterval(function(){
      $(window).trigger('application-tick');
    }, parseInt(1000/_this.config.frequency, 10));
  };

  Tick.prototype = {
  };

  window.App.Tick = Tick;
}());

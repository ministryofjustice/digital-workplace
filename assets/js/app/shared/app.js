var App = {
  tick: (function(){
    var config = {
      frequency: 10 //per second
    };

    window.setInterval(function(){
      $(window).trigger('application-tick');
    }, parseInt(1000/config.frequency, 10));
  }())
};

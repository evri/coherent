/*jsl:import ../../ui.js*/

(function(){

  window._setTimeout= window.setTimeout;
  /** @ignore */
  window.setTimeout= function(handler, delay)
  {
    if (!handler)
      return null;
      
    if ('string'===typeof(handler))
    {
      handler= 'coherent.EventLoop.begin();do {' +
           handler + '} while (false); ' +
           'coherent.EventLoop.end();';
      return window._setTimeout(handler, delay);
    }
    
    var args= Array.from(arguments, 2);
    
    /** @ignore */
    function timeoutWrapper()
    {
      coherent.EventLoop.begin();
      var value= handler.apply(this, args);
      coherent.EventLoop.end();
      return value;
    }
    return window._setTimeout(timeoutWrapper, delay);
  }
  
  window._setInterval= window.setInterval;
  /** @ignore */
  window.setInterval= function(handler, delay)
  {
    if (!handler)
      return null;

    if ('string'===typeof(handler))
    {
      handler= 'coherent.EventLoop.begin();do {' +
           handler + '} while (false); ' +
           'coherent.EventLoop.end();';
      return window._setInterval(handler, delay);
    }
    
    var args= Array.from(arguments, 2);
    
    /** @ignore */
    function intervalWrapper()
    {
      coherent.EventLoop.begin();
      var value= handler.apply(this, args);
      coherent.EventLoop.end();
      return value;
    }
    return window._setInterval(intervalWrapper, delay);
  }

})();
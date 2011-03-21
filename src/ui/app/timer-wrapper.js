/*jsl:import ../../ui.js*/

(function(){

  window._setTimeout= window.setTimeout;
  /** @ignore */
  window.setTimeout= function(handler, delay)
  {
    if (!handler)
      return null;
      
    if ('string'===typeof(handler))
      handler= new Function(handler);
    
    var args= Array.from(arguments, 2);
    
    /** @ignore */
    function timeoutWrapper()
    {
      return coherent.EventLoop.run(this, handler, args[0]);
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
      handler= new Function(handler);
    
    var args= Array.from(arguments, 2);
    
    /** @ignore */
    function intervalWrapper()
    {
      return coherent.EventLoop.run(this, handler, args[0]);
    }
    return window._setInterval(intervalWrapper, delay);
  }

})();
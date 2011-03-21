/*jsl:import ../../ui.js*/

/** The Event Loop for the page...
 */

coherent.EventLoop = Class._create({

  constructor: function()
  {},
  
  getStart: function()
  {
    if (!this._start)
      this._start= new Date().getTime();
    return this._start;
  },
  
  begin: function()
  {
    this._start= new Date().getTime();
    this._inprogress= true;
  },
  
  end: function()
  {
    //  process pending change notifications
    coherent.ChangeNotification.scheduleNotifications();
    
    this._start= null;
    this._inprogress= false;
  }
  
});

coherent.EventLoop.currentEventLoop = new coherent.EventLoop();

coherent.EventLoop.push = function(target, action, arg)
{
  var previous= coherent.EventLoop.currentEventLoop;
  coherent.EventLoop.currentEventLoop= new coherent.EventLoop();
  coherent.run(target, action, arg);
  coherent.EventLoop.currentEventLoop= previous;
}

coherent.EventLoop.run= function(target, action, arg)
{
  var result;
  
  if (void(0)==action && 'function'===typeof(target))
  {
    action= target;
    target= null;
  }
  
  var eventLoop= coherent.EventLoop.currentEventLoop,
      inprogress= eventLoop._inprogress;
  
  if (coherent.ExceptionHandler && coherent.ExceptionHandler.enabled)
  {
    try
    {
      if (!inprogress)
        eventLoop.begin();
      result= action.call(target, arg);
      if (!inprogress)
        eventLoop.end();
    }
    catch (e)
    {
      coherent.ExceptionHandler.handleException(e);
      
      //  IE barfs if we rethrow an error and MobileSafari has no facility for
      //  debugging.
      if (!coherent.Browser.IE && !coherent.Browser.MobileSafari)
        throw e;
    }
  }
  else
  {
    if (!inprogress)
      eventLoop.begin();
    result= action.call(target, arg);
    if (!inprogress)
      eventLoop.end();
  }
  
  return result;
}

coherent.run= coherent.EventLoop.run;

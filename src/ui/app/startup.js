/*jsl:import Application.js*/
/*jsl:import Page.js*/
/*jsl:import timer-wrapper.js*/

distil.onready(function(){

  var app= coherent.Application.shared;

  coherent.run(app, function()
  {
    app.loaded= true;
    app.__loadMainNib();
    app.callDelegate('applicationDidFinishLaunching', app);
  });
  
  //  Remove a startup notice
  var startup= Element.query('.ui-startup');
  if (startup)
    startup.parentNode.removeChild(startup);
    
  function removeLoading()
  {
    Element.removeClassName(document.documentElement, 'ui-loading');
  }
  Function.delay(removeLoading,0);

  //  Set up application event handlers
  var page= coherent.Page.shared;
  var wrapEventHandler;

  if (!coherent.Support.StandardEventModel)
  {
    wrapEventHandler=function(fn)
    {
      return function()
      {
        coherent.EventLoop.push(page, page[fn], window.event);
      };
    };

    page._onmousedragHandler= wrapEventHandler("_onmousedrag");

    document.attachEvent('onmouseover', wrapEventHandler("_onmouseover"));
    document.attachEvent('onmousedown', wrapEventHandler("_onmousedown"));
    document.attachEvent('onmouseup', wrapEventHandler("_onmouseup"));
    document.attachEvent('onclick', wrapEventHandler("_onclick"));
    document.attachEvent('ondblclick', wrapEventHandler("_ondblclick"));
    document.attachEvent('onkeydown', wrapEventHandler("_onkeydown"));
    document.attachEvent('onkeyup', wrapEventHandler("_onkeyup"));
    document.attachEvent('onkeypress', wrapEventHandler("_onkeypress"));
    document.attachEvent('onfocusin', wrapEventHandler("_onfocus"));
    document.attachEvent('onfocusout', wrapEventHandler("_onblur"));
    window.attachEvent('onfocus', wrapEventHandler("_onfocus"));
    window.attachEvent('onblur', wrapEventHandler("_onblur"));
    window.attachEvent('onunload', wrapEventHandler("_onunload"));

    if (coherent.Support.DragAndDrop)
    {
      document.attachEvent('ondragstart', wrapEventHandler("_ondragstart"));
      document.documentElement.attachEvent('ondragend', wrapEventHandler("_ondragend"));
      document.documentElement.attachEvent('ondragenter', wrapEventHandler("_ondragenter"));
      document.documentElement.attachEvent('ondrag', wrapEventHandler("_ondrag"));
      document.documentElement.attachEvent('ondragover', wrapEventHandler("_ondragover"));
      document.documentElement.attachEvent('ondrop', wrapEventHandler("_ondrop"));
    }
  }
  else
  {
    /** @ignore */
    wrapEventHandler=function(fn)
    {
      return function(event)
      {
        coherent.EventLoop.push(page, page[fn], event);
      };
    };

    page._onmousedragHandler= wrapEventHandler("_onmousedrag");
  
    document.addEventListener('mouseover', wrapEventHandler("_onmouseover"), false);
    document.addEventListener('mousedown', wrapEventHandler("_onmousedown"), false);
    document.addEventListener('mouseup', wrapEventHandler("_onmouseup"), false);
    document.addEventListener('keydown', wrapEventHandler("_onkeydown"), false);
    document.addEventListener('keyup', wrapEventHandler("_onkeyup"), false);
    document.addEventListener('keypress', wrapEventHandler("_onkeypress"), false);
    document.addEventListener('focus', wrapEventHandler("_onfocus"), true);
    document.addEventListener('blur', wrapEventHandler("_onblur"), true);
    document.addEventListener('change', wrapEventHandler("_onchange"), true);
    document.addEventListener('submit', wrapEventHandler("_onsubmit"), true);
    document.addEventListener('reset', wrapEventHandler("_onreset"), true);
    window.addEventListener('focus', wrapEventHandler("_onfocus"), false);
    window.addEventListener('blur', wrapEventHandler("_onblur"), false);

    document.addEventListener('click', wrapEventHandler("_onclick"), false);
    document.addEventListener('dblclick', wrapEventHandler("_ondblclick"), false);

    if (coherent.Support.Touches)
    {
      document.addEventListener('touchstart', wrapEventHandler("_ontouchstart"), true);
      document.addEventListener('touchmove', wrapEventHandler("_ontouchmove"), true);
      document.addEventListener('touchend', wrapEventHandler("_ontouchend"), true);
      document.addEventListener('touchcancel', wrapEventHandler("_ontouchcancel"), true);
      document.addEventListener('gesturestart', wrapEventHandler("_ongesturestart"), true);
      document.addEventListener('gesturechange', wrapEventHandler("_ongesturechange"), true);
      document.addEventListener('gestureend', wrapEventHandler("_ongestureend"), true);
    }
    
    if (coherent.Support.DragAndDrop)
    {
      document.addEventListener('dragstart', wrapEventHandler("_ondragstart"), false);
      document.addEventListener('dragend', wrapEventHandler("_ondragend"), false);
      document.addEventListener('dragenter', wrapEventHandler("_ondragenter"), false);
      document.addEventListener('dragover', wrapEventHandler("_ondragover"), false);
      document.addEventListener('drop', wrapEventHandler("_ondrop"), false);
    }
    
    window.addEventListener('orientationchange', wrapEventHandler("_onorientationchange"), false);
  }
});

/*jsl:import ../../ui.js*/

coherent.ModalBackdrop = (function(){

  var BACKDROP_CLASSNAME = "ui-modal-overlay-backdrop",
      HIDDEN_CLASSNAME = coherent.Style.kFadingClass,
      ANIMATION_DURATION = 350;
  
  var backdrop,
      visibleCount = 0;
  
  function showBehind(node)
  {
    if (visibleCount++)
      return;
    
    if (!backdrop)
    {
      backdrop= document.createElement('div');
      backdrop.className= [BACKDROP_CLASSNAME, HIDDEN_CLASSNAME].join(' ');
      backdrop.style.display="none";
      document.body.appendChild(backdrop);
    }
    
    node.parentNode.insertBefore(backdrop, node);

    backdrop.style.display="";
    Element.removeClassName(backdrop, HIDDEN_CLASSNAME);
  }

  function hide()
  {
    if (!backdrop || --visibleCount)
      return;
    
    function ontransitionend(event)
    {
      backdrop.style.display = 'none';
      Event.stopObserving(backdrop, 'transitionend', transitionHandler);
    }
    
    var transitionHandler = Event.observe(backdrop, "webkitTransitionEnd", Event.handler(this, ontransitionend));
    Element.addClassName(backdrop, HIDDEN_CLASSNAME);
  }
  
  return {
      showBehind: showBehind,
      hide: hide
  };

})();

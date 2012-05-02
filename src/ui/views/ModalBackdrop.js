/*jsl:import ../../ui.js*/

coherent.ModalBackdrop = (function(){

  var BACKDROP_CLASSNAME = "ui-modal-overlay-backdrop",
      HIDDEN_CLASSNAME = coherent.Style.kFadingClass;
  
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
    }
    
    node.parentNode.insertBefore(backdrop, node);

    backdrop.style.display="";
    Element.removeClassName(backdrop, HIDDEN_CLASSNAME);
  }

  function hide()
  {
    if (!backdrop || --visibleCount)
      return;
    
    backdrop.style.display = 'none';
    Element.addClassName(backdrop, HIDDEN_CLASSNAME);
  }
  
  return {
      showBehind: showBehind,
      hide: hide
  };

})();

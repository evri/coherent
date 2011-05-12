/*jsl:import ../ui.js*/

/**
  class coherent.PopupButton
  
  This class provides a simple way of triggering the display of an attached
  instance of coherent.Overlay. When clicked, this view will set itself as the
  delegate for the overlay so it will receive the `willHideOverlay` delegate
  message.
  
  This view may be used with Anchors or Buttons (or any other element type).
  While the overlay is visible, this view will be active (have the ui-active
  CSS class).
 */
coherent.PopupButton= Class.create(coherent.View, {

  /**
    coherent.PopupButton#popupView -> coherent.Overlay
    
    This property should be linked to an overlay view. This is the overlay that
    will be shown when this view is clicked.
   */
   
  /**
    coherent.PopupButton#willHideOverlay(overlay)
    
    - overlay (ocherent.Overlay): the overlay view invoking this delegate method
    
    This delegate method is called when the associated overlay is dismissed.
   */
  willHideOverlay: function(overlay)
  {
    this.setActive(false);
  },

  /**
    coherent.PopupButton#onclick(event)
    
    - event (Event): the click event
    
    When clicked, this view will display the associated popupView.
   */
  onclick: function(event)
  {
    var node= this.node;
    if ('A'===node.tagName)
      Event.preventDefault(event);

    if (this!=this.popupView.delegate)
    {
      this.popupView.delegate= this;
      this.popupView.attachToView(this);
    }
    if (this.active())
    {
      this.popupView.setVisible(false);
      this.setActive(false);
    }
    else
    {
      this.popupView.setVisible(true);
      this.setActive(true);
    }
  }
  
});

/*jsl:import coherent*/

/**
  These are the states the item within a SlidingTrackView may be in.
 */
coherent.SlidingTrackViewStates= {
  /** When pinned to the top, the item should remain at the top of the
      track. This requires a complementary portion of CSS for the item
      with either `position: static`, `position: absolute; top: 0` or
      similar.
   */
  PinnedTop: coherent.Style.SlidingTrackPinnedTop,
  
  /** When floating, the item should appear to remain in the same spot
      while the rest of the page scrolls. This may be implemented using
      setting `position: fixed` on the item within the track.
   */
  Floating: coherent.Style.SlidingTrackFloating,
  
  /** When pinned to the bottom, the item should scroll with the page and
      remain at the bottom of the track. The best way to implement this in
      CSS is to set a rule `position: absolute; bottom: 0;` on the item
      node.
   */
  PinnedBottom: coherent.Style.SlidingTrackPinnedBottom     
};



/**
  A view that manages a subview.

  @property {coherent.SlidingTrackViewStates} initialState
 */
coherent.SlidingTrackView = Class.create(coherent.View, {
  
  removeExtraNodes: true,
  
  init: function()
  {
    if (6==coherent.Browser.IE)
      return;
    
    var node= this.node;
    var itemNode = node.children[0];
    
    if (this.removeExtraNodes)
    {
      itemNode= node.removeChild(itemNode);
      node.innerHTML="";
      node.appendChild(itemNode);
    }
    
    this._item = coherent.View.fromNode(itemNode) || new coherent.View(itemNode);
  
    // Setup initial state
    this._viewport = Element.getViewport();
    this._trackFrame = Element.getRect(node, true);
    this._itemFrame = Element.getRect(itemNode, true);
  
    this.setState(this.initialState||coherent.SlidingTrackViewStates.PinnedTop);
    this.updateItemPosition();
  
    this._item.addObserverForKeyPath(this, this.itemFrameChanged, 'frame');
    Event.observe(window, 'resize', Event.handler(this, this.viewportResized));
    Event.observe(window, 'scroll', Event.handler(this, this.viewportScrolled));
    Event.observe(window, 'load', Event.handler(this, this.viewportResized));
  },

  viewportResized: function(e)
  {
    this._viewport = Element.getViewport();
  
    // Safari 3.2 and 4 have trouble redrawing this._item during a
    // window resize while in the Floating state. This includes
    // resizing the item in updateItemPosition, in addition to
    // adjusting to a new window size. Momentarily reverting the state
    // back to PinnedTop fixes this problem.
    if (coherent.Browser.Safari)
      this.setState(coherent.SlidingTrackViewStates.PinnedTop);
  
    // Check for a narrow window (one with horizontal scrolling). We
    // will force PinnedTop if the window is too narrow.
    if (coherent.Browser.IE)
      this._narrow = document.documentElement.clientWidth < document.body.scrollWidth;
    else
      this._narrow = document.documentElement.clientWidth < document.documentElement.scrollWidth;

    this.viewportScrolled();
  },

  viewportScrolled: function()
  {
    var node= this.node;
    this._viewport = Element.getViewport();
    this._trackFrame = Element.getRect(node, true);
    this._itemFrame = Element.getRect(this._item.node, true);

    //  Safari doesn't seem to like position:fixed
    if (this.__currentState===coherent.SlidingTrackViewStates.Floating &&
        coherent.Browser.Safari)
    {
      node.style.display='none';
      node.offsetTop;
      node.style.display='';
    }
    this.updateItemPosition();
  },

  updateItemPosition: function()
  {
    // Resize the frame if we can
    if ('willResizeFrame' in this._item)
    {
      var constrainedFrame = Object.applyDefaults({}, this._itemFrame);
      constrainedFrame.top = Math.max(0, this._trackFrame.top);
      constrainedFrame.bottom = Math.min(this._trackFrame.bottom, this._viewport.height);
      constrainedFrame.height = constrainedFrame.bottom - constrainedFrame.top;
    
      // NOTE: constrainedFrame is the frame of the visible track on
      // the page, which we will attempt to resize the item to.
      // 
      // resizeFrame must return the frame of the item's new size.
      // If the item has a minimum size it enforces upon itself, the
      // returned frame can be larger than constrainedFrame. Also, if
      // constrainedFrame is larger than the item cares to be, it
      // need not resize to the full size.
      if (this._item.willResizeFrame(constrainedFrame))
        this._itemFrame = this._item.resizeFrame(constrainedFrame);
    }

    // Switch states if necessary. See STATE_SWITCHERS for state logic
    this.updateState();
  },

  itemFrameChanged: function(change, keypath, context)
  {
    this._itemFrame = change.newValue;
    this.updateItemPosition();
  },

  updateState: function()
  {
    var newState= this.__currentState;
    var STATES=coherent.SlidingTrackViewStates;
    
    switch (this.__currentState)
    {
      case STATES.PinnedTop:
        // In order to switch to either state from PinnedTop, the
        // track top must be out of view and we must have enough room
        // in the viewport to display the item.
        if (this._narrow || this._trackFrame.top > 0 ||
          this._viewport.height < this._itemFrame.height)
          break;
          
        // If the track bottom offers less space than we have for
        // the item, pin to bottom
        if (this._trackFrame.bottom < this._itemFrame.height)
          newState= STATES.PinnedBottom;
        else
          // Otherwise, we can float now
          newState=  STATES.Floating;
        break;
        
      case STATES.Floating:
        // If the viewport is too small for the item, or the top of the
        // track is in view, pin to top.
        if (this._narrow || this._trackFrame.top > 0 ||
          this._viewport.height < this._itemFrame.height)
          newState= STATES.PinnedTop;
        // If we've reached the bottom of the track, pin to bottom.
        else if (this._trackFrame.bottom < this._itemFrame.bottom)
          newState= STATES.PinnedBottom;
        break;
        
      case STATES.PinnedBottom:
        // If the viewport is too small for the item, pin to top
        if (this._narrow || this._viewport.height < this._itemFrame.height)
          newState= STATES.PinnedTop;
        // If the top of the item is within view, start floating
        else if (this._viewport.height<this._trackFrame.bottom && this._itemFrame.top > 0)
          newState= STATES.Floating;
        break;
      
      default:
        throw new Error("Unknown state: " + this.__currentState);
    }

    if (this.__currentState!=newState)
      this.setState(newState);
  },

  state: function()
  {
    return this.__currentState;
  },
  
  setState: function(newState)
  {
    if (newState===this.__currentState)
      return;
  
    var view = this.node;
    Element.updateClass(view, newState, this.__currentState||"");
  
    this.__currentState= newState;
    this.callDelegate('trackViewStateChanged', this, newState);
  }

});

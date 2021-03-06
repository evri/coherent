/*jsl:import ../views/Button.js*/

/** A view that implements a segmented control which can be used instead of
    radio buttons or as part of a tab switcher.
  
    @binding {Number} selectedIndex
      The index of the currently selected segment of this control.
    
    @binding {String} selectedLabel
      The text of the currently selected segment of this control.
 */
coherent.SegmentedControl = Class.create(coherent.View, {

  exposedBindings: ['selectedIndex', 'selectedLabel'],
  
  /** CSS selector for the segment control items. Because the buttons or
      anchors for the segmented control might be embedded in additional
      markup, a CSS selector is used to find them.
      @type String
      @default "button"
   */
  segmentSelector: 'button',
  
  /** Initialise the SegementedControl. This finds and assigns an index value
      to each node that matches the {@link #segmentSelector}.
   */
  init: function()
  {
    this.__selectedIndex=-1;
    var segments= Element.queryAll(this.node, this.segmentSelector);
    var len= segments.length;
    var selectedClass= coherent.Style.kSelectedClass;
    var node;
    var hasClassName= Element.hasClassName;
    
    for (var i=0; i<len; ++i)
    {
      node= segments[i];
      if (hasClassName(node, selectedClass))
        this.__selectedIndex= i;
      node.segmentIndex= i;
    }
  },
  
  /** Accessor for the selectedIndex property.
      @returns {Number} The index of the selected segment.
   */
  selectedIndex: function()
  {
    return this.__selectedIndex;
  },
  
  /** Select a segment within this control.
      @param {Number} newSelectedIndex - The index of the segment that should be
           selected. Pass -1 to deselect all segments.
   */
  setSelectedIndex: function(newSelectedIndex)
  {
    var segments= Element.queryAll(this.node, this.segmentSelector);
    
    if ('number'!==typeof(newSelectedIndex) || newSelectedIndex<-1 || newSelectedIndex>=segments.length)
      return;

    this.willChangeValueForKey("selectedLabel");
      
    if (-1!==this.__selectedIndex)
      Element.removeClassName(segments[this.__selectedIndex],
                   coherent.Style.kSelectedClass);
    
    this.__selectedIndex= newSelectedIndex;
    if (-1!==this.__selectedIndex)
      Element.addClassName(segments[this.__selectedIndex],
                  coherent.Style.kSelectedClass);
    
    if (this.bindings.selectedIndex)
      this.bindings.selectedIndex.setValue(newSelectedIndex);
    if (this.bindings.selectedLabel)
      this.bindings.selectedLabel.setValue(this.selectedLabel());
    
    this.didChangeValueForKey("selectedLabel");
  },
  
  /** Accessor for the `selectedLabel` property.
      @returns {String} The innerText/textContent of the currently selected segment.
   */
  selectedLabel: function()
  {
    if (-1===this.__selectedIndex)
      return "";

    var segments= Element.queryAll(this.node, this.segmentSelector);
    var segment= segments[this.__selectedIndex];
    
    if (!segment)
      return "";
  
    return segment.textContent||segment.innerText;
  },
  
  /** Handle click events on a segment within the control. This event handler
      relies on any subviews **not** handling the click event, otherwise, it
      might not be able to receive it. This contraint shouldn't be a problem,
      because binding a View to a node within the SegmentedControl would be
      difficult anyway.
    
      If the click occurs on a segment, this event handler will select that
      segment and fire the control's action.
    
      @param {Event} event - A reference to a MouseEvent object generated by
           the browser.
   */
  onclick: function(event)
  {
    var node= this.node;
    var target= event.target||event.srcElement;
   
    while (target && target!=node && !('segmentIndex' in target))
      target= target.parentNode;
    
    if (!target || target===node)
      return;
      
    Event.preventDefault(event);
    
    this.setSelectedIndex(target.segmentIndex);
    this.sendAction();
  }
  
});
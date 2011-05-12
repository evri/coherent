/*jsl:import ../ui.js*/

/**
  class coherent.NavigationItem
  
  This class represents information about a view controller that can be used by
  the NavigationController to display history and additional controls.
 */
coherent.NavigationItem = Class.create(coherent.KVO, {

  constructor: function(viewController, params)
  {
    this.__viewController = viewController;
    this.__navigationController = null;
    this.base(params);
  },

  backBarButtonItem: function()
  {
    return new coherent.BarButtonItem({
        style: 'ui-bar-back',
        title: this.title()
      });
  },

  title: function()
  {
    return this.__title || this.__viewController.valueForKey('title');
  },

  setTitle: function(title)
  {
    this.__title= title;
  },
  
  /**
    coherent.NavigationItem#titleView() -> coherent.View
    
    Return the view that should be used to display the title or null if the
    default view should be used.
   */
  titleView: function()
  {
    return null;
  },

  leftBarButtonItem: function()
  {
    return this.__leftBarButtonItem;
  },

  setLeftBarButtonItem: function(leftBarButtonItem)
  {
    this.__leftBarButtonItem = leftBarButtonItem;
    if (this.__navigationController)
      this.__navigationController.__updateItems();
  },

  rightBarButtonItem: function()
  {
    return this.__rightBarButtonItem;
  },

  setRightBarButtonItem: function(rightBarButtonItem)
  {
    this.__rightBarButtonItem = rightBarButtonItem;
    if (this.__navigationController)
      this.__navigationController.__updateItems();
  }

});

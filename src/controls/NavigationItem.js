/*jsl:import ../ui.js*/

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
          Create a new View that will represent the title.
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
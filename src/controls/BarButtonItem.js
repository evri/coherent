/*jsl:import ../ui.js*/

(function(){

  var BUTTON= coherent.Style.ToolbarButtonItem,
      TITLE= coherent.Style.ToolbarTitleItem,
      ICON= coherent.Style.ToolbarIconItem,
      FLEXSPACE= coherent.Style.ToolbarFlexSpace,
      FIXEDSPACE= coherent.Style.ToolbarFixedSpace;

  coherent.BarButtonStyle= {
    Button: BUTTON,
    Icon: ICON,
    Title: coherent.Style.ToolbarTitleItem,
    FlexibleSpace: FLEXSPACE,
    FixedSpace: FIXEDSPACE
  };
      
  coherent.BarButtonSystemItem= {
    Add: {
      'class': BUTTON,
      text: _('Add')
    },
    Edit: {
      style: BUTTON,
      text: _('Edit')
    },
    Done: {
      style: BUTTON,
      'class': 'ui-primary',
      text: _('Done')
    },
    Cancel: {
      style: BUTTON,
      text: _('Cancel')
    },
    Save: {
      style: BUTTON,
      text: _('Save')
    },
    Undo: {
      style: BUTTON,
      text: _('Undo')
    },
    Redo: {
      style: BUTTON,
      text: _('Redo')
    },

    Title: {
      style: TITLE
    },
  
    Compose: {
      'class': 'ui-icon-compose',
      style: ICON,
      text: _('Compose')
    },
    Reply: {
      'class': 'ui-icon-reply',
      style: ICON,
      text: _('Reply')
    },
    // @TODO: find icon
    Action: {
      'class': 'ui-icon-action',
      style: ICON,
      text: _('Action')
    },
    Organize: {
      'class': 'ui-icon-organize',
      style: ICON,
      text: _('Organize')
    },
    Trash: {
      'class': 'ui-icon-trash',
      style: ICON,
      text: _('Trash')
    },

  
    FlexibleSpace: {
      'class': 'ui-bar-flex-space',
      enabled: false
    },
    FixedSpace: {
      'class': 'ui-bar-fixed-space',
      enabled: false
    },

  
    Bookmarks: {
      'class': 'ui-icon-bookmarks',
      style: ICON,
      text: _('Bookmarks')
    },
    Search: {
      'class': 'ui-icon-search',
      style: ICON,
      text: _('Search'),
      action: 'search'
    },
    Refresh: {
      'class': 'ui-icon-refresh',
      style: ICON,
      text: _('Refresh'),
      action: 'refresh'
    },
    Stop: {
      'class': 'ui-icon-stop',
      style: ICON,
      text: _('Stop'),
      action: 'stop'
    },
  
  
    Camera: {
      'class': 'ui-icon-camera',
      style: ICON,
      text: _('Camera')
    },
  

    // @TODO: find icons
    Play: {
      'class': 'ui-icon-play',
      style: ICON,
      text: _('Play')
    },
    Pause: {
      'class': 'ui-icon-pause',
      style: ICON,
      text: _('Pause')
    },
    Rewind: {
      'class': 'ui-icon-rewind',
      style: ICON,
      text: _('Rewind')
    },
    FastForward: {
      'class': 'ui-icon-fastforward',
      style: ICON,
      text: _('Fast Forward')
    }
  };

  /**
    class coherent.BarButtonItem
  
    This is a placeholder object that is used for displaying items in a toolbar or
    similar views.
  
    BarButtonItems may have the following properties:
    - title (String) : The title that should be displayed in this BarButton.
    - image (String) : The URL of the image that should be displayed in the BarButton.
    - target (String) : The target object to which the action message should be sent.
    - action (String|Function) : Either a function to be called when the visitor invokes
        the bar button item, or a string representing the method to call on the first
        responder that implements it.
    - class (String) : The class name that should be applied to the bar button's DOM
        node for styling.
    - enabled (Boolean) : Whether the button is enabled or not.
    - customView (coherent.View) : A custom view to display instead of this button.
   */
  coherent.BarButtonItem= Class.create(coherent.KVO, {

    constructor: function(params)
    {
      if (!('enabled' in params))
        params.enabled= true;
      this.base(params);
    },
  
    style: function()
    {
      return this.__style;
    },

    setStyle: function(style)
    {
      this.__style= style;
      this.forceChangeNotificationForKey('_class');
    },

    title: function()
    {
      return this.__title;
    },

    setTitle: function(title)
    {
      this.__title= title;
    },
  
    'class': function()
    {
      return this.__class;
    },

    setClass: function(klass)
    {
      this.__class= klass;
      this.forceChangeNotificationForKey('_class');
    },
  
    enabled: function()
    {
      return this.__enabled;
    },

    setEnabled: function(enabled)
    {
      this.__enabled= enabled;
      this.forceChangeNotificationForKey('_class');
    },
  
    active: function()
    {
      return this.__active;
    },

    setActive: function(active)
    {
      this.__active= active;
      this.forceChangeNotificationForKey('_class');
    },
    
    _class: function()
    {
      var classes= ['ui-bar-item'];
      if (this.__class)
        classes.push(this.__class);
      if (this.__style)
        classes.push(this.__style);
      if (!this.__enabled)
        classes.push(coherent.Style.kDisabledClass);
      if (this.__active)
        classes.push(coherent.Style.kActiveClass);
        
      return classes.join(' ');
    }
  
  });


})();
/*jsl:import Responder.js*/
/*jsl:import ../nib/NIB.js*/
/*jsl:import hash.js*/

/** An application class.
 */
coherent.Application= Class.create(coherent.Responder, {

  constructor: function()
  {
    if (coherent.Application.shared)
      return coherent.Application.shared;
      
    // coherent.hash.addObserverForKeyPath(this, 'observeHashChange', 'value');
    
    distil.onready(function() {
      var app= coherent.Application.shared;
      app.loaded= true;
      app.__loadMainNib();
      app.callDelegate('applicationDidFinishLaunching');
      //  Remove a startup notice
      var startup= Element.query('.ui-startup');
      if (startup)
        startup.parentNode.removeChild(startup);
        
      function removeLoading()
      {
        Element.removeClassName(document.documentElement, 'ui-loading');
      }
      Function.delay(removeLoading,0);
    });
    
    if (coherent.Support.HistoryPushState)
      Event.observe(window, 'popstate', this.onpopstate.bind(this));
      
    return void(0);
  },

  navigationController: function()
  {
    return this.__navigationController;
  },

  setNavigationController: function(navigationController)
  {
    if (this.__navigationController)
      throw new Error("Can't have more than one navigation controller in an application");
    this.__navigationController= navigationController;
  },
  
  onpopstate: function(event)
  {
    if (this.__poppingState || !this.__navigationController || !this.applicationRootUrl)
      return;
      
    var path= document.location.pathname;
    if (!path.beginsWith(this.applicationRootUrl))
      return;
    path= path.substring(this.applicationRootUrl.length+1);
    if ('/'!==path.charAt(0))
      path= '/'+path;
    
    var viewController= this.callDelegate('viewControllerForPath', [path]);
    if (!viewController)
      return;
    
    this.__navigationController.setTopViewController(viewController, event.state);
  },
  
  pushState: function(viewController)
  {
    if (!coherent.Support.HistoryPushState)
      return;
    
    var state= this.callDelegate('historyStateForViewController', [viewController]);
    var title= viewController.valueForKey('title');
    var url= viewController.valueForKey('url');

    title= this.callDelegate('pageTitleForString', [title]) || document.title;
    url= [this.applicationRootUrl, url].join('/').replace(/\/\/+/g, '/');
    
    window.history.pushState(state, title, url);
  },
  
  /**
    coherent.Application#popState()
    Deliberately trigger a popstate event. This ignores the event.
   */
  popState: function()
  {
    this.__poppingState= true;
    window.history.back();
    this.__poppingState= false;
  },
  
  /** Handle changes to the URL hash. If a {@link #delegate} has been set, this
      method calls the delegate's `hashDidChange` method.
    
      @param {coherent.ChangeNotification} change - The change notification with
        the new and old value for the URL hash.
   */
  observeHashChange: function(change)
  {
    this.callDelegate('hashDidChange', change.newValue);
  },

  mainNib: function()
  {
    return this.__mainNib;
  },
  
  setMainNib: function(newMainNib)
  {
    this.__mainNib= newMainNib;
    if (this.loaded)
      this.__loadMainNib();
  },
  
  __loadMainNib: function()
  {
    if (!this.__mainNib)
      return;

    var nib= NIB.withName(this.__mainNib);
    if (!nib)
      throw new Error("Could not find NIB with name \""+this.__mainNib +"\"");
      
    nib.instantiateNibWithOwner(this);

    var context= nib.context;

    var body= document.body;
    var views= context.__views;
    var numberOfViews= views.length;
    var view;

    for (var i=0; i<numberOfViews; ++i)
    {
      view= views[i];
      if (!view.node.parentNode || view.node.parentNode===coherent.View.__holdingArea)
      {
        body.appendChild(view.node);
        view.setVisible(true);
      }
    }
  },
  
  
  /** section: Target/Action
    coherent.Application#sendAction(action, to, from[, argument]) -> Boolean
    
    - action (String): A string identifying the action to send.
    - to (Object): An object that should receive the action message. If `null`,
        the action will be sent to the current first responder.
    - from (Object): The object sending the message. By default, this is the view
        that generated the action.
    - argument (Any): An argument to pass along with the action.
    
    If the action was handled, this method returns `true`. Otherwise, it returns
    `false`.
   */
  sendAction: function(action, to, from, argument)
  {
    to= to||coherent.Page.shared.firstResponder;
    
    /*  When an explicit target is specified and the action is not a string,
        the action function can be invoked directly. There's no need (and no
        capactiy) to pass the action up the chain.
     */
    if ('string'!==typeof(action))
    {
      action.call(to, from, argument);
      return true;
    }
    
    /*  Bubble the action up the responder chain. The first view that has a
        method corresponding to the action name will be the target responder.
     */
    while (to)
    {
      if (action in to)
      {
        to[action](from, argument);
        return true;
      }
      
      var delegate= to.delegate && to.delegate();
      if (delegate && action in delegate)
      {
        delegate[action](from, argument);
        return true;
      }
      
      to= to.nextResponder();
    }
    
    console.log('No to found for action: '+action);
    return false;
  }
  
});


coherent.Application.shared= new coherent.Application();
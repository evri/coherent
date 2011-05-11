/*jsl:import coherent*/

(function()
{

  var REVERSE = 'reverse',
      IN = 'in',
      OUT = 'out',
      WILL_SHOW_VIEW_CONTROLLER = 'navigationControllerWillShowViewController',
      DID_SHOW_VIEW_CONTROLLER = 'navigationControllerDidShowViewController',
      WILL_REMOVE_VIEW_CONTROLLER = 'navigationControllerWillRemoveViewController',
      DID_REMOVE_VIEW_CONTROLLER = 'navigationControllerDidRemoveViewController',
      VIEW_CONTROLLER_AT_INDEX = 'navigationControllerViewControllerAtIndex',
      POP_HISTORY = 'navigationControllerPopHistory',
      PUSH_HISTORY = 'navigationControllerPushHistoryForViewController';


  coherent.NavigationController = Class.create(coherent.ViewController, {

    transitionStyle: coherent.Style.NavigationDefautTransition,
    
    constructor: function(params)
    {
      this.__currentViewController= null;
      this.__previousViewController= null;
      this.__history= [];
      this.base(params);
      coherent.Application.shared.setNavigationController(this);
    },

    __viewControllerAtHistoryIndex: function(index)
    {
      if (this.delegate)
        return this.callDelegate(VIEW_CONTROLLER_AT_INDEX, this, index);
      else
        return this.__history[-index];
    },
    
    __popHistory: function()
    {
      if (this.delegate)
        this.callDelegate(POP_HISTORY, this);
      else
        this.__history.shift();
    },

    __pushHistoryForViewController: function(viewController)
    {
      if (this.delegate)
        this.callDelegate(PUSH_HISTORY, this, viewController);
      else
        this.__history.unshift(viewController);
    },
    
    rootViewController: function()
    {
      return this.__rootViewController;
    },

    setRootViewController: function(viewController)
    {
      if (!viewController)
        return;

      var view= this.view();
      
      if (this.__currentViewController)
        view.removeSubview(this.__currentViewController);
      if (this.__previousViewController)
        view.removeSubview(this.__previousViewController);
      
      this.__previousViewController= this.__viewControllerAtHistoryIndex(0);
      this.__addPreviousViewController(this.__previousViewController);
      this.__currentViewController= viewController;
      
      var rootView= viewController.view();
      
      rootView.addClassName(coherent.Style.NavigationSubview);
      rootView.addClassName(coherent.Style.kActiveClass);
      
      this.__pushHistoryForViewController(viewController);
      
      this.callDelegate(WILL_SHOW_VIEW_CONTROLLER, this, viewController);
      this.view().addSubview(rootView);
      this.__updateBars();
      this.callDelegate(DID_SHOW_VIEW_CONTROLLER, this, viewController);
    },

    __updateBars: function()
    {
      if (this.toolbar)
        this.__updateToolbar();
      if (this.navigationBar)
        this.__updateNavigationBar();
    },

    __updateNavigationBar: function()
    {
      var previousViewController = this.__previousViewController;
      var viewController= this.__currentViewController;
      
      var currentNavigationItem = viewController.navigationItem();
      var previousNavigationItem = previousViewController && previousViewController.navigationItem();

      var left = currentNavigationItem.leftBarButtonItem();
      var title = new coherent.BarButtonItem({
          style: coherent.BarButtonStyle.Title,
          title: currentNavigationItem.title(),
          customView: currentNavigationItem.titleView(),
          action: 'titleWasTapped',
          target: this
        });
      var right= currentNavigationItem.rightBarButtonItem();

      if (!left && previousNavigationItem)
      {
        left= previousNavigationItem.backBarButtonItem();
        left.target= this;
        left.action= 'back';
      }
      
      var navigationBar= this.navigationBar;
      var items= [];
      
      if (left)
        items.push(left);
      if (title)
        items.push(title);
      if (right)
        items.push(right);
      
      navigationBar.setNextResponder(viewController);
      navigationBar.setItems(items);
      
      if (!this.__topIndex)
        navigationBar.addClassName(coherent.Style.NavigationAtRoot);
      else
        navigationBar.removeClassName(coherent.Style.NavigationAtRoot);
    },

    __updateToolbar: function()
    {
      var viewController = this.topViewController();
      var toolbarItems = viewController.valueForKey('toolbarItems');
      var toolbar = this.toolbar;

      if (!toolbar || !toolbarItems || !toolbarItems.length)
        return;

      toolbar.setNextResponder(viewController);
      toolbar.setItems(toolbarItems);
    },

    topViewController: function()
    {
      return this.__currentViewController;
    },

    visibleViewController: function()
    {
      if (this.modalViewController)
        return this.modalViewController;

      var viewController = this.topViewController();
      return viewController && (viewController.modalViewController || viewController);
    },

    __animateTransition: function(oldController, newController, direction, transition, callback)
    {
      var oldNode = oldController.view().node;
      var newNode = newController.view().node;
      
      function ontransitionendOld(event)
      {
        if (event.target != oldNode)
          return;
        Event.stopObserving(oldNode, 'webkitAnimationEnd', oldHandler);
        Element.setStyle(oldNode, 'display', 'none');
        if (callback)
          callback();
      }

      function ontransitionendNew(event)
      {
        if (event.target != newNode)
          return;
        Event.stopObserving(newNode, 'webkitAnimationEnd', newHandler);
      }

      var oldHandler = Event.observe(oldNode, 'webkitAnimationEnd', Event.handler(this, ontransitionendOld));
      var newHandler = Event.observe(newNode, 'webkitAnimationEnd', Event.handler(this, ontransitionendNew));
      Element.setStyle(newNode, 'display', '');

      if (direction === REVERSE)
      {
        Element.updateClass(oldNode, [transition, OUT, REVERSE], [IN, coherent.Style.kActiveClass]);
        Element.updateClass(newNode, [transition, IN, REVERSE, coherent.Style.kActiveClass], [OUT]);
      }
      else
      {
        Element.updateClass(oldNode, [transition, OUT], [IN, REVERSE, coherent.Style.kActiveClass]);
        Element.updateClass(newNode, [transition, IN, coherent.Style.kActiveClass], [OUT, REVERSE]);
      }
    },

    __dismissModalViewController: function(callback)
    {
      if (this.modalViewController)
      {
        this.dismissModalViewController(true, callback);
        return true;
      }

      var viewController = this.topViewController();
      if (viewController.modalViewController)
      {
        viewController.dismissModalViewController(true, callback);
        return true;
      }

      return false;
    },

    pushViewController: function(viewController, animated)
    {
      var outgoingController = this.topViewController();
      var view = this.view();

      var _this = this;
      var oldViewController = this.__previousViewController;
      
      function pushAgain()
      {
        _this.pushViewController(viewController, animated);
      }

      if (this.__dismissModalViewController(pushAgain))
        return;

      view.addSubview(viewController.view());
      view.removeClassName(coherent.Style.NavigationAtRoot);
      viewController.view().addClassName(coherent.Style.NavigationSubview);

      if ('string'!==typeof(animated))
        animated= this.transitionStyle;
        
      this.__animateTransition(outgoingController, viewController, null, animated);

      this.callDelegate(WILL_SHOW_VIEW_CONTROLLER, this, viewController);
      this.__previousViewController= this.__currentViewController;
      this.__currentViewController= viewController;
      this.callDelegate(DID_SHOW_VIEW_CONTROLLER, this, viewController);

      Function.nextTick(this, function()
      {
        if (oldViewController)
        {
          this.callDelegate(WILL_REMOVE_VIEW_CONTROLLER, this, oldViewController);
          view.removeSubview(oldViewController.view());
          this.callDelegate(DID_REMOVE_VIEW_CONTROLLER, this, oldViewController);
        }
        this.__pushHistoryForViewController(viewController);
        this.__updateBars();
      });
      
    },

    popViewController: function(animated)
    {
      var newController = this.__previousViewController;
      var oldController = this.__currentViewController;
      if (!newController)
        return;

      var _this = this;

      function popAgain()
      {
        _this.popViewController(animated);
      }

      if (this.__dismissModalViewController(popAgain))
        return;

      var view= this.view(),
          prev= this.__currentViewController.view();
      
      function cleanup()
      {
        if (oldController)
        {
          _this.callDelegate(WILL_REMOVE_VIEW_CONTROLLER, this, oldController);
          view.removeSubview(prev);
          _this.callDelegate(DID_REMOVE_VIEW_CONTROLLER, this, oldController);
        }
        _this.__popHistory();
        _this.__previousViewController= _this.__viewControllerAtHistoryIndex(-1);
        _this.__addPreviousViewController(_this.__previousViewController);
        _this.__updateBars();
      }

      if ('string'!==typeof(animated))
        animated= this.transitionStyle;
      
      this.callDelegate(WILL_SHOW_VIEW_CONTROLLER, this, newController);
      this.__currentViewController= this.__previousViewController;
      this.__animateTransition(oldController, newController, REVERSE, animated, cleanup);
      this.callDelegate(DID_SHOW_VIEW_CONTROLLER, this, newController);
    },

    back: function(sender)
    {
      this.popViewController(true);
    },
    
    __addPreviousViewController: function(viewController)
    {
      if (!viewController)
        return;
        
      var view= this.view();
      var previousView= viewController.view();
      var previousNode= previousView.node;

      Element.updateClass(previousNode, [coherent.Style.NavigationSubview, OUT], [IN, REVERSE, coherent.Style.kActiveClass]);
      previousNode.style.display='none';
      
      view.addSubview(previousView);
    }

  });


})();

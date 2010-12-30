/*jsl:import coherent*/

(function(){

  var REVERSE= 'reverse',
      WILL_SHOW_VIEW_CONTROLLER= 'navigationControllerWillShowViewController',
      DID_SHOW_VIEW_CONTROLLER= 'navigationControllerDidShowViewController';

  
  coherent.NavigationController= Class.create(coherent.ViewController, {

    constructor: function(params)
    {
      this.__viewControllers= [];
      this.__topIndex=-1;
      this.manageHistory= true;
      this.base(params);
      coherent.Application.shared.setNavigationController(this);
    },
  
    rootViewController: function()
    {
      return this.__viewControllers[0];
    },
  
    setRootViewController: function(viewController)
    {
      if (this.__viewControllers.length)
        throw new Error("Can't set root view controller after initialisation");
      if (!viewController)
        return;
      
      this.__viewControllers= [viewController];
      this.__topIndex= 0;
      viewController.view().addClassName(coherent.Style.NavigationSubview);
      viewController.view().addClassName(coherent.Style.kActiveClass);
      this.callDelegate(WILL_SHOW_VIEW_CONTROLLER, this, viewController);
      this.view().addSubview(viewController.view());
      this.__updateToolbar();
      this.callDelegate(DID_SHOW_VIEW_CONTROLLER, this, viewController);
    },

    __updateToolbar: function()
    {
      var viewController= this.topViewController();
      var toolbarItems= viewController.valueForKey('toolbarItems');
      var toolbar= this.toolbar;
      
      if (!toolbar || !toolbarItems || !toolbarItems.length)
        return;

      // Always add the back button
      if (!this.__backButton)
      {
        this.__backButton= new coherent.BarButtonItem({
                                  style: 'ui-bar-back',
                                  action: 'back',
                                  target: this
                                });
      }

      var previousViewController= this.__viewControllers[this.__topIndex-1];
      if (previousViewController)
        this.__backButton.setTitle(previousViewController.valueForKey('title'));

      toolbar.setNextResponder(viewController);
      if (this.manageHistory)
        toolbarItems= [this.__backButton].concat(toolbarItems);
      toolbar.setItems(toolbarItems);
      toolbar.setTitle(viewController.valueForKey('title'));
      if (!this.__topIndex)
        toolbar.addClassName(coherent.Style.NavigationAtRoot);
      else
        toolbar.removeClassName(coherent.Style.NavigationAtRoot);
    },
  
    topViewController: function()
    {
      return this.__viewControllers && this.__viewControllers[this.__topIndex];
    },
  
    /**
      coherent.NavigationController#setTopViewController(viewController, state)
  
      - viewController (coherent.ViewController): A view controller to make visible
          at the top of the heirarchy.
      - state (Any): An application specific data structure that may be useful for
          creating view controllers.
  
      If the `viewController` parameter has already been displayed, this method will
      pop all view controllers above it in the stack. However, if it hasn't been
      displayed, it will be pushed onto the stack.
    */
    setTopViewController: function(viewController)
    {
      var index= this.__viewControllers.indexOfObject(viewController);
      if (-1===index)
        this.pushViewController(viewController);
      else
      {
        var oldController= this.__viewControllers[this.__topIndex];
        var direction= (index < this.__topIndex) ? REVERSE : null;
      
        this.__topIndex= index;
        this.__animateTransition(oldController, viewController, direction);
        this.__updateToolbar();
      }
    },
    
    visibleViewController: function()
    {
      if (this.modalViewController)
        return this.modalViewController;
        
      var viewController= this.topViewController();
      return viewController && (viewController.modalViewController || viewController);
    },
  
    viewControllers: function()
    {
      return this.__viewControllers;
    },

    //  TODO: Implement animations
    setViewControllers: function(viewControllers, animated)
    {
      var len= this.__viewControllers ? this.__viewControllers.length : 0;
      var i;
      var view= this.view();
      
      while (len--)
        view.removeSubview(this.__viewControllers[len].view());
    
      for (i=0, len=viewControllers.length; i<len; ++i)
        view.addSubview(viewControllers[i].view());
        
      this.__topIndex= this.__viewControllers.length-1;
      this.__updateToolbar();
    },
  
    __animateTransition: function(oldController, newController, direction)
    {
      var oldNode= oldController.view().node;
      var newNode= newController.view().node;

      function ontransitionendOld(event)
      {
        if (event.target!=oldNode)
          return;
        Event.stopObserving(oldNode, 'webkitAnimationEnd', oldHandler);
      }
      function ontransitionendNew(event)
      {
        if (event.target!=newNode)
          return;
        Event.stopObserving(newNode, 'webkitAnimationEnd', newHandler);
      }

      var oldHandler= Event.observe(oldNode, 'webkitAnimationEnd', ontransitionendOld);
      var newHandler= Event.observe(newNode, 'webkitAnimationEnd', ontransitionendNew);

      if (direction===REVERSE)
      {
        Element.updateClass(oldNode, ['ui-slide', 'out', 'reverse'], ['in', coherent.Style.kActiveClass]);
        Element.updateClass(newNode, ['ui-slide', 'in', 'reverse', coherent.Style.kActiveClass], ['out']);
      }
      else
      {
        Element.updateClass(oldNode, ['ui-slide', 'out'], ['in', 'reverse', coherent.Style.kActiveClass]);
        Element.updateClass(newNode, ['ui-slide', 'in', coherent.Style.kActiveClass], ['out', 'reverse']);
      }
    },
  
    __dismissModalViewController: function(callback)
    {
      if (this.modalViewController)
      {
        this.dismissModalViewController(true, callback);
        return true;
      }
      
      var viewController= this.topViewController();
      if (viewController.modalViewController)
      {
        viewController.dismissModalViewController(true, callback);
        return true;
      }
      
      return false;
    },
    
    pushViewController: function(viewController, animated)
    {
      var outgoingController= this.topViewController();
      var view= this.view();

      var _this= this;
      function pushAgain()
      {
        _this.pushViewController(viewController, animated);
      }
      
      if (this.__dismissModalViewController(pushAgain))
        return;

      //  Handle state
      coherent.Application.shared.pushState(viewController);
    
      view.addSubview(viewController.view());
      view.removeClassName(coherent.Style.NavigationAtRoot);
      viewController.view().addClassName(coherent.Style.NavigationSubview);
      
      this.__animateTransition(outgoingController, viewController, null);
      
      var len= this.__viewControllers.length;
      while (this.__topIndex<--len)
        view.removeSubview(this.__viewControllers[len].view());

      this.callDelegate(WILL_SHOW_VIEW_CONTROLLER, this, viewController);
      this.__viewControllers.length= ++this.__topIndex;
      this.__viewControllers.addObject(viewController);
      this.__updateToolbar();
      this.callDelegate(DID_SHOW_VIEW_CONTROLLER, this, viewController);
    },
  
    popViewController: function(animated)
    {
      var newController= this.__viewControllers[this.__topIndex-1];
      var oldController= this.__viewControllers[this.__topIndex];
      if (!newController)
        return;

      var _this= this;
      function popAgain()
      {
        _this.popViewController(animated);
      }

      if (this.__dismissModalViewController(popAgain))
        return;

      this.callDelegate(WILL_SHOW_VIEW_CONTROLLER, this, newController);
      this.__topIndex--;
      this.__animateTransition(oldController, newController, REVERSE);
      this.__updateToolbar();
      this.callDelegate(DID_SHOW_VIEW_CONTROLLER, this, newController);
    },

    popToViewController: function(viewController, animated)
    {
    },
  
    popToRootViewController: function(animated)
    {
    },
    
    back: function(sender)
    {
      coherent.Application.shared.popState();
      this.popViewController(true);
    }
    
  });


})();
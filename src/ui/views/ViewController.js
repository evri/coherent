/*jsl:import ../../ui.js*/

/*jsl:import ../app/Responder.js*/
/*jsl:import ../nib/NIB.js*/

(function() {
  var ANIMATION_END_EVENT = 'webkitAnimationEnd';

coherent.ModalPresentation = {
  /**
      The presented view covers the screen.
   */
  FullScreen: 'ui-fullscreen',
  /**
      The height of the presented view is set to the height of the screen and the
      view’s width is set to the width of the screen in a portrait orientation. Any
      uncovered areas are dimmed to prevent the user from interacting with them. (In
      portrait orientations, this option is essentially the same as
      UIModalPresentationFullScreen.)
   */
  PageSheet: 'ui-pagesheet',
  /**
      The width and height of the presented view are smaller than those of the
      screen and the view is centered on the screen. If the device is in a landscape
      orientation and the keyboard is visible, the position of the view is adjusted
      upward so that the view remains visible. All uncovered areas are dimmed to
      prevent the user from interacting with them.
   */
  FormSheet: 'ui-formsheet',
  /**
      The view is presented using the same style as its parent view controller.
   */
  CurrentContext: null
};

coherent.ModalTransitionStyle = {
  /**
      When the view controller is presented, its view slides up from the bottom of
      the screen. On dismissal, the view slides back down. This is the default
      transition style.
   */
  CoverVertical: "ui-slideup",
  /**
      When the view controller is presented, the current view initiates a horizontal
      3D flip from right-to-left, resulting in the revealing of the new view as if it
      were on the back of the previous view. On dismissal, the flip occurs from
      left-to-right, returning to the original view.
   */
  FlipHorizontal: "ui-flip",
  /**
      When the view controller is presented, the current view fades out while the new
      view fades in at the same time. On dismissal, a similar type of cross-fade is
      used to return to the original view.
   */
  CrossDissolve: "ui-fade"
};

/** The ViewController. More documentation coming.
    @property {String} title
      The title for the view. This might be used to provide externally
      customisable titles for a view loaded from a NIB.
    @property {String} nibName
    @property {coherent.Bundle} bundle
*/
coherent.ViewController = Class.create(coherent.Responder, {

  exposedBindings: ['representedObject'],

  /** When displayed modally, this view controller should occupy the full screen */
  modalPresentationStyle: coherent.ModalPresentation.FullScreen,

  title: function()
  {
    return this.__title;
  },

  setTitle: function(newTitle)
  {
    this.__title = newTitle;
  },

  url: function()
  {
    return this.__url;
  },

  setUrl: function(url)
  {
    this.__url = url;
  },

  /** Retrieve the view associated with this ViewController.
          @type coherent.View
   */
  view: function()
  {
    if (!this.__loading && !this.__view && this.nibName)
      this.loadView();
    return this.__view;
  },

  /** Set the view associated with this ViewController. The ViewController
          will insert itself as the next responder for the view.
  
          @param {coherent.View} view - a reference to the view
   */
  setView: function(view)
  {
    if (this.__view)
      this.__view.setNextResponder(null);

    this.__view = view;
    if (view)
      view.setNextResponder(this);
  },

  /** Load the NIB from the associated bundle... the view property will be
          connected by the standard NIB loading mechanism.
   */
  loadView: function()
  {
    if (!this.nibName)
      throw new Error("ViewController is not associated with a NIB.");

    if (this.bundle)
      this.nib = NIB.withNameInBundle(this.nibName, this.bundle);
    else
      this.nib = NIB.withName(this.nibName);
    if (!this.nib)
      throw new Error("Could not find NIB with name \"" + this.nibName + "\" in bundle \"" + this.bundle + "\"");

    this.__loading = true;
    this.nib.instantiateNibWithOwner(this);
    delete this.__loading;

    if (!this.__view)
      throw new Error("NIB does not seem to have set the view for the ViewController.");

    this.viewDidLoad();
  },

  viewDidLoad: function()
  {},

  parentViewController: function()
  {
    var responder = this;

    while ((responder = responder.nextResponder()))
      if (responder instanceof coherent.ViewController)
        return responder;

      return null;
  },

  /** If the next responder has been set explicitly via a call to
          {@link #setNextResponder}, return that value. Otherwise, return the
          superview of the view associated with this ViewController.
          @type coherent.Responder
   */
  nextResponder: function()
  {
    return this.__nextResponder || this.__view.superview();
  },

  __presentModally: function(callback)
  {
    var node = this.view().node;
    var modalNode = this.__modalNode || (this.__modalNode = document.createElement('div'));
    modalNode.className = 'ui-modal-view-wrapper';
    modalNode.style.display = 'none';  // hide the modal first -- we'll show it during animation
    modalNode.appendChild(node);
    document.body.appendChild(modalNode);
    modalNode.ontouchmove = function(event)
    {
      Event.preventDefault(event);
    }

    coherent.ModalBackdrop.showBehind(modalNode);
    
    var presentationStyle = this.modalPresentationStyle || this.parentViewController().modalPresentationStyle;
    var transitionStyle = this.modalTransitionStyle || coherent.ModalTransitionStyle.CoverVertical;

    function ontransitionend(event)
    {
      if (event.target !== modalNode)
        return;
      Event.stopObserving(modalNode, ANIMATION_END_EVENT, transitionHandler);
      if (callback)
        callback(this);
    }
    var transitionHandler = Event.observe(modalNode, ANIMATION_END_EVENT, Event.handler(this, ontransitionend));

    Element.addClassName(node, presentationStyle);
    Element.addClassName(modalNode, [transitionStyle, 'in'].join(" "));
    modalNode.style.display = '';  // show (animate) the modal
  },

  presentModalViewController: function(viewController)
  {
    var node;

    //  If there's already a view controller being displayed modally, I need to
    //  handle that first.
    if (this.modalViewController)
    {
      //  Ask the delegate (if any) whether it's OK to dismiss the current view controller
      if (false === this.callDelegate("willDismissModalViewController", this.modalViewController))
        return;

      function presentAgain()
      {
        this.modalViewController = null;
        this.presentModalViewController(viewController);
      }
      this.modalViewController.__dismissSelf(presentAgain.bind(this));
      return;
    }

    viewController.setNextResponder(this);
    this.modalViewController = viewController;
    viewController.__presentModally();
  },

  __dismissSelf: function(animated, callback)
  {
    //  Walk up the chain of modal view controllers. Only the last one is animated
    if (this.modalViewController)
    {
      function dismissed()
      {
        var firstResponder = coherent.Page.shared.firstResponder;
        if (firstResponder && firstResponder.isDescendantOf(this.view()))
          coherent.Page.shared.makeFirstResponder(null);
        this.modalViewController = null;
        this.view().node.style.display = 'none';

        coherent.ModalBackdrop.hide();
        
        if (callback)
          callback(this);
      }
      this.modalViewController.__dismissSelf(animated, dismissed.bind(this));
      return;
    }

    function ontransitionend(event)
    {
      if (event && event.target != modalNode)
        return;
      if (transitionHandler) {
        Event.stopObserving(modalNode, ANIMATION_END_EVENT, transitionHandler);
      }
      var transitionStyle = this.modalTransitionStyle || coherent.ModalTransitionStyle.CoverVertical;
      Element.updateClass(modalNode, [], [transitionStyle, "reverse", "in"]);
      modalNode.style.display = 'none';

      //  Clean up
      modalNode.ontouchmove = null;  // removing it here explicitly because it is set explicitly in __presentModally method
      coherent.View.teardownViewsForNodeTree(modalNode);
      modalNode.parentNode.removeChild(modalNode);

      if (callback) {
        callback(this);
      }
    }

    var modalNode = this.__modalNode;
    var firstResponder = coherent.Page.shared.firstResponder;
    if (firstResponder && firstResponder.isDescendantOf(this.view())) {
      coherent.Page.shared.makeFirstResponder(null);
    }
    
    coherent.ModalBackdrop.hide();
    if (animated) {
      var transitionHandler = Event.observe(modalNode, ANIMATION_END_EVENT, Event.handler(this, ontransitionend));
      Element.addClassName(modalNode, "reverse");
    } else {
      ontransitionend.call(this, {target:modalNode});
    }
  },

  dismissModalViewController: function(animated, callback)
  {
    if (this.modalViewController)
    {
      callback = typeof animated === 'function' ? animated : callback;
      animated = typeof animated === 'boolean' ? animated : true;
      this.modalViewController.__dismissSelf(animated, callback);
      this.modalViewController = null;
    }
  },

  navigationItem: function()
  {
    if (!this.__navigationItem)
      this.__navigationItem = new coherent.NavigationItem(this);
    return this.__navigationItem;
  }
  
});

})();
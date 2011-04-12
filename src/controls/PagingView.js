/*jsl:import ../ui.js*/

/**
  class coherent.PagingView

  This view presents a current page and maintains the next and previous pages.
  Pages may be present in the DOM or created on demand by the delegate. If
  present in the DOM, all pages other than the previous, current and next pages
  will be removed to improve performance.

  This class exposes the following bindings in addition to those exposed by
  [coherent.View]:

  - selectedIndex (Number): this is the index of the currently displayed page.

  See [coherent.PagingViewDelegate] for the delegate methods that you may
  implement to control behaviour of the PagingView.
 */
coherent.PagingView = Class.create(coherent.View, {

  exposedBindings: ['selectedIndex'],

  /**
    coherent.PagingView#autoAdvanceDirection -> Number
  
    If the PagingView has been set to auto advance, this is the direction for
    advancement.
   */
  autoAdvanceDirection: 1,

  animationOptions: {
    next: {
      classname: coherent.Style.kNext
    },
    previous: {
      classname: coherent.Style.kPrevious
    },
    'in': {
      classname: 'in'
    },
    'out': {
      classname: 'out'
    },
    discarded: {
      classname: coherent.Style.kFadingClass
    }
  },

  init: function()
  {
    this.refreshPages();

    var hoverInfo = {
          owner: this,
          onmouseenter: this.onmouseenter,
          onmouseleave: this.onmouseleave
        };

    this.addTrackingInfo(hoverInfo);
  },

  __pageAtIndex: function(index)
  {
    var view = this.__pages[index];
    if (view)
      return view;
    return this.__pages[index] = this.callDelegate('pagingViewPageAtIndex', this, index);
  },

  __resetPages: function()
  {
    var view;

    view = this.__pageAtIndex(0);
    if (view)
    {
      this.__selectedIndex = 0;
      this.addSubview(view);
    }

    view = this.__pageAtIndex(1);
    if (view)
    {
      this.addSubview(view);
      view.addClassName('ui-next');
    }
  },

  refreshPages: function()
  {
    this.__pages = [];
    this.numberOfPages = this.callDelegate('numberOfPagesForPagingView', this);
    if (void(0) == this.numberOfPages)
      return this.initFromDOM();

    this.__selectedIndex = 0;
    var view = this.__pageAtIndex(this.__selectedIndex);
    if (void(0) == view)
      return this.initFromDOM();

    this.addSubview(view);

    var nextOptions = this.__animationOptionsForProperty('next');
    var prevOptions = this.__animationOptionsForProperty('previous');

    if (this.__selectedIndex > 0)
    {
      view = this.__pageAtIndex(this.__selectedIndex - 1);
      if (void(0) != view)
      {
        view.addClassName(prevOptions.classname || prevOptions.add);
        this.addSubview(view);
      }
    }

    if (this.__selectedIndex + 1 < this.numberOfPages)
    {
      view = this.__pageAtIndex(this.__selectedIndex + 1);
      if (void(0) != view)
      {
        view.addClassName(nextOptions.classname || nextOptions.add);
        this.addSubview(view);
      }
    }

    return this.__resetPages();
  },

  initFromDOM: function()
  {
    //  find all the DIVs within the slideshow container
    var container = this.container();
    var children = container.children;
    var len = children.length;
    var node;
    var selectedClass = coherent.Style.kSelectedClass;
    var view;
    var fromNode = coherent.View.fromNode;
    var View = coherent.View;

    var selectedNode = null;

    this.__selectedIndex = -1;
    this.__pages = [];

    if (len)
      this.numberOfPages = len;

    while (len--)
    {
      node = children[len];
      view = fromNode(node) || new View(node);
      this.__pages[len] = view;
      view.superview().removeSubview(view);
    }

    this.__resetPages();
  },

  selectedIndex: function()
  {
    return this.__selectedIndex;
  },

  /**
    coherent.PagingView#__setVisiblePage(pageIndex)
    - pageIndex: the page that should be visible
  
    This method will display the given page. The existing visible pages will all
    be removed before updating. In addition to the specified page, the previous and
    next pages will also be added to the DOM.
   */
  __setVisiblePage: function(pageIndex)
  {
    var children = this.container().children;
    var len = children.length;
    var node;

    while (len--)
    {
      node = children[len];
      node.parentNode.removeChild(node);
    }

    var NEXT = coherent.Style.kNext,
        PREV = coherent.Style.kPrevious;

    var pageView = this.__pageAtIndex(pageIndex),
        previousView = this.__pageAtIndex(pageIndex - 1),
        nextView = this.__pageAtIndex(pageIndex + 1);

    Element.updateClass(pageView.node, [], [NEXT, PREV]);
    this.addSubview(pageView);
    Element.updateClass(previousView.node, [PREV], [NEXT]);
    this.addSubview(previousView);
    Element.updateClass(nextView.node, [NEXT], [PREV]);
    this.addSubview(nextView);
  },

  __presentPage: function(pageIndex, direction)
  {
    var incomingView = this.__pageAtIndex(pageIndex);
    var outgoingView = this.__pageAtIndex(pageIndex - direction);
    var discardView = this.__pageAtIndex(pageIndex - direction * 2);
    var stagedView = this.__pageAtIndex(pageIndex + direction);
    var Animator = coherent.Animator;
    var DURATION = 0;

    if (!incomingView)
      return;

    if (direction > 0)
    {
      Element.updateClass(this.node, [coherent.Style.kNext], [coherent.Style.kPrevious]);

      Animator.animateClassName(incomingView.node, {
        add: ['ui-paging'],
        remove: ['ui-next'],
        duration: DURATION
      });
      if (outgoingView)
        Animator.animateClassName(outgoingView.node, {
          add: ['ui-paging', 'ui-previous'],
          duration: DURATION
        });
      if (discardView)
        Animator.animateClassName(discardView.node, {
          add: ['ui-paging', 'ui-hidden'],
          duration: DURATION,
          callback: function()
          {
            if (discardView.node.parentNode)
              discardView.node.parentNode.removeChild(discardView.node);
            Element.updateClass(discardView.node, [], ['ui-hidden', 'ui-previous']);
          }
        });
      if (stagedView)
      {
        this.addSubview(stagedView);
        Element.addClassName(stagedView.node, 'ui-next ui-hidden');
        Animator.animateClassName(stagedView.node, {
          add: ['ui-paging'],
          remove: ['ui-hidden'],
          duration: DURATION
        });
      }
    }
    else
    {
      Element.updateClass(this.node, [coherent.Style.kPrevious], [coherent.Style.kNext]);

      Animator.animateClassName(incomingView.node, {
        add: ['ui-paging'],
        remove: ['ui-previous'],
        duration: DURATION
      });
      if (outgoingView)
        Animator.animateClassName(outgoingView.node, {
          add: ['ui-paging', 'ui-next'],
          duration: DURATION
        });
      if (discardView)
        Animator.animateClassName(discardView.node, {
          add: ['ui-paging', 'ui-hidden'],
          duration: DURATION,
          callback: function()
          {
            if (discardView.node.parentNode)
              discardView.node.parentNode.removeChild(discardView.node);
            Element.updateClass(discardView.node, [], ['ui-hidden', 'ui-next']);
          }
        });
      if (stagedView)
      {
        this.addSubview(stagedView);
        Element.addClassName(stagedView.node, 'ui-previous ui-hidden');
        Animator.animateClassName(stagedView.node, {
          add: ['ui-paging'],
          remove: ['ui-hidden'],
          duration: DURATION
        });
      }
    }
  },

  setSelectedIndex: function(selectedIndex)
  {
    if (this.__selectedIndex === selectedIndex || 'number' !== typeof(selectedIndex))
      return;

    var lastPage = this.numberOfPages - 1;
    if (selectedIndex < -1 || selectedIndex > lastPage)
      return;

    var direction = selectedIndex > this.__selectedIndex ? 1 : -1;

    if (Math.abs(selectedIndex - this.__selectedIndex) > 1)
      this.__setVisiblePage(selectedIndex);
    else
      this.__presentPage(selectedIndex, direction);
    this.__selectedIndex = selectedIndex;
  },

  pauseOnMouseHover: function()
  {
    return this.__pauseOnMouseHover;
  },

  setPauseOnMouseHover: function(pause)
  {
    this.__pauseOnMouseHover = pause;
  },

  onmouseenter: function()
  {
    if (!this.__pauseOnMouseHover)
      return;
    if (this.__advanceTimer)
      window.clearTimeout(this.__advanceTimer);
    this.__advanceTimer = null;
  },

  onmouseleave: function()
  {
    if (!this.__pauseOnMouseHover)
      return;
    if (this.__autoAdvanceDelay)
      this.setAutoAdvanceDelay(this.__autoAdvanceDelay);
  },

  autoAdvanceDelay: function()
  {
    return this.__autoAdvanceDelay;
  },

  setAutoAdvanceDelay: function(delay)
  {
    if (this.__advanceTimer)
      window.clearTimeout(this.__advanceTimer);
    this.__autoAdvanceDelay = delay;
    this.__advanceTimer = window.setTimeout(this.__autoAdvance.bind(this), delay);
  },

  __autoAdvance: function()
  {
    var newIndex = (this.__selectedIndex || 0) + this.autoAdvanceDirection;

    if (newIndex < 0)
      newIndex = this.numberOfPages - 1;
    else if (newIndex >= this.numberOfPages)
      newIndex = 0;

    this.setSelectedIndex(newIndex);
    if (this.bindings.selectedIndex)
      this.bindings.selectedIndex.setValue(newIndex);
    this.__advanceTimer = window.setTimeout(this.__autoAdvance.bind(this), this.__autoAdvanceDelay);
  }

});

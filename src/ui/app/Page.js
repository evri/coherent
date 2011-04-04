/*jsl:import ../../ui.js*/
/*jsl:import EventLoop.js*/
/*jsl:import Responder.js*/

/** Standard wrapper for the page.
 */
coherent.Page = Class.create(coherent.Responder, {

  focusedElement: null,

  constructor: function()
  {
    this.firstResponder = null;
    this.__mouseEventListeners = [];
    this.__hoverTrackingIds = {};
    this.__pageLocks = 0;
  },

  rootViewController: function()
  {
    return this.__rootViewController;
  },

  setRootViewController: function(viewController)
  {
    var node;

    if (this.__rootViewController)
    {
      node = this.__rootViewController.view().node;
      node.parentNode.removeChild(node);
    }

    this.__rootViewController = viewController;
    node = viewController && viewController.view().node;
    if (node)
      document.body.appendChild(node);
  },

  targetViewForEvent: function(event)
  {
    var fromNode = coherent.View.fromNode;
    var element = event.target || event.srcElement;
    var view;

    while (element && element != document && !(view = fromNode(element)))
      element = element.parentNode;

    if (!element || element == document)
      return null;
    return view;
  },

  makeFirstResponder: function(view)
  {
    if (this.firstResponder == view)
      return true;

    var firstResponder = this.firstResponder;

    //  Ask previous first responder to resign
    if (firstResponder && !firstResponder.resignFirstResponder())
      return false;

    //  Remove focus class from old firstResponder
    if (firstResponder)
      firstResponder.animateClassName(firstResponder.__animationOptionsForProperty('focus'), true);

    if (view && !view.becomeFirstResponder())
    {
      this.willChangeValueForKey('firstResponder');
      this.firstResponder = null;
      this.didChangeValueForKey('firstResponder');
      return false;
    }

    this.willChangeValueForKey('firstResponder');
    this.firstResponder = view;
    this.didChangeValueForKey('firstResponder');

    // console.log('makeFirstResponder: ', view?view.node.tagName:view);
    if (view)
    {
      view.focus();
      view.animateClassName(view.__animationOptionsForProperty('focus'));
    }
    else if (firstResponder)
      firstResponder.blur();

    return true;
  },

  addTrackingInfo: function(info)
  {
    var hooks = this.__hoverTrackingHooks || (this.__hoverTrackingHooks = []);
    hooks.push(info);
  },

  presentError: function(error)
  {
    function doit()
    {
      var description = error.description;
      if (error.recoverySuggestion)
        description += '\n' + error.recoverySuggestion;

      window.alert(description);
      coherent.Page.shared.makeFirstResponder(error.field);
    }
    doit.delay(0);
  },

  superview: function()
  {
    return null;
  },

  nextResponder: function()
  {
    return coherent.Application.shared;
  },

  _findFirstResponder: function(view)
  {
    while (view && !view.acceptsFirstResponder())
    // view= view.superview();
    view = view.nextResponder();
    if (!view)
      return;
    this.makeFirstResponder(view);
  },

  _onmousedown: function(event)
  {
    var view = this.targetViewForEvent(event);

    if (this.__mouseEventListeners.length)
      this.__mouseEventListeners.forEach(function(l)
      {
        l.onmousedown && l.onmousedown(event);
      });

    if (view)
    {
      this._findFirstResponder(view);
      view.onmousedown(event);

      Event.observe(document, 'mousemove', this._onmousedragHandler);
      this._mousedownPoint = {
        x: event.clientX,
        y: event.clientY,
        dragging: false
      };
    }
    this._mousedownView = view;
  },

  _onmouseup: function(event)
  {
    if (this._dragging)
    {
      this._dragging.onmouseup(event);
      delete this._dragging;
    }
    else if (this._mousedownView)
      this._mousedownView.onmouseup(event);

    if (this.__mouseEventListeners.length)
      this.__mouseEventListeners.forEach(function(l)
      {
        l.onmouseup && l.onmouseup(event);
      });

    this._mousedownView = null;
    Event.stopObserving(document, 'mousemove', this._onmousedragHandler);
  },

  _onmousedrag: function(event)
  {
    if (this._dragging)
    {
      this._dragging.onmousemove(event);
      return;
    }

    if (this._draggingSourceView)
      return;

    if (!this._mousedownView)
      return;

    if (!coherent.Support.DragAndDrop && !this._mousedownPoint.dragging)
    {
      var deltaX = event.clientX - this._mousedownPoint.x;
      var deltaY = event.clientY - this._mousedownPoint.y;
      if (25 >= (deltaX * deltaX + deltaY * deltaY))
        return;

      this._mousedownPoint.dragging = true;
      this._mousedownView.ondragstart(event);
      return;
    }

    this._mousedownView.onmousedrag(event);
  },

  _onmouseover: function(event)
  {
    var hooks = this.__hoverTrackingHooks || [];
    if (!hooks.length)
      return;

    var mouseOverIds = this.__mouseOverIds || {};
    var newMouseOverIds = {};

    var e = event.target || event.srcElement;
    var body = document.body;
    var id;
    var len;
    var trackingInfo;

    var matchingNodes = [];
    var nodes = [];
    var matches = [];

    //  capture the node and its parent nodes up to the body, exclude any
    //  nodes that have already received mouseenter notifications
    while (e && e != body)
    {
      id = Element.assignId(e);
      if (!(id in mouseOverIds))
        nodes.push(e);
      e = e.parentNode;
    }

    len = hooks.length;
    while (len--)
    {
      trackingInfo = hooks[len];
      if (!trackingInfo.selector)
        continue;

      matchingNodes = Element.match(trackingInfo.selector, nodes);
      if (!matchingNodes.length)
        continue;

      matches.push({
          trackingInfo: trackingInfo,
          nodes: matchingNodes
        });
    }

    //  All the matching nodes have been found
    len = matches.length;
    while (len--)
    {
      trackingInfo = matches[len].trackingInfo;

      matches[len].nodes.forEach(function(node)
      {
        if (this.onmouseenter)
          this.onmouseenter.call(this.owner, node, this.ownerInfo);
        newMouseOverIds[node.id] = this;
      },
      trackingInfo);
    }

    for (id in mouseOverIds)
    {
      if (id in newMouseOverIds)
        continue;

      e = document.getElementById(id);
      if (!e)
        continue;

      trackingInfo = mouseOverIds[id];
      if (trackingInfo.onmouseleave)
        trackingInfo.onmouseleave.call(trackingInfo.owner, e, trackingInfo.ownerInfo);
    }

    this.__mouseOverIds = newMouseOverIds;
  },

  _onmouseout: function(event)
  {},

  _onclick: function(event)
  {
    // Mozilla likes to fire an onclick when right-clicking the page,
    // (as opposed to oncontextmenu). We think this is wrong, and so 
    // we'll quit if this is the case.
    if (2 === event.button)
      return;

    if (this.__mouseEventListeners.length)
      this.__mouseEventListeners.forEach(function(l)
      {
        l.onclick && l.onclick(event);
      });

    var view = this.targetViewForEvent(event);
    if (view)
      view.onclick(event);
  },

  _ondblclick: function(event)
  {
    if (this.__mouseEventListeners.length)
      this.__mouseEventListeners.forEach(function(l)
      {
        l.ondblclick && l.ondblclick(event);
      });

    if (this._mousedownView)
      this._mousedownView.ondblclick(event);
  },

  _onkeydown: function(event)
  {
    var target = this.firstResponder;
    if (target)
      target.onkeydown(event);
  },

  _onkeyup: function(event)
  {
    var target = this.firstResponder;
    if (target)
      target.onkeyup(event);
  },

  _onkeypress: function(event)
  {
    var target = this.firstResponder;
    if (target)
      target.onkeypress(event);
  },

  _onfocus: function(event)
  {
    var target = (event.target || event.srcElement);
    if (!target)
      return;

    var isDocument = (target === window);

    if (isDocument)
    {
      if (window.dashcode && !window.dashcode.inDesign && document.body)
        Element.removeClassName(document.body, coherent.Style.kInactiveWindow);

      if (!this._documentFocused)
      {
        this.makeFirstResponder(this._previousFirstResponder || null);
        this._previousFirstResponder = null;
      }
    }
    else
    {
      var view = this.targetViewForEvent(event);

      if (view)
        view.onfocus(event);

      if (view && view.acceptsFirstResponder())
        this.makeFirstResponder(view);
      else
        this.makeFirstResponder(null);

      this.focusedElement = event.target || event.srcElement;
    }

    this._documentFocused = true;
  },

  _onblur: function(event)
  {
    var target = (event.target || event.srcElement);
    if (!target)
      return;

    var isDocument = (target === window);

    if (isDocument)
    {
      this._documentFocused = false;
      this._previousFirstResponder = this.firstResponder;
      this.makeFirstResponder(null);

      if (window.dashcode && !window.dashcode.inDesign && document.body)
        Element.addClassName(document.body, coherent.Style.kInactiveWindow);
    }
    else
    {
      var view = this.targetViewForEvent(event);

      if (view)
        view.onblur(event);

      this.focusedElement = null;

      if (view && view.acceptsFirstResponder())
        this.makeFirstResponder(null);
    }
  },

  _onchange: function(event)
  {
    var view = this.targetViewForEvent(event);
    if (view)
      view.onchange(event);
  },

  _onsubmit: function(event)
  {
    var view = this.targetViewForEvent(event);
    if (view)
      view.onsubmit(event);
  },

  _onreset: function(event)
  {
    var view = this.targetViewForEvent(event);
    if (view)
      view.onreset(event);
  },

  lockPage: function()
  {
    this.__pageLocks++;
  },

  unlockPage: function()
  {
    this.__pageLocks--;
  },

  _ontouchstart: function(event)
  {
    if (this.__mouseEventListeners.length)
      this.__mouseEventListeners.forEach(function(l)
      {
        l.ontouchstart && l.ontouchstart(event);
      });

    if (!this._touchstartView)
    {
      var view = this.targetViewForEvent(event);
      if (!view)
        return;
      this._touchstartView = view;
    }
    this._touchstartView.ontouchstart(event);
  },

  ontouchmove: function(event)
  {
    //  No other responder handled the touch move...
    if (this.__pageLocks)
      Event.preventDefault(event);
  },

  _ontouchmove: function(event)
  {
    if (1 != event.touches.length || this._gesturing)
      return;

    if (this._touchstartView)
      this._touchstartView.ontouchmove(event);
  },

  _ontouchend: function(event)
  {
    if (this.__mouseEventListeners.length)
      this.__mouseEventListeners.forEach(function(l)
      {
        l.ontouchend && l.ontouchend(event);
      });

    if (!this._touchstartView)
      return;

    this._touchstartView.ontouchend(event);
    if (!event.touches.length)
      this._touchstartView = null;
  },

  _ontouchcancel: function(event)
  {
    if (!this._touchstartView)
      return;

    this._touchstartView.ontouchend(event);
    this._touchstartView = null;
  },

  _ongesturestart: function(event)
  {
    if (!this._touchstartView)
      return;
    this._gesturing = true;
    this._touchstartView.ongesturestart(event);
  },

  _ongesturechange: function(event)
  {
    if (!this._touchstartView)
      return;

    this._touchstartView.ongesturechange(event);
  },

  _ongestureend: function(event)
  {
    if (!this._touchstartView)
      return;

    this._touchstartView.ongestureend(event);
    this._gesturing = false;
  },

  _onunload: function()
  {
    var nodes = document.getElementsByTagName("*");
    var len = nodes.length;
    var n;

    while (len--)
    {
      n = nodes[len];
      if (n.object && n.object.teardown)
        n.object.teardown();
    }
  },

  /* Drag & Drop support */
  _ondragstart: function(event)
  {
    if (this._mousedownView)
    {
      this._draggingSourceView = null;
      this._mousedownView.ondragstart(event);
      if (!this._draggingSourceView)
        Event.preventDefault(event);
    }
  },

  _ondrag: function(event)
  {
    if (this._dragging)
      this._dragging.onmousemove(event);
  },

  _ondragend: function(event)
  {
    // var dragInfo= this._dragInfoFromEvent(event);
    if (this._draggingView)
      this._draggingView.concludeDragOperation(this._draggingLastDropEffect);
    this._draggingView = null;

    if (this._draggingSourceView)
      this._draggingSourceView.draggingEndedWithOperation(this._draggingLastDropEffect);
    this._draggingSourceView = null;

    if (this._dragging)
    {
      this._dragging.cleanup();
      delete this._dragging;
    }

    this._draggingData = null;
  },

  _exitOldDragView: function(event)
  {
    if (!this._draggingView)
      return;
    var info = this._dragInfoFromEvent(event);
    this._draggingView.draggingExited(info);
    this._draggingLastDropEffect = null;
    this._draggingView = null;
  },

  /**
    @interface coherent.DragInfo
    This is an adhoc object passed to drag and drop methods.
  
    @property {Point} location - The x & y viewport coordinates of the mouse
      at the time of the event.
    @property {Element} target - The DOM node below the mouse (accounts for
      the helper nodes needed for IE & Firefox)
    @property {String[]} types - Mime types of the content being dragged.
      MSIE only supports text/plain and text/uri-list (AKA Text & URL).
    @property {String} operation - The drag operation being performed.
   */

  /**
    @name coherent.DragInfo#getData
    @description Retrieve the data associated with the drag operation.
    @function
    @type String
   */

  /** Create the drag info object from an event. This method is specialised
    based on whether the browser explicitly supports drag & drop or not,
    as well as the level of browser support for drag & drop.
  
    @function
    @param {Event} event - the dragging event
    @type coherent.DragInfo
   */
  _dragInfoFromEvent: (function()
  {

    if (coherent.Browser.IE)
    {
      var ieTypeTranslation = {
            'text/plain': 'Text',
            'text/uri-list': 'URL'
          };

      return function(event)
      {
        var data = this._draggingData;

        var node = this._dragging.node;
        var display = node.style.display;
        node.style.display = 'none';
        var target = Element.fromPoint(event.clientX, event.clientY);
        node.style.display = display;

        //  internal drag
        if (data)
          return {
            location: {
              x: event.clientX,
              y: event.clientY
            },
            target: target,
            types: coherent.Set.toArray(data),
            operation: event.dataTransfer.dropEffect || this._draggingLastDropEffect,
            getData: function(type)
            {
              return data[type] || null;
            }
          };
        else
        {
          var types = [];
          if (event.dataTransfer.getData('Text'))
            types.push('text/plain');
          if (event.dataTransfer.getData('URL'))
            types.push('text/uri-list');

          return {
            location: {
              x: event.clientX,
              y: event.clientY
            },
            target: target,
            types: types,
            operation: event.dataTransfer.dropEffect || this._draggingLastDropEffect,
            getData: function(type)
            {
              type = ieTypeTranslation[type];
              return event.dataTransfer.getData(type);
            }
          };
        }
      };
    }

    if (coherent.Support.DragAndDrop)
    {
      return function(event)
      {
        return {
          location: {
            x: event.clientX,
            y: event.clientY
          },
          target: Element.fromPoint(event.clientX, event.clientY),
          types: Array.from(event.dataTransfer.types),
          operation: event.dataTransfer.dropEffect || this._draggingLastDropEffect,
          getData: function(type)
          {
            return event.dataTransfer.getData(type);
          }
        };
      };
    }

    //  Firefox 3.0
    return function(event)
    {
      var data = this._draggingData;

      var node = this._dragging.node;
      var display;
      if (node)
      {
        display = node.style.display;
        node.style.display = 'none';
      }
      var target = Element.fromPoint(event.clientX, event.clientY);

      if (node)
        node.style.display = display;

      return {
        location: {
          x: event.clientX,
          y: event.clientY
        },
        target: target,
        types: coherent.Set.toArray(data),
        operation: this._draggingLastDropEffect,
        getData: function(type)
        {
          return data[type] || null;
        }
      };
    };

  })(),

  _ondragenter: function(event)
  {
    var view = this.targetViewForEvent(event);
    if (!view)
    {
      this._exitOldDragView(event);
      return;
    }

    var info = this._dragInfoFromEvent(event);

    var types = info.types;
    var len = info.types.length;
    var i;
    var foundView;

    //  Scan up the view hierarchy to find a view with matching registered
    //  drag types.
    while (view)
    {
      if (view.registeredDraggedTypes)
        while (len--)
        {
          if (types[len] in view.registeredDraggedTypes)
          {
            foundView = view;
            break;
          }
        }
        view = view.superview();
    }

    //  Bubbled up the chain and found the same view as previously.
    if (foundView === this._draggingView)
      return;

    if (!foundView)
    {
      //  No one is able to handle the mime-types in the drag...
      this._exitOldDragView(event);
      this._draggingLastDropEffect = 'none';
      return;
    }

    var op = foundView.draggingEntered(info);
    this._draggingView = foundView;
    this._draggingLastDropEffect = op;
    if (event.dataTransfer)
      event.dataTransfer.dropEffect = op;

    Event.preventDefault(event);
  },

  _ondragleave: function(event)
  {
    //Event.preventDefault(event);
  },

  _ondragover: function(event)
  {
    // console.log('dragover', this._draggingView, ' last=', this._draggingLastDropEffect);
    if (!this._draggingView)
    {
      event.dataTransfer.dropEffect = 'none';
      Event.preventDefault(event);
      return;
    }

    var dragInfo = this._dragInfoFromEvent(event);
    var op = this._draggingView.draggingUpdated(dragInfo);

    this._draggingLastDropEffect = op || this._draggingLastDropEffect;

    if (coherent.Support.DragAndDrop)
      event.dataTransfer.dropEffect = this._draggingLastDropEffect;

    Event.preventDefault(event);
  },

  _ondrop: function(event)
  {
    if (!this._draggingView)
      return;

    var dragInfo = this._dragInfoFromEvent(event);

    //  View accepts the drop
    if (!this._draggingView.prepareForDragOperation(dragInfo))
    {
      this._draggingLastDropEffect = 'none';
      event.dataTransfer.dropEffect = 'none';
      Event.preventDefault(event);
      return;
    }

    if (!this._draggingView.performDragOperation(dragInfo))
    {
      this._draggingLastDropEffect = 'none';
      Event.preventDefault(event);
      return;
    }
  },

  _updateOrientation: function()
  {
    var orientation= window.orientation;
    var node= document.documentElement;
    var PORTRAIT = 'portrait',
        LANDSCAPE = 'landscape',
        CLOCKWISE = 'clockwise',
        UPSIDEDOWN = 'upside-down';
        
    switch (orientation)
    {
      case 0:
        Element.updateClass(node, [PORTRAIT], [LANDSCAPE, CLOCKWISE, UPSIDEDOWN]);
        break;
      case -90:
        Element.updateClass(node, [LANDSCAPE, CLOCKWISE], [PORTRAIT, UPSIDEDOWN]);
        break;
      case 90:
        Element.updateClass(node, [LANDSCAPE], [PORTRAIT, CLOCKWISE, UPSIDEDOWN]);
        break;
      case 180:
        Element.updateClass(node, [PORTRAIT, UPSIDEDOWN], [LANDSCAPE, CLOCKWISE]);
        break;
      default:
        break;
    }
  },
  
  _onorientationchange: function(event)
  {
    this._updateOrientation();
  }

});

coherent.Page.shared = new coherent.Page();

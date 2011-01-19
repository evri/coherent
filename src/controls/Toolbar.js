/*jsl:import coherent*/

coherent.BarStyle= {
  Default: null,
  Black: 'ui-bar-black',
  BlackTranslucent: 'ui-bar-black-translucent'
};

coherent.Toolbar= Class.create(coherent.View, {

  constructor: function(node, params)
  {
    this.base(node, params);
    this.node.setAttribute('role', 'toolbar');
    
    var classes= [coherent.Style.Toolbar];
    if (this.barStyle)
      classes.push(this.barStyle);
    
    Element.updateClass(this.node, classes, []);
  },

  templateNode: function()
  {
    if (this.__templateNode)
      return this.__templateNode;
      
    if (this.node.children.length)
      this.__templateNode= this.node.children[0].cloneNode(true);
    else
    {
      var templateTagName;
      
      // try to determine what kind of node to use
      switch (this.node.tagName)
      {
        case 'UL':
        case 'OL':
          templateTagName= 'li';
          break;
        
        case 'DIV':
          templateTagName= 'div';
          break;
          
        case 'SPAN':
        default:
          templateTagName= 'span';
          break;
      }
      
      this.__templateNode= document.createElement(templateTagName);
    }
    
    Element.addClassName(this.__templateNode.className, coherent.Style.ToolbarItem);
    
    return this.__templateNode;
  },
  
  __viewForBarItem: function(barItem)
  {
    if (barItem.customView)
      return barItem.customView;
      
    var node= Element.clone(this.templateNode());

    var item= new coherent.KVO.Proxy(this.__context);
    
    var oldDataModel= coherent.dataModel;
    coherent.dataModel= item;

    item.setValueForKey(barItem, 'representedObject');
    if (barItem.id)
      node.id= barItem.id;

    //  Set up aria roles
    if (barItem.action)
      node.setAttribute('role', 'button');
      
    var view= new coherent.View(node, {
                    barItem: barItem,
                    enabledBinding: 'representedObject.enabled',
                    textBinding: 'representedObject.title',
                    classBinding: 'representedObject._class',
                    action: barItem.action,
                    target: barItem.target
                  });
    if (barItem.gestureRecognizers)
      view.setGestureRecognizers(barItem.gestureRecognizers);
    view.setupBindings();
    view.init();
    view.updateBindings();
    
    coherent.dataModel= oldDataModel;
    
    return view;
  },
  
  items: function()
  {
    return this.__items;
  },

  setItems: function(items)
  {
    if (!items || !items.length)
      return;

    var len= items.length;
    var item;
    var node= this.node;
    
    this.__items= [];
    //  clear out existing markup
    node.innerHTML= "";

    this.__titleIndex= -1;
    for (var i=0; i<len; ++i)
    {
      item= items[i];
      if (item && item.__factoryFn__)
        item= item.call(this);
      else if (!(item instanceof coherent.BarButtonItem))
        item= new coherent.BarButtonItem(item);

      this.__items.push(item);
      this.addSubview(this.__viewForBarItem(item));
    }
  }
  
});

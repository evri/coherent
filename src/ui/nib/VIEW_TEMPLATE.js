/*jsl:import VIEW.js*/
/*jsl:declare VIEW_TEMPLATE*/

coherent.VIEW_TEMPLATE= function()
{
  var viewFactory= coherent.VIEW.apply(this, arguments);
  
  function templateViewFactory(node)
  {
    viewFactory.__nib= templateViewFactory.__nib;
    viewFactory.__key= templateViewFactory.__key;
    
    var view= viewFactory(node);
    templateViewFactory.__nib.postConstruct();
    templateViewFactory.__nib.__awakeViewsFromNib(view);
    return view;
  }
  
  templateViewFactory.__viewTemplate__=true;
  return templateViewFactory;
}

coherent.__export("VIEW_TEMPLATE");
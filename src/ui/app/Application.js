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
    this.__assetLocation="";
    this.delegate= null;
    coherent.hash.addObserverForKeyPath(this, 'observeHashChange', 'value');
    return this;
  },
  
  /** Handle changes to the URL hash. If a {@link #delegate} has been set, this
      method calls the delegate's `hashDidChange` method.
    
      @param {coherent.ChangeNotification} change - The change notification with
        the new and old value for the URL hash.
   */
  observeHashChange: function(change)
  {
    var newValue= change.newValue;
    if (this.delegate && 'hashDidChange' in this.delegate)
      this.delegate.hashDidChange(newValue);
  },
  
  assetLocation: function()
  {
    return this.__assetLocation;
  },
  
  setAssetLocation: function(assetLocation)
  {
    if ('/'!==assetLocation.slice(-1))
      assetLocation+= '/';
      
    this.__assetLocation= assetLocation;
  },
  
  mainNib: function()
  {
    return this.__nib;
  },
  
  setMainNib: function(newMainNib)
  {
    this.__mainNib= newMainNib;
    
    var controller= new coherent.ViewController(newMainNib);
    controller.loadView();
    var context= controller.nib.context;

    var body= document.body;
    var views= context.__views;
    var numberOfViews= views.length;
    var view;
    
    for (var i=0; i<numberOfViews; ++i)
    {
      view= views[i];
      if (!view.node.parentNode || view.node.parentNode===coherent.View.__holdingArea)
        body.appendChild(view.node);
    }
  }
  
});


coherent.Application.shared= new coherent.Application();
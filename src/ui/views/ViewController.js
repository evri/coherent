/*jsl:import ../../ui.js*/

/*jsl:import ../app/Responder.js*/
/*jsl:import ../nib/NIB.js*/

/** The ViewController. More documentation coming.
    @property {String} title
      The title for the view. This might be used to provide externally 
      customisable titles for a view loaded from a NIB.
    @property {String} nibName
    @property {coherent.Bundle} bundle
*/
coherent.ViewController= Class.create(coherent.Responder, {

  constructor: function(nibName, bundle)
  {
    this.nibName= nibName;
    this.bundle= bundle;
  },
  
  /** Retrieve the view associated with this ViewController.
      @type coherent.View
   */
  view: function()
  {
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
      
    if ('string'===typeof(view))
      view= this.__context.valueForKeyPath(view);
      
    this.__view= view;
    view.setNextResponder(this);
  },

  /** Load the NIB from the associated bundle... the view property will be
      connected by the standard NIB loading mechanism.
   */
  loadView: function()
  {
    if (this.bundle)
      this.nib= NIB.withNameInBundle(this.nibName, this.bundle);
    else
      this.nib= NIB.withName(this.nibName);
    if (!this.nib)
      throw new Error("Could not find NIB with name \""+this.nibName +"\" in bundle \""+this.bundle+"\"");
      
    this.nib.instantiateNibWithOwner(this);
    if (!this.__view)
      throw new Error("NIB does not seem to have set the view for the ViewController.");
  },
  
  /** If the next responder has been set explicitly via a call to
      {@link #setNextResponder}, return that value. Otherwise, return the
      superview of the view associated with this ViewController.
      @type coherent.Responder
   */
  nextResponder: function()
  {
    return this.__nextResponder||this.__view.superview();
  }
    
});

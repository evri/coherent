/*jsl:import ../model.js*/


/**
  class coherent.Context

  The Context is the space in which all Model objects live. You can think of a
  context as being similar to a transaction.
 */
coherent.Context = Class.create({

  constructor: function(parentContext)
  {
    this.parentContext = parentContext;
    
    var models= coherent.Model.models;
    
    //  create properties for each model
    for (var p in models)
    {
      var m = {
            context: this,
            type: models[p],
            name: p
          };
      this[p] = Object.extend(m, coherent.Model.ClassMethods);
    }
  },

  /**
    coherent.Context#save()
  
    Save all modified objects in this context
   */
  save: function()
  {
  },
  
  /**
    coherent.Context#rollback()
    
    Reset all modified objects in this context.
   */
  rollback: function()
  {
  }
});

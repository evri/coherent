/*jsl:import ../ui.js*/

coherent.GestureRecognizer= Class.create({

  enabled: true,
  
  constructor: function(parameters)
  {
    var p, v, setter;
    
    for (p in parameters)
    {
      v= parameters[p];
      if (v && v.__factoryFn__)
      {
        v.__key= p;
        v= v.call(this);
      }
      setter= 'set' + p.titleCase();
      if (setter in this)
        this[setter](v);
      else
        this[p]= v;
    }
    this.state= coherent.GestureRecognizer.Possible;
  },

  __factory__: function(params)
  {
    var klass= this;
    
    function createGestureRecognizer()
    {
      return new klass(params);
    }
    return createGestureRecognizer;
  },
  
  reset: function()
  {
    this.state= coherent.GestureRecognizer.Possible;
  },

  ontouchstart: function(event)
  {
  },
  
  ontouchmove: function(event)
  {
  },
  
  ontouchend: function(event)
  {
  }
  
});

Object.extend(coherent.GestureRecognizer,{

  Possible: 0,
  Began: 1,
  Changed: 2,
  Recognized: 3,
  Ended: 3,
  Cancelled: 4,
  Failed: 5

});

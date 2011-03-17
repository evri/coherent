/*jsl:import ../core/../../foundation.js*/

var CancelledError= coherent.defineError('CancelledError');
var InvalidStateError= coherent.defineError('InvalidStateError');

(function (){

  var NOTFIRED= -1;
  var SUCCESS= 0;
  var FAILURE= 1;
  
  /** Any deferred value.
   */
  coherent.Deferred= Class.create({

    constructor: function(canceller)
    {
      this.canceller= canceller;
      this._result= null;
      this._status= NOTFIRED;
      this._callbacks= [];
    },
  
    _fire: function(result)
    {
      var methods, fn, scope;
      
      while (true)
      {
        if (result instanceof coherent.Deferred)
        {
          result.addMethods(this._fire, this._fire, this);
          return;
        }

        this._result= result;
        this._status= (result instanceof Error || result instanceof coherent.Error)?FAILURE:SUCCESS;
        
        if (!(methods= this._callbacks.shift()))
          return;
          
        if (!(fn= methods[this._status]))
          continue;
          
        scope= methods[2];

        result= fn.call(scope, result);
        
        //  If the method returns nothing, keep the current value, this makes
        //  writing callbacks a bit easier.
        if ('undefined'===typeof(result))
          result= this._result;
      }
    },
    
    result: function()
    {
      return this._result;
    },
    
    cancel: function()
    {
      if (NOTFIRED!==this._status)
        throw new InvalidStateError('Can not cancel Deferred because it is already complete');
      var cancelResult= (this.canceller && this.canceller());
      if (!(cancelResult instanceof Error))
        cancelResult= new CancelledError('Deferred operation cancelled');
      this.failure(cancelResult);
    },
    
    addMethods: function(newCallback, newErrorHandler, scope)
    {
      this._callbacks.push([newCallback, newErrorHandler, scope]);
      if (NOTFIRED===this._status)
        return;
      this._fire(this._result);
    },

    addCallback: function(newCallback, scope)
    {
      this.addMethods(newCallback, null, scope);
    },
    
    addErrorHandler: function(newErrorHandler, scope)
    {
      this.addMethods(null, newErrorHandler, scope);
    },
      
    callback: function(result)
    {
      if (NOTFIRED!==this._status)
        throw new InvalidStateError('Can not signal callback because Deferred is already complete: result=' + result);
      this._fire(result);
    },
  
    failure: function(error)
    {
      if (NOTFIRED!==this._status)
        throw new InvalidStateError('Can not signal failure because Deferred is already complete: error=' + error);
      this._fire(error);
    }

  });

  coherent.Deferred.createCompleted= function(value)
  {
    var d= new coherent.Deferred();
    d.callback(value);
    return d;
  }

  coherent.Deferred.createFailed= function(error)
  {
    var d= new coherent.Deferred();
    d.failure(error);
    return d;
  }
  
})();
/*jsl:import kvo.js*/

coherent.KVO.Proxy= Class._create(coherent.KVO, {
  
  constructor: function(original)
  {
    this.__original= original;
    this.initialiseKeyValueObserving();
  },
  
  valueForKey: function(key)
  {
    var keys= this.__kvo.keys;
    if (key in keys)
      return keys[key].get(this);

    return this.__original.valueForKey(key);
  },
  
  addObserverForKeyPath: function(observer, callback, keyPath, context)
  {
    var path = keyPath.split('.');
    var first = path[0];
    
    if (('representedObject'!==first) && (first in this.__original))
      this.__original.addObserverForKeyPath(observer, callback, keyPath, context);
    else
      this.base(observer, callback, keyPath, context);
  },
  
  removeObserverForKeyPath: function(observer, keyPath)
  {
    var path= keyPath.split('.');
    if (path[0] in this.__original)
      this.__original.removeObserverForKeyPath(observer, keyPath);
    else
      this.base(observer, keyPath);
  }
});
  

/*jsl:import ../model.js*/

coherent.Model.ToOne = Class._create(coherent.Model.Property, {

  constructor: function(decl)
  {
    if (!(this instanceof coherent.Model.ToOne))
      return new coherent.Model.ToOne(decl);

    decl = Object.applyDefaults(decl, coherent.Model.ToOne.DEFAULTS);
    coherent.Model.Property.call(this, decl);
    return void(0);
  },

  unrelateObjects: function(object, relatedObject)
  {
    object.setValueForKey(null, this.key);
  },

  relateObjects: function(object, relatedObject)
  {
    var previous = object.valueForKey(this.key);
    if (previous === relatedObject)
      return;
    object.setValueForKey(relatedObject, this.key);
  },

  fixupInverseRelation: function(oldValue, newValue)
  {
    var inverse = this.type.schema[this.inverse];
    var oldValueInverse = oldValue ? oldValue.primitiveValueForKey(this.inverse) : null;
    var newValueInverse = newValue ? newValue.primitiveValueForKey(this.inverse) : null;

    if (inverse instanceof coherent.Model.ToOne)
    {
      if (oldValue && this === oldValueInverse)
        oldValue.setValueForKey(null, this.inverse);
      if (newValue && this !== newValueInverse)
        newValue.setValueForKey(this, this.inverse);
    }
    else if (inverse instanceof coherent.Model.ToMany)
    {
      var oldValueIndexOfThis = oldValueInverse ? oldValueInverse.indexOfObject(this) : -1;
      var newValueIndexOfThis = newValueInverse ? newValueInverse.indexOfObject(this) : -1;

      if (oldValueInverse && -1 !== oldValueIndexOfThis)
        oldValueInverse.removeObjectAtIndex(oldValueIndexOfThis);
      if (newValue && -1 === newValueIndexOfThis)
        newValueInverse.addObject(this);
    }
  }

});

coherent.Model.ToOne.DEFAULTS = {
  composite: false
};

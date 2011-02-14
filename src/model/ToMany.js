/*jsl:import ../model.js*/

coherent.Model.ToMany = Class._create(coherent.Model.Property, {

  constructor: function(decl)
  {
    if (!(this instanceof coherent.Model.ToMany))
      return new coherent.Model.ToMany(decl);

    decl = Object.applyDefaults(decl, coherent.Model.ToMany.DEFAULTS);
    coherent.Model.Property.call(this, decl);
    return void(0);
  },

  isValidType: function(value)
  {
    if (!Array.isArray(value))
      return false;

    if (!this.type)
      return true;

    var len = value.length,
        valid = true;

    while (valid && len--)
    {
      if (this.primitive)
        valid = value[len].constructor === this.type;
      else
        valid = value[len]
          instanceof this.type;
      }

      return valid;
    },

    fromPrimitiveValue: function(array)
    {
      if (!this.type)
        return array;

      if (null === array)
        return [];

      var len = array.length;
      var value;

      while (len--)
      {
        value = array[len];
        if (void(0) == value)
          value = new this.type();
        else if (Date === this.type)
          value = new Date(Date.parse(value));
        else if (!this.composite)
          value = this.type.create(value);
        else
          value = new this.type(value);

        if (this.primitive && Date != this.type)
          value = value.valueOf();

        array[len] = value;
      }

      return array;
    },

    relateObjects: function(object, relatedObject)
    {
      var array = object.valueForKey(this.key);
      var index = array.indexOfObject(relatedObject);
      if (-1 !== index)
        return;
      array.addObject(relatedObject);
    },

    unrelateObjects: function(object, relatedObject)
    {
      var array = object.valueForKey(this.key);
      var index = array.indexOfObject(relatedObject);
      if (-1 === index)
        return;
      array.removeObjectAtIndex(index);
    }

  });

coherent.Model.ToMany.DEFAULTS = {
  composite: false
};

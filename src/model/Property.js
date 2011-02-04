/*jsl:import ../model.js*/

coherent.Model.Property = Class._create({

    constructor: function(decl)
    {
      if (!(this instanceof coherent.Model.Property))
        return new coherent.Model.Property(decl);

      Object.extend(this, decl);
      Object.applyDefaults(this, coherent.Model.Property.DEFAULTS);
      this.primitive = (-1 !== coherent.Model.PRIMITIVE_TYPES.indexOf(this.type));
      return void(0);
    },

    isValidType: function(value)
    {
      if (void(0) == value || !this.type)
        return true;

      if (this.primitive)
        return value.constructor === this.type;
      else
        return value instanceof this.type;
    },

    fromValue: function(value)
    {
      if (!this.type)
        return value;

      if (null === value)
        value = new (this.type)();
      else if (Date === this.type)
        value = new Date(Date.parse(value));
      else if (!this.composite)
        value = this.type.create(value);
      else
        value = new (this.type)(value);

      if (this.primitive && Date !== this.type)
        value = value.valueOf();

      return value;
    }

  });

coherent.Model.Property.DEFAULTS = {
  composite: true
};

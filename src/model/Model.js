/*jsl:import ../model.js*/
/*jsl:declare Model*/

(function(){

  var PRIMITIVE_TYPES= [String, Number, RegExp, Boolean, Date];
  
  /** Hash from name of model to the model definition */
  var models= {};

  function makeGetter(key)
  {
    function getter()
    {
      var value= this.primitiveValueForKey(getter.__key);
    
      var keyInfo= this.infoForKey(getter.__key);
      if (!keyInfo)
        return value;
  
      if (value && value.addObserverForKeyPath)
        coherent.KVO.linkChildToParent(value, this, keyInfo);
      else if (keyInfo.parentLink)
        coherent.KVO.breakParentChildLink(keyInfo);
      
      return value;
    }
    getter.__key= key;
    return getter;
  }
  
  function makeSetter(key)
  {
    function setter(value)
    {
      var keyInfo= this.infoForKey(setter.__key);
      this.willChangeValueForKey(setter.__key, keyInfo);
      var result= this.setPrimitiveValueForKey(value, setter.__key);
      this.didChangeValueForKey(setter.__key, keyInfo);
      return result;
    }
    setter.__key= key;
    return setter;
  }
  
  coherent.Model= function(name, decl)
  {
    if (name in models)
      throw new Error("Model " + name + " already defined");
    
    var Klass= Class.create(coherent.ModelObject,{});
    var classInfo= coherent.KVO.getClassInfoForObject(Klass.prototype);
    var value;
    var setKey;
    var validateKey;
    var setter;
    var wrapMethod= coherent.KeyInfo.wrapMethod;
    var wrapGetMethod= coherent.KeyInfo.wrapGetMethod;
    var wrapSetMethod= coherent.KeyInfo.wrapSetMethod;
    var Property= coherent.Model.Property;
    var schema= {};
    var primitive;
    
    Klass.modelName= name;
    Klass.schema= schema;
    models[name]= Klass;
    
    decl= decl||{};
    if ('persistence' in decl)
    {
      Klass.persistence= decl.persistence;
      if ('function'===typeof(Klass.persistence))
      {
        if (Klass.persistence.__factoryFn__)
          Klass.persistence= Klass.persistence(Klass);
        else
          Klass.persistence= new Klass.persistence(Klass, {});
      }
      
      delete decl.persistence;
    }
    
    for (var key in decl)
    {
      setKey= 'set'+key.titleCase();
      validateKey= 'validate'+key.titleCase();
      
      value= decl[key];
      
      if (value instanceof Property)
      {
        value.key= key;
        
        if (value.get)
          decl[key]= wrapMethod(wrapGetMethod, value.get, key);
        else
          decl[key]= makeGetter(key);
        if (value.set)
          decl[setKey]= wrapMethod(wrapSetMethod, value.set, key);
        else if (!value.readOnly)
          decl[setKey]= makeSetter(key);
          
        classInfo.methods[key]= {
          getter: value.get,
          setter: value.set,
          validator: value.validate
        };
        
        schema[key]= value;
        continue;
      }
      
      if ('function'!==typeof(value))
        continue;

      primitive=(-1!==PRIMITIVE_TYPES.indexOf(value));
      if (primitive || 'modelName' in value)
      {
        decl[key]= makeGetter(key);
        decl[setKey]= makeSetter(key);
        schema[key]= new Property({
          key: key,
          get: decl[key],
          set: decl[setKey],
          validate: decl[validateKey],
          type: value,
          primitive: primitive
        });
        classInfo.methods[key]= {
          getter: decl[key],
          setter: decl[setKey],
          validator: decl[validateKey]
        };
        continue;
      }
      
      /* TODO: How should this specify type? */
      setter= decl[setKey];
      if (!setter)
        continue;
        
      decl[key]= wrapMethod(wrapGetMethod, value, key);
      decl[setKey]= wrapMethod(wrapSetMethod, setter, key);
  
      schema[key]= new Property({
        key: key,
        set: setter,
        get: value,
        validate: decl[validateKey]
      });
      
      classInfo.methods[key]= {
        setter: setter,
        getter: value,
        validator: decl[validateKey]
      };
      
    }
    
    if ('keyDependencies' in decl)
    {
      var dependencies= decl.keyDependencies;
      var proto= Klass.prototype;
      delete decl.keyDependencies;
      for (var p in dependencies)
        proto.setKeysTriggerChangeNotificationsForDependentKey(dependencies[p], p);
    }
    
    Class.extend(Klass, decl);
    Object.applyDefaults(Klass, coherent.Model.ClassMethods);
    
    Klass.collection= [];
    
    return Klass;
  }

  coherent.Model._resetModels= function()
  {
    models= {};
  }
  
  coherent.Model.modelWithName= function(name)
  {
    var model= models[name];
    if (!model)
      throw new Error("No model with name: "+name);
    return model;
  }
  
  coherent.Model.Property= Class._create({
  
    constructor: function(decl)
    {
      if (!(this instanceof coherent.Model.Property))
        return new coherent.Model.Property(decl);

      Object.extend(this, decl);
      Object.applyDefaults(this, coherent.Model.Property.DEFAULTS);
      this.primitive= (-1!==PRIMITIVE_TYPES.indexOf(this.type));
      return void(0);
    },
  
    isValidType: function(value)
    {
      if (void(0)==value || !this.type)
        return true;

      if (this.primitive)
        return value.constructor===this.type;
      else
        return value instanceof this.type;
    },
    
    fromValue: function(value)
    {
      if (!this.type)
        return value;
      
      if (null===value)
        value= new (this.type)();
      else if (Date===this.type)
        value= new Date(Date.parse(value));
      else
        value= new (this.type)(value);
    
      if (this.primitive && Date!==this.type)
          value=value.valueOf();

      return value;
    }
    
  });
  
  coherent.Model.Property.DEFAULTS= {
    composite: true
  };



  coherent.Model.ToOne= Class._create(coherent.Model.Property, {
  
    constructor: function(decl)
    {
      if (!(this instanceof coherent.Model.ToOne))
        return new coherent.Model.ToOne(decl);

      decl= Object.applyDefaults(decl, coherent.Model.ToOne.DEFAULTS);
      coherent.Model.Property.call(this, decl);
      return void(0);
    },

    unrelateObjects: function(object, relatedObject)
    {
      object.setValueForKey(null, this.key);
    },
    
    relateObjects: function(object, relatedObject)
    {
      var previous= object.valueForKey(this.key);
      if (previous===relatedObject)
        return;
      object.setValueForKey(relatedObject, this.key);
    },
     
    fixupInverseRelation: function(oldValue, newValue)
    {
      var inverse= this.type.schema[this.inverse];
      var oldValueInverse= oldValue ? oldValue.primitiveValueForKey(this.inverse) : null;
      var newValueInverse= newValue ? newValue.primitiveValueForKey(this.inverse) : null;

      if (inverse instanceof coherent.Model.ToOne)
      {
        if (oldValue && this===oldValueInverse)
          oldValue.setValueForKey(null, this.inverse);
        if (newValue && this!==newValueInverse)
          newValue.setValueForKey(this, this.inverse);
      }
      else if (inverse instanceof coherent.Model.ToMany)
      {
        var oldValueIndexOfThis= oldValueInverse ? oldValueInverse.indexOfObject(this) : -1;
        var newValueIndexOfThis= newValueInverse ? newValueInverse.indexOfObject(this) : -1;
        
        if (oldValueInverse && -1!==oldValueIndexOfThis)
          oldValueInverse.removeObjectAtIndex(oldValueIndexOfThis);
        if (newValue && -1===newValueIndexOfThis)
          newValueInverse.addObject(this);
      }
    }
  
  });
  
  coherent.Model.ToOne.DEFAULTS= {
    composite: false
  };



  coherent.Model.ToMany= Class._create(coherent.Model.Property, {

    constructor: function(decl)
    {
      if (!(this instanceof coherent.Model.ToMany))
        return new coherent.Model.ToMany(decl);

      decl= Object.applyDefaults(decl, coherent.Model.ToMany.DEFAULTS);
      coherent.Model.Property.call(this, decl);
      return void(0);
    },
    
    isValidType: function(value)
    {
      if (!Array.isArray(value))
        return false;

      if (!this.type)
        return true;

      var len= value.length,
          valid= true;
          
      while (valid && len--)
      {
        if (this.primitive)
          valid= value[len].constructor===this.type;
        else
          valid= value[len] instanceof this.type;
      }
      
      return valid;
    },

    fromValue: function(array)
    {
      if (!this.type)
        return array;
      
      if (null===array)
        return [];
      
      var len= array.length;
      var value;
      
      while (len--)
      {
        value= array[len];
        if (void(0)==value)
          value= new this.type();
        else if (Date===this.type)
          value= new Date(Date.parse(value));
        else
          value= new this.type(value);
        
        if (this.primitive && Date!=this.type)
          value= value.valueOf();
        array[len]= value;
      }
      
      return array;
    },

    relateObjects: function(object, relatedObject)
    {
      var array= object.valueForKey(this.key);
      var index= array.indexOfObject(relatedObject);
      if (-1!==index)
        return;
      array.addObject(relatedObject);
    },
    
    unrelateObjects: function(object, relatedObject)
    {
      var array= object.valueForKey(this.key);
      var index= array.indexOfObject(relatedObject);
      if (-1===index)
        return;
      array.removeObjectAtIndex(index);
    }
    
  });
  
  coherent.Model.ToMany.DEFAULTS= {
    defaultValue: [],
    composite: false
  };



  Object.markMethods(coherent.Model);
  coherent.__export("Model");
})();
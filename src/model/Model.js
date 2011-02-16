/*jsl:import ../model.js*/
/*jsl:declare Model*/

(function()
{

  var PRIMITIVE_TYPES = [String, Number, RegExp, Boolean, Date];

  /** Hash from name of model to the model definition */
  var models = {};

  /** Create a new Model object. */
  coherent.Model = function(name, decl)
  {
    if (name in models)
      throw new Error("Model " + name + " already defined");

    var Klass = Class.create(coherent.ModelObject, {});
    var classInfo = coherent.KVO.getClassInfoForObject(Klass.prototype);
    var value;
    var setKey;
    var validateKey;
    var setter;
    var getter;
    var wrapMethod = coherent.KeyInfo.wrapMethod;
    var wrapGetMethod = coherent.KeyInfo.wrapGetMethod;
    var wrapSetMethod = coherent.KeyInfo.wrapSetMethod;
    var Property = coherent.Model.Property;
    var schema = {};
    var primitive;
    var USE_PROPERTIES = coherent.Model.USE_PROPERTIES;

    if (USE_PROPERTIES && !coherent.Support.DefineProperty)
      throw new Error("coherent.Model.USE_PROPERTIES is set to true, but the Object.defineProperty is not supported");

    Klass.modelName = name;
    Klass.schema = schema;
    models[name] = Klass;

    decl = decl || {};
    if ('persistence' in decl)
    {
      Klass.persistence = decl.persistence;
      if ('function' === typeof(Klass.persistence))
      {
        if (Klass.persistence.__factoryFn__)
          Klass.persistence = Klass.persistence(Klass);
        else
          Klass.persistence = new Klass.persistence(Klass, {});
      }

      delete decl.persistence;
    }

    for (var key in decl)
    {
      if ('id'===key)
      {
        console.log("Declaration of model '"+name+"' includes 'id' which is reserved");
        continue;
      }

      setKey = 'set' + key.titleCase();
      validateKey = 'validate' + key.titleCase();

      value = decl[key];

      if (value instanceof Property)
      {
        if (!value.key)
          value.key = key;

        if (USE_PROPERTIES)
        {
          var descriptor = {
                get: value.get ? wrapMethod(wrapGetMethod, value.get, key) : makeGetter(key),
                set: value.set ? wrapMethod(wrapSetMethod, value.set, key) : makeSetter(key),
                enumerable: true
              };
          delete decl[key];
          Object.defineProperty(decl, key, descriptor);
        }
        else
        {
          if (value.get)
            decl[key] = wrapMethod(wrapGetMethod, value.get, key);
          else
            decl[key] = makeGetter(key);
          if (value.set)
            decl[setKey] = wrapMethod(wrapSetMethod, value.set, key);
          else if (!value.readOnly)
            decl[setKey] = makeSetter(key);
        }

        classInfo.methods[key] = {
          methods: {
            get: value.get,
            set: value.set,
            validate: value.validate
          },
          mutable: !value.get || !! value.set
        };

        schema[key] = value;
        continue;
      }

      if ('function' !== typeof(value))
        continue;

      primitive = (-1 !== PRIMITIVE_TYPES.indexOf(value));
      if (primitive || 'modelName' in value)
      {
        getter = makeGetter(key);
        setter = makeSetter(key);

        if (USE_PROPERTIES)
        {
          delete decl[key];
          Object.defineProperty(decl, key, {
            get: getter,
            set: setter,
            enumerable: true
          });
        }
        else
        {
          decl[key] = getter;
          decl[setKey] = setter;
        }
        schema[key] = new Property({
            key: key,
            get: getter,
            set: setter,
            validate: decl[validateKey],
            type: value,
            primitive: primitive
          });
        classInfo.methods[key] = {
          methods: {
            get: getter,
            set: setter,
            validate: decl[validateKey]
          },
          mutable: true
        };
        continue;
      }

      /* TODO: How should this specify type? */
      setter = decl[setKey];
      if (!setter)
        continue;

      decl[key] = wrapMethod(wrapGetMethod, value, key);
      decl[setKey] = wrapMethod(wrapSetMethod, setter, key);

      schema[key] = new Property({
          key: key,
          set: setter,
          get: value,
          validate: decl[validateKey]
        });

      classInfo.methods[key] = {
        methods: {
          get: value,
          set: setter,
          validate: decl[validateKey]
        },
        mutable: true
      };

    }

    if ('keyDependencies' in decl)
    {
      var dependencies = decl.keyDependencies;
      var proto = Klass.prototype;
      delete decl.keyDependencies;
      for (var p in dependencies)
        proto.setKeysTriggerChangeNotificationsForDependentKey(dependencies[p], p);
    }

    Class.extend(Klass, decl);
    Object.applyDefaults(Klass, coherent.Model.ClassMethods);

    Klass.collection = [];

    return Klass;
  }

  coherent.Model.PRIMITIVE_TYPES = PRIMITIVE_TYPES;

  coherent.Model.USE_PROPERTIES = false;

  coherent.Model.models = models;
  
  coherent.Model.__resetModels = function()
  {
    models = {};
  }

  coherent.Model.modelWithName = function(name)
  {
    var model = models[name];
    if (!model)
      throw new Error("No model with name: " + name);
    return model;
  }


  /** private
    makeGetter(key) -> Function
    - key (String): the name of the property this getter function returns
  
    Create a function that will fetch a value from the ModelObject instance.
    This method automatically handles linking values back to their parents and
    accesses the primitive value stores.
   */

  function makeGetter(key)
  {
    function getter()
    {
      var value = this.primitiveValueForKey(getter.__key);

      var keyInfo = this.infoForKey(getter.__key);
      if (!keyInfo)
        return value;

      if (value && value.addObserverForKeyPath)
        coherent.KVO.linkChildToParent(value, this, keyInfo);
      else if (keyInfo.parentLink)
        coherent.KVO.breakParentChildLink(keyInfo);

      return value;
    }
    getter.__key = key;
    return getter;
  }

  /** private
    makeSetter(key) -> Function
    - key (String): the name of the property this setter function modifies
  
    Create a function to update the value of a property for a ModelObject
    instance. This method automatically handles triggering change notifications
    and updates the primitive value store.
   */

  function makeSetter(key)
  {
    function setter(value)
    {
      var keyInfo = this.infoForKey(setter.__key);
      this.willChangeValueForKey(setter.__key, keyInfo);
      var result = this.setPrimitiveValueForKey(value, setter.__key);
      this.didChangeValueForKey(setter.__key, keyInfo);
      return result;
    }
    setter.__key = key;
    return setter;
  }

  Object.markMethods(coherent.Model);
  coherent.__export("Model");

})();

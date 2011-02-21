/*jsl:import ../model.js*/

(function()
{

  /** Define the base class for all Model objects. */
  coherent.ModelObject = Class.create(coherent.KVO, {

    /**
      coherent.ModelObject#constructor(hash) -> coherent.ModelObject
      - hash (Object): The object used to initialise the properties of this model instance.
     */
    constructor: function(hash)
    {
      this.initialiseKeyValueObserving();
      this.__initialiseSchema();
      this.original = {};
      this.changes= {};
      this.base(hash);
      this.original= this.changes;
      this.reset();
      this.__fault= true;
      this.__context= null;
    },

    __initialiseSchema: function()
    {
      var schema = this.constructor.schema;
      var info;

      if (schema.__initialised)
        return;

      schema.__keyTranslation= {};
      
      for (var p in schema)
      {
        info = schema[p];
        
        //  Enable looking up the internal key name based on the external key
        if (info.key !== p)
          schema.__keyTranslation[info.key]= p;
          
        /*
          It's possible to specify the type of a property as a string. This
          makes it easy to avoid circular references when you're defining your
          models. However, that's not particularly useful when actually using
          the property, so this would be a good place to fix that up.
         */
        if ('string' === typeof(info.type))
          info.type = coherent.Model.modelWithName(info.type);
      }
      schema.__initialised = true;
    },

    /**
      coherent.ModelObject#merge(hash)
      - hash (Object): A dictionary of key-value pairs that should be merged into
        the definition of this model instance.
    
      This method is largely used for merging a dictionary of external values with
      the properties of this model instance. This method will perform type
      conversion that coherent.KVO#setValuesFromDictionary does not.
     */
    merge: function(hash, suppressNotifications)
    {
      var schema = this.constructor.schema,
          keyTranslation=  schema.__keyTranslation,
          keys= [],
          info,
          value;
      
      hash = Object.extend({}, hash);

      for (var key in hash)
      {
        info = schema[keyTranslation[key] || key];
        if (!info)
        {
          coherent.KVO.adaptTree(hash[key]);
          continue;
        }
        hash[key] = info.fromPrimitiveValue(hash[key]);
        if (!suppressNotifications)
          this.willChangeValueForKey(key);
        keys.push(key);
      }

      this.original = Object.extend(this.original, hash);
      this.changes = {};
      this.changeCount = 0;

      if (!suppressNotifications)
      {
        var len = keys.length;
        for (var i = 0; i < len; ++i)
          this.didChangeValueForKey(keys[i]);
      }
    },

    observeChildObjectChangeForKeyPath: function(change, keypath, context)
    {
      //  Faster than calling base.
      coherent.KVO.prototype.observeChildObjectChangeForKeyPath.call(this, change, keypath, context);

      //  Ignore notifications from deeper in the object graph
      if ('*' !== keypath)
        return;

      //  Handle insertion & deletion from to-many relations
      //  The context holds the key name of the child that's changing.
      var info = this.constructor.schema[context];
      if (!info || !info.inverse)
        return;

      var inverse = info.type.schema[info.inverse];
      var len, i;

      switch (change.changeType)
      {
        case coherent.ChangeType.insertion:
          //  relate each of the new items to this object
          for (i = 0, len = change.newValue.length; i < len; ++i)
            inverse.relateObjects(change.newValue[i], this);
          break;

        case coherent.ChangeType.deletion:
          for (i = 0, len = change.oldValue.length; i < len; ++i)
            inverse.unrelateObjects(change.oldValue[i], this);
          break;

        case coherent.ChangeType.replacement:
          for (i = 0, len = change.oldValue.length; i < len; ++i)
          {
            inverse.unrelateObjects(change.oldValue[i], this);
            inverse.relateObjects(change.newValue[i], this);
          }
          break;

        default:
          //  I don't think there's anything I should do here...
          break;
      }
    },

    id: function()
    {
      var uniqueId = this.constructor.uniqueId;
      return this.original[uniqueId] || this.changes[uniqueId];
    },

    setId: function(id)
    {
      var uniqueId = this.constructor.uniqueId;
      if (void(0) == this.original[uniqueId])
        this.changes[uniqueId] = id;
      else
        console.log("Attempting to set the ID of an existing object: original ID=", this.original[uniqueId], "new value=", id);
    },

    isNew: function()
    {
      return void(0) == this.id();
    },

    isUpdated: function()
    {
      return this.changeCount > 0;
    },

    reset: function()
    {
      this.changes = {};
      this.changeCount = 0;
    },

    primitiveValueForKey: function(key)
    {
      var info = this.constructor.schema[key];
      key = (info && info.key) || key;

      if (key in this.changes)
        return this.changes[key];
      else if (key in this.original)
        return this.original[key];

      if (info instanceof coherent.Model.ToMany)
        return this.changes[key] = [];

      return null;
    },

    setPrimitiveValueForKey: function(value, key)
    {
      var info = this.constructor.schema[key];
      var previous;

      if (info && !info.isValidType(value))
        throw new Error("Invalid type for " + key);

      key = (info && info.key) || key;

      if (this.original[key] === value)
      {
        previous = key in this.changes ? this.changes[key] : null;
        delete this.changes[key];
        this.changeCount--;
      }
      else
      {
        if (key in this.changes)
        {
          previous = this.changes[key];
        }
        else
        {
          previous = this.original[key];
          this.changeCount++;
        }
        this.changes[key]= value;
      }

      if (!info || !info.inverse || previous===value)
        return value;

      var inverse = info.type.schema[info.inverse];
      if (previous)
        inverse.unrelateObjects(previous, this);
      if (value)
        inverse.relateObjects(value, this);
      return value;
    },

    infoForKey: function(key)
    {
      if (coherent.KVO.kAllPropertiesKey == key)
        return null;

      if (!this.__kvo)
        this.initialiseKeyValueObserving();

      var keys = this.__kvo.keys;
      if (key in keys)
        return keys[key];
      return keys[key] = new coherent.ModelKeyInfo(key, this);
    },

    toJSON: function()
    {
      var json = Object.extend({}, this.original);
      Object.extend(json, this.changes);

      var schema = this.constructor.schema;
      var info, value, key;

      for (var p in schema)
      {
        info = schema[p];
        if (info.composite || !(info.type && info.type.prototype instanceof coherent.ModelObject))
          continue;
        key = info.key || p;
        if (!info.persistent)
        {
          delete json[key];
          continue;
        }
        
        value = json[key];
        if (void(0)==value)
          continue;

        if (info instanceof coherent.Model.ToOne)
        {
          json[p] = value.id();
          if (void(0) == json[p])
            console.log("ModelObject#toJSON: object for key \"" + p + "\" does not have an ID.");
        }
        else if (info instanceof coherent.Model.ToMany)
          json[p] = value.map(function(obj, index)
          {
            var id = obj.id();
            if (void(0) == id)
              console.log("ModelObject#toJSON: object at index " + index + " for key \"" + p + "\" does not have an ID.");
            return id;
          });
      }
      return json;
    },

    awakeFromFetch: function()
    {},

    validateForSave: function()
    {
      return true;
    },

    validateForUpdate: function()
    {
      return true;
    },

    validateForDestroy: function()
    {
      return true;
    },

    prefetch: function()
    {
      var model = this.constructor;
      if (!model.persistence || this.isNew())
        return;
      model.persistence.prefetch(this);
    },

    fetch: function()
    {
      var model = this.constructor;

      if (!this.__fault)
        return coherent.Deferred.createCompleted(this);
        
      function oncomplete(json)
      {
        this.merge(json);
        this.awakeFromFetch();
        this.__fetching = null;
        this.__fault= false;
        return this;
      }

      if (this.__fetching)
        return this.__fetching;

      var d;

      if (!model.persistence || this.isNew())
        return coherent.Deferred.createCompleted(this);

      d = model.persistence.fetch(this);
      d.addCallback(oncomplete, this);
      this.__fetching = d;
      return d;
    },

    save: function()
    {
      var model = this.constructor;
      var isNew = this.isNew();
      var error = isNew ? this.validateForSave() : this.validateForUpdate();
      var d;

      if (error instanceof coherent.Error)
        return coherent.Deferred.createFailed(error);

      function oncomplete(json)
      {
        this.merge(this.changes);
        if (json)
          this.merge(json);
        this.reset();
        if (isNew)
          model.add(this);
        return this;
      }

      if (model.persistence)
      {
        d = model.persistence[isNew ? 'create' : 'update'](this);
        d.addCallback(oncomplete, this);
      }
      else
      {
        if (isNew)
          model.add(this);
        d = coherent.Deferred.createCompleted(this);
      }
      return d;
    },

    destroy: function(callback)
    {
      var model = this.constructor;
      var error = this.validateForDestroy();
      if (error instanceof coherent.Error)
      {
        if (callback)
          callback(error);
        return;
      }

      var wrappedCallback = function(error)
          {
            if (!error)
              model.remove(this);
            if (callback)
              callback(error);
          };

      if (model.persistence)
        model.persistence.destroy(this, wrappedCallback);
      else
        wrappedCallback.call(this, null);
    }

  });

})();

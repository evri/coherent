/*jsl:import ../model.js*/

/**
  mixin coherent.Model.ClassMethods

  These are methods that are added to each Model class. This makes it easy to
  find, count, and perform operations on the set of all instances of that Model.
 */
coherent.Model.ClassMethods = {

  /**
    coherent.Model.uniqueId
  
    A string representing the name of the unique ID used to track instances of
    the Model. By default, the uniqueId is 'id'.
   */
  uniqueId: 'id',

  __init: function()
  {
    this.objects= {};
    this.newObjects= {};
    this.collection= [];
  },
  
  /**
    coherent.Model.add(model)
    - model (ModelObject): the instance of a Model that should be tracked.
  
    This method stores a reference to the model instance so that it may be found
    using other methods.
   */
  add: function(model)
  {
    var id= model.id();
    if (void(0)==id)
    {
      if (model.__uid in this.newObjects)
        return;
      this.newObjects[model.__uid]= model;
    }
    else
    {
      if (id in this.objects)
        return;
      this.objects[id]= model;
    }
    this.collection.push(model);
  },

  /**
    coherent.Model.all() -> Array of Model instances
  
    This method will return a **copy** of the collection of all instances of the
    model currently tracked.
   */
  all: function()
  {
    return this.collection.slice();
  },

  /**
    coherent.Model.clear()
  
    Remove all model objects from the collection.
   */
  clear: function()
  {
    this.collection = [];
    this.objects= {};
    this.newObjects= {};
  },

  count: function()
  {
    return this.collection.length;
  },

  find: function(id)
  {
    if ('function' === typeof(id))
    {
      var all= this.collection,
          index = all.find(id);
      return -1 === index ? null : all[index];
    }

    return this.objects[id];
  },

  forEach: function(iterator)
  {
    this.collection.forEach(iterator);
  },

  map: function(fn)
  {
    return this.collection.map(fn);
  },

  remove: function(model)
  {
    var id= model.id();
    if (void(0) == id)
      delete this.newObjects[model.__uid];
    else
      delete this.objects[id];
    this.collection.removeObject(model);
  },

  sort: function(sortFunction)
  {
    return this.collection.slice().sort(sortFunction);
  },

  create: function(hash)
  {
    var id;

    if ('object' !== typeof(hash))
    {
      id = hash;
      (hash = {})[this.uniqueId] = id;
    }
    else
      id = hash[this.uniqueId];

    var obj;

    if (void(0) != id)
      obj = this.find(id);

    var missing= !obj;
    
    if (missing)
    {
      obj= new (this.type)();
      obj.__context= this.context;
    }
    obj.setValuesFromDictionary(hash);

    if (missing && void(0)!=obj.id())
      this.add(obj);
    return obj;
  },
    
  fromJSON: function(hash)
  {
    var id;

    if ('object' !== typeof(hash))
    {
      id = hash;
      (hash = {})[this.uniqueId] = id;
    }
    else
      id = hash[this.uniqueId];

    var obj;

    if (void(0) != id)
      obj = this.find(id);

    var missing= !obj;
    
    if (missing)
      obj= new this();
      
    obj.merge(hash);

    if (missing && void(0)!=obj.id())
      this.add(obj);
    return obj;
  },

  /**
    coherent.Model.fetch(id, callback)
  
    - id: The ID of the model object that should be loaded.
  
    This method asks the persistence layer associated with this Model to load an
    object based on its ID.
   */
  fetch: function(id, callback)
  {
    if (!this.persistence)
      throw new Error("No persistence layer defined");

    var obj = this.fromJSON(id);
    var d = obj.fetch();

    if (callback)
    {
      d.addCallback(function(obj)
      {
        callback(obj, null);
      });
      d.addErrorHandler(function(error)
      {
        callback(null, error);
      });
    }
    return obj;
  },

  /**
    coherent.Model.prefetch(id)
  
    - id: The ID of the model object that should be loaded into the cache
  
    This method asks the persistence layer associated with this Model to warm up
    its cache to include this object. This speeds up applications without incurring
    the memory overhead of creating all the objects associated with the model.
   */
  prefetch: function(id)
  {
    if (!this.persistence)
      throw new Error("No persistence layer defined");

    var obj = {
          id: id
        };
    obj[this.uniqueId] = id;
    this.persistence.prefetch(obj);
  }

};

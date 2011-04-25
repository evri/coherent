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
    this.__fetching= {};
    this.indexInstances= coherent.Model.INDEX_INSTANCES;
  },
  
  /**
    coherent.Model.add(model)
    - model (ModelObject): the instance of a Model that should be tracked.
  
    This method stores a reference to the model instance so that it may be found
    using other methods.
   */
  add: function(model)
  {
    if (!this.indexInstances)
      return;
      
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

    if (void(0)==hash)
      return hash;
      
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
    
    //  No need to generate change notifications if the object was created
    obj.merge(hash, missing);

    if (missing && void(0)!=obj.id())
      this.add(obj);
    return obj;
  },

  /**
    coherent.Model.fetch(id) -> coherent.Deferred
  
    - id: The ID of the model object that should be loaded.
  
    This method asks the persistence layer associated with this Model to load an
    object based on its ID.
   */
  fetch: function(id)
  {
    if (!this.persistence)
      throw new Error("No persistence layer defined");

    var obj= this.find(id);
    if (obj)
      return coherent.Deferred.createCompleted(obj);
    
    var d= this.__fetching[id];
    if (d)
      return d;
      
    function oncomplete(json)
    {
      delete this.__fetching[id];
      var obj= this.fromJSON(json);
      if (obj)
        obj.awakeFromFetch();
      return obj;
    }
    
    function onfailed(error)
    {
      delete this.__fetching[id];
      return error;
    }
    
    d = this.__fetching[id]= this.persistence.fetch(id);
    d.addMethods(oncomplete, onfailed, this);
    return d;
  }
  
};

Object.markMethods(coherent.Model.ClassMethods);
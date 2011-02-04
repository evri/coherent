/*jsl:import ../model.js*/

coherent.Model.ClassMethods= {

  uniqueId: 'id',

  add: function(model)
  {
    if (-1!==this.collection.indexOf(model))
      return;
    this.collection.push(model);
  },

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
    this.collection= [];
  },
  
  count: function()
  {
    return this.collection.length;
  },
  
  find: function(id)
  {
    var all= this.collection;
    
    if ('function'===typeof(id))
    {
      var index= all.find(id);
      return -1===index ? null : all[index];
    }
      
    var len= all.length;
    for (var i=0; i<len; ++i)
      if (all[i].id()==id)
        return all[i];
    
    return null;
  },

  /**
    coherent.Model.fetch(id, callback)
    
    - id: The ID of the model object that should be loaded.
    
    This method asks the persistence layer associated with this Model to load an
    object based on its ID.
  */
  fetch: function(id, callback)
  {
    var obj= this.find(id);
    if (obj)
    {
      if (callback)
        callback(obj, null);
      return;
    }
    
    if (!this.persistence)
      throw new Error("No persistence layer defined");
    
    var _this= this;
    var wrappedCallback=function(obj, error)
    {
      if (!error && obj)
        _this.collection.push(obj);
      if (callback)
        callback(obj, error);
    };
    this.persistence.fetch(id, wrappedCallback);
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
    this.collection.removeObject(model);
  },
  
  sort: function(sortFunction)
  {
    return this.collection.slice().sort(sortFunction);
  },
  
  create: function(hash)
  {
    if ('object'!==typeof(hash))
    {
      var tmp= {};
      tmp[this.uniqueId]= hash;
      hash= tmp;
    }
      
    var id= hash[this.uniqueId];
    var obj;
    
    if (void(0)!=id)
      obj= this.find(id);

    if (obj)
      obj.merge(hash);
    else
    {
      obj= new this(hash);
      this.add(obj);
    }
    return obj;
  }
  
};
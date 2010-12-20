/*jsl:import ../model.js*/
/*jsl:declare LocalStorage*/
/*jsl:declare localStorage*/
/*jsl:declare JSON*/

coherent.LocalStorage= Class.create({

  constructor: function(Model)
  {
    if (!window.localStorage)
      throw new Error("coherent.LocalStorage requires a browser with localStorage support");
      
    this.model= Model;
    this.index_name= [Model.modelName, 'index'].join('-');
  },
  
  clearIndex: function()
  {
    var index= this.readIndex();
    index.forEach(function(id){ localStorage.removeItem(id); });
    localStorage.removeItem(this.index_name);
  },
  
  readIndex: function()
  {
    var index= localStorage[this.index_name];
    return index ? JSON.parse(index) : [];
  },
  
  writeIndex: function(arrayOfIds)
  {
    localStorage.setItem(this.index_name, JSON.stringify(arrayOfIds));
  },
  
  addToIndex: function(id)
  {
    var index= this.readIndex();
    if (-1!==index.indexOf(id))
      return;
    index.push(id);
    this.writeIndex(index);
  },
  
  removeFromIndex: function(id)
  {
    var index= this.readIndex();
    var pos= index.indexOf(id);
    if (-1===pos)
      return;
    index.removeObjectAtIndex(pos);
    this.writeIndex(index);
  },
  
  fetch: function(id, callback)
  {
    var data= localStorage.getItem(id);
    if (data)
      data= new this.model(JSON.parse(data));
      
    if (callback)
      callback(data||null, data ? null : true);
  },
  
  create: function(object, callback)
  {
    var id= [this.model.modelName, object.__uid].join('-');
    object.setPrimitiveValueForKey(id, this.model.uniqueId);
    localStorage.setItem(id, JSON.stringify(object));
    this.addToIndex(id);
    if (callback)
      callback.call(object, null);
  },
  
  update: function(object, callback)
  {
    localStorage.setItem(object.id(), JSON.stringify(object));
    if (callback)
      callback.call(object, null);
  },
  
  destroy: function(object, callback)
  {
    var id= object.id();
    localStorage.removeItem(id);
    this.removeFromIndex(id);
    if (callback)
      callback.call(object, null);
  },
  
  __factory__: function(params)
  {
    var klass= this;
    return function()
    {
      return new klass(this, params);
    };
  }

});

coherent.__export('LocalStorage');
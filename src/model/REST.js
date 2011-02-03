/*jsl:import ../model.js*/
/*jsl:import ../foundation/net/XHR.js*/

define("coherent", function(coherent){

  var pathFromStringByReplacingParameters= function(resource, object)
  {
    return resource.replace(this.PARAM_REGEX, function(match, key, keypath){
      return key ? object.valueForKey(key) : object.valueForKeyPath(keypath);
    });
  };
  
  coherent.REST= Class.create({

    PARAM_REGEX: /(?::([\w\d]+))|(?::\{([\w\d]+(?:\.[\w\d]+)*)\})/g,
    DEFAULT_XHR_OPTIONS: {
      responseContentType: 'application/json'
    },
    
    constructor: function(model, params)
    {
      this.model= model;
      Object.extend(this, params);
    },
  
    /**
      coherent.REST#extractObject(json) -> Object
      
      - json (Object): The data retrieve from the server.
      
      Sometimes the server doesn't return the resource directly, but wraps it in
      an envelope or you need to perform some other processing before it's ready
      for passing to the Model's constructor. Override this method (usually in 
      the parameters when you're defining the REST resource) and you can massage
      the data.
     */
    extractObject: function(json)
    {
      return json;
    },
    
    createObject: function(json)
    {
      return new this.model(json);
    },
    
    fetch: function(id, callback)
    {
      var params= { id: id };
      params[this.model.uniqueId]= id;
      
      var url= pathFromStringByReplacingParameters(this.resource, params);
      var d= XHR.get(url, null, this.DEFAULT_XHR_OPTIONS);
      
      function oncomplete(json)
      {
        if (callback)
          callback(this.createObject(json), null);
      }
      function onfailed(error)
      {
        if (callback)
          callback(null, error);
      }
      d.addCallback(this.extractObject, this);
      d.addCallback(oncomplete, this);
      d.addErrorHandler(onfailed, this);
    }
  
  
  });

  coherent.__export('REST');

});
/*jsl:import ../model.js*/
/*jsl:import ../foundation/net/XHR.js*/

/*jsl:declare REST*/

define("coherent", function(coherent)
{
  var PARAM_REGEX = /(?:\/?:([\w\d]+))|(?:\/?:\{([\w\d]+(?:\.[\w\d]+)*)\})/g;

  function pathFromStringByReplacingParameters(resource, object)
  {
    return resource.replace(PARAM_REGEX, function(match, key, keypath)
    {
      var value;
      var keyname = (key || keypath);
      var slash = ('/' === keyname.charAt(0));
      if (slash)
        keyname = keyname.slice(1);

      if (object.valueForKey)
        value = key ? object.valueForKey(keyname) : object.valueForKeyPath(keyname);
      else
        value = key ? object[keyname] : Object.get(object, keyname);

      if (slash && '/' !== value.charAt(0))
        return '/' + value;
      else
        return value;
    });
  }

  coherent.REST = Class.create({

    XHR_OPTIONS: {
      allowCache: true,
      responseContentType: 'application/json'
    },
    PREFETCH_OPTIONS: {
      allowCache: true,
      responseContentType: 'text/plain'
    },

    constructor: function(model, params)
    {
      this.model = model;
      this.__prefetches = {};
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

    cachePrefetch: function(id, data)
    {
      return data;
    },

    prefetch: function(object)
    {
      var id = object.valueForKey ? object.valueForKey('id') : Object.get('id');
      var url = pathFromStringByReplacingParameters(this.resource, object);
      return XHR.get(url, null, this.PREFETCH_XHR_OPTIONS || this.XHR_OPTIONS);
    },

    fetch: function(object)
    {
      //  Try to use the earlier prefetch deferred value if it's still around
      var id = object.valueForKey ? object.valueForKey('id') : Object.get('id');
      var url = pathFromStringByReplacingParameters(this.resource, object);
      var d = XHR.get(url, null, this.XHR_OPTIONS);
      d.addCallback(this.extractObject, this);
      return d;
    },

    __factory__: function(params)
    {
      var klass = this;
      return function()
      {
        return new klass(this, params);
      };
    }

  });

  coherent.__export('REST');

});

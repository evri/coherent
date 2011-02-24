/*jsl:import ../core/base.js*/
/*jsl:declare XHR*/
/*jsl:declare JSON*/
/*jsl:declare XMLHttpRequest*/
/*jsl:declare ActiveXObject*/

/** @name XHR
    @namespace
 */
(function(){

  function noop(){}

  var FORM_CONTENT_TYPE = "application/x-www-form-urlencoded",
      JSON_CONTENT_TYPE = "application/json",
      POST_METHOD = 'POST',
      GET_METHOD = 'GET',
      PUT_METHOD = 'PUT',
      JSON_OPTIONS = {
        contentType: JSON_CONTENT_TYPE
      };
  
  /**
    getTransport() -> XMLHttpRequest
    
    Retrieve an XMLHttpRequest object for each browser.
   */

  var getTransport = function()
  {
    throw new Error('XMLHttpRequest not available.');
  };

  //  Everything but IE gets the native XMLHttpRequest
  if ('undefined' !== typeof(window.XMLHttpRequest))
    getTransport = function()
    {
      return new XMLHttpRequest();
    };
  else
  {
    //  Hereafter, everything is IE related
    var progIdCandidates = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'];
    var len = progIdCandidates.length;

    var progId;
    var xhr;

    for (var i = 0; i < len; ++i)
    {
      try
      {
        progId = progIdCandidates[i];
        xhr = new ActiveXObject(progId);
        //  ActiveXObject constructor throws an exception
        //  if the component isn't available.
        getTransport = function()
        {
          return new ActiveXObject(progId);
        };
        break;
      }
      catch (e)
      {
        //  Ignore the error
      }
    }
  }

  var jsonpIndex = 0;

  /** Send a XHR request.
        @inner
        @param {String} url - The URL of the endpoint
        @param {String} method - The HTTP method to use
        @param {Object} options - Options...
        @type coherent.Deferred
   */

  function send(url, method, options)
  {
    var timeout;

    function timeoutExpired()
    {
      cancel();
      var err = new Error('XHR request timed out');
      err.url = url;
      err.method = method;
      deferred.failure(err);
    }

    function cancel()
    {
      if (timeout)
        window.clearTimeout(timeout);
      xhr.onreadystatechange = noop;
      xhr.abort();
      XHR.numberOfActiveRequests--;
    }

    function sendViaJsonP(url)
    {
      var head = document.getElementsByTagName("head")[0] || document.documentElement;
      var script = document.createElement("script");
      var done = false;

      var jsonpParam = 'string' === typeof(options.jsonp) ? options.jsonp : 'callback';
      var jsonpFnName = 'jsonp' + (++jsonpIndex);
      var undefined;

      if (-1 === url.indexOf('?'))
        url += '?';
      else if ('&' !== url.slice(-1))
        url += '&';
      url += jsonpParam + '=' + jsonpFnName;

      script.src = url;

      window[jsonpFnName] = function(data)
      {
        if (deferred)
          deferred.callback(data);

        window[jsonpFnName] = undefined;

        try
        {
          delete window[jsonpFnName];
        }
        catch (err)
        {}

        if (head && script)
          head.removeChild(script);
      }

      // Attach handlers for all browsers
      script.onload = script.onreadystatechange = function()
      {
        if (done || (this.readyState && this.readyState !== 'loaded' && this.readyState !== 'complete'))
          return;

        done = true;

        // Handle memory leak in IE
        script.onload = script.onreadystatechange = null;
        if (head && script.parentNode)
          head.removeChild(script);
      };

      // Use insertBefore instead of appendChild  to circumvent an IE6 bug.
      // This arises when a base node is used (#2709 and #4378).
      head.insertBefore(script, head.firstChild);

      return deferred;
    }

    function readyStateChanged()
    {
      if (4 !== xhr.readyState)
        return;

      if (timeout)
        window.clearTimeout(timeout);

      if (!xhrSent)
      {
        arguments.callee.delay(0);
        return;
      }

      var status = xhr.status;
      var succeeded = (status >= 200 && status < 300) || 304 == status;

      if (0 === status || 'undefined' === typeof(status))
      {
        var protocol = window.location.protocol;
        succeeded = 'file:' === protocol || 'chrome:' === protocol;
      }

      var result = xhr.responseText;
      var err;

      if (succeeded)
      {
        if ('HEAD' == method)
        {
          result = {};
          try
          {
            var headers = xhr.getAllResponseHeaders();
            if (headers)
            {
              headers = headers.split("\n");
              headers.forEach(function(header)
              {
                var match = header.match(/^([^:]+):(.+)$/m);
                var name = match[1].trim();
                result[name] = match[2].trim();
              });
            }
          }
          catch (e)
          {}
        }
        else
        {
          var contentType = options.responseContentType || xhr.getResponseHeader("Content-Type") || "";

          // Response is JSON
          if (contentType.match(/(?:application\/(?:x-)?json)|(?:text\/json)/))
          {
            try
            {
              if ("" !== result)
                result = JSON.parse(result);
              else
                result = null;
            }
            catch (e)
            {
              err = e;
              succeeded = false;
            }
          }
          // Response is XML
          else if (contentType.match(/(?:application|text)\/xml/))
          {
            result = xhr.responseXML;
          }
        }
      }
      else
      {
        err = new Error('XHR request failed');
        err.url = url;
        err.method = method;
        err.xhr = xhr;
        err.status = xhr.status;
        err.statusText = xhr.statusText;
        err.body = body;
      }

      if (succeeded)
        deferred.callback(result);
      else
        deferred.failure(err);

      xhr.onreadystatechange = noop;
      xhr = null;
      XHR.numberOfActiveRequests--;
    }

    var queryString;
    var body = options.body || "";
    var async = !options.sync;
    var headers = options.headers || {};
    var deferred = new coherent.Deferred(cancel);
    var xhrSent = false;

    //  default values
    method = (method || GET_METHOD).toUpperCase();

    if (GET_METHOD===method && JSON_CONTENT_TYPE===options.contentType)
    {
      console.log("content-type of JSON doesn't make sense with GET method, using form encoding");
      options.contentType= FORM_CONTENT_TYPE;
    }
    
    switch (options.contentType)
    {
      case JSON_CONTENT_TYPE:
        queryString= JSON.stringify(options.parameters || {});
        break;
      
      case FORM_CONTENT_TYPE:
      default:
        queryString= Object.toQueryString(options.parameters || {});
        break;
    }
    
    if (!body && (POST_METHOD === method || PUT_METHOD === method))
    {
      body = queryString;
      queryString = "";
    }

    if (GET_METHOD === method && !options.allowCache)
    {
      if (XHR.USE_CACHE_CONTROL || options.useCacheControl)
        headers["cache-control"]= "max-age=0";
      else
      {
        var cache_bust = "__cache_buster=" + (new Date()).getTime();
        queryString = queryString ? (queryString + "&" + cache_bust) : cache_bust;
      }
    }

    if (queryString)
    {
      var join = '';

      if (-1 === url.indexOf('?'))
        join = '?';
      else if ('&' !== url.slice(-1))
        join = '&';

      url = [url, queryString].join(join);
    }

    if (options.jsonp)
      return sendViaJsonP(url);

    var xhr = getTransport();

    if (options.responseContentType && xhr.overrideMimeType)
      xhr.overrideMimeType(options.responseContentType);

    if (async)
      timeout = timeoutExpired.delay(options.timeout || 30000);

    if (options.user)
      xhr.open(method, url, async, options.user, options.password || "");
    else
      xhr.open(method, url, async);

    //  Set headers for the request
    for (var h in headers)
      xhr.setRequestHeader(h, headers[h]);

    if (POST_METHOD == method || PUT_METHOD == method)
      xhr.setRequestHeader("Content-Type", options.contentType);

    if (async)
      xhr.onreadystatechange = readyStateChanged;

    try
    {
      xhr.send(body);
      xhrSent = true;
    }
    catch (e)
    {
      if (timeout)
        window.clearTimeout(timeout);
      xhr.onreadystatechange = noop;

      var err= new Error("Failed to send XHR");
      err.error= e;
      
      xhr.onreadystatechange = noop;
      xhr = null;
      XHR.numberOfActiveRequests--;

      deferred.failure(err);
      return deferred;
    }
    
    if (!async)
      readyStateChanged();

    //  Stash the actual request object so callbacks may use it if necessary.
    deferred.request= xhr;

    XHR.numberOfActiveRequests++;
    return deferred;
  }


  coherent.XHR = /** @lends XHR */
  {

    numberOfActiveRequests: 0,
    
    /**
      XHR.USE_CACHE_CONTROL
      
      Should the cache-control header be used to prevent caching? Default is false.
     */
    USE_CACHE_CONTROL: false,
    
    get: function(url, parameters, options)
    {
      return XHR.request(GET_METHOD, url, parameters, options);
    },

    post: function(url, parameters, options)
    {
      return XHR.request(POST_METHOD, url, parameters, options);
    },

    postJSON: function(url, parameters, options)
    {
      return XHR.request(POST_METHOD, url, parameters, Object.extend(options, JSON_OPTIONS));
    },
    
    put: function(url, parameters, options)
    {
      return XHR.request(PUT_METHOD, url, parameters, options);
    },

    putJSON: function(url, parameters, options)
    {
      return XHR.request(PUT_METHOD, url, parameters, Object.extend(options, JSON_OPTIONS));
    },

    request: function(method, url, parameters, options)
    {
      method = method.toUpperCase();
      options = options || {};
      options.contentType = options.contentType || FORM_CONTENT_TYPE;
      options.parameters = parameters;
      return send(url, method, options);
    }

  };

  coherent.__export('XHR');
})();

Object.markMethods(XHR);
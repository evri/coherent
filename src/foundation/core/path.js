/*jsl:import ../../foundation.js*/
/*jsl:declare Path*/

(function(Path){

  function validPathPart(part)
  {
    return void(0)!=part && ''!==part && '/'!==part;
  }

  function removeLeadingAndTrailingSlash(part)
  {
    if ('/'===part.charAt(0))
      part= part.slice(1);
    if ('/'===part.slice(-1))
      part= part.slice(0,-1);
    return part;
  }
  
  Path.join= function()
  {
    var parts;
    if (1===arguments.length && arguments[0].splice)
      parts= arguments[0].filter(validPathPart);
    else
      parts= Array.prototype.filter.call(arguments, validPathPart);
    return parts.map(removeLeadingAndTrailingSlash).join('/');
  }

  Path.split= function(path)
  {
    // split based on /, but only if that / is not at the start or end.
    return path.split('/').filter(validPathPart);
  }

  coherent.__export("Path");
  
})(coherent.Path={});
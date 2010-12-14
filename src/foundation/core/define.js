/*jsl:declare define*/

window.define=function(module, definition)
{
  var parts= module.split('.'),
      obj= this,
      key;

  while (parts.length)
  {
    key= parts.shift();
    obj= obj[key] || (obj[key]={});
  }
  
  definition(obj);
}

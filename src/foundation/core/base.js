/*jsl:declare coherent*/
if ('undefined'===typeof(coherent))
  coherent= {};
  
coherent.version= "3.0.0";
coherent.__nextUid= 0;
coherent.global= window;

coherent.generateUid= function()
{
  return ++(coherent.__nextUid);
}




/** 
  coherent.typeOf(value) -> String
  
  - value (Any): The value that should be inspected for its type
  
  The base typeof operator doesn't distinguish between objects and dates,
  regular expressions, boolean values, arrays, and strings very well. This
  function takes care of these problems.
 */
coherent.typeOf=(function()
{
  var table= {},
      objectToString= {}.toString;
    
  function typeOf(o)
  {
    if (null===o)
      return "null";
    
    var t= objectToString.call(o);
    
    return table[t] || (table[t]= t.slice(8,-1).toLowerCase());
  }

  return typeOf;
})();

/** 
  coherent.compareValues(v1, v2) -> Number
  
  - v1: first value
  - v2: second value
  
  Compare two values. This handles pretty much every type possible. When the
  types don't match, the values are first converted to strings and then
  compared with a locale sensitive method.

  Returns -1 if v1 < v2, 0 if v1 == v2, and 1 if v1>v2.
 */
coherent.compareValues= function(v1, v2)
{
  var v1_type= coherent.typeOf(v1);
  
  //  If the types aren't the same, compare these objects lexigraphically.
  if (v1_type!==coherent.typeOf(v2))
  {
    var s_v1= String(v1);
    var s_v2= String(v2);
    return s_v1.localeCompare(s_v2);
  }
  
  switch (v1_type)
  {
    case "null":
      return 0;
      
    case "boolean":
    case "number":
      var v= (v1-v2);
      if (0===v)
        return v;
      return (v<0?-1:1);

    case "regexp":
    case "function":
      //  use default (lexigraphical) comparison
      break;

    case "string":
    case "array":
    case "object":
      if (v1.localeCompare)
        return v1.localeCompare(v2);
      if (v1.compare)
        return v1.compare(v2);
      //  Otherwise use default (lexigraphical) comparison
      break;
    
    case 'undefined':
      return true;
      
    default:
      throw new TypeError( "Unknown type for comparison: " + v1_type );
  }
  //  Default comparison is lexigraphical of string values.
  return String(v1).localeCompare(String(v2));
}




/**
  coherent.compareNumbers(left, right) -> Number

  - left (Number): left value
  - right (Number): right value
  
  Compare two numbers. Used to sort an array numerically instead of
  lexigraphically.

  Returns -1 if left<right, 0 if left===right, and 1 if left>right.
 */
coherent.compareNumbers= function(left, right)
{
  return left-right;
}

/**
  coherent.reverseCompareNumbers(left, right) -> Number
  
  - left (Number): left value
  - right (Number): right value
  
  Compare two numbers in reverse order to [coherent.compareNumbers]. Used to
  sort an array numerically instead of lexigraphically.

  Returns 1 if left<right, 0 if left===right, and -1 if left>right.
 */
coherent.reverseCompareNumbers= function(left, right)
{
  return right-left;
}




/**
  coherent.defineError(errorName) -> Function
  
  - errorName (String): The name of the error subclass -- also the name
    of the initialiser function.
  
  Function that will create an error constructor. This takes care of
  differences between browsers, except of course that MSIE simply doesn't
  support custom error types very well. This function allows you to have a
  custom initialiser for error types simply by defining a function with the
  same name as the error type.

  The return value of this function is the constructor for the new error type.
  If there's no custom constructor, this return value should be assigned to a
  global variable with the same name as the error type. That way new instances
  of the error can be created.
 */
coherent.defineError= function(errorName)
{
  function error(message)
  {
    this.message= message;
    this.name= errorName;
  }
  error.prototype= new Error;
  error.prototype.constructor= error;
  error.prototype.name= errorName;
  return error;
}

/**
  class InvalidArgumentError < Error
  
  An error that may be thrown to signal invalid arguments were passed to a
  function or method.
 */
var InvalidArgumentError= coherent.defineError("InvalidArgumentError");


/* Add console & console.log for browsers that don't support it. */
if ("undefined"===typeof(window.console))
  window.console= {};
if ('undefined'===typeof(window.console.log))
  /** @ignore */
  window.console.log= function(){};
if ('undefined'===typeof(window.console.error))
  /** @ignore */
  window.console.error= function(){};

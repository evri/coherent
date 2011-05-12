Object.applyDefaults(String.prototype, {

  /**
    String#titleCase() -> String
    
    Make title case version of string.
   */
  titleCase: function()
  {
    return this.charAt(0).toUpperCase() + this.substr(1);
  },

  /**
    String#trim() -> String
    
    Trim the whitespace off either end of a string.
   */
  trim: function()
  {
    var str= this.replace(/^\s+/, '');
    for (var i = str.length - 1; i > 0; --i)
      if (/\S/.test(str.charAt(i)))
      {
        str = str.substring(0, i + 1);
        break;
      }
    return str;
  },

  /**
    String#beginsWith(s) -> Boolean
    
    - s (String): the prefix string to compare with this string
    
    Determine whether this string begins with the specified string.
   */
  beginsWith: function(s)
  {
    return s===this.substring(0, s.length);
  },


  /**
    String#localeCompare(other) -> Number
    
    - other (String): another string to compare against this string
    
    Not all browsers implement localeCompare. This probably will be slow.
   */
  localeCompare: function(other)
  {
    if (this < other)
      return -1;
    else if (this > other)
      return 1;
    else
      return 0;
  },


  /** 
    String#expand(obj[, defaultValue]) -> String
    
    - obj (Object): The object from which the values for variables in the string
      will be taken.
    - defaultValue (Any): When a variable is not found, it will be replaced with
      this value.
      
    Expand variables within this string. This method uses the UNIX shell
    expansion syntax: "This is ${var1}." The properties of the `obj` parameter
    are used to determine the values to insert into the string.
  */
  expand: function(obj, defaultValue)
  {
    function lookupKey(str, key)
    {
      var value= obj[key];
      if (null===value || 'undefined'===typeof(value))
        return defaultValue;
      return value;
    }

    return this.replace(/\$\{(\w+)\}/g, lookupKey);
  }

});

Object.markMethods(String.prototype);
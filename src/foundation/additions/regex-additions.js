/**
  RegExp.escape(text) -> String
  
  - text (String): A string of characters to escape
  
  This function escapes any special characters in a string so that a regular
  expression can be created that will match those special characters.
 */
RegExp.escape = function(text)
{
  return text.replace(RegExp._escapeRegex, '\\$1');
}

/**
  RegExp.specialCharacters -> Array
  
  The special characters in a string that need escaping for regular expressions.
*/
RegExp.specialCharacters= ['/', '.', '*', '+', '?', '|',
                           '(', ')', '[', ']', '{', '}', '\\'];

/**
  RegExp._escapeRegex -> RegExp
  
  A regular expression that will match any special characters that need to be
  escaped to create a valid regular expression.
*/
RegExp._escapeRegex= new RegExp('(\\'+ RegExp.specialCharacters.join("|\\") + ')', 'g');

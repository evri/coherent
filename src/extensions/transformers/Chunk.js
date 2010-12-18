/*jsl:import ../../foundation.js*/

coherent.transformer.Chunk= Class.create(coherent.ValueTransformer, {

  constructor: function(chunkSize)
  {
    this.chunkSize= chunkSize;
  },
  
  transformsArrayValues: true,
  
  transformedValue: function(value)
  {
    if (void(0)==value)
      return value;
      
    if (!value.length || !value.slice)
      return value;
      
    var result=[],
        index=0,
        len= value.length;
    while (index<len)
      result.push(value.slice(index, index+=this.chunkSize));
    return result;
  }
  
});


describe("Chunk transformer", function() {

  it("should do nothing for null", function() {
    
    var chunker= new coherent.transformer.Chunk(5);
    expect(chunker.transformedValue(null)).toBe(null);
    
  });
  
  it("should do nothing for undefined", function() {
    var undefined;
    
    var chunker= new coherent.transformer.Chunk(5);
    expect(chunker.transformedValue(undefined)).toBe(undefined);
    
  });

  it("should do nothing for non-array values", function() {
    var chunker= new coherent.transformer.Chunk(5);
    expect(chunker.transformedValue(5)).toBe(5);
  });

  it("should do nothing for empty array", function() {
    var chunker= new coherent.transformer.Chunk(5);
    expect(chunker.transformedValue([]).length).toBe(0);
  });
  
  it("should return the 1 array if array.length < chunksize", function() {
    var chunker= new coherent.transformer.Chunk(5);
    var array= [1,2,3,4];
    var result= chunker.transformedValue(array);
    expect(result.length).toBe(1);
    expect(result[0].length).toBe(4);
  });

  it("should break 10 element array into 2 chunks of 5", function() {
    var chunker= new coherent.transformer.Chunk(5);
    var array= [1,2,3,4,5,6,7,8,9,10];
    var result= chunker.transformedValue(array);
    expect(result.length).toBe(2);
    expect(result[0].length).toBe(5);
    expect(result[1].length).toBe(5);
  });

  it("should break 11 element array into 2 chunks of 5 and one chunk of 2", function() {
    var chunker= new coherent.transformer.Chunk(5);
    var array= [1,2,3,4,5,6,7,8,9,10,11,12];
    var result= chunker.transformedValue(array);
    expect(result.length).toBe(3);
    expect(result[0].length).toBe(5);
    expect(result[1].length).toBe(5);
    expect(result[2].length).toBe(2);
  });

});
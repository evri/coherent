describe("Model merging from JSON", function()
{

  beforeEach(function()
  {
    coherent.Model.__resetModels();
    this.USE_PROPERTIES = coherent.Model.USE_PROPERTIES;
    coherent.Model.USE_PROPERTIES = true;
  });

  afterEach(function()
  {
    coherent.Model.USE_PROPERTIES = this.USE_PROPERTIES;
  });
  
  it("should merge all fields in the JSON", function()
  {
    var M= Model.create("Zebra", {
      name: String,
      age: Number
    });
    
    var m= new M();
    
    m.merge({
      name: "zebra",
      age: 10
    });
    
    expect(m.name).toBe("zebra");
    expect(m.age).toBe(10);
  });

  it("should not change fields that aren't in the JSON", function()
  {
    var M= Model.create("Zebra", {
      name: String,
      age: Number
    });
    
    var m= new M({
      age: 10
    });
    
    m.merge({
      name: "zebra"
    });
    
    expect(m.name).toBe("zebra");
    expect(m.age).toBe(10);
  });

  it("should not obliterate changes", function()
  {
    var M= Model.create("Zebra", {
      name: String,
      age: Number
    });
    
    var m= new M();
    m.age= 10;
    
    m.merge({
      name: "zebra"
    });

    expect(m.name).toBe("zebra");
    expect(m.age).toBe(10);
  });
});
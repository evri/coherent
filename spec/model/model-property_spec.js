describe("coherent.Model support for properties", function()
{

  beforeEach(function()
  {
    coherent.Model.__resetModels();
    this.USE_PROPERTIES = coherent.Model.USE_PROPERTIES;

    coherent.Model.USE_PROPERTIES = true;
    this.Model = Model.create("Model", {
      name: String,
      age: Number,

      exclamation: Model.Property({
          type: String,
          get: function()
          {
            return this.primitiveValueForKey('exclamation');
          },
          set: function(exclamation)
          {
            this.setPrimitiveValueForKey(exclamation, 'exclamation');
            return exclamation;
          }
        })

    });
  });

  afterEach(function()
  {
    coherent.Model.USE_PROPERTIES = this.USE_PROPERTIES;
  });

  it("should have properties", function()
  {
    var m = new this.Model();
    expect(m).toHaveProperty('name');
    expect(m).toHaveProperty('age');
    expect(m).toHaveProperty('exclamation');
  });

  it("should allow initialisation via properties", function()
  {
    var m = new this.Model({
        name: "Bozo the Clown",
        age: 100,
        exclamation: "Isn't this fun"
      });
    expect(m.name).toBe("Bozo the Clown");
    expect(m.age).toBe(100);
    expect(m.exclamation).toBe("Isn't this fun");
  });
  
  it("should allow setting and getting via properties", function()
  {
    var m = new this.Model();
    
    m.name= "Bozo the Clown";
    expect(m.name).toBe("Bozo the Clown");
    
    m.age= 100;
    expect(m.age).toBe(100);
    
    m.exclamation= "Isn't this fun";
    expect(m.exclamation).toBe("Isn't this fun");
  });
  
});

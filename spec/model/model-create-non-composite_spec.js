describe("Model create", function()
{

  beforeEach(function()
  {
    coherent.Model.__resetModels();

    this.M1 = Model("Model1", {
      name: String,
      age: Number
    });

    this.M2 = Model("Model2", {
      name: String,
      m1: Model.ToOne({
          type: "Model1",
          composite: false
        })
    });

  });

  it("should create a new instance with nested models", function()
  {
    var m2 = this.M2.create({
        id: "m2",
        name: "Zebra",
        m1: {
          id: "m1",
          name: "Zebra's M1",
          age: 10
        }
      });

    expect(m2).not.toBeNull();
    expect(m2.id()).toBe("m2");
    expect(m2.name()).toBe("Zebra");
    expect(m2.m1()).not.toBeNull();
    expect(m2.m1().name()).toBe("Zebra's M1");
  });

  it("should nested models should be findable by ID", function()
  {
    var m2 = this.M2.create({
        id: "m2",
        name: "Zebra",
        m1: {
          id: "m1",
          name: "Zebra's M1",
          age: 10
        }
      });

    expect(m2).not.toBeNull();
    
    var m1= this.M1.find("m1");
    expect(m1).not.toBeNull();
    expect(m1).toBe(m2.m1());
  });

  it("should update nested models with the same ID", function()
  {
    var m1 = this.M1.create({
        id: "m1",
        name: "Original M1"
      });
      
    expect(m1).not.toBeNull();
    expect(m1.name()).toBe("Original M1");

    var m2 = this.M2.create({
        id: "m2",
        name: "Zebra",
        m1: {
          id: "m1",
          name: "Zebra's M1",
          age: 10
        }
      });

    expect(m2).not.toBeNull();
    expect(m1).toBe(m2.m1());
    expect(m2.m1().name()).toBe("Zebra's M1");
  });
  
  
});

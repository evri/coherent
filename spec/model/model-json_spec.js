describe("Model support for JSON", function()
{

  beforeEach(function()
  {
    coherent.Model.__resetModels();
  });

  it("should serialise to JSON", function()
  {
    var M = Model("Foo", {
          name: String,
          age: Number
        });

    var m = new M();
    m.setName("Zebra Pants");
    m.setAge(100);
    var json = JSON.parse(JSON.stringify(m));
    expect(json).toHaveProperty('name');
    expect(json.name).toBe("Zebra Pants");
    expect(json).toHaveProperty('age');
    expect(json.age).toBe(100);
  });

  it("should add composite subobjects", function()
  {
    var Car = Model("Car", {
          make: String,
          model: String,
          year: Number
        }),
        Person = Model("Person", {
          name: String,
          car: Model.ToOne({
            type: "Car",
            composite: true
          })
        });

    var p = new Person({
          name: "Bozo the Clown",
          car: new Car({
            make: "Volkswagen",
            model: "Beetle",
            year: 1968
          })
        });

    var json = JSON.parse(JSON.stringify(p));
    expect(json).toHaveProperty("name");
    expect(json.name).toBe("Bozo the Clown");
    expect(json).toHaveProperty("car");
    expect(json.car).not.toBeNull();
    expect(json.car).toHaveProperty("make");
    expect(json.car.make).toBe("Volkswagen");
  });

  it("should add id of non-composite subobjects", function()
  {
    var Car = Model("Car", {
          make: String,
          model: String,
          year: Number
        }),
        Person = Model("Person", {
          name: String,
          car: Model.ToOne({
            type: "Car",
            composite: false
          })
        });

    var p = new Person({
          id: "bozo",
          name: "Bozo the Clown",
          car: new Car({
            id: "bozo-car",
            make: "Volkswagen",
            model: "Beetle",
            year: 1968
          })
        });

    var json = JSON.parse(JSON.stringify(p));
    expect(json).toHaveProperty("name");
    expect(json.name).toBe("Bozo the Clown");
    expect(json).toHaveProperty("car");
    expect(json.car).toBe("bozo-car");
  });

  it("should map to external key names", function()
  {
    var Stuff = Model("Stuff", {
          wiggle: Model.Property({
            type: String,
            key: "waggle"
          }),
          nack: Model.Property({
            type: Number,
            key: "feegle"
          })
        });

    var stuff = new Stuff();
    stuff.setWiggle("wiggle");
    stuff.setNack(50);

    var json = JSON.parse(JSON.stringify(stuff));

    expect(json).not.toHaveProperty("wiggle");
    expect(json).toHaveProperty("waggle");
    expect(json.waggle).toBe("wiggle");

    expect(json).not.toHaveProperty("nack");
    expect(json).toHaveProperty("feegle");
    expect(json.feegle).toBe(50);
  });

  it("should create from external key names", function()
  {
    var Stuff = Model("Stuff", {
          wiggle: Model.Property({
            type: String,
            key: "waggle"
          }),
          nack: Model.Property({
            type: Number,
            key: "feegle"
          })
        });

    var stuff = Stuff.fromJSON({
          waggle: "number 1",
          feegle: 20
        });
    
    expect(stuff.wiggle()).toBe("number 1");
    expect(stuff.nack()).toBe(20);
  });
});

describe("Model create", function()
{

  beforeEach(function()
  {
    coherent.Model.__resetModels();

    this.M = Model.create("Model1", {
      name: String,
      age: Number
    });

  });

  it("should create a new instance with ModelClass#create", function()
  {
    var m = this.M.fromJSON({
        id: "zebra",
        name: "Zebra",
        age: 10
      });

    expect(m).not.toBeNull();
    expect(m.id()).toBe("zebra");
    expect(m.name()).toBe("Zebra");
    expect(m.age()).toBe(10);
  });

  it("created objects should be found via ModelClass.find", function()
  {
    var m = this.M.fromJSON({
        id: "zebra",
        name: "Zebra",
        age: 10
      });

    var found = this.M.find("zebra");
    expect(found).toBe(m);
    expect(found.name()).toBe("Zebra");
  });

  it("should only create an object once", function()
  {
    var m1 = this.M.fromJSON({
        id: "zebra",
        name: "Zebra",
        age: 10
      });

    var m2 = this.M.fromJSON({
        id: "zebra",
        name: "Merged Zebra",
        age: 100
      });

    expect(m1).toBe(m2);
  });

  it("should find the object when passed only the id", function()
  {
    var m1 = this.M.fromJSON({
        id: "zebra",
        name: "Zebra",
        age: 10
      });

    var m2 = this.M.fromJSON("zebra");
    expect(m1).toBe(m2);
  });

  it("should merge new values when created multiple times", function()
  {
    var m1 = this.M.fromJSON({
        id: "zebra",
        name: "Zebra",
        age: 10
      });

    var m2 = this.M.fromJSON({
        id: "zebra",
        name: "Merged Zebra",
        age: 100
      });

    expect(m1).toBe(m2);
    expect(m1.name()).toBe("Merged Zebra");
    expect(m1.age()).toBe(100);
  });
});

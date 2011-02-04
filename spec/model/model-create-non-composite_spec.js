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

    this.M3 = Model("Model3", {
      name: String,
      m1s: Model.ToMany({
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

    var m1 = this.M1.find("m1");
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

  it("should find nested models when given only the id", function()
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
        m1: "m1"
      });

    expect(m2).not.toBeNull();
    expect(m1).toBe(m2.m1());
  });

  it("should create new instances for to many relations", function()
  {
    var m3 = this.M3.create({
        name: "M3 instance",
        m1s: [{
              id: "m1-1",
              name: "m1 #1"
            }, {
              id: "m1-2",
              name: "m1 #2"
            }
          ]
      });

    expect(m3).not.toBeNull();
    var m1s = m3.m1s();
    expect(m1s).not.toBeEmpty();
    expect(m1s.length).toBe(2);
    expect(m1s[0].name()).toBe("m1 #1");
    expect(m1s[1].name()).toBe("m1 #2");

    var m1_1 = this.M1.find("m1-1");
    expect(m1_1).not.toBeNull();
    expect(m1_1).toBe(m1s[0]);

    var m1_2 = this.M1.find("m1-2");
    expect(m1_2).not.toBeNull();
    expect(m1_2).toBe(m1s[1]);
  });

  it("should link to-many related objects using just an id", function()
  {
    var m1_1 = this.M1.create({
        id: "m1-1",
        name: "m1-1 original"
      });
    var m1_2 = this.M1.create({
        id: "m1-2",
        name: "m1-2 original"
      });

    var m3 = this.M3.create({
        name: "M3 instance",
        m1s: ["m1-1", "m1-2"]
      });

    var m1s = m3.m1s();
    expect(m1s).not.toBeEmpty();
    expect(m1s.length).toBe(2);
    expect(m1s[0]).toBe(m1_1);
    expect(m1s[1]).toBe(m1_2);
  });

  it("should update existing to-many related objects", function()
  {
    var m1_1 = this.M1.create({
        id: "m1-1",
        name: "m1-1 original"
      });
    var m1_2 = this.M1.create({
        id: "m1-2",
        name: "m1-2 original"
      });

    var m3 = this.M3.create({
        name: "M3 instance",
        m1s: [{
              id: "m1-1",
              name: "m1 #1"
            }, {
              id: "m1-2",
              name: "m1 #2"
            }
          ]
      });

    var m1s = m3.m1s();
    expect(m1s).not.toBeEmpty();
    expect(m1s.length).toBe(2);
    expect(m1s[0].name()).toBe("m1 #1");
    expect(m1s[1].name()).toBe("m1 #2");

    expect(m1s[0]).toBe(m1_1);
    expect(m1s[1]).toBe(m1_2);
  });

});

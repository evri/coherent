describe("ModelObject change count", function()
{
  beforeEach(function()
  {
    coherent.Model.__resetModels();
  });

  it("should update changeCount when setting a property", function()
  {
    var M = Model("Foo", {
          name: String
        });

    var m= new M();
    expect(m.changeCount).toBe(0);
    m.setName("Zebra");
    expect(m.changeCount).toBe(1);
  });
});

describe("LocalStorage", function() {

  beforeEach(function(){
    coherent.Model._resetModels();
    
    this.Model= Model("foo", {
      persistence: LocalStorage
    });
    
    this.Model.persistence.clearIndex();
  });
  
  it("should be current persistence method", function() {
    expect(this.Model.persistence).toBeInstanceOf(LocalStorage);
  });

  it("should have reference to Model class", function() {
    expect(this.Model.persistence.model).toBe(this.Model);
  });
  
  it("should start with empty index", function() {
    expect(this.Model.persistence.readIndex().length).toBe(0);
  });
  
  it("should add an id to its index", function() {
    var persistence= this.Model.persistence;
    persistence.addToIndex("foo");
    
    var index= persistence.readIndex();
    expect(index).toContain("foo");
    expect(index.length).toBe(1);
  });
  
  it("should remove an id from its index", function() {
    var persistence= this.Model.persistence;
    persistence.addToIndex("foo");
    var index= persistence.readIndex();
    expect(index).toContain("foo");
    expect(index.length).toBe(1);

    persistence.removeFromIndex("foo");
    index= persistence.readIndex();
    expect(index.length).toBe(0);
  });
  
});
describe("LocalStorage", function() {

  beforeEach(function(){
    coherent.Model.__resetModels();
    
    this.Model= Model.create("foo", {
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
  
  describe("index", function() {
    it("should start empty", function() {
      expect(this.Model.persistence.readIndex().length).toBe(0);
    });
  
    it("should add an id", function() {
      var persistence= this.Model.persistence;
      persistence.addToIndex("foo");
    
      var index= persistence.readIndex();
      expect(index).toContain("foo");
      expect(index.length).toBe(1);
    });
  
    it("should remove an id", function() {
      var persistence= this.Model.persistence;
      persistence.addToIndex("foo");
      var index= persistence.readIndex();
      expect(index).toContain("foo");
      expect(index.length).toBe(1);

      persistence.removeFromIndex("foo");
      index= persistence.readIndex();
      expect(index.length).toBe(0);
    });
    
    it("should record the id of a saved object", function() {
      var persistence= this.Model.persistence;
      var object= new this.Model();
      object.save();
      var index= persistence.readIndex();
      expect(index.length).toBe(1);
      expect(index).toContain(object.id());
    });
  });
  
  it("should return the data saved when loaded", function() {
    
    var complete= new CompletionSignal(),
        original= new this.Model({ zebra: "foo" });
    
    runs(function()
    {
      original.save();
      //  Remove the original from the model's collection
      this.Model.clear();
    });
    
    runs(function()
    {
      var M= this.Model;
      var d= this.Model.fetch(original.id());

      d.addCallback(function(obj) {
        expect(obj).not.toBeNull();
        expect(obj).toBeInstanceOf(M);
        expect(obj.valueForKey('zebra')).toBe("foo");
        expect(obj.__uid).not.toBe(original.__uid);
        complete.set(true);
      });
      
    });
    
    waitsFor(complete);
    
  });
  
});
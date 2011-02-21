describe("coherent.Model", function()
{

  beforeEach(function()
  {
    coherent.Model.__resetModels();
    this.Model = Model.create("foo", {});
  });

  it("should exist", function()
  {
    expect(coherent.Model).not.toBeNull();
  });

  it("should be available by alias Model", function()
  {
    expect(Model).not.toBeNull();
    expect(Model).toEqual(coherent.Model);
  });

  it("should be create a new Model", function()
  {
    expect(this.Model).not.toBeNull();
  });

  it("should return a subclass of coherent.ModelObject", function()
  {
    expect(this.Model.superclass).toBe(coherent.ModelObject);
  });

  it("should create instances derived from coherent.ModelObject", function()
  {
    var object = new this.Model();
    expect(object).toBeInstanceOf(coherent.ModelObject);
    expect(object).toHaveProperty('valueForKey');
    expect(object).toHaveProperty('setValueForKey');
    expect(object.setValueForKey).toBeInstanceOf(Function);
  });

  describe("with typed property declarations", function()
  {
    it("should create getter & setter", function()
    {
      var model = Model.create("typed", {
            zebra: String
          });

      var object = new model();
      expect(object).toHaveMethod('zebra');
      expect(object).toHaveMethod('setZebra');
      var info = object.infoForKey('zebra');
    });

    it("should check type when setting typed property", function()
    {
      var model = Model.create("typed", {
            zebra: String
          });

      var object = new model();

      function testInvalidType()
      {
        object.setValueForKey(123, 'zebra');
      }
      expect(testInvalidType).toThrow("Invalid type for zebra");

      function testInvalidTypeSetter()
      {
        object.setZebra(123);
      }
      expect(testInvalidTypeSetter).toThrow("Invalid type for zebra");
    });

  });


  describe("properties", function()
  {
    it("should allow declaring properties", function()
    {

      var M = Model.create("HasProperty", {
            foo: Model.Property({
              type: String,
              set: function(value)
              {
                this.setPrimitiveValueForKey(String(value).toUpperCase(), 'foo');
              },
              get: function()
              {
                return this.primitiveValueForKey('foo');
              }
            })
          });

      var obj = new M();
      expect(obj).toHaveMethod('foo');
      expect(obj).toHaveMethod('setFoo');
      obj.setFoo('bar');
      expect(obj.foo()).toBe('BAR');
    });

    it("should fire change notifications when setting properties", function()
    {
      var M = Model.create("HasProperty", {
            foo: Model.Property({
              type: String
            })
          });

      var obj = new M();
      var observer = new TestObserver();
      obj.addObserverForKeyPath(observer, 'observeChange', 'foo');
      obj.setFoo('zebra');
      expect(observer.called).toBe(true);
    });

    it("should fire change notifications when calling custom setter method", function()
    {
      var M = Model.create("HasProperty", {

            foo: Model.Property({
              type: String,
              get: function()
              {
                return this.primitiveValueForKey('foo');
              },
              set: function(value)
              {
                this.setPrimitiveValueForKey(value, 'foo');
              }
            })
          });

      var obj = new M();
      var observer = new TestObserver();
      obj.addObserverForKeyPath(observer, 'observeChange', 'foo');
      obj.setFoo('zebra');
      expect(observer.called).toBe(true);
    });
  });

  describe("collection", function()
  {
    it("can add instances", function()
    {
      var object = new this.Model();
      this.Model.add(object);
      expect(this.Model.collection).toContain(object);
      expect(this.Model.all()).toContain(object);
      expect(this.Model.count()).toBe(1);
    });

    it("can be cleared", function()
    {
      var object = new this.Model();
      this.Model.add(object);
      expect(this.Model.count()).toBe(1);
      this.Model.clear();
      expect(this.Model.count()).toBe(0);
    });

    it("can remove instances", function()
    {
      var object = new this.Model();
      this.Model.add(object);
      expect(this.Model.collection).toContain(object);
      expect(this.Model.collection.length).toBe(1);
      this.Model.remove(object);
      expect(this.Model.collection).not.toContain(object);
      expect(this.Model.collection.length).toBe(0);
    });

    it("should only add instances once", function()
    {
      var object = new this.Model();
      this.Model.add(object);
      this.Model.add(object);
      expect(this.Model.collection).toContain(object);
      expect(this.Model.collection.length).toBe(1);
    });

    it("can be found by ID", function()
    {
      var object1 = new this.Model({
            id: 'foo'
          });
      var object2 = new this.Model({
            id: 'bar'
          });
      this.Model.add(object1);
      this.Model.add(object2);
      expect(this.Model.find("bar")).toBe(object2);
      expect(this.Model.find("foo")).toBe(object1);
    });

    it("can be found by predicate", function()
    {
      var object1 = new this.Model({
            name: 'foo'
          });
      var object2 = new this.Model({
            name: 'bar'
          });
      this.Model.add(object1);
      this.Model.add(object2);

      function makeFindByName(name)
      {
        return function(obj)
        {
          return obj.valueForKey('name') == name;
        }
      }

      expect(this.Model.find(makeFindByName('bar'))).toBe(object2);
      expect(this.Model.find(makeFindByName("foo"))).toBe(object1);
    });

  });
});

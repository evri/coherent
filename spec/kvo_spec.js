describe("KVO", function()
{

  beforeEach(function()
  {
    this.kvo = new coherent.KVO();
    this.kvo.foo = "bar";
    this.kvo.zero = 0;
    this.kvo.__name = "zebra";

    this.kvo.name = function()
    {
      return this.__name;
    }
    this.kvo.setName = function(name)
    {
      this.__name = name;
    }
    this.kvo.immutable = function()
    {
      return this.__immutable;
    }
  });

  it("should support getting a value for a key", function()
  {
    expect(this.kvo.valueForKey('zero')).toBe(0);
    expect(this.kvo.valueForKey('foo')).toBe('bar');
    expect(this.kvo.valueForKey('name')).toBe('zebra');
    expect(this.kvo.valueForKey('zebra')).toBeNull();
  });

  it("should be able to set a value for a key", function()
  {
    this.kvo.setValueForKey(5, "foo");
    expect(this.kvo.foo).toBe(5);
  });

  it("should be possible to observe property changes", function()
  {
    var observer = new TestObserver();
    
    runs(function()
    {
      this.kvo.addObserverForKeyPath(observer, 'observeChange', 'name');
      this.kvo.setValueForKey('goop', 'name');
    });

    waitsFor(observer.complete);

    runs(function()
    {
      expect(observer.value).toBe('goop');
      expect(this.kvo.valueForKey('name')).toBe('goop');
    });
  });
  
  it("should trigger change notifications for child keys when the parent changes", function()
  {
    var observer = new TestObserver();

    runs(function()
    {
      var name= new coherent.KVO({
        first: 'john',
        last: 'doe'
      });

      this.kvo.addObserverForKeyPath(observer, 'observeChange', 'name.first');
      this.kvo.setName(name);
      name.setValueForKey('jane', 'first');
    });

    waitsFor(observer.complete);
    
    runs(function()
    {
      expect(observer.value).toBe('jane');
    });
  });
  
  it("should trigger change notifications for child keys of a parent", function()
  {
    var observer = new TestObserver();

    runs(function()
    {
      var name= new coherent.KVO({
        first: 'john',
        last: 'doe'
      });

      this.kvo.setName(name);
      this.kvo.addObserverForKeyPath(observer, 'observeChange', 'name.first');
      name.setValueForKey('jane', 'first');
    });

    waitsFor(observer.complete);
    
    runs(function()
    {
      expect(observer.value).toBe('jane');
    });
  });

  it("should trigger change notifications for child keys of a previously non-existent parent", function()
  {
    var observer = new TestObserver();

    runs(function()
    {
      var goober= new coherent.KVO({
        baz: 'baz value'
      });

      this.kvo.addObserverForKeyPath(observer, 'observeChange', 'goober.baz');
      this.kvo.setValueForKey(goober, 'goober');
    });

    waitsFor(observer.complete);
    
    runs(function()
    {
      expect(observer.value).toBe('baz value');
    });
  });
  
  it("should trigger change notifications for direct property modification", function()
  {
    if (!coherent.Support.Properties)
      return;

    var observer = new TestObserver();

    runs(function()
    {
      this.kvo.addObserverForKeyPath(observer, 'observeChange', 'goober');
      this.kvo.goober = 5;
    });

    waitsFor(observer.complete);
    
    runs(function()
    {
      expect(observer.value).toBe(5);
    });
  });
  
  it("should trigger change notification for direct property modification of a child key", function()
  {
    if (!coherent.Support.Properties)
      return;

    var observer = new TestObserver();

    runs(function()
    {
      this.kvo.goober= new coherent.KVO({
        baz: 'baz value'
      });
      this.kvo.addObserverForKeyPath(observer, 'observeChange', 'goober.baz');
      this.kvo.goober.baz = 5;
    });

    waitsFor(observer.complete);
    
    runs(function()
    {
      expect(observer.value).toBe(5);
    });
  });
  
});

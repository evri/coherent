describe("ModelObject", function() {

  beforeEach(function(){
    coherent.Model.__resetModels();
    this.Model= Model("foo", {});
  });

  describe("instances", function() {

    it("should initialise values", function() {
      var object= new this.Model({ abc: 123 });
      expect(object.valueForKey('abc')).toBe(123);
    });
  
    it("should be created with empty changes", function() {
      var object= new this.Model({ abc: 123 });
      expect(Object.keys(object.changes).length).toBe(0);
    });
  
    it("should set values via setValueForKey", function() {
      var object= new this.Model();

      object.setValueForKey(123, 'abc');
      expect(object.valueForKey('abc')).toBe(123);
    });

    it("should not set values for immutable properties", function() {
      var model= Model("immutable", {
        zebra: function()
        {
          return 123;
        }
      });
      
      var object= new model();
      object.setValueForKey(567, 'zebra');
      expect(object.valueForKey('zebra')).not.toBe(567);
    });
    
    it("should fire change notifications", function() {
      var object= new this.Model();
      var observer= new TestObserver();
      
      object.addObserverForKeyPath(observer, 'observeChange', 'abc');
      object.setValueForKey(123, 'abc');
      expect(observer.called).toBe(true);
    });

    it("should fire change notifications for custom setter methods", function() {
      var M= Model("CustomSetter", {
        foo: function()
        {
          return this.primitiveValueForKey('foo');
        },
        
        setFoo: function(value)
        {
          return this.setPrimitiveValueForKey(value, 'foo');
        }
      });
      
      var object= new M();
      var observer= new TestObserver();
      object.addObserverForKeyPath(observer, 'observeChange', 'foo');
      object.setFoo('bar');
      expect(observer.called).toBe(true);
    });

    it("should be added to the Model's collection when saved", function() {
      var object= new this.Model();
      object.save();
      expect(this.Model.collection).toContain(object);
      expect(this.Model.all()).toContain(object);
      expect(this.Model.count()).toBe(1);
    });

    it("should invoke callback when saved", function() {
      var object= new this.Model();
      var called= 0;
      function callback(data)
      {
        called++;
      }
      var d= object.save();
      d.addCallback(callback);
      expect(called).toBe(1);
    });

    it("should call validateForSave when saved", function() {
      var object= new this.Model();
      spyOn(object, 'validateForSave');
      object.save();
      expect(object.validateForSave).toHaveBeenCalled();
    });

    it("should invoke callback with error when validateForSave fails", function() {
      var object= new this.Model();
      spyOn(object, 'validateForSave').andCallFake(function() { return new coherent.Error(); });

      var passed= 0;
      function callback(error)
      {
        passed= error;
      }
      var d= object.save();
      d.addErrorHandler(callback);
      expect(object.validateForSave).toHaveBeenCalled();
      expect(passed).toBeInstanceOf(coherent.Error);
    });
    
    it("should be removed from the Model's collection when destroyed", function() {
      var object= new this.Model();
      this.Model.add(object);
      expect(this.Model.collection).toContain(object);
      expect(this.Model.collection.length).toBe(1);
      object.destroy();
      expect(this.Model.collection).not.toContain(object);
      expect(this.Model.collection.length).toBe(0);
    });

    it("should invoke callback when destroyed", function() {
      var object= new this.Model();
      var called= 0;
      function callback()
      {
        called++;
      }
      object.save();
      object.destroy(callback);
      expect(called).toBe(1);
    });

    it("should invoke callback with null when destroyed successfully", function() {
      var object= new this.Model();
      var passed= 0;
      function callback(error)
      {
        passed= error;
      }
      object.save();
      object.destroy(callback);
      expect(passed).toBe(null);
    });
  });

});

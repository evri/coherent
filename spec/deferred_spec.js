/*jsl:import test-helpers.js*/

describe("Deferred", function()
{
  it("should remember its result", function()
  {
    var d = new coherent.Deferred();
    d.callback(5);
    expect(d.result()).toBe(5);
  });

  it("should invoke callback on success", function()
  {
    var d = new coherent.Deferred();
    var callbackValue;
    var failureValue;

    function callback(result)
    {
      callbackValue = result;
    }

    function failure(result)
    {
      failureValue = result;
    }

    d.addMethods(callback, failure);
    d.callback(5);
    expect(callbackValue).toBe(5);
    expect(failureValue).toBe(void(0));
  });

  it("should invoke failure handler on failure", function()
  {
    var d = new coherent.Deferred();
    var callbackValue;
    var failureValue;

    function callback(result)
    {
      callbackResult = result;
    }

    function failure(result)
    {
      failureValue = result;
    }

    d.addMethods(callback, failure);
    d.failure(new Error("oops"));
    expect(callbackValue).toBe(void(0));
    expect(failureValue).toBeInstanceOf(Error);
  });

  it("should invoke each callback handler on success", function()
  {
    var d = new coherent.Deferred();
    var callbackValues = [];

    function callback1(result)
    {
      callbackValues.push(result);
    }

    function callback2(result)
    {
      callbackValues.push(result);
    }

    d.addCallback(callback1);
    d.addCallback(callback2);
    d.callback(5);

    expect(callbackValues[0]).toBe(5);
    expect(callbackValues[1]).toBe(5);
  });

  it("should invoke each callback handler on success and skip failure handler", function()
  {
    var d = new coherent.Deferred();
    var callbackValues = [],
        failureCalled = false;

    function callback1(result)
    {
      callbackValues.push(result);
    }

    function callback2(result)
    {
      callbackValues.push(result);
    }

    function failure(result)
    {
      failureCalled = true;
    }

    d.addCallback(callback1);
    d.addCallback(callback2);
    d.callback(5);

    expect(failureCalled).toBe(false);
    expect(callbackValues[0]).toBe(5);
    expect(callbackValues[1]).toBe(5);
  });

  it("should call each failure handler on failure", function()
  {
    var d = new coherent.Deferred();
    var failureCount = 0;

    function failure(result)
    {
      failureCount++;
    }

    d.addErrorHandler(failure);
    d.addErrorHandler(failure);
    d.failure(new Error("foo"));

    expect(failureCount).toBe(2);
  });

  it("should call each failure handler on failure and skip success callbacks", function()
  {
    var d = new coherent.Deferred();
    var callbackCalled = false,
        failureCount = 0;

    function callback(result)
    {
      callbackCalled = true;
    }

    function failure(result)
    {
      failureCount++;
    }

    d.addErrorHandler(failure);
    d.addCallback(callback);
    d.addErrorHandler(failure);
    d.failure(new Error("foo"));

    expect(failureCount).toBe(2);
    expect(callbackCalled).toBe(false);
  });

  it("should call success handler after 2s", function()
  {
    var callbackCalled = false,
        callbackValue;

    runs(function()
    {
      function invokeCallback()
      {
        d.callback(5);
      }

      function callback(value)
      {
        callbackValue = value;
        callbackCalled = true;
      }

      var d = new coherent.Deferred();
      d.addCallback(callback);
      window.setTimeout(invokeCallback, 2000);
    });

    waitsFor(function()
    {
      return callbackCalled;
    });

    runs(function()
    {
      expect(callbackCalled).toBe(true);
      expect(callbackValue).toBe(5);
    })
  });

  it("should allow callbacks to return deferred values", function()
  {
    var complete = false,
        callbackValue;

    runs(function()
    {
      function callbackReturningDeferred(value)
      {
        var d2 = new coherent.Deferred();

        function timer()
        {
          d2.callback(value + 5);
        }
        window.setTimeout(timer, 2000);
        return d2;
      }

      function finalCallback(value)
      {
        callbackValue = value;
        complete = true;
      }

      var d = new coherent.Deferred();
      d.addCallback(callbackReturningDeferred);
      d.addCallback(finalCallback);

      function timer()
      {
        d.callback(5);
      }
      window.setTimeout(timer, 2000);
    });

    waitsFor(function()
    {
      return complete;
    });

    runs(function()
    {
      expect(callbackValue).toBe(10);
    })

  });

  it("should accept a deferred value for the callback", function()
  {
    var complete = new CompletionSignal(),
        callbackValue;

    runs(function()
    {
      function callback(value)
      {
        callbackValue = value;
        complete.set(true);
      }

      var d = new coherent.Deferred();
      d.addCallback(callback);


      function timer()
      {
        d2.callback(5);
      }

      var d2 = new coherent.Deferred();
      window.setTimeout(timer, 2000);
      d.callback(d2);
    });

    waitsFor(complete);

    runs(function()
    {
      expect(callbackValue).toBe(5);
    });
  });

  it("should allow creation of fired deferreds", function()
  {
    var d = coherent.Deferred.createCompleted(5),
        callbackValue;

    function callback(value)
    {
      callbackValue = value;
    }

    d.addCallback(callback);
    expect(callbackValue).toBe(5);
  });

  it("should allow creation of failed deferreds", function()
  {
    var d = coherent.Deferred.createFailed(new Error("foo")),
        errorValue;

    function failure(err)
    {
      errorValue = err;
    }

    d.addErrorHandler(failure);
    expect(errorValue).toBeInstanceOf(Error);
  });

});

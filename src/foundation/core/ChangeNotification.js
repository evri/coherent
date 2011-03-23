/*jsl:import ../../foundation.js*/

/** Enumerations for the types of changes.

    @property setting - A key's value has changed, the newValue property of
      the change notification will contain the new value. If the key
      represents an array, the newValue is the new array.

    @property insertion - An element or elements have been inserted into an
      array. The newValue property of the change notification will contain the
      new elements. The indexes property of the change notification will
      contain the index at which each element was inserted. The oldValue
      property will be null.

    @property deletion - An element or elements have been removed from an
      array. The newValue property of the change notification will be null.
      The oldValue property will contain the elements removed from the array.
      And the indexes property will contain the index of each element that was
      removed.

    @property replacement - An element or elements have been replace in an array.
      The newValue property of the change notification contains the new values
      for each element. The oldValue property contains the previous values for
      each element. And the indexes property will contain the index of each
      element replaced.

    @property validationError - The property has failed delayed validation. This
      can happen when the model values need to be sent to a server for
      validation.

    @namespace
 */
coherent.ChangeType = {
  setting: 0,
  insertion: 1,
  deletion: 2,
  replacement: 3,
  validationError: 4
};




/** Change notifications are the root of all updates.
  @constructor

  @property {Object} object - The object for which this update is being sent
  @property {coherent.ChangeType} changeType - The type of change this
        notification represents, one of `setting`, `insertion`, `deletion`,
        or `replacement`.
  @property newValue - The new value for the property
  @property oldValue - The previous value for the property
  @property {Number[]} indexes - If the change is for an array, this is an
        array of modified indexes, otherwise, this will be undefined.

  @property {Set} notifiedObserverUids - this is the set UIDs from of observers
        that have already received notifications for this change.
 */
coherent.ChangeNotification = function(object, changeType, newValue, oldValue, indexes)
{
  this.object = object;
  this.changeType = changeType;
  this.newValue = newValue;
  this.oldValue = oldValue;
  this.indexes = indexes;
  this.notifiedObserverUids = {};
}


coherent.ChangeNotification.getNotificationQueue = function()
{
  var eventLoop= coherent.EventLoop.currentEventLoop;
  if (eventLoop.notificationQueue)
    return eventLoop.notificationQueue;
  return eventLoop.notificationQueue = {
    willChange: {},
    didChange: {}
  };
}

coherent.ChangeNotification.scheduleNotifications = function()
{
  var eventLoop= coherent.EventLoop.currentEventLoop,
      queue = eventLoop.notificationQueue,
      did, will, change, previousValue, newValue;

  eventLoop.notificationQueue = null;

  if (!queue)
    return;
    
  for (var hash in queue.willChange)
  {
    if (!queue.didChange[hash])
    {
      console.log("willChangeValueForKey without matching didChangeValueForKey: key=", queue.willChange[hash].key);
      continue;
    }

    will = queue.willChange[hash];
    did = queue.didChange[hash];
    previousValue = will.value;
    newValue = did.value;

    //  Unless the change is forced, skill changes where the values are the same
    if (!will.force && will.value === did.value)
    {
      // console.log("No change: key=", will.key, "object=", will.obj, "value=", will.value);
      continue;
    }
    
    // console.log("Sending change notification: key=", will.key, "object=", will.obj);
    
    change = new coherent.ChangeNotification(will.obj, coherent.ChangeType.setting,
                                             newValue, previousValue);
    will.obj.notifyObserversOfChangeForKeyPath(change, will.key);

    //  stop observing changes to old value
    if (previousValue && previousValue.addObserverForKeyPath)
      coherent.KVO.unlinkChildFromParent(previousValue, this, will.keyInfo);

    //  observe changes to the new value
    if (newValue && newValue.addObserverForKeyPath)
      coherent.KVO.linkChildToParent(newValue, this, will.keyInfo);
  }
  
  //  If any of the change notifications resulted in further change notifications
  //  schedule a timer event to drain those notifications. The actual function
  //  doesn't have to do anything, because the timer event handler will call
  //  coherent.EventLoop#end() which will drain the pending notifications.
  if (eventLoop.notificationQueue)
    Function.nextTick(function(){});
}

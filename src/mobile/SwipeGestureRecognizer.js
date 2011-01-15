/*jsl:import GestureRecognizer.js*/
coherent.SwipeGestureDirection = {
  Right: 1,
  Left: 2,
  Up: 4,
  Down: 8
};

coherent.SwipeGestureRecognizer = Class.create(coherent.GestureRecognizer, {

  direction: coherent.SwipeGestureDirection.Right,
  numberOfTouchesRequired: 1,
  minDistance: 5,
  minSwipeDuration: 100,

  ontouchstart: function(event)
  {
    var numberOfTouches = event.touches.length;

    if (numberOfTouches < this.numberOfTouchesRequired)
      return;

    if (numberOfTouches > this.numberOfTouchesRequired)
    {
      this.state = coherent.GestureRecognizer.Failed;
      return;
    }

    this.touchX = event.changedTouches[0].pageX;
    this.touchY = event.changedTouches[0].pageY;
    this.when = Date.now();
  },

  ontouchmove: function(event)
  {
    var deltaX= event.changedTouches[0].pageX - this.touchX,
        deltaY= event.changedTouches[0].pageY - this.touchY,
        absDeltaX = Math.abs(deltaX),
        absDeltaY = Math.abs(deltaY),
        elapsed = Date.now() - this.when;

    if (absDeltaX < this.minDistance && absDeltaY < this.minDistance)
      return;

    var angle = Math.atan(absDeltaY / absDeltaX);
    // console.log('move: deltaX=' + deltaX + ' deltaY=' + deltaY + ' angle=' + (180*angle/Math.PI) + ' elapsed=' + elapsed);
    
    var DIR = coherent.SwipeGestureDirection,
        FAILED = coherent.GestureRecognizer.Failed,
        ANGLE45 = Math.PI / 4;

    Event.preventDefault(event);
    switch (this.direction)
    {
      case DIR.Left:
        if (deltaX<0 || angle > ANGLE45)
        {
          this.state = FAILED;
          return;
        }
        break;
        
      case DIR.Right:
        if (deltaX>0 || angle > ANGLE45)
        {
          this.state = FAILED;
          return;
        }
        break;

      case DIR.Down:
        if (deltaY<0 || angle <= ANGLE45)
        {
          this.state = FAILED;
          return;
        }
        break;
        
      case DIR.Up:
        if (deltaY>0 || angle <= ANGLE45)
        {
          this.state = FAILED;
          return;
        }
        break;

      default:
        break;
    }

    if (elapsed > this.minSwipeDuration)
      this.state= coherent.GestureRecognizer.Recognized;
  },

  ontouchend: function(event)
  {
    var numberOfTouches= event.touches.length;

    if (numberOfTouches!=this.numberOfTouchesRequired)
      this.state= coherent.GestureRecognizer.Failed;
    else
      this.ontouchmove(event);
  }
  
});

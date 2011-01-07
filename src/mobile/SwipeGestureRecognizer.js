/*jsl:import GestureRecognizer.js*/
coherent.SwipeGestureDirection= {
  Right: 1,
  Left: 2,
  Up: 4,
  Down: 8
};

coherent.SwipeGestureRecognizer= Class.create(coherent.GestureRecognizer, {

  direction: coherent.SwipeGestureDirection.Right,
  numberOfTouchesRequired: 1,
  minDistance: 5,
  
  ontouchstart: function(event)
  {
    var numberOfTouches= event.touches.length;
    
    if (numberOfTouches<this.numberOfTouchesRequired)
      return;
      
    if (numberOfTouches>this.numberOfTouchesRequired)
    {
      this.state= coherent.GestureRecognizer.Failed;
      return;
    }
    
    this.touchX= event.changedTouches[0].pageX;
    this.touchY= event.changedTouches[0].pageY;
  },
  
  ontouchmove: function(event)
  {
    var deltaX= event.changedTouches[0].pageX - this.touchX,
        deltaY= event.changedTouches[0].pageY - this.touchY;
    
    var DIR= coherent.SwipeGestureDirection,
        FAILED= coherent.GestureRecognizer.Failed,
        CROSS_SWIPE_TOLERANCE= 20,
        CROSS_SWIPE_FACTOR= 5;
        
    var deltaDirection;
    var deltaAcross;
    
    Event.preventDefault(event);
    switch (this.direction)
    {
      case DIR.Right:
        deltaAcross= Math.abs(deltaY);
        deltaDirection= Math.abs(deltaX);
        if (deltaX>0)
          this.state= FAILED;
        break;
          
      case DIR.Left:
        deltaAcross= Math.abs(deltaY);
        deltaDirection= Math.abs(deltaX);
        if (deltaX<0)
          this.state= FAILED;
        break;
        
      case DIR.Up:
        deltaAcross= Math.abs(deltaX);
        deltaDirection= Math.abs(deltaY);
        if (deltaY<0)
          this.state= FAILED;
        break;
        
      case DIR.Down:
        deltaAcross= Math.abs(deltaX);
        deltaDirection= Math.abs(deltaY);
        if (deltaY>0)
          this.state= FAILED;
        break;
      
      default:
        break;
    }

    if (deltaAcross > CROSS_SWIPE_TOLERANCE && deltaAcross*CROSS_SWIPE_FACTOR > deltaDirection)
      this.state= FAILED;
  },
  
  ontouchend: function(event)
  {
    var deltaX= event.changedTouches[0].pageX - this.touchX,
        deltaY= event.changedTouches[0].pageY - this.touchY;
    
    var DIR= coherent.SwipeGestureDirection,
        RECOGNIZED= coherent.GestureRecognizer.Recognized;

    this.state= coherent.GestureRecognizer.Failed;
    
    switch (this.direction)
    {
      case DIR.Right:
        if (-deltaX > this.minDistance)
          this.state= RECOGNIZED;
        break;
        
      case DIR.Left:
        if (deltaX > this.minDistance)
          this.state= RECOGNIZED;
        break;
      
      case DIR.Up:
        if (deltaY > this.minDistance)
          this.state= RECOGNIZED;
        break;

      case DIR.Down:
        if (-deltaY > this.minDistance)
          this.state= RECOGNIZED;
        break;
      
      default:
        break;
    }
  }

});

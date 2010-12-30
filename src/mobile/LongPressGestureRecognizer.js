/*jsl:import GestureRecognizer.js*/

coherent.LongPressGestureRecognizer= Class.create(coherent.GestureRecognizer, {

  minimumPressDuration: 400,
  allowableMovement: 10,
  numberOfTouchesRequired: 1,
  
  reset: function()
  {
    if (this.__timer)
      this.__timer.cancel();
    this.__timer= null;
    this.state= coherent.GestureRecognizer.Possible;
  },
  
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
    
    if (!this.__timer)
    {
      this.__timer= Function.delay(this.__pressDurationMet,
                                   this.minimumPressDuration,
                                   this);
      this.touchX= event.changedTouches[0].pageX;
      this.touchY= event.changedTouches[0].pageY;
      this.__allowableMovementSquared= this.allowableMovement*this.allowableMovement;
    }
  },
  
  ontouchmove: function(event)
  {
    if (!this.__timer)
      return;
      
    var deltaX= event.changedTouches[0].pageX - this.touchX,
        deltaY= event.changedTouches[0].pageY - this.touchY;
    
    if (deltaX*deltaX + deltaY*deltaY > this.__allowableMovementSquared)
      this.state= coherent.GestureRecognizer.Failed;
  },
  
  ontouchend: function(event)
  {
    var numberOfTouches= event.touches.length;

    if (this.__timer && numberOfTouches!=this.numberOfTouchesRequired)
      this.state= coherent.GestureRecognizer.Failed;
  },
  
  __pressDurationMet: function()
  {
    //  I need to fire my own action message, because there's no calling event
    coherent.Application.shared.sendAction(this.action, this.target||this.view, this);
    this.reset();
    
    //  TODO: This is just awful. The only way to prevent the click event from
    //  being fired is to call preventDefault for touchstart. The problem is I
    //  don't know I need to cancel the click event until after the timeout. My
    //  hacktacular solution is to install a click handler directly on the node
    //  that swallows the event. After the click, I restore the previous value,
    //  which is likely to be null.
    var previousClick= this.view.node.onclick;
    var node= this.view.node;
    
    node.onclick= function(event)
    {
      Event.stop(event);
      node.onclick= previousClick;
      return false;
    }
  }
  
});

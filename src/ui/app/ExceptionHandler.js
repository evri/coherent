/*jsl:import ../../ui.js*/

coherent.ExceptionHandler= {

  handleException: function(e)
  {
    console.log("Uncaught exception:" + e.message, e);
  },
  
  enabled: false
  
};

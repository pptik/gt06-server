var gps = require("gps-tracking");
var count = 0;
var options = {
    'debug': true, //We don't want to debug info automatically. We are going to log everything manually so you can check what happens everywhere
    'port': 8090,
    'device_adapter': "GT06"
}

var server = gps.server(options, function (device, connection) {

    device.on("connected", function (data) {

        console.log("I'm a new device connected ");
        return data;

    });

    device.on("login_request", function (device_id, msg_parts) {

        console.log('Hey! I want to start transmiting my position. Please accept me. My name is '+device_id);

        this.login_authorized(true); 

        console.log("Ok, "+device_id+", you're accepted!");

    });


    device.on("ping", function (data) {
        //this = device
        // console.log(data);
        count = count+1;
        
        console.log("I'm here: " + data.latitude + ", " + data.longitude + " (" + this.getUID() + ")"+"    NO MESSAGE:  "+count);
        //Look what informations the device sends to you (maybe velocity, gas level, etc)
        //console.log(data);
        return data;

    });

    device.on("alarm", function (alarm_code, alarm_data, msg_data) {
        console.log("Help! Something happend: "+alarm_code+" ("+alarm_data.msg+")");
    });

    //Also, you can listen on the native connection object
    connection.on('data', function (data) {
        //echo raw data package
        //console.log(data.toString()); 
    })

});
var gps = require("gps-tracking");
var count = 0;
var options = {
    'debug': false, //We don't want to debug info automatically. We are going to log everything manually so you can check what happens everywhere
    'port': 8090,
    'device_adapter': "GT06"
}

//connection rabbitmq
const rmq_config = require('./configs/rmq.json');
let rmq = require('amqplib');

rmq.connect(rmq_config.broker_uri).then(async (conn) => {
    let ch = await conn.createChannel();
    var server = gps.server(options, function (device, connection) {
        device.on("connected", function (data) {
            console.log("ada tracker yang baru terhubung")
            console.log('connected', data)
            return data;
        });
    
        device.on("login_request", function (device_id, msg_parts) {
            this.login_authorized(true); 
            console.log(device_id+ " melakukan login");
            console.log('login_request: device_id', device_id)
            console.log('login_request: msg_parts', msg_parts)
            //console.log("=================================================")
        });
    
        device.on("ping", async function (data) {
            console.log('ping data', data)
            try {
                //this = device
                // console.log(data);
                count = count+1;  

                if(data.latitude > 0) {
                    data.latitude = -data.latitude;
                }
                console.log('NO MESSAGE:'+count+'. #' + this.getUID() + ' ( ' +data.latitude + ',' + data.longitude +' )');
                //console.log("=================================================")  
            
                //publish to rabbitmq
                try {
                    await ch.assertExchange(rmq_config.exchange_name, 'topic', {durable: false});
                    let q = await ch.assertQueue(rmq_config.queue_name, {exclusive: false, durable:true});
                    await ch.bindQueue(q.queue, rmq_config.exchange_name, rmq_config.route_name);
                    //console.log("starting produce via "+rmq_config.route_name);
                    
                    let msg = {id : this.getUID(), latitude: data.latitude, longitude: data.longitude, time: new Date(), speed: data.speed };
                    msg = JSON.stringify(msg);
                    console.log('to_publish', msg);
                    await ch.publish(rmq_config.exchange_name, rmq_config.route_name, new Buffer(msg));
					await ch.publish('', 'gps-tracker-rawtile', new Buffer(msg))
                }catch (err){
                    console.log('publish msg error');
                    console.log(err);
                }
    
                //Look what informations the device sends to you (maybe velocity, gas level, etc)
                //console.log(data);
                return data;
            } catch(error) {
                console.log('something broken');
                console.log(error);
            }
            
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
}).catch(err => {
    console.log(err);
});


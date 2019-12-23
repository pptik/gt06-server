var gps = require("gps-tracking");
var count = 0;
var options = {
    'debug': false,
    'port': 8090,
    'device_adapter': "GT06"
}

const rmq_config = require('./configs/rmq.json');
let rmq = require('amqplib');

rmq.connect(rmq_config.broker_uri).then(async (conn) => {
    let ch = await conn.createChannel();
    await ch.assertExchange(rmq_config.exchange_name, 'topic', {durable: false});
    let q = await ch.assertQueue(rmq_config.queue_name, {exclusive: false, durable:true});
    await ch.bindQueue(q.queue, rmq_config.exchange_name, rmq_config.route_name);
    var server = gps.server(options, function (device, connection) {
        device.on("connected", function (data) {
            return data;
        });
    
        device.on("login_request", function (device_id, msg_parts) {
            this.login_authorized(true); 
        });
    
        device.on("ping", async function (data) {
            try {
                count = count+1;  

                if(data.latitude > 0) {
                    data.latitude = -data.latitude;
                }
                console.log('NO MESSAGE:'+count+'. #' + this.getUID() + ' ( ' +data.latitude + ',' + data.longitude +' )');

                try {                    
                    let msg = {id : this.getUID(), latitude: data.latitude, longitude: data.longitude, time: new Date(), speed: data.speed };
                    msg = JSON.stringify(msg);
                    await ch.publish(rmq_config.exchange_name, rmq_config.route_name, new Buffer(msg), { deliveryMode: 2 });
					await ch.publish('', 'gps-tracker-rawtile', new Buffer(msg), { deliveryMode: 2 })
                }catch (err){
                    console.log('publish msg error');
                    console.log(err);
                }

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


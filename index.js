const mqtt = require('mqtt');
const { Parser, fromFile } = require('@asyncapi/parser');
const parser = new Parser();

async function main() {
  try {
   
    const asyncapi = await fromFile(parser, './asyncapi.yaml').parse();

    const mqttUrl = `mqtt://${asyncapi.document._json.servers.mqtt.host}:1883`;
    console.log(mqttUrl);
    const clientId = `mqtt_${Math.random().toString(16).slice(3)}`
    const client = mqtt.connect(mqttUrl,{clientId,
     username:"broker",
     password:"public"

    });
    
    const publishStockPrices = () => {
      const stockPrices = [
        { symbol: 'AAPL', price: 123.45, timestamp: new Date().toISOString() },
        { symbol: 'GOOG', price: 2345.67, timestamp: new Date().toISOString() },
        { symbol: 'MSFT', price: 245.89, timestamp: new Date().toISOString() }
      ];

      const topic = asyncapi.document._json.channels['stock-prices'].address;

      stockPrices.forEach(price => {
        client.publish(topic, JSON.stringify(price));
        console.log(`Published stock price for ${price.symbol}: $${price.price}`);
      });
    };

    
    const handleStockPrices = (topic, message) => {
      const messageString = message.toString('utf8');
      try {
        const stockPrice = JSON.parse(messageString);
        console.log(`Received stock price for ${stockPrice.symbol}: $${stockPrice.price} (${stockPrice.timestamp})`);
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    };

    client.on('connect', () => {
      console.log('MQTT client connected');
      client.subscribe("stock-prices", (err) => {
        if (err) {
          console.error('Error subscribing to stock prices channel:', err);
          return;
        }
        console.log('Subscribed to stock prices channel');
        setInterval(publishStockPrices, 5000); // Publish stock prices every 5 seconds
      });
    });

    // Handle incoming messages
    client.on('message', handleStockPrices);
    
    // Handle errors
    client.on('error', (error) => {
      console.error('MQTT client error:', error);
    });

  } catch (error) {
    console.error('Error parsing AsyncAPI specification:', error);
  }
}

main();

const express = require('express')
const fetch = require("node-fetch");
const redis = require('redis')
 
// create express application instance
const app = express()
 
// create and connect redis client to local instance.
const client = redis.createClient(6379)
 
// echo redis errors to the console
client.on('error', (err) => {
    console.log("Error " + err)
});
 
// get employees list
app.get('/employees', (req, res) => {
 
    // key to store results in Redis store
    const employeesRedisKey = 'employees';
 
    // Try fetching the result from Redis first in case we have it cached
    return client.get(employeesRedisKey, (err, employees) => {
 
        // If that key exists in Redis store
        if (employees) {
 
            return res.json({ source: 'cache', data: JSON.parse(employees) })
 
        } else { // Key does not exist in Redis store
 
            // Fetch directly from remote api
            fetch('http://dummy.restapiexample.com/api/v1/employees')
                .then(response => response.json())
                .then(employees => {
 
                    // Save the  API response in Redis store,  data expire time in 3600 seconds, it means one hour
                    client.setex(employeesRedisKey, 3600, JSON.stringify(employees))
 
                    // Send JSON response to client
                    return res.json({ source: 'api', data: employees})
 
                })
                .catch(error => {
                    // log error message
                    console.log(error)
                    // send error to the client 
                    return res.json(error.toString())
                })
        }
    });
});
 
// start express server at 3000 port
app.listen(3000, () => {
    console.log('Server listening on port: ', 3000)
});

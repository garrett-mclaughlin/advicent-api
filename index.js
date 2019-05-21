/**
 * Declaring application constants:
 * @const express | Express.js library for spinning up a server
 * @const colors  | Colors library (for colorful and meaningful console output)
 * @const csv     | CSV Parser library to pull information from college_costs.csv
 * @const fs      | File System library as a parent library to CSV for read stream
 * @const app     | Instance of express, used to set up HTTP methods
 * @const port    | Just a constant port for server
 */
const express = require('express');
const colors = require('colors');
const csv = require('csv-parser');
const fs = require('fs');
const app = express();
const port = 3000;

// Empty JSON object which will ultimately include parsed CSV file info
const colleges = {};

/**
 * Establish a read stream which pipes the data from CSV to JSON.
 * For each college in the CSV file, add a new JSON key with the college
 * name in the colleges object. Include key-value pairs for the in-state
 * tuition, out-of-state tuition, and room-and-board cost.
 */
fs.createReadStream('college_costs.csv')
    .pipe(csv())
    .on('data', (data) => {
        colleges[`${data.College}`] = {
            tuition_in: data[`Tuition (in-state)`],
            tuition_out: data[`Tuition (out-of-state)`],
            room_and_board: data[`Room & Board`]
        };
    })

/**
 * @Object req: HTTP request header
 * @Object res: HTTP response body
 * 
 * 'req' contains the specified query for the GET request.
 * 
 * To formulate a proper query (like in Postman), we need two
 * key-value pairs:
 * 
 * @college which contains the name of the college (case sensitive).
 * This value is used to pull info from the 'colleges' JSON Object.
 * 
 * @room_and_board which is a boolean value of whether or not to include
 * room in board in the return cost value.
 */
app.get("/lookup", (req, res) => {
    console.log(`* Responding to college lookup request...`.blue);

    let college = req.query.college ? req.query.college : null;
    let room_and_board = req.query.room_and_board ? req.query.room_and_board : true;

    console.log(`* Parsed query: COLLEGE: ${college}, ROOM AND BOARD: ${room_and_board}`.blue);

    // CHECK FOR MISSING COLLEGE QUERY PARAMETER
    if (college == null) {
        console.log(`* College name omitted, returning 400 error`.red);
        return res.status(400).send({message: `Error: College name is required`})
    }

    // CHECK IF COLLEGE FROM QUERY PARAMETER EXISTS IN CSV FILE
    if (colleges[`${college}`] == null) {
        console.log(`* College not found in CSV file, returning 400 error`.red);
        return res.status(400).send({message: `Error: College not found`});
    }

    // SET COST TO IN-STATE COLLEGE TUITION
    let cost = Number.parseFloat(colleges[`${college}`].tuition_in);
    // ADD ROOM AND BOARD COST IF REQUIRED
    if (room_and_board == true) cost += Number.parseFloat(colleges[`${college}`].room_and_board);
    cost = cost.toFixed(2);
    console.log(`* Successful lookup. Returning the cost ${cost} with a 200 status.`.green);
    return res.status(200).send({Cost: cost});
});

/**
 * Set the API up to listen for requests.
 */
app.listen(port, () => {
    console.log(`* Express server running on port ${port}`.green);
});
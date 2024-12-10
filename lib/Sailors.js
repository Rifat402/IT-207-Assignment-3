// Utility function and variables to be used in file
function checkRecordExists(connection, table, column, value, cb){
    const qry = `SELECT 1 FROM ${table} WHERE ${column} = ?`;
    connection.query(qry, [value], (err, results) => {
        if (err) {
            return cb(err, null);
        }
        cb(null, results.length > 0);
    });

}
const table = "Sailors";


//  ***** DATABASE INTERACTION FUNCTIONS *****

// HTTP GET: creates an output string based on table data, performs a callback with the result. 
function getSailors(connection, cb) {
    connection.query("SELECT * FROM Sailors;", (err, results) => {
        if (err) {
            cb(404, "Data retrieval error\n" + err.message);
            return;
        }
        let output = "";
        results.forEach(row => {

            // Date is properly formatted for each row
            const date = new Date(row.B_date);

            // Custom formatting for date
            const formattedDate = date.toLocaleDateString('en-US', {
                weekday: 'short', 
                year: 'numeric', 
                month: 'short',  
                day: '2-digit'   
            }).replace(/,/g, '');

            output += `${row.S_Id} ${row.S_name} ${formattedDate} ${row.Rate}\n`;
        });

        cb(200, output);
    });
}


// HTTP POST: extracts data from queries, query's db

function postSailors(url, connection, cb) {
    var id = url.searchParams.get('S_Id'); 
    var name = url.searchParams.get('S_name');
    var bDate = url.searchParams.get('B_date');
    var rate = url.searchParams.get('Rate');

    utils
    let qry = `
    Use SailingAdventure; 
    INSERT INTO Sailors
    VALUES (?, ?, ?, ?);
    `;
    
    connection.query(qry, [id, name, bDate, rate], (err, result) => {
        if (err) {
            return cb(404, "Error Inserting data, please try again\n" + err.message);
        }
        if (result.affectedRows === 0) {
            return cb(500, "No entry found with given ID");
        }
        cb(200, "Entry Successfully Inserted");
    });
}

// HTTP PUT: finds row based on ID and updates other fields
function putSailors(url, connection, cb) {
    var id = url.searchParams.get('S_Id'); 
    var name = url.searchParams.get('S_name');
    var bDate = url.searchParams.get('B_date');
    var rate = url.searchParams.get('Rate');

    // Check if ID is valid before proceeding with update
    checkRecordExists(connection, table, "S_Id", id, (err, exists) => {
        if (err) {
            return cb(404, "Lookup error: " + err.message);
        }
        if (!exists) {
            return cb(404, "Record Not Found");
        }

        // add all of the field to change to an array, updates for the SQL query and values to pass as a parameter
        let updates = [];
        let values = [];

        if (name) {
            updates.push('S_name = ?');
            values.push(name);
        }
        if (bDate) {
            updates.push('B_date = ?');
            values.push(bDate);
        }
        if (rate) {
            updates.push('Rate = ?');
            values.push(rate);
        }
        if (updates.length === 0) {
            return cb(400, "No valid fields provided for update");
        }
        values.push(id); 

        let qry = `
        USE SailingAdventure;
        UPDATE Sailors 
        SET ${updates.join(', ')} 
        WHERE Sailors.S_Id = ?;
        `;

        connection.query(qry, values, (err, result) => {
            if (err) {
                return cb(404, "Error Updating file, please try again\n" + err.message);
            }
            cb(200, "Entry Successfully Updated");
        });
    });
}


// HTTP DELETE: finds row based on id and deletes row
function deleteSailors(url, connection, cb) {
    var id = url.searchParams.get('S_Id'); 
    // Check if the sailor exists
    checkRecordExists(connection, "Sailors", "S_Id", id, (err, exists) => {
        if (err) {
            return cb(404, "Lookup error: " + err.message); 
        }
        if (!exists) {
            return cb(404, "Record Not Found");  
        }

        // If the sailor exists, delete
        let qry = `
        USE SailingAdventure;
        DELETE FROM Sailors 
        WHERE Sailors.S_Id = ?;
        `;

        connection.query(qry, [id], (err, result) => {
            if (err) {
                return cb(404, "Error Deleting file, please try again\n" + err.message);  
            }
            cb(200, "Entry Successfully Deleted");  
        });
    });
}

// ***** ROUTING LOGIC *****

function routeSailors(connection, url, req, res) {
    var method = req.method.toUpperCase();
    switch (method) {
        case "GET":
            getSailors(connection, (code, output) => {
                res.setHeader('content-type', 'text/plain; charset="utf-8"');
                res.writeHead(code);
                res.end(output);
            });
            break;
        case "PUT":
            putSailors(url, connection, (code, output) => {
                res.setHeader('content-type', 'text/plain; charset="utf-8"');
                res.writeHead(code);
                res.end(output);
            });
            break;
        case "DELETE":
            deleteSailors(url, connection, (code, output) => {
                res.setHeader('content-type', 'text/plain; charset="utf-8"');
                res.writeHead(code);
                res.end(output);
            });
            break;
        case "POST":
            postSailors(url, connection, (code, output) => {
                res.setHeader('content-type', 'text/plain; charset="utf-8"');
                res.writeHead(code);
                res.end(output);
            });
            break;
    }
}

// ***** EXPORT ALL FUNCTIONS *****

module.exports = {
    getSailors,
    postSailors,
    putSailors,
    deleteSailors,
    routeSailors
}

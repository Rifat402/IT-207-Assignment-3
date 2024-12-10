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
const table = "Boats";


//  ***** DATABASE INTERACTION FUNCTIONS *****

// HTTP GET: creates an output string based on table data, performs a callback with the result.

function getBoats(connection, cb) {
    connection.query("SELECT * FROM Boats;", (err, results) => {
        if (err) {
            cb(404, "Data retrieval error\n" + err.message);
            return;
        }
        let output = "";
        results.forEach(row => {
            output += `${row.B_Id} ${row.B_name} ${row.B_type}\n`;
        });

        cb(200, output);
    });
}

// HTTP POST: extracts data from queries, query's db

function postBoats(url,connection,cb){

    var id = url.searchParams.get('B_Id'); 
    var name = url.searchParams.get('B_name');
    var type = url.searchParams.get('B_type');

    // initialize base sql query (parameterized)
    let qry = `
    Use SailingAdventure; 
    insert into Boats
    Values (?,?,?);
    `;
    
    
    connection.query(qry,[id,name,type], (err,result) => {
        if (err) {
            // handle error
            return cb(404, "Error Inserting data, please try again\n" + err.message);
        }
        // Check if any row was updated
        if (result.affectedRows === 0) {
            return cb(500, "No entry found with given ID");
        }
        // Successful modification
        cb(200, "Entry Successfully Inserted");
    });
}

// HTTP PUT: finds row base on ID and updates other fields

function putBoats(url, connection, cb) {
    var id = url.searchParams.get('B_Id');
    var name = url.searchParams.get('B_name');
    var type = url.searchParams.get('B_type');

    // Check if ID is valid
    checkRecordExists(connection, table, "B_Id", id, (err, exists) => {
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
            updates.push('B_name = ?');
            values.push(name);
        }
        if (type) {
            updates.push('B_type = ?');
            values.push(type);
        }
        if (updates.length === 0) {
            return cb(400, "No valid fields provided for update");
        }
        values.push(id);  

        let qry = `
        USE SailingAdventure;
        UPDATE Boats
        SET ${updates.join(', ')}
        WHERE Boats.B_Id = ?;
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

function deleteBoats(url, connection, cb) {
    var id = url.searchParams.get('B_Id');

    // Check if ID is valid
    checkRecordExists(connection, table, "B_Id", id, (err, exists) => {
        if (err) {
            return cb(404, "Lookup error: " + err.message);
        }
        if (!exists) {
            return cb(404, "Record Not Found");
        }

        let qry = `
        USE SailingAdventure;
        DELETE FROM Boats
        WHERE Boats.B_Id = ?;
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

function routeBoats(connection,url,req,res){

    // extract method from url request
    var method = req.method.toUpperCase();

    // utilize database interaction methods based on http method, for each method, the header will be manipulated and the output will be returned
    switch (method) {
        case "GET":
            getBoats(connection,(code,output) => {
                res.setHeader('content-type','text/plain; charset="utf-8"');
                res.writeHead(code);
                res.end(output);
            });
            break;
        case "PUT":
            putBoats(url,connection,(code,output) => {
                res.setHeader('content-type','text/plain; charset="utf-8"');
                res.writeHead(code);
                res.end(output);
                });
            break;
        case "DELETE":
            deleteBoats(url,connection,(code,output) => {
                res.setHeader('content-type','text/plain; charset="utf-8"');
                res.writeHead(code);
                res.end(output);
                });
            break;
        case "POST":
            postBoats(url,connection,(code,output) => {
                res.setHeader('content-type','text/plain; charset="utf-8"');
                res.writeHead(code);
                res.end(output);
                });
            break;
    }

}
// ***** EXPORT ALL FUNCTIONS *****

module.exports = {
    getBoats,
    postBoats,
    putBoats,
    deleteBoats,
    routeBoats
}
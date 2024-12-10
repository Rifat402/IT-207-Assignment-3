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
const table = "Reserves";




//  ***** DATABASE INTERACTION FUNCTIONS *****

// HTTP GET: creates an output string based on table data, performs a callback with the result. 
function getReserves(connection, cb) {
    
    // JOIN the other 2 tables to include the names of the sailor and boat with their IDs
    const qry = `
    SELECT 
        Reserves.S_Id, 
        Reserves.B_Id, 
        Reserves.Day, 
        Sailors.S_name, 
        Boats.B_name
    FROM 
        Reserves
    JOIN 
        Sailors ON Reserves.S_Id = Sailors.S_Id
    JOIN 
        Boats ON Reserves.B_Id = Boats.B_Id;
    `;

    connection.query(qry, (err, results) => {
        if (err) {
            cb(404, "Data retrieval error\n" + err.message);
            return;
        }
        let output = "";
        results.forEach(row => {

            const date = new Date(row.Day);

            // Custom formatting for date
            const formattedDate = date.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: '2-digit'
            }).replace(/,/g, '');

            
            output += `${row.S_Id} ${row.S_name} ${row.B_Id} ${row.B_name} ${formattedDate}\n`;
        });

        cb(200, output);
    });
}

// HTTP POST: extracts data from queries, query's db

function postReserves(url, connection, cb) {

    var sId = url.searchParams.get('S_Id');
    var bId = url.searchParams.get('B_Id');
    var day = url.searchParams.get('Day');

    let qry = `
    USE SailingAdventure;
    INSERT INTO Reserves (S_Id, B_Id, Day)
    VALUES (?, ?, ?);
    `;

    connection.query(qry, [sId, bId, day], (err, result) => {
        if (err) {
            return cb(404, "Error Inserting data, please try again\n" + err.message);
        }
        cb(200, "Entry Successfully Inserted");
    });
}

// HTTP DELETE: finds row based on all field in table and deletes row
function deleteReserves(url, connection, cb) {
    var sId = url.searchParams.get('S_Id');
    var bId = url.searchParams.get('B_Id');
    var day = url.searchParams.get('Day');

    
    const checkQry = `
    SELECT 1 FROM Reserves WHERE S_Id = ? AND B_Id = ? AND Day = ?;
    `;

    connection.query(checkQry, [sId, bId, day], (err, results) => {
        if (err) {
            return cb(404, "Error checking reservation existence: " + err.message);
        }
        if (results.length === 0) {
            return cb(404, "Reservation not found");
        }

        // delete if exists
        let deleteQuery = `
        USE SailingAdventure;
        DELETE FROM Reserves WHERE S_Id = ? AND B_Id = ? AND Day = ?;
        `;

        connection.query(deleteQuery, [sId, bId, day], (err, result) => {
            if (err) {
                return cb(404, "Error Deleting reservation: " + err.message);
            }
            if (result.affectedRows === 0) {
                return cb(500, "No reservation was deleted");
            }
            cb(200, "Reservation successfully deleted");
        });
    });
}


// Routing Logic for Reserves

function routeReserves(connection, url, req, res) {
    var method = req.method.toUpperCase();
    switch (method) {
        case "GET":
            getReserves(connection, (code, output) => {
                res.setHeader('content-type', 'text/plain; charset="utf-8"');
                res.writeHead(code);
                res.end(output);
            });
            break;
        case "POST":
            postReserves(url, connection, (code, output) => {
                res.setHeader('content-type', 'text/plain; charset="utf-8"');
                res.writeHead(code);
                res.end(output);
            });
            break;
        case "DELETE":
            deleteReserves(url, connection, (code, output) => {
                res.setHeader('content-type', 'text/plain; charset="utf-8"');
                res.writeHead(code);
                res.end(output);
            });
            break;
    }
}

module.exports = {
    getReserves,
    postReserves,
    deleteReserves,
    routeReserves
}

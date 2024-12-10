// Ensure password was entered as a command line argument before continuing
if (process.argv.length < 3){
    console.log("\nIncorrect Usage, please enter commmand as:\nnode connect.js <mySQL password>\n");
    return;
}

// Import nodejs and external modules
const mysql = require("mysql2");
const http = require("http");
const { URL } = require("url");


// Import other lib files
const boats = require("./lib/Boats.js");
const sailors = require("./lib/Sailors.js");
const reserves = require("./lib/Reserves.js");

//  ***** DATABASE CREATION LOGIC *****

// Establish DB connection

const connection = mysql.createConnection({
    host: "localhost" ,
    user: "root",
    password: process.argv[2], // Password should be passed as a command line arg
    multipleStatements: true
});

connection.connect(err => {
    if (err) throw err;
});


// Create database

let qry = "create database if not exists SailingAdventure";
connection.query(qry,err => {
    if (err) throw err;
    console.log("Database created");
});

// Add tables

qry = `
USE SailingAdventure;
CREATE TABLE IF NOT EXISTS Sailors (
    S_Id INT AUTO_INCREMENT PRIMARY KEY,
    S_name VARCHAR(255) NOT NULL,
    B_date DATE,
    Rate INT
);
CREATE TABLE IF NOT EXISTS Boats (
    B_Id INT AUTO_INCREMENT PRIMARY KEY,
    B_name VARCHAR(255) NOT NULL,
    B_type VARCHAR(100)
);
CREATE TABLE IF NOT EXISTS Reserves (
    S_Id INT,
    B_Id INT,
    Day DATE,
    PRIMARY KEY (S_Id, B_Id, Day),
    FOREIGN KEY (S_Id) REFERENCES Sailors(S_Id),
    FOREIGN KEY (B_Id) REFERENCES Boats(B_Id)
);
`;

connection.query(qry,err => {
    if (err) throw err;
    console.log("Tables Created")
});


// insert data into tables

qry = `
INSERT IGNORE INTO Sailors (S_Id, S_name, B_date, Rate) VALUES
(1, 'Kate', '1980-05-01', 9),
(2, 'Sarah', '1976-10-13', 4),
(3, 'Sam', '1989-12-19', 3),
(4, 'Scott', '1969-01-23', 0);
INSERT IGNORE INTO Boats (B_Id, B_name, B_type) VALUES
(1, 'Sky', 'Fishing vessel'),
(2, 'Sliver', 'Bass boat'),
(3, 'Rose', 'Sloop'),
(4, 'Arrow', 'Sailboat');
INSERT IGNORE INTO Reserves (S_Id, B_Id, Day) VALUES
(1, 1, '2019-10-09'),
(3, 2, '2019-01-07'),
(2, 2, '2017-02-19'),
(2, 2, '2018-10-29'),
(2, 3, '2018-11-13'),
(1, 1, '2020-12-17'),
(1, 4, '2020-05-06');
`

// insert the data if it had not already been inserted

connection.query(qry,err => {
    if (err) throw err;
    console.log("Data inserted");
});

// ***** INITIALIZE SERVER *****


// Server logic, decides routing function to use based on URL
const server = http.createServer((req,res) => {
    
    // setting the url variable that is passed as a argument in the other file's routing logic
    var url = new URL(req.url, `http://${req.headers.host}`);

    if (url.toString().includes("/boats"))
    {
        boats.routeBoats(connection,url,req,res);
    }

    else if (url.toString().includes("/sailors"))
    {
        sailors.routeSailors(connection,url,req,res);
    }

    else if (url.toString().includes("/reserves"))
    {
        reserves.routeReserves(connection,url,req,res);
    }

    else
    {
        res.end("Invalid URL, please select one of /reserves, /boats, or /sailors.");
    }

});

// Create port number and have the server listen
var portNum = 3030;

server.listen(portNum,()=>{
    console.log(`Listening on port ${portNum}`);
});
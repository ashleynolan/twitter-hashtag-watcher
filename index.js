/**
 * Declare our Module dependencies at the top
 */

var express = require('express');	//express - application framework for node


//fixes long ../../ require calls
//https://gist.github.com/branneman/8048520
process.env.NODE_PATH = '.';
require('module').Module._initPaths();


/**
 * Index.js
 * The main application entry file.
 * Please note that the order of loading is important!
 */

var env = process.env.NODE_ENV || 'local',		//get the environemnt var or set as development
	config = require('core/config')[env];	//get config based on the specifed environment

console.log('ENVIRONMENT = ' + env); // log out the environment variable to the terminal


//  ================================
//  === EXPRESS SETUP AND CONFIG ===
//  ================================
var parentApp = express(); //Create an express app

require('./core')(parentApp, config); //handles the setup of our application

// expose app as the scope
exports = module.exports = parentApp;


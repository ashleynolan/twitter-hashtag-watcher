
/**
 * Module dependencies.
 */

var mongoose = require('mongoose'),
  env = process.env.NODE_ENV || 'development',
  config = require('core/config')[env],
  Schema = mongoose.Schema;




//Tag schema is made up f the tagname, and an array of mentions
//each object in the array of mentions
var Tag = new Schema({
	tagname	: String
});

/**
 * Symbol Schema
 */

var Symbol = new Schema({
	name				:	{ type : String, unique: true },
	lastUpdated			:	{ type : Date, default : Date.now },

	tags			:  [Tag]
});



/**
 * Methods
 */

Symbol.methods = {

};



/**
 * Statics
 */

Symbol.statics = {

  /**
   * Find symbol by name
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

	load: function (symbolName, cb) {
		this.findOne({ name : symbolName })
			.exec(cb);
	},

	/**
	* Find all questions
	*
	* @param {Function} cb
	* @api private
	*/

	loadAll: function (cb) {

		// this.find().sort({ 'name': -1 })
		// 	.exec(cb);
		this.find().sort({ name : 1})
			.exec(cb);

	},


	removeTag: function (symbol, name) {

		console.log('removing tag' + name)

	},

  /**
   * Find all hashtags
   *
   * @param {Function} cb
   * @api private
   */

	getAllTags: function (cb) {

		var tags = [];

		this.find({}, { tags: 1 }, function (err, symbols) {

			if (err) return handleError(err);

			symbols.forEach(function (q) {

				for (var i = 0; i < q.tags.length; i++) {

					var tag = q.tags[i];

					console.log(i);

					this.pushToTagArray(tags, tag);
				}
			});

			cb(tags);
		});

	},


	pushToTagArray: function (array, val) {
		console.log(array.has(val));
		var exists = this.isInArray(array, val);

		//if the value doesn't exist in our array
		if (!exists) {
			tags.push(val);
		}
	},

	isInArray: function (array, value) {
		return array.indexOf(value) > -1;
	}

};

mongoose.model('Symbol', Symbol);
